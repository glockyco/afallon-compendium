import { mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { Assert, AssertError } from "typebox/value";
import type { Static, TSchema } from "typebox";
import {
  CaptureGeometrySchema,
  CapturePlanSchema,
  CaptureReadinessSchema,
  type CaptureGeometry,
  type CapturePlan,
  type CaptureReadiness,
} from "./capture-contracts";
import { toRuntimePath, type CompendiumConfig } from "./config";
import { ObservationContextSchema } from "./contracts";
import {
  StreamCleanupSchema,
  StreamVisitSchema,
} from "./traversal-contracts";
import type { Run } from "./runs";
import type { Runtime } from "./runtime";

type CaptureTile = CapturePlan["tiles"][number];
type StreamVisit = Static<typeof StreamVisitSchema>;
type StreamCleanup = Static<typeof StreamCleanupSchema>;

type SourceMembership = {
  required: CaptureGeometry["sources"];
  excluded: CaptureGeometry["sources"];
  requiredById: Map<number, CaptureGeometry["sources"][number]>;
  candidateIds: Set<number>;
};

function assertSchema<T extends TSchema>(schema: T, value: unknown, label: string): asserts value is Static<T> {
  try {
    Assert(schema, value);
  } catch (error) {
    if (error instanceof AssertError) {
      throw new TypeError(`${label} does not satisfy its contract: ${error.message}`, { cause: error.cause.errors });
    }
    throw error;
  }
}

function assertFiniteScalars(value: unknown, label: string, seen = new Set<object>()): void {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError(`${label} must contain only finite numbers.`);
    return;
  }
  if (value === null || typeof value !== "object") return;
  if (seen.has(value)) throw new TypeError(`${label} must not contain cycles.`);
  seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertFiniteScalars(item, `${label}[${index}]`, seen));
  } else {
    for (const [key, item] of Object.entries(value)) assertFiniteScalars(item, `${label}.${key}`, seen);
  }
  seen.delete(value);
}

function closeEnough(left: number, right: number): boolean {
  const scale = Math.max(1, Math.abs(left), Math.abs(right));
  return Math.abs(left - right) <= scale * 1e-5;
}

function assertObservationContext(
  value: unknown,
  config: CompendiumConfig,
  plan: CapturePlan,
  expectedSceneHandle: number | undefined,
  observedFrame: number | undefined,
  label: string,
): void {
  assertSchema(ObservationContextSchema, value, `${label} observation context`);
  const context = value as Static<typeof ObservationContextSchema>;
  if (context.started.researchCharacter !== config.character || context.completed.researchCharacter !== config.character
    || context.started.gameSceneNativeId !== plan.sceneNativeId || context.completed.gameSceneNativeId !== plan.sceneNativeId
    || context.started.scene.path !== plan.scenePath || context.completed.scene.path !== plan.scenePath
    || (expectedSceneHandle !== undefined && (context.started.scene.handle !== expectedSceneHandle || context.completed.scene.handle !== expectedSceneHandle))
    || context.completed.frame < context.started.frame
    || (observedFrame !== undefined && (observedFrame < context.started.frame || observedFrame > context.completed.frame))) {
    throw new Error(`${label} crossed a scene or character observation boundary.`);
  }
}

function assertClose(actual: number, expected: number, label: string): void {
  if (!closeEnough(actual, expected)) throw new Error(`${label} is ${actual}, expected ${expected}.`);
}

type CaptureFrame = CapturePlan["tiles"][number]["frame"];

function geometryDirectory(tile: CaptureTile, run: Run): { relative: string; absolute: string } {
  const relative = `tiles/${tile.id}.geometry`;
  return { relative, absolute: resolve(run.directory, relative) };
}

function expectedFrustum(frame: CaptureFrame, boundaryOverlap: number): CaptureGeometry["frustum"] {
  const depth = frame.farClip - frame.nearClip;
  return {
    center: {
      x: frame.center.x,
      y: frame.cameraY - (frame.nearClip + frame.farClip) / 2,
      z: frame.center.z,
    },
    size: {
      x: frame.worldSize.x + 2 * boundaryOverlap,
      y: depth,
      z: frame.worldSize.z + 2 * boundaryOverlap,
    },
  };
}

function expectedPreloadEnvelope(frustum: CaptureGeometry["frustum"]): CaptureGeometry["preloadEnvelope"] {
  const { x, y, z } = frustum.size;
  return {
    center: { ...frustum.center },
    radius: Math.sqrt(x * x + y * y + z * z) / 2,
  };
}

