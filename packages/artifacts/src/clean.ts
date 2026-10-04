import { createHash } from "node:crypto";
import type { Dirent } from "node:fs";
import { lstat, readdir, readFile, rm } from "node:fs/promises";
import * as path from "node:path";
import { Assert } from "typebox/value";
import { ArtifactLatestSuccessSchema, type ContentIdentity } from "@afallon/contracts";
import { isErrno } from "./artifact-filesystem";
import { acquireExclusiveStoreLock, STORE_LOCK_NAME, StoreBusyError } from "./lock";
import { assertArtifactRunManifest, verifyArtifactRunClosure } from "./references";
import type { ArtifactStore } from "./store";

/** An identity that clean must keep. Strict roots stop clean when they are broken; best-effort roots only warn. */
export interface RetentionRoot {
  readonly label: string;
  readonly identity: ContentIdentity;
  readonly strict: boolean;
}

export interface CleanPolicy {
  readonly roots: readonly RetentionRoot[];
  readonly retainedRunIds: readonly string[];
  readonly isCurrentBuild: (buildId: string) => boolean;
  /** Operations whose runs each produce one complete result that supersedes the previous one. */
  readonly productOperations: ReadonlySet<string>;
}

export type CleanStep = "references" | "leases" | "runs" | "objects" | "scratch" | "revisions";

export interface CleanOptions {
  readonly apply?: boolean;
  /** Test seam: runs after each apply step, so a test can interrupt collection part way. */
  readonly afterStep?: (step: CleanStep) => void | Promise<void>;
}

export interface CleanRunEntry {
  readonly runId: string;
  readonly buildId: string;
  readonly operation: string;
  readonly status: RunStatus;
  readonly time: string;
}

export interface CleanReport {
  readonly dryRun: boolean;
  readonly currentBuilds: string[];
  readonly roots: { label: string; sha256: string; bytes: number; strict: boolean }[];
  readonly warnings: string[];
  readonly runs: { retained: number; retainedBy: Record<string, number>; collected: CleanRunEntry[] };
  readonly objects: { retained: { count: number; bytes: number }; collected: { count: number; bytes: number } };
  readonly references: string[];
  readonly leases: string[];
  readonly scratch: { path: string; bytes: number }[];
  readonly revisions: { runs: number; bytes: number };
  readonly unmanaged: { path: string; bytes: number }[];
}

export class CleanIntegrityError extends Error {
  override name = "CleanIntegrityError";
  constructor(readonly failures: readonly string[]) {
    super(`Clean found broken retained references and changed nothing:\n${failures.join("\n")}`);
  }
}

type RunStatus = "succeeded" | "failed" | "interrupted";
interface RunRecord extends CleanRunEntry {
  readonly directory: string;
  readonly document: Record<string, unknown>;
  readonly manifest: ContentIdentity | null;
  readonly revisions: boolean;
  readonly scratch: string[];
}

const MANAGED_ROOT_ENTRIES = new Set(["objects", "runs", "refs", "leases", "accepted-build.json", ".runtime", ".work", STORE_LOCK_NAME, `${STORE_LOCK_NAME}-journal`]);
const MANIFEST_PROBE_BYTES = 64 * 1024 * 1024;

async function entries(directory: string): Promise<Dirent[]> {
  try { return await readdir(directory, { withFileTypes: true }); }
  catch (error) { if (isErrno(error, "ENOENT")) return []; throw error; }
}

async function optionalBytes(file: string): Promise<Buffer | null> {
  try { return await readFile(file); }
  catch (error) { if (isErrno(error, "ENOENT")) return null; throw error; }
}

async function treeBytes(target: string): Promise<number> {
  const metadata = await lstat(target);
  if (!metadata.isDirectory()) return metadata.size;
  let total = 0;
  for (const entry of await entries(target)) total += await treeBytes(path.join(target, entry.name));
  return total;
}

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

interface RunHeader extends CleanRunEntry {
  readonly document: Record<string, unknown>;
}

// Reads only the run header that both manifest versions share, so clean can classify runs it will not trace.
function runHeader(runId: string, value: unknown, status: RunStatus | null): RunHeader | null {
  const document = record(value), input = record(document?.input), timestamps = record(document?.timestamps);
  if (!document || !input || !timestamps || document.runId !== runId || typeof input.buildId !== "string" || typeof input.operation !== "string") return null;
  const resolved = status ?? (document.status === "succeeded" || document.status === "failed" ? document.status : null);
  const time = resolved === "interrupted" ? timestamps.updatedAt : timestamps.completedAt;
  if (resolved === null || typeof time !== "string") return null;
  return { runId, buildId: input.buildId, operation: input.operation, status: resolved, time, document };
}

