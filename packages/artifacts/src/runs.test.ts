import { expect, test } from "bun:test";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ArtifactRunInput } from "@afallon/contracts";
import { beginArtifactRun, inspectArtifactRun, readArtifactRunManifest, type ArtifactRun } from "./runs";
import { createArtifactLease, readArtifactLeases } from "./leases";
import { reportGarbageCollection } from "./gc";
import { readLatestSuccess, resolveArtifactRun, selectLatestSuccess } from "./references";
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

async function fixture(run: (store: ArtifactStore, root: string, begin: () => Promise<ArtifactRun>) => Promise<void>): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), "afallon-runs-v2-"));
  const store = new ArtifactStore(root);
  const runs: ArtifactRun[] = [];
  try {
    await run(store, root, async () => {
      const artifactRun = await beginArtifactRun(store, input);
      runs.push(artifactRun);
      return artifactRun;
    });
  } finally {
    try { await Promise.all(runs.map(run => run.release())); }
    finally { await rm(root, { recursive: true, force: true }); }
  }
}

test("failed manifests retain produced objects and failure evidence", async () => fixture(async (store, root, begin) => {
  const previous = await begin();
  await previous.succeed();
  await selectLatestSuccess(store, previous.manifestPath);
  await previous.release();
  const run = await begin();
  const admittedPath = join(root, "runs", run.runId, "revisions", "00000000.json");
  const object = await run.putBytes(new TextEncoder().encode("partial evidence"));
  await run.addArtifact("raw/world-sources.json", object, { mediaType: "application/json", schemaId: "compendium.world-sources.v7" });
  const failed = await run.fail(new Error("collector failed"));

  expect(failed).toMatchObject({ status: "failed", phase: "preparation", outputs: [{ name: "raw/world-sources.json", content: { sha256: object.sha256, bytes: object.bytes } }], failure: { name: "Error", message: "collector failed" } });
  expect(await readArtifactRunManifest(run.manifestPath)).toEqual(failed);
  await expect(readFile(admittedPath)).rejects.toMatchObject({ code: "ENOENT" });
  expect((await readLatestSuccess(store, input.buildId, input.operation))?.manifest.runId).toBe(previous.runId);
  expect((await inspectArtifactRun(store, run.runId)).manifest.execution.pid).toBe(process.pid);
  await expect(run.addArtifact("other.json", object, { mediaType: "application/json" })).rejects.toMatchObject({ name: "RunStateError" });
  await expect(run.succeed()).rejects.toMatchObject({ name: "RunStateError" });
}));

test("successful manifests replace revision journals and reject later mutation", async () => fixture(async (store, root, begin) => {
  const run = await begin();
  const object = await store.putBytes(new TextEncoder().encode("complete evidence"));
  await run.addArtifact("result.json", object, { mediaType: "application/json" });
  const succeeded = await run.succeed();

  expect(succeeded.status).toBe("succeeded");
  expect(succeeded.failure).toBeNull();
  expect(await readArtifactRunManifest(run.manifestPath)).toEqual(succeeded);
  await expect(readdir(join(root, "runs", run.runId, "revisions"))).rejects.toMatchObject({ code: "ENOENT" });
  expect(await resolveArtifactRun(store, run.manifestIdentity!, { buildId: input.buildId, operation: input.operation })).toEqual(succeeded);
  await expect(run.fail(new Error("late failure"))).rejects.toMatchObject({ name: "RunStateError" });
}));

test.each(["succeeded", "failed"] as const)("%s output remains protected until explicit release", async status => fixture(async (store, _root, begin) => {
  const run = await begin();
  const output = await run.putBytes(new TextEncoder().encode("terminal evidence"));
  await run.addArtifact("result.bin", output, { mediaType: "application/octet-stream" });
  if (status === "succeeded") await run.succeed();
  else await run.fail(new Error("collector failed"));
  const manifest = run.manifestIdentity;
  if (manifest === null) throw new Error("Terminal run has no manifest identity.");
  const terminalBytes = await readFile(run.manifestPath);
  expect((await readArtifactLeases(store)).map(lease => lease.runId)).toEqual([run.runId]);
  const protectedReport = await reportGarbageCollection(store, { retainedRunIds: [] });
  for (const identity of [output, manifest]) {
    expect(protectedReport.objects.find(object => object.content.sha256 === identity.sha256)?.disposition).toBe("preserve");
  }
  if (status === "succeeded") await selectLatestSuccess(store, run.manifestPath);
  await run.release();
  expect(await readArtifactLeases(store)).toEqual([]);
  const releasedReport = await reportGarbageCollection(store, { retainedRunIds: [] });
  for (const identity of [output, manifest]) {
    expect(releasedReport.objects.find(object => object.content.sha256 === identity.sha256)?.disposition).toBe(status === "succeeded" ? "preserve" : "unreachable");
  }
  expect(await readFile(run.manifestPath)).toEqual(terminalBytes);
}));

