import { expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ArtifactRunInput, ContentIdentity } from "@afallon/contracts";
import { reportGarbageCollection } from "./gc";
import { createArtifactLease, readArtifactLeases, type ActiveArtifactLease } from "./leases";
import { beginArtifactRun, type ArtifactRun } from "./runs";
import { selectLatestSuccess } from "./references";
import { ArtifactStore } from "./store";

function input(operation: string): ArtifactRunInput {
  return { buildId: "25153357", operation, settings: {}, schemas: [], implementationFingerprint: "a".repeat(64), cacheKey: "b".repeat(64), probeHashes: {}, diagnosticRevision: "test", inputs: {} };
}

async function failedRun(store: ArtifactStore, operation: string, object: ContentIdentity) {
  const run = await beginArtifactRun(store, input(operation));
  try {
    await run.addArtifact("result.bin", object, { mediaType: "application/octet-stream" });
    await run.fail(new Error("retained failure"));
    return run;
  } finally { await run.release(); }
}

test("GC reports each object once with all retaining references", async () => {
  const root = await mkdtemp(join(tmpdir(), "afallon-gc-"));
  const finish = Promise.withResolvers<void>();
  let pendingWrite: Promise<unknown> | undefined;
  let latest: ArtifactRun | undefined;
  let lease: ActiveArtifactLease | undefined;
  try {
    const store = new ArtifactStore(root);
    const latestObject = await store.putBytes(new TextEncoder().encode("latest"));
    latest = await beginArtifactRun(store, input("scan"));
    await latest.addArtifact("result.bin", latestObject, { mediaType: "application/octet-stream" });
    await latest.succeed();
    await selectLatestSuccess(store, latest.manifestPath);
    await latest.release();

    const retainedObject = await store.putBytes(new TextEncoder().encode("retained"));
    const retained = await failedRun(store, "retained", retainedObject);
    const sharedObject = await store.putBytes(new TextEncoder().encode("shared"));
    const sharedA = await failedRun(store, "shared-a", sharedObject);
    const sharedB = await failedRun(store, "shared-b", sharedObject);

    const activeObject = await store.putBytes(new TextEncoder().encode("active"));
    lease = await createArtifactLease(store, { runId: "active-run", buildId: input("active").buildId, operation: "active", objects: [activeObject] });
    const unreachableObject = await store.putBytes(new TextEncoder().encode("unreachable"));

    const ready = Promise.withResolvers<void>();
    pendingWrite = store.putStream((async function* () {
      yield new TextEncoder().encode("temporary-");
      ready.resolve();
      await finish.promise;
      yield new TextEncoder().encode("write");
    })());
    await ready.promise;

    const report = await reportGarbageCollection(store, { retainedRunIds: [retained.runId, sharedA.runId, sharedB.runId] });
    expect(report.summary).toEqual({ total: 9, preserved: 8, unreachable: 1 });
    expect(report.objects.map((object) => object.content.sha256)).toEqual([...new Set(report.objects.map((object) => object.content.sha256))]);
    expect(report.objects.find((object) => object.content.sha256 === latestObject.sha256)?.protections).toEqual(["latest:25153357/scan"]);
    expect(report.objects.find((object) => object.content.sha256 === retainedObject.sha256)?.protections).toEqual([`run:${retained.runId}`]);
    expect(report.objects.find((object) => object.content.sha256 === sharedObject.sha256)?.protections).toEqual([`run:${sharedA.runId}`, `run:${sharedB.runId}`].sort());
    expect(report.objects.find((object) => object.content.sha256 === activeObject.sha256)?.protections).toEqual([`lease:${lease.leaseId}`]);
    expect(report.objects.find((object) => object.content.sha256 === unreachableObject.sha256)?.disposition).toBe("unreachable");

    finish.resolve();
    await pendingWrite;
  } finally {
    finish.resolve();
    await pendingWrite?.catch(() => undefined);
    try { await Promise.all([latest?.release(), lease?.release()]); }
    finally { await rm(root, { recursive: true, force: true }); }
  }
});

