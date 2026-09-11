import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { copyFile, mkdir, readFile, realpath, stat } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { Assert } from "typebox/value";
import type { Static } from "typebox";
import {
  CaptureCleanupSchema,
  CaptureRasterSchema,
  CaptureReadinessSchema,
  CaptureRestorationSchema,
  CaptureSessionSchema,
  CaptureSetSchema,
  CaptureSweepSchema,
  CaptureTileCheckpointSchema,
  type CapturePlan,
  type CaptureSet,
  type CaptureTileCheckpoint,
} from "./capture-contracts";
import { StreamCleanupSchema } from "./traversal-contracts";
import { listRunManifests, readLatestSuccess, type ArtifactRecord, type LatestSuccessPointer, type Run, type RunManifest } from "./runs";

const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const CAPTURE_COMMAND = "capture";

type CaptureTile = CapturePlan["tiles"][number];
type TileArtifacts = CaptureTileCheckpoint["artifacts"];
type CaptureCleanup = Static<typeof CaptureCleanupSchema>;
type CaptureRaster = Static<typeof CaptureRasterSchema>;
type Readiness = Static<typeof CaptureReadinessSchema>;
type Restoration = Static<typeof CaptureRestorationSchema>;
type Session = Static<typeof CaptureSessionSchema>;
type StreamCleanup = Static<typeof StreamCleanupSchema>;

export interface TileCompatibilityInput {
  buildId: string;
  buildHashes: Record<string, string>;
  profileSha256: string;
  pipelineHashes: Record<string, string>;
  character: string;
  plan: CapturePlan;
  tile: CaptureTile;
}

export interface CaptureCacheContext {
  outputRoot: string;
  buildId: string;
  currentRunId: string;
  compatibility: Map<string, string>;
  plan: CapturePlan;
}

export interface ReusableCaptureTile {
  sourceRun: RunManifest;
  sourceDirectory: string;
  checkpoint: CaptureTileCheckpoint;
  cleanupArtifacts: ArtifactRecord[];
  cleanupSourcePaths: Map<string, string>;
}

export interface CopiedCaptureTile {
  artifacts: TileArtifacts;
  checkpoint: CaptureTileCheckpoint;
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  const object = value as Record<string, unknown>;
  return `{${Object.keys(object).sort().map(key => `${JSON.stringify(key)}:${canonical(object[key])}`).join(",")}}`;
}

function hashCanonical(value: unknown): string {
  return createHash("sha256").update(canonical(value)).digest("hex");
}

function sortedHashes(values: Record<string, string>, predicate: (key: string) => boolean): Record<string, string> {
  const selected = Object.entries(values).filter(([key]) => predicate(key));
  for (const [key, value] of selected) {
    if (!SHA256_PATTERN.test(value)) throw new Error(`Compatibility input hash is invalid: ${key}`);
  }
  return Object.fromEntries(selected.sort(([left], [right]) => left.localeCompare(right)));
}

export function tileCompatibilityKey(input: TileCompatibilityInput): string {
  if (!SHA256_PATTERN.test(input.profileSha256)) throw new Error("Compatibility profile hash is invalid.");
  const pipelineHashes = sortedHashes(input.pipelineHashes, key => key === "runtime-owner" || key.startsWith("tool:") || key.startsWith("probe:"));
  return hashCanonical({
    schemaVersion: "compendium.capture-tile-compatibility.v3",
    buildId: input.buildId,
    buildHashes: sortedHashes(input.buildHashes, () => true),
    profileSha256: input.profileSha256,
    pipelineHashes,
    character: input.character,
    planSchemaVersion: input.plan.schemaVersion,
    tileId: input.tile.id,
    scene: { nativeId: input.plan.sceneNativeId, path: input.plan.scenePath },
    map: { id: input.plan.mapSpaceId },
    dimensions: { width: input.plan.width, height: input.plan.height },
    lighting: input.plan.lighting,
    cullingMask: input.plan.cullingMask,
    suppression: input.plan.suppression,
    // The survey hash stands for the walkable surface the cut follows; the path is a location.
    cut: input.plan.cut === undefined ? null : { source: input.plan.cut.source, surveySha256: input.plan.cut.survey.sha256, step: input.plan.cut.step, headroom: input.plan.cut.headroom, cameraAbove: input.plan.cut.cameraAbove },
    readiness: input.plan.readiness,
    frame: input.tile.frame,
  });
}

