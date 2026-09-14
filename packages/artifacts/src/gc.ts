import { readdir, stat } from "node:fs/promises";
import type { Dirent } from "node:fs";
import * as path from "node:path";
import type { ContentIdentity, GarbageCollectionReport } from "@afallon/contracts";
import { readArtifactLeases } from "./leases";
import { readLatestSuccess } from "./references";
import { readArtifactRunManifest } from "./runs";
import { ArtifactStore } from "./store";

export interface GarbageCollectionPolicy {
  readonly retainedRunIds: Iterable<string>;
}

export async function reportGarbageCollection(store: ArtifactStore, policy: GarbageCollectionPolicy): Promise<GarbageCollectionReport> {
  const protections = new Map<string, Set<string>>();
  const protectedIdentities = new Map<string, ContentIdentity>();
  const protect = (identity: ContentIdentity, reason: string): void => {
    const existing = protectedIdentities.get(identity.sha256);
    if (existing && existing.bytes !== identity.bytes) throw new Error(`References disagree about the size of object ${identity.sha256}.`);
    protectedIdentities.set(identity.sha256, identity);
    const reasons = protections.get(identity.sha256) ?? new Set<string>();
    reasons.add(reason);
    protections.set(identity.sha256, reasons);
  };

  for (const runId of [...new Set(policy.retainedRunIds)].sort()) {
    const manifest = await readArtifactRunManifest(path.join(store.root, "runs", runId, "manifest.json"));
    for (const output of manifest.outputs) protect(output.content, `run:${runId}`);
  }

  const refsRoot = path.join(store.root, "refs");
  for (const build of await directories(refsRoot)) {
    for (const operation of await directories(path.join(refsRoot, build))) {
      const selected = await readLatestSuccess(store, build, operation);
      if (selected === null) continue;
      for (const output of selected.manifest.outputs) protect(output.content, `latest:${build}/${operation}`);
    }
  }

  for (const lease of await readArtifactLeases(store)) {
    for (const identity of lease.objects) protect(identity, `lease:${lease.leaseId}`);
  }
  for (const identity of protectedIdentities.values()) await store.verify(identity);

  const objects: GarbageCollectionReport["objects"] = [];
  for (const prefix of await directories(store.objectsRoot)) {
    if (!/^[a-f0-9]{2}$/.test(prefix)) continue;
    const directory = path.join(store.objectsRoot, prefix);
    for (const entry of await entries(directory)) {
      if (!entry.isFile() || !/^[a-f0-9]{62}$/.test(entry.name)) continue;
      const sha256 = prefix + entry.name;
      const objectPath = path.join(directory, entry.name);
      const metadata = await stat(objectPath);
      const identity = { sha256, bytes: metadata.size };
      await store.verify(identity);
      const reasons = [...(protections.get(sha256) ?? [])].sort();
      objects.push({
        content: identity,
        path: ["objects", "sha256", prefix, entry.name].join("/"),
        protections: reasons,
        disposition: reasons.length > 0 ? "preserve" : "unreachable",
      });
    }
  }
  objects.sort((left, right) => left.content.sha256.localeCompare(right.content.sha256));
  const preserved = objects.filter((object) => object.disposition === "preserve").length;
  return {
    schemaVersion: "compendium.artifact-gc-report.v1",
    generatedAt: new Date().toISOString(),
    dryRun: true,
    objects,
    summary: { total: objects.length, preserved, unreachable: objects.length - preserved },
  };
}

async function directories(root: string): Promise<string[]> {
  return (await entries(root)).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
}

async function entries(root: string): Promise<Dirent[]> {
  try {
    return await readdir(root, { withFileTypes: true });
  } catch (error) {
    if (error !== null && typeof error === "object" && "code" in error && error.code === "ENOENT") return [];
    throw error;
  }
}
