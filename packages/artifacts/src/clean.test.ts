import { expect, test } from "bun:test";
import { chmod, lstat, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { canonicalJson, type ArtifactRunInput, type ContentIdentity } from "@afallon/contracts";
import { CleanIntegrityError, cleanArtifactStore, type CleanPolicy } from "./clean";
import { createArtifactLease } from "./leases";
import { StoreBusyError } from "./lock";
import { selectLatestSuccess } from "./references";
import { beginArtifactRun } from "./runs";
import { ArtifactStore } from "./store";

const CURRENT = "200", OLD = "100";
const encode = (value: string) => new TextEncoder().encode(value);

function input(buildId: string, operation: string, inputs: Record<string, ContentIdentity> = {}): ArtifactRunInput {
  return { buildId, operation, settings: {}, schemas: [], implementationFingerprint: "a".repeat(64), cacheKey: "b".repeat(64), probeHashes: {}, diagnosticRevision: "test", inputs };
}

function policy(overrides: Partial<CleanPolicy> = {}): CleanPolicy {
  return { roots: [], retainedRunIds: [], isCurrentBuild: (build) => build !== OLD, productOperations: new Set(["catalog", "publish"]), ...overrides };
}

interface Finished { runId: string; object: ContentIdentity; manifestPath: string; directory: string }

async function finished(store: ArtifactStore, buildId: string, operation: string, content: string, outcome: "succeeded" | "failed" | "interrupted" = "succeeded"): Promise<Finished> {
  const run = await beginArtifactRun(store, input(buildId, operation));
  try {
    const stored = await run.putBytes(encode(content));
    const object = { sha256: stored.sha256, bytes: stored.bytes };
    await run.addArtifact("result.bin", object, { mediaType: "application/octet-stream" });
    if (outcome === "succeeded") await run.succeed();
    if (outcome === "failed") await run.fail(new Error("injected failure"));
    return { runId: run.runId, object, manifestPath: run.manifestPath, directory: join(store.root, "runs", run.runId) };
  } finally { await run.release(); }
}

async function exists(target: string): Promise<boolean> {
  try { await lstat(target); return true; } catch { return false; }
}

async function snapshot(root: string): Promise<string[]> {
  const files: string[] = [];
  const walk = async (directory: string): Promise<void> => {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const target = join(directory, entry.name);
      if (entry.isDirectory()) await walk(target);
      else files.push(`${relative(root, target)}:${(await lstat(target)).size}`);
    }
  };
  await walk(root);
  return files.sort();
}

async function withStore(run: (store: ArtifactStore) => Promise<void>): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), "afallon-clean-"));
  try { await run(new ArtifactStore(root)); } finally { await rm(root, { recursive: true, force: true }); }
}

test("current builds keep two product runs, whole batches, and the newest failure; other builds keep nothing", () => withStore(async (store) => {
  const catalogs = [await finished(store, CURRENT, "catalog", "catalog 1"), await finished(store, CURRENT, "catalog", "catalog 2"), await finished(store, CURRENT, "catalog", "catalog 3")];
  const scans = [await finished(store, CURRENT, "scan", "shard 1"), await finished(store, CURRENT, "scan", "shard 2"), await finished(store, CURRENT, "scan", "shard 3")];
  const probes = [await finished(store, CURRENT, "probe", "new operation 1"), await finished(store, CURRENT, "probe", "new operation 2")];
  const failures = [await finished(store, CURRENT, "publish", "failure 1", "failed"), await finished(store, CURRENT, "publish", "failure 2", "failed"), await finished(store, CURRENT, "publish", "failure 3", "interrupted")];
  const old = await finished(store, OLD, "scan", "old build scan");
  await selectLatestSuccess(store, old.manifestPath);

  const report = await cleanArtifactStore(store, () => policy(), { apply: true });

  for (const kept of [catalogs[1]!, catalogs[2]!, ...scans, ...probes, failures[2]!]) {
    expect(await exists(kept.directory)).toBe(true);
    expect(await exists(store.objectPath(kept.object.sha256))).toBe(true);
  }
  for (const collected of [catalogs[0]!, failures[0]!, failures[1]!, old]) {
    expect(await exists(collected.directory)).toBe(false);
    expect(await exists(store.objectPath(collected.object.sha256))).toBe(false);
  }
  expect(await exists(join(store.root, "refs", OLD))).toBe(false);
  expect(report.references).toEqual([`refs/${OLD}`]);
  expect(report.currentBuilds).toEqual([CURRENT]);
  expect(report.runs.retainedBy).toEqual({ "newest-product": 2, batch: 5, "newest-failure": 1 });
}));

