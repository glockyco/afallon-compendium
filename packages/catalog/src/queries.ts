import type { Database } from "bun:sqlite";
import type { EntityDetail, NormalizedPatrolPath, CatalogDerivation, CatalogEndpoint, CatalogEntityRow, CatalogFacts, CatalogItemFacts, CatalogStatValue, CatalogNpcFacts, CatalogTaskFacts, CatalogQuestFacts, CatalogPlaceFacts, CatalogPropertyFacts, CatalogRecipeFacts, CatalogDropRow, CatalogVendorRow, CatalogGatherRow, CatalogContainerRow, CatalogQuestRow, CatalogRecipeRow, CatalogPlacementRow, CatalogTransitionRow, CatalogCondition, CatalogRequirement, CatalogRelations } from "@afallon/contracts/catalog";
import { readCoverageAccountingSummary, type CoverageAccountingSummary } from "./coverage-accounting";

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
  sceneNativeId: number;
  scenePath: string;
  mapSpaceId: string;
  worldPosition: { x: number; y: number; z: number };
  position: [number, number];
  height: number;
  label: string | null;
  shape: unknown;
  roles: Array<{ role: string; scope: string; npcEntityKey: string | null }>;
  itemEntityKeys: string[];
  sourceDetails: Array<{ sourceId: string; family: string; data: Record<string, unknown> }>;
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

