import { randomUUID } from "node:crypto";
import { mkdir, open, readFile, rename, unlink, writeFile } from "node:fs/promises";
import * as path from "node:path";
import { Assert } from "typebox/value";
import { ArtifactLeaseSchema, canonicalJson, type ArtifactLease, type ContentIdentity } from "@afallon/contracts";
import { ArtifactStore } from "./store";

export interface ActiveArtifactLease {
  readonly leaseId: string;
  readonly path: string;
  protect(identity: ContentIdentity): Promise<void>;
  release(): Promise<void>;
}

export async function createArtifactLease(
  store: ArtifactStore,
  input: { runId: string; buildId: string; operation: string; objects: Iterable<ContentIdentity> },
): Promise<ActiveArtifactLease> {
  const directory = path.join(store.root, "leases");
  await mkdir(directory, { recursive: true });
  const leasePath = path.join(directory, `${input.runId}.json`);
  const now = new Date().toISOString();
  const objects = new Map<string, ContentIdentity>();
  for (const identity of input.objects) {
    await store.verify(identity);
    objects.set(identity.sha256, { sha256: identity.sha256, bytes: identity.bytes });
  }
  const lease: ArtifactLease = {
    schemaVersion: "compendium.artifact-lease.v1",
    leaseId: randomUUID(),
    runId: input.runId,
    buildId: input.buildId,
    operation: input.operation,
    createdAt: now,
    updatedAt: now,
    objects: [...objects.values()].sort((left, right) => left.sha256.localeCompare(right.sha256)),
  };
  await atomicReplace(leasePath, lease);
  let active = true;

  return {
    leaseId: lease.leaseId,
    path: leasePath,
    async protect(identity) {
      if (!active) throw new Error(`Artifact lease ${lease.leaseId} is released.`);
      await store.verify(identity);
      const existing = objects.get(identity.sha256);
      if (existing && existing.bytes !== identity.bytes) throw new Error(`Artifact lease has conflicting sizes for ${identity.sha256}.`);
      if (existing) return;
      objects.set(identity.sha256, { sha256: identity.sha256, bytes: identity.bytes });
      lease.objects = [...objects.values()].sort((left, right) => left.sha256.localeCompare(right.sha256));
      lease.updatedAt = new Date().toISOString();
      await atomicReplace(leasePath, lease);
    },
    async release() {
      if (!active) throw new Error(`Artifact lease ${lease.leaseId} is released.`);
      await unlink(leasePath);
      active = false;
      const handle = await open(directory, "r");
      try {
        await handle.sync();
      } finally {
        await handle.close();
      }
    },
  };
}

export async function readArtifactLeases(store: ArtifactStore): Promise<ArtifactLease[]> {
  const directory = path.join(store.root, "leases");
  let names: string[];
  try {
    names = await Array.fromAsync(new Bun.Glob("*.json").scan({ cwd: directory, onlyFiles: true }));
  } catch (error) {
    if (isErrno(error, "ENOENT")) return [];
    throw error;
  }
  const leases: ArtifactLease[] = [];
  for (const name of names.sort()) {
    const value: unknown = JSON.parse(await readFile(path.join(directory, name), "utf8"));
    Assert(ArtifactLeaseSchema, value);
    leases.push(value);
  }
  return leases;
}

async function atomicReplace(destination: string, value: unknown): Promise<void> {
  const temporary = `${destination}.tmp-${randomUUID()}`;
  try {
    await writeFile(temporary, `${canonicalJson(value)}\n`, { encoding: "utf8", flag: "wx", mode: 0o600 });
    const file = await open(temporary, "r");
    try {
      await file.sync();
    } finally {
      await file.close();
    }
    await rename(temporary, destination);
    const directory = await open(path.dirname(destination), "r");
    try {
      await directory.sync();
    } finally {
      await directory.close();
    }
  } catch (error) {
    await unlink(temporary).catch(() => undefined);
    throw error;
  }
}

function isErrno(error: unknown, code: string): error is NodeJS.ErrnoException {
  return error !== null && typeof error === "object" && "code" in error && error.code === code;
}
