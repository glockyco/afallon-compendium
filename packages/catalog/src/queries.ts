import type { Database } from "bun:sqlite";
import type { EntityDetail, EntityRelationshipProjection } from "@afallon/contracts/catalog";

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

export interface CatalogMapPlacement {
  placementId: string;
  mapSpaceId: string;
  position: [number, number];
  height: number;
  label: string | null;
  shape: unknown;
  roles: Array<{ role: string; scope: string; npcEntityKey: string | null }>;
  itemEntityKeys: string[];
}

export interface CatalogMapRegion {
  regionId: string;
  mapSpaceId: string;
  name: string;
  shape: "box" | "sphere";
  geometry: unknown;
}

export interface CatalogMapConnection {
  transitionId: string;
  sourcePlacementId: string | null;
  destinationMapSpaceId: string | null;
  kind: string;
}

export interface CatalogMapFacts {
  mapSpaceId: string;
  label: string;
  placements: CatalogMapPlacement[];
  regions: CatalogMapRegion[];
  connections: CatalogMapConnection[];
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
  placementIds: string[];
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

export interface CatalogGuideFacts {
  entities: EntityDetail[];
  placements: Array<{ placementId: string; sceneNativeId: number }>;
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

export function queryCatalogMap(db: Database, mapSpaceId: string): CatalogQueryResult<CatalogMapFacts | null> {
  const map = db.query<{ map_space_id: string; label: string }, [string]>("SELECT map_space_id, label FROM map_spaces WHERE map_space_id = ?").get(mapSpaceId);
  if (map === null) return { ...identity(db), records: null };
  const rolesByPlacement = new Map<string, CatalogMapPlacement["roles"]>();
  for (const row of db.query<{ placement_id: string; role: string; scope: string; npc_entity_key: string | null }, [string]>(`
    SELECT r.placement_id, r.role, r.scope, r.npc_entity_key FROM placement_roles r
    JOIN placements p ON p.placement_id = r.placement_id
    WHERE p.map_space_id = ? ORDER BY r.placement_id, r.role, r.scope, COALESCE(r.npc_entity_key, '')
  `).all(mapSpaceId)) {
    const roles = rolesByPlacement.get(row.placement_id) ?? [];
    roles.push({ role: row.role, scope: row.scope, npcEntityKey: row.npc_entity_key });
    rolesByPlacement.set(row.placement_id, roles);
  }
  const itemsByPlacement = new Map<string, string[]>();
  for (const row of db.query<{ placement_id: string; item_entity_key: string }, [string]>(`
    SELECT DISTINCT p.placement_id, s.item_entity_key FROM placements p
    JOIN item_sources s JOIN json_each(s.placement_ids_json) j ON j.value = p.placement_id
    WHERE p.map_space_id = ? ORDER BY p.placement_id, s.item_entity_key
  `).all(mapSpaceId)) {
    const items = itemsByPlacement.get(row.placement_id) ?? [];
    items.push(row.item_entity_key);
    itemsByPlacement.set(row.placement_id, items);
  }
  const placements = db.query<{ placement_id: string; map_space_id: string; map_x: number; map_y: number; world_y: number; label: string | null; shape_json: string | null }, [string]>(
    "SELECT placement_id, map_space_id, map_x, map_y, world_y, label, shape_json FROM placements WHERE map_space_id = ? AND map_x IS NOT NULL AND map_y IS NOT NULL ORDER BY placement_id",
  ).all(mapSpaceId).map((row) => ({ placementId: row.placement_id, mapSpaceId: row.map_space_id, position: [row.map_x, row.map_y] as [number, number], height: row.world_y, label: row.label, shape: row.shape_json === null ? null : parse(row.shape_json), roles: rolesByPlacement.get(row.placement_id) ?? [], itemEntityKeys: itemsByPlacement.get(row.placement_id) ?? [] }));
  const regions = db.query<{ region_id: string; map_space_id: string; name: string; shape: "box" | "sphere"; map_geometry_json: string }, [string]>(
    "SELECT region_id, map_space_id, name, shape, map_geometry_json FROM regions WHERE map_space_id = ? AND map_geometry_json IS NOT NULL ORDER BY region_id",
  ).all(mapSpaceId).map((row) => ({ regionId: row.region_id, mapSpaceId: row.map_space_id, name: row.name, shape: row.shape, geometry: parse(row.map_geometry_json) }));
  const connections = db.query<{ transition_id: string; source_placement_id: string | null; destination_map_space_id: string | null; transition_kind: string }, [string]>(`
    SELECT t.transition_id, ps.placement_id AS source_placement_id, t.destination_map_space_id, t.transition_kind
    FROM transitions t
    LEFT JOIN placement_sources ps ON ps.source_id = t.source_id
    LEFT JOIN placements p ON p.placement_id = ps.placement_id
    WHERE p.map_space_id = ? ORDER BY t.transition_id, COALESCE(ps.placement_id, '')
  `).all(mapSpaceId).map((row) => ({ transitionId: row.transition_id, sourcePlacementId: row.source_placement_id, destinationMapSpaceId: row.destination_map_space_id, kind: row.transition_kind }));
  return { ...identity(db), records: { mapSpaceId: map.map_space_id, label: map.label, placements, regions, connections } };
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
  if (row === null) return { ...identity(db), records: null };
  const placementIds = db.query<{ placement_id: string }, [string, string]>(`
    SELECT placement_id FROM placement_roles WHERE npc_entity_key = ?
    UNION
    SELECT j.value AS placement_id FROM item_sources s JOIN json_each(s.placement_ids_json) j WHERE s.item_entity_key = ?
    ORDER BY placement_id
  `).all(entityKey, entityKey).map((placement) => placement.placement_id);
  const records = { entityKey: row.entity_key, kind: row.kind, nativeId: row.native_id, name: row.name, internalName: row.internal_name, description: row.description, placementIds, details: parse(row.details_json), provenance: parse(row.provenance_json) };
  return { ...identity(db), records };
}

export function queryCatalogItemSources(db: Database, itemEntityKey: string): CatalogQueryResult<CatalogItemSource[]> {
  const records = db.query<{ item_entity_key: string; source_kind: string; source_key: string; placement_ids_json: string; condition_ids_json: string; context_json: string }, [string]>(
    "SELECT item_entity_key, source_kind, source_key, placement_ids_json, condition_ids_json, context_json FROM item_sources WHERE item_entity_key = ? ORDER BY source_kind, source_key",
  ).all(itemEntityKey).map((row) => ({ itemEntityKey: row.item_entity_key, sourceKind: row.source_kind, sourceKey: row.source_key, placementIds: textArray(row.placement_ids_json), conditionIds: textArray(row.condition_ids_json), context: parse(row.context_json) }));
  return { ...identity(db), records };
}

export function queryCatalogGuide(db: Database): CatalogQueryResult<CatalogGuideFacts> {
  const search = queryCatalogSearch(db);
  const lootByOwner = new Map<string, EntityRelationshipProjection["lootEntries"]>();
  const lootRows = db.query<{ owner_entity_key: string; loot_table_id: number; entry_index: number; item_id: number; min_count: number; max_count: number; raw_rate: number | null }, []>(`
    SELECT b.owner_entity_key, e.loot_table_id, e.entry_index, item.native_id AS item_id,
      e.min_count, e.max_count, COALESCE(e.raw_rate, b.raw_rate) AS raw_rate
    FROM loot_bindings b
    JOIN loot_entries e ON e.build_id = b.build_id AND e.loot_table_id = b.loot_table_id
    JOIN canonical_entities item ON item.entity_key = e.item_entity_key
    WHERE b.owner_entity_key IS NOT NULL
    ORDER BY b.owner_entity_key, e.loot_table_id, e.entry_index, item.entity_key
  `).all();
  for (const row of lootRows) {
    const entries = lootByOwner.get(row.owner_entity_key) ?? [];
    entries.push({ lootTableId: row.loot_table_id, entryIndex: row.entry_index, itemId: row.item_id, min: row.min_count, max: row.max_count, rawRate: row.raw_rate });
    lootByOwner.set(row.owner_entity_key, entries);
  }
  const entities = search.records.map((summary): EntityDetail => {
    const queried = queryCatalogEntity(db, summary.entityKey).records;
    if (!queried) throw new Error(`Catalog entity disappeared during guide query: ${summary.entityKey}.`);
    const publicData = queried.details as EntityDetail["publicData"];
    if (!publicData || typeof publicData !== "object" || !("localization" in publicData) || !("gameplay" in publicData) || !("icon" in publicData)) throw new Error(`Catalog entity has invalid public data: ${summary.entityKey}.`);
    const sources = queryCatalogItemSources(db, summary.entityKey).records.map((source) => ({ sourceKind: source.sourceKind, sourceKey: source.sourceKey, placementIds: source.placementIds, conditionIds: source.conditionIds, context: source.context as Record<string, unknown> }));
    const roles = db.query<{ role: string }, [string]>("SELECT DISTINCT role FROM placement_roles WHERE npc_entity_key = ? ORDER BY role").all(summary.entityKey).map((row) => row.role);
    const relationships: EntityRelationshipProjection = { merchantStock: [], lootBindings: [], lootEntries: lootByOwner.get(summary.entityKey) ?? [], resourceYields: [], questAssociations: [], transitions: [], conditions: [] };
    return { entityKey: summary.entityKey, kind: summary.kind, nativeId: summary.nativeId, name: summary.name, internalName: queried.internalName, description: summary.description, publicData, roles, placementIds: queried.placementIds, sources, relationships, provenance: Array.isArray(queried.provenance) ? queried.provenance as EntityDetail["provenance"] : [] };
  });
  const placements = db.query<{ placement_id: string; scene_native_id: number }, []>("SELECT placement_id, scene_native_id FROM placements WHERE map_x IS NOT NULL AND map_y IS NOT NULL ORDER BY placement_id").all().map((row) => ({ placementId: row.placement_id, sceneNativeId: row.scene_native_id }));
  return { buildId: search.buildId, catalogId: search.catalogId, records: { entities, placements } };
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
