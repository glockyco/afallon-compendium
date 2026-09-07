import { createHash } from "node:crypto";
import { mkdir, readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { Assert, AssertError } from "typebox/value";
import type { Static, TSchema } from "typebox";
import { isDeepStrictEqual } from "node:util";
import { buildIdentity, hashFile, toolRevision } from "./build";
import { toRuntimePath, type CompendiumConfig } from "./config";
import {
  CaptureCleanupSchema,
  CapturePlanSchema,
  CaptureRasterSchema,
  type CaptureRaster,
  CaptureReadinessSchema,
  CaptureRestorationSchema,
  CaptureSessionSchema,
  CaptureSetSchema,
  CaptureTileCheckpointSchema,
  type CapturePlan,
  type CaptureReadiness,
  type CaptureSession,
  type CaptureSet,
  type CaptureTileCheckpoint,
} from "./capture-contracts";
import { ObservationContextSchema } from "./contracts";
import { collectSceneCatalog } from "./map-calibration";
import { compileMapSpaces } from "./map-spaces";
import { beginRun, type ArtifactRecord, type Run } from "./runs";
import type { Runtime } from "./runtime";
import { loadSpatialProfile } from "./spatial-extraction";
import type { MapSpaceProfile } from "./spatial-contracts";
import { WorldInventorySchema, type WorldInventory } from "./world-inventory";
import { withCaptureGeometry } from "./capture-readiness";
import {
  captureArtifactReference,
  copyReusableTile,
  findReusableTiles,
  readCaptureArtifactJson,
  tileCompatibilityKey,
  type ReusableCaptureTile,
} from "./capture-cache";
import { SceneVisitSchema, type SceneVisit } from "./traversal-contracts";

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
    if (!Number.isFinite(value)) throw new TypeError(`${label} must be finite.`);
    return;
  }
  if (value === null || typeof value !== "object") return;
  if (seen.has(value)) throw new TypeError(`${label} must not contain a cycle.`);
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
  return Math.abs(left - right) <= scale * 1e-6;
}

function validatePlan(plan: CapturePlan): void {
  assertSchema(CapturePlanSchema, plan, "Capture plan");
  assertFiniteScalars(plan, "Capture plan");

  const tileIds = new Set<string>();
  for (const tile of plan.tiles) {
    if (tileIds.has(tile.id)) throw new Error(`Capture plan repeats tile ID "${tile.id}".`);
    tileIds.add(tile.id);
    if (!(tile.frame.nearClip < tile.frame.farClip)) {
      throw new Error(`Tile "${tile.id}" nearClip must be less than farClip.`);
    }
    if (plan.floorId !== null) {
      const first = plan.tiles[0]!.frame;
      if (Math.abs((tile.frame.cameraY - tile.frame.farClip) - (first.cameraY - first.farClip)) > 0.001
        || Math.abs((tile.frame.cameraY - tile.frame.nearClip) - (first.cameraY - first.nearClip)) > 0.001) {
        throw new Error(`Floor tile "${tile.id}" uses another vertical clipping interval.`);
      }
    }
    if (tile.ceilingReview !== null) {
      for (const selectors of [tile.ceilingReview.ceilings, tile.ceilingReview.floors]) for (const selector of selectors) {
        if (selector.bounds.size.x < 0 || selector.bounds.size.y < 0 || selector.bounds.size.z < 0) throw new Error(`Tile "${tile.id}" has negative reviewed renderer sizes.`);
      }
    }
    const worldAspect = tile.frame.worldSize.x / tile.frame.worldSize.z;
    const pixelAspect = plan.width / plan.height;
    if (!closeEnough(worldAspect, pixelAspect)) {
      throw new Error(`Tile "${tile.id}" world and pixel aspect ratios do not match.`);
    }
  }
}

function assertFrameMatches(actual: CaptureSession["lastCapture"], expected: CapturePlan["tiles"][number]["frame"], tileId: string): void {
  if (actual === null || typeof actual !== "object") throw new Error(`Capture response for tile "${tileId}" has no capture metadata.`);
  const frame = actual.cameraFrame;
  if (!closeEnough(frame.center.x, expected.center.x) || !closeEnough(frame.center.z, expected.center.z)
    || !closeEnough(frame.worldSize.x, expected.worldSize.x) || !closeEnough(frame.worldSize.z, expected.worldSize.z)
    || !closeEnough(frame.cameraY, expected.cameraY) || !closeEnough(frame.nearClip, expected.nearClip)
    || !closeEnough(frame.farClip, expected.farClip)) {
    throw new Error(`Capture response for tile "${tileId}" has mismatched camera metadata.`);
  }
}