export interface CatalogSpatialContext {
  bindings: Array<{ mapSpaceId: string; sceneNativeId: number; scenePath: string; frame: Record<string, unknown>; domain: Record<string, unknown> }>;
  sceneSpawns: Array<{ sceneNativeId: number; position: { x: number; y: number; z: number } }>;
  patrolPaths: NormalizedPatrolPath[];
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
  accounting: CoverageAccountingSummary;
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
function object(value: string): Record<string, unknown> {
  const parsed = parse(value);
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Catalog JSON column does not contain an object.");
  return parsed as Record<string, unknown>;
}
function recordPosition(value: unknown): { x: number; y: number; z: number } | null {
  if (value === null || typeof value !== "object" || !("x" in value) || !("y" in value) || !("z" in value)) return null;
  return typeof value.x === "number" && Number.isFinite(value.x) && typeof value.y === "number" && Number.isFinite(value.y) && typeof value.z === "number" && Number.isFinite(value.z) ? { x: value.x, y: value.y, z: value.z } : null;
}
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
  const sourceDetailsByPlacement = new Map<string, CatalogMapPlacement["sourceDetails"]>();
  for (const row of db.query<{ placement_id: string; source_id: string; family: string; data_json: string }, [string]>(`
    SELECT d.placement_id, d.source_id, d.family, d.data_json FROM source_details d
    JOIN placements p ON p.placement_id = d.placement_id
    WHERE p.map_space_id = ? ORDER BY d.placement_id, d.source_id, d.family, d.detail_id
  `).all(mapSpaceId)) {
    const details = sourceDetailsByPlacement.get(row.placement_id) ?? [];
    details.push({ sourceId: row.source_id, family: row.family, data: object(row.data_json) });
    sourceDetailsByPlacement.set(row.placement_id, details);
  }
  const placements = db.query<{ placement_id: string; scene_native_id: number; scene_path: string; map_space_id: string; world_x: number; world_y: number; world_z: number; map_x: number; map_y: number; label: string | null; shape_json: string | null }, [string]>(
    "SELECT placement_id, scene_native_id, scene_path, map_space_id, world_x, world_y, world_z, map_x, map_y, label, shape_json FROM placements WHERE map_space_id = ? AND map_x IS NOT NULL AND map_y IS NOT NULL ORDER BY placement_id",
  ).all(mapSpaceId).map((row) => ({ placementId: row.placement_id, sceneNativeId: row.scene_native_id, scenePath: row.scene_path, mapSpaceId: row.map_space_id, worldPosition: { x: row.world_x, y: row.world_y, z: row.world_z }, position: [row.map_x, row.map_y] as [number, number], height: row.world_y, label: row.label, shape: row.shape_json === null ? null : parse(row.shape_json), roles: rolesByPlacement.get(row.placement_id) ?? [], itemEntityKeys: itemsByPlacement.get(row.placement_id) ?? [], sourceDetails: sourceDetailsByPlacement.get(row.placement_id) ?? [] }));
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

export function queryCatalogSpatialContext(db: Database): CatalogQueryResult<CatalogSpatialContext> {
  const bindings = db.query<{ map_space_id: string; scene_native_id: number; scene_path: string; frame_json: string; domain_json: string }, []>(
    "SELECT map_space_id, scene_native_id, scene_path, frame_json, domain_json FROM map_space_bindings ORDER BY map_space_id, binding_id",
  ).all().map((row) => ({ mapSpaceId: row.map_space_id, sceneNativeId: row.scene_native_id, scenePath: row.scene_path, frame: object(row.frame_json), domain: object(row.domain_json) }));
  const sceneSpawns = db.query<{ scene_native_id: number; detail_json: string }, []>("SELECT scene_native_id, detail_json FROM scene_spawns ORDER BY scene_native_id").all().map((row) => {
    const detail = object(row.detail_json), position = recordPosition(detail.position);
    if (!position) throw new Error(`Scene spawn ${row.scene_native_id} has no finite position.`);
    return { sceneNativeId: row.scene_native_id, position };
  });
  const patrolPaths = db.query<{ detail_json: string }, []>("SELECT detail_json FROM patrol_paths ORDER BY path_key").all().map((row) => parse(row.detail_json) as NormalizedPatrolPath);
  return { ...identity(db), records: { bindings, sceneSpawns, patrolPaths } };
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

export function queryCatalogFullEntity(db: Database, entityKey: string): CatalogQueryResult<EntityDetail | null> {
  const row = db.query<{ detail_json: string }, [string]>("SELECT detail_json FROM entity_details WHERE entity_key = ?").get(entityKey);
  return { ...identity(db), records: row ? parse(row.detail_json) as EntityDetail : null };
}

export function queryCatalogFullEntities(db: Database): CatalogQueryResult<EntityDetail[]> {
  const records = db.query<{ detail_json: string }, []>("SELECT detail_json FROM entity_details ORDER BY entity_key").all().map((row) => parse(row.detail_json) as EntityDetail);
  return { ...identity(db), records };
}

export function queryCatalogAllItemSources(db: Database): CatalogQueryResult<CatalogItemSource[]> {
  const records = db.query<{ item_entity_key: string; source_kind: string; source_key: string; placement_ids_json: string; condition_ids_json: string; context_json: string }, []>(
    "SELECT item_entity_key, source_kind, source_key, placement_ids_json, condition_ids_json, context_json FROM item_sources ORDER BY item_entity_key, source_kind, source_key",
  ).all().map((row) => ({ itemEntityKey: row.item_entity_key, sourceKind: row.source_kind, sourceKey: row.source_key, placementIds: textArray(row.placement_ids_json), conditionIds: textArray(row.condition_ids_json), context: parse(row.context_json) }));
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
  const catalog = identity(db);
  return { ...catalog, records: { unresolvedIssues, exclusions, occurrenceCount, accounting: readCoverageAccountingSummary(db, catalog.buildId) } };
}

export function queryCatalogDerivations(db: Database, factKind: string, factKey: string): CatalogQueryResult<CatalogDerivation | null> {
  const row = db.query<{ rule: string; version: number; inputs_json: string }, [string, string]>("SELECT rule, version, inputs_json FROM fact_derivations WHERE fact_kind = ? AND fact_key = ?").get(factKind, factKey);
  return { ...identity(db), records: row ? { factKind, factKey, rule: row.rule, version: row.version, inputs: JSON.parse(row.inputs_json) } : null };
}

function entityEndpointIndex(db: Database): Map<string, CatalogEndpoint> {
  return new Map(db.query<{ entity_key: string; name: string | null }, []>("SELECT entity_key, name FROM canonical_entities ORDER BY entity_key").all().map((row) => [row.entity_key, { entityKey: row.entity_key, label: row.name }]));
}
function endpoint(index: ReadonlyMap<string, CatalogEndpoint>, key: string | null, label: string | null): CatalogEndpoint {
  if (key !== null) return index.get(key) ?? { entityKey: null, label: label ?? key };
  return { entityKey: null, label: label ?? "Unknown" };
}
function endpointJson(index: ReadonlyMap<string, CatalogEndpoint>, value: unknown): CatalogEndpoint {
  if (value === null || typeof value !== "object") return { entityKey: null, label: "Unknown" };
  const key = "entityKey" in value && typeof value.entityKey === "string" ? value.entityKey : null;
  const label = "label" in value && typeof value.label === "string" ? value.label : key ?? "Unknown";
  return endpoint(index, key, label);
}
function nullableEndpointJson(index: ReadonlyMap<string, CatalogEndpoint>, value: unknown): CatalogEndpoint | null {
  return value === null ? null : endpointJson(index, value);
}
function placementIdsByNpc(db: Database): Map<string, string[]> {
  const result = new Map<string, string[]>();
  for (const row of db.query<{ npc_entity_key: string; placement_id: string }, []>("SELECT DISTINCT npc_entity_key, placement_id FROM placement_roles WHERE npc_entity_key IS NOT NULL ORDER BY npc_entity_key, placement_id").all()) { const values = result.get(row.npc_entity_key) ?? []; values.push(row.placement_id); result.set(row.npc_entity_key, values); }
  return result;
}

export function queryCatalogEntities(db: Database): CatalogQueryResult<CatalogEntityRow[]> {
  const artwork = new Map<string, CatalogEntityRow["artwork"]>();
  for (const row of db.query<{ entity_key: string; role: "icon" | "portrait" | "artwork"; asset_id: string; sha256: string; bytes: number; width: number; height: number; source_name: string }, []>(`
    SELECT b.entity_key, b.role, a.asset_id, a.sha256, a.bytes, a.width, a.height, a.source_name FROM artwork_bindings b JOIN artwork_assets a ON a.asset_id = b.asset_id ORDER BY b.entity_key, b.role, a.asset_id
  `).all()) { const values = artwork.get(row.entity_key) ?? []; values.push({ role: row.role, assetId: row.asset_id, sha256: row.sha256, bytes: row.bytes, width: row.width, height: row.height, sourceName: row.source_name }); artwork.set(row.entity_key, values); }
  const records = db.query<{ entity_key: string; kind: string; native_id: number; name: string | null; description: string | null; details_json: string }, []>("SELECT entity_key, kind, native_id, name, description, details_json FROM canonical_entities ORDER BY kind, native_id, entity_key").all().map((row) => {
    const details = object(row.details_json), icon = details.icon !== null && typeof details.icon === "object" && !Array.isArray(details.icon) ? details.icon as Record<string, unknown> : null;
    const iconAssetName = icon === null ? null : typeof icon.name === "string" ? icon.name : typeof icon.textureName === "string" ? icon.textureName : null;
    return { entityKey: row.entity_key, kind: row.kind, nativeId: row.native_id, name: row.name, description: row.description, iconAssetName, artwork: artwork.get(row.entity_key) ?? [] };
  });
  return { ...identity(db), records };
}

export function queryCatalogFacts(db: Database): CatalogQueryResult<CatalogFacts> {
  const refs = entityEndpointIndex(db);
  const itemStats = new Map<string, CatalogItemFacts["stats"]>(), itemRandomStats = new Map<string, CatalogItemFacts["randomStats"]>(), itemGemStats = new Map<string, CatalogStatValue[]>(), itemSockets = new Map<string, CatalogItemFacts["sockets"]>();
  for (const row of db.query<{ entity_key: string; stat_entity_key: string | null; stat_label: string; amount: number; is_percent: number }, []>("SELECT entity_key, stat_entity_key, stat_label, amount, is_percent FROM item_stats ORDER BY entity_key, stat_index").all()) { const values = itemStats.get(row.entity_key) ?? []; values.push({ stat: endpoint(refs, row.stat_entity_key, row.stat_label), amount: row.amount, isPercent: row.is_percent === 1 }); itemStats.set(row.entity_key, values); }
  for (const row of db.query<{ entity_key: string; stat_entity_key: string | null; stat_label: string; min_value: number; max_value: number; is_percent: number; whole: number; chance: number | null }, []>("SELECT entity_key, stat_entity_key, stat_label, min_value, max_value, is_percent, whole, chance FROM item_random_stats ORDER BY entity_key, stat_index").all()) { const values = itemRandomStats.get(row.entity_key) ?? []; values.push({ stat: endpoint(refs, row.stat_entity_key, row.stat_label), min: row.min_value, max: row.max_value, isPercent: row.is_percent === 1, whole: row.whole === 1, chance: row.chance }); itemRandomStats.set(row.entity_key, values); }
  for (const row of db.query<{ entity_key: string; stat_entity_key: string | null; stat_label: string; amount: number; is_percent: number }, []>("SELECT entity_key, stat_entity_key, stat_label, amount, is_percent FROM item_gem_stats ORDER BY entity_key, stat_index").all()) { const values = itemGemStats.get(row.entity_key) ?? []; values.push({ stat: endpoint(refs, row.stat_entity_key, row.stat_label), amount: row.amount, isPercent: row.is_percent === 1 }); itemGemStats.set(row.entity_key, values); }
  for (const row of db.query<{ entity_key: string; socket_type: string | null; gem_type: string | null }, []>("SELECT entity_key, socket_type, gem_type FROM item_sockets ORDER BY entity_key, socket_index").all()) { const values = itemSockets.get(row.entity_key) ?? []; values.push({ socketType: row.socket_type, gemType: row.gem_type }); itemSockets.set(row.entity_key, values); }
  const items = db.query<{ entity_key: string; rarity: string | null; item_type: string | null; armor_slot: string | null; weapon_slot: string | null; weapon_type: string | null; armor_type: string | null; attack_speed: number | null; min_damage: number | null; max_damage: number | null; random_stats_max: number; gem_type: string | null; enchantment_entity_key: string | null; enchantment_label: string | null; sell_price: number | null; sell_currency_entity_key: string | null; sell_currency_label: string | null; buy_price: number | null; buy_currency_entity_key: string | null; buy_currency_label: string | null; stack_limit: number; quest_drop_only: number; corruption_token: number; level_requirement: number | null; action_abilities_json: string; condition_ids_json: string }, []>("SELECT * FROM item_facts ORDER BY entity_key").all().map((row) => ({ entityKey: row.entity_key, rarity: row.rarity, itemType: row.item_type, armorSlot: row.armor_slot, weaponSlot: row.weapon_slot, weaponType: row.weapon_type, armorType: row.armor_type, attackSpeed: row.attack_speed, minDamage: row.min_damage, maxDamage: row.max_damage, stats: itemStats.get(row.entity_key) ?? [], randomStatsMax: row.random_stats_max, randomStats: itemRandomStats.get(row.entity_key) ?? [], sockets: itemSockets.get(row.entity_key) ?? [], gem: row.gem_type === null && !itemGemStats.has(row.entity_key) ? null : { gemType: row.gem_type, stats: itemGemStats.get(row.entity_key) ?? [] }, enchantment: row.enchantment_entity_key === null && row.enchantment_label === null ? null : endpoint(refs, row.enchantment_entity_key, row.enchantment_label), sellPrice: row.sell_price, sellCurrency: row.sell_currency_entity_key === null && row.sell_currency_label === null ? null : endpoint(refs, row.sell_currency_entity_key, row.sell_currency_label), buyPrice: row.buy_price, buyCurrency: row.buy_currency_entity_key === null && row.buy_currency_label === null ? null : endpoint(refs, row.buy_currency_entity_key, row.buy_currency_label), stackLimit: row.stack_limit, questDropOnly: row.quest_drop_only === 1, corruptionToken: row.corruption_token === 1, levelRequirement: row.level_requirement, actionAbilities: (parse(row.action_abilities_json) as unknown[]).map((value) => endpointJson(refs, value)), conditionIds: textArray(row.condition_ids_json) }));

  const npcStats = new Map<string, CatalogNpcFacts["stats"]>(), phases = new Map<string, CatalogNpcFacts["abilityPhases"]>(), rewards = new Map<string, CatalogNpcFacts["factionRewards"]>();
  const phaseAbilities = new Map<string, CatalogEndpoint[]>();
  for (const row of db.query<{ entity_key: string; phase_index: number; ability_entity_key: string | null; ability_label: string }, []>("SELECT entity_key, phase_index, ability_entity_key, ability_label FROM npc_phase_abilities ORDER BY entity_key, phase_index, ability_index").all()) { const key = `${row.entity_key}:${row.phase_index}`, values = phaseAbilities.get(key) ?? []; values.push(endpoint(refs, row.ability_entity_key, row.ability_label)); phaseAbilities.set(key, values); }
  for (const row of db.query<{ entity_key: string; phase_index: number; name: string | null; requirement: string | null }, []>("SELECT entity_key, phase_index, name, requirement FROM npc_ability_phases ORDER BY entity_key, phase_index").all()) { const values = phases.get(row.entity_key) ?? []; values.push({ phaseIndex: row.phase_index, name: row.name, requirement: row.requirement, abilities: phaseAbilities.get(`${row.entity_key}:${row.phase_index}`) ?? [] }); phases.set(row.entity_key, values); }
  for (const row of db.query<{ entity_key: string; stat_entity_key: string | null; stat_label: string; amount: number; is_percent: number }, []>("SELECT entity_key, stat_entity_key, stat_label, amount, is_percent FROM npc_stats ORDER BY entity_key, stat_index").all()) { const values = npcStats.get(row.entity_key) ?? []; values.push({ stat: endpoint(refs, row.stat_entity_key, row.stat_label), amount: row.amount, isPercent: row.is_percent === 1 }); npcStats.set(row.entity_key, values); }
  for (const row of db.query<{ entity_key: string; faction_entity_key: string | null; faction_label: string; amount: number }, []>("SELECT entity_key, faction_entity_key, faction_label, amount FROM npc_faction_rewards ORDER BY entity_key, reward_index").all()) { const values = rewards.get(row.entity_key) ?? []; values.push({ faction: endpoint(refs, row.faction_entity_key, row.faction_label), amount: row.amount }); rewards.set(row.entity_key, values); }
  const npcs = db.query<Record<string, string | number | null>, []>("SELECT * FROM npc_facts ORDER BY entity_key").all().map((row) => { const specialization = row.loot_specialization_json === null ? null : object(String(row.loot_specialization_json)); return { entityKey: String(row.entity_key), minLevel: row.min_level as number | null, maxLevel: row.max_level as number | null, scalesWithPlayer: row.scales_with_player === 1, npcType: row.npc_type as string | null, creatureType: row.creature_type as string | null, family: row.family as string | null, faction: row.faction_entity_key === null && row.faction_label === null ? null : endpoint(refs, row.faction_entity_key as string | null, row.faction_label as string | null), species: row.species_entity_key === null && row.species_label === null ? null : endpoint(refs, row.species_entity_key as string | null, row.species_label as string | null), isMerchant: row.is_merchant === 1, isQuestGiver: row.is_quest_giver === 1, isCombatEnabled: row.is_combat_enabled === 1, minRespawn: row.min_respawn as number | null, maxRespawn: row.max_respawn as number | null, minExperience: row.min_experience as number | null, maxExperience: row.max_experience as number | null, immuneToStun: row.immune_to_stun === 1, immuneToSlow: row.immune_to_slow === 1, aggroRange: row.aggro_range as number | null, stats: npcStats.get(String(row.entity_key)) ?? [], abilityPhases: phases.get(String(row.entity_key)) ?? [], factionRewards: rewards.get(String(row.entity_key)) ?? [], linkedNpc: row.linked_npc_entity_key === null && row.linked_npc_label === null ? null : endpoint(refs, row.linked_npc_entity_key as string | null, row.linked_npc_label as string | null), lootSpecialization: specialization === null ? null : { armorType: typeof specialization.armorType === "string" ? specialization.armorType : null, weaponTypes: Array.isArray(specialization.weaponTypes) ? specialization.weaponTypes.filter((value): value is string => typeof value === "string") : [], stat: nullableEndpointJson(refs, specialization.stat) } }; });
  const tasks = db.query<{ entity_key: string; task_type: string; target_entity_key: string | null; target_label: string | null; count: number | null; keep_items: number | null; scene_name: string | null }, []>("SELECT entity_key, task_type, target_entity_key, target_label, count, keep_items, scene_name FROM task_facts ORDER BY entity_key").all().map((row) => ({ entityKey: row.entity_key, taskType: row.task_type, target: row.target_entity_key === null && row.target_label === null ? null : endpoint(refs, row.target_entity_key, row.target_label), count: row.count, keepItems: row.keep_items === null ? null : row.keep_items === 1, sceneName: row.scene_name }));
  const quests = db.query<{ entity_key: string; chain_name: string | null; chain_order: number | null; repeatable: number; turn_in_without_npc: number; completed_description: string | null; objective_text: string | null; level_requirement: number | null; experience: number | null; condition_ids_json: string }, []>("SELECT entity_key, chain_name, chain_order, repeatable, turn_in_without_npc, completed_description, objective_text, level_requirement, experience, condition_ids_json FROM quest_facts ORDER BY entity_key").all().map((row) => ({ entityKey: row.entity_key, chainName: row.chain_name, chainOrder: row.chain_order, repeatable: row.repeatable === 1, turnInWithoutNpc: row.turn_in_without_npc === 1, completedDescription: row.completed_description, objectiveText: row.objective_text, levelRequirement: row.level_requirement, experience: row.experience, conditionIds: textArray(row.condition_ids_json) }));
  const places = db.query<{ entity_key: string; place_type: CatalogPlaceFacts["placeType"]; guide_included: number; guide_description: string | null; level_min: number | null; level_max: number | null; map_space_ids_json: string; bosses_json: string; parent_scene_key: string | null }, []>("SELECT entity_key, place_type, guide_included, guide_description, level_min, level_max, map_space_ids_json, bosses_json, parent_scene_key FROM place_facts ORDER BY entity_key").all().map((row) => ({ entityKey: row.entity_key, placeType: row.place_type, guideIncluded: row.guide_included === 1, guideDescription: row.guide_description, levelRange: row.level_min === null || row.level_max === null ? null : { min: row.level_min, max: row.level_max }, mapSpaceIds: textArray(row.map_space_ids_json), bosses: (parse(row.bosses_json) as unknown[]).map((value) => endpointJson(refs, value)), parentSceneKey: row.parent_scene_key }));
  const properties = db.query<{ entity_key: string; income: number | null; purchase_price: number | null; sell_price: number | null; currency_entity_key: string | null; currency_label: string | null; property_type: string | null }, []>("SELECT entity_key, income, purchase_price, sell_price, currency_entity_key, currency_label, property_type FROM property_facts ORDER BY entity_key").all().map((row) => ({ entityKey: row.entity_key, income: row.income, purchasePrice: row.purchase_price, sellPrice: row.sell_price, currency: row.currency_entity_key === null && row.currency_label === null ? null : endpoint(refs, row.currency_entity_key, row.currency_label), propertyType: row.property_type }));
  const abilities = db.query<{ entity_key: string }, []>("SELECT entity_key FROM ability_facts ORDER BY entity_key").all().map((row) => ({ entityKey: row.entity_key }));
  const ranks = new Map<string, CatalogRecipeFacts["ranks"]>();
  const products = new Map<string, CatalogRecipeFacts["ranks"][number]["products"]>(), materials = new Map<string, CatalogRecipeFacts["ranks"][number]["materials"]>();
  for (const row of db.query<{ entity_key: string; rank: number; item_entity_key: string | null; item_label: string; count: number; chance: number }, []>("SELECT entity_key, rank, item_entity_key, item_label, count, chance FROM recipe_products ORDER BY entity_key, rank, product_index").all()) { const key = `${row.entity_key}:${row.rank}`, values = products.get(key) ?? []; values.push({ item: endpoint(refs, row.item_entity_key, row.item_label), count: row.count, chance: row.chance }); products.set(key, values); }
  for (const row of db.query<{ entity_key: string; rank: number; item_entity_key: string | null; item_label: string; count: number }, []>("SELECT entity_key, rank, item_entity_key, item_label, count FROM recipe_materials ORDER BY entity_key, rank, material_index").all()) { const key = `${row.entity_key}:${row.rank}`, values = materials.get(key) ?? []; values.push({ item: endpoint(refs, row.item_entity_key, row.item_label), count: row.count }); materials.set(key, values); }
  for (const row of db.query<{ entity_key: string; rank: number; unlock_cost: number; experience: number; craft_time: number }, []>("SELECT entity_key, rank, unlock_cost, experience, craft_time FROM recipe_ranks ORDER BY entity_key, rank").all()) { const values = ranks.get(row.entity_key) ?? []; values.push({ rank: row.rank, unlockCost: row.unlock_cost, experience: row.experience, craftTime: row.craft_time, products: products.get(`${row.entity_key}:${row.rank}`) ?? [], materials: materials.get(`${row.entity_key}:${row.rank}`) ?? [] }); ranks.set(row.entity_key, values); }
  const recipes = db.query<{ entity_key: string; skill_entity_key: string | null; skill_label: string | null; station_entity_key: string | null; station_label: string | null; learned_by_default: number }, []>("SELECT entity_key, skill_entity_key, skill_label, station_entity_key, station_label, learned_by_default FROM recipe_facts ORDER BY entity_key").all().map((row) => ({ entityKey: row.entity_key, skill: row.skill_entity_key === null && row.skill_label === null ? null : endpoint(refs, row.skill_entity_key, row.skill_label), station: row.station_entity_key === null && row.station_label === null ? null : endpoint(refs, row.station_entity_key, row.station_label), learnedByDefault: row.learned_by_default === 1, ranks: ranks.get(row.entity_key) ?? [] }));
  return { ...identity(db), records: { entities: queryCatalogEntities(db).records, items, npcs, quests, tasks, places, properties, abilities, recipes } };
}

export function queryDropRows(db: Database): CatalogQueryResult<CatalogDropRow[]> {
  const refs = entityEndpointIndex(db), placements = placementIdsByNpc(db), records: CatalogDropRow[] = [];
  for (const row of db.query<{ context: "npc" | "world"; owner_entity_key: string | null; loot_table_id: number; entry_index: number; item_entity_key: string; min_count: number; max_count: number; raw_rate: number | null; condition_id: string | null; payload_json: string }, []>(`
    SELECT b.context, b.owner_entity_key, b.loot_table_id, e.entry_index, e.item_entity_key, e.min_count, e.max_count, e.raw_rate, b.condition_id, b.payload_json FROM loot_bindings b JOIN loot_entries e ON e.build_id = b.build_id AND e.loot_table_id = b.loot_table_id ORDER BY b.context, COALESCE(b.owner_entity_key, ''), b.binding_index, e.entry_index
  `).all()) { const payload = object(row.payload_json), minimum = typeof payload.minimumNPCLevel === "number" ? payload.minimumNPCLevel : null, maximum = typeof payload.maximumNPCLevel === "number" ? payload.maximumNPCLevel : null; records.push({ context: row.context, owner: row.owner_entity_key === null ? { entityKey: null, label: "World loot" } : endpoint(refs, row.owner_entity_key, row.owner_entity_key), item: endpoint(refs, row.item_entity_key, row.item_entity_key), lootTableId: row.loot_table_id, entryIndex: row.entry_index, min: row.min_count, max: row.max_count, rawRate: row.raw_rate, displayedChance: row.context === "npc" && row.raw_rate !== null ? Math.round(row.raw_rate * 10) / 10 : null, levelBand: minimum === null || maximum === null ? null : { min: minimum, max: maximum }, conditionIds: row.condition_id === null ? [] : [row.condition_id], placementIds: row.owner_entity_key === null ? [] : placements.get(row.owner_entity_key) ?? [] }); }
  for (const row of db.query<{ item_entity_key: string; source_key: string; placement_ids_json: string; condition_ids_json: string; context_json: string }, []>("SELECT item_entity_key, source_key, placement_ids_json, condition_ids_json, context_json FROM item_sources WHERE source_kind = 'container' ORDER BY item_entity_key, source_key").all()) { const context = object(row.context_json), placementIds = textArray(row.placement_ids_json), placement = placementIds.length === 0 ? null : db.query<{ label: string | null }, [string]>("SELECT label FROM placements WHERE placement_id = ?").get(placementIds[0]!), label = placement?.label ?? `Container ${row.source_key.slice(0, 8)}`; records.push({ context: "container", owner: { entityKey: null, label }, item: endpoint(refs, row.item_entity_key, row.item_entity_key), lootTableId: null, entryIndex: null, min: typeof context.min === "number" ? context.min : null, max: typeof context.max === "number" ? context.max : null, rawRate: typeof context.rawRate === "number" ? context.rawRate : null, displayedChance: null, levelBand: null, conditionIds: textArray(row.condition_ids_json), placementIds }); }
  return { ...identity(db), records };
}

export function queryVendorRows(db: Database): CatalogQueryResult<CatalogVendorRow[]> {
  const refs = entityEndpointIndex(db), placements = placementIdsByNpc(db);
  const records = db.query<{ owner_entity_key: string; item_entity_key: string; currency_entity_key: string | null; cost: number; merchant_table_id: number; stock_index: number; binding_condition: string | null }, []>(`
    SELECT b.owner_entity_key, s.item_entity_key, s.currency_entity_key, s.cost, s.merchant_table_id, s.stock_index, b.condition_id AS binding_condition FROM merchant_bindings b JOIN merchant_stock s ON s.build_id = b.build_id AND s.merchant_table_id = b.merchant_table_id ORDER BY b.owner_entity_key, s.merchant_table_id, s.stock_index, b.binding_index
  `).all().map((row) => ({ npc: endpoint(refs, row.owner_entity_key, row.owner_entity_key), item: endpoint(refs, row.item_entity_key, row.item_entity_key), currency: row.currency_entity_key === null ? null : endpoint(refs, row.currency_entity_key, row.currency_entity_key), cost: row.cost, merchantTableId: row.merchant_table_id, stockIndex: row.stock_index, conditionIds: row.binding_condition === null ? [] : [row.binding_condition], placementIds: placements.get(row.owner_entity_key) ?? [] }));
  return { ...identity(db), records };
}

export function queryGatherRows(db: Database): CatalogQueryResult<CatalogGatherRow[]> {
  const refs = entityEndpointIndex(db), records: CatalogGatherRow[] = [];
  for (const row of db.query<{ yield_id: string; source_id: string | null; resource_entity_key: string | null; item_entity_key: string | null; rank: number | null; min_count: number | null; max_count: number | null; payload_json: string }, []>("SELECT yield_id, source_id, resource_entity_key, item_entity_key, rank, min_count, max_count, payload_json FROM resource_yields WHERE item_entity_key IS NOT NULL ORDER BY yield_id").all()) {
    const source = row.source_id === null ? null : db.query<{ placement_id: string; scene_native_id: number; label: string | null }, [string]>("SELECT p.placement_id, p.scene_native_id, p.label FROM placement_sources ps JOIN placements p ON p.placement_id = ps.placement_id WHERE ps.source_id = ? ORDER BY p.placement_id LIMIT 1").get(row.source_id), payload = object(row.payload_json);
    const skillId = typeof payload.gatheringSkillId === "number" ? payload.gatheringSkillId : null, skill = skillId === null ? null : endpoint(refs, `skills:${skillId}`, `Skill ${skillId}`);
    records.push({ producerLabel: source?.label ?? (row.resource_entity_key === null ? "Resource" : refs.get(row.resource_entity_key)?.label ?? row.resource_entity_key), sourceId: row.source_id, sceneNativeId: source?.scene_native_id ?? null, resource: row.resource_entity_key === null ? null : endpoint(refs, row.resource_entity_key, row.resource_entity_key), item: endpoint(refs, row.item_entity_key, row.item_entity_key), skill, rank: row.rank, min: row.min_count, max: row.max_count, rawRate: typeof payload.rawRate === "number" ? payload.rawRate : null, conditionIds: [], placementIds: source ? [source.placement_id] : [] });
  }
  return { ...identity(db), records };
}

export function queryContainerRows(db: Database): CatalogQueryResult<CatalogContainerRow[]> {
  const refs = entityEndpointIndex(db), records: CatalogContainerRow[] = [];
  for (const row of db.query<{ item_entity_key: string; source_key: string; placement_ids_json: string; condition_ids_json: string; context_json: string }, []>("SELECT item_entity_key, source_key, placement_ids_json, condition_ids_json, context_json FROM item_sources WHERE source_kind = 'container' ORDER BY item_entity_key, source_key").all()) { const placementIds = textArray(row.placement_ids_json), context = object(row.context_json), placement = placementIds.length === 0 ? null : db.query<{ scene_native_id: number; label: string | null }, [string]>("SELECT scene_native_id, label FROM placements WHERE placement_id = ?").get(placementIds[0]!); records.push({ containerLabel: placement?.label ?? `Container ${row.source_key.slice(0, 8)}`, sourceId: row.source_key, sceneNativeId: placement?.scene_native_id ?? null, item: endpoint(refs, row.item_entity_key, row.item_entity_key), min: typeof context.min === "number" ? context.min : null, max: typeof context.max === "number" ? context.max : null, rawRate: typeof context.rawRate === "number" ? context.rawRate : null, conditionIds: textArray(row.condition_ids_json), placementIds }); }
  return { ...identity(db), records };
}

export function queryQuestRows(db: Database): CatalogQueryResult<CatalogQuestRow[]> {
  const refs = entityEndpointIndex(db), placements = placementIdsByNpc(db), tasks = new Map(queryCatalogFacts(db).records.tasks.map((row) => [row.entityKey, row]));
  const records = db.query<{ association_id: string; association_kind: string; owner_entity_key: string | null; quest_entity_key: string | null; task_entity_key: string | null; item_entity_key: string | null; payload_json: string }, []>("SELECT association_id, association_kind, owner_entity_key, quest_entity_key, task_entity_key, item_entity_key, payload_json FROM quest_associations WHERE quest_entity_key IS NOT NULL ORDER BY quest_entity_key, association_kind, association_id").all().map((row) => { const payload = object(row.payload_json), association = typeof payload.association === "string" ? payload.association : "", rewardSource = typeof payload.rewardSource === "string" ? payload.rewardSource : "", kind: CatalogQuestRow["kind"] = row.association_kind === "npc-quest" ? (association === "completed" ? "turnIn" : "giver") : row.association_kind === "quest-objective" ? "objective" : row.association_kind === "quest-item-given" ? "itemGiven" : row.association_kind === "world-quest-zone" ? "worldZone" : rewardSource === "rewardsToPick" ? "rewardChoice" : "reward"; const counterpartKey = row.owner_entity_key ?? row.task_entity_key ?? row.item_entity_key, counterpart = counterpartKey === null ? null : endpoint(refs, counterpartKey, counterpartKey), indexValue = typeof payload.objectiveIndex === "number" ? payload.objectiveIndex : typeof payload.rewardIndex === "number" ? payload.rewardIndex : typeof payload.itemIndex === "number" ? payload.itemIndex : typeof payload.associationIndex === "number" ? payload.associationIndex : 0; return { associationId: row.association_id, quest: endpoint(refs, row.quest_entity_key, row.quest_entity_key), kind, index: indexValue, counterpart, task: row.task_entity_key === null ? null : tasks.get(row.task_entity_key) ?? null, count: typeof payload.count === "number" ? payload.count : null, experience: typeof payload.Experience === "number" ? payload.Experience : typeof payload.experience === "number" ? payload.experience : null, placementIds: row.owner_entity_key === null ? [] : placements.get(row.owner_entity_key) ?? [] }; });
  return { ...identity(db), records };
}

export function queryRecipeRows(db: Database): CatalogQueryResult<CatalogRecipeRow[]> {
  const refs = entityEndpointIndex(db), records: CatalogRecipeRow[] = [];
  for (const row of db.query<{ entity_key: string; rank: number; item_entity_key: string | null; item_label: string; count: number; chance: number }, []>("SELECT entity_key, rank, item_entity_key, item_label, count, chance FROM recipe_products ORDER BY entity_key, rank, product_index").all()) records.push({ recipe: endpoint(refs, row.entity_key, row.entity_key), item: endpoint(refs, row.item_entity_key, row.item_label), role: "product", rank: row.rank, count: row.count, chance: row.chance });
  for (const row of db.query<{ entity_key: string; rank: number; item_entity_key: string | null; item_label: string; count: number }, []>("SELECT entity_key, rank, item_entity_key, item_label, count FROM recipe_materials ORDER BY entity_key, rank, material_index").all()) records.push({ recipe: endpoint(refs, row.entity_key, row.entity_key), item: endpoint(refs, row.item_entity_key, row.item_label), role: "material", rank: row.rank, count: row.count, chance: null });
  return { ...identity(db), records };
}

export function queryContainment(db: Database): CatalogQueryResult<CatalogPlacementRow[]> {
  const roles = new Map<string, CatalogPlacementRow["roles"]>(), families = new Map<string, Set<string>>();
  for (const row of db.query<{ placement_id: string; role: string; npc_entity_key: string | null; scope: string }, []>("SELECT placement_id, role, npc_entity_key, scope FROM placement_roles ORDER BY placement_id, role, scope, COALESCE(npc_entity_key, '')").all()) { const values = roles.get(row.placement_id) ?? []; values.push({ role: row.role, npcEntityKey: row.npc_entity_key, scope: row.scope }); roles.set(row.placement_id, values); }
  for (const row of db.query<{ placement_id: string; families_json: string }, []>("SELECT placement_id, families_json FROM placement_sources ORDER BY placement_id, source_id").all()) { const values = families.get(row.placement_id) ?? new Set<string>(); for (const family of textArray(row.families_json)) values.add(family); families.set(row.placement_id, values); }
  const records = db.query<{ placement_id: string; scene_native_id: number; map_space_id: string | null; label: string | null }, []>("SELECT placement_id, scene_native_id, map_space_id, label FROM placements ORDER BY placement_id").all().map((row) => ({ placementId: row.placement_id, sceneNativeId: row.scene_native_id, sceneKey: `scenes:${row.scene_native_id}`, mapSpaceId: row.map_space_id, label: row.label, roles: roles.get(row.placement_id) ?? [], families: [...families.get(row.placement_id) ?? []].sort() }));
  return { ...identity(db), records };
}

export function queryTransitions(db: Database): CatalogQueryResult<CatalogTransitionRow[]> {
  const records = db.query<{ transition_id: string; source_scene_native_id: number | null; destination_scene_entity_key: string | null; transition_kind: string; source_id: string | null }, []>("SELECT transition_id, source_scene_native_id, destination_scene_entity_key, transition_kind, source_id FROM transitions ORDER BY transition_id").all().map((row) => ({ transitionId: row.transition_id, sourceSceneKey: row.source_scene_native_id === null ? null : `scenes:${row.source_scene_native_id}`, destinationSceneKey: row.destination_scene_entity_key, transitionKind: row.transition_kind, placementIds: row.source_id === null ? [] : db.query<{ placement_id: string }, [string]>("SELECT placement_id FROM placement_sources WHERE source_id = ? ORDER BY placement_id").all(row.source_id).map((placement) => placement.placement_id) }));
  return { ...identity(db), records };
}

const requirementTargetKinds: Readonly<Record<string, string>> = { abilityID: "abilities", bonusID: "bonuses", recipeID: "recipes", resourceID: "resources", effectID: "effects", NPCID: "npcs", statID: "stats", factionID: "factions", raceID: "races", classID: "classes", speciesID: "species", itemID: "items", currencyID: "currencies", talentTreeID: "talentTrees", skillID: "skills", enchantmentID: "enchantments", gearSetID: "gearSets", gameSceneID: "scenes", questID: "quests" };
function conditionRequirements(refs: ReadonlyMap<string, CatalogEndpoint>, payload: unknown): CatalogRequirement[] {
  if (payload === null || typeof payload !== "object") return [];
  const root = payload as Record<string, unknown>, groups = Array.isArray(root.groups) ? root.groups : Array.isArray(root.requirements) ? [{ requirements: root.requirements }] : [];
  const result: CatalogRequirement[] = [];
  for (const groupValue of groups) {
    if (groupValue === null || typeof groupValue !== "object") continue;
    const group = groupValue as Record<string, unknown>, requirements = Array.isArray(group.requirements) ? group.requirements : [];
    for (const requirementValue of requirements) {
      if (requirementValue === null || typeof requirementValue !== "object") continue;
      const requirement = requirementValue as Record<string, unknown>, type = typeof requirement.requirementType === "string" ? requirement.requirementType : "requirement";
      let target: CatalogEndpoint | null = null;
      for (const [field, kind] of Object.entries(requirementTargetKinds)) if (typeof requirement[field] === "number") { const nativeId = requirement[field] as number; target = nativeId < 0 ? { entityKey: null, label: `${kind} ${nativeId}` } : endpoint(refs, `${kind}:${nativeId}`, `${kind} ${nativeId}`); break; }
      const amount = typeof requirement.amount1 === "number" ? requirement.amount1 : typeof requirement.float1 === "number" ? requirement.float1 : null, secondaryAmount = typeof requirement.amount2 === "number" ? requirement.amount2 : null;
      const mandatory = group.checkCount !== true || typeof group.requiredCount !== "number" || group.requiredCount >= requirements.length;
      result.push({ type, mandatory, target, amount, secondaryAmount, label: [type, amount, target?.label].filter((value) => value !== null && value !== undefined && value !== "").join(" ") });
    }
  }
  return result;
}

export function queryConditions(db: Database): CatalogQueryResult<CatalogCondition[]> {
  const refs = entityEndpointIndex(db);
  const records = db.query<{ condition_id: string; semantics: string; payload_json: string }, []>("SELECT condition_id, semantics, payload_json FROM conditions ORDER BY condition_id").all().map((row) => { const payload = parse(row.payload_json), requirements = conditionRequirements(refs, payload), sourceName = payload !== null && typeof payload === "object" && "sourceName" in payload && typeof payload.sourceName === "string" && payload.sourceName.length > 0 ? payload.sourceName : null; return { conditionId: row.condition_id, semantics: row.semantics, label: sourceName ?? (requirements.map((requirement) => requirement.label).join(" and ") || row.semantics), requirements }; });
  return { ...identity(db), records };
}

export function queryCatalogRelations(db: Database): CatalogQueryResult<CatalogRelations> {
  return { ...identity(db), records: { drops: queryDropRows(db).records, vendors: queryVendorRows(db).records, gathers: queryGatherRows(db).records, containers: queryContainerRows(db).records, quests: queryQuestRows(db).records, recipes: queryRecipeRows(db).records, placements: queryContainment(db).records, transitions: queryTransitions(db).records, conditions: queryConditions(db).records } };
}
