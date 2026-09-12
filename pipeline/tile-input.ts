import { createHash } from "node:crypto";
import { realpath } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { Assert } from "typebox/value";
import { CapturePlanSchema, CaptureRasterSchema, CaptureReadinessSchema, CaptureSetSchema, type CapturePlan, type CaptureRaster, type CaptureReadiness, type CaptureSet } from "../tools/capture-contracts";
import { readinessCovers } from "../tools/capture-cache";
import { loadSpatialProfile } from "../tools/spatial-extraction";
import { loadVerifiedRun } from "../tools/runs";
import type { MapSpaceProfile } from "../tools/spatial-contracts";
import { TilePlanSchema, type TilePlan, type TileReference, type TileSourceProvenance } from "./tile-contracts";

const HASH = /^[a-f0-9]{64}$/;
const EPSILON = 1e-7;

type JsonObject = Record<string, unknown>;

export type SourceTile = {
  id: string;
  compatibilityKey: string;
  status: "captured" | "reused";
  empty: boolean;
  origin: { runId: string; ownerToken: string; captureKey: string };
  imagePath: string;
  imageBytes: Uint8Array;
  image: TileReference;
  rasterPath: string;
  raster: TileReference;
  readinessPath: string;
  readiness: TileReference;
  restoration: TileReference;
  nativeContext: TileReference[];
  rasterValue: CaptureRaster;
  readinessValue: CaptureReadiness;
  sourcePath: string;
  sourceSha256: string;
  runId: string;
  captureSetPath: string;
  captureSetSha256: string;
  sceneNativeId: number;
  scenePath: string;
  // Where the player stood for this observation; null for a plan without a survey.
  standingPoint: { x: number; y: number; z: number } | null;
  mapSpaceId: string;
  width: number;
  height: number;
};

export type LoadedTileInputs = {
  plan: TilePlan;
  planPath: string;
  planSha256: string;
  profile: MapSpaceProfile;
  profileRef: TileReference;
  profilePath: string;
  sources: Array<{
    sourcePath: string;
    sourceSha256: string;
    runId: string;
    captureSetPath: string;
    captureSetSha256: string;
    captureSet: CaptureSet;
    tiles: SourceTile[];
    planPath: string;
  }>;
  provenance: TileSourceProvenance[];
};

function fail(message: string): never {
  throw new Error(`Tile input rejected: ${message}`);
}

function asObject(value: unknown, label: string): JsonObject {
  if (value === null || typeof value !== "object" || Array.isArray(value)) fail(`${label} must be an object`);
  return value as JsonObject;
}

function asString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) fail(`${label} must be a non-empty string`);
  return value;
}

function asHash(value: unknown, label: string): string {
  const result = asString(value, label);
  if (!HASH.test(result)) fail(`${label} must be a lowercase SHA-256 hash`);
  return result;
}

function sameNumber(left: number, right: number, tolerance = EPSILON): boolean {
  return Math.abs(left - right) <= tolerance * Math.max(1, Math.abs(left), Math.abs(right));
}

function readJson(bytes: Uint8Array, label: string): unknown {
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch (error) {
    fail(`${label} is not valid JSON (${error instanceof Error ? error.message : String(error)})`);
  }
}