function assertSession(
  session: CaptureSession,
  runtime: Runtime,
  key: string,
  sceneNativeId: number,
  scenePath: string,
  sceneHandle: number | undefined,
  phase: "ready" | "restored",
): void {
  assertSchema(CaptureSessionSchema, session, "Capture session response");
  if (session.ownerToken !== runtime.ownerToken) throw new Error("Capture response belongs to another runtime owner.");
  if (session.key !== key) throw new Error("Capture response belongs to another capture session.");
  if (session.sceneNativeId !== sceneNativeId || session.scenePath !== scenePath) throw new Error("Capture response has mismatched scene identity.");
  if (session.phase !== phase) throw new Error(`Capture session is ${session.phase}, expected ${phase}.`);
  if (sceneHandle !== undefined && session.sceneHandle !== sceneHandle) throw new Error("Capture response belongs to another scene instance.");
}

async function registerArtifact(run: Run, path: string, expectedHash?: string): Promise<ArtifactRecord> {
  const artifact = await run.addArtifact(path);
  if (expectedHash !== undefined && artifact.sha256 !== expectedHash) {
    throw new Error(`Artifact changed before registration: ${path}.`);
  }
  return artifact;
}

async function registerProbeArtifact(
  run: Run,
  path: string,
  reference: { sha256: string },
): Promise<ArtifactRecord> {
  return registerArtifact(run, path, reference.sha256);
}

async function writeTileCheckpoint(run: Run, checkpoint: CaptureTileCheckpoint): Promise<void> {
  assertSchema(CaptureTileCheckpointSchema, checkpoint, `Capture checkpoint for tile "${checkpoint.tileId}"`);
  const path = `tiles/${checkpoint.tileId}.checkpoint.json`;
  await Bun.write(resolve(run.directory, path), `${JSON.stringify(checkpoint, null, 2)}\n`);
  await registerArtifact(run, path);
}

async function writeCaptureSet(run: Run, plan: CapturePlan, buildId: string, checkpoints: Map<string, CaptureTileCheckpoint>, reused: Set<string>): Promise<CaptureSet> {
  const set: CaptureSet = {
    schemaVersion: "compendium.capture-set.v1",
    buildId,
    sceneNativeId: plan.sceneNativeId,
    scenePath: plan.scenePath,
    mapSpaceId: plan.mapSpaceId,
    floorId: plan.floorId,
    width: plan.width,
    height: plan.height,
    expectedTiles: plan.tiles.map(tile => tile.id),
    tiles: plan.tiles.map(tile => {
      const checkpoint = checkpoints.get(tile.id);
      if (checkpoint === undefined) throw new Error(`Capture set is missing tile checkpoint ${tile.id}.`);
      return { id: tile.id, compatibilityKey: checkpoint.compatibilityKey, status: reused.has(tile.id) ? ("reused" as const) : ("captured" as const), artifacts: checkpoint.artifacts, origin: checkpoint.origin };
    }),
    completeImagery: false,
  };
  assertSchema(CaptureSetSchema, set, "Capture set");
  await Bun.write(resolve(run.directory, "capture-set.json"), `${JSON.stringify(set, null, 2)}\n`);
  await registerArtifact(run, "capture-set.json");
  return set;
}