function isContained(root: string, candidate: string): boolean {
  const suffix = relative(root, candidate);
  return suffix.length > 0 && suffix !== ".." && !suffix.startsWith("../") && !suffix.startsWith("..\\") && !isAbsolute(suffix);
}

async function existingPath(root: string, relativePath: string): Promise<string> {
  if (typeof relativePath !== "string" || relativePath.length === 0 || relativePath.startsWith("/") || relativePath.startsWith("\\") || relativePath.split(/[\\/]/).some(part => part.length === 0 || part === "." || part === "..")) {
    throw new Error(`Cache artifact path is not a safe relative path: ${relativePath}`);
  }
  const rootReal = await realpath(root);
  const candidate = resolve(root, ...relativePath.split(/[\\/]/));
  const candidateReal = await realpath(candidate);
  if (!isContained(rootReal, candidateReal)) throw new Error(`Cache artifact escapes its source run: ${relativePath}`);
  return candidateReal;
}

function artifactMap(manifest: RunManifest): Map<string, ArtifactRecord> {
  const records = new Map<string, ArtifactRecord>();
  for (const artifact of manifest.artifacts) records.set(artifact.path, artifact);
  return records;
}

async function verifyFile(root: string, reference: ArtifactRecord, records: Map<string, ArtifactRecord>, requireManifestRecord: boolean): Promise<ArtifactRecord> {
  if (!SHA256_PATTERN.test(reference.sha256) || !Number.isSafeInteger(reference.bytes) || reference.bytes <= 0) throw new Error(`Cache artifact metadata is invalid: ${reference.path}`);
  const registered = records.get(reference.path);
  if (requireManifestRecord && (registered === undefined || registered.sha256 !== reference.sha256 || registered.bytes !== reference.bytes)) {
    throw new Error(`Cache artifact is not the registered immutable file: ${reference.path}`);
  }
  const path = await existingPath(root, reference.path);
  const bytes = await readFile(path);
  const file = await stat(path);
  const canonicalAfter = await realpath(path);
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  if (canonicalAfter !== path || !file.isFile() || file.size !== bytes.byteLength || bytes.byteLength !== reference.bytes || sha256 !== reference.sha256) {
    throw new Error(`Cache artifact failed integrity verification: ${reference.path}`);
  }
  return { path: reference.path, bytes: bytes.byteLength, sha256 };
}

function decodeVerifiedJson(bytes: Uint8Array, reference: ArtifactRecord): unknown {
  if (bytes.byteLength !== reference.bytes || createHash("sha256").update(bytes).digest("hex") !== reference.sha256) {
    throw new Error(`Cache JSON changed before decoding: ${reference.path}`);
  }
  return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
}

export async function readCaptureArtifactJson(root: string, reference: ArtifactRecord): Promise<unknown> {
  const path = await existingPath(root, reference.path);
  return decodeVerifiedJson(await readFile(path), reference);
}

function artifactReferences(artifacts: TileArtifacts): ArtifactRecord[] {
  return [artifacts.image, artifacts.raster, artifacts.readiness, artifacts.restoration, ...artifacts.nativeContext];
}

function sameArtifact(left: ArtifactRecord, right: ArtifactRecord): boolean {
  return left.path === right.path && left.bytes === right.bytes && left.sha256 === right.sha256;
}

function findResponseReference(artifacts: TileArtifacts, tileId: string): ArtifactRecord | undefined {
  return artifacts.nativeContext.find(reference =>
    reference.path === `tiles/${tileId}.json` || reference.path === `tiles/${tileId}.geometry/origin-${tileId}.json`,
  );
}

