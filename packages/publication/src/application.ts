import { Database } from "bun:sqlite";
import { randomUUID } from "node:crypto";
import { mkdir, open, readFile, realpath, rename, rm } from "node:fs/promises";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { Type, type Static } from "typebox";
import { Assert } from "typebox/value";
import { ArtifactStore, beginArtifactRun, createArtifactLease, fingerprintStep, resolveArtifactRun, selectLatestSuccess, type ActiveArtifactLease } from "@afallon/artifacts";
import { evaluateCatalogGate, queryCatalogMaps, type CatalogGateResult } from "@afallon/catalog";
import { canonicalJson, schemaRegistry, type ArtifactRunManifest, type ContentIdentity } from "@afallon/contracts";
import { PublicationPlanSchema, PublicationPresentationSchema, assertStaticResourceIdentity, type PublicationPlan } from "@afallon/contracts/public";
import { buildStaticPublication, type StaticPublicationBuildResult } from "./build";
import { materializePublication, selectPublication, type SelectedPublication } from "./selection";

export interface PublicationApplicationOptions {
  publicationRoot: string;
  diagnosticRevision: string;
  select?: boolean;
}
export interface PublicationApplicationResult extends StaticPublicationBuildResult {
  buildId: string;
  catalogId: string;
  gate: CatalogGateResult;
  candidate: SelectedPublication;
  selection: SelectedPublication | null;
  manifestPath: string;
  runManifest: ArtifactRunManifest;
  manifestObject: ContentIdentity;
}

const SelectionJournalSchema = Type.Object({
  state: Type.Union([Type.Literal("preparing"), Type.Literal("pending"), Type.Literal("settled")]),
  referencePath: Type.String(),
  publicationPath: Type.String(),
  previousReference: Type.Union([Type.String(), Type.Null()]),
  previousPublication: Type.Union([Type.String(), Type.Null()]),
}, { additionalProperties: false });
type SelectionJournal = Static<typeof SelectionJournalSchema>;
const PendingSelectionSchema = Type.Object({ journalPath: Type.String() }, { additionalProperties: false });
const pendingSelectionName = ".publication-selection.pending.json";

async function readOptional(path: string): Promise<Buffer | null> {
  try { return await readFile(path); }
  catch (error) {
    if (error !== null && typeof error === "object" && "code" in error && error.code === "ENOENT") return null;
    throw error;
  }
}

async function syncDirectory(path: string): Promise<void> {
  const directory = await open(path, "r");
  try { await directory.sync(); } finally { await directory.close(); }
}

async function replaceDurably(path: string, bytes: string | Buffer): Promise<void> {
  const temporary = `${path}.${randomUUID()}.tmp`;
  try {
    const file = await open(temporary, "wx", 0o644);
    try { await file.writeFile(bytes); await file.sync(); } finally { await file.close(); }
    await rename(temporary, path);
    await syncDirectory(dirname(path));
  } finally { await rm(temporary, { force: true }); }
}

async function removeDurably(path: string): Promise<void> {
  await rm(path, { force: true });
  await syncDirectory(dirname(path));
}

async function readPending(directory: string): Promise<{ journalPath: string; journal: SelectionJournal } | null> {
  const bytes = await readOptional(join(directory, pendingSelectionName));
  if (bytes === null) return null;
  const pending: unknown = JSON.parse(bytes.toString("utf8"));
  Assert(PendingSelectionSchema, pending);
  const journal: unknown = JSON.parse(await readFile(pending.journalPath, "utf8"));
  Assert(SelectionJournalSchema, journal);
  if (!isAbsolute(pending.journalPath) || !isAbsolute(journal.referencePath) || !isAbsolute(journal.publicationPath)
    || !journal.referencePath.endsWith("/latest-success.json") || !journal.publicationPath.endsWith("/selected.json")
    || dirname(pending.journalPath) !== dirname(journal.referencePath)
    || ![dirname(journal.referencePath), dirname(journal.publicationPath)].includes(directory)) {
    throw new Error("Publication selection journal has invalid selector paths.");
  }
  return { journalPath: pending.journalPath, journal };
}

async function settleSelection(journalPath: string, journal: SelectionJournal): Promise<void> {
  journal.state = "settled";
  await replaceDurably(journalPath, `${canonicalJson(journal)}\n`);
  for (const directory of [dirname(journal.referencePath), dirname(journal.publicationPath)]) {
    const pending = await readPending(directory);
    if (pending?.journalPath === journalPath) await removeDurably(join(directory, pendingSelectionName));
  }
  await removeDurably(journalPath);
}

