import type { Database } from "bun:sqlite";

export interface CatalogQueryIdentity {
  buildId: string;
  catalogId: string;
}

export interface CatalogMapSummary {
  mapSpaceId: string;
  label: string;
  placementCount: number;
  regionCount: number;
}

export interface CatalogSearchSummary {
  entityKey: string;
  kind: string;
  nativeId: number;
  name: string | null;
  description: string | null;
}

export interface CatalogEntityDetail extends CatalogSearchSummary {
  internalName: string | null;
  details: unknown;
  provenance: unknown;
}

export interface CatalogItemSource {
  itemEntityKey: string;
  sourceKind: string;
  sourceKey: string;
  placementIds: string[];
  conditionIds: string[];
  context: unknown;
}

export interface CatalogImageryMetadata {
  assetId: string;
  mapSpaceId: string;
  kind: "game-map" | "captured";
  sha256: string;
  bytes: number;
  metadata: unknown;
  provenance: unknown;
}

export interface CatalogCoverage {
  unresolvedIssues: Array<{ issueId: string; kind: string; subjectKey: string; semanticDiscriminator: string; occurrenceCount: number }>;
  exclusions: Array<{ exclusionId: string; kind: string; subjectKey: string; detail: string; mapSpaceIds: string[] }>;
  occurrenceCount: number;
}

export interface CatalogQueryResult<T> extends CatalogQueryIdentity {
  records: T;
}

function identity(db: Database): CatalogQueryIdentity {
  const row = db.query<{ build_id: string; catalog_id: string }, []>("SELECT build_id, catalog_id FROM catalog_metadata").get();
  if (!row) throw new Error("Catalog metadata is missing.");
  return { buildId: row.build_id, catalogId: row.catalog_id };
}

function parse(value: string): unknown { return JSON.parse(value); }
function textArray(value: string): string[] {
  const parsed = parse(value);
  if (!Array.isArray(parsed) || parsed.some((entry) => typeof entry !== "string")) throw new Error("Catalog JSON column does not contain a string array.");
  return parsed;
}

export function queryCatalogMaps(db: Database): CatalogQueryResult<CatalogMapSummary[]> {
  const records = db.query<{ map_space_id: string; label: string; placement_count: number; region_count: number }, []>(`
    SELECT m.map_space_id, m.label,
      (SELECT count(*) FROM placements p WHERE p.build_id = m.build_id AND p.map_space_id = m.map_space_id) AS placement_count,
      (SELECT count(*) FROM regions r WHERE r.build_id = m.build_id AND r.map_space_id = m.map_space_id) AS region_count
    FROM map_spaces m ORDER BY m.map_space_id
  `).all().map((row) => ({ mapSpaceId: row.map_space_id, label: row.label, placementCount: row.placement_count, regionCount: row.region_count }));
  return { ...identity(db), records };
}

export function queryCatalogSearch(db: Database): CatalogQueryResult<CatalogSearchSummary[]> {
  const records = db.query<{ entity_key: string; kind: string; native_id: number; name: string | null; description: string | null }, []>(
    "SELECT entity_key, kind, native_id, name, description FROM canonical_entities ORDER BY kind, native_id, entity_key",
  ).all().map((row) => ({ entityKey: row.entity_key, kind: row.kind, nativeId: row.native_id, name: row.name, description: row.description }));
  return { ...identity(db), records };
}

export function queryCatalogEntity(db: Database, entityKey: string): CatalogQueryResult<CatalogEntityDetail | null> {
  const row = db.query<{ entity_key: string; kind: string; native_id: number; name: string | null; internal_name: string | null; description: string | null; details_json: string; provenance_json: string }, [string]>(
    "SELECT entity_key, kind, native_id, name, internal_name, description, details_json, provenance_json FROM canonical_entities WHERE entity_key = ?",
  ).get(entityKey);
  const records = row === null ? null : { entityKey: row.entity_key, kind: row.kind, nativeId: row.native_id, name: row.name, internalName: row.internal_name, description: row.description, details: parse(row.details_json), provenance: parse(row.provenance_json) };
  return { ...identity(db), records };
}

