import { createHash } from "node:crypto";
import { readFile, readdir, stat } from "node:fs/promises";
import type { Dirent } from "node:fs";
import * as path from "node:path";
import type { ArtifactRunManifest, ContentIdentity, GarbageCollectionReport } from "@afallon/contracts";
import { readArtifactLeases } from "./leases";
import { assertArtifactRunManifest, readLatestSuccess, verifyArtifactRunClosure } from "./references";
import { inspectArtifactRun } from "./runs";
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
  const trace = async (manifest: ArtifactRunManifest, reason: string): Promise<void> => {
    await verifyArtifactRunClosure(store, manifest, (identity, attribution) => {
      const directOutput = attribution.startsWith(`run:${manifest.runId}/output:`) && !attribution.includes("/reference:");
      protect(identity, directOutput ? reason : `${reason} -> ${attribution}`);
    });
  };
  for (const runId of [...new Set(policy.retainedRunIds)].sort()) {
    const inspected = await inspectArtifactRun(store, runId);
    const reason = `run:${runId}`;
    if (inspected.state === "terminal") {
      const bytes = await readFile(path.join(store.root, "runs", runId, "manifest.json"));
      const identity = { sha256: createHash("sha256").update(bytes).digest("hex"), bytes: bytes.byteLength };
      await store.verify(identity);
      protect(identity, reason);
    }
    await trace(inspected.manifest, reason);
  }
  const refsRoot = path.join(store.root, "refs");
  for (const build of await directories(refsRoot)) {
    for (const operation of await directories(path.join(refsRoot, build))) {
      const selected = await readLatestSuccess(store, build, operation);
      if (selected === null) continue;
      const reason = `latest:${build}/${operation}`;
      protect(selected.pointer.manifest, reason);
      await trace(selected.manifest, reason);
    }
  }
  for (const lease of await readArtifactLeases(store)) {
    const reason = `lease:${lease.leaseId}`;
    for (const identity of lease.objects) {
      await store.verify(identity);
      protect(identity, reason);
    }
    for (const identity of lease.pendingObjects) {
      protect(identity, `${reason}/pending`);
      try { await store.verify(identity); }
      catch (error) {
        if (!(error !== null && typeof error === "object" && "code" in error && error.code === "ENOENT")) throw error;
      }
    }
    for (const identity of lease.manifests) {
      await store.verify(identity);
      const manifest: unknown = JSON.parse(await readFile(store.objectPath(identity.sha256), "utf8"));
      assertArtifactRunManifest(manifest);
      if (manifest.status !== "succeeded" || manifest.input.buildId !== lease.buildId) throw new Error(`Lease ${lease.leaseId} refers to an invalid input manifest.`);
      protect(identity, reason);
      await trace(manifest, `${reason}/manifest:${identity.sha256}`);
    }
  }
  const objects: GarbageCollectionReport["objects"] = [];
  for (const prefix of await directories(store.objectsRoot)) {
    if (!/^[a-f0-9]{2}$/.test(prefix)) continue;
    const directory = path.join(store.objectsRoot, prefix);
    for (const entry of await entries(directory)) {
      if (!entry.isFile() || !/^[a-f0-9]{62}$/.test(entry.name)) continue;
      const sha256 = prefix + entry.name;
      const metadata = await stat(path.join(directory, entry.name));
      const identity = { sha256, bytes: metadata.size };
      const expected = protectedIdentities.get(sha256);
      if (expected !== undefined && expected.bytes !== identity.bytes) throw new Error(`Retained object ${sha256} has an unexpected byte count.`);
      await store.verify(identity);
      const reasons = [...(protections.get(sha256) ?? [])].sort();
      objects.push({ content: identity, path: ["objects", "sha256", prefix, entry.name].join("/"), protections: reasons, disposition: reasons.length > 0 ? "preserve" : "unreachable" });
    }
  }
  objects.sort((left, right) => left.content.sha256.localeCompare(right.content.sha256));
  const preserved = objects.filter(object => object.disposition === "preserve").length;
  return {
    schemaVersion: "compendium.artifact-gc-report.v1", generatedAt: new Date().toISOString(), dryRun: true,
    objects, summary: { total: objects.length, preserved, unreachable: objects.length - preserved },
  };
}

async function directories(root: string): Promise<string[]> {
  return (await entries(root)).filter(entry => entry.isDirectory()).map(entry => entry.name).sort();
}

async function entries(root: string): Promise<Dirent[]> {
  try { return await readdir(root, { withFileTypes: true }); }
  catch (error) {
    if (error !== null && typeof error === "object" && "code" in error && error.code === "ENOENT") return [];
    throw error;
  }
}
