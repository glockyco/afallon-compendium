import { expect, test } from "bun:test";
import { chmod, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ArtifactRunInput } from "@afallon/contracts";
import { readLatestSuccess, selectLatestSuccess } from "./references";
import { beginArtifactRun, type ArtifactRun } from "./runs";
import { ArtifactStore } from "./store";
import { reportGarbageCollection } from "./gc";

const input: ArtifactRunInput = {
  buildId: "25153357",
  operation: "scan",
  settings: {},
  schemas: [],
  implementationFingerprint: "a".repeat(64),
  cacheKey: "b".repeat(64),
  probeHashes: {},
  diagnosticRevision: "test",
  inputs: {},
};

async function fixture(run: (store: ArtifactStore, begin: () => Promise<ArtifactRun>) => Promise<void>): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), "afallon-refs-"));
  const store = new ArtifactStore(root);
  const runs: ArtifactRun[] = [];
  try {
    await run(store, async () => {
      const artifactRun = await beginArtifactRun(store, input);
      runs.push(artifactRun);
      return artifactRun;
    });
  } finally {
    try { await Promise.all(runs.map(run => run.release())); }
    finally { await rm(root, { recursive: true, force: true }); }
  }
}

test("only a verified successful run replaces its scoped reference", async () => fixture(async (store, begin) => {
  const first = await begin();
  const firstObject = await store.putBytes(new TextEncoder().encode("first"));
  await first.addArtifact("result.json", firstObject, { mediaType: "application/json" });
  await first.succeed();
  await selectLatestSuccess(store, first.manifestPath);
  const selected = await readLatestSuccess(store, input.buildId, input.operation);
  expect(selected?.pointer.runId).toBe(first.runId);

  const failed = await begin();
  const partial = await store.putBytes(new TextEncoder().encode("partial"));
  await failed.addArtifact("partial.json", partial, { mediaType: "application/json" });
  const failedManifest = await failed.fail(new Error("expected failure"));
  await expect(selectLatestSuccess(store, failed.manifestPath)).rejects.toThrow("is not successful");
  expect((await readLatestSuccess(store, input.buildId, input.operation))?.pointer.runId).toBe(first.runId);
  expect(failedManifest.outputs).toHaveLength(1);

  const damaged = await begin();
  const damagedObject = await store.putBytes(new TextEncoder().encode("second"));
  await damaged.addArtifact("result.json", damagedObject, { mediaType: "application/json" });
  const objectPath = store.objectPath(damagedObject.sha256);
  await chmod(objectPath, 0o644);
  await writeFile(objectPath, "corrupt");
  await expect(damaged.succeed()).rejects.toMatchObject({ cause: { name: "ObjectIntegrityError", expectedSha256: damagedObject.sha256 } });
  await damaged.fail(new Error("object verification failed"));
  expect((await readLatestSuccess(store, input.buildId, input.operation))?.pointer.runId).toBe(first.runId);
}));

test("a selector write failure leaves terminal success and the previous selector intact", async () => fixture(async (store, begin) => {
  const previous = await begin();
  await previous.succeed();
  await selectLatestSuccess(store, previous.manifestPath);
  const next = await begin();
  const object = await next.putBytes(new TextEncoder().encode("new evidence"));
  await next.addArtifact("result.json", object, { mediaType: "application/json" });
  await next.succeed();
  expect((await readLatestSuccess(store, input.buildId, input.operation))?.manifest.runId).toBe(previous.runId);
  const terminalBytes = await readFile(next.manifestPath);
  const directory = join(store.root, "refs", input.buildId, input.operation);
  await chmod(directory, 0o555);
  try { await expect(selectLatestSuccess(store, next.manifestPath)).rejects.toMatchObject({ code: "EACCES" }); }
  finally { await chmod(directory, 0o755); }
  expect(await readFile(next.manifestPath)).toEqual(terminalBytes);
  expect(next.status).toBe("succeeded");
  const report = await reportGarbageCollection(store, { retainedRunIds: [] });
  for (const identity of [object, next.manifestIdentity!]) {
    expect(report.objects.find(candidate => candidate.content.sha256 === identity.sha256)?.disposition).toBe("preserve");
  }
  expect((await readLatestSuccess(store, input.buildId, input.operation))?.manifest.runId).toBe(previous.runId);
  await expect(next.fail(new Error("selection failed"))).rejects.toMatchObject({ name: "RunStateError" });
  await selectLatestSuccess(store, next.manifestPath);
  expect((await readLatestSuccess(store, input.buildId, input.operation))?.manifest.runId).toBe(next.runId);
}));