export function queryCatalogItemSources(db: Database, itemEntityKey: string): CatalogQueryResult<CatalogItemSource[]> {
  const records = db.query<{ item_entity_key: string; source_kind: string; source_key: string; placement_ids_json: string; condition_ids_json: string; context_json: string }, [string]>(
    "SELECT item_entity_key, source_kind, source_key, placement_ids_json, condition_ids_json, context_json FROM item_sources WHERE item_entity_key = ? ORDER BY source_kind, source_key",
  ).all(itemEntityKey).map((row) => ({ itemEntityKey: row.item_entity_key, sourceKind: row.source_kind, sourceKey: row.source_key, placementIds: textArray(row.placement_ids_json), conditionIds: textArray(row.condition_ids_json), context: parse(row.context_json) }));
  return { ...identity(db), records };
}

export function queryCatalogImagery(db: Database, mapSpaceId?: string): CatalogQueryResult<CatalogImageryMetadata[]> {
  const rows = mapSpaceId === undefined
    ? db.query<{ asset_id: string; map_space_id: string; kind: "game-map" | "captured"; sha256: string; bytes: number; metadata_json: string; provenance_json: string }, []>("SELECT asset_id, map_space_id, kind, sha256, bytes, metadata_json, provenance_json FROM imagery_assets ORDER BY map_space_id, kind, asset_id").all()
    : db.query<{ asset_id: string; map_space_id: string; kind: "game-map" | "captured"; sha256: string; bytes: number; metadata_json: string; provenance_json: string }, [string]>("SELECT asset_id, map_space_id, kind, sha256, bytes, metadata_json, provenance_json FROM imagery_assets WHERE map_space_id = ? ORDER BY kind, asset_id").all(mapSpaceId);
  const records = rows.map((row) => ({ assetId: row.asset_id, mapSpaceId: row.map_space_id, kind: row.kind, sha256: row.sha256, bytes: row.bytes, metadata: parse(row.metadata_json), provenance: parse(row.provenance_json) }));
  return { ...identity(db), records };
}

export function queryCatalogCoverage(db: Database): CatalogQueryResult<CatalogCoverage> {
  const unresolvedIssues = db.query<{ issue_id: string; kind: string; subject_key: string; semantic_discriminator: string; occurrence_count: number }, []>(`
    SELECT i.issue_id, i.kind, i.subject_key, i.semantic_discriminator, count(o.occurrence_id) AS occurrence_count
    FROM coverage_issues i LEFT JOIN coverage_occurrences o ON o.issue_id = i.issue_id
    WHERE i.state = 'unresolved'
    GROUP BY i.issue_id ORDER BY i.kind, i.subject_key, i.semantic_discriminator, i.issue_id
  `).all().map((row) => ({ issueId: row.issue_id, kind: row.kind, subjectKey: row.subject_key, semanticDiscriminator: row.semantic_discriminator, occurrenceCount: row.occurrence_count }));
  const exclusions = db.query<{ exclusion_id: string; kind: string; subject_key: string; detail: string; map_space_ids_json: string }, []>(
    "SELECT exclusion_id, kind, subject_key, detail, map_space_ids_json FROM coverage_exclusions ORDER BY kind, subject_key, exclusion_id",
  ).all().map((row) => ({ exclusionId: row.exclusion_id, kind: row.kind, subjectKey: row.subject_key, detail: row.detail, mapSpaceIds: textArray(row.map_space_ids_json) }));
  const occurrenceCount = Number(db.query<{ count: number }, []>("SELECT count(*) AS count FROM coverage_occurrences").get()?.count ?? 0);
  return { ...identity(db), records: { unresolvedIssues, exclusions, occurrenceCount } };
}