async function validateNativeCleanup(sourceDirectory: string, sourceRun: RunManifest, checkpoint: CaptureTileCheckpoint, resourcePrefix: string): Promise<{ artifacts: ArtifactRecord[]; sourcePaths: Map<string, string> }> {
  const origin = checkpoint.origin;
  const contextCaptureCleanup = checkpoint.artifacts.nativeContext.find(artifact => artifact.path === "capture-cleanup.json" || artifact.path.endsWith("/origin-capture-cleanup.json"));
  const registeredCaptureCleanup = contextCaptureCleanup ?? sourceRun.artifacts.find(artifact => artifact.path === "capture-cleanup.json" || artifact.path.endsWith("/origin-capture-cleanup.json"));
  const capturePathRelative = registeredCaptureCleanup?.path ?? "capture-cleanup.json";
  const capturePath = await existingPath(sourceDirectory, capturePathRelative);
  const captureBytes = await readFile(capturePath);
  const captureCleanup = registeredCaptureCleanup ?? { path: capturePathRelative, bytes: captureBytes.byteLength, sha256: createHash("sha256").update(captureBytes).digest("hex") };
  const captureValue = decodeVerifiedJson(captureBytes, captureCleanup) as CaptureCleanup;
  Assert(CaptureCleanupSchema, captureValue);
  if (captureValue.key !== origin.captureKey || captureValue.ownerToken !== origin.ownerToken || captureValue.resourcePrefix !== resourcePrefix || captureValue.remainingObjects !== 0 || captureValue.errors.length !== 0) {
    throw new Error("Cache source capture cleanup receipt does not confirm clean native state.");
  }

  const sweepManifestPath = sourceRun.input.settings.sweepManifestPath;
  if (typeof sweepManifestPath !== "string" || sweepManifestPath.length === 0) {
    throw new Error("Capture cache candidate predates the sweep-run model; no sweep manifest reference is available.");
  }
  const sweepManifestBytes = await readFile(sweepManifestPath);
  const runtimeManifest = JSON.parse(new TextDecoder().decode(sweepManifestBytes)) as RunManifest;
  if (runtimeManifest.status !== "succeeded" || runtimeManifest.runId !== sourceRun.input.settings.sweepRunId) throw new Error("Cache source sweep manifest is not a succeeded matching run.");
  const sweepDirectory = dirname(sweepManifestPath);
  const sweepArtifactMap = artifactMap(runtimeManifest);
  const sweepEvidenceReference = runtimeManifest.artifacts.find(artifact => artifact.path === "sweep.json");
  if (sweepEvidenceReference === undefined) throw new Error("Cache source sweep manifest has no sweep evidence.");
  await verifyFile(sweepDirectory, sweepEvidenceReference, sweepArtifactMap, true);
  const sweepEvidenceBytes = await readFile(resolve(sweepDirectory, sweepEvidenceReference.path));
  const sweepEvidence = decodeVerifiedJson(sweepEvidenceBytes, sweepEvidenceReference);
  Assert(CaptureSweepSchema, sweepEvidence);
  if (sweepEvidence.runId !== runtimeManifest.runId || sweepEvidence.ownerToken !== origin.ownerToken) throw new Error("Cache source sweep evidence has mismatched ownership.");
  const planReference = sweepEvidence.plans.find(plan => plan.runId === sourceRun.runId);
  if (planReference === undefined || planReference.manifestPath !== resolve(sourceDirectory, "manifest.json")) throw new Error("Cache source sweep evidence omits this plan manifest.");
  const planManifestBytes = await readFile(resolve(sourceDirectory, "manifest.json"));
  if (createHash("sha256").update(planManifestBytes).digest("hex") !== planReference.manifestSha256) throw new Error("Cache source plan manifest does not match its sweep reference.");
  const runtimeCleanup = sweepEvidence.runtimeCleanup;
  await verifyFile(sweepDirectory, runtimeCleanup, sweepArtifactMap, true);
  const runtimePath = await existingPath(sweepDirectory, runtimeCleanup.path);
  const runtimeBytes = await readFile(runtimePath);
  const runtimeValue = decodeVerifiedJson(runtimeBytes, runtimeCleanup);
  if (runtimeValue === null || typeof runtimeValue !== "object" || Array.isArray(runtimeValue)) throw new Error("Cache source runtime cleanup receipt is invalid.");
  const runtime = runtimeValue as Record<string, unknown>;
  if (runtime.schemaVersion !== "compendium.runtime-owner.v1" || runtime.token !== origin.ownerToken || typeof runtime.reason !== "string" || runtime.state !== "clean" || runtime.callbacksRemaining !== 0 || !Array.isArray(runtime.cleanupErrors) || runtime.cleanupErrors.length !== 0) {
    throw new Error("Cache source runtime cleanup receipt does not confirm clean native ownership.");
  }
  await verifyFile(sourceDirectory, captureCleanup, artifactMap(sourceRun), registeredCaptureCleanup !== undefined);
  const sourcePaths = new Map<string, string>([[captureCleanup.path, capturePath], [runtimeCleanup.path, runtimePath]]);
  return { artifacts: [captureCleanup, runtimeCleanup], sourcePaths };
}

