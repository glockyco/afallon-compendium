import { createWorldInventoryBundle } from "@afallon/scan/inventory";
import captureSessionSource from "./probes/capture-session.csx" with { type: "text" };
import captureVisualsSource from "./probes/capture-visuals.csx" with { type: "text" };
import sceneVisitSource from "./probes/scene-visit.csx" with { type: "text" };
import { createHash, randomUUID } from "node:crypto";
import { mkdir, open, readFile, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { assertSchema, assertFiniteScalars, captureNumbersMatch } from "./capture-validation";
import { tileBounds } from "./capture-geometry";
import { isDeepStrictEqual } from "node:util";
import type { CompendiumConfig } from "@afallon/contracts";
import { ArtifactStore, createArtifactLease, selectLatestSuccess } from "@afallon/artifacts";
import { toRuntimePath, type Runtime } from "@afallon/runtime";
import { CaptureCleanupSchema,
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
type CaptureTileCheckpoint, } from "@afallon/contracts"
import { ObservationContextSchema } from "@afallon/contracts"
import { collectSceneCatalog, compileMapSpaces } from "@afallon/contracts/spatial";
import { CaptureSweepCleanupSchema, CaptureChunkOutcomesSchema, RuntimeCleanupReceiptSchema, type CaptureArtifact, type ContentIdentity } from "@afallon/contracts";
import { beginCaptureWorkspace, objectReferences, type CaptureWorkspace } from "./content-run";
import { loadSpatialProfile } from "./spatial-extraction";
import type { MapSpaceProfile } from "@afallon/contracts"
import { WorldInventorySchema, type WorldInventory } from "@afallon/contracts"
import { withCaptureGeometry, type ReadinessSubject } from "./capture-readiness";
import { capturePositionFor, encodeRawFrame, loadNavigationSurvey, type CapturePosition, type NavigationSurvey } from "./capture-position";
import {
  captureArtifactReferences,
  reuseCaptureTile,
  validateCaptureCleanup,
  findResponseReference,
  findReusableTiles,
  readCaptureArtifactJson,
  readinessCovers,
  tileCompatibilityKey,
  type ReusableCaptureTile,
} from "./capture-cache";
import { SceneVisitSchema, type SceneVisit } from "@afallon/contracts"
import { captureRunInput } from "./fingerprints";

export interface CaptureBuildIdentity {
  readonly buildId: string;
  readonly inputHashes: Readonly<Record<string, string>>;
  readonly diagnosticRevision: string;
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
    if (!captureNumbersMatch(worldAspect, pixelAspect)) {
      throw new Error(`Tile "${tile.id}" world and pixel aspect ratios do not match.`);
    }
  }

}

