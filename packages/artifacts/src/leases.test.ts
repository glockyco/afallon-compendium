import { expect, test } from "bun:test";
import { mkdir, mkdtemp, readFile, rename, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createArtifactLease, readArtifactLeases, type ActiveArtifactLease } from "./leases";
import { acquireExclusiveStoreLock } from "./lock";
import { ArtifactStore } from "./store";

test("failed initial verification removes only its new admission lease and releases the store", async () => {
  const root = await mkdtemp(join(tmpdir(), "afallon-rejected-lease-"));
  let existing: ActiveArtifactLease | undefined;
  try {
    const store = new ArtifactStore(root);
    const object = await store.putBytes(new TextEncoder().encode("valid input"));
    existing = await createArtifactLease(store, { runId: "existing", buildId: "25153357", operation: "import", objects: [object] });
    const missing = { sha256: "f".repeat(64), bytes: 1 };
    await expect(createArtifactLease(store, { runId: "rejected", buildId: "25153357", operation: "import", objects: [object, missing] })).rejects.toMatchObject({ code: "ENOENT" });
    await expect(createArtifactLease(store, { runId: "existing", buildId: "25153357", operation: "import", objects: [missing] })).rejects.toMatchObject({ code: "EEXIST" });
    expect((await readArtifactLeases(store)).map(lease => lease.leaseId)).toEqual([existing.leaseId]);
    await existing.release();
    existing = undefined;
    acquireExclusiveStoreLock(store).release();
  } finally {
    try { await existing?.release(); }
    finally { await rm(root, { recursive: true, force: true }); }
  }
});

test("failed lease cleanup preserves the object verification failure", async () => {
  const root = await mkdtemp(join(tmpdir(), "afallon-lease-cleanup-"));
  const primary = new Error("input verification failed");
  const leasePath = join(root, "leases", "rejected.json");
  class FailingStore extends ArtifactStore {
    override async verify(): Promise<never> {
      await rm(leasePath);
      await mkdir(leasePath);
      throw primary;
    }
  }
  try {
    const store = new FailingStore(root);
    await expect(createArtifactLease(store, {
      runId: "rejected", buildId: "25153357", operation: "import", objects: [{ sha256: "f".repeat(64), bytes: 1 }],
    })).rejects.toBe(primary);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("a lease update can retry after atomic replacement fails", async () => {
  const root = await mkdtemp(join(tmpdir(), "afallon-lease-replace-"));
  let lease: ActiveArtifactLease | undefined;
  try {
    const store = new ArtifactStore(root);
    const object = await store.putBytes(new TextEncoder().encode("protected evidence"));
    lease = await createArtifactLease(store, { runId: "admission", buildId: "25153357", operation: "import", objects: [] });
    const previousBytes = await readFile(lease.path);
    const retainedPath = join(root, "retained-lease.json");
    await rename(lease.path, retainedPath);
    await mkdir(lease.path);
    try {
      await expect(lease.protectPending(object)).rejects.toMatchObject({ code: "EISDIR" });
      expect(await readFile(retainedPath)).toEqual(previousBytes);
    } finally {
      await rm(lease.path, { recursive: true });
      await rename(retainedPath, lease.path);
    }
    await lease.protectPending(object);
    const content = { sha256: object.sha256, bytes: object.bytes };
    expect(await readArtifactLeases(store)).toMatchObject([{ leaseId: lease.leaseId, objects: [], pendingObjects: [content] }]);
    await lease.protect(object);
    expect(await readArtifactLeases(store)).toMatchObject([{ leaseId: lease.leaseId, objects: [content], pendingObjects: [] }]);
  } finally {
    try { await lease?.release(); }
    finally { await rm(root, { recursive: true, force: true }); }
  }
});

test("a batch protection records every object and manifest before it checks them", async () => {
  const root = await mkdtemp(join(tmpdir(), "afallon-lease-batch-"));
  const store = new ArtifactStore(root);
  try {
    const first = await store.putBytes(new TextEncoder().encode("first"));
    const manifest = await store.putBytes(new TextEncoder().encode("manifest"));
    const lease = await createArtifactLease(store, { runId: "batch", buildId: "25153357", operation: "batch", objects: [] });
    try {
      await lease.protectAll([{ sha256: first.sha256, bytes: first.bytes }, { sha256: first.sha256, bytes: first.bytes }], [{ sha256: manifest.sha256, bytes: manifest.bytes }]);
      const [recorded] = await readArtifactLeases(store);
      expect(recorded?.objects.map((object) => object.sha256).sort()).toEqual([first.sha256, manifest.sha256].sort());
      expect(recorded?.manifests.map((object) => object.sha256)).toEqual([manifest.sha256]);
      // A missing object fails the batch, but the lease still protects what it recorded.
      await expect(lease.protectAll([{ sha256: "c".repeat(64), bytes: 1 }])).rejects.toThrow();
      expect((await readArtifactLeases(store))[0]?.objects.length).toBe(3);
    } finally { await lease.release(); }
  } finally { await rm(root, { recursive: true, force: true }); }
});