function checkpointCoreMatches(fileCheckpoint: CaptureTileCheckpoint, publishedCheckpoint: CaptureTileCheckpoint): boolean {
  if (fileCheckpoint.tileId !== publishedCheckpoint.tileId
    || fileCheckpoint.compatibilityKey !== publishedCheckpoint.compatibilityKey
    || !isDeepStrictEqual(fileCheckpoint.origin, publishedCheckpoint.origin)) return false;
  const fileCore = [fileCheckpoint.artifacts.image, fileCheckpoint.artifacts.raster, fileCheckpoint.artifacts.readiness, fileCheckpoint.artifacts.restoration];
  const publishedCore = [publishedCheckpoint.artifacts.image, publishedCheckpoint.artifacts.raster, publishedCheckpoint.artifacts.readiness, publishedCheckpoint.artifacts.restoration];
  if (!fileCore.every((reference, index) => sameArtifact(reference, publishedCore[index]!))) return false;
  return fileCheckpoint.artifacts.nativeContext.every(reference => publishedCheckpoint.artifacts.nativeContext.some(candidate => sameArtifact(reference, candidate)));
}

function checkpointFromCaptureSet(set: CaptureSet, tileId: string): CaptureTileCheckpoint {
  const tile = set.tiles.find(candidate => candidate.id === tileId);
  if (tile === undefined) throw new Error(`Capture set omits tile ${tileId}.`);
  const checkpoint: CaptureTileCheckpoint = {
    schemaVersion: "compendium.capture-tile-checkpoint.v1",
    tileId: tile.id,
    compatibilityKey: tile.compatibilityKey,
    artifacts: tile.artifacts,
    origin: tile.origin,
  };
  Assert(CaptureTileCheckpointSchema, checkpoint);
  return checkpoint;
}