function pngDimensions(bytes: Uint8Array, path: string): { width: number; height: number } {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (bytes.length < 24 || signature.some((value, index) => bytes[index] !== value)) {
    throw new Error(`Capture output is not a PNG: ${path}.`);
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(8) !== 13 || String.fromCharCode(...bytes.slice(12, 16)) !== "IHDR") {
    throw new Error(`Capture output has no PNG IHDR: ${path}.`);
  }
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

function assertRestorationAudit(value: unknown, tile: CapturePlan["tiles"][number], key: string, captureFrame: number, lighting: CapturePlan["lighting"]): void {
  assertSchema(CaptureRestorationSchema, value, `Restoration audit for tile "${tile.id}"`);
  const audit = value;
  if (audit.key !== key || audit.tileId !== tile.id) throw new Error(`Restoration audit for tile "${tile.id}" has mismatched session metadata.`);
  if (audit.frameStarted !== audit.frameRestored || audit.frameStarted !== captureFrame) throw new Error(`Restoration audit for tile "${tile.id}" crossed native frames.`);
  if (!audit.renderSucceeded || audit.errors.length !== 0) throw new Error(`Frame restoration failed for tile "${tile.id}".`);
  if (!isDeepStrictEqual(audit.before, audit.after)) throw new Error(`Frame restoration changed visual state for tile "${tile.id}".`);
  if (!isDeepStrictEqual(audit.ceilingReview, tile.ceilingReview)) throw new Error("Capture applied another ceiling review.");
  const ceilingIds = new Set(audit.ceilingRendererIds);
  if (ceilingIds.size !== audit.ceilingRendererIds.length || ceilingIds.size !== (tile.ceilingReview?.ceilings.length ?? 0)) throw new Error("Capture did not resolve each reviewed ceiling once.");
  const during = audit.during;
  if (during === null || during.fog || during.ambientMode !== 3 || during.ambientIntensity !== 1 || during.reflectionIntensity !== 0 || !during.lightEnabled || during.sunInstanceId !== during.lightInstanceId || !closeEnough(during.lightIntensity, lighting.directionalIntensity)) {
    throw new Error("Capture did not apply its controlled lighting profile.");
  }
  for (const channel of ["r", "g", "b"] as const) {
    for (const field of ["ambientLight", "ambientSky", "ambientEquator", "ambientGround", "lightColor"] as const) {
      if (!closeEnough(during[field][channel], lighting.ambient[channel])) throw new Error("Capture lighting colors differ from the requested profile.");
    }
  }
  const channels = [lighting.ambient.r, lighting.ambient.g, lighting.ambient.b].map(value => {
    if (audit.colorSpace === "Gamma") return value;
    if (value <= 0.04045) return value / 12.92;
    return value < 1 ? ((value + 0.055) / 1.055) ** 2.4 : value ** 2.2;
  });
  for (let index = 0; index < 27; index++) {
    const expected = index % 9 === 0 ? channels[index / 9]! : 0;
    if (!closeEnough(during.ambientProbe[index]!, expected)) throw new Error("Capture ambient coefficients differ from the normalized profile.");
  }
  for (const field of ["renderers", "lights", "projectors"] as const) {
    if (during[field].some(row => row.enabled) || !isDeepStrictEqual(audit.before[field].map(row => row.instanceId), during[field].map(row => row.instanceId))) {
      throw new Error(`Capture did not suppress its selected ${field}.`);
    }
  }
  if (during.highlights.some(row => row.cameraMask !== 0) || !isDeepStrictEqual(audit.before.highlights.map(row => row.instanceId), during.highlights.map(row => row.instanceId))) throw new Error("Capture did not exclude its selected camera highlights.");
  if (!isDeepStrictEqual(audit.before.retainedParticles, during.retainedParticles)) throw new Error("Capture changed retained landmark particles.");
  const selectedLights = new Set(during.lights.map(row => row.instanceId));
  if (audit.lightingInputs.some(row => row.enabled && row.active && !selectedLights.has(row.instanceId))) throw new Error("Capture left an active game light uncontrolled.");
  const selectedRenderers = new Set(during.renderers.map(row => row.instanceId));
  if (audit.ceilingRendererIds.some(id => !selectedRenderers.has(id))) throw new Error("Capture omitted a reviewed ceiling suppression.");
  const reviewedSelections = audit.selections.filter(row => row.kind === "renderer" && row.reason === "reviewed-ceiling");
  if (reviewedSelections.length !== ceilingIds.size || new Set(reviewedSelections.map(row => row.instanceId)).size !== ceilingIds.size || reviewedSelections.some(row => !ceilingIds.has(row.instanceId))) throw new Error("Capture ceiling selections differ from its resolution.");
  if (!isDeepStrictEqual(audit.before.retainedFloors, during.retainedFloors)
    || during.retainedFloors.length !== (tile.ceilingReview?.floors.length ?? 0)
    || new Set(during.retainedFloors.map(row => row.instanceId)).size !== during.retainedFloors.length
    || during.retainedFloors.some(row => !row.enabled || selectedRenderers.has(row.instanceId))) {
    throw new Error("Capture changed or omitted a retained floor renderer.");
  }
}

async function hashPng(path: string, expectedWidth: number, expectedHeight: number, tileId: string): Promise<{ sha256: string; byteSize: number }> {
  const bytes = await Bun.file(path).bytes();
  const dimensions = pngDimensions(bytes, path);
  if (dimensions.width !== expectedWidth || dimensions.height !== expectedHeight) {
    throw new Error(`Capture output for tile "${tileId}" has dimensions ${dimensions.width}x${dimensions.height}, expected ${expectedWidth}x${expectedHeight}.`);
  }
  const file = await stat(path);
  if (!file.isFile() || file.size !== bytes.byteLength || file.size <= 0) throw new Error(`Capture output for tile "${tileId}" is not a stable file.`);
  return { sha256: createHash("sha256").update(bytes).digest("hex"), byteSize: bytes.byteLength };
}

function registerRaster(capture: NonNullable<CaptureSession["lastCapture"]>): CaptureRaster {
  const { center, worldSize, nearClip, farClip } = capture.cameraFrame;
  const origin = { x: center.x - worldSize.x / 2, z: center.z + worldSize.z / 2 };
  const xAxis = { x: worldSize.x / capture.width, z: 0 };
  const yAxis = { x: 0, z: -worldSize.z / capture.height };
  const expected = [[0.5, 0.5], [0, 0], [1, 0], [0, 1], [1, 1]] as const;
  if (capture.projectionSamples.length !== expected.length) throw new Error("Capture requires center and four corner projection controls.");
  let maximumProjectionErrorPixels = 0;
  for (const [index, sample] of capture.projectionSamples.entries()) {
    const [u, v] = expected[index]!;
    const imageX = (sample.world.x - origin.x) / xAxis.x;
    const imageY = (sample.world.z - origin.z) / yAxis.z;
    const error = Math.max(
      Math.abs(imageX - u * capture.width), Math.abs(imageY - (1 - v) * capture.height),
      Math.abs(imageX - sample.viewport.x * capture.width), Math.abs(imageY - (1 - sample.viewport.y) * capture.height),
    );
    if (!Number.isFinite(error) || error > 0.25 || sample.viewport.z < nearClip || sample.viewport.z > farClip) {
      throw new Error(`Capture projection control ${index} exceeds the raster bounds, clipping interval, or quarter-pixel tolerance.`);
    }
    maximumProjectionErrorPixels = Math.max(maximumProjectionErrorPixels, error);
  }
  const raster: CaptureRaster = {
    schemaVersion: "compendium.capture-raster.v2", tileId: capture.tileId, imageSha256: capture.sha256,
    verticalBounds: { minY: capture.cameraFrame.cameraY - farClip, maxY: capture.cameraFrame.cameraY - nearClip },
    width: capture.width, height: capture.height, coordinateSystem: "source-scene-world-xz", pixelConvention: "top-left-edges",
    worldFromPixelEdge: { origin, xAxis, yAxis }, maximumProjectionErrorPixels,
  };
  assertSchema(CaptureRasterSchema, raster, "Capture raster registration");
  return raster;
}

type CaptureTileResult = NonNullable<CaptureSession["lastCapture"]> & {
  readiness: CaptureReadiness;
  readinessPath: string;
  rasterPath: string;
  reused: boolean;
  nativeObserved: boolean;
  compatibilityKey: string;
  origin: CaptureTileCheckpoint["origin"];
};

async function loadReusedTileResult(run: Run, tile: CapturePlan["tiles"][number], candidate: ReusableCaptureTile, copied: CaptureTileCheckpoint, plan: CapturePlan, config: CompendiumConfig): Promise<CaptureTileResult> {
  const responseReference = copied.artifacts.nativeContext.find(reference =>
    reference.path === `tiles/${tile.id}.json` || reference.path === `tiles/${tile.id}.geometry/origin-${tile.id}.json`,
  );
  if (responseReference === undefined) throw new Error(`Reused tile "${tile.id}" has no copied native response.`);
  const response = await readCaptureArtifactJson(run.directory, responseReference);
  assertSchema(CaptureSessionSchema, response, `Reused capture response for tile "${tile.id}"`);
  const session = response as CaptureSession;
  if (session.lastCapture === null) throw new Error(`Reused tile "${tile.id}" has no capture metadata.`);
  const readiness = await readCaptureArtifactJson(run.directory, copied.artifacts.readiness);
  assertSchema(CaptureReadinessSchema, readiness, `Reused readiness for tile "${tile.id}"`);
  const capture = session.lastCapture;
  if (capture.tileId !== tile.id || capture.width !== plan.width || capture.height !== plan.height || capture.path.length === 0 || capture.frame !== capture.restoredFrame) throw new Error(`Reused tile "${tile.id}" has mismatched capture metadata.`);
  assertFrameMatches(capture, tile.frame, tile.id);
  const raster = await readCaptureArtifactJson(run.directory, copied.artifacts.raster);
  if (!isDeepStrictEqual(raster, registerRaster(capture))) throw new Error("Reused raster disagrees with its native camera controls.");
  assertRestorationAudit(await readCaptureArtifactJson(run.directory, copied.artifacts.restoration), tile, copied.origin.captureKey, capture.frame, plan.lighting);
  const imagePath = resolve(run.directory, copied.artifacts.image.path);
  const image = await hashPng(imagePath, plan.width, plan.height, tile.id);
  if (image.sha256 !== capture.sha256 || image.byteSize !== capture.byteSize) throw new Error("Reused image disagrees with its native response.");
  return {
    ...capture,
    path: await toRuntimePath(config, imagePath),
    readiness: readiness as CaptureReadiness,
    readinessPath: copied.artifacts.readiness.path,
    rasterPath: copied.artifacts.raster.path,
    reused: true,
    nativeObserved: false,
    compatibilityKey: candidate.checkpoint.compatibilityKey,
    origin: copied.origin,
  };
}

function hasSelectedBinding(profile: MapSpaceProfile, plan: CapturePlan): boolean {
  const mapSpace = profile.mapSpaces.find(candidate => candidate.id === plan.mapSpaceId);
  if (mapSpace === undefined) throw new Error(`Capture plan requests unknown map space "${plan.mapSpaceId}".`);
  if (plan.floorId === null) {
    if (mapSpace.floors.length !== 0) throw new Error(`Capture plan must select a floor in map space "${plan.mapSpaceId}".`);
  } else if (!mapSpace.floors.some(floor => floor.id === plan.floorId)) {
    throw new Error(`Capture plan requests unknown floor "${plan.floorId}" in map space "${plan.mapSpaceId}".`);
  }
  return profile.bindings.some(binding => {
    if (binding.sceneNativeId !== plan.sceneNativeId || binding.scenePath !== plan.scenePath || binding.mapSpaceId !== plan.mapSpaceId) return false;
    if (plan.floorId === null) return binding.floorDomains.length === 0;
    return binding.floorDomains.some(domain => domain.floorId === plan.floorId);
  });
}

export async function capture(
  runtime: Runtime,
  config: CompendiumConfig,
  identity: Awaited<ReturnType<typeof buildIdentity>>,
  plan: CapturePlan,
) {
  validatePlan(plan);
  if (config.mapSpaceProfile === undefined) throw new Error("Capture requires config.mapSpaceProfile.");
  const spatialProfile = await loadSpatialProfile(config.mapSpaceProfile);
  if (spatialProfile === null) throw new Error("Capture requires a reviewed map-space profile.");
  if (spatialProfile.profile.buildId !== identity.buildId) throw new Error("The spatial profile belongs to another game build.");
  if (!hasSelectedBinding(spatialProfile.profile, plan)) {
    throw new Error(`Capture plan has no reviewed scene binding for ${plan.sceneNativeId} at "${plan.scenePath}".`);
  }

  const planText = `${JSON.stringify(plan, null, 2)}\n`;
  const inputHashes: Record<string, string> = {
    ...identity.inputHashes,
    "runtime-owner": runtime.ownerSourceHash,
    plan: createHash("sha256").update(planText).digest("hex"),
    "map-space-profile": spatialProfile.sha256,
  };
  const evidenceByPath = new Map<string, { sha256: string; bytes: Uint8Array }>();
  const reviewArtifacts = new Map<string, Uint8Array>();
  for (const tile of plan.tiles) {
    if (tile.ceilingReview === null) continue;
    const evidence = tile.ceilingReview.evidence;
    const path = resolve(evidence.path);
    let record = evidenceByPath.get(path);
    if (record === undefined) {
      const bytes = await readFile(path);
      record = { sha256: createHash("sha256").update(bytes).digest("hex"), bytes };
      evidenceByPath.set(path, record);
    }
    if (record.sha256 !== evidence.sha256) throw new Error(`Ceiling review evidence changed for tile "${tile.id}".`);
    inputHashes[`ceiling-review:${tile.id}`] = record.sha256;
    if (!reviewArtifacts.has(record.sha256)) reviewArtifacts.set(record.sha256, record.bytes);
  }
  for (const name of ["world-inventory", "capture-session", "capture-geometry", "capture-visuals", "stream-visit", "scene-visit"]) {
    inputHashes[`probe:${name}`] = await hashFile(resolve(import.meta.dir, `probes/${name}.csx`));
  }
  for (const name of [
    "capture", "capture-cache", "capture-contracts", "capture-readiness", "traversal-contracts", "runtime", "runs", "build", "config", "contracts", "world-inventory",
    "map-calibration", "map-contracts", "map-spaces", "spatial-contracts", "spatial-extraction",
  ]) {
    inputHashes[`tool:${name}`] = await hashFile(resolve(import.meta.dir, `${name}.ts`));
  }
  const compatibility = new Map(plan.tiles.map(tile => [tile.id, tileCompatibilityKey({
    buildId: identity.buildId,
    buildHashes: identity.inputHashes,
    profileSha256: spatialProfile.sha256,
    pipelineHashes: inputHashes,
    character: config.character,
    plan,
    tile,
  })]));

  const run = await beginRun(config.outputRoot, {
    ...identity,
    inputHashes,
    toolRevision: await toolRevision(),
    command: "capture",
    settings: {
      character: config.character,
      timeoutMs: config.timeoutMs,
      mapSpaceProfile: config.mapSpaceProfile,
      runtimeOwnerToken: runtime.ownerToken,
      sceneNativeId: plan.sceneNativeId,
      scenePath: plan.scenePath,
      mapSpaceId: plan.mapSpaceId,
      floorId: plan.floorId,
      width: plan.width,
      height: plan.height,
      readiness: plan.readiness,
      visualPolicy: "compendium.capture-visual-policy.v2",
      completeImagery: false,
    },
  });

  let visitedScene: SceneVisit | undefined;
  const transitionScene = async (action: "start" | "restore", previous?: SceneVisit): Promise<SceneVisit> => {
    const deadline = Date.now() + plan.readiness.timeoutMs;
    const timeout = new Error(`Capture scene ${action} exceeded its readiness deadline.`);
    const timer = setTimeout(() => runtime.cancel(timeout), plan.readiness.timeoutMs);
    let key = previous?.key;
    let started: SceneVisit | undefined = previous;
    try {
      let nextAction: "start" | "poll" | "restore" = action;
      while (true) {
        runtime.signal.throwIfAborted();
        if (Date.now() >= deadline) throw timeout;
        const path = nextAction === "start" ? "scene-start.json" : action === "start" ? "scene-ready.json" : "scene-restored.json";
        const reply = await runtime.probe(resolve(import.meta.dir, "probes/scene-visit.csx"), resolve(run.directory, path), {
          parameters: { researchCharacter: config.character, action: nextAction, key, targetSceneNativeId: plan.sceneNativeId },
        });
        assertSchema(SceneVisitSchema, reply.value, "Capture scene transition");
        const state = reply.value;
        if (key !== undefined && state.key !== key) throw new Error("Capture scene transition returned another owner key.");
        if (started !== undefined && (state.sourceSceneNativeId !== started.sourceSceneNativeId || state.sourceSceneHandle !== started.sourceSceneHandle || !isDeepStrictEqual(state.sourcePosition, started.sourcePosition) || !isDeepStrictEqual(state.sourceRotation, started.sourceRotation))) throw new Error("Capture scene transition changed its restoration target.");
        started ??= state;
        key = state.key;
        const finished = state.phase === (action === "start" ? "ready" : "restored");
        if (nextAction === "start" || finished) await registerProbeArtifact(run, path, reply.reference);
        if (finished) {
          if (!state.sceneReady || state.sceneNativeId !== (action === "start" ? plan.sceneNativeId : started.sourceSceneNativeId)) throw new Error("Capture scene transition reached another scene.");
          return state;
        }
        nextAction = action === "start" ? "poll" : "restore";
        await Bun.sleep(500);
      }
    } finally { clearTimeout(timer); }
  };

  try {
    await Bun.write(resolve(run.directory, "plan.json"), planText);
    await registerArtifact(run, "plan.json", inputHashes.plan);
    await Bun.write(resolve(run.directory, "map-space-profile.json"), spatialProfile.bytes);
    await registerArtifact(run, "map-space-profile.json", spatialProfile.sha256);
    if (reviewArtifacts.size !== 0) await mkdir(resolve(run.directory, "reviews"), { recursive: true });
    for (const [sha256, bytes] of reviewArtifacts) {
      const path = `reviews/${sha256}.evidence`;
      await Bun.write(resolve(run.directory, path), bytes);
      await registerArtifact(run, path, sha256);
    }

    const reusable = await findReusableTiles({ outputRoot: config.outputRoot, buildId: identity.buildId, currentRunId: run.runId, compatibility, plan });
    const checkpoints = new Map<string, CaptureTileCheckpoint>();
    const reused = new Set<string>();
    const tiles: CaptureTileResult[] = [];
    for (const tile of plan.tiles) {
      const candidate = reusable.get(tile.id);
      if (candidate === undefined) continue;
      const copied = await copyReusableTile(run, candidate);
      const result = await loadReusedTileResult(run, tile, candidate, copied.checkpoint, plan, config);
      await writeTileCheckpoint(run, copied.checkpoint);
      checkpoints.set(tile.id, copied.checkpoint);
      reused.add(tile.id);
      tiles.push(result);
    }
    if (reused.size === plan.tiles.length) {
      await runtime.complete();
      await Bun.write(resolve(run.directory, "runtime-cleanup.json"), Bun.file(runtime.cleanupReceiptPath));
      await registerArtifact(run, "runtime-cleanup.json");
      await writeCaptureSet(run, plan, identity.buildId, checkpoints, reused);
      await run.succeed();
      const orderedTiles: CaptureTileResult[] = plan.tiles.flatMap(tile => {
        const result = tiles.find(candidate => candidate.tileId === tile.id);
        return result === undefined ? [] : [result];
      });
      return { manifest: run.manifestPath, tiles: orderedTiles, readiness: "verified" as const, completeImagery: false as const, reusedTiles: orderedTiles.map(tile => tile.tileId), capturedTiles: [] as string[] };
    }

    await mkdir(resolve(run.directory, "raw"), { recursive: true });
    const inventoryPath = resolve(run.directory, "raw/world-inventory.json");
    const inventoryReply = await runtime.probe(resolve(import.meta.dir, "probes/world-inventory.csx"), inventoryPath, {
      parameters: { researchCharacter: config.character },
      captureContext: true,
    });
    assertSchema(WorldInventorySchema, inventoryReply.value, "World inventory");
    await registerProbeArtifact(run, "raw/world-inventory.json", inventoryReply.reference);
    if (inventoryReply.observationContext === undefined) throw new Error("World inventory did not return observation context.");
    assertSchema(ObservationContextSchema, inventoryReply.observationContext, "World inventory observation context");
    if (inventoryReply.observationContext.started.researchCharacter !== config.character || inventoryReply.observationContext.completed.researchCharacter !== config.character) {
      throw new Error("World inventory observed another research character.");
    }
    if (inventoryReply.observationContext.completed.frame < inventoryReply.observationContext.started.frame || inventoryReply.observationContext.started.scene.handle !== inventoryReply.observationContext.completed.scene.handle || inventoryReply.observationContext.started.gameSceneNativeId !== inventoryReply.observationContext.completed.gameSceneNativeId) {
      throw new Error("World inventory crossed an observation boundary.");
    }
    const contextPath = "raw/world-inventory.context.json";
    await Bun.write(resolve(run.directory, contextPath), `${JSON.stringify(inventoryReply.observationContext, null, 2)}\n`);
    await registerArtifact(run, contextPath);

    const inventory = inventoryReply.value as WorldInventory;
    const sceneCatalog = collectSceneCatalog(identity.buildId, inventory);
    compileMapSpaces(spatialProfile.profile, sceneCatalog);
    if (!hasSelectedBinding(spatialProfile.profile, plan)) {
      throw new Error(`Capture plan has no reviewed scene binding for ${plan.sceneNativeId} at "${plan.scenePath}".`);
    }
    await Bun.write(resolve(run.directory, "scene-catalog.json"), `${JSON.stringify(sceneCatalog, null, 2)}\n`);
    await registerArtifact(run, "scene-catalog.json");
    if (inventoryReply.observationContext.completed.gameSceneNativeId !== plan.sceneNativeId) {
      visitedScene = await transitionScene("start");
      if (visitedScene.sourceSceneNativeId !== inventoryReply.observationContext.completed.gameSceneNativeId || visitedScene.sourceSceneHandle !== inventoryReply.observationContext.completed.scene.handle) throw new Error("The source scene changed before the capture visit.");
    }

    await mkdir(resolve(run.directory, "tiles"), { recursive: true });
    const probePath = resolve(import.meta.dir, "probes/capture-session.csx");
    const preludeFile = resolve(import.meta.dir, "probes/capture-visuals.csx");
    const cleanupPath = resolve(run.directory, "capture-cleanup.json");
    const cleanupRuntimePath = await toRuntimePath(config, cleanupPath);
    const baseParameters = {
      researchCharacter: config.character,
      sceneNativeId: plan.sceneNativeId,
      scenePath: plan.scenePath,
      width: plan.width,
      height: plan.height,
      cleanupPath: cleanupRuntimePath,
    };
    const startPath = "capture-start.json";
    const startReply = await runtime.probe(probePath, resolve(run.directory, startPath), { preludeFile, parameters: { action: "start", ...baseParameters } });
    assertSchema(CaptureSessionSchema, startReply.value, "Capture start response");
    let session = startReply.value as CaptureSession;
    if (session.phase !== "ready" || session.sceneNativeId !== plan.sceneNativeId || session.scenePath !== plan.scenePath) throw new Error("Capture start response has mismatched scene metadata.");
    assertSession(session, runtime, session.key, plan.sceneNativeId, plan.scenePath, undefined, "ready");
    const sceneHandle = session.sceneHandle;
    const captureKey = session.key;
    await registerProbeArtifact(run, startPath, startReply.reference);

    for (const tile of plan.tiles) {
      if (reused.has(tile.id)) continue;
      runtime.signal.throwIfAborted();
      const pngPath = resolve(run.directory, "tiles", `${tile.id}.png`);
      const restorationPath = resolve(run.directory, "tiles", `${tile.id}.restoration.json`);
      const responseRelativePath = `tiles/${tile.id}.json`;
      const responsePath = resolve(run.directory, responseRelativePath);
      const pngRuntimePath = await toRuntimePath(config, pngPath);
      const restorationRuntimePath = await toRuntimePath(config, restorationPath);
      let responseArtifact: ArtifactRecord | undefined;
      let imageArtifact: ArtifactRecord | undefined;
      let restorationArtifact: ArtifactRecord | undefined;
      let rasterArtifact: ArtifactRecord | undefined;
      const prepared = await withCaptureGeometry(runtime, config, run, plan, tile, async readiness => {
        if (readiness.sceneHandle !== sceneHandle) throw new Error("Geometry readiness belongs to another scene instance.");
        const reply = await runtime.probe(probePath, responsePath, {
          preludeFile,
          parameters: {
            action: "render",
            key: session.key,
            tileId: tile.id,
            frame: tile.frame,
            lighting: plan.lighting,
            cullingMask: plan.cullingMask,
            ceilingReview: tile.ceilingReview,
            outputPath: pngRuntimePath,
            restorationPath: restorationRuntimePath,
            ...baseParameters,
          },
        });
        assertSchema(CaptureSessionSchema, reply.value, `Capture response for tile "${tile.id}"`);
        session = reply.value as CaptureSession;
        assertSession(session, runtime, captureKey, plan.sceneNativeId, plan.scenePath, sceneHandle, "ready");
        const capture = session.lastCapture;
        if (capture === null || capture.tileId !== tile.id || capture.width !== plan.width || capture.height !== plan.height || capture.path !== pngRuntimePath || capture.frame !== capture.restoredFrame) {
          throw new Error(`Capture response for tile "${tile.id}" has mismatched output metadata.`);
        }
        if (capture.frame < readiness.observedFrames.at(-1)!) throw new Error("Capture preceded its geometry readiness evidence.");
        assertFrameMatches(capture, tile.frame, tile.id);
        const raster = registerRaster(capture);
        const png = await hashPng(pngPath, plan.width, plan.height, tile.id);
        if (png.sha256 !== capture.sha256 || png.byteSize !== capture.byteSize) throw new Error(`Capture response for tile "${tile.id}" does not match its PNG artifact.`);
        const restorationBytes = await readFile(restorationPath);
        let restoration: unknown;
        try { restoration = JSON.parse(new TextDecoder().decode(restorationBytes)); } catch (error) { throw new Error(`Restoration audit for tile "${tile.id}" is not valid JSON.`, { cause: error }); }
        assertRestorationAudit(restoration, tile, session.key, capture.frame, plan.lighting);
        responseArtifact = await registerProbeArtifact(run, responseRelativePath, reply.reference);
        imageArtifact = await registerArtifact(run, `tiles/${tile.id}.png`, png.sha256);
        restorationArtifact = await registerArtifact(run, `tiles/${tile.id}.restoration.json`);
        await Bun.write(resolve(run.directory, `tiles/${tile.id}.raster.json`), `${JSON.stringify(raster, null, 2)}\n`);
        rasterArtifact = await registerArtifact(run, `tiles/${tile.id}.raster.json`);
        return capture;
      });
      if (responseArtifact === undefined || imageArtifact === undefined || restorationArtifact === undefined || rasterArtifact === undefined) {
        throw new Error(`Capture tile "${tile.id}" completed without registered output artifacts.`);
      }
      const readinessArtifact = await captureArtifactReference(run.directory, prepared.readinessPath);
      const inventoryArtifact = await captureArtifactReference(run.directory, prepared.readiness.inventoryPath);
      const inventoryContextPath = prepared.readiness.inventoryPath.replace(/\.json$/, ".context.json");
      const inventoryContextArtifact = await captureArtifactReference(run.directory, inventoryContextPath);
      const nativeContext = [responseArtifact, inventoryArtifact, inventoryContextArtifact];
      if (prepared.readiness.streamKey !== null) {
        nativeContext.push(await captureArtifactReference(run.directory, `tiles/${tile.id}.geometry/stream-cleanup.json`));
      }
      const checkpoint: CaptureTileCheckpoint = {
        schemaVersion: "compendium.capture-tile-checkpoint.v1",
        tileId: tile.id,
        compatibilityKey: compatibility.get(tile.id)!,
        artifacts: { image: imageArtifact, raster: rasterArtifact, readiness: readinessArtifact, restoration: restorationArtifact, nativeContext },
        origin: { runId: run.runId, ownerToken: runtime.ownerToken, captureKey },
      };
      await writeTileCheckpoint(run, checkpoint);
      checkpoints.set(tile.id, checkpoint);
      tiles.push({ ...prepared.value, readiness: prepared.readiness, readinessPath: prepared.readinessPath, rasterPath: rasterArtifact.path, reused: false, nativeObserved: true, compatibilityKey: checkpoint.compatibilityKey, origin: checkpoint.origin });
    }

    const restoredPath = "capture-restored.json";
    const restoredReply = await runtime.probe(probePath, resolve(run.directory, restoredPath), {
      preludeFile,
      parameters: { action: "restore", key: session.key, ...baseParameters },
    });
    assertSchema(CaptureSessionSchema, restoredReply.value, "Capture restore response");
    session = restoredReply.value as CaptureSession;
    assertSession(session, runtime, captureKey, plan.sceneNativeId, plan.scenePath, sceneHandle, "restored");
    if (session.completedCaptures !== plan.tiles.length - reused.size || session.resources.some(resource => resource.alive)) {
      throw new Error("Capture restore response still reports owned resources.");
    }
    await registerProbeArtifact(run, restoredPath, restoredReply.reference);

    const cleanup = JSON.parse(await Bun.file(cleanupPath).text());
    assertSchema(CaptureCleanupSchema, cleanup, "Capture cleanup receipt");
    if (cleanup.key !== session.key || cleanup.ownerToken !== runtime.ownerToken || cleanup.resourcePrefix !== session.resourcePrefix || cleanup.phase !== "restored" || cleanup.remainingObjects !== 0 || cleanup.errors.length !== 0) {
      throw new Error("Capture cleanup receipt does not confirm native restoration.");
    }
    const captureCleanupArtifact = await registerArtifact(run, "capture-cleanup.json");
    if (visitedScene !== undefined) await transitionScene("restore", visitedScene);

    await runtime.complete();
    await Bun.write(resolve(run.directory, "runtime-cleanup.json"), Bun.file(runtime.cleanupReceiptPath));
    const runtimeCleanupArtifact = await registerArtifact(run, "runtime-cleanup.json");
    for (const checkpoint of checkpoints.values()) {
      if (reused.has(checkpoint.tileId)) continue;
      if (!checkpoint.artifacts.nativeContext.some(reference => reference.path === captureCleanupArtifact.path)) checkpoint.artifacts.nativeContext.push(captureCleanupArtifact);
      if (!checkpoint.artifacts.nativeContext.some(reference => reference.path === runtimeCleanupArtifact.path)) checkpoint.artifacts.nativeContext.push(runtimeCleanupArtifact);
    }
    await writeCaptureSet(run, plan, identity.buildId, checkpoints, reused);
    await run.succeed();
    const orderedTiles: CaptureTileResult[] = plan.tiles.flatMap(tile => {
      const result = tiles.find(candidate => candidate.tileId === tile.id);
      return result === undefined ? [] : [result];
    });
    return {
      manifest: run.manifestPath,
      tiles: orderedTiles,
      readiness: "verified" as const,
      completeImagery: false as const,
      reusedTiles: orderedTiles.filter(tile => tile.reused).map(tile => tile.tileId),
      capturedTiles: orderedTiles.filter(tile => !tile.reused).map(tile => tile.tileId),
    };
  } catch (error) {
    await run.fail(error);
    console.error(`Failed capture run: ${run.manifestPath}`);
    throw error;
  }
}
