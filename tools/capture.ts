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
  CaptureRestorationSchema,
  CaptureSessionSchema,
  type CapturePlan,
  type CaptureSession,
} from "./capture-contracts";
import { ObservationContextSchema } from "./contracts";
import { collectSceneCatalog } from "./map-calibration";
import { compileMapSpaces } from "./map-spaces";
import { beginRun, type ArtifactRecord, type Run } from "./runs";
import type { Runtime } from "./runtime";
import { loadSpatialProfile } from "./spatial-extraction";
import type { MapSpaceProfile } from "./spatial-contracts";
import { WorldInventorySchema, type WorldInventory } from "./world-inventory";

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

function assertRestorationAudit(value: unknown, tile: CapturePlan["tiles"][number], key: string, captureFrame: number): void {
  assertSchema(CaptureRestorationSchema, value, `Restoration audit for tile "${tile.id}"`);
  const audit = value as {
    key: string;
    tileId: string;
    frameStarted: number;
    frameRestored: number;
    renderSucceeded: boolean;
    before: unknown;
    after: unknown;
    errors: string[];
  };
  if (audit.key !== key || audit.tileId !== tile.id) throw new Error(`Restoration audit for tile "${tile.id}" has mismatched session metadata.`);
  if (audit.frameStarted !== audit.frameRestored || audit.frameStarted !== captureFrame) throw new Error(`Restoration audit for tile "${tile.id}" crossed native frames.`);
  if (!audit.renderSucceeded || audit.errors.length !== 0) throw new Error(`Frame restoration failed for tile "${tile.id}".`);
  if (!isDeepStrictEqual(audit.before, audit.after)) throw new Error(`Frame restoration changed visual state for tile "${tile.id}".`);
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

  const planText = `${JSON.stringify(plan, null, 2)}\n`;
  const inputHashes: Record<string, string> = {
    ...identity.inputHashes,
    "runtime-owner": runtime.ownerSourceHash,
    plan: createHash("sha256").update(planText).digest("hex"),
    "map-space-profile": spatialProfile.sha256,
  };
  for (const name of ["world-inventory", "capture-session"]) {
    inputHashes[`probe:${name}`] = await hashFile(resolve(import.meta.dir, `probes/${name}.csx`));
  }
  for (const name of [
    "capture", "capture-contracts", "runtime", "runs", "build", "config", "contracts", "world-inventory",
    "map-calibration", "map-contracts", "map-spaces", "spatial-contracts", "spatial-extraction",
  ]) {
    inputHashes[`tool:${name}`] = await hashFile(resolve(import.meta.dir, `${name}.ts`));
  }

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
      readiness: "unverified",
      completeImagery: false,
    },
  });

  try {
    await Bun.write(resolve(run.directory, "plan.json"), planText);
    await registerArtifact(run, "plan.json", inputHashes.plan);
    await Bun.write(resolve(run.directory, "map-space-profile.json"), spatialProfile.bytes);
    await registerArtifact(run, "map-space-profile.json", spatialProfile.sha256);

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

    await mkdir(resolve(run.directory, "tiles"), { recursive: true });
    const probePath = resolve(import.meta.dir, "probes/capture-session.csx");
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
    const startReply = await runtime.probe(probePath, resolve(run.directory, startPath), { parameters: { action: "start", ...baseParameters } });
    assertSchema(CaptureSessionSchema, startReply.value, "Capture start response");
    let session = startReply.value as CaptureSession;
    if (session.phase !== "ready" || session.sceneNativeId !== plan.sceneNativeId || session.scenePath !== plan.scenePath) throw new Error("Capture start response has mismatched scene metadata.");
    assertSession(session, runtime, session.key, plan.sceneNativeId, plan.scenePath, undefined, "ready");
    const sceneHandle = session.sceneHandle;
    const captureKey = session.key;
    await registerProbeArtifact(run, startPath, startReply.reference);

    const tiles: NonNullable<CaptureSession["lastCapture"]>[] = [];
    for (const tile of plan.tiles) {
      runtime.signal.throwIfAborted();
      const pngPath = resolve(run.directory, "tiles", `${tile.id}.png`);
      const restorationPath = resolve(run.directory, "tiles", `${tile.id}.restoration.json`);
      const responseRelativePath = `tiles/${tile.id}.json`;
      const responsePath = resolve(run.directory, responseRelativePath);
      const pngRuntimePath = await toRuntimePath(config, pngPath);
      const restorationRuntimePath = await toRuntimePath(config, restorationPath);
      const reply = await runtime.probe(probePath, responsePath, {
        parameters: {
          action: "render",
          key: session.key,
          tileId: tile.id,
          frame: tile.frame,
          lighting: plan.lighting,
          cullingMask: plan.cullingMask,
          suppressedRendererIds: tile.suppressedRendererIds,
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
      assertFrameMatches(capture, tile.frame, tile.id);
      const png = await hashPng(pngPath, plan.width, plan.height, tile.id);
      if (png.sha256 !== capture.sha256 || png.byteSize !== capture.byteSize) throw new Error(`Capture response for tile "${tile.id}" does not match its PNG artifact.`);
      const restorationBytes = await readFile(restorationPath);
      let restoration: unknown;
      try { restoration = JSON.parse(new TextDecoder().decode(restorationBytes)); } catch (error) { throw new Error(`Restoration audit for tile "${tile.id}" is not valid JSON.`, { cause: error }); }
      assertRestorationAudit(restoration, tile, session.key, capture.frame);
      await registerProbeArtifact(run, responseRelativePath, reply.reference);
      await registerArtifact(run, `tiles/${tile.id}.png`, png.sha256);
      await registerArtifact(run, `tiles/${tile.id}.restoration.json`);
      tiles.push(capture);
    }

    const restoredPath = "capture-restored.json";
    const restoredReply = await runtime.probe(probePath, resolve(run.directory, restoredPath), {
      parameters: { action: "restore", key: session.key, ...baseParameters },
    });
    assertSchema(CaptureSessionSchema, restoredReply.value, "Capture restore response");
    session = restoredReply.value as CaptureSession;
    assertSession(session, runtime, captureKey, plan.sceneNativeId, plan.scenePath, sceneHandle, "restored");
    if (session.completedCaptures !== plan.tiles.length || session.resources.some(resource => resource.alive)) {
      throw new Error("Capture restore response still reports owned resources.");
    }
    await registerProbeArtifact(run, restoredPath, restoredReply.reference);

    const cleanup = JSON.parse(await Bun.file(cleanupPath).text());
    assertSchema(CaptureCleanupSchema, cleanup, "Capture cleanup receipt");
    if (cleanup.key !== session.key || cleanup.ownerToken !== runtime.ownerToken || cleanup.resourcePrefix !== session.resourcePrefix || cleanup.phase !== "restored" || cleanup.remainingObjects !== 0 || cleanup.errors.length !== 0) {
      throw new Error("Capture cleanup receipt does not confirm native restoration.");
    }
    await registerArtifact(run, "capture-cleanup.json");

    await runtime.complete();
    await Bun.write(resolve(run.directory, "runtime-cleanup.json"), Bun.file(runtime.cleanupReceiptPath));
    await registerArtifact(run, "runtime-cleanup.json");
    await run.succeed();
    return {
      manifest: run.manifestPath,
      tiles,
      readiness: "unverified" as const,
      completeImagery: false as const,
    };
  } catch (error) {
    await run.fail(error);
    console.error(`Failed capture run: ${run.manifestPath}`);
    throw error;
  }
}
