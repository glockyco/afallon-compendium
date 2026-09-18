import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink } from "node:fs/promises";
import * as path from "node:path";
import { Assert } from "typebox/value";
import { ArtifactLeaseSchema, ContentIdentitySchema, canonicalJson, type ArtifactLease, type ContentIdentity } from "@afallon/contracts";
import { createImmutableFile, isErrno, replaceFileAtomically, safeSegment } from "./artifact-filesystem";
import { ArtifactStore, type ObjectWriteProtection } from "./store";

export interface ActiveArtifactLease extends ObjectWriteProtection {
  readonly leaseId: string;
  readonly path: string;
  protectManifest(identity: ContentIdentity): Promise<void>;
  release(): Promise<void>;
}

export async function createArtifactLease(
  store: ArtifactStore,
  input: { runId: string; buildId: string; operation: string; objects: Iterable<ContentIdentity>; manifests?: Iterable<ContentIdentity> },
): Promise<ActiveArtifactLease> {
  safeSegment(input.runId, "A lease runId");
  const directory = path.join(store.root, "leases");
  await mkdir(directory, { recursive: true });
  const leasePath = path.join(directory, `${input.runId}.json`);
  const now = new Date().toISOString();
  const objects = new Map<string, ContentIdentity>();
  const pending = new Map<string, ContentIdentity>();
  const manifests = new Map<string, ContentIdentity>();
  const add = (target: Map<string, ContentIdentity>, identity: ContentIdentity): void => {
    const content = { sha256: identity.sha256, bytes: identity.bytes };
    Assert(ContentIdentitySchema, content);
    for (const entries of [objects, pending, manifests]) {
      const existing = entries.get(identity.sha256);
      if (existing && existing.bytes !== identity.bytes) throw new Error(`Artifact lease has conflicting sizes for ${identity.sha256}.`);
    }
    target.set(identity.sha256, content);
  };
  for (const identity of input.objects) add(objects, identity);
  for (const identity of input.manifests ?? []) { add(objects, identity); add(manifests, identity); }
  const lease: ArtifactLease = {
    schemaVersion: "compendium.artifact-lease.v2",
    leaseId: randomUUID(), runId: input.runId, buildId: input.buildId, operation: input.operation,
    createdAt: now, updatedAt: now,
    objects: [...objects.values()], pendingObjects: [], manifests: [...manifests.values()],
  };
  await createImmutableFile(leasePath, `${canonicalJson(lease)}\n`);
  try {
    for (const identity of objects.values()) await store.verify(identity);
  } catch (error) {
    await unlink(leasePath).catch(() => {});
    throw error;
  }
  let active = true;
  let queue: Promise<void> = Promise.resolve();
  const enqueue = (operation: () => Promise<void>): Promise<void> => {
    const result = queue.then(async () => {
      if (!active) throw new Error(`Artifact lease ${lease.leaseId} is released.`);
      await operation();
    });
    queue = result.catch(() => {});
    return result;
  };
  const persist = async (): Promise<void> => {
    lease.objects = [...objects.values()].sort((left, right) => left.sha256.localeCompare(right.sha256));
    lease.pendingObjects = [...pending.values()].sort((left, right) => left.sha256.localeCompare(right.sha256));
    lease.manifests = [...manifests.values()].sort((left, right) => left.sha256.localeCompare(right.sha256));
    lease.updatedAt = new Date().toISOString();
    await replaceFileAtomically(leasePath, `${canonicalJson(lease)}\n`);
  };
  return {
    leaseId: lease.leaseId,
    path: leasePath,
    protectPending(identity) {
      return enqueue(async () => {
        add(pending, identity);
        if (objects.has(identity.sha256)) pending.delete(identity.sha256);
        await persist();
      });
    },
    protect(identity) {
      return enqueue(async () => {
        add(objects, identity);
        pending.delete(identity.sha256);
        await persist();
        await store.verify(identity);
      });
    },
    protectManifest(identity) {
      return enqueue(async () => {
        add(objects, identity);
        add(manifests, identity);
        pending.delete(identity.sha256);
        await persist();
        await store.verify(identity);
      });
    },
    release() {
      return enqueue(async () => {
        await unlink(leasePath);
        active = false;
      });
    },
  };
}

export async function readArtifactLeases(store: ArtifactStore): Promise<ArtifactLease[]> {
  const directory = path.join(store.root, "leases");
  let names: string[];
  try { names = await Array.fromAsync(new Bun.Glob("*.json").scan({ cwd: directory, onlyFiles: true })); }
  catch (error) {
    if (isErrno(error, "ENOENT")) return [];
    throw error;
  }
  const leases: ArtifactLease[] = [];
  for (const name of names.sort()) {
    const value: unknown = JSON.parse(await readFile(path.join(directory, name), "utf8"));
    Assert(ArtifactLeaseSchema, value);
    if (name !== `${value.runId}.json`) throw new Error(`Lease ${name} has a different run identity.`);
    leases.push(value);
  }
  return leases;
}