async function recoverSelection(journalPath: string, journal: SelectionJournal): Promise<void> {
  if (journal.state === "pending") {
    const failures: unknown[] = [];
    for (const [pointer, previous] of [[journal.referencePath, journal.previousReference], [journal.publicationPath, journal.previousPublication]] as const) {
      try {
        if (previous === null) await removeDurably(pointer);
        else await replaceDurably(pointer, Buffer.from(previous, "base64"));
      } catch (error) { failures.push(error); }
    }
    if (failures.length > 0) throw new AggregateError(failures, "Publication selector recovery failed. The selection journal remains pending.");
  }
  await settleSelection(journalPath, journal);
}

async function withPublicationSelection<T>(referencePath: string, publicationPath: string, select: () => Promise<T>): Promise<T> {
  const directories = new Set([dirname(referencePath), dirname(publicationPath)]);
  while (true) {
    const locks: Database[] = [];
    try {
      for (const directory of [...directories].sort()) {
        const lock = new Database(join(directory, ".publication-selection.sqlite"), { create: true });
        try { lock.exec("PRAGMA busy_timeout = 0; BEGIN EXCLUSIVE"); }
        catch (error) {
          lock.close();
          if (error !== null && typeof error === "object" && "code" in error && (error.code === "SQLITE_BUSY" || error.code === "SQLITE_LOCKED")) {
            throw new Error("Publication selection is busy. Another publisher owns a selector.", { cause: error });
          }
          throw error;
        }
        locks.push(lock);
      }
      const pending = new Map<string, SelectionJournal>();
      const acquired = directories.size;
      for (const directory of [...directories]) {
        const transaction = await readPending(directory);
        if (!transaction) continue;
        pending.set(transaction.journalPath, transaction.journal);
        directories.add(dirname(transaction.journal.referencePath));
        directories.add(dirname(transaction.journal.publicationPath));
      }
      // Recovery holds both original selector locks, even when this publisher uses another root.
      if (directories.size !== acquired) continue;
      for (const [journalPath, journal] of pending) await recoverSelection(journalPath, journal);

      const journalPath = join(dirname(referencePath), `.publication-selection-${randomUUID()}.json`);
      const journal: SelectionJournal = {
        state: "preparing", referencePath, publicationPath,
        previousReference: (await readOptional(referencePath))?.toString("base64") ?? null,
        previousPublication: (await readOptional(publicationPath))?.toString("base64") ?? null,
      };
      await replaceDurably(journalPath, `${canonicalJson(journal)}\n`);
      try {
        for (const directory of [dirname(referencePath), dirname(publicationPath)]) {
          await replaceDurably(join(directory, pendingSelectionName), `${canonicalJson({ journalPath })}\n`);
        }
        journal.state = "pending";
        await replaceDurably(journalPath, `${canonicalJson(journal)}\n`);
        const result = await select();
        for (const pointer of [referencePath, publicationPath]) {
          const file = await open(pointer, "r");
          try { await file.sync(); } finally { await file.close(); }
          await syncDirectory(dirname(pointer));
        }
        await settleSelection(journalPath, journal);
        return result;
      } catch (error) {
        try { await recoverSelection(journalPath, journal); }
        catch (recoveryError) { throw new AggregateError([error, recoveryError], "Publication selection failed and reference restoration failed."); }
        throw error;
      }
    } finally { for (const lock of locks.reverse()) lock.close(); }
  }
}