test("latest-success references of current builds, named runs, and roots keep runs that no rule keeps", () => withStore(async (store) => {
  const selected = await finished(store, CURRENT, "catalog", "selected");
  await selectLatestSuccess(store, selected.manifestPath);
  const named = await finished(store, CURRENT, "catalog", "named");
  const rooted = await finished(store, OLD, "catalog", "accepted elsewhere");
  const rootedManifest = { sha256: new Bun.CryptoHasher("sha256").update(await readFile(rooted.manifestPath)).digest("hex"), bytes: (await readFile(rooted.manifestPath)).byteLength };
  await finished(store, CURRENT, "catalog", "newer 1");
  await finished(store, CURRENT, "catalog", "newer 2");

  const report = await cleanArtifactStore(store, () => policy({ retainedRunIds: [named.runId], roots: [{ label: "accepted", identity: rootedManifest, strict: true }] }), { apply: true });

  for (const kept of [selected, named, rooted]) expect(await exists(store.objectPath(kept.object.sha256))).toBe(true);
  expect(await exists(rooted.directory)).toBe(true);
  expect(report.runs.retainedBy.lineage).toBe(2);
}));

test("a retained publication keeps its catalog, scan, evidence, and declared resources, and stops on a broken one", () => withStore(async (store) => {
  const scan = await beginArtifactRun(store, input(OLD, "scan"));
  const evidence = await scan.putBytes(encode("raw evidence"));
  await scan.addArtifact("evidence.json", evidence, { mediaType: "application/json" });
  await scan.succeed();
  const catalog = await beginArtifactRun(store, { ...input(OLD, "catalog"), inputs: { scan: scan.manifestIdentity! }, inputManifests: ["scan"] });
  await scan.release();
  const database = await catalog.putBytes(encode("sealed catalog"));
  await catalog.addArtifact("catalog.sqlite", database, { mediaType: "application/vnd.sqlite3" });
  await catalog.succeed();
  const publication = await beginArtifactRun(store, { ...input(OLD, "publish"), inputs: { catalog: catalog.manifestIdentity! }, inputManifests: ["catalog"] });
  await catalog.release();
  const resource = await publication.putBytes(encode("map resource"));
  const publicRoot = await publication.putBytes(encode("root resource"));
  await publication.addArtifact("publication.json", publicRoot, { mediaType: "application/json", references: [{ kind: "object", content: { sha256: resource.sha256, bytes: resource.bytes } }] });
  await publication.succeed();
  await publication.release();

  await cleanArtifactStore(store, () => policy({ retainedRunIds: [publication.runId] }), { apply: true });
  for (const identity of [evidence, scan.manifestIdentity!, database, catalog.manifestIdentity!, resource, publicRoot, publication.manifestIdentity!]) {
    expect(await exists(store.objectPath(identity.sha256))).toBe(true);
  }
  for (const runId of [scan.runId, catalog.runId]) expect(await exists(join(store.root, "runs", runId))).toBe(true);
  await rm(store.objectPath(evidence.sha256));
  await expect(cleanArtifactStore(store, () => policy({ retainedRunIds: [publication.runId] }), { apply: true })).rejects.toThrow(`run:${publication.runId}`);
}));