function assertFrameMatches(actual: CapturedTile | null, expected: CapturePlan["tiles"][number]["frame"], tileId: string): void {
  if (actual === null || typeof actual !== "object") throw new Error(`Capture response for tile "${tileId}" has no capture metadata.`);
  const frame = actual.cameraFrame;
  if (!captureNumbersMatch(frame.center.x, expected.center.x) || !captureNumbersMatch(frame.center.z, expected.center.z)
    || !captureNumbersMatch(frame.worldSize.x, expected.worldSize.x) || !captureNumbersMatch(frame.worldSize.z, expected.worldSize.z)
    || !captureNumbersMatch(frame.cameraY, expected.cameraY) || !captureNumbersMatch(frame.nearClip, expected.nearClip)
    || !captureNumbersMatch(frame.farClip, expected.farClip)) {
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

async function registerArtifact(run: CaptureWorkspace, path: string, expectedHash?: string): Promise<CaptureArtifact> {
  const artifact = await run.registerFile(path);
  if (expectedHash !== undefined && artifact.content.sha256 !== expectedHash) {
    throw new Error(`Artifact changed before registration: ${path}.`);
  }
  return artifact;
}

async function registerProbeArtifact(
  run: CaptureWorkspace,
  path: string,
  reference: { sha256: string },
): Promise<CaptureArtifact> {
  return registerArtifact(run, path, reference.sha256);
}

// One readiness subject covering every pending tile: the horizontal union of their frames and
// the vertical union of their camera intervals, so a static scene is observed once.
function mapExtentSubject(plan: CapturePlan, pending: readonly CapturePlan["tiles"][number][]): ReadinessSubject {
  const { minX, maxX, minZ, maxZ } = tileBounds(pending);
  const frames = pending.map(tile => tile.frame);
  const top = Math.max(...frames.map(frame => frame.cameraY - frame.nearClip));
  const bottom = Math.min(...frames.map(frame => frame.cameraY - frame.farClip));
  const cameraY = top + 0.1;
  const frame = { center: { x: (minX + maxX) / 2, z: (minZ + maxZ) / 2 }, worldSize: { x: maxX - minX, z: maxZ - minZ }, cameraY, nearClip: 0.1, farClip: cameraY - bottom };
  return { tile: { id: `${plan.mapSpaceId}-extent`, frame }, frame };
}

async function writeTileCheckpoint(run: CaptureWorkspace, checkpoint: CaptureTileCheckpoint): Promise<void> {
  assertSchema(CaptureTileCheckpointSchema, checkpoint, `Capture checkpoint for tile "${checkpoint.tileId}"`);
  const path = `tiles/${checkpoint.tileId}.checkpoint.json`;
  await Bun.write(resolve(run.directory, path), `${JSON.stringify(checkpoint, null, 2)}\n`);
  await run.registerFile(path, { references: objectReferences(captureArtifactReferences(checkpoint.artifacts)) });
}

async function writeCaptureSet(run: CaptureWorkspace, plan: CapturePlan, buildId: string, standingPoint: CapturePosition | null, checkpoints: Map<string, CaptureTileCheckpoint>, reused: Set<string>): Promise<CaptureSet> {
  const set: CaptureSet = {
    schemaVersion: "compendium.capture-set.v4",
    buildId,
    sceneNativeId: plan.sceneNativeId,
    scenePath: plan.scenePath,
    mapSpaceId: plan.mapSpaceId,
    // Where the player stood for every tile of this set; the game shows objects near this point.
    standingPoint,
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
  await run.registerFile("capture-set.json", { references: objectReferences(set.tiles.flatMap(tile => captureArtifactReferences(tile.artifacts))) });
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
  if (during === null || during.fog || during.ambientMode !== 3 || during.ambientIntensity !== 1 || during.reflectionIntensity !== 0 || !during.lightEnabled || during.sunInstanceId !== during.lightInstanceId || !captureNumbersMatch(during.lightIntensity, lighting.directionalIntensity)) {
    throw new Error("Capture did not apply its controlled lighting profile.");
  }
  for (const channel of ["r", "g", "b"] as const) {
    for (const field of ["ambientLight", "ambientSky", "ambientEquator", "ambientGround", "lightColor"] as const) {
      if (!captureNumbersMatch(during[field][channel], lighting.ambient[channel])) throw new Error("Capture lighting colors differ from the requested profile.");
    }
  }
  const channels = [lighting.ambient.r, lighting.ambient.g, lighting.ambient.b].map(value => {
    if (audit.colorSpace === "Gamma") return value;
    if (value <= 0.04045) return value / 12.92;
    return value < 1 ? ((value + 0.055) / 1.055) ** 2.4 : value ** 2.2;
  });
  for (let index = 0; index < 27; index++) {
    const expected = index % 9 === 0 ? channels[index / 9]! : 0;
    if (!captureNumbersMatch(during.ambientProbe[index]!, expected)) throw new Error("Capture ambient coefficients differ from the normalized profile.");
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
  const file = await open(path, "r");
  try {
    const header = Buffer.alloc(24);
    const { bytesRead } = await file.read(header, 0, header.length, 0);
    const dimensions = pngDimensions(header.subarray(0, bytesRead), path);
    if (dimensions.width !== expectedWidth || dimensions.height !== expectedHeight) throw new Error(`Capture output for tile "${tileId}" has unexpected dimensions.`);
    const digest = createHash("sha256");
    let byteSize = 0;
    for await (const chunk of file.createReadStream({ start: 0, highWaterMark: 1024 * 1024, autoClose: false })) { digest.update(chunk); byteSize += chunk.length; }
    const metadata = await file.stat();
    if (!metadata.isFile() || metadata.size !== byteSize || byteSize <= 0) throw new Error(`Capture image is not a stable file: ${tileId}.`);
    return { sha256: digest.digest("hex"), byteSize };
  } finally { await file.close(); }
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

export interface CapturePlanResult {
  manifest: ContentIdentity;
  manifestPath: string;
  captureSet: ContentIdentity;
  tiles: CaptureSet["tiles"];
  readiness: "verified";
  completeImagery: false;
  reusedTiles: string[];
  capturedTiles: string[];
}

type PreparedCapture = {
  workspace: CaptureWorkspace;
  plan: CapturePlan;
  standingPoint: CapturePosition | null;
  checkpoints: Map<string, CaptureTileCheckpoint>;
  reused: Set<string>;
  captureCleanup?: ContentIdentity;
  failure?: unknown;
};

export async function validateReusedCaptureTile(store: ArtifactStore, tile: CapturePlan["tiles"][number], candidate: ReusableCaptureTile, plan: CapturePlan): Promise<void> {
  const checkpoint = candidate.checkpoint;
  const responseReference = findResponseReference(checkpoint.artifacts, tile.id);
  if (responseReference === undefined) throw new Error(`Reused tile "${tile.id}" has no native response.`);
  const response = await readCaptureArtifactJson(store, responseReference.content);
  assertSchema(CaptureSessionSchema, response, "Reused capture response");
  const capture = response.lastCapture?.captures.find(candidate => candidate.tileId === tile.id);
  if (capture === undefined || capture.width !== plan.width || capture.height !== plan.height || capture.frame !== capture.restoredFrame) throw new Error("Reused capture metadata disagrees with its plan.");
  assertFrameMatches(capture, tile.frame, tile.id);
  const readiness = await readCaptureArtifactJson(store, checkpoint.artifacts.readiness.content);
  assertSchema(CaptureReadinessSchema, readiness, "Reused capture readiness");
  if (!readinessCovers(readiness, tile)) throw new Error("Reused readiness does not cover the tile.");
  assertRestorationAudit(await readCaptureArtifactJson(store, checkpoint.artifacts.restoration.content), tile, checkpoint.origin.captureKey, capture.frame, plan.lighting);
  const image = await hashPng(store.objectPath(checkpoint.artifacts.image.content.sha256), plan.width, plan.height, tile.id);
  if (image.sha256 !== checkpoint.artifacts.image.content.sha256) throw new Error("Reused image disagrees with its checkpoint.");
  const raster = await readCaptureArtifactJson(store, checkpoint.artifacts.raster.content);
  if (!isDeepStrictEqual(raster, registerRaster(capture, image))) throw new Error("Reused raster disagrees with its native camera controls.");
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
  run: CaptureWorkspace;
  visit?: SceneVisit;
  transitionOrdinal: number;
  sceneTransitions: CaptureArtifact[];
  plans: CaptureSweep["plans"];
  pending: PreparedCapture[];
  start: (targetSceneNativeId: number, timeoutMs: number, capturePosition: CapturePosition | null) => Promise<SceneVisit>;
  retarget: (targetSceneNativeId: number, timeoutMs: number, capturePosition: CapturePosition | null) => Promise<SceneVisit>;
  restore: (timeoutMs: number) => Promise<SceneVisit>;
  failure?: { planRunId: string; phase: string };
};

async function capturePlan(
  runtime: Runtime,
  config: CompendiumConfig,
  identity: CaptureBuildIdentity,
  plan: CapturePlan,
  planDirectory: string,
  sweep: CaptureSweepContext,
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
  const planBytes = new TextEncoder().encode(planText);
  const store = new ArtifactStore(config.outputRoot);
  const storedPlan = await sweep.run.run.putBytes(planBytes);
  const storedProfile = await sweep.run.run.putBytes(spatialProfile.bytes);
  const surveyPath = plan.survey === undefined ? null : resolve(planDirectory, plan.survey.path);
  const storedSurvey = surveyPath === null ? null : await sweep.run.run.putFile(surveyPath);
  const evidenceInputs: Record<string, ContentIdentity> = {};
  for (const [index, evidence] of spatialProfile.evidence.entries()) {
    const content = await sweep.run.run.putBytes(evidence);
    evidenceInputs[`spatial-evidence:${index}`] = { sha256: content.sha256, bytes: content.bytes };
  }
  const policy = "compendium.capture-visual-policy.v5";
  // The survey is a plan input: the player stands on the walkable surface it describes, at the
  // point nearest the map centre. That standing point decides what the game shows, so it is part
  // of every tile's compatibility key and is recorded with the capture set.
  const survey: NavigationSurvey | null = surveyPath === null ? null : await loadNavigationSurvey(surveyPath, plan.survey!, plan.sceneNativeId);
  const standingPoint: CapturePosition | null = survey === null ? null : capturePositionFor(plan, survey);
  const fingerprintInput = await captureRunInput({
    buildId: identity.buildId,
    diagnosticRevision: identity.diagnosticRevision,
    character: config.character,
    policy,
    plan: { sha256: storedPlan.sha256, bytes: storedPlan.bytes },
    profile: { sha256: storedProfile.sha256, bytes: storedProfile.bytes },
    survey: storedSurvey === null ? null : { sha256: storedSurvey.sha256, bytes: storedSurvey.bytes },
    evidence: evidenceInputs,
    settings: { buildHashes: identity.inputHashes, ownerSourceHash: runtime.ownerSourceHash, standingPoint },
  });
  const inputHashes: Record<string, string> = {
    ...identity.inputHashes,
    "runtime-owner": runtime.ownerSourceHash,
    plan: storedPlan.sha256,
    "map-space-profile": storedProfile.sha256,
    "tool:capture-fingerprint": fingerprintInput.implementationFingerprint,
    ...Object.fromEntries(Object.entries(fingerprintInput.probeHashes).map(([name, sha256]) => [`probe:${name}`, sha256])),
  };
  const compatibility = new Map(plan.tiles.map(tile => [tile.id, tileCompatibilityKey({
    buildId: identity.buildId,
    buildHashes: identity.inputHashes,
    profileSha256: spatialProfile.sha256,
    pipelineHashes: inputHashes,
    character: config.character,
    plan,
    tile,
    standingPoint,
  })]));

  const run = await beginCaptureWorkspace(store, fingerprintInput);
  const checkpoints = new Map<string, CaptureTileCheckpoint>();
  const reused = new Set<string>();
  const prepared: PreparedCapture = { workspace: run, plan, standingPoint, checkpoints, reused };
  sweep.pending.push(prepared);
  try {
    await run.run.setPhase("execution");
    const reusable = await findReusableTiles({ store, buildId: identity.buildId, currentRunId: run.run.runId, compatibility, plan });
    for (const tile of plan.tiles) {
      const candidate = reusable.get(tile.id);
      if (candidate === undefined) continue;
      // Reject contradictory evidence before the new run registers the candidate's immutable references.
      try {
        await validateReusedCaptureTile(store, tile, candidate, plan);
      } catch (error) {
        console.warn(`Capture cache candidate rejected: ${candidate.sourceRun.runId}: ${error instanceof Error ? error.message : String(error)}`);
        continue;
      }
      const checkpoint = await reuseCaptureTile(run, candidate);
      checkpoints.set(tile.id, checkpoint);
      reused.add(tile.id);
    }

    await mkdir(resolve(run.directory, "raw"), { recursive: true });
    const inventoryPath = resolve(run.directory, "raw/world-inventory.json");
    const inventoryReply = await runtime.runProbe(await createWorldInventoryBundle(), inventoryPath, {
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
      // Every surveyed plan places the player on its reviewed walkable surface, including when
      // consecutive plans share one merged scene. A plan without a survey keeps the arrival point.
      if (sweep.visit === undefined) sweep.visit = await sweep.start(plan.sceneNativeId, plan.readiness.timeoutMs, standingPoint);
      else if (inventoryReply.observationContext.completed.gameSceneNativeId !== plan.sceneNativeId || standingPoint !== null) sweep.visit = await sweep.retarget(plan.sceneNativeId, plan.readiness.timeoutMs, standingPoint);
      const activeVisit = sweep.visit;
      if (activeVisit === undefined || activeVisit.sceneNativeId !== plan.sceneNativeId || !activeVisit.sceneReady) {
        throw new Error("The scene transition did not reach the capture scene.");
      }
    }

    await mkdir(resolve(run.directory, "tiles"), { recursive: true });
    const probeSource = captureSessionSource;
    const prelude = captureVisualsSource;
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
    const startReply = await runtime.probe(probeSource, resolve(run.directory, startPath), { prelude, parameters: { action: "start", ...baseParameters }, timeoutMs: plan.readiness.timeoutMs });
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
    type RenderedTile = { capture: CapturedTile; responseArtifact: CaptureArtifact; imageArtifact: CaptureArtifact; restorationArtifact: CaptureArtifact; rasterArtifact: CaptureArtifact };
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
      const reply = await runtime.probe(probeSource, responsePath, {
        prelude,
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

    const checkpointTile = async (tile: CapturePlan["tiles"][number], rendered: RenderedTile, readiness: CaptureReadiness, readinessArtifact: CaptureArtifact): Promise<void> => {
      const inventoryArtifact = [...run.artifacts.values()].find(reference => reference.content.sha256 === readiness.inventory.sha256)!;
      const inventoryContextArtifact = [...run.artifacts.values()].find(reference => reference.content.sha256 === readiness.context.sha256)!;
      const nativeContext = [rendered.responseArtifact, inventoryArtifact, inventoryContextArtifact];
      if (readiness.streamKey !== null) {
        const cleanup = run.artifacts.get(`${readinessArtifact.name.slice(0, -"/readiness.json".length)}/stream-cleanup.json`);
        if (cleanup === undefined) throw new Error("Stream cleanup evidence was not registered.");
        nativeContext.push(cleanup);
      }
      const checkpoint: CaptureTileCheckpoint = {
        schemaVersion: "compendium.capture-tile-checkpoint.v2",
        tileId: tile.id,
        compatibilityKey: compatibility.get(tile.id)!,
        artifacts: { image: rendered.imageArtifact, raster: rendered.rasterArtifact, readiness: readinessArtifact, restoration: rendered.restorationArtifact, nativeContext },
        origin: { runId: run.run.runId, ownerToken: runtime.ownerToken, captureKey },
      };
      checkpoints.set(tile.id, checkpoint);
    };

    const pending = plan.tiles.filter(tile => !reused.has(tile.id));
    // One readiness for the whole map: it holds every required source for the whole batch, so
    // nothing loads or unloads between tiles and every tile renders under the same observation.
    // The render runs inside the readiness scope: readiness holds every required loader only
    // until it returns, and a loader beyond the player's load distance unloads the moment its
    // hold is released, taking its objects out of the frame.
    if (pending.length > 0) {
      const extent = mapExtentSubject(plan, pending);
      const observed = await withCaptureGeometry(runtime, config, run, plan, extent, async readiness => {
        if (readiness.sceneHandle !== sceneHandle) throw new Error("Geometry readiness belongs to another scene instance.");
        return renderBatch(pending, readiness, `${plan.mapSpaceId}-batch`);
      });
      for (const tile of pending) await checkpointTile(tile, observed.value.get(tile.id)!, observed.readiness, observed.artifact);
    }

    const restoredPath = "capture-restored.json";
    const restoredReply = await runtime.probe(probeSource, resolve(run.directory, restoredPath), {
      prelude,
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

    prepared.captureCleanup = captureCleanupArtifact.content;
    return prepared;
  } catch (error) {
    prepared.failure = error;
    sweep.failure = { planRunId: run.run.runId, phase: "plan-capture" };
    throw error;
  }
}

export type CapturePlanInput = { plan: CapturePlan; path: string };

export async function capture(
  runtime: Runtime,
  config: CompendiumConfig,
  identity: CaptureBuildIdentity,
  planInputs: CapturePlanInput[],
  options: { select?: boolean } = {},
) {
  if (planInputs.length === 0) throw new Error("Capture requires at least one plan.");
  const plans = planInputs.map(input => input.plan);
  const finalScene = { nativeId: config.finalSceneNativeId, path: config.finalScenePath };
  plans.forEach(validateCapturePlan);
  if (config.mapSpaceProfile === undefined) throw new Error("Capture requires config.mapSpaceProfile.");
  const sweepStore = new ArtifactStore(config.outputRoot);
  const inputLease = await createArtifactLease(sweepStore, { runId: randomUUID(), buildId: identity.buildId, operation: "capture-inputs", objects: [] });
  let sweepRun: CaptureWorkspace;
  try {
  const combinedPlan = await sweepStore.putBytes(new TextEncoder().encode(`${JSON.stringify(plans)}\n`), inputLease);
  const profile = await sweepStore.putFile(config.mapSpaceProfile, inputLease);
  const sweepInput = await captureRunInput({
    buildId: identity.buildId,
    diagnosticRevision: identity.diagnosticRevision,
    character: config.character,
    policy: "compendium.capture-visual-policy.v5",
    plan: { sha256: combinedPlan.sha256, bytes: combinedPlan.bytes },
    profile: { sha256: profile.sha256, bytes: profile.bytes },
    survey: null,
    settings: { finalScene, planCount: plans.length },
  });
  sweepRun = await beginCaptureWorkspace(sweepStore, { ...sweepInput, operation: "capture-sweep" });
  } finally { await inputLease.release(); }
  const sweep: CaptureSweepContext = {
    finalSceneNativeId: finalScene.nativeId,
    finalScenePath: finalScene.path,
    run: sweepRun,
    transitionOrdinal: 0,
    sceneTransitions: [],
    plans: [],
    pending: [],
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
    // Stream restoration can briefly hold scene readiness after a completed plan. Poll that
    // existing visit before retargeting; retarget itself correctly rejects an unready scene.
    let retargetStarted = action !== "retarget";
    let nextAction: "start" | "retarget" | "poll" | "restore" = action === "retarget" ? "poll" : action;
    while (true) {
      runtime.signal.throwIfAborted();
      if (Date.now() >= deadline) throw timeout;
      const path = nextAction === "start" ? "scene-start.json" : nextAction === "retarget" ? `scene-retarget-${transitionOrdinal}-${targetSceneNativeId}.json` : action === "restore" ? "scene-final.json" : `scene-ready-${transitionOrdinal}.json`;
      const observedTarget = action === "restore" || (action === "retarget" && !retargetStarted) ? previous?.targetSceneNativeId : targetSceneNativeId;
      const parameters: Record<string, unknown> = { researchCharacter: config.character, action: nextAction, key, targetSceneNativeId: observedTarget, capturePosition };
      if (nextAction === "start") {
        parameters.finalSceneNativeId = sweep.finalSceneNativeId;
        parameters.finalScenePath = sweep.finalScenePath;
      }
      // Scene loading and post-placement asset bursts stall the main thread; a transition poll
      // tolerates that with the readiness budget instead of the per-call default.
      const reply = await runtime.probe(sceneVisitSource, resolve(sweep.run.directory, path), { parameters, timeoutMs });
      assertSchema(SceneVisitSchema, reply.value, "Capture scene transition");
      const state = reply.value;
      sweep.visit = state;
      if (key !== undefined && state.key !== key) throw new Error("Capture scene transition returned another owner key.");
      if (started !== undefined && (state.sourceSceneNativeId !== started.sourceSceneNativeId || state.sourceSceneHandle !== started.sourceSceneHandle || !isDeepStrictEqual(state.sourcePosition, started.sourcePosition) || !isDeepStrictEqual(state.sourceRotation, started.sourceRotation))) throw new Error("Capture scene transition changed its restoration target.");
      started ??= state;
      key = state.key;
      if (action === "retarget" && !retargetStarted) {
        if (state.phase !== "ready") throw new Error("Capture scene visit is not ready to retarget.");
        if (state.sceneReady) {
          retargetStarted = true;
          nextAction = "retarget";
          continue;
        }
        await Bun.sleep(500);
        continue;
      }
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
  const results: CapturePlanResult[] = [];
  try {
  try {
    await sweep.run.run.setPhase("execution");
    for (const input of planInputs) await capturePlan(runtime, config, identity, input.plan, dirname(resolve(input.path)), sweep);
    if (sweep.visit !== undefined && sweep.visit.phase !== "restored") sweep.visit = await sweep.restore(plans.at(-1)!.readiness.timeoutMs);
    await runtime.complete();
    await sweep.run.run.setPhase("finalization");
    const cleanup = await registerSweepCleanup(runtime, sweep);
    for (const pending of sweep.pending) {
      const result = await finalizeCapture(pending, cleanup, identity.buildId);
      results.push(result);
      sweep.plans.push({ runId: pending.workspace.run.runId, manifest: result.manifest, sceneNativeId: pending.plan.sceneNativeId, scenePath: pending.plan.scenePath, mapSpaceId: pending.plan.mapSpaceId });
    }
    const evidence: CaptureSweep = { schemaVersion: "compendium.capture-sweep.v4", runId: sweep.run.run.runId, ownerToken: runtime.ownerToken, finalScene, plans: sweep.plans, cleanup, completed: true };
    assertSchema(CaptureSweepSchema, evidence, "Capture sweep evidence");
    await Bun.write(resolve(sweep.run.directory, "sweep.json"), `${JSON.stringify(evidence, null, 2)}\n`);
    await sweep.run.registerFile("sweep.json", { references: [...objectReferences([cleanup]), ...sweep.plans.map(plan => ({ kind: "run-manifest" as const, content: plan.manifest }))] });
    await sweep.run.run.succeed();
  } catch (error) {
    const failures: unknown[] = [error];
    if (sweep.visit !== undefined && sweep.visit.phase !== "restored" && !runtime.signal.aborted) {
      try { sweep.visit = await sweep.restore(plans.at(-1)!.readiness.timeoutMs); }
      catch (restoreError) { failures.push(restoreError); runtime.cancel(restoreError); }
    }
    try { await runtime.close(); } catch (cleanupError) { failures.push(cleanupError); }
    let cleanup: ContentIdentity | undefined;
    try { cleanup = await registerSweepCleanup(runtime, sweep); } catch (cleanupError) { failures.push(cleanupError); }
    for (const pending of sweep.pending) {
      // A sealed successful plan remains immutable if later sweep finalization fails.
      if (pending.workspace.run.status !== "running") continue;
      try { await pending.workspace.preserveFailureEvidence(); } catch (retentionError) { failures.push(retentionError); }
      try { if (cleanup !== undefined) await registerCheckpointCleanup(pending, cleanup); } catch (cleanupError) { failures.push(cleanupError); }
      try { await registerChunkOutcomes(pending, pending.failure ?? error); } catch (retentionError) { failures.push(retentionError); }
      try { await pending.workspace.run.fail(pending.failure ?? error); } catch (retentionError) { failures.push(retentionError); }
    }
    try {
      if (await Bun.file(runtime.cleanupReceiptPath).exists() && !sweep.run.artifacts.has("runtime-cleanup.json")) {
        await Bun.write(resolve(sweep.run.directory, "runtime-cleanup.json"), Bun.file(runtime.cleanupReceiptPath));
        await sweep.run.registerFile("runtime-cleanup.json");
      }
      await sweep.run.preserveFailureEvidence();
      if (sweep.run.run.status === "running") await sweep.run.run.fail(new AggregateError(failures, "Capture sweep failed."));
    } catch (retentionError) { failures.push(retentionError); }
    throw new AggregateError(failures, `Capture sweep failed. Evidence: ${sweep.run.run.manifestPath}`);
  }
  if (options.select === true) {
    for (const result of results) await selectLatestSuccess(sweepStore, result.manifestPath);
    await selectLatestSuccess(sweepStore, sweep.run.run.manifestPath);
  }
  return { plans: results, finalScene, sweepManifest: sweep.run.run.manifestIdentity!, sweepManifestPath: sweep.run.run.manifestPath };
  } finally {
    await Promise.all([...sweep.pending.map(pending => pending.workspace.dispose()), sweep.run.dispose()]);
  }
}

async function registerSweepCleanup(runtime: Runtime, sweep: CaptureSweepContext): Promise<ContentIdentity> {
  const receipt = await Bun.file(runtime.cleanupReceiptPath).json();
  assertSchema(RuntimeCleanupReceiptSchema, receipt, "Runtime cleanup receipt");
  if (receipt.token !== runtime.ownerToken || receipt.state !== "clean" || receipt.callbacksRemaining !== 0 || receipt.cleanupErrors.length !== 0) throw new Error("Runtime cleanup is uncertain.");
  if (sweep.visit !== undefined && (sweep.visit.phase !== "restored" || !sweep.visit.sceneReady || sweep.visit.sceneNativeId !== sweep.finalSceneNativeId)) throw new Error("Capture final scene is not verified.");
  await Bun.write(resolve(sweep.run.directory, "runtime-cleanup.json"), Bun.file(runtime.cleanupReceiptPath));
  const runtimeCleanup = await sweep.run.registerFile("runtime-cleanup.json");
  const proof = { schemaVersion: "compendium.capture-sweep-cleanup.v1" as const, runId: sweep.run.run.runId, ownerToken: runtime.ownerToken, planRunIds: sweep.pending.map(pending => pending.workspace.run.runId), finalScene: { nativeId: sweep.finalSceneNativeId, path: sweep.finalScenePath }, sceneTransitions: sweep.sceneTransitions, runtimeCleanup };
  assertSchema(CaptureSweepCleanupSchema, proof, "Sweep cleanup proof");
  await Bun.write(resolve(sweep.run.directory, "sweep-cleanup.json"), `${JSON.stringify(proof, null, 2)}\n`);
  return (await sweep.run.registerFile("sweep-cleanup.json", { references: objectReferences([runtimeCleanup.content, ...sweep.sceneTransitions.map(reference => reference.content)]) })).content;
}

async function registerCheckpointCleanup(pending: PreparedCapture, sweep: ContentIdentity): Promise<void> {
  const { workspace } = pending;
  const capture = pending.captureCleanup ?? workspace.artifacts.get("capture-cleanup.json")?.content;
  for (const checkpoint of pending.checkpoints.values()) {
    if (!pending.reused.has(checkpoint.tileId)) {
      if (capture === undefined) continue;
      checkpoint.artifacts.cleanup = { capture, sweep };
      try {
        const responseReference = findResponseReference(checkpoint.artifacts, checkpoint.tileId);
        if (responseReference === undefined) throw new Error("Capture checkpoint has no native response.");
        const response = await readCaptureArtifactJson(workspace.store, responseReference.content);
        assertSchema(CaptureSessionSchema, response, "Capture response");
        await validateCaptureCleanup(workspace.store, checkpoint, response.resourcePrefix);
      } catch (error) { delete checkpoint.artifacts.cleanup; throw error; }
      const proof = await readCaptureArtifactJson(workspace.store, sweep);
      assertSchema(CaptureSweepCleanupSchema, proof, "Sweep cleanup proof");
      await workspace.registerObject("sweep-cleanup.json", sweep, { schemaId: proof.schemaVersion, references: objectReferences([proof.runtimeCleanup.content, ...proof.sceneTransitions.map(reference => reference.content)]) });
    }
    await writeTileCheckpoint(workspace, checkpoint);
  }
}

async function registerChunkOutcomes(pending: PreparedCapture, failure?: unknown): Promise<void> {
  const tiles = [];
  const references: ContentIdentity[] = [];
  for (const tile of pending.plan.tiles) {
    const checkpoint = pending.checkpoints.get(tile.id);
    const registered = pending.workspace.artifacts.get(`tiles/${tile.id}.checkpoint.json`);
    if (checkpoint !== undefined && checkpoint.artifacts.cleanup !== undefined && registered !== undefined) {
      const readiness = await readCaptureArtifactJson(pending.workspace.store, checkpoint.artifacts.readiness.content);
      assertSchema(CaptureReadinessSchema, readiness, "Chunk readiness");
      tiles.push({ tileId: tile.id, state: readiness.empty ? "verified-empty" : "captured", checkpoint: registered.content });
      references.push(registered.content);
    } else {
      tiles.push({ tileId: tile.id, state: "failed", error: failure instanceof Error ? failure.message : String(failure ?? "Cleanup was not verified.") });
    }
  }
  const evidence = { schemaVersion: "compendium.capture-outcomes.v1", tiles };
  assertSchema(CaptureChunkOutcomesSchema, evidence, "Capture chunk outcomes");
  const content = await pending.workspace.run.putBytes(new TextEncoder().encode(JSON.stringify(evidence)));
  await pending.workspace.registerObject("capture-outcomes.json", content, { mediaType: "application/json", schemaId: evidence.schemaVersion, references: objectReferences(references) });
}

async function finalizeCapture(pending: PreparedCapture, cleanup: ContentIdentity, buildId: string): Promise<CapturePlanResult> {
  await pending.workspace.run.setPhase("finalization");
  await registerCheckpointCleanup(pending, cleanup);
  const { workspace, plan, checkpoints, reused } = pending;
  if ([...checkpoints.values()].some(checkpoint => checkpoint.artifacts.cleanup === undefined)) throw new Error("Capture checkpoints have no cleanup proof.");
  const set = await writeCaptureSet(workspace, plan, buildId, pending.standingPoint, checkpoints, reused);
  await registerChunkOutcomes(pending);
  await workspace.run.succeed();
  return { manifest: workspace.run.manifestIdentity!, manifestPath: workspace.run.manifestPath, captureSet: workspace.artifacts.get("capture-set.json")!.content, tiles: set.tiles, readiness: "verified", completeImagery: false, reusedTiles: [...reused], capturedTiles: plan.tiles.filter(tile => !reused.has(tile.id)).map(tile => tile.id) };
}