function identityOf(value: unknown): ContentIdentity | null {
  const item = record(value);
  return item && typeof item.sha256 === "string" && /^[a-f0-9]{64}$/.test(item.sha256) && typeof item.bytes === "number" ? { sha256: item.sha256, bytes: item.bytes } : null;
}

// The identities a manifest or revision names, split into plain objects and run manifests.
function namedIdentities(document: Record<string, unknown>): { objects: ContentIdentity[]; manifests: ContentIdentity[] } {
  const objects: ContentIdentity[] = [], manifests: ContentIdentity[] = [];
  const input = record(document.input), inputs = record(input?.inputs) ?? {};
  const manifestNames = new Set(Array.isArray(input?.inputManifests) ? input.inputManifests : []);
  for (const [name, value] of Object.entries(inputs)) {
    const identity = identityOf(value);
    if (identity) (manifestNames.has(name) ? manifests : objects).push(identity);
  }
  const reuse = identityOf(record(document.reuse)?.sourceManifest);
  if (reuse) manifests.push(reuse);
  for (const output of Array.isArray(document.outputs) ? document.outputs : []) {
    const content = identityOf(record(output)?.content);
    if (content) objects.push(content);
    for (const reference of Array.isArray(record(output)?.references) ? record(output)!.references as unknown[] : []) {
      const identity = identityOf(record(reference)?.content);
      if (identity) (record(reference)?.kind === "run-manifest" ? manifests : objects).push(identity);
    }
  }
  return { objects, manifests };
}

interface Inventory {
  runs: Map<string, RunRecord>;
  objects: Map<string, number>;
  temporaryObjects: string[];
  references: { build: string; operation: string; file: string }[];
  leases: string[];
  scratch: string[];
  unmanaged: string[];
}

async function inventory(store: ArtifactStore): Promise<Inventory> {
  const result: Inventory = { runs: new Map(), objects: new Map(), temporaryObjects: [], references: [], leases: [], scratch: [], unmanaged: [] };
  const runsRoot = path.join(store.root, "runs");
  for (const entry of await entries(runsRoot)) {
    const directory = path.join(runsRoot, entry.name);
    if (!entry.isDirectory()) { result.unmanaged.push(directory); continue; }
    const children = await entries(directory);
    const names = new Set(children.map(child => child.name));
    const scratch = children.filter(child => child.name === "candidate.sqlite" || child.name.startsWith(".catalog-")).map(child => path.join(directory, child.name));
    const manifestBytes = names.has("manifest.json") ? await readFile(path.join(directory, "manifest.json")) : null;
    let header: RunHeader | null = null;
    if (manifestBytes) {
      try { header = runHeader(entry.name, JSON.parse(manifestBytes.toString("utf8")), null); } catch { header = null; }
    } else if (names.has("revisions")) {
      const latest = (await readdir(path.join(directory, "revisions"))).filter(name => /^\d{8}\.json$/.test(name)).sort().at(-1);
      if (latest) {
        try { header = runHeader(entry.name, JSON.parse(await readFile(path.join(directory, "revisions", latest), "utf8")), "interrupted"); } catch { header = null; }
      }
    }
    if (!header) { result.unmanaged.push(directory); continue; }
    const manifest = manifestBytes ? { sha256: createHash("sha256").update(manifestBytes).digest("hex"), bytes: manifestBytes.byteLength } : null;
    result.runs.set(entry.name, { ...header, directory, manifest, revisions: manifestBytes !== null && names.has("revisions"), scratch });
  }
  for (const prefix of await entries(store.objectsRoot)) {
    const directory = path.join(store.objectsRoot, prefix.name);
    if (prefix.name === ".tmp") { result.temporaryObjects.push(...(await entries(directory)).map(entry => path.join(directory, entry.name))); continue; }
    if (!prefix.isDirectory() || !/^[a-f0-9]{2}$/.test(prefix.name)) { result.unmanaged.push(directory); continue; }
    for (const entry of await entries(directory)) {
      if (!entry.isFile() || !/^[a-f0-9]{62}$/.test(entry.name)) { result.unmanaged.push(path.join(directory, entry.name)); continue; }
      result.objects.set(prefix.name + entry.name, (await lstat(path.join(directory, entry.name))).size);
    }
  }
  const refsRoot = path.join(store.root, "refs");
  for (const build of await entries(refsRoot)) {
    for (const operation of await entries(path.join(refsRoot, build.name))) {
      if (operation.isDirectory()) result.references.push({ build: build.name, operation: operation.name, file: path.join(refsRoot, build.name, operation.name, "latest-success.json") });
    }
  }
  result.leases = (await entries(path.join(store.root, "leases"))).filter(entry => entry.isFile() && entry.name.endsWith(".json")).map(entry => path.join(store.root, "leases", entry.name));
  for (const entry of await entries(store.root)) {
    const target = path.join(store.root, entry.name);
    if (entry.name.startsWith(".scan-")) result.scratch.push(target);
    else if (!MANAGED_ROOT_ENTRIES.has(entry.name)) result.unmanaged.push(target);
  }
  for (const entry of await entries(path.join(store.root, ".work"))) {
    (result.runs.has(entry.name) ? result.scratch : result.unmanaged).push(path.join(store.root, ".work", entry.name));
  }
  return result;
}

