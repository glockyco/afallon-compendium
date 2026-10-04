import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import * as path from "node:path";
import type { ArtifactStore } from "./store";

// Store commands hold this lock shared while they hold a lease or write an object. Clean holds it exclusively, so a lease
// file that exists while clean holds the lock belongs to a process that ended without releasing it. The lock lives in a
// SQLite file because the operating system releases SQLite's advisory locks when a process exits, even when it crashes.
// The file stays in rollback-journal mode: WAL would let readers coexist with the exclusive holder.
export const STORE_LOCK_NAME = ".store-lock.sqlite";
export const STORE_MAINTENANCE_WAIT_MS = 30 * 60 * 1000;
const RETRY_MS = 100;

export class StoreMaintenanceError extends Error {
  override name = "StoreMaintenanceError";
}

export class StoreBusyError extends Error {
  override name = "StoreBusyError";
}

export interface StoreLock {
  release(): void;
}

function isBusy(error: unknown): boolean {
  return error !== null && typeof error === "object" && "code" in error && typeof error.code === "string" && (error.code.startsWith("SQLITE_BUSY") || error.code.startsWith("SQLITE_LOCKED"));
}

function openLock(store: ArtifactStore): Database {
  mkdirSync(store.root, { recursive: true });
  const db = new Database(path.join(store.root, STORE_LOCK_NAME), { create: true });
  db.exec("PRAGMA busy_timeout = 0");
  return db;
}

function holding(db: Database): StoreLock {
  let held = true;
  return {
    release() {
      if (!held) return;
      held = false;
      try { db.exec("ROLLBACK"); } finally { db.close(); }
    },
  };
}

/** Waits for a running clean up to the store's maintenance wait, then fails before the caller changes the store. */
export async function acquireSharedStoreLock(store: ArtifactStore): Promise<StoreLock> {
  const deadline = Date.now() + store.maintenanceWaitMs;
  while (true) {
    const db = openLock(store);
    try {
      db.exec("CREATE TABLE IF NOT EXISTS store_lock (id INTEGER)");
      db.exec("BEGIN");
      db.query("SELECT count(*) FROM store_lock").get();
      return holding(db);
    } catch (error) {
      try { db.exec("ROLLBACK"); } catch { /* No transaction was open. */ }
      db.close();
      if (!isBusy(error)) throw error;
      if (Date.now() >= deadline) {
        throw new StoreMaintenanceError(`Artifact store maintenance in ${store.root} did not finish within ${Math.round(store.maintenanceWaitMs / 1000)} s.`, { cause: error });
      }
      await Bun.sleep(Math.min(RETRY_MS, Math.max(1, deadline - Date.now())));
    }
  }
}

/** Fails at once when any command holds the store. */
export function acquireExclusiveStoreLock(store: ArtifactStore): StoreLock {
  const db = openLock(store);
  try {
    db.exec("BEGIN EXCLUSIVE");
    db.exec("CREATE TABLE IF NOT EXISTS store_lock (id INTEGER)");
    return holding(db);
  } catch (error) {
    try { db.exec("ROLLBACK"); } catch { /* No transaction was open. */ }
    db.close();
    if (isBusy(error)) throw new StoreBusyError(`Artifact store ${store.root} is in use by another command.`, { cause: error });
    throw error;
  }
}
