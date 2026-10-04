import { expect, test } from "bun:test";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createArtifactLease } from "./leases";
import { acquireExclusiveStoreLock, acquireSharedStoreLock, StoreBusyError, StoreMaintenanceError } from "./lock";
import { ArtifactStore } from "./store";

async function withStore(run: (root: string) => Promise<void>): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), "afallon-lock-"));
  try { await run(root); } finally { await rm(root, { recursive: true, force: true }); }
}

// A separate process holds the shared lock until it is killed, so the test observes cross-process behavior.
async function sharedHolder(root: string) {
  const child = Bun.spawn([process.execPath, "--eval", `
    import { acquireSharedStoreLock } from ${JSON.stringify(join(import.meta.dir, "lock.ts"))};
    import { ArtifactStore } from ${JSON.stringify(join(import.meta.dir, "store.ts"))};
    await acquireSharedStoreLock(new ArtifactStore(${JSON.stringify(root)}));
    console.log("held");
    await Bun.sleep(60_000);
  `], { stdout: "pipe" });
  const reader = child.stdout.getReader();
  await reader.read();
  reader.releaseLock();
  return child;
}

test("another process's shared holder makes clean fail at once, and its death releases the lock", () => withStore(async (root) => {
  const store = new ArtifactStore(root);
  const child = await sharedHolder(root);
  try {
    const started = Date.now();
    expect(() => acquireExclusiveStoreLock(store)).toThrow(StoreBusyError);
    expect(Date.now() - started).toBeLessThan(1000);
  } finally {
    child.kill(9);
    await child.exited;
  }
  acquireExclusiveStoreLock(store).release();
}));

test("a shared acquisition waits for clean and proceeds when clean finishes", () => withStore(async (root) => {
  const store = new ArtifactStore(root);
  const exclusive = acquireExclusiveStoreLock(store);
  // A real delay: the waiter polls an operating-system file lock, which fake timers cannot release.
  setTimeout(() => exclusive.release(), 300);
  const started = Date.now();
  const shared = await acquireSharedStoreLock(store);
  expect(Date.now() - started).toBeGreaterThanOrEqual(250);
  shared.release();
}));

test("a command fails with a maintenance error, before changing the store, when clean outlasts its wait", () => withStore(async (root) => {
  const store = new ArtifactStore(root, { maintenanceWaitMs: 50 });
  const exclusive = acquireExclusiveStoreLock(store);
  try {
    await expect(createArtifactLease(store, { runId: "waiting", buildId: "1", operation: "scan", objects: [] })).rejects.toBeInstanceOf(StoreMaintenanceError);
    await expect(store.putBytes(new TextEncoder().encode("unprotected"))).rejects.toBeInstanceOf(StoreMaintenanceError);
  } finally { exclusive.release(); }
  expect(await readdir(join(root, "leases")).catch(() => [])).toEqual([]);
  expect(await readdir(join(root, "objects")).catch(() => [])).toEqual([]);
}));

test("a lease holds the store until it is released", () => withStore(async (root) => {
  const store = new ArtifactStore(root);
  const lease = await createArtifactLease(store, { runId: "holder", buildId: "1", operation: "scan", objects: [] });
  expect(() => acquireExclusiveStoreLock(store)).toThrow(StoreBusyError);
  await lease.release();
  acquireExclusiveStoreLock(store).release();
}));