export async function publishFromPlan(store: ArtifactStore, plan: PublicationPlan, options: PublicationApplicationOptions): Promise<PublicationApplicationResult> {
  Assert(PublicationPlanSchema, plan);
  const inputs = { catalogManifest: plan.catalog.manifest, catalog: plan.catalog.object, presentation: plan.presentation };
  const schemas = ["compendium.publish-plan.v2", "compendium.publication-presentation.v1", "compendium.static-root.v2"].map((id) => {
    const schema = schemaRegistry.require(id);
    return { id: schema.id, sha256: schema.sha256 };
  });
  const settings = { plan };
  const fingerprint = await fingerprintStep({ entrypoint: import.meta.path, buildId: plan.buildId, inputs, settings, schemas });
  const run = await beginArtifactRun(store, {
    buildId: plan.buildId, operation: "publish", inputs, inputManifests: ["catalogManifest"], settings, schemas,
    implementationFingerprint: fingerprint.implementation, cacheKey: fingerprint.cacheKey, probeHashes: fingerprint.probeHashes,
    diagnosticRevision: options.diagnosticRevision,
  });
  let lease: ActiveArtifactLease | undefined;
  let db: Database | undefined;
  try {
    let result: StaticPublicationBuildResult;
    let candidate: SelectedPublication;
    let gate: CatalogGateResult;
    let runManifest: ArtifactRunManifest;
    try {
      lease = await createArtifactLease(store, { runId: `publication-${run.runId}`, buildId: plan.buildId, operation: "publish", objects: Object.values(inputs), manifests: [plan.catalog.manifest] });
      const planObject = await store.putBytes(new TextEncoder().encode(`${canonicalJson(plan)}\n`), lease);
      await run.addArtifact("plan.json", planObject, { mediaType: "application/json", schemaId: plan.schemaVersion });
      const catalogRun = await resolveArtifactRun(store, plan.catalog.manifest, { buildId: plan.buildId, operation: "catalog" });
      const catalogOutput = catalogRun.outputs.find((output) => output.name === "catalog.sqlite" && output.schemaId === "compendium.catalog.v2" && output.mediaType === "application/vnd.sqlite3" && output.content.sha256 === plan.catalog.object.sha256 && output.content.bytes === plan.catalog.object.bytes);
      if (!catalogOutput) throw new Error("Publication catalog object is not the sealed database output of its successful run.");
      await store.verify(plan.catalog.object);
      await store.verify(plan.presentation);
      const presentation: unknown = JSON.parse(await readFile(store.objectPath(plan.presentation.sha256), "utf8"));
      Assert(PublicationPresentationSchema, presentation);
      assertStaticResourceIdentity({ buildId: plan.buildId, catalogId: plan.catalog.catalogId }, presentation);
      if (new Set(presentation.worldOffsets.map((offset) => offset.mapSpaceId)).size !== presentation.worldOffsets.length) throw new Error("Publication world offsets repeat a map identity.");
      if (new Set(presentation.spatialBounds.map((bounds) => bounds.mapSpaceId)).size !== presentation.spatialBounds.length) throw new Error("Publication spatial bounds repeat a map identity.");
      for (const bounds of presentation.spatialBounds) if (bounds.minX > bounds.maxX || bounds.minY > bounds.maxY) throw new Error(`Publication spatial bounds are reversed: ${bounds.mapSpaceId}.`);
      db = new Database(store.objectPath(plan.catalog.object.sha256), { readonly: true, strict: true });
      db.exec("PRAGMA query_only = ON");
      const identity = queryCatalogMaps(db);
      assertStaticResourceIdentity({ buildId: plan.buildId, catalogId: plan.catalog.catalogId }, identity);
      gate = evaluateCatalogGate(db, { mode: plan.mode, expectedBuildId: plan.buildId, expectedCatalogId: plan.catalog.catalogId, referenceIntegrity: { verified: true, failures: [] }, spatialBounds: presentation.spatialBounds });
      result = await buildStaticPublication(db, store, plan.mode, gate, presentation.worldOffsets, presentation.capturedMapSpaceIds, lease);
      db.close();
      db = undefined;
      await store.verify(plan.catalog.object);
      candidate = await materializePublication(store, options.publicationRoot, result.root, result.resources, result.assets, gate);
      const measurements = await store.putBytes(new TextEncoder().encode(`${canonicalJson(result.measurements)}\n`), lease);
      await run.addArtifact("measurements.json", measurements, { mediaType: "application/json" });
      await run.addArtifact("publication.json", result.root.identity, {
        mediaType: "application/json", schemaId: result.manifest.schemaVersion,
        references: [...result.resources.map((resource) => ({ kind: "object" as const, content: resource.identity })), ...result.assets.map((asset) => ({ kind: "object" as const, content: asset.identity }))],
      });
      runManifest = await run.succeed();
    } catch (error) {
      db?.close();
      db = undefined;
      let failure = error;
      try { await store.verify(plan.catalog.object); }
      catch (integrityError) { failure = new AggregateError([error, integrityError], "Publication failed and its input catalog failed verification."); }
      if (run.status === "running") await run.fail(failure);
      throw failure;
    }
    const manifestObject = run.manifestIdentity;
    if (!manifestObject) throw new Error("Publication run did not retain its terminal manifest object.");
    let selection: SelectedPublication | null = null;
    if (options.select === true) {
      const referenceDirectory = join(store.root, "refs", plan.buildId, "publish");
      await mkdir(referenceDirectory, { recursive: true });
      const referencePath = join(await realpath(referenceDirectory), "latest-success.json");
      const publicationPath = join(await realpath(resolve(options.publicationRoot)), "selected.json");
      for (const directory of [dirname(referenceDirectory), join(store.root, "refs"), store.root, dirname(dirname(publicationPath))]) await syncDirectory(directory);
      selection = await withPublicationSelection(referencePath, publicationPath, async () => {
        await selectLatestSuccess(store, run.manifestPath);
        return await selectPublication(store, options.publicationRoot, result.root, result.resources, result.assets, gate);
      });
    }
    return { ...result, buildId: plan.buildId, catalogId: plan.catalog.catalogId, gate, candidate, selection, manifestPath: run.manifestPath, runManifest, manifestObject };
  } finally {
    try { await lease?.release(); }
    finally { await run.release(); }
  }
}