async function validateCheckpoint(sourceDirectory: string, sourceRun: RunManifest, checkpoint: CaptureTileCheckpoint, expectedTile: CaptureTile, expectedPlan: CapturePlan): Promise<ReusableCaptureTile> {
  if (checkpoint.tileId !== expectedTile.id) throw new Error(`Cache checkpoint has mismatched tile ${checkpoint.tileId}.`);
  const records = artifactMap(sourceRun);
  for (const reference of artifactReferences(checkpoint.artifacts)) await verifyFile(sourceDirectory, reference, records, true);
  const rasterValue = await readCaptureArtifactJson(sourceDirectory, checkpoint.artifacts.raster) as CaptureRaster;
  Assert(CaptureRasterSchema, rasterValue);
  if (rasterValue.tileId !== expectedTile.id || rasterValue.width !== expectedPlan.width || rasterValue.height !== expectedPlan.height || rasterValue.imageSha256 !== checkpoint.artifacts.image.sha256) throw new Error("Cache raster does not match its tile image.");
  const readinessValue = await readCaptureArtifactJson(sourceDirectory, checkpoint.artifacts.readiness) as Readiness;
  Assert(CaptureReadinessSchema, readinessValue);
  const inventoryReference = checkpoint.artifacts.nativeContext.find(reference => reference.sha256 === readinessValue.inventorySha256);
  if (inventoryReference === undefined || readinessValue.inventorySha256 !== inventoryReference.sha256) throw new Error("Cache readiness inventory hash does not match its native context.");
  if (readinessValue.tileId !== expectedTile.id || readinessValue.ownerToken !== checkpoint.origin.ownerToken || readinessValue.sceneNativeId !== expectedPlan.sceneNativeId) throw new Error("Cache readiness provenance does not match its tile.");
  const restorationValue = await readCaptureArtifactJson(sourceDirectory, checkpoint.artifacts.restoration) as Restoration;
  Assert(CaptureRestorationSchema, restorationValue);
  if (restorationValue.tileId !== expectedTile.id || restorationValue.key !== checkpoint.origin.captureKey || !restorationValue.renderSucceeded || restorationValue.errors.length !== 0) throw new Error("Cache restoration audit is not successful.");
  const responseReference = findResponseReference(checkpoint.artifacts, expectedTile.id);
  if (responseReference === undefined) throw new Error("Cache tile has no native capture response.");
  const responseValue = await readCaptureArtifactJson(sourceDirectory, responseReference) as Session;
  Assert(CaptureSessionSchema, responseValue);
  if (responseValue.ownerToken !== checkpoint.origin.ownerToken || responseValue.key !== checkpoint.origin.captureKey || responseValue.sceneNativeId !== expectedPlan.sceneNativeId || responseValue.scenePath !== expectedPlan.scenePath || responseValue.sceneHandle !== readinessValue.sceneHandle || responseValue.lastCapture === null || responseValue.lastCapture.tileId !== expectedTile.id || responseValue.lastCapture.width !== expectedPlan.width || responseValue.lastCapture.height !== expectedPlan.height || responseValue.lastCapture.sha256 !== checkpoint.artifacts.image.sha256) throw new Error("Cache native capture response does not match its tile provenance.");
  if (readinessValue.streamKey !== null) {
    const streamReference = checkpoint.artifacts.nativeContext.find(reference => reference.path.endsWith("/stream-cleanup.json"));
    if (streamReference === undefined) throw new Error("Cache streamed tile has no cleanup receipt.");
    const streamValue = await readCaptureArtifactJson(sourceDirectory, streamReference) as StreamCleanup;
    Assert(StreamCleanupSchema, streamValue);
    if (streamValue.ownerToken !== checkpoint.origin.ownerToken || streamValue.key !== readinessValue.streamKey || streamValue.sceneHandle !== readinessValue.sceneHandle || streamValue.remainingOwnedRoots !== 0 || streamValue.errors.length !== 0) throw new Error("Cache stream cleanup receipt is not clean.");
  }
  const cleanup = await validateNativeCleanup(sourceDirectory, sourceRun, checkpoint, responseValue.resourcePrefix);
  return { sourceRun, sourceDirectory, checkpoint, cleanupArtifacts: cleanup.artifacts, cleanupSourcePaths: cleanup.sourcePaths };
}

function setMatchesPlan(set: CaptureSet, buildId: string, plan: CapturePlan): boolean {
  const expectedTiles = new Set(set.expectedTiles);
  return set.buildId === buildId && set.sceneNativeId === plan.sceneNativeId && set.scenePath === plan.scenePath && set.mapSpaceId === plan.mapSpaceId
    && set.width === plan.width && set.height === plan.height && set.completeImagery === false
    && set.expectedTiles.length === expectedTiles.size
    && set.tiles.length === expectedTiles.size && new Set(set.tiles.map(tile => tile.id)).size === expectedTiles.size && set.tiles.every(tile => expectedTiles.has(tile.id));
}

