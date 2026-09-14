import { expect, test } from "bun:test";
import { chmod, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ArtifactRunInput } from "@afallon/contracts";
import { readLatestSuccess, selectLatestSuccess } from "./references";
import { beginArtifactRun } from "./runs";
import { ArtifactStore } from "./store";

const input: ArtifactRunInput = {
  buildId: "25153357",
  operation: "scan",
  settings: {},
  schemas: [],
  implementationFingerprint: "a".repeat(64),
  diagnosticRevision: "test",
  inputs: {},
};

async function fixture(run: (store: ArtifactStore) => Promise<void>): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), "afallon-refs-"));
  try {
    await run(new ArtifactStore(root));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test("only a verified successful run replaces its scoped reference", async () => fixture(async (store) => {
  const first = await beginArtifactRun(store, input);
  const firstObject = await store.putBytes(new TextEncoder().encode("first"));
  await first.addArtifact("result.json", firstObject, { mediaType: "application/json" });
  await first.succeed();
  const selected = await readLatestSuccess(store, input.buildId, input.operation);
  expect(selected?.pointer.runId).toBe(first.runId);

  const failed = await beginArtifactRun(store, input);
  const partial = await store.putBytes(new TextEncoder().encode("partial"));
  await failed.addArtifact("partial.json", partial, { mediaType: "application/json" });
  const failedManifest = await failed.fail(new Error("expected failure"));
  await expect(selectLatestSuccess(store, failed.manifestPath)).rejects.toThrow("is not successful");
  expect((await readLatestSuccess(store, input.buildId, input.operation))?.pointer.runId).toBe(first.runId);
  expect(failedManifest.outputs).toHaveLength(1);

  const damaged = await beginArtifactRun(store, input);
  const damagedObject = await store.putBytes(new TextEncoder().encode("second"));
  await damaged.addArtifact("result.json", damagedObject, { mediaType: "application/json" });
  const objectPath = store.objectPath(damagedObject.sha256);
  await chmod(objectPath, 0o644);
  await writeFile(objectPath, "corrupt");
  await expect(damaged.succeed()).rejects.toThrow("integrity failed");
  await damaged.fail(new Error("object verification failed"));
  expect((await readLatestSuccess(store, input.buildId, input.operation))?.pointer.runId).toBe(first.runId);
}));
