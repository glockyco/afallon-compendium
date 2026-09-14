import { expect, test } from "bun:test";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ArtifactRunInput } from "@afallon/contracts";
import { beginArtifactRun, readArtifactRunManifest } from "./runs";
import { ArtifactStore } from "./store";

const input: ArtifactRunInput = {
  buildId: "25153357",
  operation: "scan",
  settings: { target: "current-scene" },
  schemas: [{ id: "compendium.world-sources.v7", sha256: "a".repeat(64) }],
  implementationFingerprint: "b".repeat(64),
  cacheKey: "c".repeat(64),
  probeHashes: {},
  diagnosticRevision: "test",
  inputs: {},
};

async function fixture(run: (store: ArtifactStore, root: string) => Promise<void>): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), "afallon-runs-v2-"));
  try {
    await run(new ArtifactStore(root), root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test("failed manifests retain produced objects and failure evidence", async () => fixture(async (store, root) => {
  const run = await beginArtifactRun(store, input);
  const object = await store.putBytes(new TextEncoder().encode("partial evidence"));
  await run.addArtifact("raw/world-sources.json", object, { mediaType: "application/json", schemaId: "compendium.world-sources.v7" });
  const failed = await run.fail(new Error("collector failed"));

  expect(failed).toMatchObject({ status: "failed", revision: 2, outputs: [{ name: "raw/world-sources.json", content: { sha256: object.sha256, bytes: object.bytes } }], failure: { name: "Error", message: "collector failed" } });
  expect(await readArtifactRunManifest(run.manifestPath)).toEqual(failed);
  expect((await readdir(join(root, "runs", run.runId, "revisions"))).sort()).toEqual(["00000000.json", "00000001.json"]);
  await expect(run.addArtifact("other.json", object, { mediaType: "application/json" })).rejects.toThrow("already failed");
  await expect(run.succeed()).rejects.toThrow("already failed");
}));

test("successful manifests verify outputs and reject later mutation", async () => fixture(async (store) => {
  const run = await beginArtifactRun(store, input);
  const object = await store.putBytes(new TextEncoder().encode("complete evidence"));
  await run.addArtifact("result.json", object, { mediaType: "application/json" });
  const succeeded = await run.succeed();

  expect(succeeded.status).toBe("succeeded");
  expect(succeeded.failure).toBeNull();
  expect(await readArtifactRunManifest(run.manifestPath)).toEqual(succeeded);
  await expect(run.fail(new Error("late failure"))).rejects.toThrow("already succeeded");
}));