test("a dry run reports the collection and changes nothing", () => withStore(async (store) => {
  const old = await finished(store, OLD, "scan", "old");
  await mkdir(join(store.root, ".scan-crashed"), { recursive: true });
  const before = await snapshot(store.root);
  const report = await cleanArtifactStore(store, () => policy());
  expect(report.dryRun).toBe(true);
  expect(report.runs.collected.map(run => run.runId)).toEqual([old.runId]);
  expect(report.objects.collected.count).toBeGreaterThan(0);
  expect(await snapshot(store.root)).toEqual(before);
}));

test("an object shared with a retained run remains", () => withStore(async (store) => {
  const shared = await finished(store, OLD, "scan", "shared bytes");
  const keeper = await finished(store, CURRENT, "scan", "shared bytes");
  expect(keeper.object).toEqual(shared.object);
  await cleanArtifactStore(store, () => policy(), { apply: true });
  expect(await exists(shared.directory)).toBe(false);
  expect(await exists(store.objectPath(keeper.object.sha256))).toBe(true);
}));

test("an interrupted collection leaves no reference to a removed object and the next clean completes it", () => withStore(async (store) => {
  const old = await finished(store, OLD, "scan", "orphan after interruption");
  await expect(cleanArtifactStore(store, () => policy(), { apply: true, afterStep: (step) => { if (step === "runs") throw new Error("interrupted"); } })).rejects.toThrow("interrupted");
  expect(await exists(old.directory)).toBe(false);
  expect(await exists(store.objectPath(old.object.sha256))).toBe(true);
  const report = await cleanArtifactStore(store, () => policy(), { apply: true });
  expect(report.runs.collected).toEqual([]);
  expect(await exists(store.objectPath(old.object.sha256))).toBe(false);
}));

test("an interrupted run is traced from its latest revision", () => withStore(async (store) => {
  const older = await finished(store, CURRENT, "capture", "older crash", "interrupted");
  const newest = await finished(store, CURRENT, "capture", "newest crash", "interrupted");
  await cleanArtifactStore(store, () => policy(), { apply: true });
  expect(await exists(newest.directory)).toBe(true);
  expect(await exists(store.objectPath(newest.object.sha256))).toBe(true);
  expect(await exists(older.directory)).toBe(false);
}));

test("a broken strict closure stops clean before any change", () => withStore(async (store) => {
  const missing = await finished(store, CURRENT, "scan", "will be missing");
  await finished(store, OLD, "scan", "collectible");
  await rm(store.objectPath(missing.object.sha256), { force: true });
  let before = await snapshot(store.root);
  await expect(cleanArtifactStore(store, () => policy(), { apply: true })).rejects.toBeInstanceOf(CleanIntegrityError);
  expect(await snapshot(store.root)).toEqual(before);

  await writeFile(store.objectPath(missing.object.sha256), "damaged bytes!!");
  before = await snapshot(store.root);
  await expect(cleanArtifactStore(store, () => policy(), { apply: true })).rejects.toThrow(missing.object.sha256);
  expect(await snapshot(store.root)).toEqual(before);
}));

test("a legacy manifest in a retained run is unreadable, and clean names it", () => withStore(async (store) => {
  const legacy = await finished(store, CURRENT, "scan", "legacy");
  const manifest = JSON.parse(await readFile(legacy.manifestPath, "utf8"));
  manifest.schemaVersion = "compendium.artifact-run.v1";
  const bytes = encode(`${canonicalJson(manifest)}\n`);
  await chmod(legacy.manifestPath, 0o644);
  await writeFile(legacy.manifestPath, bytes);
  await store.putBytes(bytes);
  await expect(cleanArtifactStore(store, () => policy(), { apply: true })).rejects.toThrow(`run:${legacy.runId}`);
}));

