import { expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ArtifactRunInput, ContentIdentity } from "@afallon/contracts";
import { reportGarbageCollection } from "./gc";
import { createArtifactLease } from "./leases";
import { beginArtifactRun } from "./runs";
import { ArtifactStore } from "./store";

function input(operation: string): ArtifactRunInput {
  return { buildId: "25153357", operation, settings: {}, schemas: [], implementationFingerprint: "a".repeat(64), diagnosticRevision: "test", inputs: {} };
}

async function failedRun(store: ArtifactStore, operation: string, object: ContentIdentity) {
  const run = await beginArtifactRun(store, input(operation));
  await run.addArtifact("result.bin", { ...object, path: store.objectPath(object.sha256) }, { mediaType: "application/octet-stream" });
  await run.fail(new Error("retained failure"));
  return run;
}

test("GC reports each object once with all retaining references", async () => {
  const root = await mkdtemp(join(tmpdir(), "afallon-gc-"));
  const finish = Promise.withResolvers<void>();
  let pendingWrite: Promise<unknown> | undefined;
  try {
    const store = new ArtifactStore(root);
    const latestObject = await store.putBytes(new TextEncoder().encode("latest"));
    const latest = await beginArtifactRun(store, input("scan"));
    await latest.addArtifact("result.bin", latestObject, { mediaType: "application/octet-stream" });
    await latest.succeed();

    const retainedObject = await store.putBytes(new TextEncoder().encode("retained"));
    const retained = await failedRun(store, "retained", retainedObject);
    const sharedObject = await store.putBytes(new TextEncoder().encode("shared"));
    const sharedA = await failedRun(store, "shared-a", sharedObject);
    const sharedB = await failedRun(store, "shared-b", sharedObject);

    const activeObject = await store.putBytes(new TextEncoder().encode("active"));
    const lease = await createArtifactLease(store, { runId: "active-run", buildId: input("active").buildId, operation: "active", objects: [activeObject] });
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
    expect(report.summary).toEqual({ total: 5, preserved: 4, unreachable: 1 });
    expect(report.objects.map((object) => object.content.sha256)).toEqual([...new Set(report.objects.map((object) => object.content.sha256))]);
    expect(report.objects.find((object) => object.content.sha256 === latestObject.sha256)?.protections).toEqual(["latest:25153357/scan"]);
    expect(report.objects.find((object) => object.content.sha256 === retainedObject.sha256)?.protections).toEqual([`run:${retained.runId}`]);
    expect(report.objects.find((object) => object.content.sha256 === sharedObject.sha256)?.protections).toEqual([`run:${sharedA.runId}`, `run:${sharedB.runId}`].sort());
    expect(report.objects.find((object) => object.content.sha256 === activeObject.sha256)?.protections).toEqual([`lease:${lease.leaseId}`]);
    expect(report.objects.find((object) => object.content.sha256 === unreachableObject.sha256)?.disposition).toBe("unreachable");

    finish.resolve();
    await pendingWrite;
    await lease.release();
  } finally {
    finish.resolve();
    await pendingWrite?.catch(() => undefined);
    await rm(root, { recursive: true, force: true });
  }
});