async function candidateCheckpoint(entry: { directory: string; manifest: RunManifest }, tile: CaptureTile, plan: CapturePlan, buildId: string, selectedSuccess: boolean, expectedKey: string): Promise<ReusableCaptureTile> {
  const checkpointReference = entry.manifest.artifacts.find(artifact => artifact.path === `tiles/${tile.id}.checkpoint.json`);
  if (selectedSuccess) {
    const setReference = entry.manifest.artifacts.find(artifact => artifact.path === "capture-set.json");
    if (setReference === undefined) throw new Error("Selected capture run has no capture-set artifact.");
    await verifyFile(entry.directory, setReference, artifactMap(entry.manifest), true);
    if (checkpointReference === undefined) throw new Error("Selected capture run has no tile checkpoint.");
    await verifyFile(entry.directory, checkpointReference, artifactMap(entry.manifest), true);
    const setValue = await readCaptureArtifactJson(entry.directory, setReference) as CaptureSet;
    Assert(CaptureSetSchema, setValue);
    if (!setMatchesPlan(setValue, buildId, plan)) throw new Error("Capture set does not match the requested capture scope.");
    const checkpoint = checkpointFromCaptureSet(setValue, tile.id);
    if (checkpoint.compatibilityKey !== expectedKey) throw new Error("Capture tile inputs have changed.");
    const checkpointValue = await readCaptureArtifactJson(entry.directory, checkpointReference) as CaptureTileCheckpoint;
    Assert(CaptureTileCheckpointSchema, checkpointValue);
    if (!checkpointCoreMatches(checkpointValue, checkpoint)) throw new Error("Published capture set disagrees with its tile checkpoint.");
    return validateCheckpoint(entry.directory, entry.manifest, checkpoint, tile, plan);
  }
  if (checkpointReference === undefined) throw new Error("Interrupted capture run has no tile checkpoint.");
  await verifyFile(entry.directory, checkpointReference, artifactMap(entry.manifest), true);
  const checkpointValue = await readCaptureArtifactJson(entry.directory, checkpointReference) as CaptureTileCheckpoint;
  Assert(CaptureTileCheckpointSchema, checkpointValue);
  if (checkpointValue.compatibilityKey !== expectedKey) throw new Error("Capture tile inputs have changed.");
  return validateCheckpoint(entry.directory, entry.manifest, checkpointValue, tile, plan);
}

export async function findReusableTiles(context: CaptureCacheContext): Promise<Map<string, ReusableCaptureTile>> {
  const runs = await listRunManifests(context.outputRoot, context.buildId, CAPTURE_COMMAND);
  let selected: LatestSuccessPointer | null = null;
  try {
    selected = await readLatestSuccess(context.outputRoot, context.buildId, CAPTURE_COMMAND);
  } catch {
    selected = null;
  }
  const ordered = [...runs].sort((left, right) => {
    const leftPriority = selected !== null && left.manifest.runId === selected.runId ? -1 : left.manifest.status === "succeeded" ? 0 : 1;
    const rightPriority = selected !== null && right.manifest.runId === selected.runId ? -1 : right.manifest.status === "succeeded" ? 0 : 1;
    return leftPriority - rightPriority || right.manifest.timestamps.updatedAt.localeCompare(left.manifest.timestamps.updatedAt);
  });
  const reusable = new Map<string, ReusableCaptureTile>();
  const reportedRejections = new Set<string>();
  for (const tile of context.plan.tiles) {
    const expectedKey = context.compatibility.get(tile.id);
    if (expectedKey === undefined) continue;
    for (const entry of ordered) {
      if (entry.manifest.runId === context.currentRunId) continue;
      try {
        const candidate = await candidateCheckpoint(entry, tile, context.plan, context.buildId, entry.manifest.status === "succeeded", expectedKey);
        if (candidate.checkpoint.compatibilityKey !== expectedKey) continue;
        reusable.set(tile.id, candidate);
        break;
      } catch (error) {
        // A corrupt or incomplete candidate is rejected. The next candidate may still be valid.
        const reason = error instanceof Error ? error.message : String(error);
        const rejection = `${entry.manifest.runId}: ${reason}`;
        if (!reportedRejections.has(rejection)) {
          reportedRejections.add(rejection);
          console.warn(`Capture cache candidate rejected: ${rejection}`);
        }
      }
    }
  }
  return reusable;
}