test("failed runs and the replaced release keep what exists and only warn about the rest", () => withStore(async (store) => {
  const present = await store.putBytes(encode("present input"));
  const missingInput = { sha256: "f".repeat(64), bytes: 3 };
  const run = await beginArtifactRun(store, input(CURRENT, "scan", { plan: { sha256: present.sha256, bytes: present.bytes } }));
  await run.fail(new Error("scan failed"));
  await run.release();
  // A failed preparation records inputs that never verified; rewrite the record into that shape.
  const manifestPath = join(store.root, "runs", run.runId, "manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  manifest.input.inputs.missing = missingInput;
  await chmod(manifestPath, 0o644);
  await writeFile(manifestPath, `${canonicalJson(manifest)}\n`);
  const collectible = await finished(store, OLD, "scan", "collectible");

  const report = await cleanArtifactStore(store, () => policy({ roots: [{ label: "replaced", identity: { sha256: "e".repeat(64), bytes: 1 }, strict: false }] }), { apply: true });
  expect(report.warnings.some(warning => warning.includes(missingInput.sha256))).toBe(true);
  expect(report.warnings.some(warning => warning.includes("replaced"))).toBe(true);
  expect(await exists(store.objectPath(present.sha256))).toBe(true);
  expect(await exists(collectible.directory)).toBe(false);
}));

test("clean removes crash scratch and abandoned leases, and reports unmanaged entries without removing them", () => withStore(async (store) => {
  const kept = await finished(store, CURRENT, "catalog", "kept catalog");
  const leaseOnly = await store.putBytes(encode("protected only by a dead lease"));
  await mkdir(join(store.root, "leases"), { recursive: true });
  await writeFile(join(store.root, "leases", "dead.json"), JSON.stringify({ schemaVersion: "compendium.artifact-lease.v2", leaseId: "x", runId: "dead", buildId: CURRENT, operation: "publish", createdAt: "", updatedAt: "", objects: [leaseOnly], pendingObjects: [], manifests: [] }));
  await mkdir(join(store.root, ".scan-crashed"), { recursive: true });
  await mkdir(join(store.root, ".work", kept.runId), { recursive: true });
  await mkdir(join(store.root, ".work", "research-probe"), { recursive: true });
  await mkdir(join(store.root, "objects", "sha256", ".tmp"), { recursive: true });
  await writeFile(join(store.root, "objects", "sha256", ".tmp", "partial"), "partial");
  await writeFile(join(kept.directory, "candidate.sqlite"), "candidate");
  await mkdir(join(store.root, ".runtime"), { recursive: true });
  await writeFile(join(store.root, ".runtime", "owner.json"), "{}");
  await mkdir(join(store.root, "altar-visit"), { recursive: true });
  await writeFile(join(store.root, "altar-visit", "notes.json"), "research");

  const report = await cleanArtifactStore(store, () => policy(), { apply: true });

  expect(report.leases).toEqual(["leases/dead.json"]);
  expect(await exists(store.objectPath(leaseOnly.sha256))).toBe(false);
  for (const removed of [".scan-crashed", `.work/${kept.runId}`, "objects/sha256/.tmp/partial", `runs/${kept.runId}/candidate.sqlite`, "leases/dead.json"]) expect(await exists(join(store.root, removed))).toBe(false);
  for (const remaining of [".work/research-probe", ".runtime/owner.json", "altar-visit/notes.json", `runs/${kept.runId}/manifest.json`]) expect(await exists(join(store.root, remaining))).toBe(true);
  expect(report.unmanaged).toEqual([{ path: ".work/research-probe", bytes: expect.any(Number) }, { path: "altar-visit", bytes: 8 }]);
}));

test("clean fails without changes while a command holds a lease", () => withStore(async (store) => {
  await finished(store, OLD, "scan", "collectible");
  const lease = await createArtifactLease(store, { runId: "active", buildId: CURRENT, operation: "scan", objects: [] });
  try {
    const before = await snapshot(store.root);
    await expect(cleanArtifactStore(store, () => policy(), { apply: true })).rejects.toThrow(StoreBusyError);
    await expect(cleanArtifactStore(store, () => policy(), { apply: true })).rejects.toThrow("active.json");
    expect(await snapshot(store.root)).toEqual(before);
  } finally { await lease.release(); }
}));
