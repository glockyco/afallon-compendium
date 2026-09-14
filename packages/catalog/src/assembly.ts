import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm } from "node:fs/promises";
import * as path from "node:path";
import { ArtifactStore } from "@afallon/artifacts";
import { canonicalJson, type ContentIdentity } from "@afallon/contracts";
import type { NormalizedDatabaseInput } from "@afallon/contracts/catalog";
import { databaseCounts, openNormalizedDatabase, populateNormalizedDatabase, type NormalizedOutputCounts } from "./database";

export interface CatalogArtifactReference {
  key: string;
  kind: string;
  identity: ContentIdentity;
}

export interface CatalogAssemblyIdentity {
  schemaVersion: string;
  settings: Readonly<Record<string, unknown>>;
  assemblerFingerprint: string;
}

export interface CatalogAssemblyInput {
  normalized: NormalizedDatabaseInput;
  sources: readonly CatalogArtifactReference[];
  identity: CatalogAssemblyIdentity;
}

export interface CatalogAssemblyResult {
  catalogId: string;
  path: string;
  sha256: string;
  bytes: number;
  counts: NormalizedOutputCounts;
}

function sortedRows<T>(rows: readonly T[]): T[] {
  return [...rows].sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
}

function deterministicInput(input: NormalizedDatabaseInput): NormalizedDatabaseInput {
  const result = { ...input };
  for (const key of Object.keys(result) as Array<keyof NormalizedDatabaseInput>) {
    const value = result[key];
    if (Array.isArray(value)) (result as Record<string, unknown>)[key] = sortedRows(value);
  }
  return result;
}

export interface CatalogLogicalIdentityInput extends CatalogAssemblyIdentity {
  buildId: string;
  inputs: Readonly<Record<string, ContentIdentity>>;
}

export function catalogLogicalIdentity(input: CatalogLogicalIdentityInput): string {
  return createHash("sha256").update(canonicalJson({
    buildId: input.buildId,
    schemaVersion: input.schemaVersion,
    settings: input.settings,
    inputs: input.inputs,
    assemblerFingerprint: input.assemblerFingerprint,
  })).digest("hex");
}

function validateInput(input: CatalogAssemblyInput): void {
  if (!input || typeof input !== "object" || !input.normalized || typeof input.normalized !== "object") throw new TypeError("Catalog assembly requires normalized input.");
  if (typeof input.normalized.buildId !== "string" || input.normalized.buildId.length === 0) throw new TypeError("Catalog assembly requires a build identity.");
  if (!input.identity || typeof input.identity.schemaVersion !== "string" || input.identity.schemaVersion.length === 0) throw new TypeError("Catalog assembly requires a schema version.");
  if (!input.identity.settings || typeof input.identity.settings !== "object" || Array.isArray(input.identity.settings)) throw new TypeError("Catalog assembly requires settings.");
  if (!/^[a-f0-9]{64}$/.test(input.identity.assemblerFingerprint)) throw new TypeError("Catalog assembly requires an assembler fingerprint.");
  for (const key of ["identityResults", "entities", "scenes", "mapSpaces", "bindings", "placements", "sources", "roles", "regions", "conditions", "spawnCandidates", "merchantTables", "merchantBindings", "merchantStock", "lootTables", "lootBindings", "lootEntries", "linkedNpcRules", "resourceYields", "questAssociations", "transitions", "itemSources", "blockers", "coverageOccurrences", "exclusions"] as const) {
    if (!Array.isArray(input.normalized[key])) throw new TypeError(`Catalog assembly requires normalized.${key} to be an array.`);
  }
  const seen = new Set<string>();
  for (const source of input.sources) {
    if (!source || typeof source.key !== "string" || source.key.length === 0 || typeof source.kind !== "string" || source.kind.length === 0) throw new TypeError("Catalog source references require non-empty keys and kinds.");
    if (seen.has(source.key)) throw new Error(`Catalog source identity collision: ${source.key}.`);
    seen.add(source.key);
  }
}

export async function assembleCatalog(store: ArtifactStore, destination: string, input: CatalogAssemblyInput): Promise<CatalogAssemblyResult> {
  validateInput(input);
  const orderedSources = [...input.sources].sort((left, right) => left.key.localeCompare(right.key) || left.kind.localeCompare(right.kind) || left.identity.sha256.localeCompare(right.identity.sha256));
  for (const source of orderedSources) await store.verify(source.identity);
  const catalogId = catalogLogicalIdentity({
    buildId: input.normalized.buildId,
    ...input.identity,
    inputs: Object.fromEntries(orderedSources.map((source) => [source.key, source.identity])),
  });

  const absoluteDestination = path.resolve(destination);
  await mkdir(path.dirname(absoluteDestination), { recursive: true });
  const candidateDirectory = path.join(path.dirname(absoluteDestination), `.catalog-${randomUUID()}`);
  const candidatePath = path.join(candidateDirectory, "catalog.sqlite");
  await mkdir(candidateDirectory, { recursive: false });
  let databaseClosed = false;
  const db = openNormalizedDatabase(candidatePath);
  try {
    populateNormalizedDatabase(db, deterministicInput(input.normalized), orderedSources.map((source) => ({
      key: source.key,
      kind: source.kind,
      ref: { path: store.objectPath(source.identity.sha256), sha256: source.identity.sha256 },
    })));
    db.query("INSERT INTO catalog_metadata VALUES (?, ?, ?, ?, ?)").run(
      catalogId,
      input.normalized.buildId,
      input.identity.schemaVersion,
      canonicalJson(input.identity.settings),
      input.identity.assemblerFingerprint,
    );
    const violations = db.query("PRAGMA foreign_key_check").all();
    if (violations.length > 0) throw new Error(`Catalog candidate has ${violations.length} foreign-key violations.`);
    const counts = databaseCounts(db);
    db.close();
    databaseClosed = true;
    const bytes = await readFile(candidatePath);
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    await rename(candidatePath, absoluteDestination);
    return { catalogId, path: absoluteDestination, sha256, bytes: bytes.byteLength, counts };
  } finally {
    if (!databaseClosed) db.close();
    await rm(candidateDirectory, { recursive: true, force: true });
  }
}