function assertGeometryShape(geometry: CaptureGeometry, frame: CaptureFrame, plan: CapturePlan): void {
  const expected = expectedFrustum(frame, plan.readiness.boundaryOverlap);
  assertClose(geometry.frustum.center.x, expected.center.x, "Geometry frustum center.x");
  assertClose(geometry.frustum.center.y, expected.center.y, "Geometry frustum center.y");
  assertClose(geometry.frustum.center.z, expected.center.z, "Geometry frustum center.z");
  assertClose(geometry.frustum.size.x, expected.size.x, "Geometry frustum size.x");
  assertClose(geometry.frustum.size.y, expected.size.y, "Geometry frustum size.y");
  assertClose(geometry.frustum.size.z, expected.size.z, "Geometry frustum size.z");
  const expectedEnvelope = expectedPreloadEnvelope(expected);
  assertClose(geometry.preloadEnvelope.center.x, expectedEnvelope.center.x, "Geometry preload envelope center.x");
  assertClose(geometry.preloadEnvelope.center.y, expectedEnvelope.center.y, "Geometry preload envelope center.y");
  assertClose(geometry.preloadEnvelope.center.z, expectedEnvelope.center.z, "Geometry preload envelope center.z");
  assertClose(geometry.preloadEnvelope.radius, expectedEnvelope.radius, "Geometry preload envelope radius");
}

function assertQueryCounts(geometry: CaptureGeometry): void {
  for (const [name, query] of Object.entries(geometry.queries)) {
    if (query.all !== query.scene + query.foreign) {
      throw new Error(`Geometry ${name} query counts do not reconcile.`);
    }
  }
  if (geometry.queries.loaders.scene !== geometry.sources.length) {
    throw new Error(`Geometry loader count ${geometry.queries.loaders.scene} does not match ${geometry.sources.length} source rows.`);
  }
}

function sourceMembership(geometry: CaptureGeometry): SourceMembership {
  const sourceIds = new Set<number>();
  for (const source of geometry.sources) {
    if (sourceIds.has(source.instanceId)) throw new Error(`Geometry inventory contains duplicate source ${source.instanceId}.`);
    sourceIds.add(source.instanceId);
    const hasRoot = source.rootId !== null;
    if (source.loaded !== hasRoot || (!source.loading && source.hasHandle !== hasRoot)) {
      throw new Error(`Source ${source.instanceId} has inconsistent root, loaded, or handle state.`);
    }
    if (source.rootActive === null ? hasRoot : !hasRoot) {
      throw new Error(`Source ${source.instanceId} has inconsistent root activity state.`);
    }
  }

  const boundSourceIds = new Set<number>();
  for (const bindings of [geometry.meshes, geometry.terrains, geometry.otherRenderers]) {
    for (const binding of bindings) {
      if (binding.sourceLoaderId !== null) boundSourceIds.add(binding.sourceLoaderId);
    }
  }
  const candidates = geometry.sources.filter(source => source.coversFrustum || source.intersectsFrustum || boundSourceIds.has(source.instanceId));
  const candidateIds = new Set<number>();
  for (const source of candidates) {
    if (source.assetGuid === null) throw new Error(`Required or excluded source ${source.instanceId} has no asset GUID.`);
    candidateIds.add(source.instanceId);
  }
  const required = candidates.filter(source => source.activeInHierarchy && source.enabled);
  const excluded = candidates.filter(source => !source.activeInHierarchy || !source.enabled);
  const requiredById = new Map(required.map(source => [source.instanceId, source]));
  return { required, excluded, requiredById, candidateIds };
}

function assertVisibleBindings(geometry: CaptureGeometry): void {
  const sources = new Map(geometry.sources.map(source => [source.instanceId, source]));
  const bindings: Array<{ sourceLoaderId: number | null; label: string }> = [];
  for (const mesh of geometry.meshes) bindings.push({ sourceLoaderId: mesh.sourceLoaderId, label: `mesh ${mesh.rendererId}` });
  for (const terrain of geometry.terrains) bindings.push({ sourceLoaderId: terrain.sourceLoaderId, label: `terrain ${terrain.instanceId}` });
  for (const renderer of geometry.otherRenderers) bindings.push({ sourceLoaderId: renderer.sourceLoaderId, label: `renderer ${renderer.instanceId}` });
  for (const binding of bindings) {
    if (binding.sourceLoaderId === null) continue;
    const source = sources.get(binding.sourceLoaderId);
    if (source === undefined) throw new Error(`Visible ${binding.label} references unknown source ${binding.sourceLoaderId}.`);
    if (!source.activeInHierarchy || !source.enabled) {
      throw new Error(`Visible ${binding.label} is attached to inactive or disabled source ${binding.sourceLoaderId}.`);
    }
    if (source.assetGuid === null) throw new Error(`Visible ${binding.label} is attached to source ${binding.sourceLoaderId} without an asset GUID.`);
  }
}

