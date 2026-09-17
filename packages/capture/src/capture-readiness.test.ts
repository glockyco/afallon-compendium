import { expect, test } from "bun:test";
import { blockingIssues, withCaptureGeometry } from "./capture-readiness";
import type { CaptureGeometry } from "@afallon/contracts"

test("an authored content defect never blocks readiness, an inventory integrity failure does", () => {
  const geometry = {
    issues: [
      { kind: "missing-material", sourceId: -2305742, detail: "Selected mesh renderer has a missing shared material at slot 3." },
      { kind: "missing-terrain", sourceId: 17, detail: "Terrain.terrainData is missing." },
      { kind: "source-integrity", sourceId: 9, detail: "Renderer.bounds could not be read." },
    ],
  } as unknown as CaptureGeometry;
  expect(blockingIssues(geometry).map(issue => issue.kind)).toEqual(["source-integrity"]);
});


import { createHash } from "node:crypto";
import { mkdtemp, realpath, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ArtifactStore } from "@afallon/artifacts";
import type { ArtifactRunInput, CapturePlan, CompendiumConfig } from "@afallon/contracts";
import type { Runtime } from "@afallon/runtime";
import { beginCaptureWorkspace } from "./content-run";

test.each(["poll", "start-context"] as const)("early %s failure releases acquired stream holds and retains cleanup instead of empty readiness", async failurePoint => {
  const root = await realpath(await mkdtemp(join(tmpdir(), "afallon-readiness-")));
  const store = new ArtifactStore(root);
  const runInput: ArtifactRunInput = { buildId: "build", operation: "capture", settings: {}, schemas: [], implementationFingerprint: "a".repeat(64), cacheKey: "b".repeat(64), probeHashes: {}, diagnosticRevision: "test", inputs: {} };
  const workspace = await beginCaptureWorkspace(store, runInput);
  const config: CompendiumConfig = { gamePath: root, outputRoot: root, runtimeOutputRoot: root, hotreplUrl: "http://test", character: "research", finalSceneNativeId: 1, finalScenePath: "Assets/World.unity", timeoutMs: 1000 };
  const frame = { center: { x: 0, z: 0 }, worldSize: { x: 10, z: 10 }, cameraY: 20, nearClip: 1, farClip: 30 };
  const plan: CapturePlan = { schemaVersion: "compendium.capture-plan.v9", sceneNativeId: 1, scenePath: "Assets/World.unity", mapSpaceId: "world-surface", width: 256, height: 256, cullingMask: -1, lighting: { ambient: { r: 1, g: 1, b: 1 }, directionalIntensity: 1, directionalEuler: { x: 0, y: 0, z: 0 } }, readiness: { timeoutMs: 1000, stableFrames: 2, settleFrames: 0, boundaryOverlap: 0 }, tiles: [{ id: "cell", frame }] };
  const ownerToken = "11111111-1111-4111-8111-111111111111";
  const abort = new AbortController();
  let held = false;
  let cleanupPath = "";
  let rendered = false;
  let nativeFrame = 1;
  const row = { loaderInstanceId: 7, assetGuid: "source", activeInHierarchy: true, enabled: true, initiallyLoaded: false, loaded: false, loading: false, hasHandle: false, rootInstanceId: null, skippedReason: null, holdUntil: 0, originalHoldUntil: 0, position: { x: 0, y: 0, z: 0 }, playerDistance: 0, loadDistance: 10 };
  const geometry: CaptureGeometry = {
    schemaVersion: "compendium.capture-geometry.v5", visualPolicy: "compendium.capture-visual-policy.v5", excludedRenderers: [], frame: 1,
    scene: { nativeId: 1, handle: 2, path: plan.scenePath, ready: true }, frustum: { center: { x: 0, y: 4.5, z: 0 }, size: { x: 10, y: 29, z: 10 } },
    preloadEnvelope: { center: { x: 0, y: 4.5, z: 0 }, radius: Math.sqrt(1041) / 2 }, nativeNeedsPreload: false,
    queries: { loaders: { all: 1, scene: 1, foreign: 0 }, renderers: { all: 0, scene: 0, foreign: 0 }, terrains: { all: 0, scene: 0, foreign: 0 } },
    sources: [{ instanceId: 7, assetGuid: "source", hierarchyPath: "Source", category: null, position: row.position, activeSelf: true, activeInHierarchy: true, enabled: true, coversEnvelope: true, coversFrustum: true, intersectsFrustum: true, loadedOrLoading: false, loaded: false, loading: false, hasHandle: false, automaticLoadPending: false, rootId: null, rootActive: null, holdUntil: 0, loadDistance: 10, playerDistance: 0 }],
    meshes: [], terrains: [], otherRenderers: [], issues: [],
  };
  const runtime = {
    ownerToken, signal: abort.signal,
    cancel(error: unknown) { abort.abort(error); },
    async close() { held = false; },
    async probe(_source: string, path: string, options: { parameters?: Record<string, unknown> }) {
      const action = options.parameters?.action;
      if (action === "poll") throw new Error("Readiness failed after acquisition.");
      let value: unknown = geometry;
      if (action === "start") { held = true; cleanupPath = String(options.parameters?.cleanupPath); value = { key: "stream", phase: "ready", frame: ++nativeFrame, sceneHandle: 2, rows: [{ ...row, holdUntil: 30 }] }; }
      if (action === "restore") {
        held = false;
        value = { key: "stream", phase: "restored", frame: ++nativeFrame, sceneHandle: 2, rows: [row] };
        await Bun.write(cleanupPath, JSON.stringify({ schemaVersion: "compendium.stream-cleanup.v1", key: "stream", ownerToken, sceneHandle: 2, frame: nativeFrame, rows: [row], remainingOwnedRoots: 0, errors: [] }));
      }
      const bytes = new TextEncoder().encode(JSON.stringify(value));
      await Bun.write(path, bytes);
      const context = { researchCharacter: failurePoint === "start-context" && action === "start" ? "other" : "research", frame: nativeFrame, scene: { name: "World", path: plan.scenePath, handle: 2, isLoaded: true }, gameSceneNativeId: 1 };
      return { value, reference: { sha256: createHash("sha256").update(bytes).digest("hex") }, observationContext: { schemaVersion: "compendium.observation-context.v1", started: context, completed: context } };
    },
  } as unknown as Runtime;
  try {
    await expect(withCaptureGeometry(runtime, config, workspace, plan, { tile: plan.tiles[0]!, frame }, async () => { rendered = true; })).rejects.toThrow();
    expect(held).toBe(false);
    expect(rendered).toBe(false);
    expect([...workspace.artifacts.keys()].some(name => name.endsWith("/readiness.json"))).toBe(false);
    const receipt = workspace.artifacts.get("tiles/cell.geometry/stream-cleanup.json")!;
    expect(await Bun.file(store.objectPath(receipt.content.sha256)).json()).toMatchObject({ ownerToken, remainingOwnedRoots: 0, rows: [{ holdUntil: 0, originalHoldUntil: 0 }] });
    await workspace.run.fail(new Error("Expected readiness failure."));
    await workspace.dispose();
    await store.verify(receipt.content);
  } finally {
    try { await workspace.dispose(); }
    finally { await rm(root, { recursive: true, force: true }); }
  }
});
