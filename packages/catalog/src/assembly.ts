import { createHash, randomUUID } from "node:crypto";
import { mkdir, rename, rm } from "node:fs/promises";
import * as path from "node:path";
import { ArtifactStore, type ArtifactRun } from "@afallon/artifacts";
import { canonicalJson, type ContentIdentity } from "@afallon/contracts";
import type { NormalizedDatabaseInput, CoverageAccounting } from "@afallon/contracts/catalog";
import { databaseCounts, openNormalizedDatabase, populateNormalizedDatabase, type NormalizedOutputCounts } from "./database";
import { insertCoverageAccounting } from "./coverage-accounting";

export interface CatalogArtifactReference { key: string; kind: string; identity: ContentIdentity }
export interface CatalogAssemblyIdentity { schemaVersion: string; settings: Readonly<Record<string, unknown>>; assemblerFingerprint: string }
export interface CatalogAssemblyInput { normalized: NormalizedDatabaseInput; sources: readonly CatalogArtifactReference[]; identity: CatalogAssemblyIdentity; accounting?: CoverageAccounting }
export interface CatalogAssemblyResult { catalogId: string; path: string; sha256: string; bytes: number; counts: NormalizedOutputCounts }
export interface CatalogLogicalIdentityInput extends CatalogAssemblyIdentity { buildId: string; inputs: Readonly<Record<string, ContentIdentity>> }

export function catalogLogicalIdentity(input: CatalogLogicalIdentityInput): string {
  return createHash("sha256").update(canonicalJson({ buildId: input.buildId, schemaVersion: input.schemaVersion, settings: input.settings, inputs: input.inputs, assemblerFingerprint: input.assemblerFingerprint })).digest("hex");
}

function validateInput(input: CatalogAssemblyInput) {
  if (!input?.normalized || typeof input.normalized.buildId !== "string" || !input.normalized.buildId) throw new TypeError("Catalog assembly requires a build identity.");
  if (!input.identity.schemaVersion || !/^[a-f0-9]{64}$/.test(input.identity.assemblerFingerprint)) throw new TypeError("Catalog assembly requires a schema and assembler fingerprint.");
  for (const key of ["identityResults", "entities", "scenes", "mapSpaces", "bindings", "placements", "sources", "roles", "regions", "conditions", "spawnCandidates", "merchantTables", "merchantBindings", "merchantStock", "lootTables", "lootBindings", "lootEntries", "linkedNpcRules", "resourceYields", "questAssociations", "transitions", "itemSources", "entityDetails", "sourceDetails", "patrolPaths", "sceneSpawns", "blockers", "coverageOccurrences", "exclusions"] as const) if (!Array.isArray(input.normalized[key])) throw new TypeError(`Catalog assembly requires normalized.${key} to be an array.`);
  const keys = new Set<string>();
  for (const source of input.sources) {
    if (!source.key || !source.kind) throw new TypeError("Catalog source references require keys and kinds.");
    if (keys.has(source.key)) throw new Error(`Catalog source identity collision: ${source.key}.`);
    keys.add(source.key);
  }
}

export async function assembleCatalog(store: ArtifactStore, destination: string, input: CatalogAssemblyInput, run?: ArtifactRun): Promise<CatalogAssemblyResult> {
  validateInput(input);
  const sources = [...input.sources].sort((a, b) => a.key.localeCompare(b.key));
  for (const source of sources) await store.verify(source.identity);
  const catalogId = catalogLogicalIdentity({ buildId: input.normalized.buildId, ...input.identity, inputs: Object.fromEntries(sources.map((source) => [source.key, source.identity])) });
  const absoluteDestination = path.resolve(destination);
  await mkdir(path.dirname(absoluteDestination), { recursive: true });
  const candidateDirectory = path.join(path.dirname(absoluteDestination), `.catalog-${randomUUID()}`);
  await mkdir(candidateDirectory);
  const candidatePath = path.join(candidateDirectory, "catalog.sqlite");
  const db = openNormalizedDatabase(candidatePath);
  let closed = false;
  try {
    db.transaction(() => {
      populateNormalizedDatabase(db, input.normalized, sources.map((source) => ({ key: source.key, kind: source.kind, ref: { path: `objects/sha256/${source.identity.sha256.slice(0, 2)}/${source.identity.sha256.slice(2)}`, sha256: source.identity.sha256 } })));
      if (input.accounting) insertCoverageAccounting(db, input.accounting);
      db.query("INSERT INTO catalog_metadata VALUES (?, ?, ?, ?, ?)").run(catalogId, input.normalized.buildId, input.identity.schemaVersion, canonicalJson(input.identity.settings), input.identity.assemblerFingerprint);
      const violations = db.query("PRAGMA foreign_key_check").all();
      if (violations.length) throw new Error(`Catalog candidate has ${violations.length} foreign-key violations.`);
    })();
    const integrity = db.query<{ integrity_check: string }, []>("PRAGMA integrity_check").all();
    if (integrity.length !== 1 || integrity[0]?.integrity_check !== "ok") throw new Error("Catalog SQLite integrity verification failed.");
    const counts = databaseCounts(db);
    db.exec("PRAGMA journal_mode = DELETE");
    db.close(); closed = true;
    const object = run ? await run.putFile(candidatePath) : await store.putFile(candidatePath);
    await rename(candidatePath, absoluteDestination);
    return { catalogId, path: absoluteDestination, sha256: object.sha256, bytes: object.bytes, counts };
  } finally {
    if (!closed) db.close();
    await rm(candidateDirectory, { recursive: true, force: true });
  }
}