function destinationPath(tileId: string, sourcePath: string): string {
  if (sourcePath === `tiles/${tileId}.png`) return sourcePath;
  if (sourcePath === `tiles/${tileId}.raster.json`) return sourcePath;
  if (sourcePath === `tiles/${tileId}.restoration.json`) return sourcePath;
  if (sourcePath.startsWith(`tiles/${tileId}.geometry/`)) return sourcePath;
  const file = sourcePath.split(/[\\/]/).at(-1) ?? "artifact";
  return `tiles/${tileId}.geometry/origin-${file}`;
}

async function copyReference(run: Run, source: ReusableCaptureTile, reference: ArtifactRecord, tileId: string, destination: string): Promise<ArtifactRecord> {
  const sourcePath = source.cleanupSourcePaths.get(reference.path) ?? await existingPath(source.sourceDirectory, reference.path);
  const targetPath = resolve(run.directory, destination);
  await mkdir(resolve(targetPath, ".."), { recursive: true });
  await copyFile(sourcePath, targetPath, constants.COPYFILE_EXCL);
  const copied = await run.addArtifact(destination);
  if (copied.sha256 !== reference.sha256 || copied.bytes !== reference.bytes) throw new Error(`Reused cache artifact changed during copy: ${reference.path}`);
  return copied;
}

export async function copyReusableTile(run: Run, candidate: ReusableCaptureTile): Promise<CopiedCaptureTile> {
  const sourceReferences = artifactReferences(candidate.checkpoint.artifacts);
  const cleanupReferences = candidate.cleanupArtifacts;
  const allReferences = [...sourceReferences, ...cleanupReferences];
  const destinationBySource = new Map<string, ArtifactRecord>();
  const destinationSet = new Set<string>();
  for (const reference of allReferences) {
    const destination = destinationPath(candidate.checkpoint.tileId, reference.path);
    const existing = destinationBySource.get(reference.path);
    if (existing !== undefined) continue;
    if (destinationSet.has(destination)) throw new Error(`Reused cache artifacts collide at ${destination}.`);
    const copied = await copyReference(run, candidate, reference, candidate.checkpoint.tileId, destination);
    destinationBySource.set(reference.path, { ...copied, path: destination });
    destinationSet.add(destination);
  }
  const remap = (reference: ArtifactRecord): ArtifactRecord => {
    const mapped = destinationBySource.get(reference.path);
    if (mapped === undefined) throw new Error(`Reused cache artifact was not copied: ${reference.path}`);
    return mapped;
  };
  const nativeContext: ArtifactRecord[] = [];
  const nativeContextPaths = new Set<string>();
  for (const reference of [...candidate.checkpoint.artifacts.nativeContext, ...cleanupReferences]) {
    if (nativeContextPaths.has(reference.path)) continue;
    nativeContextPaths.add(reference.path);
    nativeContext.push(remap(reference));
  }
  const artifacts: TileArtifacts = {
    image: remap(candidate.checkpoint.artifacts.image),
    raster: remap(candidate.checkpoint.artifacts.raster),
    readiness: remap(candidate.checkpoint.artifacts.readiness),
    restoration: remap(candidate.checkpoint.artifacts.restoration),
    nativeContext,
  };
  const checkpoint: CaptureTileCheckpoint = {
    schemaVersion: "compendium.capture-tile-checkpoint.v1",
    tileId: candidate.checkpoint.tileId,
    compatibilityKey: candidate.checkpoint.compatibilityKey,
    artifacts,
    origin: { ...candidate.checkpoint.origin },
  };
  Assert(CaptureTileCheckpointSchema, checkpoint);
  return { artifacts, checkpoint };
}

export async function captureArtifactReference(root: string, relativePath: string): Promise<ArtifactRecord> {
  const path = await existingPath(root, relativePath);
  const bytes = await readFile(path);
  const file = await stat(path);
  if (!file.isFile() || file.size !== bytes.byteLength || bytes.byteLength <= 0) throw new Error(`Capture artifact is not a stable file: ${relativePath}`);
  return { path: relativePath, bytes: bytes.byteLength, sha256: createHash("sha256").update(bytes).digest("hex") };
}