function assertScene(geometry: CaptureGeometry, plan: CapturePlan, sceneHandle: number | undefined): number {
  if (geometry.scene.nativeId !== plan.sceneNativeId || geometry.scene.path !== plan.scenePath) {
    throw new Error("Capture geometry observed a different scene.");
  }
  if (sceneHandle !== undefined && geometry.scene.handle !== sceneHandle) {
    throw new Error("Capture geometry observed a different scene instance.");
  }
  return geometry.scene.handle;
}

function sameRequiredMembership(left: Map<number, CaptureGeometry["sources"][number]>, right: Map<number, CaptureGeometry["sources"][number]>): boolean {
  if (left.size !== right.size) return false;
  for (const [id, source] of left) {
    const other = right.get(id);
    if (other === undefined || other.assetGuid !== source.assetGuid) return false;
  }
  return true;
}

function assertMembership(geometry: CaptureGeometry, baseline: SourceMembership | undefined, maximumSources: number): SourceMembership {
  const current = sourceMembership(geometry);
  if (current.required.length > maximumSources) {
    throw new Error(`Tile requires ${current.required.length} sources, exceeding the ${maximumSources}-source bound.`);
  }
  if (baseline !== undefined && !sameRequiredMembership(current.requiredById, baseline.requiredById)) {
    throw new Error("Capture geometry changed its required source membership.");
  }
  return current;
}

// An issue blocks readiness only when it means the inventory itself cannot be trusted:
// a loader in an inconsistent state, bounds that could not be read. A missing material or
// terrain data is a defect of the authored scene, which the game renders exactly as it is;
// it is recorded as evidence about the content and must never keep a tile waiting, since
// no number of frames will ever author the material in.
const INVENTORY_INTEGRITY_ISSUE_KINDS: ReadonlySet<string> = new Set(["source-integrity"]);

export function blockingIssues(geometry: CaptureGeometry): CaptureGeometry["issues"] {
  return geometry.issues.filter(issue => INVENTORY_INTEGRITY_ISSUE_KINDS.has(issue.kind));
}

function structuralFingerprint(geometry: CaptureGeometry, membership: SourceMembership): string {
  const sources = geometry.sources.filter(source => membership.candidateIds.has(source.instanceId))
    .sort((left, right) => left.instanceId - right.instanceId)
    .map(source => ({
      instanceId: source.instanceId,
      assetGuid: source.assetGuid,
      hierarchyPath: source.hierarchyPath,
      category: source.category,
      activeSelf: source.activeSelf,
      activeInHierarchy: source.activeInHierarchy,
      enabled: source.enabled,
      loadedOrLoading: source.loadedOrLoading,
      loaded: source.loaded,
      loading: source.loading,
      hasHandle: source.hasHandle,
      automaticLoadPending: source.automaticLoadPending,
      rootId: source.rootId,
      rootActive: source.rootActive,
      loadDistance: source.loadDistance,
    }));
  const meshes = [...geometry.meshes]
    .sort((left, right) => left.rendererId - right.rendererId)
    .map(mesh => ({
      rendererId: mesh.rendererId,
      kind: mesh.kind,
      meshId: mesh.meshId,
      meshName: mesh.meshName,
      vertices: mesh.vertices,
      sourceLoaderId: mesh.sourceLoaderId,
      materialIds: mesh.materialIds,
    }));
  const terrains = [...geometry.terrains]
    .sort((left, right) => left.instanceId - right.instanceId)
    .map(terrain => ({
      instanceId: terrain.instanceId,
      dataId: terrain.dataId,
      dataName: terrain.dataName,
      heightmapResolution: terrain.heightmapResolution,
      sourceLoaderId: terrain.sourceLoaderId,
    }));
  const otherRenderers = [...geometry.otherRenderers]
    .sort((left, right) => left.instanceId - right.instanceId)
    .map(renderer => ({ instanceId: renderer.instanceId, type: renderer.type, sourceLoaderId: renderer.sourceLoaderId }));
  const issues = [...geometry.issues]
    .sort((left, right) => `${left.kind}\u0000${left.sourceId}\u0000${left.detail}`.localeCompare(`${right.kind}\u0000${right.sourceId}\u0000${right.detail}`));
  return JSON.stringify({
    scene: geometry.scene,
    sources,
    meshes,
    terrains,
    otherRenderers,
    issues,
    empty: meshes.length === 0 && terrains.length === 0 && otherRenderers.length === 0,
  });
}

