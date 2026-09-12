import { createHash } from "node:crypto";
import { mkdir, readFile, rm, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
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
  type CapturedTile,
  CaptureReadinessSchema,
  CaptureRestorationSchema,
  CaptureSessionSchema,
  CaptureSetSchema,
  CaptureSweepSchema,
  type CaptureSweep,
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
import { withCaptureGeometry, type ReadinessSubject } from "./capture-readiness";
import { capturePositionFor, encodeRawFrame, loadNavigationSurvey, type CapturePosition, type NavigationSurvey } from "./capture-position";
import {
  captureArtifactReference,
  copyReusableTile,
  findResponseReference,
  findReusableTiles,
  readCaptureArtifactJson,
  readinessCovers,
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

export function validateCapturePlan(plan: CapturePlan): void {
  assertSchema(CapturePlanSchema, plan, "Capture plan");
  assertFiniteScalars(plan, "Capture plan");

  const tileIds = new Set<string>();
  for (const tile of plan.tiles) {
    if (tileIds.has(tile.id)) throw new Error(`Capture plan repeats tile ID "${tile.id}".`);
    tileIds.add(tile.id);
    if (!(tile.frame.nearClip < tile.frame.farClip)) {
      throw new Error(`Tile "${tile.id}" nearClip must be less than farClip.`);
    }
    const worldAspect = tile.frame.worldSize.x / tile.frame.worldSize.z;
    const pixelAspect = plan.width / plan.height;
    if (!closeEnough(worldAspect, pixelAspect)) {
      throw new Error(`Tile "${tile.id}" world and pixel aspect ratios do not match.`);
    }
  }

  if (plan.mapSpaceId === "world-surface") return;
  const first = plan.tiles[0]!.frame;
  for (const tile of plan.tiles) {
    if (!closeEnough(tile.frame.worldSize.x, first.worldSize.x) || !closeEnough(tile.frame.worldSize.z, first.worldSize.z)) {
      throw new Error(`Tile "${tile.id}" does not use the interior capture grid size.`);
    }
  }
  const columns = [...new Set(plan.tiles.map(tile => tile.frame.center.x))].sort((left, right) => left - right);
  const rows = [...new Set(plan.tiles.map(tile => tile.frame.center.z))].sort((left, right) => left - right);
  for (let index = 1; index < columns.length; index++) {
    if (!closeEnough(columns[index]! - columns[index - 1]!, first.worldSize.x)) {
      throw new Error("Interior capture plan has a missing tile column.");
    }
  }
  for (let index = 1; index < rows.length; index++) {
    if (!closeEnough(rows[index]! - rows[index - 1]!, first.worldSize.z)) {
      throw new Error("Interior capture plan has a missing tile row.");
    }
  }
  if (columns.length * rows.length !== plan.tiles.length) {
    throw new Error("Interior capture plan must include every tile in its rectangular grid.");
  }
}

function assertFrameMatches(actual: CapturedTile | null, expected: CapturePlan["tiles"][number]["frame"], tileId: string): void {
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

// One readiness subject covering every pending tile: the horizontal union of their frames and
// the vertical union of their camera intervals, so a static scene is observed once.
function mapExtentSubject(plan: CapturePlan, pending: readonly CapturePlan["tiles"][number][]): ReadinessSubject {
  const frames = pending.map(tile => tile.frame);
  const minX = Math.min(...frames.map(frame => frame.center.x - frame.worldSize.x / 2));
  const maxX = Math.max(...frames.map(frame => frame.center.x + frame.worldSize.x / 2));
  const minZ = Math.min(...frames.map(frame => frame.center.z - frame.worldSize.z / 2));
  const maxZ = Math.max(...frames.map(frame => frame.center.z + frame.worldSize.z / 2));
  const top = Math.max(...frames.map(frame => frame.cameraY - frame.nearClip));
  const bottom = Math.min(...frames.map(frame => frame.cameraY - frame.farClip));
  const cameraY = top + 0.1;
  const frame = { center: { x: (minX + maxX) / 2, z: (minZ + maxZ) / 2 }, worldSize: { x: maxX - minX, z: maxZ - minZ }, cameraY, nearClip: 0.1, farClip: cameraY - bottom };
  return { tile: { id: `${plan.mapSpaceId}-extent`, frame }, frame };
}

async function writeTileCheckpoint(run: Run, checkpoint: CaptureTileCheckpoint): Promise<void> {
  assertSchema(CaptureTileCheckpointSchema, checkpoint, `Capture checkpoint for tile "${checkpoint.tileId}"`);
  const path = `tiles/${checkpoint.tileId}.checkpoint.json`;
  await Bun.write(resolve(run.directory, path), `${JSON.stringify(checkpoint, null, 2)}\n`);
  await registerArtifact(run, path);
}

async function writeCaptureSet(run: Run, plan: CapturePlan, buildId: string, checkpoints: Map<string, CaptureTileCheckpoint>, reused: Set<string>): Promise<CaptureSet> {
  const set: CaptureSet = {
    schemaVersion: "compendium.capture-set.v2",
    buildId,
    sceneNativeId: plan.sceneNativeId,
    scenePath: plan.scenePath,
    mapSpaceId: plan.mapSpaceId,
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
  if (audit.key !== key || !audit.tileIds.includes(tile.id)) throw new Error(`Restoration audit for tile "${tile.id}" has mismatched session metadata.`);
  if (audit.frameStarted !== audit.frameRestored || audit.frameStarted !== captureFrame) throw new Error(`Restoration audit for tile "${tile.id}" crossed native frames.`);
  if (!audit.renderSucceeded || audit.errors.length !== 0) throw new Error(`Frame restoration failed for tile "${tile.id}".`);
  if (!isDeepStrictEqual(audit.before, audit.after)) throw new Error(`Frame restoration changed visual state for tile "${tile.id}".`);
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

function registerRaster(capture: CapturedTile, image: { sha256: string }): CaptureRaster {
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
    schemaVersion: "compendium.capture-raster.v5", tileId: capture.tileId, imageSha256: image.sha256,
    cameraFrame: capture.cameraFrame,
    verticalBounds: { minY: capture.cameraFrame.cameraY - farClip, maxY: capture.cameraFrame.cameraY - nearClip },
    width: capture.width, height: capture.height, coordinateSystem: "source-scene-world-xz", pixelConvention: "top-left-edges",
    worldFromPixelEdge: { origin, xAxis, yAxis }, maximumProjectionErrorPixels,
  };
  assertSchema(CaptureRasterSchema, raster, "Capture raster registration");
  return raster;
}

type CaptureTileResult = CapturedTile & {
  readiness: CaptureReadiness;
  readinessPath: string;
  rasterPath: string;
  reused: boolean;
  nativeObserved: boolean;
  compatibilityKey: string;
  origin: CaptureTileCheckpoint["origin"];
};

async function loadReusedTileResult(directory: string, tile: CapturePlan["tiles"][number], candidate: ReusableCaptureTile, copied: CaptureTileCheckpoint, plan: CapturePlan): Promise<CaptureTileResult> {
  const responseReference = findResponseReference(copied.artifacts, tile.id);
  if (responseReference === undefined) throw new Error(`Reused tile "${tile.id}" has no copied native response.`);
  const response = await readCaptureArtifactJson(directory, responseReference);
  assertSchema(CaptureSessionSchema, response, `Reused capture response for tile "${tile.id}"`);
  const session = response as CaptureSession;
  const capture = session.lastCapture?.captures.find(candidate => candidate.tileId === tile.id);
  if (capture === undefined) throw new Error(`Reused tile "${tile.id}" has no capture metadata.`);
  const readiness = await readCaptureArtifactJson(directory, copied.artifacts.readiness);
  assertSchema(CaptureReadinessSchema, readiness, `Reused readiness for tile "${tile.id}"`);
  if (capture.width !== plan.width || capture.height !== plan.height || capture.frame !== capture.restoredFrame) throw new Error(`Reused tile "${tile.id}" has mismatched capture metadata.`);
  const expectedFrame = tile.frame;
  assertFrameMatches(capture, expectedFrame, tile.id);
  if (!readinessCovers(readiness as CaptureReadiness, tile)) throw new Error(`Reused tile "${tile.id}" readiness does not cover its frame.`);
  assertRestorationAudit(await readCaptureArtifactJson(directory, copied.artifacts.restoration), tile, copied.origin.captureKey, capture.frame, plan.lighting);
  const imagePath = resolve(directory, copied.artifacts.image.path);
  const image = await hashPng(imagePath, plan.width, plan.height, tile.id);
  if (image.sha256 !== copied.artifacts.image.sha256) throw new Error("Reused image disagrees with its checkpoint.");
  const raster = await readCaptureArtifactJson(directory, copied.artifacts.raster);
  if (!isDeepStrictEqual(raster, registerRaster(capture, image))) throw new Error("Reused raster disagrees with its native camera controls.");
  return {
    ...capture,
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
  if (!profile.mapSpaces.some(candidate => candidate.id === plan.mapSpaceId)) {
    throw new Error(`Capture plan requests unknown map space "${plan.mapSpaceId}".`);
  }
  return profile.bindings.some(binding => binding.sceneNativeId === plan.sceneNativeId
    && binding.scenePath === plan.scenePath && binding.mapSpaceId === plan.mapSpaceId);
}

type CaptureSweepContext = {
  finalSceneNativeId: number;
  finalScenePath: string;
  run: Run;
  visit?: SceneVisit;
  transitionOrdinal: number;
  sceneTransitions: ArtifactRecord[];
  plans: CaptureSweep["plans"];
  start: (targetSceneNativeId: number, timeoutMs: number, capturePosition: CapturePosition | null) => Promise<SceneVisit>;
  retarget: (targetSceneNativeId: number, timeoutMs: number, capturePosition: CapturePosition | null) => Promise<SceneVisit>;
  restore: (timeoutMs: number) => Promise<SceneVisit>;
  failure?: { planRunId: string; phase: string };
};

async function capturePlan(
  runtime: Runtime,
  config: CompendiumConfig,
  identity: Awaited<ReturnType<typeof buildIdentity>>,
  plan: CapturePlan,
  planDirectory: string,
  sweep?: CaptureSweepContext,
) {
  validateCapturePlan(plan);
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
  for (const name of ["world-inventory", "capture-session", "capture-geometry", "capture-visuals", "stream-visit", "scene-visit"]) {
    inputHashes[`probe:${name}`] = await hashFile(resolve(import.meta.dir, `probes/${name}.csx`));
  }
  for (const name of [
    "capture", "capture-cache", "capture-contracts", "capture-position", "capture-readiness", "traversal-contracts", "runtime", "runs", "build", "config", "contracts", "world-inventory",
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
      sweepRunId: sweep?.run.runId ?? null,
      sweepManifestPath: sweep?.run.manifestPath ?? null,
      sceneNativeId: plan.sceneNativeId,
      scenePath: plan.scenePath,
      mapSpaceId: plan.mapSpaceId,
      survey: plan.survey ?? null,
      width: plan.width,
      height: plan.height,
      readiness: plan.readiness,
      visualPolicy: "compendium.capture-visual-policy.v3",
      completeImagery: false,
    },
  });

  try {
    await Bun.write(resolve(run.directory, "plan.json"), planText);
    await registerArtifact(run, "plan.json", inputHashes.plan);
    await Bun.write(resolve(run.directory, "map-space-profile.json"), spatialProfile.bytes);
    await registerArtifact(run, "map-space-profile.json", spatialProfile.sha256);

    const reusable = await findReusableTiles({ outputRoot: config.outputRoot, buildId: identity.buildId, currentRunId: run.runId, compatibility, plan });
    const checkpoints = new Map<string, CaptureTileCheckpoint>();
    const reused = new Set<string>();
    const tiles: CaptureTileResult[] = [];
    // The survey is a plan input: its hash is in every tile's compatibility key, and the player
    // stands on the walkable surface it describes.
    const survey: NavigationSurvey | null = plan.survey === undefined ? null : await loadNavigationSurvey(resolve(planDirectory, plan.survey.path), plan.survey, plan.sceneNativeId);
    for (const tile of plan.tiles) {
      const candidate = reusable.get(tile.id);
      if (candidate === undefined) continue;
      // A candidate whose evidence contradicts the current plan is not reused and the tile is
      // captured again, the same outcome the cache gives a candidate it rejects itself. The
      // check runs against the source run before anything is copied or registered here.
      try {
        await loadReusedTileResult(candidate.sourceDirectory, tile, candidate, candidate.checkpoint, plan);
      } catch (error) {
        console.warn(`Capture cache candidate rejected: ${candidate.sourceRun.runId}: ${error instanceof Error ? error.message : String(error)}`);
        continue;
      }
      const copied = await copyReusableTile(run, candidate);
      const result = await loadReusedTileResult(run.directory, tile, candidate, copied.checkpoint, plan);
      await writeTileCheckpoint(run, copied.checkpoint);
      checkpoints.set(tile.id, copied.checkpoint);
      reused.add(tile.id);
      tiles.push(result);
    }
    if (reused.size === plan.tiles.length && sweep === undefined) {
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
    if (sweep !== undefined) {
      // A map with a survey has a walkable surface, so the player stands on it at the map centre
      // and the scene is static for capture; an open-world plan keeps the game's arrival point.
      const capturePosition = survey === null ? null : capturePositionFor(plan, survey);
      if (sweep.visit === undefined) sweep.visit = await sweep.start(plan.sceneNativeId, plan.readiness.timeoutMs, capturePosition);
      else if (inventoryReply.observationContext.completed.gameSceneNativeId !== plan.sceneNativeId) sweep.visit = await sweep.retarget(plan.sceneNativeId, plan.readiness.timeoutMs, capturePosition);
      const activeVisit = sweep.visit;
      if (activeVisit === undefined || activeVisit.sceneNativeId !== plan.sceneNativeId || !activeVisit.sceneReady) {
        throw new Error("The scene transition did not reach the capture scene.");
      }
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
    // Session start allocates the camera, light, and render texture while the scene it just
    // entered is still settling, so it uses the readiness budget rather than the per-call default.
    const startReply = await runtime.probe(probePath, resolve(run.directory, startPath), { preludeFile, parameters: { action: "start", ...baseParameters }, timeoutMs: plan.readiness.timeoutMs });
    assertSchema(CaptureSessionSchema, startReply.value, "Capture start response");
    let session = startReply.value as CaptureSession;
    if (session.phase !== "ready" || session.sceneNativeId !== plan.sceneNativeId || session.scenePath !== plan.scenePath) throw new Error("Capture start response has mismatched scene metadata.");
    assertSession(session, runtime, session.key, plan.sceneNativeId, plan.scenePath, undefined, "ready");
    const sceneHandle = session.sceneHandle;
    const captureKey = session.key;
    await registerProbeArtifact(run, startPath, startReply.reference);

    // Renders a batch of tiles under one readiness that covers them all, in one frame-local
    // probe: verifies each raw frame against its reported hash, encodes it on the host, and
    // registers the tile artifacts. The raw frame is intermediate bytes: its hash stays in the
    // native response, the PNG is the tile image.
    type RenderedTile = { capture: CapturedTile; responseArtifact: ArtifactRecord; imageArtifact: ArtifactRecord; restorationArtifact: ArtifactRecord; rasterArtifact: ArtifactRecord };
    const renderBatch = async (batch: readonly CapturePlan["tiles"][number][], readiness: CaptureReadiness, batchLabel: string): Promise<Map<string, RenderedTile>> => {
      runtime.signal.throwIfAborted();
      if (readiness.sceneHandle !== sceneHandle) throw new Error("Geometry readiness belongs to another scene instance.");
      const restorationRelative = `tiles/${batchLabel}.restoration.json`;
      const restorationPath = resolve(run.directory, restorationRelative);
      const responseRelativePath = `tiles/${batchLabel}.json`;
      const responsePath = resolve(run.directory, responseRelativePath);
      const observed = readiness.captureFrame;
      const tileInputs = [];
      for (const tile of batch) {
        const captureFrame = tile.frame;
        // The readiness frame is the tile's own frame, or the map extent that contains it.
        const contains = Math.abs(observed.center.x - captureFrame.center.x) <= (observed.worldSize.x - captureFrame.worldSize.x) / 2 + 1e-6
          && Math.abs(observed.center.z - captureFrame.center.z) <= (observed.worldSize.z - captureFrame.worldSize.z) / 2 + 1e-6
          && observed.cameraY - observed.nearClip >= captureFrame.cameraY - captureFrame.nearClip - 1e-6
          && observed.cameraY - observed.farClip <= captureFrame.cameraY - captureFrame.farClip + 1e-6;
        if (!contains) throw new Error(`Capture tile "${tile.id}" lies outside its readiness frame.`);
        tileInputs.push({ tileId: tile.id, frame: captureFrame, rawPath: await toRuntimePath(config, resolve(run.directory, "tiles", `${tile.id}.rgba`)) });
      }
      const reply = await runtime.probe(probePath, responsePath, {
        preludeFile,
        parameters: {
          action: "render",
          key: session.key,
          tiles: tileInputs,
          lighting: plan.lighting,
          cullingMask: plan.cullingMask,
          restorationPath: await toRuntimePath(config, restorationPath),
          ...baseParameters,
        },
        // A batch renders every tile in one frame-local evaluation; its deadline is the
        // readiness budget, not the per-call default.
        timeoutMs: plan.readiness.timeoutMs,
      });
      assertSchema(CaptureSessionSchema, reply.value, `Capture response for batch "${batchLabel}"`);
      session = reply.value as CaptureSession;
      assertSession(session, runtime, captureKey, plan.sceneNativeId, plan.scenePath, sceneHandle, "ready");
      const rendered = session.lastCapture;
      if (rendered === null || rendered.captures.length !== batch.length || rendered.frame !== rendered.restoredFrame) throw new Error(`Capture response for batch "${batchLabel}" has mismatched output metadata.`);
      if (rendered.frame < readiness.observedFrames.at(-1)!) throw new Error("Capture preceded its geometry readiness evidence.");
      const restorationBytes = await readFile(restorationPath);
      let restoration: unknown;
      try { restoration = JSON.parse(new TextDecoder().decode(restorationBytes)); } catch (error) { throw new Error(`Restoration audit for batch "${batchLabel}" is not valid JSON.`, { cause: error }); }
      const responseArtifact = await registerProbeArtifact(run, responseRelativePath, reply.reference);
      const restorationArtifact = await registerArtifact(run, restorationRelative);
      const results = new Map<string, RenderedTile>();
      for (const tile of batch) {
        const captureFrame = tile.frame;
        const capture = rendered.captures.find(candidate => candidate.tileId === tile.id);
        if (capture === undefined || capture.width !== plan.width || capture.height !== plan.height) throw new Error(`Capture response for tile "${tile.id}" has mismatched output metadata.`);
        assertFrameMatches(capture, captureFrame, tile.id);
        if (!isDeepStrictEqual(capture.cameraFrame, captureFrame)) throw new Error(`Capture response for tile "${tile.id}" disagrees with its frame.`);
        const rawPath = resolve(run.directory, "tiles", `${tile.id}.rgba`);
        const encoded = await encodeRawFrame(rawPath, capture.raw, plan.width, plan.height, tile.id);
        const pngPath = resolve(run.directory, "tiles", `${tile.id}.png`);
        await Bun.write(pngPath, encoded);
        await rm(rawPath, { force: true });
        const png = await hashPng(pngPath, plan.width, plan.height, tile.id);
        const raster = registerRaster(capture, png);
        assertRestorationAudit(restoration, tile, session.key, capture.frame, plan.lighting);
        const imageArtifact = await registerArtifact(run, `tiles/${tile.id}.png`, png.sha256);
        await Bun.write(resolve(run.directory, `tiles/${tile.id}.raster.json`), `${JSON.stringify(raster, null, 2)}\n`);
        const rasterArtifact = await registerArtifact(run, `tiles/${tile.id}.raster.json`);
        results.set(tile.id, { capture, responseArtifact, imageArtifact, restorationArtifact, rasterArtifact });
      }
      return results;
    };

    const checkpointTile = async (tile: CapturePlan["tiles"][number], rendered: RenderedTile, readiness: CaptureReadiness, readinessPath: string): Promise<void> => {
      const readinessArtifact = await captureArtifactReference(run.directory, readinessPath);
      const inventoryArtifact = await captureArtifactReference(run.directory, readiness.inventoryPath);
      const inventoryContextPath = readiness.inventoryPath.replace(/\.json$/, ".context.json");
      const inventoryContextArtifact = await captureArtifactReference(run.directory, inventoryContextPath);
      const nativeContext = [rendered.responseArtifact, inventoryArtifact, inventoryContextArtifact];
      if (readiness.streamKey !== null) {
        nativeContext.push(await captureArtifactReference(run.directory, `${readinessPath.slice(0, -"/readiness.json".length)}/stream-cleanup.json`));
      }
      const checkpoint: CaptureTileCheckpoint = {
        schemaVersion: "compendium.capture-tile-checkpoint.v1",
        tileId: tile.id,
        compatibilityKey: compatibility.get(tile.id)!,
        artifacts: { image: rendered.imageArtifact, raster: rendered.rasterArtifact, readiness: readinessArtifact, restoration: rendered.restorationArtifact, nativeContext },
        origin: { runId: run.runId, ownerToken: runtime.ownerToken, captureKey },
      };
      await writeTileCheckpoint(run, checkpoint);
      checkpoints.set(tile.id, checkpoint);
      tiles.push({ ...rendered.capture, readiness, readinessPath, rasterPath: rendered.rasterArtifact.path, reused: false, nativeObserved: true, compatibilityKey: checkpoint.compatibilityKey, origin: checkpoint.origin });
    };

    const pending = plan.tiles.filter(tile => !reused.has(tile.id));
    // One readiness for the whole map: it holds every required source for the whole batch, so
    // nothing loads or unloads between tiles and every tile renders under the same observation.
    if (pending.length > 0) {
      const extent = mapExtentSubject(plan, pending);
      const observed = await withCaptureGeometry(runtime, config, run, plan, extent, async readiness => {
        if (readiness.sceneHandle !== sceneHandle) throw new Error("Geometry readiness belongs to another scene instance.");
        return readiness;
      });
      const rendered = await renderBatch(pending, observed.readiness, `${plan.mapSpaceId}-batch`);
      for (const tile of pending) await checkpointTile(tile, rendered.get(tile.id)!, observed.readiness, observed.readinessPath);
    }

    const restoredPath = "capture-restored.json";
    const restoredReply = await runtime.probe(probePath, resolve(run.directory, restoredPath), {
      preludeFile,
      parameters: { action: "restore", key: session.key, ...baseParameters },
      timeoutMs: plan.readiness.timeoutMs,
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

    let runtimeCleanupArtifact: ArtifactRecord | undefined;
    if (sweep === undefined) {
      await runtime.complete();
      await Bun.write(resolve(run.directory, "runtime-cleanup.json"), Bun.file(runtime.cleanupReceiptPath));
      runtimeCleanupArtifact = await registerArtifact(run, "runtime-cleanup.json");
    }
    for (const checkpoint of checkpoints.values()) {
      if (reused.has(checkpoint.tileId)) continue;
      if (!checkpoint.artifacts.nativeContext.some(reference => reference.path === captureCleanupArtifact.path)) checkpoint.artifacts.nativeContext.push(captureCleanupArtifact);
      if (runtimeCleanupArtifact !== undefined && !checkpoint.artifacts.nativeContext.some(reference => reference.path === runtimeCleanupArtifact.path)) checkpoint.artifacts.nativeContext.push(runtimeCleanupArtifact);
    }
    await writeCaptureSet(run, plan, identity.buildId, checkpoints, reused);
    await run.succeed();
    if (sweep !== undefined) {
      sweep.plans.push({
        runId: run.runId,
        manifestPath: run.manifestPath,
        manifestSha256: await hashFile(run.manifestPath),
        sceneNativeId: plan.sceneNativeId,
        scenePath: plan.scenePath,
        mapSpaceId: plan.mapSpaceId,
      });
    }
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
    if (sweep !== undefined) sweep.failure = { planRunId: run.runId, phase: "plan-capture" };
    await run.fail(error);
    console.error(`Failed capture run: ${run.manifestPath}`);
    throw error;
  }
}

export type CapturePlanInput = { plan: CapturePlan; path: string };

export async function capture(
  runtime: Runtime,
  config: CompendiumConfig,
  identity: Awaited<ReturnType<typeof buildIdentity>>,
  planInputs: CapturePlanInput[],
) {
  if (planInputs.length === 0) throw new Error("Capture requires at least one plan.");
  const plans = planInputs.map(input => input.plan);
  const finalScene = { nativeId: config.finalSceneNativeId, path: config.finalScenePath };
  plans.forEach(validateCapturePlan);
  const sweepRun = await beginRun(config.outputRoot, {
    ...identity,
    inputHashes: {
      ...identity.inputHashes,
      "runtime-owner": runtime.ownerSourceHash,
      ...Object.fromEntries(plans.map(plan => [`plan:${plan.sceneNativeId}:${plan.mapSpaceId}`, createHash("sha256").update(JSON.stringify(plan)).digest("hex")])),
    },
    toolRevision: await toolRevision(),
    command: "capture-sweep",
    settings: {
      character: config.character,
      mapSpaceProfile: config.mapSpaceProfile,
      runtimeOwnerToken: runtime.ownerToken,
      finalScene,
      planCount: plans.length,
      completeImagery: false,
    },
  });
  const sweep: CaptureSweepContext = {
    finalSceneNativeId: finalScene.nativeId,
    finalScenePath: finalScene.path,
    run: sweepRun,
    transitionOrdinal: 0,
    sceneTransitions: [],
    plans: [],
    start: async () => { throw new Error("Sweep scene controller is not initialized."); },
    retarget: async () => { throw new Error("Sweep scene controller is not initialized."); },
    restore: async () => { throw new Error("Sweep scene controller is not initialized."); },
  };
  const transitionScene = async (action: "start" | "retarget" | "restore", targetSceneNativeId: number, timeoutMs: number, capturePosition: CapturePosition | null = null): Promise<SceneVisit> => {
    const deadline = Date.now() + timeoutMs;
    const timeout = new Error(`Capture scene ${action} exceeded its readiness deadline.`);
    const previous = sweep.visit;
    let key = previous?.key;
    let started: SceneVisit | undefined = previous;
    const transitionOrdinal = sweep.transitionOrdinal++;
    let nextAction: "start" | "retarget" | "poll" | "restore" = action;
    while (true) {
      runtime.signal.throwIfAborted();
      if (Date.now() >= deadline) throw timeout;
      const path = nextAction === "start" ? "scene-start.json" : nextAction === "retarget" ? `scene-retarget-${transitionOrdinal}-${targetSceneNativeId}.json` : action === "restore" ? "scene-final.json" : `scene-ready-${transitionOrdinal}.json`;
      const parameters: Record<string, unknown> = { researchCharacter: config.character, action: nextAction, key, targetSceneNativeId: action === "restore" ? previous?.targetSceneNativeId : targetSceneNativeId, capturePosition };
      if (nextAction === "start") {
        parameters.finalSceneNativeId = sweep.finalSceneNativeId;
        parameters.finalScenePath = sweep.finalScenePath;
      }
      // Scene loading and post-placement asset bursts stall the main thread; a transition poll
      // tolerates that with the readiness budget instead of the per-call default.
      const reply = await runtime.probe(resolve(import.meta.dir, "probes/scene-visit.csx"), resolve(sweep.run.directory, path), { parameters, timeoutMs });
      assertSchema(SceneVisitSchema, reply.value, "Capture scene transition");
      const state = reply.value;
      sweep.visit = state;
      if (key !== undefined && state.key !== key) throw new Error("Capture scene transition returned another owner key.");
      if (started !== undefined && (state.sourceSceneNativeId !== started.sourceSceneNativeId || state.sourceSceneHandle !== started.sourceSceneHandle || !isDeepStrictEqual(state.sourcePosition, started.sourcePosition) || !isDeepStrictEqual(state.sourceRotation, started.sourceRotation))) throw new Error("Capture scene transition changed its restoration target.");
      started ??= state;
      key = state.key;
      const finished = state.phase === (action === "restore" ? "restored" : "ready");
      if (nextAction === "start" || nextAction === "retarget" || finished) sweep.sceneTransitions.push(await registerProbeArtifact(sweep.run, path, reply.reference));
      if (finished) {
        const expectedScene = action === "restore" ? (state.finalSceneNativeId ?? started.sourceSceneNativeId) : targetSceneNativeId;
        if (!state.sceneReady || state.sceneNativeId !== expectedScene) throw new Error("Capture scene transition reached another scene.");
        return state;
      }
      nextAction = action === "restore" ? "restore" : "poll";
      await Bun.sleep(500);
    }
  };
  sweep.start = (target, timeoutMs, capturePosition) => transitionScene("start", target, timeoutMs, capturePosition);
  sweep.retarget = (target, timeoutMs, capturePosition) => transitionScene("retarget", target, timeoutMs, capturePosition);
  sweep.restore = (timeoutMs) => transitionScene("restore", sweep.visit?.targetSceneNativeId ?? finalScene.nativeId, timeoutMs);
  const results: Awaited<ReturnType<typeof capturePlan>>[] = [];
  try {
    for (const input of planInputs) {
      const plan = input.plan;
      results.push(await capturePlan(runtime, config, identity, plan, dirname(resolve(input.path)), sweep));
    }
    if (sweep.visit !== undefined && sweep.visit.phase !== "restored") sweep.visit = await sweep.restore(plans.at(-1)!.readiness.timeoutMs);
    await runtime.complete();
    await Bun.write(resolve(sweep.run.directory, "runtime-cleanup.json"), Bun.file(runtime.cleanupReceiptPath));
    const runtimeCleanup = await registerArtifact(sweep.run, "runtime-cleanup.json");
    const sweepEvidence: CaptureSweep = {
      schemaVersion: "compendium.capture-sweep.v3",
      runId: sweep.run.runId,
      ownerToken: runtime.ownerToken,
      finalScene,
      plans: sweep.plans,
      sceneTransitions: sweep.sceneTransitions,
      runtimeCleanup,
      completed: true,
    };
    assertSchema(CaptureSweepSchema, sweepEvidence, "Capture sweep evidence");
    await Bun.write(resolve(sweep.run.directory, "sweep.json"), `${JSON.stringify(sweepEvidence, null, 2)}\n`);
    await registerArtifact(sweep.run, "sweep.json");
    await sweep.run.succeed();
    return { plans: results, finalScene, sweepManifest: sweep.run.manifestPath };
  } catch (error) {
    let failure = error;
    if (sweep.visit !== undefined && sweep.visit.phase !== "restored" && !runtime.signal.aborted) {
      try { sweep.visit = await sweep.restore(plans.at(-1)!.readiness.timeoutMs); }
      catch (restoreError) {
        runtime.cancel(restoreError);
        sweep.failure = { planRunId: sweep.failure?.planRunId ?? sweep.plans.at(-1)?.runId ?? "unknown", phase: "final-scene-transition" };
        failure = new AggregateError([error, restoreError], "Capture sweep failed and the final scene could not be restored.");
      }
    }
    const planFailure = sweep.failure ?? (sweep.plans.at(-1) === undefined ? undefined : { planRunId: sweep.plans.at(-1)!.runId, phase: "sweep-finalization" });
    const phase = planFailure?.phase ?? "sweep-finalization";
    const detail = planFailure === undefined ? "" : ` (plan run ${planFailure.planRunId})`;
    const sweepFailure = new Error(`Capture sweep failed during ${phase}${detail}.`, { cause: failure });
    await sweep.run.fail(sweepFailure);
    throw failure;
  }
}