async function readHashed(reference: TileReference, baseDirectory: string, label: string, containmentRoot?: string): Promise<{ path: string; bytes: Uint8Array }> {
  if (isAbsolute(reference.path) || reference.path.includes("\\") || reference.path.includes("\0")) {
    fail(`${label} path must be relative to its plan or manifest`);
  }
  let path = resolve(baseDirectory, reference.path);
  if (containmentRoot !== undefined) {
    try {
      const [rootPath, targetPath] = await Promise.all([realpath(containmentRoot), realpath(path)]);
      const targetRelative = relative(rootPath, targetPath);
      if (targetRelative.length === 0 || targetRelative === ".." || targetRelative.startsWith("../") || targetRelative.startsWith("..\\") || isAbsolute(targetRelative)) fail(`${label} path escapes its run directory`);
      path = targetPath;
    } catch (error) {
      fail(`${label} path cannot be resolved within its run directory: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  let bytes: Uint8Array;
  try {
    bytes = await Bun.file(path).bytes();
  } catch (error) {
    fail(`${label} is absent at ${reference.path}: ${error instanceof Error ? error.message : String(error)}`);
  }
  const actual = createHash("sha256").update(bytes).digest("hex");
  if (actual !== reference.sha256) fail(`${label} hash mismatch for ${reference.path}`);
  return { path, bytes };
}

function ref(value: unknown, label: string): TileReference {
  const object = asObject(value, label);
  return { path: asString(object.path, `${label}.path`), sha256: asHash(object.sha256, `${label}.sha256`) };
}

function assertPlan(value: unknown): TilePlan {
  try {
    Assert(TilePlanSchema, value);
  } catch (error) {
    fail(`plan does not satisfy compendium.tile-plan.v2: ${error instanceof Error ? error.message : String(error)}`);
  }
  return value as TilePlan;
}

function assertCapturePlan(value: unknown): CapturePlan {
  try {
    Assert(CapturePlanSchema, value);
  } catch (error) {
    fail(`capture plan does not satisfy compendium.capture-plan.v8: ${error instanceof Error ? error.message : String(error)}`);
  }
  return value as CapturePlan;
}

function assertCaptureSet(value: unknown): CaptureSet {
  try {
    Assert(CaptureSetSchema, value);
  } catch (error) {
    fail(`capture set does not satisfy compendium.capture-set.v3: ${error instanceof Error ? error.message : String(error)}`);
  }
  return value as CaptureSet;
}

function assertRaster(value: unknown): CaptureRaster {
  try {
    Assert(CaptureRasterSchema, value);
  } catch (error) {
    fail(`raster does not satisfy compendium.capture-raster.v5: ${error instanceof Error ? error.message : String(error)}`);
  }
  return value as CaptureRaster;
}

function assertReadiness(value: unknown): CaptureReadiness {
  try {
    Assert(CaptureReadinessSchema, value);
  } catch (error) {
    fail(`readiness does not satisfy compendium.capture-readiness.v5: ${error instanceof Error ? error.message : String(error)}`);
  }
  return value as CaptureReadiness;
}

function profileBinding(profile: MapSpaceProfile, sceneNativeId: number, scenePath: string, mapSpaceId: string): MapSpaceProfile["bindings"][number] {
  const matches = profile.bindings.filter(binding => binding.sceneNativeId === sceneNativeId && binding.scenePath === scenePath && binding.mapSpaceId === mapSpaceId);
  if (matches.length !== 1) fail(`scene ${sceneNativeId} at ${scenePath} has ${matches.length} reviewed bindings for map space ${mapSpaceId}`);
  return matches[0]!;
}

function validateDomain(binding: MapSpaceProfile["bindings"][number], raster: CaptureRaster): void {
  const corners = [
    raster.worldFromPixelEdge.origin,
    { x: raster.worldFromPixelEdge.origin.x + raster.worldFromPixelEdge.xAxis.x * raster.width, z: raster.worldFromPixelEdge.origin.z + raster.worldFromPixelEdge.xAxis.z * raster.width },
    { x: raster.worldFromPixelEdge.origin.x + raster.worldFromPixelEdge.yAxis.x * raster.height, z: raster.worldFromPixelEdge.origin.z + raster.worldFromPixelEdge.yAxis.z * raster.height },
    { x: raster.worldFromPixelEdge.origin.x + raster.worldFromPixelEdge.xAxis.x * raster.width + raster.worldFromPixelEdge.yAxis.x * raster.height, z: raster.worldFromPixelEdge.origin.z + raster.worldFromPixelEdge.xAxis.z * raster.width + raster.worldFromPixelEdge.yAxis.z * raster.height },
  ];
  if (binding.domain.kind === "scene") return;
  const rasterMinX = Math.min(...corners.map(corner => corner.x));
  const rasterMaxX = Math.max(...corners.map(corner => corner.x));
  const rasterMinZ = Math.min(...corners.map(corner => corner.z));
  const rasterMaxZ = Math.max(...corners.map(corner => corner.z));
  const overlaps = binding.domain.boxes.some(box => rasterMaxX > box.min.x && rasterMinX < box.max.x
    && rasterMaxZ > box.min.z && rasterMinZ < box.max.z);
  if (!overlaps) fail(`raster ${raster.tileId} lies outside reviewed map-space domain`);
}

function validateRasterAgainstFrame(raster: CaptureRaster, capturePlan: CapturePlan): void {
  if (!(raster.verticalBounds.minY < raster.verticalBounds.maxY)) fail(`raster ${raster.tileId} has an invalid vertical clipping interval`);
  if (raster.maximumProjectionErrorPixels > 0.25) fail(`raster ${raster.tileId} exceeds the quarter-pixel projection tolerance`);
  const xLength = Math.hypot(raster.worldFromPixelEdge.xAxis.x, raster.worldFromPixelEdge.xAxis.z);
  const yLength = Math.hypot(raster.worldFromPixelEdge.yAxis.x, raster.worldFromPixelEdge.yAxis.z);
  if (!(xLength > 0) || !(yLength > 0)) fail(`raster ${raster.tileId} has a degenerate pixel frame`);
  const tile = capturePlan.tiles.find(candidate => candidate.id === raster.tileId);
  if (tile === undefined) fail(`capture plan has no tile ${raster.tileId}`);
  // The tile frame is the camera frame.
  const expectedFrame = tile.frame;
  for (const field of ["x", "z"] as const) {
    if (!sameNumber(raster.cameraFrame.center[field], expectedFrame.center[field]) || !sameNumber(raster.cameraFrame.worldSize[field], expectedFrame.worldSize[field])) {
      fail(`raster ${raster.tileId} camera frame contradicts its capture intent`);
    }
  }
  if (!sameNumber(raster.cameraFrame.cameraY, expectedFrame.cameraY) || !sameNumber(raster.cameraFrame.nearClip, expectedFrame.nearClip) || !sameNumber(raster.cameraFrame.farClip, expectedFrame.farClip)) {
    fail(`raster ${raster.tileId} camera frame contradicts its plan`);
  }
  if (!sameNumber(raster.verticalBounds.minY, raster.cameraFrame.cameraY - raster.cameraFrame.farClip)
    || !sameNumber(raster.verticalBounds.maxY, raster.cameraFrame.cameraY - raster.cameraFrame.nearClip)) {
    fail(`raster ${raster.tileId} vertical bounds contradict its camera frame`);
  }
  const expectedX = tile.frame.center.x - tile.frame.worldSize.x / 2;
  const xExtent = raster.worldFromPixelEdge.xAxis.x * raster.width;
  const zExtent = raster.worldFromPixelEdge.yAxis.z * raster.height;
  if (!sameNumber(raster.worldFromPixelEdge.origin.x, expectedX) || !sameNumber(raster.worldFromPixelEdge.origin.z, tile.frame.center.z + tile.frame.worldSize.z / 2)
    || !sameNumber(xExtent, tile.frame.worldSize.x) || !sameNumber(zExtent, -tile.frame.worldSize.z)
    || !sameNumber(raster.worldFromPixelEdge.xAxis.z, 0) || !sameNumber(raster.worldFromPixelEdge.yAxis.x, 0)) {
    fail(`raster ${raster.tileId} frame contradicts the native capture camera frame`);
  }
}

async function loadSource(reference: TileReference, planDirectory: string, profile: MapSpaceProfile, plan: TilePlan): Promise<LoadedTileInputs["sources"][number]> {
  const sourcePath = resolve(planDirectory, reference.path);
  const verified = await loadVerifiedRun(sourcePath, reference.sha256, plan.buildId, "capture");
  const runDirectory = verified.directory;
  const manifest = verified.manifest;
  const input = manifest.input;
  const runId = manifest.runId;
  const artifacts = manifest.artifacts;
  const readRunArtifact = async (artifactReference: TileReference, label: string): Promise<{ path: string; bytes: Uint8Array }> => {
    try {
      const artifact = await verified.readArtifact(artifactReference.path);
      if (artifact.reference.sha256 !== artifactReference.sha256) fail(`${label} hash differs from its registered run artifact`);
      return { path: await realpath(resolve(runDirectory, artifactReference.path)), bytes: artifact.bytes };
    } catch (error) {
      fail(`${label} cannot be read from its successful run: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  const profileCandidates = artifacts.filter(candidate => candidate.path === "map-space-profile.json");
  if (profileCandidates.length !== 1) fail(`source run ${reference.path} must contain exactly one reviewed profile artifact`);
  const profileArtifact = profileCandidates[0]!;
  const sourceProfileReference: TileReference = { path: profileArtifact.path, sha256: profileArtifact.sha256 };
  if (sourceProfileReference.sha256 !== plan.profile.sha256) fail(`source run ${reference.path} archived profile differs from the selected profile`);
  const sourceProfileFile = await readRunArtifact(sourceProfileReference, "source map-space profile");
  if (sourceProfileFile.bytes.byteLength !== profileArtifact.bytes) fail(`source run ${reference.path} profile artifact byte count differs from its registered value`);
  const captureCandidates = artifacts.filter(candidate => candidate.path === "capture-set.json" || candidate.path.endsWith("/capture-set.json"));
  if (captureCandidates.length !== 1) fail(`source run ${reference.path} must contain exactly one capture-set.v3 artifact`);
  const captureArtifact = captureCandidates[0]!;
  const captureReference: TileReference = { path: captureArtifact.path, sha256: captureArtifact.sha256 };
  const captureFile = await readRunArtifact(captureReference, "capture set");
  if (captureFile.bytes.byteLength !== captureArtifact.bytes) fail(`source run ${reference.path} capture-set byte count differs from its registered value`);
  const captureSetValue = readJson(captureFile.bytes, `capture set ${captureReference.path}`);
  const captureSetPath = captureFile.path;
  const captureSetSha256 = captureReference.sha256;
  const planArtifact = artifacts.find(candidate => candidate.path === "plan.json");
  if (planArtifact === undefined) fail(`source run ${reference.path} has no capture plan artifact`);
  const planItem = planArtifact;
  const planReference: TileReference = { path: planItem.path, sha256: planItem.sha256 };
  const planFile = await readRunArtifact(planReference, "capture plan");
  if (planFile.bytes.byteLength !== planItem.bytes) fail(`source run ${reference.path} capture plan byte count differs from its registered value`);
  const capturePlan = assertCapturePlan(readJson(planFile.bytes, `capture plan ${planReference.path}`));
  const capturePlanPath = planFile.path;
  if (capturePlan.schemaVersion !== "compendium.capture-plan.v8") fail(`source run ${reference.path} uses an unsupported capture plan`);
  const capturePlanTileIds = new Set(capturePlan.tiles.map(tile => tile.id));
  if (capturePlanTileIds.size !== capturePlan.tiles.length) fail(`source run ${reference.path} capture plan repeats a tile ID`);
  const inputHashes = asObject(input.inputHashes, `source run ${reference.path}.inputHashes`);
  if (inputHashes.plan !== planReference.sha256) fail(`source run ${reference.path} capture plan hash differs from its registered artifact`);
  if (inputHashes["map-space-profile"] !== plan.profile.sha256) {
    fail(`source run ${reference.path} profile hash differs from the selected profile`);
  }
  const captureSet = assertCaptureSet(captureSetValue);
  if (captureSet.schemaVersion !== "compendium.capture-set.v3") fail(`source ${reference.path} is not capture-set.v3`);
  if (captureSet.buildId !== plan.buildId) fail(`source ${reference.path} build differs from plan`);
  if (captureSet.mapSpaceId !== plan.mapSpaceId) fail(`source ${reference.path} map space differs from plan`);
  if (capturePlan.sceneNativeId !== captureSet.sceneNativeId || capturePlan.scenePath !== captureSet.scenePath || capturePlan.mapSpaceId !== captureSet.mapSpaceId || capturePlan.width !== captureSet.width || capturePlan.height !== captureSet.height) {
    fail(`source ${reference.path} capture plan and capture set disagree`);
  }
  const expected = new Set(captureSet.expectedTiles);
  if (expected.size !== captureSet.expectedTiles.length || captureSet.tiles.length !== expected.size) fail(`source ${reference.path} has duplicate or absent expected capture tiles`);
  if (capturePlanTileIds.size !== expected.size || [...expected].some(tileId => !capturePlanTileIds.has(tileId))) fail(`source ${reference.path} capture plan and set expected tile identities disagree`);
  const tiles: SourceTile[] = [];
  for (const tile of captureSet.tiles) {
    if (!expected.has(tile.id)) fail(`source ${reference.path} contains unexpected tile ${tile.id}`);
    const image = ref(tile.artifacts.image, `${tile.id}.image`);
    const raster = ref(tile.artifacts.raster, `${tile.id}.raster`);
    const readiness = ref(tile.artifacts.readiness, `${tile.id}.readiness`);
    if (image.path !== `tiles/${tile.id}.png`) fail(`source ${reference.path} tile ${tile.id} is not a project capture image`);
    if (!image.path.toLowerCase().endsWith(".png")) fail(`source ${reference.path} tile ${tile.id} is not a native PNG capture`);
    const imageFile = await readRunArtifact(image, `${tile.id} image`);
    const rasterFile = await readRunArtifact(raster, `${tile.id} raster`);
    const readinessFile = await readRunArtifact(readiness, `${tile.id} readiness`);
    const restoration = ref(tile.artifacts.restoration, `${tile.id}.restoration`);
    const nativeContext = tile.artifacts.nativeContext.map((entry, index) => ref(entry, `${tile.id}.nativeContext[${index}]`));
    const restorationFile = await readRunArtifact(restoration, `${tile.id} restoration`);
    if (imageFile.bytes.byteLength !== tile.artifacts.image.bytes || rasterFile.bytes.byteLength !== tile.artifacts.raster.bytes || readinessFile.bytes.byteLength !== tile.artifacts.readiness.bytes) fail(`source ${reference.path} tile ${tile.id} artifact byte counts differ from their registered values`);
    if (restorationFile.bytes.byteLength !== tile.artifacts.restoration.bytes) fail(`source ${reference.path} tile ${tile.id} restoration byte count differs from its registered value`);
    for (const [index, nativeReference] of nativeContext.entries()) {
      const nativeFile = await readRunArtifact(nativeReference, `${tile.id} nativeContext[${index}]`);
      if (nativeFile.bytes.byteLength !== tile.artifacts.nativeContext[index]!.bytes) fail(`source ${reference.path} tile ${tile.id} native context byte count differs from its registered value`);
    }
    const rasterValue = assertRaster(readJson(rasterFile.bytes, `${tile.id} raster`));
    const readinessValue = assertReadiness(readJson(readinessFile.bytes, `${tile.id} readiness`));
    if (rasterValue.tileId !== tile.id || rasterValue.imageSha256 !== image.sha256 || rasterValue.width !== captureSet.width || rasterValue.height !== captureSet.height) fail(`source ${reference.path} tile ${tile.id} raster identity or dimensions disagree`);
    if (!readinessCovers(readinessValue, capturePlan.tiles.find(candidate => candidate.id === tile.id)!) || readinessValue.sceneNativeId !== captureSet.sceneNativeId || readinessValue.empty && readinessValue.stableFrames < 2) fail(`source ${reference.path} tile ${tile.id} readiness identity is invalid`);
    // A tile observed under its own readiness shares that readiness frame exactly. A
    // tile observed under its map's extent readiness is contained in it, already checked by
    // readinessCovers.
    const ownReadiness = readinessValue.tileId === tile.id;
    const frameAgrees = ownReadiness
      ? sameNumber(readinessValue.captureFrame.center.x, rasterValue.cameraFrame.center.x)
        && sameNumber(readinessValue.captureFrame.center.z, rasterValue.cameraFrame.center.z)
        && sameNumber(readinessValue.captureFrame.worldSize.x, rasterValue.cameraFrame.worldSize.x)
        && sameNumber(readinessValue.captureFrame.worldSize.z, rasterValue.cameraFrame.worldSize.z)
        && sameNumber(readinessValue.captureFrame.cameraY, rasterValue.cameraFrame.cameraY)
        && sameNumber(readinessValue.captureFrame.nearClip, rasterValue.cameraFrame.nearClip)
        && sameNumber(readinessValue.captureFrame.farClip, rasterValue.cameraFrame.farClip)
      : true;
    if (!frameAgrees) fail(`source ${reference.path} tile ${tile.id} readiness and raster frames disagree`);
    validateRasterAgainstFrame(rasterValue, capturePlan);
    const binding = profileBinding(profile, captureSet.sceneNativeId, captureSet.scenePath, plan.mapSpaceId);
    validateDomain(binding, rasterValue);
    if (capturePlan.width !== rasterValue.width || capturePlan.height !== rasterValue.height) fail(`source ${reference.path} tile ${tile.id} has inconsistent raster dimensions`);
    tiles.push({ id: tile.id, compatibilityKey: tile.compatibilityKey, status: tile.status, empty: readinessValue.empty, origin: tile.origin, imagePath: imageFile.path, imageBytes: imageFile.bytes, image, rasterPath: rasterFile.path, raster, readinessPath: readinessFile.path, readiness, restoration, nativeContext, rasterValue, readinessValue, sourcePath, sourceSha256: reference.sha256, runId, captureSetPath, captureSetSha256, sceneNativeId: captureSet.sceneNativeId, scenePath: captureSet.scenePath, standingPoint: captureSet.standingPoint, mapSpaceId: captureSet.mapSpaceId, width: captureSet.width, height: captureSet.height });
  }
  if (tiles.length === 0) fail(`source ${reference.path} has no capture tiles`);
  const settings = asObject(input.settings, `source run ${reference.path}.settings`);
  if (input.buildId !== plan.buildId || settings.sceneNativeId !== captureSet.sceneNativeId || settings.scenePath !== captureSet.scenePath || settings.mapSpaceId !== captureSet.mapSpaceId || settings.width !== captureSet.width || settings.height !== captureSet.height) fail(`source ${reference.path} run settings contradict capture set`);
  return { sourcePath, sourceSha256: reference.sha256, runId, captureSetPath, captureSetSha256, captureSet, tiles, planPath: capturePlanPath };
}

export async function loadTileInputs(planPath: string): Promise<LoadedTileInputs> {
  const absolutePlanPath = resolve(planPath);
  const planBytes = await Bun.file(absolutePlanPath).bytes();
  const planSha256 = createHash("sha256").update(planBytes).digest("hex");
  const plan = assertPlan(readJson(planBytes, "tile plan"));
  if (plan.schemaVersion !== "compendium.tile-plan.v2") fail("unsupported tile plan schema");
  const planDirectory = dirname(absolutePlanPath);
  const profileRef = ref(plan.profile, "tile plan profile");
  const profileFile = await readHashed(profileRef, planDirectory, "map-space profile");
  const reviewedProfile = await loadSpatialProfile(profileFile.path);
  if (reviewedProfile === null || reviewedProfile.sha256 !== profileRef.sha256) fail("map-space profile changed while it was being verified");
  const profile = reviewedProfile.profile;
  if (profile.buildId !== plan.buildId) fail(`profile build ${profile.buildId} differs from plan build ${plan.buildId}`);
  if (!profile.mapSpaces.some(mapSpace => mapSpace.id === plan.mapSpaceId)) fail(`profile has no map space ${plan.mapSpaceId}`);
  const sourceRefs = plan.sources.map((source, index) => {
    if (source.path === profileRef.path && source.sha256 === profileRef.sha256) fail(`source ${index} is the map-space profile, not capture output`);
    return ref(source, `tile plan source ${index}`);
  });
  const sources: LoadedTileInputs["sources"] = [];
  const provenance: TileSourceProvenance[] = [];
  const seenSources = new Set<string>();
  for (const sourceRef of sourceRefs) {
    const sourceKey = `${sourceRef.path}:${sourceRef.sha256}`;
    if (seenSources.has(sourceKey)) fail(`tile plan repeats source manifest ${sourceRef.path}`);
    seenSources.add(sourceKey);
    const source = await loadSource(sourceRef, planDirectory, profile, plan);
    sources.push(source);
    provenance.push({ manifest: { path: relative(planDirectory, source.sourcePath).split("/").join("/"), sha256: source.sourceSha256 }, runId: source.runId, captureSet: { path: relative(planDirectory, source.captureSetPath).split("/").join("/"), sha256: source.captureSetSha256 }, sceneNativeId: source.captureSet.sceneNativeId, scenePath: source.captureSet.scenePath, mapSpaceId: source.captureSet.mapSpaceId, completeImagery: source.captureSet.completeImagery, width: source.captureSet.width, height: source.captureSet.height, tiles: source.tiles.map(tile => ({ id: tile.id, compatibilityKey: tile.compatibilityKey, status: tile.status, empty: tile.empty, origin: tile.origin, verticalBounds: tile.rasterValue.verticalBounds, image: tile.image, raster: tile.raster, readiness: tile.readiness, restoration: tile.restoration, nativeContext: tile.nativeContext })) });
  }
  return { plan, planPath: absolutePlanPath, planSha256, profile, profileRef, profilePath: profileFile.path, sources, provenance };
}