function isSourceReady(source: CaptureGeometry["sources"][number]): boolean {
  return source.activeInHierarchy && source.enabled && source.loaded && !source.loading && !source.automaticLoadPending
    && source.loadedOrLoading && source.hasHandle && source.rootId !== null && source.rootActive === true;
}

function streamRowsById(rowsValue: StreamVisit["rows"]): Map<number, StreamVisit["rows"][number]> {
  const rows = new Map<number, StreamVisit["rows"][number]>();
  for (const row of rowsValue) {
    if (rows.has(row.loaderInstanceId)) throw new Error(`Stream visit returned duplicate source ${row.loaderInstanceId}.`);
    rows.set(row.loaderInstanceId, row);
  }
  return rows;
}

function assertStreamRows(
  stream: StreamVisit,
  streamKey: string | undefined,
  sceneHandle: number,
  baseline: SourceMembership,
  initialRows?: Map<number, StreamVisit["rows"][number]>,
): Map<number, StreamVisit["rows"][number]> {
  assertSchema(StreamVisitSchema, stream, "Stream visit response");
  if (streamKey !== undefined && stream.key !== streamKey) throw new Error("Stream visit returned another key.");
  if (stream.sceneHandle !== sceneHandle) throw new Error("Stream visit returned another scene handle.");
  const rows = streamRowsById(stream.rows);
  if (rows.size !== baseline.required.length) throw new Error("Stream visit returned an unexpected source count.");
  for (const source of baseline.required) {
    const row = rows.get(source.instanceId);
    if (row === undefined) throw new Error(`Stream visit omitted required source ${source.instanceId}.`);
    if (row.assetGuid !== source.assetGuid || row.skippedReason !== null || !row.activeInHierarchy || !row.enabled) {
      throw new Error(`Stream visit returned inconsistent metadata for source ${source.instanceId}.`);
    }
    if (initialRows !== undefined) {
      const initial = initialRows.get(source.instanceId);
      if (initial === undefined || row.initiallyLoaded !== initial.initiallyLoaded || row.originalHoldUntil !== initial.originalHoldUntil) {
        throw new Error(`Stream visit changed initial state for source ${source.instanceId}.`);
      }
    }
  }
  return rows;
}

function geometryAgreesWithStream(geometry: CaptureGeometry, rows: Map<number, StreamVisit["rows"][number]>, required: CaptureGeometry["sources"]): boolean {
  const sources = new Map(geometry.sources.map(source => [source.instanceId, source]));
  for (const requiredSource of required) {
    const source = sources.get(requiredSource.instanceId);
    const row = rows.get(requiredSource.instanceId);
    if (source === undefined || row === undefined) throw new Error(`Geometry and stream observations lost source ${requiredSource.instanceId}.`);
    if (source.assetGuid !== row.assetGuid || source.rootId !== row.rootInstanceId || source.loaded !== row.loaded || source.loading !== row.loading || source.hasHandle !== row.hasHandle) {
      return false;
    }
  }
  return true;
}

function assertRestoredRows(
  rows: Map<number, StreamVisit["rows"][number]>,
  initialRows: Map<number, StreamVisit["rows"][number]>,
  required: CaptureGeometry["sources"],
): void {
  if (rows.size !== initialRows.size || rows.size !== required.length) throw new Error("Restored stream visit returned an unexpected source count.");
  for (const source of required) {
    const initial = initialRows.get(source.instanceId);
    const restored = rows.get(source.instanceId);
    if (initial === undefined || restored === undefined) throw new Error(`Restored stream visit omitted source ${source.instanceId}.`);
    if (restored.assetGuid !== initial.assetGuid || restored.initiallyLoaded !== initial.initiallyLoaded || restored.originalHoldUntil !== initial.originalHoldUntil) {
      throw new Error(`Restored stream visit changed source metadata for ${source.instanceId}.`);
    }
    if (restored.holdUntil !== restored.originalHoldUntil) throw new Error(`Restored stream visit did not restore the hold for source ${source.instanceId}.`);
    if (initial.initiallyLoaded) {
      if (!restored.loaded || restored.loading || !restored.hasHandle || restored.rootInstanceId !== initial.rootInstanceId) {
        throw new Error(`Restored stream visit changed initially loaded root ${source.instanceId}.`);
      }
    } else if (restored.loaded || restored.loading || restored.hasHandle || restored.rootInstanceId !== null) {
      throw new Error(`Restored stream visit retained a newly owned root or handle for source ${source.instanceId}.`);
    }
  }
}