test("a retained publication protects source manifests, evidence, and declared resources", async () => {
  const root = await mkdtemp(join(tmpdir(), "afallon-gc-closure-"));
  const runs: ArtifactRun[] = [];
  try {
    const store = new ArtifactStore(root);
    const scan = await beginArtifactRun(store, input("scan"));
    runs.push(scan);
    const evidence = await scan.putBytes(new TextEncoder().encode("raw evidence"));
    await scan.addArtifact("evidence.json", evidence, { mediaType: "application/json" });
    await scan.succeed();
    const catalog = await beginArtifactRun(store, { ...input("catalog"), inputs: { scan: scan.manifestIdentity! }, inputManifests: ["scan"] });
    runs.push(catalog);
    await scan.release();
    const database = await catalog.putBytes(new TextEncoder().encode("sealed catalog"));
    await catalog.addArtifact("catalog.sqlite", database, { mediaType: "application/vnd.sqlite3" });
    await catalog.succeed();
    const publication = await beginArtifactRun(store, { ...input("publish"), inputs: { catalog: catalog.manifestIdentity! }, inputManifests: ["catalog"] });
    runs.push(publication);
    await catalog.release();
    const resource = await publication.putBytes(new TextEncoder().encode("map resource"));
    const publicRoot = await publication.putBytes(new TextEncoder().encode("root resource"));
    await publication.addArtifact("publication.json", publicRoot, { mediaType: "application/json", references: [{ kind: "object", content: { sha256: resource.sha256, bytes: resource.bytes } }] });
    await publication.succeed();
    await publication.release();
    const report = await reportGarbageCollection(store, { retainedRunIds: [publication.runId] });
    for (const identity of [evidence, scan.manifestIdentity!, database, catalog.manifestIdentity!, resource, publicRoot, publication.manifestIdentity!]) {
      const retained = report.objects.find(object => object.content.sha256 === identity.sha256);
      expect(retained?.disposition).toBe("preserve");
      expect(retained?.protections.some(reason => reason.startsWith(`run:${publication.runId}`))).toBe(true);
    }
    await rm(store.objectPath(evidence.sha256));
    await expect(reportGarbageCollection(store, { retainedRunIds: [publication.runId] })).rejects.toMatchObject({ cause: { code: "ENOENT" } });
  } finally {
    try { await Promise.all(runs.map(run => run.release())); }
    finally { await rm(root, { recursive: true, force: true }); }
  }
});

test("failed initial verification removes only its new admission lease", async () => {
  const root = await mkdtemp(join(tmpdir(), "afallon-gc-rejected-lease-"));
  let existing: ActiveArtifactLease | undefined;
  try {
    const store = new ArtifactStore(root);
    const object = await store.putBytes(new TextEncoder().encode("valid input"));
    existing = await createArtifactLease(store, { runId: "existing", buildId: "25153357", operation: "import", objects: [object] });
    expect((await readArtifactLeases(store)).map(lease => lease.leaseId)).toEqual([existing.leaseId]);
    const missing = { sha256: "f".repeat(64), bytes: 1 };
    await expect(createArtifactLease(store, { runId: "rejected", buildId: "25153357", operation: "import", objects: [object, missing] })).rejects.toMatchObject({ code: "ENOENT" });
    await expect(createArtifactLease(store, { runId: "existing", buildId: "25153357", operation: "import", objects: [missing] })).rejects.toMatchObject({ code: "EEXIST" });
    expect((await readArtifactLeases(store)).map(lease => lease.leaseId)).toEqual([existing.leaseId]);
    const report = await reportGarbageCollection(store, { retainedRunIds: [] });
    expect(report.objects.find(candidate => candidate.content.sha256 === object.sha256)?.disposition).toBe("preserve");
  } finally {
    try { await existing?.release(); }
    finally { await rm(root, { recursive: true, force: true }); }
  }
});

test("an admission lease protects inputs before collectible publication", async () => {
  const root = await mkdtemp(join(tmpdir(), "afallon-gc-pending-"));
  try {
    const store = new ArtifactStore(root);
    const lease = await createArtifactLease(store, { runId: "preparation", buildId: "25153357", operation: "import", objects: [] });
    let object: ContentIdentity;
    try {
      object = await store.putBytes(new TextEncoder().encode("pending input"), {
        async protectPending(identity) {
          await lease.protectPending(identity);
          const pending = await reportGarbageCollection(store, { retainedRunIds: [] });
          expect(pending.objects.find(object => object.content.sha256 === identity.sha256)).toBeUndefined();
        },
        async protect(identity) {
          const published = await reportGarbageCollection(store, { retainedRunIds: [] });
          expect(published.objects.find(object => object.content.sha256 === identity.sha256)?.disposition).toBe("preserve");
          await lease.protect(identity);
        },
      });
    } finally { await lease.release(); }
    const released = await reportGarbageCollection(store, { retainedRunIds: [] });
    expect(released.objects.find(candidate => candidate.content.sha256 === object.sha256)?.disposition).toBe("unreachable");
  } finally { await rm(root, { recursive: true, force: true }); }
});
