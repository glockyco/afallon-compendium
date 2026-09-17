import { createHash } from "node:crypto";
import { readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { Assert } from "typebox/value";
import {
  CaptureCleanupSchema, CapturePlanSchema, CaptureRasterSchema, CaptureReadinessSchema, CaptureRestorationSchema,
  CaptureSessionSchema, CaptureSetSchema, CaptureSweepCleanupSchema, CaptureTileCheckpointSchema,
  RuntimeCleanupReceiptSchema, StreamCleanupSchema, SceneVisitSchema,
  type ArtifactRunManifest, type CaptureArtifact, type CapturePlan, type CaptureReadiness as Readiness,
  type CaptureTileCheckpoint, type ContentIdentity,
} from "@afallon/contracts";
import { ArtifactStore, readArtifactRunManifest, readLatestSuccess } from "@afallon/artifacts";
import { objectReferences, type CaptureWorkspace } from "./content-run";

const SHA256_PATTERN = /^[a-f0-9]{64}$/;
type CaptureTile = CapturePlan["tiles"][number];
type TileArtifacts = CaptureTileCheckpoint["artifacts"];

export interface CaptureCacheContext {
  store: ArtifactStore;
  buildId: string;
  currentRunId: string;
  compatibility: Map<string, string>;
  plan: CapturePlan;
}
export interface ReusableCaptureTile {
  sourceRun: ArtifactRunManifest;
  sourceManifest: ContentIdentity;
  checkpoint: CaptureTileCheckpoint;
}

export async function readCaptureArtifactJson(store: ArtifactStore, reference: ContentIdentity): Promise<unknown> {
  await store.verify(reference);
  const bytes = await Bun.file(store.objectPath(reference.sha256)).bytes();
  if (bytes.length !== reference.bytes || createHash("sha256").update(bytes).digest("hex") !== reference.sha256) throw new Error("Capture JSON changed before decoding.");
  return JSON.parse(new TextDecoder().decode(bytes));
}

export function captureArtifactReferences(artifacts: TileArtifacts): ContentIdentity[] {
  return [artifacts.image.content, artifacts.raster.content, artifacts.readiness.content, artifacts.restoration.content,
    ...artifacts.nativeContext.map(reference => reference.content),
    ...(artifacts.cleanup === undefined ? [] : [artifacts.cleanup.capture, artifacts.cleanup.sweep])];
}

export function findResponseReference(artifacts: TileArtifacts, tileId: string): CaptureArtifact | undefined {
  return artifacts.nativeContext.find(reference => reference.name === `tiles/${tileId}.json` || /^tiles\/[a-z0-9-]+-batch\.json$/.test(reference.name));
}

export async function validateCaptureCleanup(store: ArtifactStore, checkpoint: CaptureTileCheckpoint, resourcePrefix: string): Promise<void> {
  const cleanup = checkpoint.artifacts.cleanup;
  if (cleanup === undefined) throw new Error("Capture checkpoint has no immutable cleanup proof.");
  const capture = await readCaptureArtifactJson(store, cleanup.capture);
  Assert(CaptureCleanupSchema, capture);
  if (capture.key !== checkpoint.origin.captureKey || capture.ownerToken !== checkpoint.origin.ownerToken || capture.resourcePrefix !== resourcePrefix) throw new Error("Capture cleanup belongs to another native owner.");
  const sweep = await readCaptureArtifactJson(store, cleanup.sweep);
  Assert(CaptureSweepCleanupSchema, sweep);
  if (sweep.ownerToken !== checkpoint.origin.ownerToken || !sweep.planRunIds.includes(checkpoint.origin.runId)) throw new Error("Sweep cleanup does not own the capture checkpoint.");
  const runtime = await readCaptureArtifactJson(store, sweep.runtimeCleanup.content);
  Assert(RuntimeCleanupReceiptSchema, runtime);
  if (runtime.token !== checkpoint.origin.ownerToken || runtime.state !== "clean" || runtime.callbacksRemaining !== 0 || runtime.cleanupErrors.length !== 0) throw new Error("Runtime cleanup does not confirm clean native ownership.");
  for (const reference of sweep.sceneTransitions) {
    const transition = await readCaptureArtifactJson(store, reference.content);
    Assert(SceneVisitSchema, transition);
  }
  if (sweep.sceneTransitions.length > 0) {
    const final = await readCaptureArtifactJson(store, sweep.sceneTransitions.at(-1)!.content);
    Assert(SceneVisitSchema, final);
    if (final.phase !== "restored" || !final.sceneReady || final.sceneNativeId !== sweep.finalScene.nativeId) throw new Error("Sweep cleanup does not confirm the configured final scene.");
  }
}

export async function validateCaptureCheckpoint(store: ArtifactStore, sourceRun: ArtifactRunManifest, checkpoint: CaptureTileCheckpoint, expectedTile: CaptureTile, plan: CapturePlan): Promise<void> {
  Assert(CaptureTileCheckpointSchema, checkpoint);
  const sourcePlanIdentity = sourceRun.input.inputs.plan;
  const sourceProfileIdentity = sourceRun.input.inputs.profile;
  if (sourcePlanIdentity === undefined || sourceProfileIdentity === undefined) throw new Error("Capture source omits its immutable plan or profile.");
  const sourcePlan = await readCaptureArtifactJson(store, sourcePlanIdentity);
  Assert(CapturePlanSchema, sourcePlan);
  await store.verify(sourceProfileIdentity);
  const sourceTile = sourcePlan.tiles.find(tile => tile.id === checkpoint.tileId);
  const settings = sourceRun.input.settings;
  if (sourceTile === undefined || typeof settings.character !== "string" || typeof settings.ownerSourceHash !== "string" || settings.buildHashes === null || typeof settings.buildHashes !== "object" || Array.isArray(settings.buildHashes)) throw new Error("Capture source omits its compatibility settings.");
  const buildHashes: Record<string, string> = {};
  for (const [name, hash] of Object.entries(settings.buildHashes)) {
    if (typeof hash !== "string" || !SHA256_PATTERN.test(hash)) throw new Error("Capture source has an invalid build hash.");
    buildHashes[name] = hash;
  }
  const point = settings.standingPoint;
  if (point !== null && (typeof point !== "object" || Array.isArray(point) || !["x", "y", "z"].every(axis => typeof (point as Record<string, unknown>)[axis] === "number" && Number.isFinite((point as Record<string, unknown>)[axis])))) throw new Error("Capture source has no finite standing-point evidence.");
  const expectedKey = tileCompatibilityKey({ buildId: sourceRun.input.buildId, buildHashes, profileSha256: sourceProfileIdentity.sha256, pipelineHashes: { "runtime-owner": settings.ownerSourceHash, "tool:capture-fingerprint": sourceRun.input.implementationFingerprint, ...Object.fromEntries(Object.entries(sourceRun.input.probeHashes).map(([name, hash]) => [`probe:${name}`, hash])) }, character: settings.character, plan: sourcePlan, tile: sourceTile, standingPoint: point as TileCompatibilityInput["standingPoint"] });
  if (checkpoint.compatibilityKey !== expectedKey) throw new Error("Capture checkpoint does not match its immutable source inputs.");
  const registered = new Set(sourceRun.outputs.map(output => `${output.content.sha256}:${output.content.bytes}`));
  for (const reference of captureArtifactReferences(checkpoint.artifacts)) {
    if (!registered.has(`${reference.sha256}:${reference.bytes}`)) throw new Error("Capture checkpoint refers to unregistered evidence.");
    await store.verify(reference);
  }
  const raster = await readCaptureArtifactJson(store, checkpoint.artifacts.raster.content);
  Assert(CaptureRasterSchema, raster);
  if (raster.tileId !== expectedTile.id || raster.width !== plan.width || raster.height !== plan.height || raster.imageSha256 !== checkpoint.artifacts.image.content.sha256) throw new Error("Capture raster does not match its image.");
  const readiness = await readCaptureArtifactJson(store, checkpoint.artifacts.readiness.content);
  Assert(CaptureReadinessSchema, readiness);
  for (const reference of [readiness.inventory, readiness.context]) {
    if (!checkpoint.artifacts.nativeContext.some(candidate => candidate.content.sha256 === reference.sha256 && candidate.content.bytes === reference.bytes)) throw new Error("Capture readiness omits registered observation evidence.");
    await store.verify(reference);
  }
  if (!readinessCovers(readiness, expectedTile) || readiness.ownerToken !== checkpoint.origin.ownerToken || readiness.sceneNativeId !== plan.sceneNativeId) throw new Error("Capture readiness belongs to another observation.");
  const restoration = await readCaptureArtifactJson(store, checkpoint.artifacts.restoration.content);
  Assert(CaptureRestorationSchema, restoration);
  if (!restoration.tileIds.includes(expectedTile.id) || restoration.key !== checkpoint.origin.captureKey || !restoration.renderSucceeded || restoration.errors.length !== 0 || !isDeepStrictEqual(restoration.before, restoration.after)) throw new Error("Capture visual restoration is not verified.");
  const responseReference = findResponseReference(checkpoint.artifacts, expectedTile.id);
  if (responseReference === undefined) throw new Error("Capture checkpoint has no native response.");
  const response = await readCaptureArtifactJson(store, responseReference.content);
  Assert(CaptureSessionSchema, response);
  if (response.ownerToken !== checkpoint.origin.ownerToken || response.key !== checkpoint.origin.captureKey || response.sceneNativeId !== plan.sceneNativeId || response.scenePath !== plan.scenePath || response.sceneHandle !== readiness.sceneHandle || !response.lastCapture?.captures.some(capture => capture.tileId === expectedTile.id && capture.width === plan.width && capture.height === plan.height)) throw new Error("Capture response belongs to another observation.");
  if (readiness.streamKey !== null) {
    const reference = checkpoint.artifacts.nativeContext.find(candidate => candidate.name.endsWith("/stream-cleanup.json"));
    if (reference === undefined) throw new Error("Capture checkpoint has no stream cleanup.");
    const stream = await readCaptureArtifactJson(store, reference.content);
    Assert(StreamCleanupSchema, stream);
    if (stream.key !== readiness.streamKey || stream.ownerToken !== checkpoint.origin.ownerToken || stream.sceneHandle !== readiness.sceneHandle || stream.remainingOwnedRoots !== 0 || stream.errors.length !== 0) throw new Error("Stream cleanup is not verified.");
    if (stream.rows.some(row => row.holdUntil !== row.originalHoldUntil || (!row.initiallyLoaded && (row.loaded || row.loading || row.hasHandle || row.rootInstanceId !== null)))) throw new Error("Stream cleanup retained an owned hold or root.");
  }
  await validateCaptureCleanup(store, checkpoint, response.resourcePrefix);
}

export async function findReusableTiles(context: CaptureCacheContext): Promise<Map<string, ReusableCaptureTile>> {
  const { store } = context;
  let names: string[];
  try { names = await readdir(resolve(store.root, "runs")); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return new Map(); throw error; }
  const runs: { manifest: ArtifactRunManifest; identity: ContentIdentity }[] = [];
  for (const name of names) {
    try {
      const path = resolve(store.root, "runs", name, "manifest.json");
      const manifest = await readArtifactRunManifest(path);
      if (manifest.runId === context.currentRunId || manifest.input.operation !== "capture" || manifest.input.buildId !== context.buildId) continue;
      const bytes = await Bun.file(path).bytes();
      const identity = { sha256: createHash("sha256").update(bytes).digest("hex"), bytes: bytes.length };
      await store.verify(identity);
      runs.push({ manifest, identity });
    } catch { /* Incomplete or corrupt runs cannot authorize reuse. */ }
  }
  const selected = await readLatestSuccess(store, context.buildId, "capture").catch(() => null);
  runs.sort((a, b) => Number(b.manifest.runId === selected?.pointer.runId) - Number(a.manifest.runId === selected?.pointer.runId) || b.manifest.timestamps.updatedAt.localeCompare(a.manifest.timestamps.updatedAt));
  const reusable = new Map<string, ReusableCaptureTile>();
  for (const tile of context.plan.tiles) {
    for (const { manifest, identity } of runs) {
      try {
        const setReference = manifest.outputs.find(output => output.name === "capture-set.json");
        const checkpointReference = manifest.outputs.find(output => output.name === `tiles/${tile.id}.checkpoint.json`);
        if (checkpointReference === undefined) continue;
        const checkpoint = await readCaptureArtifactJson(store, checkpointReference.content);
        Assert(CaptureTileCheckpointSchema, checkpoint);
        if (checkpoint.tileId !== tile.id || checkpoint.compatibilityKey !== context.compatibility.get(tile.id)) continue;
        if (manifest.status === "succeeded") {
          if (setReference === undefined) throw new Error("Successful capture has no capture set.");
          const set = await readCaptureArtifactJson(store, setReference.content);
          Assert(CaptureSetSchema, set);
          if (set.buildId !== context.buildId || set.sceneNativeId !== context.plan.sceneNativeId || set.scenePath !== context.plan.scenePath || set.mapSpaceId !== context.plan.mapSpaceId || set.width !== context.plan.width || set.height !== context.plan.height || new Set(set.expectedTiles).size !== set.expectedTiles.length || set.tiles.length !== set.expectedTiles.length || new Set(set.tiles.map(tile => tile.id)).size !== set.expectedTiles.length || set.tiles.some(tile => !set.expectedTiles.includes(tile.id))) throw new Error("Capture set has inconsistent scope.");
          const entry = set.tiles.find(candidate => candidate.id === tile.id);
          if (entry === undefined || entry.compatibilityKey !== checkpoint.compatibilityKey || !isDeepStrictEqual(entry.artifacts, checkpoint.artifacts) || !isDeepStrictEqual(entry.origin, checkpoint.origin)) throw new Error("Capture set disagrees with its checkpoint.");
        }
        await validateCaptureCheckpoint(store, manifest, checkpoint, tile, context.plan);
        reusable.set(tile.id, { sourceRun: manifest, sourceManifest: identity, checkpoint });
        break;
      } catch (error) {
        console.warn(`Capture cache candidate rejected: ${manifest.runId}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }
  return reusable;
}

export async function reuseCaptureTile(workspace: CaptureWorkspace, candidate: ReusableCaptureTile): Promise<CaptureTileCheckpoint> {
  const checkpoint = structuredClone(candidate.checkpoint);
  for (const reference of captureArtifactReferences(checkpoint.artifacts)) await workspace.registerObject(`reuse/${reference.sha256}`, reference);
  await workspace.registerObject(`reuse/source-${candidate.sourceRun.runId}.json`, candidate.sourceManifest, {
    mediaType: "application/json", schemaId: candidate.sourceRun.schemaVersion,
    references: candidate.sourceRun.status === "succeeded"
      ? [{ kind: "run-manifest", content: candidate.sourceManifest }]
      : [
          ...objectReferences(Object.values(candidate.sourceRun.input.inputs)),
          ...objectReferences(candidate.sourceRun.outputs.map(output => output.content)),
          ...candidate.sourceRun.outputs.flatMap(output => output.references),
        ],
  });
  return checkpoint;
}

export interface TileCompatibilityInput {
  buildId: string;
  buildHashes: Record<string, string>;
  profileSha256: string;
  pipelineHashes: Record<string, string>;
  character: string;
  plan: CapturePlan;
  tile: CaptureTile;
  // Where the player stands for the plan; it decides what the game shows, so a tile captured
  // from another standing point is another observation.
  standingPoint: { x: number; y: number; z: number } | null;
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
    schemaVersion: "compendium.capture-tile-compatibility.v5",
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
    // The survey hash stands for the walkable surface the player stands on; the path is a location.
    surveySha256: input.plan.survey === undefined ? null : input.plan.survey.sha256,
    readiness: input.plan.readiness,
    frame: input.tile.frame,
    standingPoint: input.standingPoint,
  });
}

export function readinessCovers(readiness: Readiness, tile: CaptureTile): boolean {
  if (readiness.tileId !== tile.id && !readiness.tileId.endsWith("-extent")) return false;
  const observed = readiness.captureFrame, frame = tile.frame;
  return Math.abs(observed.center.x - frame.center.x) <= (observed.worldSize.x - frame.worldSize.x) / 2 + 1e-6
    && Math.abs(observed.center.z - frame.center.z) <= (observed.worldSize.z - frame.worldSize.z) / 2 + 1e-6
    && observed.cameraY - observed.nearClip >= frame.cameraY - frame.nearClip - 1e-6
    && observed.cameraY - observed.farClip <= frame.cameraY - frame.farClip + 1e-6;
}