function assertCleanupReceipt(receipt: StreamCleanup, streamKey: string, sceneHandle: number, finalRows: Map<number, StreamVisit["rows"][number]>): void {
  assertSchema(StreamCleanupSchema, receipt, "Stream cleanup receipt");
  if (receipt.key !== streamKey || receipt.ownerToken.length === 0 || receipt.sceneHandle !== sceneHandle) {
    throw new Error("Stream cleanup receipt has mismatched ownership or scene metadata.");
  }
  if (receipt.remainingOwnedRoots !== 0 || receipt.errors.length !== 0) throw new Error("Stream cleanup receipt does not confirm cleanup.");
  const rows = streamRowsById(receipt.rows);
  if (rows.size !== finalRows.size) throw new Error("Stream cleanup receipt has an unexpected source count.");
  for (const [id, finalRow] of finalRows) {
    const row = rows.get(id);
    if (row === undefined) throw new Error(`Stream cleanup receipt omitted source ${id}.`);
    if (row.assetGuid !== finalRow.assetGuid || row.initiallyLoaded !== finalRow.initiallyLoaded || row.rootInstanceId !== finalRow.rootInstanceId
      || row.loaded !== finalRow.loaded || row.loading !== finalRow.loading || row.hasHandle !== finalRow.hasHandle
      || row.holdUntil !== finalRow.holdUntil || row.originalHoldUntil !== finalRow.originalHoldUntil) {
      throw new Error(`Stream cleanup receipt disagrees with restored source ${id}.`);
    }
  }
}

function timeoutError(tile: CaptureTile, timeoutMs: number): Error {
  const error = new Error(`Capture tile "${tile.id}" exceeded its ${timeoutMs} ms deadline.`);
  error.name = "CaptureTileDeadlineError";
  return error;
}

// Raised after the first inventory when one readiness cannot cover the whole map, so the caller
// can fall back to per-tile readiness. The source bound is per observation, not per map.
export class TooManySourcesError extends Error {
  constructor(readonly sources: number, readonly bound: number) { super(`${sources} required sources exceed the ${bound}-source bound for one readiness.`); }
}

export type ReadinessSubject = { tile: CaptureTile; frame: CaptureFrame; kind: "tile" | "extent" };