test("rejected preparation releases its lease even when failure evidence cannot be sealed", async () => fixture(async store => {
  const invalidInput = { ...input, inputs: { missing: { sha256: "f".repeat(64), bytes: 1 } } };
  await expect(beginArtifactRun(store, invalidInput)).rejects.toThrow("failed during preparation");
  expect(await readArtifactLeases(store)).toEqual([]);
  class UnwritableStore extends ArtifactStore {
    override async putBytes(): Promise<never> { throw new Error("Object storage is unavailable."); }
  }
  await expect(beginArtifactRun(new UnwritableStore(store.root), invalidInput)).rejects.toBeInstanceOf(AggregateError);
  expect(await readArtifactLeases(store)).toEqual([]);
  expect((await reportGarbageCollection(store, { retainedRunIds: [] })).summary.unreachable).toBe(1);
}));

test("a revision collision preserves admitted bytes and permits retry", async () => fixture(async (store, root, begin) => {
  const run = await begin();
  const directory = join(root, "runs", run.runId, "revisions");
  const nextPath = join(directory, "00000001.json");
  const collisionBytes = "existing immutable revision\n";
  await writeFile(nextPath, collisionBytes, { flag: "wx" });
  await expect(run.setPhase("execution")).rejects.toMatchObject({ code: "EEXIST" });
  expect(await readFile(nextPath, "utf8")).toBe(collisionBytes);
  expect((await readdir(directory)).sort()).toEqual(["00000000.json", "00000001.json"]);
  await rm(nextPath);
  expect((await inspectArtifactRun(store, run.runId)).manifest).toMatchObject({ revision: 0, phase: "preparation" });
  await run.setPhase("execution");
  expect((await inspectArtifactRun(store, run.runId)).manifest).toMatchObject({ revision: 1, phase: "execution" });
}));

test("artifact paths reject unsafe segments before accessing the filesystem", async () => fixture(async store => {
  for (const segment of ["", ".", "..", "parent/child", "parent\\child", "drive:name", "control\u0000", "control\u001f", "control\u007f"]) {
    await expect(inspectArtifactRun(store, segment)).rejects.toBeInstanceOf(TypeError);
    await expect(createArtifactLease(store, { runId: segment, buildId: "build", operation: "scan", objects: [] })).rejects.toBeInstanceOf(TypeError);
    await expect(readLatestSuccess(store, segment, "scan")).rejects.toBeInstanceOf(TypeError);
    await expect(readLatestSuccess(store, "build", segment)).rejects.toBeInstanceOf(TypeError);
    if (segment !== "") {
      await expect(beginArtifactRun(store, { ...input, buildId: segment })).rejects.toBeInstanceOf(TypeError);
      await expect(beginArtifactRun(store, { ...input, operation: segment })).rejects.toBeInstanceOf(TypeError);
    }
  }
  const run = await beginArtifactRun(store, { ...input, buildId: "build-1.2_é", operation: "scan preview" });
  try {
    await run.succeed();
    await selectLatestSuccess(store, run.manifestPath);
    expect((await readLatestSuccess(store, "build-1.2_é", "scan preview"))?.manifest.runId).toBe(run.runId);
    expect((await inspectArtifactRun(store, run.runId)).state).toBe("terminal");
  } finally { await run.release(); }
}));

test("interrupted preparation retains its latest outputs without claiming success", async () => fixture(async (store, _root, begin) => {
  const run = await begin();
  const object = await run.putBytes(new TextEncoder().encode("planning inventory"));
  await run.addArtifact("planning/inventory.json", object, { mediaType: "application/json" });
  await run.release();
  await expect(run.putBytes(new TextEncoder().encode("late write"))).rejects.toMatchObject({ name: "RunStateError" });
  const inspected = await inspectArtifactRun(store, run.runId);
  expect(inspected.state).toBe("interrupted");
  expect(inspected.manifest).toMatchObject({ status: "running", phase: "preparation", failure: null, timestamps: { completedAt: null } });
  expect(inspected.manifest.outputs[0]?.content).toEqual({ sha256: object.sha256, bytes: object.bytes });
  expect(await readLatestSuccess(store, input.buildId, input.operation)).toBeNull();
}));