/**
 * Removes what no retention root or rule protects. It holds the store lock exclusively for the whole invocation, so
 * every lease that exists meanwhile was left by a process that ended without releasing it. The policy is resolved under
 * the lock, so roots such as the accepted descriptor cannot change between reading them and collecting.
 */
export async function cleanArtifactStore(store: ArtifactStore, resolvePolicy: () => CleanPolicy | Promise<CleanPolicy>, options: CleanOptions = {}): Promise<CleanReport> {
  let lock;
  try { lock = acquireExclusiveStoreLock(store); }
  catch (error) {
    if (!(error instanceof StoreBusyError)) throw error;
    const leases = (await entries(path.join(store.root, "leases"))).map(entry => entry.name).sort();
    throw new StoreBusyError(`Artifact store ${store.root} is in use by another command. Leases in the store: ${leases.join(", ") || "none"}.`, { cause: error });
  }
  try {
    const policy = await resolvePolicy();
    const found = await inventory(store);
    const retained = new Set<string>();
    const failures: string[] = [], warnings: string[] = [];
    const reasons = new Map<string, Set<string>>();
    const keep = (run: RunRecord, reason: string): void => { const set = reasons.get(run.runId) ?? new Set(); set.add(reason); reasons.set(run.runId, set); };

    const traceStrict = async (identity: ContentIdentity, label: string): Promise<void> => {
      try {
        await store.verify(identity);
        let manifest: unknown = null;
        if (identity.bytes <= MANIFEST_PROBE_BYTES) {
          try {
            const value: unknown = JSON.parse(await readFile(store.objectPath(identity.sha256), "utf8"));
            if (typeof record(value)?.schemaVersion === "string" && (record(value)!.schemaVersion as string).startsWith("compendium.artifact-run.")) manifest = value;
          } catch { manifest = null; }
        }
        retained.add(identity.sha256);
        if (manifest === null) return;
        assertArtifactRunManifest(manifest);
        await verifyArtifactRunClosure(store, manifest, (dependency) => { retained.add(dependency.sha256); });
      } catch (error) {
        failures.push(`${label}: ${identity.sha256}: ${error instanceof Error ? error.message : String(error)}`);
      }
    };
    // Failed and interrupted runs can name dependencies that never verified, so they keep only what exists.
    const visitedLoose = new Set<string>();
    const traceLoose = async (document: Record<string, unknown>, label: string): Promise<void> => {
      const named = namedIdentities(document);
      for (const identity of [...named.objects, ...named.manifests]) {
        if (found.objects.get(identity.sha256) !== identity.bytes) { warnings.push(`${label}: missing ${identity.sha256}`); continue; }
        retained.add(identity.sha256);
      }
      for (const identity of named.manifests) {
        if (visitedLoose.has(identity.sha256) || found.objects.get(identity.sha256) !== identity.bytes) continue;
        visitedLoose.add(identity.sha256);
        try {
          const dependency = record(JSON.parse(await readFile(store.objectPath(identity.sha256), "utf8")));
          if (dependency) await traceLoose(dependency, `${label} -> ${identity.sha256}`);
        } catch { warnings.push(`${label}: unreadable manifest ${identity.sha256}`); }
      }
    };
    const traceRoot = async (root: RetentionRoot): Promise<void> => {
      if (root.strict) { await traceStrict(root.identity, root.label); return; }
      if (found.objects.get(root.identity.sha256) !== root.identity.bytes) { warnings.push(`${root.label}: missing ${root.identity.sha256}`); return; }
      retained.add(root.identity.sha256);
      if (root.identity.bytes > MANIFEST_PROBE_BYTES) return;
      try {
        const value = record(JSON.parse(await readFile(store.objectPath(root.identity.sha256), "utf8")));
        if (typeof value?.schemaVersion === "string" && value.schemaVersion.startsWith("compendium.artifact-run.")) await traceLoose(value, root.label);
      } catch { /* A best-effort root that is not JSON is a plain object. */ }
    };

    const roots: RetentionRoot[] = [...policy.roots];
    const removedReferences = new Set<string>();
    for (const reference of found.references) {
      if (!policy.isCurrentBuild(reference.build)) { removedReferences.add(path.join(store.root, "refs", reference.build)); continue; }
      const bytes = await optionalBytes(reference.file);
      if (bytes === null) continue;
      try {
        const pointer: unknown = JSON.parse(bytes.toString("utf8"));
        Assert(ArtifactLatestSuccessSchema, pointer);
        roots.push({ label: `latest:${reference.build}/${reference.operation}`, identity: { sha256: pointer.manifest.sha256, bytes: pointer.manifest.bytes }, strict: true });
      } catch (error) {
        failures.push(`latest:${reference.build}/${reference.operation}: unreadable reference: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    for (const root of roots) await traceRoot(root);

    for (const runId of policy.retainedRunIds) {
      const run = found.runs.get(runId);
      if (!run) throw new Error(`No run ${runId} exists in ${store.root}.`);
      keep(run, "named");
    }
    const groups = new Map<string, RunRecord[]>();
    for (const run of found.runs.values()) {
      if (!policy.isCurrentBuild(run.buildId)) continue;
      const key = `${run.buildId}\u0000${run.operation}`;
      groups.set(key, [...(groups.get(key) ?? []), run]);
    }
    for (const runs of groups.values()) {
      const newestFirst = [...runs].sort((left, right) => right.time.localeCompare(left.time));
      const successes = newestFirst.filter(run => run.status === "succeeded");
      const product = policy.productOperations.has(newestFirst[0]!.operation);
      for (const run of product ? successes.slice(0, 2) : successes) keep(run, product ? "newest-product" : "batch");
      const failure = newestFirst.find(run => run.status !== "succeeded");
      if (failure) keep(failure, "newest-failure");
    }
    for (const runId of reasons.keys()) {
      const run = found.runs.get(runId)!;
      if (run.status === "succeeded") await traceStrict(run.manifest!, `run:${run.runId}`);
      else {
        if (run.manifest && found.objects.get(run.manifest.sha256) === run.manifest.bytes) retained.add(run.manifest.sha256);
        await traceLoose(run.document, `run:${run.runId}`);
      }
    }
    if (failures.length > 0) throw new CleanIntegrityError(failures);

    const keptRuns = [...found.runs.values()].filter(run => reasons.has(run.runId) || (run.manifest !== null && retained.has(run.manifest.sha256)));
    for (const run of keptRuns) if (!reasons.has(run.runId)) keep(run, "lineage");
    const collectedRuns = [...found.runs.values()].filter(run => !reasons.has(run.runId));
    const collectedObjects = [...found.objects].filter(([sha]) => !retained.has(sha));
    const scratch = [...found.temporaryObjects, ...found.scratch, ...keptRuns.flatMap(run => run.scratch)];
    const revisions = keptRuns.filter(run => run.revisions).map(run => path.join(run.directory, "revisions"));
    const sized = async (targets: string[]) => Promise.all(targets.sort().map(async target => ({ path: path.relative(store.root, target), bytes: await treeBytes(target) })));
    const retainedBy: Record<string, number> = {};
    for (const set of reasons.values()) for (const reason of set) retainedBy[reason] = (retainedBy[reason] ?? 0) + 1;
    const revisionSizes = await sized(revisions);
    const report: CleanReport = {
      dryRun: options.apply !== true,
      currentBuilds: [...new Set([...found.runs.values()].map(run => run.buildId))].filter(policy.isCurrentBuild).sort(),
      roots: roots.map(root => ({ label: root.label, sha256: root.identity.sha256, bytes: root.identity.bytes, strict: root.strict })),
      warnings,
      runs: {
        retained: keptRuns.length, retainedBy,
        collected: collectedRuns.map(({ runId, buildId, operation, status, time }) => ({ runId, buildId, operation, status, time })).sort((left, right) => left.time.localeCompare(right.time)),
      },
      objects: {
        retained: { count: found.objects.size - collectedObjects.length, bytes: [...found.objects].filter(([sha]) => retained.has(sha)).reduce((sum, [, bytes]) => sum + bytes, 0) },
        collected: { count: collectedObjects.length, bytes: collectedObjects.reduce((sum, [, bytes]) => sum + bytes, 0) },
      },
      references: [...removedReferences].map(target => path.relative(store.root, target)).sort(),
      leases: found.leases.map(file => path.relative(store.root, file)).sort(),
      scratch: await sized(scratch),
      revisions: { runs: revisions.length, bytes: revisionSizes.reduce((sum, item) => sum + item.bytes, 0) },
      unmanaged: await sized(found.unmanaged),
    };
    if (options.apply !== true) return report;

    // Each step removes only what nothing retained names, so an interruption leaves orphans for the next clean.
    const steps: [CleanStep, string[]][] = [
      ["references", [...removedReferences]],
      ["leases", found.leases],
      ["runs", collectedRuns.map(run => run.directory)],
      ["objects", collectedObjects.map(([sha]) => store.objectPath(sha))],
      ["scratch", scratch],
      ["revisions", revisions],
    ];
    for (const [step, targets] of steps) {
      for (const target of targets) await rm(target, { recursive: true, force: true });
      await options.afterStep?.(step);
    }
    return report;
  } finally { lock.release(); }
}