export async function withCaptureGeometry<T>(
  runtime: Runtime,
  config: CompendiumConfig,
  run: Run,
  plan: CapturePlan,
  subject: ReadinessSubject,
  cutEvidence: CaptureReadiness["cut"],
  capture: (readiness: CaptureReadiness) => Promise<T>,
  options: { singleObservation?: boolean } = {},
): Promise<{ value: T; readiness: CaptureReadiness; readinessPath: string }> {
  let timer: NodeJS.Timeout | undefined;
  const tile = subject.tile;
  try {
    assertSchema(CapturePlanSchema, plan, "Capture plan");
    if (subject.kind === "tile") {
      const plannedTile = plan.tiles.find(candidate => candidate.id === tile.id);
      if (plannedTile === undefined || !isDeepStrictEqual(plannedTile, tile)) throw new Error(`Tile "${tile.id}" is not part of the capture plan.`);
    }
    assertFiniteScalars(plan, "Capture plan");

    const geometry = geometryDirectory(tile, run);
    const cleanupRelative = `${geometry.relative}/stream-cleanup.json`;
    const cleanupPath = resolve(run.directory, cleanupRelative);
    const probePath = resolve(import.meta.dir, "probes/capture-geometry.csx");
    const deadlineAt = Date.now() + plan.readiness.timeoutMs;
    const captureFrame = subject.frame;

    const operation = async (): Promise<{ value: T; readiness: CaptureReadiness; readinessPath: string }> => {
      await mkdir(geometry.absolute, { recursive: true });
      const cleanupRuntimePath = await toRuntimePath(config, cleanupPath);
      const observedFrames: number[] = [];
      let observationIndex = 0;
      let lastGeometryFrame = -1;
      let sceneHandle: number | undefined;
      let baselineMembership: SourceMembership | undefined;
      let latestGeometry: CaptureGeometry | undefined;
      let latestInventoryRelative = "";
      let latestInventorySha256 = "";

      const checkDeadline = (): void => {
        runtime.signal.throwIfAborted();
        if (Date.now() >= deadlineAt) {
          const error = timeoutError(tile, plan.readiness.timeoutMs);
          runtime.cancel(error);
          throw runtime.signal.aborted ? runtime.signal.reason : error;
        }
      };

      const registerProbeArtifact = async (relativePath: string, reference: { sha256: string }, context: unknown): Promise<void> => {
        if (!/^[a-f0-9]{64}$/.test(reference.sha256)) throw new Error(`Probe returned an invalid artifact hash for ${relativePath}.`);
        const record = await run.addArtifact(relativePath);
        if (record.sha256 !== reference.sha256) throw new Error(`Artifact changed before registration: ${relativePath}.`);
        if (record.path !== relativePath) throw new Error(`Artifact path changed before registration: ${relativePath}.`);
        const contextPath = `${relativePath.slice(0, -5)}.context.json`;
        await Bun.write(resolve(run.directory, contextPath), `${JSON.stringify(context, null, 2)}\n`);
        await run.addArtifact(contextPath);
      };

      const trackedRendererIds = new Set<number>();
      const observeGeometry = async (): Promise<CaptureGeometry> => {
        checkDeadline();
        observationIndex += 1;
        const relativePath = `${geometry.relative}/inventory-${String(observationIndex).padStart(4, "0")}.json`;
        const absolutePath = resolve(run.directory, relativePath);
        const reply = await runtime.probe(probePath, absolutePath, {
          preludeFile: resolve(import.meta.dir, "probes/capture-visuals.csx"),
          parameters: {
            researchCharacter: config.character,
            sceneNativeId: plan.sceneNativeId,
            scenePath: plan.scenePath,
            frame: captureFrame,
            boundaryOverlap: plan.readiness.boundaryOverlap,
            cullingMask: plan.cullingMask,
            suppression: plan.suppression,
            trackedRendererIds: [...trackedRendererIds],
          },
          captureContext: true,
        });
        assertSchema(CaptureGeometrySchema, reply.value, `Capture geometry observation ${observationIndex}`);
        const value = reply.value as CaptureGeometry;
        assertFiniteScalars(value, `Capture geometry observation ${observationIndex}`);
        assertObservationContext(reply.observationContext, config, plan, value.scene.handle, value.frame, `Capture geometry observation ${observationIndex}`);
        await registerProbeArtifact(relativePath, reply.reference, reply.observationContext);
        assertGeometryShape(value, captureFrame, plan);
        assertQueryCounts(value);
        assertVisibleBindings(value);
        sceneHandle = assertScene(value, plan, sceneHandle);
        const membership = assertMembership(value, baselineMembership, options.singleObservation === true ? Number.POSITIVE_INFINITY : plan.readiness.maximumSources);
        baselineMembership ??= membership;
        for (const mesh of value.meshes) trackedRendererIds.add(mesh.rendererId);
        for (const renderer of value.otherRenderers) trackedRendererIds.add(renderer.instanceId);
        if (value.frame < lastGeometryFrame) throw new Error("Capture geometry frame moved backwards.");
        if (value.frame > lastGeometryFrame) {
          observedFrames.push(value.frame);
          lastGeometryFrame = value.frame;
        }
        latestGeometry = value;
        latestInventoryRelative = relativePath;
        latestInventorySha256 = reply.reference.sha256;
        return value;
      };

      const sleepForFrame = async (): Promise<void> => {
        checkDeadline();
        await Bun.sleep(250);
        checkDeadline();
      };

      const firstGeometry = await observeGeometry();
      const initialRequired = baselineMembership!.required;
      // One readiness holds the sources of the whole map for the whole batch. Only a map whose
      // required sources exceed the bound for one observation needs per-tile readiness.
      if (options.singleObservation === true && initialRequired.length > plan.readiness.maximumSources) {
        throw new TooManySourcesError(initialRequired.length, plan.readiness.maximumSources);
      }
      let streamKey: string | undefined;
      let streamStartRows: Map<number, StreamVisit["rows"][number]> | undefined;
      let streamRows: Map<number, StreamVisit["rows"][number]> | undefined;
      let streamPollIndex = 0;
      let streamRestoreIndex = 0;

      const registerStream = async (relativePath: string, absolutePath: string, action: "start" | "poll" | "restore", key?: string): Promise<StreamVisit> => {
        checkDeadline();
        const reply = await runtime.probe(resolve(import.meta.dir, "probes/stream-visit.csx"), absolutePath, {
          parameters: action === "start"
            ? {
                action,
                researchCharacter: config.character,
                sceneHandle: sceneHandle!,
                loaderInstanceIds: initialRequired.map(source => source.instanceId),
                holdSeconds: Math.ceil(plan.readiness.timeoutMs / 1000) + 5,
                cleanupPath: cleanupRuntimePath,
              }
            : { action, researchCharacter: config.character, sceneHandle: sceneHandle!, key },
          captureContext: true,
        });
        assertSchema(StreamVisitSchema, reply.value, `Stream visit ${action} response`);
        const value = reply.value as StreamVisit;
        assertObservationContext(reply.observationContext, config, plan, sceneHandle, value.frame, `Stream visit ${action} response`);
        await registerProbeArtifact(relativePath, reply.reference, reply.observationContext);
        return value;
      };

      // The stream visit loads and holds every required source for as long as this readiness
      // lives, which spans the whole batch the caller renders under it.
      if (initialRequired.length > 0) {
        let preStreamGeometry = firstGeometry;
        while (true) {
          const membership = baselineMembership!;
          const readyToStart = preStreamGeometry.scene.ready && membership.required.every(source => {
            const current = preStreamGeometry.sources.find(candidate => candidate.instanceId === source.instanceId);
            return current !== undefined && !current.loading && !current.automaticLoadPending && current.loaded === (current.rootId !== null) && current.hasHandle === (current.rootId !== null);
          });
          if (readyToStart) break;
          await sleepForFrame();
          preStreamGeometry = await observeGeometry();
        }
        const startRelative = `${geometry.relative}/stream-start.json`;
        const start = await registerStream(startRelative, resolve(run.directory, startRelative), "start");
        if (start.phase === "restored") throw new Error("Stream visit restored itself before capture readiness.");
        streamKey = start.key;
        streamStartRows = assertStreamRows(start, streamKey, sceneHandle!, baselineMembership!);
        for (const source of baselineMembership!.required) {
          const row = streamStartRows.get(source.instanceId)!;
          const current = preStreamGeometry.sources.find(candidate => candidate.instanceId === source.instanceId)!;
          if (row.initiallyLoaded !== current.loaded || (row.initiallyLoaded && row.rootInstanceId !== current.rootId)) {
            throw new Error(`Stream visit start changed source ${source.instanceId} before it could be owned.`);
          }
        }
      }

      let stableFingerprint: string | undefined;
      let stableCount = 0;
      let stableGeometry: CaptureGeometry | undefined;
      if (streamKey === undefined) {
        stableFingerprint = structuralFingerprint(firstGeometry, baselineMembership!);
        stableCount = 1;
        stableGeometry = firstGeometry;
      }

      while (true) {
        checkDeadline();
        if (streamKey !== undefined) {
          streamPollIndex += 1;
          const pollRelative = `${geometry.relative}/stream-poll-${String(streamPollIndex).padStart(4, "0")}.json`;
          const poll = await registerStream(pollRelative, resolve(run.directory, pollRelative), "poll", streamKey);
          streamRows = assertStreamRows(poll, streamKey, sceneHandle!, baselineMembership!, streamStartRows);
          if (poll.phase === "restored") throw new Error("Stream visit restored before capture readiness completed.");
        }
        const current = await observeGeometry();
        const streamAgrees = streamRows === undefined || geometryAgreesWithStream(current, streamRows, baselineMembership!.required);
        if (current.frame > (stableGeometry?.frame ?? -1)) {
          const fingerprint = structuralFingerprint(current, baselineMembership!);
          if (fingerprint === stableFingerprint) stableCount += 1;
          else {
            stableFingerprint = fingerprint;
            stableCount = 1;
          }
          stableGeometry = current;
        }
        const sourceReady = baselineMembership!.required.every(source => {
          const currentSource = current.sources.find(candidate => candidate.instanceId === source.instanceId);
          return currentSource !== undefined && isSourceReady(currentSource);
        });
        const streamReady = streamKey === undefined || (streamRows !== undefined && [...streamRows.values()].every(row => row.loaded && !row.loading && row.hasHandle && row.rootInstanceId !== null));
        if (stableCount >= plan.readiness.stableFrames && current.scene.ready && blockingIssues(current).length === 0 && sourceReady && streamReady && streamAgrees) {
          latestGeometry = current;
          break;
        }
        await sleepForFrame();
      }

      if (latestGeometry === undefined || baselineMembership === undefined || stableGeometry === undefined || stableCount < plan.readiness.stableFrames) {
        throw new Error(`Capture geometry for tile "${tile.id}" did not become ready.`);
      }
      if (!latestGeometry.scene.ready || blockingIssues(latestGeometry).length !== 0) {
        throw new Error(`Capture geometry for tile "${tile.id}" did not become ready.`);
      }
      const finalSourceReady = baselineMembership.required.every(source => {
        const current = latestGeometry!.sources.find(candidate => candidate.instanceId === source.instanceId);
        return current !== undefined && isSourceReady(current);
      });
      if (!finalSourceReady) throw new Error(`Capture geometry for tile "${tile.id}" has an unready required source.`);
      if (streamKey !== undefined && streamRows === undefined) throw new Error("Capture readiness completed without a stream response.");

      const restoreStream = async (): Promise<void> => {
        if (streamKey === undefined) return;
        while (true) {
          checkDeadline();
          streamRestoreIndex += 1;
          const restoreRelative = `${geometry.relative}/stream-restore-${String(streamRestoreIndex).padStart(4, "0")}.json`;
          const restored = await registerStream(restoreRelative, resolve(run.directory, restoreRelative), "restore", streamKey);
          streamRows = assertStreamRows(restored, streamKey, sceneHandle!, baselineMembership!, streamStartRows);
          if (restored.phase === "restored") break;
          await sleepForFrame();
        }
        assertRestoredRows(streamRows!, streamStartRows!, baselineMembership!.required);
        let cleanupValue: unknown;
        while (true) {
          checkDeadline();
          try {
            cleanupValue = JSON.parse(await readFile(cleanupPath, "utf8"));
            break;
          } catch (error) {
            if (error !== null && typeof error === "object" && "code" in error && error.code === "ENOENT") {
              await Bun.sleep(25);
              continue;
            }
            throw error;
          }
        }
        assertSchema(StreamCleanupSchema, cleanupValue, "Stream cleanup receipt");
        if ((cleanupValue as StreamCleanup).ownerToken !== runtime.ownerToken) throw new Error("Stream cleanup receipt belongs to another runtime owner.");
        assertCleanupReceipt(cleanupValue as StreamCleanup, streamKey, sceneHandle!, streamRows!);
        await run.addArtifact(cleanupRelative);
      };

      const cut = cutEvidence;
      const empty = latestGeometry.meshes.length === 0 && latestGeometry.terrains.length === 0 && latestGeometry.otherRenderers.length === 0;
      const readiness: CaptureReadiness = {
        schemaVersion: "compendium.capture-readiness.v3",
        tileId: tile.id,
        ownerToken: runtime.ownerToken,
        sceneNativeId: plan.sceneNativeId,
        sceneHandle: sceneHandle!,
        inventoryPath: latestInventoryRelative,
        inventorySha256: latestInventorySha256,
        observedFrames: observedFrames.slice(-plan.readiness.stableFrames),
        stableFrames: plan.readiness.stableFrames,
        requiredSources: baselineMembership.required.length,
        excludedSources: baselineMembership.excluded.length,
        empty,
        captureFrame,
        cut,
        streamKey: streamKey ?? null,
      };
      assertSchema(CaptureReadinessSchema, readiness, "Capture readiness evidence");
      const readinessRelative = `${geometry.relative}/readiness.json`;
      const readinessPath = resolve(run.directory, readinessRelative);
      await Bun.write(readinessPath, `${JSON.stringify(readiness, null, 2)}\n`);
      await run.addArtifact(readinessRelative);
      checkDeadline();

      let value!: T;
      try {
        value = await capture(readiness);
        checkDeadline();
      } finally {
        await restoreStream();
      }

      runtime.signal.throwIfAborted();
      return { value, readiness, readinessPath: readinessRelative };
    };

    const timedOut = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        const error = timeoutError(tile, plan.readiness.timeoutMs);
        runtime.cancel(error);
        reject(error);
      }, plan.readiness.timeoutMs);
    });
    const result = await Promise.race([operation(), timedOut]);
    runtime.signal.throwIfAborted();
    return result;
  } catch (error) {
    // A non-resident answer is a decision for the caller, not a runtime failure: no stream
    // visit started and no state changed, so the session stays usable for per-tile readiness.
    if (error instanceof TooManySourcesError && !runtime.signal.aborted) throw error;
    const reason = runtime.signal.aborted ? runtime.signal.reason : error;
    if (!runtime.signal.aborted) runtime.cancel(reason);
    throw runtime.signal.aborted ? runtime.signal.reason : reason;
  } finally {
    clearTimeout(timer);
  }
}
