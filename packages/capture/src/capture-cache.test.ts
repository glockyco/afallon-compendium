import { expect, test } from "bun:test";
import { chmod, mkdtemp, rename, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ArtifactStore } from "@afallon/artifacts";
import type { CapturePlan, CaptureTileCheckpoint, ContentIdentity } from "@afallon/contracts";
import { readCaptureArtifactJson, tileCompatibilityKey, validateCaptureCleanup } from "./capture-cache";

async function json(store: ArtifactStore, value: unknown): Promise<ContentIdentity> {
  const object = await store.putBytes(new TextEncoder().encode(JSON.stringify(value)));
  return { sha256: object.sha256, bytes: object.bytes };
}

async function cleanupFixture(store: ArtifactStore) {
  const ownerToken = "11111111-1111-4111-8111-111111111111";
  const runId = "22222222-2222-4222-8222-222222222222";
  const capture = await json(store, { schemaVersion: "compendium.capture-cleanup.v1", key: "capture", ownerToken, resourcePrefix: "capture-prefix", phase: "restored", frame: 10, remainingObjects: 0, errors: [] });
  const runtime = await json(store, { schemaVersion: "compendium.runtime-owner.v1", token: ownerToken, state: "clean", reason: "completed", callbacksRemaining: 0, cleanupErrors: [], frame: 11 });
  const proof = { schemaVersion: "compendium.capture-sweep-cleanup.v1", runId: "sweep", ownerToken, planRunIds: [runId], finalScene: { nativeId: 1, path: "Assets/World.unity" }, sceneTransitions: [], runtimeCleanup: { name: "runtime-cleanup.json", content: runtime } };
  const sweep = await json(store, proof);
  const checkpoint = { origin: { runId, ownerToken, captureKey: "capture" }, artifacts: { cleanup: { capture, sweep } } } as CaptureTileCheckpoint;
  return { checkpoint, proof, runtime };
}

test("capture cleanup resolves after store relocation and rejects another native owner", async () => {
  const root = await mkdtemp(join(tmpdir(), "afallon-cache-"));
  const relocated = `${root}-relocated`;
  try {
    const store = new ArtifactStore(root);
    const { checkpoint, proof } = await cleanupFixture(store);
    await rename(root, relocated);
    const movedStore = new ArtifactStore(relocated);
    await validateCaptureCleanup(movedStore, checkpoint, "capture-prefix");
    const wrongOwner = await json(movedStore, { ...proof, ownerToken: "33333333-3333-4333-8333-333333333333" });
    checkpoint.artifacts.cleanup!.sweep = wrongOwner;
    await expect(validateCaptureCleanup(movedStore, checkpoint, "capture-prefix")).rejects.toThrow("does not own");
  } finally { await rm(root, { recursive: true, force: true }); await rm(relocated, { recursive: true, force: true }); }
});

test("capture cleanup rejects tampered and missing native receipt objects", async () => {
  const root = await mkdtemp(join(tmpdir(), "afallon-cache-"));
  try {
    const store = new ArtifactStore(root);
    const { checkpoint, runtime } = await cleanupFixture(store);
    await chmod(store.objectPath(runtime.sha256), 0o600);
    await Bun.write(store.objectPath(runtime.sha256), "x".repeat(runtime.bytes));
    await expect(validateCaptureCleanup(store, checkpoint, "capture-prefix")).rejects.toThrow();
    await rm(store.objectPath(runtime.sha256));
    await expect(validateCaptureCleanup(store, checkpoint, "capture-prefix")).rejects.toThrow();
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("an absolute scratch path cannot replace a missing registered receipt", async () => {
  const root = await mkdtemp(join(tmpdir(), "afallon-cache-"));
  try {
    const store = new ArtifactStore(root);
    const reference = await json(store, { state: "clean" });
    const scratch = join(root, "old-receipt.json");
    await Bun.write(scratch, Bun.file(store.objectPath(reference.sha256)));
    await rm(store.objectPath(reference.sha256));
    await expect(readCaptureArtifactJson(store, { ...reference, path: scratch } as ContentIdentity)).rejects.toThrow();
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("unrelated tiles preserve compatibility while rendering inputs invalidate it", () => {
  const plan: CapturePlan = {
    schemaVersion: "compendium.capture-plan.v9", sceneNativeId: 1, scenePath: "Assets/World.unity", mapSpaceId: "world-surface", width: 256, height: 256, cullingMask: -1,
    lighting: { ambient: { r: 1, g: 1, b: 1 }, directionalIntensity: 1, directionalEuler: { x: 0, y: 0, z: 0 } },
    readiness: { timeoutMs: 1000, stableFrames: 2, settleFrames: 0, boundaryOverlap: 0 },
    tiles: [{ id: "first", frame: { center: { x: 0, z: 0 }, worldSize: { x: 256, z: 256 }, cameraY: 100, nearClip: 1, farClip: 200 } }],
  };
  const input = { buildId: "build", buildHashes: { game: "a".repeat(64) }, profileSha256: "b".repeat(64), pipelineHashes: { "tool:capture-fingerprint": "c".repeat(64) }, character: "research", plan, tile: plan.tiles[0]!, standingPoint: null };
  const key = tileCompatibilityKey(input);
  const expanded = structuredClone(plan);
  expanded.tiles.push({ ...expanded.tiles[0]!, id: "second" });
  expect(tileCompatibilityKey({ ...input, plan: expanded })).toBe(key);
  expect(tileCompatibilityKey({ ...input, plan: { ...plan, cullingMask: 0 } })).not.toBe(key);
  expect(tileCompatibilityKey({ ...input, pipelineHashes: { "tool:capture-fingerprint": "d".repeat(64) } })).not.toBe(key);
});
