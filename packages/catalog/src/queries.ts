import type { Database } from "bun:sqlite";
import type { EntityDetail, NormalizedPatrolPath, CatalogDerivation, CatalogEndpoint, CatalogEntityRow, CatalogFacts, CatalogItemFacts, CatalogStatValue, CatalogNpcFacts, CatalogNpcAdventurer, CatalogNpcFlightNetwork, NormalizedNpcAdventurer, NormalizedNpcFlightNetwork, CatalogTaskFacts, CatalogQuestFacts, CatalogPlaceFacts, CatalogPropertyFacts, CatalogAbilityFacts, CatalogRecipeFacts, CatalogGearSetFacts, CatalogDropRow, CatalogVendorRow, CatalogGatherRow, CatalogContainerRow, CatalogInteractionRow, CatalogGatedSourceRow, CatalogAvailabilityRule, CatalogQuestRow, CatalogRecipeRow, CatalogPlacementRow, CatalogTransitionRow, CatalogCondition, CatalogRequirement, CatalogRequirementSpan, CatalogRequirementGroup, CatalogRequirementNamedValue, CatalogRequirementEntry, CatalogRequirementTime, CatalogRelations } from "@afallon/contracts/catalog";
import type { CatalogRandomChoice } from "@afallon/contracts/catalog";
import { readCoverageAccountingSummary, type CoverageAccountingSummary } from "./coverage-accounting";
import { containerTypeFromHierarchyPath } from "./world";

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
  randomChoices: ReadonlyArray<CatalogRandomChoice>;
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

// The random choices that can disable each placement, from the outermost to the innermost. A choice whose target is an
// ancestor of another choice's target has the shorter target path, so the target path length orders the nesting.
function randomChoicesByPlacement(db: Database, mapSpaceId: string | null = null): Map<string, ReadonlyArray<CatalogRandomChoice>> {
  const rows = db.query<{ placement_id: string; choice_id: string; number_to_enable: number; entry_count: number; option_count: number; entry_index: number; depth: number }, [string | null, string | null]>(`
    SELECT DISTINCT ps.placement_id, c.choice_id, c.number_to_enable, c.entry_count, e.entry_index, length(e.target_path) AS depth,
      (SELECT COUNT(DISTINCT COALESCE(o.target_path, 'entry ' || o.entry_index)) FROM random_choice_entries o WHERE o.choice_id = c.choice_id) AS option_count
    FROM random_choice_entries e
    JOIN random_choices c ON c.choice_id = e.choice_id
    JOIN json_each(e.source_ids_json) s
    JOIN placement_sources ps ON ps.source_id = s.value
    JOIN placements p ON p.placement_id = ps.placement_id
    WHERE ? IS NULL OR p.map_space_id = ?
    ORDER BY ps.placement_id, c.choice_id, e.entry_index
  `).all(mapSpaceId, mapSpaceId);
  const grouped = new Map<string, Map<string, { entryCount: number; optionCount: number; numberToEnable: number; entryIndexes: number[]; depth: number }>>();
  for (const row of rows) {
    const choices = grouped.get(row.placement_id) ?? new Map();
    const choice = choices.get(row.choice_id) ?? { entryCount: row.entry_count, optionCount: row.option_count, numberToEnable: row.number_to_enable, entryIndexes: [], depth: row.depth };
    if (!choice.entryIndexes.includes(row.entry_index)) choice.entryIndexes.push(row.entry_index);
    choice.depth = Math.min(choice.depth, row.depth);
    choices.set(row.choice_id, choice);
    grouped.set(row.placement_id, choices);
  }
  const result = new Map<string, ReadonlyArray<CatalogRandomChoice>>();
  for (const [placementId, choices] of grouped) {
    result.set(placementId, [...choices].sort(([idA, a], [idB, b]) => a.depth - b.depth || idA.localeCompare(idB)).map(([choiceId, choice]) => ({
      // RandomActivator.Start clamps numberToEnable into 0..entries. An entry without a known target is its own option.
      choiceId, entries: choice.entryCount, options: choice.optionCount, enabled: Math.max(0, Math.min(choice.numberToEnable, choice.entryCount)),
      entryIndexes: [...choice.entryIndexes].sort((left, right) => left - right),
    })));
  }
  return result;
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
  const randomChoices = randomChoicesByPlacement(db, mapSpaceId);
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
  ).all(mapSpaceId).map((row) => ({ placementId: row.placement_id, sceneNativeId: row.scene_native_id, scenePath: row.scene_path, mapSpaceId: row.map_space_id, worldPosition: { x: row.world_x, y: row.world_y, z: row.world_z }, position: [row.map_x, row.map_y] as [number, number], height: row.world_y, label: row.label, shape: row.shape_json === null ? null : parse(row.shape_json), roles: rolesByPlacement.get(row.placement_id) ?? [], itemEntityKeys: itemsByPlacement.get(row.placement_id) ?? [], sourceDetails: sourceDetailsByPlacement.get(row.placement_id) ?? [], randomChoices: randomChoices.get(row.placement_id) ?? [] }));
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
function npcAdventurer(index: ReadonlyMap<string, CatalogEndpoint>, value: string | number | null | undefined): CatalogNpcAdventurer | null {
  if (value == null) return null;
  const row = parse(String(value)) as NormalizedNpcAdventurer;
  return {
    class: nullableEndpointJson(index, row.class), race: nullableEndpointJson(index, row.race), preferredTree: nullableEndpointJson(index, row.preferredTree), keepPhaseAbilities: row.keepPhaseAbilities, aiLogicTemplateKey: row.aiLogicTemplateKey,
    specialization: row.specialization === null ? null : { class: nullableEndpointJson(index, row.specialization.class), role: row.specialization.role, preferredTree: nullableEndpointJson(index, row.specialization.preferredTree), behaviorName: row.specialization.behaviorName, priorityAbilities: row.specialization.priorityAbilities.map((entry) => endpointJson(index, entry)), blockedAbilities: row.specialization.blockedAbilities.map((entry) => endpointJson(index, entry)), blockedBonuses: row.specialization.blockedBonuses, allowedForms: row.specialization.allowedForms },
  };
}
function npcFlightNetwork(index: ReadonlyMap<string, CatalogEndpoint>, value: string | number | null | undefined): CatalogNpcFlightNetwork | null {
  if (value == null) return null;
  const row = parse(String(value)) as NormalizedNpcFlightNetwork;
  return { ...row, currency: nullableEndpointJson(index, row.currency) };
}
function placementIdsByNpc(db: Database): Map<string, string[]> {
  const result = new Map<string, string[]>();
  for (const row of db.query<{ npc_entity_key: string; placement_id: string }, []>("SELECT DISTINCT npc_entity_key, placement_id FROM placement_roles WHERE npc_entity_key IS NOT NULL ORDER BY npc_entity_key, placement_id").all()) { const values = result.get(row.npc_entity_key) ?? []; values.push(row.placement_id); result.set(row.npc_entity_key, values); }
  return result;
}

function sourcePlacements(db: Database): Map<string, string[]> {
  const result = new Map<string, string[]>();
  for (const row of db.query<{ source_id: string; placement_id: string }, []>("SELECT source_id, placement_id FROM placement_sources ORDER BY source_id, placement_id").all()) {
    const values = result.get(row.source_id) ?? []; values.push(row.placement_id); result.set(row.source_id, values);
  }
  return result;
}

function availabilityBySource(db: Database): Map<string, CatalogAvailabilityRule[]> {
  const result = new Map<string, CatalogAvailabilityRule[]>();
  for (const row of db.query<{ source_id: string; effect: CatalogAvailabilityRule["effect"]; condition_id: string; duration_seconds: number | null }, []>("SELECT source_id, effect, condition_id, duration_seconds FROM source_gates ORDER BY source_id, effect, condition_id, via_source_id, gate_id").all()) {
    const values = result.get(row.source_id) ?? [];
    if (!values.some((value) => value.effect === row.effect && value.conditionId === row.condition_id && value.durationSeconds === row.duration_seconds)) values.push({ effect: row.effect, conditionId: row.condition_id, durationSeconds: row.duration_seconds });
    result.set(row.source_id, values);
  }
  return result;
}

// A world item source is available under its own requirement conditions and its world source's gates; each
// meaning appears once.
function itemSourceAvailability(conditionIds: readonly string[], gates: readonly CatalogAvailabilityRule[]): CatalogAvailabilityRule[] {
  const own = conditionIds.map((conditionId): CatalogAvailabilityRule => ({ effect: "requires", conditionId, durationSeconds: null }));
  return [...new Map([...own, ...gates].map((rule) => [`${rule.effect}:${rule.conditionId}:${rule.durationSeconds}`, rule])).values()]
    .sort((a, b) => a.effect.localeCompare(b.effect) || a.conditionId.localeCompare(b.conditionId));
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
  const conditionById = new Map(queryConditions(db).records.map((condition) => [condition.conditionId, condition]));
  // Gear sets come first: an item's own facts name the set that lists it, so the relation reads
  // from both ends without a second source.
  const gearSetMembers = new Map<string, CatalogEndpoint[]>(), gearSetByItem = new Map<string, CatalogEndpoint>();
  for (const row of db.query<{ entity_key: string; item_entity_key: string | null; item_label: string }, []>("SELECT entity_key, item_entity_key, item_label FROM gear_set_members ORDER BY entity_key, member_index").all()) {
    const values = gearSetMembers.get(row.entity_key) ?? [];
    values.push(endpoint(refs, row.item_entity_key, row.item_label));
    gearSetMembers.set(row.entity_key, values);
    if (row.item_entity_key !== null && !gearSetByItem.has(row.item_entity_key)) gearSetByItem.set(row.item_entity_key, endpoint(refs, row.entity_key, row.entity_key));
  }
  const gearSetTierStats = new Map<string, CatalogStatValue[]>(), gearSetTiers = new Map<string, CatalogGearSetFacts["tiers"]>();
  for (const row of db.query<{ entity_key: string; tier_index: number; stat_entity_key: string | null; stat_label: string; amount: number; is_percent: number }, []>("SELECT entity_key, tier_index, stat_entity_key, stat_label, amount, is_percent FROM gear_set_tier_stats ORDER BY entity_key, tier_index, stat_index").all()) { const key = `${row.entity_key}:${row.tier_index}`, values = gearSetTierStats.get(key) ?? []; values.push({ stat: endpoint(refs, row.stat_entity_key, row.stat_label), amount: row.amount, isPercent: row.is_percent === 1 }); gearSetTierStats.set(key, values); }
  for (const row of db.query<{ entity_key: string; tier_index: number; equipped: number }, []>("SELECT entity_key, tier_index, equipped FROM gear_set_tiers ORDER BY entity_key, tier_index").all()) { const values = gearSetTiers.get(row.entity_key) ?? []; values.push({ equipped: row.equipped, stats: gearSetTierStats.get(`${row.entity_key}:${row.tier_index}`) ?? [] }); gearSetTiers.set(row.entity_key, values); }
  const gearSets = db.query<{ entity_key: string }, []>("SELECT entity_key FROM gear_set_facts ORDER BY entity_key").all().map((row) => ({ entityKey: row.entity_key, members: gearSetMembers.get(row.entity_key) ?? [], tiers: gearSetTiers.get(row.entity_key) ?? [] }));

  const itemStats = new Map<string, CatalogItemFacts["stats"]>(), itemRandomStats = new Map<string, CatalogItemFacts["randomStats"]>(), itemGemStats = new Map<string, CatalogStatValue[]>(), itemSockets = new Map<string, CatalogItemFacts["sockets"]>();
  for (const row of db.query<{ entity_key: string; stat_entity_key: string | null; stat_label: string; amount: number; is_percent: number }, []>("SELECT entity_key, stat_entity_key, stat_label, amount, is_percent FROM item_stats ORDER BY entity_key, stat_index").all()) { const values = itemStats.get(row.entity_key) ?? []; values.push({ stat: endpoint(refs, row.stat_entity_key, row.stat_label), amount: row.amount, isPercent: row.is_percent === 1 }); itemStats.set(row.entity_key, values); }
  for (const row of db.query<{ entity_key: string; stat_entity_key: string | null; stat_label: string; min_value: number; max_value: number; is_percent: number; whole: number; chance: number | null }, []>("SELECT entity_key, stat_entity_key, stat_label, min_value, max_value, is_percent, whole, chance FROM item_random_stats ORDER BY entity_key, stat_index").all()) { const values = itemRandomStats.get(row.entity_key) ?? []; values.push({ stat: endpoint(refs, row.stat_entity_key, row.stat_label), min: row.min_value, max: row.max_value, isPercent: row.is_percent === 1, whole: row.whole === 1, chance: row.chance }); itemRandomStats.set(row.entity_key, values); }
  for (const row of db.query<{ entity_key: string; stat_entity_key: string | null; stat_label: string; amount: number; is_percent: number }, []>("SELECT entity_key, stat_entity_key, stat_label, amount, is_percent FROM item_gem_stats ORDER BY entity_key, stat_index").all()) { const values = itemGemStats.get(row.entity_key) ?? []; values.push({ stat: endpoint(refs, row.stat_entity_key, row.stat_label), amount: row.amount, isPercent: row.is_percent === 1 }); itemGemStats.set(row.entity_key, values); }
  for (const row of db.query<{ entity_key: string; socket_type: string | null; gem_type: string | null }, []>("SELECT entity_key, socket_type, gem_type FROM item_sockets ORDER BY entity_key, socket_index").all()) { const values = itemSockets.get(row.entity_key) ?? []; values.push({ socketType: row.socket_type, gemType: row.gem_type }); itemSockets.set(row.entity_key, values); }
  const items = db.query<{ entity_key: string; rarity: string | null; item_type: string | null; armor_slot: string | null; weapon_slot: string | null; weapon_type: string | null; armor_type: string | null; attack_speed: number | null; min_damage: number | null; max_damage: number | null; random_stats_max: number; gem_type: string | null; enchantment_entity_key: string | null; enchantment_label: string | null; sell_price: number | null; sell_currency_entity_key: string | null; sell_currency_label: string | null; buy_price: number | null; buy_currency_entity_key: string | null; buy_currency_label: string | null; stack_limit: number; quest_drop_only: number; corruption_token: number; level_requirement: number | null; action_abilities_json: string; use_lines_json: string; condition_ids_json: string }, []>("SELECT * FROM item_facts ORDER BY entity_key").all().map((row) => ({ entityKey: row.entity_key, rarity: row.rarity, itemType: row.item_type, armorSlot: row.armor_slot, weaponSlot: row.weapon_slot, weaponType: row.weapon_type, armorType: row.armor_type, attackSpeed: row.attack_speed, minDamage: row.min_damage, maxDamage: row.max_damage, stats: itemStats.get(row.entity_key) ?? [], randomStatsMax: row.random_stats_max, randomStats: itemRandomStats.get(row.entity_key) ?? [], sockets: itemSockets.get(row.entity_key) ?? [], gem: row.gem_type === null && !itemGemStats.has(row.entity_key) ? null : { gemType: row.gem_type, stats: itemGemStats.get(row.entity_key) ?? [] }, enchantment: row.enchantment_entity_key === null && row.enchantment_label === null ? null : endpoint(refs, row.enchantment_entity_key, row.enchantment_label), sellPrice: row.sell_price, sellCurrency: row.sell_currency_entity_key === null && row.sell_currency_label === null ? null : endpoint(refs, row.sell_currency_entity_key, row.sell_currency_label), buyPrice: row.buy_price, buyCurrency: row.buy_currency_entity_key === null && row.buy_currency_label === null ? null : endpoint(refs, row.buy_currency_entity_key, row.buy_currency_label), stackLimit: row.stack_limit, questDropOnly: row.quest_drop_only === 1, corruptionToken: row.corruption_token === 1, equipmentRequirements: itemRequirementGroups(conditionById, textArray(row.condition_ids_json), "equipment", row.level_requirement), useConditions: itemRequirementGroups(conditionById, textArray(row.condition_ids_json), "use", null), actionAbilities: (parse(row.action_abilities_json) as Array<{ ability: unknown; rankIndex: number }>).map((value) => ({ ability: endpointJson(refs, value.ability), rankIndex: value.rankIndex })), useLines: parse(row.use_lines_json) as CatalogItemFacts["useLines"], conditionIds: textArray(row.condition_ids_json), gearSet: gearSetByItem.get(row.entity_key) ?? null }));

  const npcStats = new Map<string, CatalogNpcFacts["stats"]>(), phases = new Map<string, CatalogNpcFacts["abilityPhases"]>(), rewards = new Map<string, CatalogNpcFacts["factionRewards"]>();
  const phaseAbilities = new Map<string, CatalogNpcFacts["abilityPhases"][number]["abilities"]>();
  for (const row of db.query<{ entity_key: string; phase_index: number; ability_entity_key: string | null; ability_label: string; rank_index: number }, []>("SELECT entity_key, phase_index, ability_entity_key, ability_label, rank_index FROM npc_phase_abilities ORDER BY entity_key, phase_index, ability_index").all()) { const key = `${row.entity_key}:${row.phase_index}`, values = phaseAbilities.get(key) ?? []; values.push({ ability: endpoint(refs, row.ability_entity_key, row.ability_label), rankIndex: row.rank_index }); phaseAbilities.set(key, values); }
  for (const row of db.query<{ entity_key: string; phase_index: number; name: string | null; requirement: string | null }, []>("SELECT entity_key, phase_index, name, requirement FROM npc_ability_phases ORDER BY entity_key, phase_index").all()) { const values = phases.get(row.entity_key) ?? []; values.push({ phaseIndex: row.phase_index, name: row.name, requirement: row.requirement, abilities: phaseAbilities.get(`${row.entity_key}:${row.phase_index}`) ?? [] }); phases.set(row.entity_key, values); }
  for (const row of db.query<{ entity_key: string; stat_entity_key: string | null; stat_label: string; amount: number; is_percent: number }, []>("SELECT entity_key, stat_entity_key, stat_label, amount, is_percent FROM npc_stats ORDER BY entity_key, stat_index").all()) { const values = npcStats.get(row.entity_key) ?? []; values.push({ stat: endpoint(refs, row.stat_entity_key, row.stat_label), amount: row.amount, isPercent: row.is_percent === 1 }); npcStats.set(row.entity_key, values); }
  for (const row of db.query<{ entity_key: string; faction_entity_key: string | null; faction_label: string; amount: number }, []>("SELECT entity_key, faction_entity_key, faction_label, amount FROM npc_faction_rewards ORDER BY entity_key, reward_index").all()) { const values = rewards.get(row.entity_key) ?? []; values.push({ faction: endpoint(refs, row.faction_entity_key, row.faction_label), amount: row.amount }); rewards.set(row.entity_key, values); }
  const npcs = db.query<Record<string, string | number | null>, []>("SELECT * FROM npc_facts ORDER BY entity_key").all().map((row) => { const specialization = row.loot_specialization_json === null ? null : object(String(row.loot_specialization_json)); return { entityKey: String(row.entity_key), minLevel: row.min_level as number | null, maxLevel: row.max_level as number | null, scalesWithPlayer: row.scales_with_player === 1, npcType: row.npc_type as string | null, creatureType: row.creature_type as string | null, family: row.family as string | null, faction: row.faction_entity_key === null && row.faction_label === null ? null : endpoint(refs, row.faction_entity_key as string | null, row.faction_label as string | null), species: row.species_entity_key === null && row.species_label === null ? null : endpoint(refs, row.species_entity_key as string | null, row.species_label as string | null), isMerchant: row.is_merchant === 1, isQuestGiver: row.is_quest_giver === 1, isCombatEnabled: row.is_combat_enabled === 1, isAuctioneer: row.is_auctioneer === 1, isBanker: row.is_banker === 1, isFlightMaster: row.is_flight_master === 1, hunterTamable: row.hunter_tamable === 1, hunterBeastRole: row.hunter_beast_role as string | null, equipmentAppearanceSelections: row.equipment_appearance_selections as string | null, adventurer: npcAdventurer(refs, row.adventurer_json), flightNetwork: npcFlightNetwork(refs, row.flight_network_json), minRespawn: row.min_respawn as number | null, maxRespawn: row.max_respawn as number | null, minExperience: row.min_experience as number | null, maxExperience: row.max_experience as number | null, immuneToStun: row.immune_to_stun === 1, immuneToSlow: row.immune_to_slow === 1, aggroRange: row.aggro_range as number | null, stats: npcStats.get(String(row.entity_key)) ?? [], abilityPhases: phases.get(String(row.entity_key)) ?? [], factionRewards: rewards.get(String(row.entity_key)) ?? [], linkedNpc: row.linked_npc_entity_key === null && row.linked_npc_label === null ? null : endpoint(refs, row.linked_npc_entity_key as string | null, row.linked_npc_label as string | null), lootSpecialization: specialization === null ? null : { armorType: typeof specialization.armorType === "string" ? specialization.armorType : null, weaponTypes: Array.isArray(specialization.weaponTypes) ? specialization.weaponTypes.filter((value): value is string => typeof value === "string") : [], stat: nullableEndpointJson(refs, specialization.stat) } }; });
  const tasks = db.query<{ entity_key: string; task_type: string; target_entity_key: string | null; target_label: string | null; count: number | null; keep_items: number | null; scene_name: string | null }, []>("SELECT entity_key, task_type, target_entity_key, target_label, count, keep_items, scene_name FROM task_facts ORDER BY entity_key").all().map((row) => ({ entityKey: row.entity_key, taskType: row.task_type, target: row.target_entity_key === null && row.target_label === null ? null : endpoint(refs, row.target_entity_key, row.target_label), count: row.count, keepItems: row.keep_items === null ? null : row.keep_items === 1, sceneName: row.scene_name }));
  const worldQuestFacts = new Map(db.query<{ entity_key: string; available_seconds: number; cooldown_after_completion_seconds: number; cooldown_after_expiry_seconds: number; cooldown_jitter_seconds: number; initial_roll_seconds: number }, []>("SELECT entity_key, available_seconds, cooldown_after_completion_seconds, cooldown_after_expiry_seconds, cooldown_jitter_seconds, initial_roll_seconds FROM world_quest_facts ORDER BY entity_key").all().map((row) => [row.entity_key, { availableSeconds: row.available_seconds, cooldownAfterCompletionSeconds: row.cooldown_after_completion_seconds, cooldownAfterExpirySeconds: row.cooldown_after_expiry_seconds, cooldownJitterSeconds: row.cooldown_jitter_seconds, initialRollSeconds: row.initial_roll_seconds }] as const));
  const quests = db.query<{ entity_key: string; chain_name: string | null; chain_order: number | null; repeatable: number; turn_in_without_npc: number; completed_description: string | null; objective_text: string | null; level_requirement: number | null; level_min: number | null; level_max: number | null; dungeon_entity_key: string | null; dungeon_label: string | null; experience: number | null; condition_ids_json: string }, []>("SELECT entity_key, chain_name, chain_order, repeatable, turn_in_without_npc, completed_description, objective_text, level_requirement, level_min, level_max, dungeon_entity_key, dungeon_label, experience, condition_ids_json FROM quest_facts ORDER BY entity_key").all().map((row) => ({ entityKey: row.entity_key, chainName: row.chain_name, chainOrder: row.chain_order, repeatable: row.repeatable === 1, turnInWithoutNpc: row.turn_in_without_npc === 1, completedDescription: row.completed_description, objectiveText: row.objective_text, levelRequirement: row.level_requirement, levelRange: row.level_min === null || row.level_max === null ? null : { min: row.level_min, max: row.level_max }, dungeon: row.dungeon_entity_key === null && row.dungeon_label === null ? null : endpoint(refs, row.dungeon_entity_key, row.dungeon_label ?? row.dungeon_entity_key ?? ""), experience: row.experience, conditionIds: textArray(row.condition_ids_json), worldQuest: worldQuestFacts.get(row.entity_key) ?? null }));
  const places = db.query<{ entity_key: string; place_type: CatalogPlaceFacts["placeType"]; guide_included: number; guide_description: string | null; level_min: number | null; level_max: number | null; map_space_ids_json: string; bosses_json: string; parent_scene_key: string | null }, []>("SELECT entity_key, place_type, guide_included, guide_description, level_min, level_max, map_space_ids_json, bosses_json, parent_scene_key FROM place_facts ORDER BY entity_key").all().map((row) => ({ entityKey: row.entity_key, placeType: row.place_type, guideIncluded: row.guide_included === 1, guideDescription: row.guide_description, levelRange: row.level_min === null || row.level_max === null ? null : { min: row.level_min, max: row.level_max }, mapSpaceIds: textArray(row.map_space_ids_json), bosses: (parse(row.bosses_json) as unknown[]).map((value) => endpointJson(refs, value)), parentSceneKey: row.parent_scene_key }));
  const properties = db.query<{ entity_key: string; income: number | null; income_interval: number | null; purchase_price: number | null; sell_price: number | null; currency_entity_key: string | null; currency_label: string | null; property_type: string | null }, []>("SELECT entity_key, income, income_interval, purchase_price, sell_price, currency_entity_key, currency_label, property_type FROM property_facts ORDER BY entity_key").all().map((row) => ({ entityKey: row.entity_key, income: row.income, incomeInterval: row.income_interval, purchasePrice: row.purchase_price, sellPrice: row.sell_price, currency: row.currency_entity_key === null && row.currency_label === null ? null : endpoint(refs, row.currency_entity_key, row.currency_label), propertyType: row.property_type }));
  const abilities = db.query<{ entity_key: string; ranks_json: string }, []>("SELECT entity_key, ranks_json FROM ability_facts ORDER BY entity_key").all().map((row): CatalogAbilityFacts => ({ entityKey: row.entity_key, ranks: (parse(row.ranks_json) as Array<{ rankIndex: number; lines: CatalogAbilityFacts["ranks"][number]["lines"] }>).map((rank) => ({ rankIndex: rank.rankIndex, lines: rank.lines })) }));
  const ranks = new Map<string, CatalogRecipeFacts["ranks"]>();
  const products = new Map<string, CatalogRecipeFacts["ranks"][number]["products"]>(), materials = new Map<string, CatalogRecipeFacts["ranks"][number]["materials"]>();
  for (const row of db.query<{ entity_key: string; rank: number; item_entity_key: string | null; item_label: string; count: number; chance: number }, []>("SELECT entity_key, rank, item_entity_key, item_label, count, chance FROM recipe_products ORDER BY entity_key, rank, product_index").all()) { const key = `${row.entity_key}:${row.rank}`, values = products.get(key) ?? []; values.push({ item: endpoint(refs, row.item_entity_key, row.item_label), count: row.count, chance: row.chance }); products.set(key, values); }
  for (const row of db.query<{ entity_key: string; rank: number; item_entity_key: string | null; item_label: string; count: number }, []>("SELECT entity_key, rank, item_entity_key, item_label, count FROM recipe_materials ORDER BY entity_key, rank, material_index").all()) { const key = `${row.entity_key}:${row.rank}`, values = materials.get(key) ?? []; values.push({ item: endpoint(refs, row.item_entity_key, row.item_label), count: row.count }); materials.set(key, values); }
  for (const row of db.query<{ entity_key: string; rank: number; unlock_cost: number; experience: number; craft_time: number }, []>("SELECT entity_key, rank, unlock_cost, experience, craft_time FROM recipe_ranks ORDER BY entity_key, rank").all()) { const values = ranks.get(row.entity_key) ?? []; values.push({ rank: row.rank, unlockCost: row.unlock_cost, experience: row.experience, craftTime: row.craft_time, products: products.get(`${row.entity_key}:${row.rank}`) ?? [], materials: materials.get(`${row.entity_key}:${row.rank}`) ?? [] }); ranks.set(row.entity_key, values); }
  const recipes = db.query<{ entity_key: string; skill_entity_key: string | null; skill_label: string | null; station_entity_key: string | null; station_label: string | null; learned_by_default: number }, []>("SELECT entity_key, skill_entity_key, skill_label, station_entity_key, station_label, learned_by_default FROM recipe_facts ORDER BY entity_key").all().map((row) => ({ entityKey: row.entity_key, skill: row.skill_entity_key === null && row.skill_label === null ? null : endpoint(refs, row.skill_entity_key, row.skill_label), station: row.station_entity_key === null && row.station_label === null ? null : endpoint(refs, row.station_entity_key, row.station_label), learnedByDefault: row.learned_by_default === 1, ranks: ranks.get(row.entity_key) ?? [] }));
  return { ...identity(db), records: { entities: queryCatalogEntities(db).records, items, npcs, quests, tasks, places, properties, abilities, recipes, gearSets } };
}

// The world loot settings and the level band that the loot relations keep with each world and level-band entry.
// A world loot binding reaches a creature of at least the minimum rank. A level-band table gives an item only to a
// creature within `levelBandRange` levels of the item's level requirement.
interface LootRules { minimumRank: number; minimumRankName: string; levelBandRange: number | null }

function lootRules(db: Database): LootRules {
  // Supplemental cloth loot is also world loot, but only the binding entries carry the world loot settings.
  const settings = db.query<{ value: string }, []>("SELECT DISTINCT json_extract(context_json, '$.worldLootSettings') AS value FROM item_sources WHERE source_kind = 'world-loot' AND json_extract(context_json, '$.worldLootSettings') IS NOT NULL").all();
  const ranges = db.query<{ value: number }, []>("SELECT DISTINCT json_extract(context_json, '$.levelEligibility.levelBand.range') AS value FROM item_sources WHERE source_kind IN ('npc-loot', 'world-loot') AND json_extract(context_json, '$.levelEligibility') IS NOT NULL").all();
  if (settings.length > 1 || ranges.length > 1) throw new Error("Loot relations disagree on the world loot settings or the level band range.");
  const world = settings.length === 0 ? {} : object(settings[0]!.value);
  return {
    minimumRank: typeof world.minimumNPCRank === "number" ? world.minimumNPCRank : 0,
    minimumRankName: typeof world.minimumNPCRankName === "string" ? world.minimumNPCRankName : "",
    levelBandRange: ranges.length === 0 ? null : ranges[0]!.value,
  };
}

// The creature levels that a world loot binding gives an item to. The binding range bounds the creature level, and 0
// leaves a bound open. An item with a positive level requirement in a level-band table also needs a creature within
// the band range of that requirement. Null means that no creature level qualifies.
function worldCreatureLevel(minimum: number, maximum: number, requiredLevel: number | null, bandRange: number | null): CatalogDropRow["creatureLevel"] {
  let min = Math.max(1, minimum), max = maximum >= 1 ? maximum : null;
  if (requiredLevel !== null && requiredLevel > 0) {
    if (bandRange === null) throw new Error("A level-band world loot entry has no level band range.");
    min = Math.max(min, requiredLevel - bandRange);
    max = Math.min(max ?? Number.POSITIVE_INFINITY, requiredLevel + bandRange);
  }
  return max !== null && max < min ? null : { min, max };
}

export function queryDropRows(db: Database): CatalogQueryResult<CatalogDropRow[]> {
  const refs = entityEndpointIndex(db), placements = placementIdsByNpc(db), rules = lootRules(db), records: CatalogDropRow[] = [];
  const requiredLevels = new Map(db.query<{ item_entity_key: string; source_key: string; required_level: number | null }, []>("SELECT item_entity_key, source_key, json_extract(context_json, '$.levelEligibility.requiredLevel') AS required_level FROM item_sources WHERE source_kind = 'world-loot'").all()
    .map((row) => [`${row.item_entity_key}|${row.source_key}`, row.required_level]));
  const worldOwner = rules.minimumRank <= 0 ? "Any creature" : `Creatures of rank ${rules.minimumRankName || rules.minimumRank} or higher`;
  for (const row of db.query<{ context: "npc" | "world"; owner_entity_key: string | null; binding_index: number; table_rate: number | null; condition_id: string | null; binding_json: string; loot_table_id: number; level_band_gear: number; table_json: string; entry_count: number; entry_index: number; item_entity_key: string; min_count: number; max_count: number; raw_rate: number | null }, []>(`
    SELECT b.context, b.owner_entity_key, b.binding_index, b.raw_rate AS table_rate, b.condition_id, b.payload_json AS binding_json, b.loot_table_id, t.level_band_gear, t.payload_json AS table_json,
      (SELECT COUNT(*) FROM loot_entries n WHERE n.build_id = b.build_id AND n.loot_table_id = b.loot_table_id) AS entry_count,
      e.entry_index, e.item_entity_key, e.min_count, e.max_count, e.raw_rate
    FROM loot_bindings b JOIN loot_tables t ON t.build_id = b.build_id AND t.loot_table_id = b.loot_table_id JOIN loot_entries e ON e.build_id = b.build_id AND e.loot_table_id = b.loot_table_id
    ORDER BY b.context, COALESCE(b.owner_entity_key, ''), b.binding_index, e.entry_index
  `).all()) {
    const binding = object(row.binding_json), table = object(row.table_json);
    const limit = table.limitDroppedItems === true && typeof table.maxDroppedItems === "number" && table.maxDroppedItems >= 1 ? table.maxDroppedItems : null;
    // The minimum-drop pass fills up to the minimum, never past the limit, and picks each entry at most once.
    const minimum = table.hasMinimumDrops === true && typeof table.minDroppedItems === "number" && table.minDroppedItems >= 1 ? Math.min(table.minDroppedItems, limit ?? row.entry_count, row.entry_count) : null;
    let creatureLevel: CatalogDropRow["creatureLevel"] = null;
    if (row.context === "world") {
      const sourceKey = `${row.item_entity_key}|${row.binding_index}:${row.entry_index}`;
      if (row.level_band_gear === 1 && !requiredLevels.has(sourceKey)) throw new Error(`World loot entry ${sourceKey} of a level-band table has no level eligibility.`);
      const requiredLevel = row.level_band_gear === 1 ? requiredLevels.get(sourceKey) ?? null : null;
      creatureLevel = worldCreatureLevel(typeof binding.minimumNPCLevel === "number" ? binding.minimumNPCLevel : 0, typeof binding.maximumNPCLevel === "number" ? binding.maximumNPCLevel : 0, requiredLevel, rules.levelBandRange);
      // No creature level passes both the binding range and the level band, so the game never gives this entry.
      if (creatureLevel === null) continue;
    }
    records.push({
      context: row.context,
      owner: row.owner_entity_key === null ? { entityKey: null, label: worldOwner } : endpoint(refs, row.owner_entity_key, row.owner_entity_key),
      item: endpoint(refs, row.item_entity_key, row.item_entity_key), lootTableId: row.loot_table_id, entryIndex: row.entry_index,
      min: row.min_count, max: row.max_count, rawRate: row.raw_rate, displayedChance: row.raw_rate === null ? null : Math.round(row.raw_rate * 10) / 10,
      tableRate: row.table_rate, tableMinimum: minimum, tableLimit: limit !== null && row.entry_count > limit ? limit : null, creatureLevel,
      conditionIds: row.condition_id === null ? [] : [row.condition_id], placementIds: row.owner_entity_key === null ? [] : placements.get(row.owner_entity_key) ?? [],
    });
  }
  return { ...identity(db), records };
}

export function queryVendorRows(db: Database): CatalogQueryResult<CatalogVendorRow[]> {
  const refs = entityEndpointIndex(db), placements = placementIdsByNpc(db);
  const records = db.query<{ owner_entity_key: string; item_entity_key: string; currency_entity_key: string | null; cost: number; merchant_table_id: number; stock_index: number; binding_condition: string | null }, []>(`
    SELECT b.owner_entity_key, s.item_entity_key, s.currency_entity_key, s.cost, s.merchant_table_id, s.stock_index, b.condition_id AS binding_condition FROM merchant_bindings b JOIN npc_facts n ON n.entity_key = b.owner_entity_key AND n.is_merchant = 1 JOIN merchant_stock s ON s.build_id = b.build_id AND s.merchant_table_id = b.merchant_table_id ORDER BY b.owner_entity_key, s.merchant_table_id, s.stock_index, b.binding_index
  `).all().map((row) => ({ npc: endpoint(refs, row.owner_entity_key, row.owner_entity_key), item: endpoint(refs, row.item_entity_key, row.item_entity_key), currency: row.currency_entity_key === null ? null : endpoint(refs, row.currency_entity_key, row.currency_entity_key), cost: row.cost, merchantTableId: row.merchant_table_id, stockIndex: row.stock_index, conditionIds: row.binding_condition === null ? [] : [row.binding_condition], placementIds: placements.get(row.owner_entity_key) ?? [] }));
  return { ...identity(db), records };
}

export function queryGatherRows(db: Database): CatalogQueryResult<CatalogGatherRow[]> {
  const refs = entityEndpointIndex(db), records: CatalogGatherRow[] = [];
  for (const row of db.query<{ yield_id: string; source_id: string | null; resource_entity_key: string | null; item_entity_key: string | null; rank: number | null; min_count: number | null; max_count: number | null; payload_json: string }, []>("SELECT yield_id, source_id, resource_entity_key, item_entity_key, rank, min_count, max_count, payload_json FROM resource_yields WHERE item_entity_key IS NOT NULL ORDER BY yield_id").all()) {
    const source = row.source_id === null ? null : db.query<{ placement_id: string; scene_native_id: number; label: string | null }, [string]>("SELECT p.placement_id, p.scene_native_id, p.label FROM placement_sources ps JOIN placements p ON p.placement_id = ps.placement_id WHERE ps.source_id = ? ORDER BY p.placement_id LIMIT 1").get(row.source_id), payload = object(row.payload_json);
    const skillId = typeof payload.gatheringSkillId === "number" ? payload.gatheringSkillId : null, skill = skillId === null || skillId < 0 ? null : endpoint(refs, `skills:${skillId}`, `Skill ${skillId}`);
    records.push({ producerLabel: source?.label ?? (row.resource_entity_key === null ? "Resource" : refs.get(row.resource_entity_key)?.label ?? row.resource_entity_key), sourceId: row.source_id, sceneNativeId: source?.scene_native_id ?? null, resource: row.resource_entity_key === null ? null : endpoint(refs, row.resource_entity_key, row.resource_entity_key), item: endpoint(refs, row.item_entity_key, row.item_entity_key), skill, rank: row.rank, min: row.min_count, max: row.max_count, rawRate: typeof payload.rawRate === "number" ? payload.rawRate : null, conditionIds: [], placementIds: source ? [source.placement_id] : [] });
  }
  return { ...identity(db), records };
}

export function queryContainerRows(db: Database): CatalogQueryResult<CatalogContainerRow[]> {
  const refs = entityEndpointIndex(db), gates = availabilityBySource(db), sources = sourcePlacements(db), records: CatalogContainerRow[] = [];
  for (const row of db.query<{ item_entity_key: string; source_key: string; placement_ids_json: string; condition_ids_json: string; context_json: string }, []>("SELECT item_entity_key, source_key, placement_ids_json, condition_ids_json, context_json FROM item_sources WHERE source_kind = 'container' ORDER BY item_entity_key, source_key").all()) {
    const context = object(row.context_json), sourceId = typeof context.sourceId === "string" ? context.sourceId : null;
    if (sourceId === null) throw new Error(`Container source ${row.source_key} has no source identity.`);
    const placementIds = textArray(row.placement_ids_json);
    if (placementIds.length === 0) placementIds.push(...sources.get(sourceId) ?? []);
    const placement = placementIds.length === 0 ? null : db.query<{ scene_native_id: number }, [string]>("SELECT scene_native_id FROM placements WHERE placement_id = ?").get(placementIds[0]!);
    records.push({ containerType: typeof context.containerType === "string" ? context.containerType : null, sourceId, place: placement === null ? null : endpoint(refs, `scenes:${placement.scene_native_id}`, `Scene ${placement.scene_native_id}`), item: endpoint(refs, row.item_entity_key, row.item_entity_key), min: typeof context.min === "number" ? context.min : null, max: typeof context.max === "number" ? context.max : null, rawRate: typeof context.rawRate === "number" ? context.rawRate : null, availability: itemSourceAvailability(textArray(row.condition_ids_json), gates.get(sourceId) ?? []), placementIds });
  }
  return { ...identity(db), records };
}

export function queryInteractionRows(db: Database): CatalogQueryResult<CatalogInteractionRow[]> {
  const refs = entityEndpointIndex(db), gates = availabilityBySource(db), sources = sourcePlacements(db);
  const records: CatalogInteractionRow[] = [];
  for (const row of db.query<{ item_entity_key: string; source_key: string; placement_ids_json: string; condition_ids_json: string; context_json: string }, []>("SELECT item_entity_key, source_key, placement_ids_json, condition_ids_json, context_json FROM item_sources WHERE source_kind = 'interaction' ORDER BY item_entity_key, source_key").all()) {
    const context = object(row.context_json), sourceId = typeof context.sourceId === "string" ? context.sourceId : null;
    if (sourceId === null) throw new Error(`Interaction source ${row.source_key} has no source identity.`);
    const placementIds = textArray(row.placement_ids_json);
    if (placementIds.length === 0) placementIds.push(...sources.get(sourceId) ?? []);
    const placement = placementIds.length === 0 ? null : db.query<{ scene_native_id: number }, [string]>("SELECT scene_native_id FROM placements WHERE placement_id = ?").get(placementIds[0]!);
    records.push({ objectName: typeof context.objectName === "string" ? context.objectName : null, sourceId, place: placement === null ? null : endpoint(refs, `scenes:${placement.scene_native_id}`, `Scene ${placement.scene_native_id}`), item: endpoint(refs, row.item_entity_key, row.item_entity_key), min: typeof context.min === "number" ? context.min : null, max: typeof context.max === "number" ? context.max : null, rawRate: typeof context.rawRate === "number" ? context.rawRate : null, availability: itemSourceAvailability(textArray(row.condition_ids_json), gates.get(sourceId) ?? []), placementIds });
  }
  return { ...identity(db), records };
}

export function queryQuestRows(db: Database): CatalogQueryResult<CatalogQuestRow[]> {
  const refs = entityEndpointIndex(db), npcPlacements = placementIdsByNpc(db), sources = sourcePlacements(db), gates = availabilityBySource(db);
  const tasks = new Map(queryCatalogFacts(db).records.tasks.map((row) => [row.entityKey, row]));
  const associations = db.query<{ association_id: string; association_kind: string; owner_entity_key: string | null; quest_entity_key: string | null; task_entity_key: string | null; source_id: string | null; payload_json: string }, []>(`
    SELECT a.association_id, a.association_kind, a.owner_entity_key, a.quest_entity_key, a.task_entity_key, a.source_id, a.payload_json
    FROM quest_associations a LEFT JOIN npc_facts n ON n.entity_key = a.owner_entity_key
    WHERE a.association_kind = 'interaction-task' OR (a.quest_entity_key IS NOT NULL AND (a.association_kind <> 'npc-quest' OR n.is_quest_giver = 1))
    ORDER BY a.quest_entity_key, a.association_kind, a.association_id
  `).all();
  const completions = new Map<string, CatalogQuestRow["completions"]>();
  for (const row of associations) if (row.association_kind === "interaction-task" && row.task_entity_key && row.source_id) {
    const payload = object(row.payload_json), action = payload.payload && typeof payload.payload === "object" ? payload.payload as Record<string, unknown> : payload;
    const entries = completions.get(row.task_entity_key) ?? [];
    if (!entries.some((entry) => entry.sourceId === row.source_id)) entries.push({ sourceId: row.source_id, label: typeof action.objectName === "string" ? action.objectName : null, placementIds: sources.get(row.source_id) ?? [], availability: gates.get(row.source_id) ?? [] });
    completions.set(row.task_entity_key, entries);
  }
  for (const entries of completions.values()) entries.sort((a, b) => a.sourceId.localeCompare(b.sourceId));
  const records: CatalogQuestRow[] = [];
  for (const row of associations) {
    if (row.quest_entity_key === null) continue;
    const payload = object(row.payload_json), action = payload.payload && typeof payload.payload === "object" ? payload.payload as Record<string, unknown> : payload;
    let kind: CatalogQuestRow["kind"];
    if (row.association_kind === "npc-quest") kind = payload.association === "completed" ? "turnIn" : "giver";
    else if (row.association_kind === "quest-objective") kind = "objective";
    else if (row.association_kind === "world-quest-offer") kind = "worldOffer";
    else if (row.association_kind === "interaction-quest") kind = "objectStart";
    else continue;
    const sourceId = kind === "worldOffer" || kind === "objectStart" ? row.source_id : null;
    const task = row.task_entity_key === null ? null : tasks.get(row.task_entity_key) ?? null;
    // An objective's counterpart is its task's target, so the NPC, item, scene, or ability that the task names
    // lists the quest. Every other row names the NPC that owns the binding, if any.
    const counterpart = kind === "objective" ? task?.target ?? null : row.owner_entity_key === null ? null : endpoint(refs, row.owner_entity_key, row.owner_entity_key);
    const pool = Array.isArray(action.poolQuestIDs) ? action.poolQuestIDs.flatMap((id) => typeof id === "number" && id >= 0 ? [endpoint(refs, `quests:${id}`, `Quest ${id}`)] : []) : [];
    records.push({ associationId: row.association_id, quest: endpoint(refs, row.quest_entity_key, row.quest_entity_key), kind, index: typeof payload.objectiveIndex === "number" ? payload.objectiveIndex : typeof payload.associationIndex === "number" ? payload.associationIndex : 0, counterpart, task, count: null, rewardType: null, sourceId, label: kind === "objectStart" && typeof action.objectName === "string" ? action.objectName : null, availability: sourceId === null ? [] : gates.get(sourceId) ?? [], completions: row.task_entity_key === null ? [] : completions.get(row.task_entity_key) ?? [], worldOffer: kind === "worldOffer" ? { zoneDelaySeconds: typeof action.zoneRespawnCooldown === "number" ? action.zoneRespawnCooldown : null, pool } : null, placementIds: sourceId !== null ? sources.get(sourceId) ?? [] : row.owner_entity_key === null ? [] : npcPlacements.get(row.owner_entity_key) ?? [] });
  }
  for (const row of db.query<{ quest_entity_key: string; reward_set: "given" | "pick" | "itemGiven"; reward_index: number; reward_type: string; target_entity_key: string | null; target_label: string | null; count: number | null }, []>("SELECT quest_entity_key, reward_set, reward_index, reward_type, target_entity_key, target_label, count FROM quest_rewards WHERE target_entity_key IS NOT NULL OR target_label IS NOT NULL ORDER BY quest_entity_key, reward_set, reward_index").all()) {
    records.push({ associationId: `reward:${row.quest_entity_key}:${row.reward_set}:${row.reward_index}`, quest: endpoint(refs, row.quest_entity_key, row.quest_entity_key), kind: row.reward_set === "given" ? "reward" : row.reward_set === "pick" ? "rewardChoice" : "itemGiven", index: row.reward_index, counterpart: endpoint(refs, row.target_entity_key, row.target_label), task: null, count: row.count, rewardType: row.reward_type, sourceId: null, label: null, availability: [], completions: [], worldOffer: null, placementIds: [] });
  }
  records.sort((a, b) => String(a.quest.entityKey).localeCompare(String(b.quest.entityKey)) || a.kind.localeCompare(b.kind) || a.index - b.index || a.associationId.localeCompare(b.associationId));
  return { ...identity(db), records };
}

// The world source families whose presence a reader can observe: a creature spawner, an interactive object, a
// container, a gathering node, a crafting station, and a world quest zone.
const GATED_SOURCE_FAMILY: Readonly<Record<string, CatalogGatedSourceRow["family"]>> = {
  npcProducer: "npcProducer", interactableObject: "interaction", enhancedInteractableObject: "interaction", chest: "container",
  oreSpawner: "resource", craftingStation: "craftingStation", worldQuestZone: "worldQuestZone",
};

export function queryGatedSources(db: Database): CatalogQueryResult<CatalogGatedSourceRow[]> {
  const refs = entityEndpointIndex(db), gates = availabilityBySource(db), placements = sourcePlacements(db);
  const details = new Map<string, { family: string; data: Record<string, unknown> }>();
  for (const row of db.query<{ source_id: string; family: string; data_json: string }, []>("SELECT source_id, family, data_json FROM source_details ORDER BY source_id, detail_id").all()) if (!details.has(row.source_id)) details.set(row.source_id, { family: row.family, data: object(row.data_json) });
  const candidates = new Map<string, CatalogEndpoint[]>();
  for (const row of db.query<{ source_id: string; npc_entity_key: string }, []>("SELECT DISTINCT source_id, npc_entity_key FROM spawn_candidates WHERE npc_entity_key IS NOT NULL ORDER BY source_id, npc_entity_key").all()) {
    const entries = candidates.get(row.source_id) ?? []; entries.push(endpoint(refs, row.npc_entity_key, row.npc_entity_key)); candidates.set(row.source_id, entries);
  }
  const records: CatalogGatedSourceRow[] = [];
  for (const [sourceId, availability] of gates) {
    if (!(placements.get(sourceId)?.length)) continue;
    const detail = details.get(sourceId);
    if (!detail) continue;
    const family: CatalogGatedSourceRow["family"] | null = GATED_SOURCE_FAMILY[detail.family] ?? null;
    if (!family) continue;
    const data = detail.data, stationId = typeof data.stationID === "number" ? data.stationID : null;
    const subjects = family === "npcProducer" ? candidates.get(sourceId) ?? [] : family === "craftingStation" && stationId !== null && refs.has(`craftingStations:${stationId}`) ? [refs.get(`craftingStations:${stationId}`)!] : [];
    const objectName = typeof data.interactableName === "string" && data.interactableName ? data.interactableName : null;
    const source = data.source && typeof data.source === "object" ? data.source as { source?: { hierarchyPath?: string | null } } : null;
    const label = family === "interaction" ? objectName : family === "container" ? containerTypeFromHierarchyPath(source?.source?.hierarchyPath ?? null) : null;
    records.push({ sourceId, family, label, subjects, placementIds: placements.get(sourceId)!, availability });
  }
  records.sort((a, b) => a.sourceId.localeCompare(b.sourceId));
  return { ...identity(db), records };
}


export function queryRecipeRows(db: Database): CatalogQueryResult<CatalogRecipeRow[]> {
  const refs = entityEndpointIndex(db), records: CatalogRecipeRow[] = [];
  for (const row of db.query<{ entity_key: string; rank: number; item_entity_key: string | null; item_label: string; count: number; chance: number }, []>("SELECT entity_key, rank, item_entity_key, item_label, count, chance FROM recipe_products ORDER BY entity_key, rank, product_index").all()) records.push({ recipe: endpoint(refs, row.entity_key, row.entity_key), item: endpoint(refs, row.item_entity_key, row.item_label), role: "product", rank: row.rank, count: row.count, chance: row.chance });
  for (const row of db.query<{ entity_key: string; rank: number; item_entity_key: string | null; item_label: string; count: number }, []>("SELECT entity_key, rank, item_entity_key, item_label, count FROM recipe_materials ORDER BY entity_key, rank, material_index").all()) records.push({ recipe: endpoint(refs, row.entity_key, row.entity_key), item: endpoint(refs, row.item_entity_key, row.item_label), role: "material", rank: row.rank, count: row.count, chance: null });
  return { ...identity(db), records };
}

export function queryContainment(db: Database): CatalogQueryResult<CatalogPlacementRow[]> {
  const roles = new Map<string, CatalogPlacementRow["roles"]>(), families = new Map<string, Set<string>>(), randomChoices = randomChoicesByPlacement(db);
  for (const row of db.query<{ placement_id: string; role: string; npc_entity_key: string | null; scope: string }, []>("SELECT placement_id, role, npc_entity_key, scope FROM placement_roles ORDER BY placement_id, role, scope, COALESCE(npc_entity_key, '')").all()) { const values = roles.get(row.placement_id) ?? []; values.push({ role: row.role, npcEntityKey: row.npc_entity_key, scope: row.scope }); roles.set(row.placement_id, values); }
  for (const row of db.query<{ placement_id: string; families_json: string }, []>("SELECT placement_id, families_json FROM placement_sources ORDER BY placement_id, source_id").all()) { const values = families.get(row.placement_id) ?? new Set<string>(); for (const family of textArray(row.families_json)) values.add(family); families.set(row.placement_id, values); }
  const records = db.query<{ placement_id: string; scene_native_id: number; map_space_id: string | null; label: string | null; area_name: string | null }, []>("SELECT p.placement_id, p.scene_native_id, p.map_space_id, p.label, a.area_name FROM placements p LEFT JOIN placement_areas a ON a.placement_id = p.placement_id ORDER BY p.placement_id").all().map((row) => ({ placementId: row.placement_id, sceneNativeId: row.scene_native_id, sceneKey: `scenes:${row.scene_native_id}`, mapSpaceId: row.map_space_id, label: row.label, area: row.area_name, roles: roles.get(row.placement_id) ?? [], families: [...families.get(row.placement_id) ?? []].sort(), randomChoices: randomChoices.get(row.placement_id) ?? [] }));
  return { ...identity(db), records };
}

export function queryTransitions(db: Database): CatalogQueryResult<CatalogTransitionRow[]> {
  const placementIds = db.query<{ placement_id: string }, [string]>("SELECT placement_id FROM placement_sources WHERE source_id = ? ORDER BY placement_id");
  const records = db.query<{ transition_id: string; source_scene_native_id: number | null; destination_scene_entity_key: string | null; transition_kind: string; source_id: string | null; map_space_id: string | null; map_x: number | null; map_y: number | null; world_x: number | null; world_y: number | null; world_z: number | null }, []>(
    `SELECT t.transition_id, t.source_scene_native_id, t.destination_scene_entity_key, t.transition_kind, t.source_id, p.map_space_id, p.map_x, p.map_y, p.world_x, p.world_y, p.world_z
     FROM transitions t LEFT JOIN source_identities s ON s.source_id = t.source_id LEFT JOIN placements p ON p.placement_id = s.placement_id
     ORDER BY t.transition_id`,
  ).all().map((row): CatalogTransitionRow => ({
    transitionId: row.transition_id,
    sourceSceneKey: row.source_scene_native_id === null ? null : `scenes:${row.source_scene_native_id}`,
    destinationSceneKey: row.destination_scene_entity_key,
    transitionKind: row.transition_kind,
    placementIds: row.source_id === null ? [] : placementIds.all(row.source_id).map((placement) => placement.placement_id),
    start: row.world_x === null || row.world_y === null || row.world_z === null ? null : {
      mapSpaceId: row.map_space_id,
      mapPosition: row.map_x === null || row.map_y === null ? null : [row.map_x, row.map_y],
      worldPosition: [row.world_x, row.world_y, row.world_z],
    },
  }));
  return { ...identity(db), records };
}

function requirementNamedValue(value: unknown): CatalogRequirementNamedValue | null {
  if (value === null || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  return typeof row.value === "number" && typeof row.name === "string" ? { value: row.value, name: row.name } : null;
}

function requirementEntry(value: unknown): CatalogRequirementEntry | null {
  if (value === null || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (typeof row.nativeId !== "number" || typeof row.nativeType !== "string" || typeof row.text !== "string") return null;
  const optionalText = (field: string) => typeof row[field] === "string" ? row[field] as string : null;
  return { nativeId: row.nativeId, name: optionalText("name"), internalName: optionalText("internalName"), fileName: optionalText("fileName"), description: optionalText("description"), nativeType: row.nativeType, text: row.text };
}

function requirementTime(value: unknown): CatalogRequirementTime | null {
  if (value === null || typeof value !== "object") return null;
  const row = value as CatalogRequirementTime;
  return row;
}

function requirementEndpoint(refs: ReadonlyMap<string, CatalogEndpoint>, requirement: Record<string, unknown>, field: string, kind: string): CatalogEndpoint | null {
  const nativeId = requirement[field];
  return typeof nativeId === "number" && nativeId >= 0 ? endpoint(refs, `${kind}:${nativeId}`, `${kind} ${nativeId}`) : null;
}

function requirementSpans(requirement: CatalogRequirement): CatalogRequirementSpan[] {
  const spans: CatalogRequirementSpan[] = [];
  const text = (value: string) => { if (value) spans.push({ text: value }); };
  const reference = (value: CatalogEndpoint | null, fallback: string) => value ? spans.push({ endpoint: value }) : text(fallback);
  const amount = requirement.amounts.primary;
  const numberPhrase = requirement.value?.name === "EqualOrAbove" ? `${amount} or higher` : requirement.value?.name === "EqualOrBelow" ? `${amount} or lower` : requirement.value?.name === "Above" ? `above ${amount}` : requirement.value?.name === "Below" ? `below ${amount}` : String(amount);
  if (requirement.type.name === "Quest") {
    reference(requirement.references.quest, "Unresolved quest");
    const state: Record<string, string> = { onGoing: "in progress", completed: "completed", abandonned: "abandoned", failed: "failed", turnedIn: "turned in", Tracked: "tracked", TrackedOngoing: "in progress and tracked", TrackedCompleted: "completed and tracked" };
    if (requirement.questState) text(` ${state[requirement.questState.name] ?? requirement.questState.name}`);
  } else if (requirement.type.name === "Level") text(`Level ${numberPhrase}`);
  else if (requirement.type.name === "Class") reference(requirement.references.class, "Unresolved class");
  else if (requirement.type.name === "Race") reference(requirement.references.race, "Unresolved race");
  else if (requirement.type.name === "Species") reference(requirement.references.species, "Unresolved species");
  else if (requirement.type.name === "Gender") text(requirement.subtypes.gender?.name ?? "Unresolved gender");
  else if (requirement.type.name === "Effect") {
    // The game compares the stacks of the effect with the amount only when the first flag is set: "Stacking Effect
    // Done is active with 34 stacks". Without the flag, any stack count passes.
    reference(requirement.references.effect, "Unresolved effect");
    if (requirement.state) text(` is ${requirement.state.name.toLowerCase()}`);
    if (requirement.flags.first) {
      const stacks = requirement.value?.name === "EqualOrAbove" ? `${amount} or more` : requirement.value?.name === "EqualOrBelow" ? `${amount} or fewer` : requirement.value?.name === "Above" ? `more than ${amount}` : requirement.value?.name === "Below" ? `fewer than ${amount}` : String(amount);
      text(` with ${stacks} ${amount === 1 && requirement.value?.name === "Equal" ? "stack" : "stacks"}`);
    }
  }
  else if (requirement.type.name === "Item") {
    // "Has Iron Key", "Does not have Iron Key", "Axe equipped". A native enum such as AXE reads as "Axe".
    const ownership = requirement.ownership?.name;
    if (ownership === "Owned") text("Has ");
    else if (ownership === "NotOwned") text("Does not have ");
    const subtype = requirement.subtypes.weaponType ?? requirement.subtypes.weaponSlot ?? requirement.subtypes.armorType ?? requirement.subtypes.armorSlot ?? requirement.subtypes.itemType;
    const readable = (value: string) => /^[A-Z_ ]+$/.test(value) ? `${value[0]}${value.slice(1).toLowerCase().replaceAll("_", " ")}` : value;
    if (subtype) text(subtype.name ? readable(subtype.name) : "Unresolved item type"); else reference(requirement.references.item, "Unresolved item");
    if (ownership === "Equipped") text(" equipped");
    else if (ownership !== undefined && ownership !== "Owned" && ownership !== "NotOwned") text(` (${ownership})`);
  } else if (requirement.type.name === "Region") text(["Region", requirement.subtypes.region?.name].filter(Boolean).join(" "));
  else if (requirement.type.name === "CombatState") text(requirement.flags.first ? "In combat" : "Out of combat");
  else {
    const target = Object.values(requirement.references).find((value) => value !== null);
    if (target) spans.push({ endpoint: target });
    else text(Object.values(requirement.subtypes).find((value) => value !== null)?.name ?? requirement.type.name);
    if (amount !== 0) text(` ${numberPhrase}`);
  }
  return spans;
}

function projectRequirement(refs: ReadonlyMap<string, CatalogEndpoint>, requirement: Record<string, unknown>): CatalogRequirement {
  const type = { value: typeof requirement.requirementTypeValue === "number" ? requirement.requirementTypeValue : -1, name: typeof requirement.requirementType === "string" ? requirement.requirementType : "Unknown" };
  const rule = { value: typeof requirement.conditionRuleValue === "number" ? requirement.conditionRuleValue : -1, name: typeof requirement.conditionRule === "string" ? requirement.conditionRule : "Unknown" };
  const projected: CatalogRequirement = {
    type, rule, label: "", spans: [],
    references: {
      ability: requirementEndpoint(refs, requirement, "abilityID", "abilities"), bonus: requirementEndpoint(refs, requirement, "bonusID", "bonuses"), recipe: requirementEndpoint(refs, requirement, "recipeID", "recipes"), resource: requirementEndpoint(refs, requirement, "resourceID", "resources"), effect: requirementEndpoint(refs, requirement, "effectID", "effects"), npc: requirementEndpoint(refs, requirement, "NPCID", "npcs"), stat: requirementEndpoint(refs, requirement, "statID", "stats"), faction: requirementEndpoint(refs, requirement, "factionID", "factions"), combo: requirementEndpoint(refs, requirement, "comboID", "combos"), race: requirementEndpoint(refs, requirement, "raceID", "races"), levels: requirementEndpoint(refs, requirement, "levelsID", "levels"), class: requirementEndpoint(refs, requirement, "classID", "classes"), species: requirementEndpoint(refs, requirement, "speciesID", "species"), item: requirementEndpoint(refs, requirement, "itemID", "items"), currency: requirementEndpoint(refs, requirement, "currencyID", "currencies"), point: requirementEndpoint(refs, requirement, "pointID", "points"), talentTree: requirementEndpoint(refs, requirement, "talentTreeID", "talentTrees"), skill: requirementEndpoint(refs, requirement, "skillID", "skills"), spellbook: requirementEndpoint(refs, requirement, "spellbookID", "spellbooks"), weaponTemplate: requirementEndpoint(refs, requirement, "weaponTemplateID", "weaponTemplates"), enchantment: requirementEndpoint(refs, requirement, "enchantmentID", "enchantments"), gearSet: requirementEndpoint(refs, requirement, "gearSetID", "gearSets"), gameScene: requirementEndpoint(refs, requirement, "gameSceneID", "scenes"), quest: requirementEndpoint(refs, requirement, "questID", "quests"), dialogue: requirementEndpoint(refs, requirement, "dialogueID", "dialogues"),
    },
    knowledge: requirementNamedValue(requirement.knowledge), state: requirementNamedValue(requirement.state), comparison: requirementNamedValue(requirement.comparison), value: requirementNamedValue(requirement.value), ownership: requirementNamedValue(requirement.ownership), itemCondition: requirementNamedValue(requirement.itemCondition), progression: requirementNamedValue(requirement.progression), entity: requirementNamedValue(requirement.entity), pointType: requirementNamedValue(requirement.pointType), dialogueNodeState: requirementNamedValue(requirement.dialogueNodeState), effectCondition: requirementNamedValue(requirement.effectCondition), amountType: requirementNamedValue(requirement.amountType), timeType: requirementNamedValue(requirement.timeType), timeValue: requirementNamedValue(requirement.timeValue), effectType: requirementNamedValue(requirement.effectType), questState: requirementNamedValue(requirement.questState),
    amounts: { primary: typeof requirement.amount1 === "number" ? requirement.amount1 : 0, secondary: typeof requirement.amount2 === "number" ? requirement.amount2 : 0, float: typeof requirement.float1 === "number" ? requirement.float1 : 0, isPercent: requirement.isPercent === true },
    flags: { consume: requirement.consume === true, first: requirement.boolBalue1 === true, second: requirement.boolBalue2 === true, third: requirement.boolBalue3 === true },
    subtypes: { effectTag: requirementEntry(requirement.effectTag), factionStance: requirementEntry(requirement.factionStance), itemType: requirementEntry(requirement.itemType), weaponType: requirementEntry(requirement.weaponType), weaponSlot: requirementEntry(requirement.weaponSlot), armorType: requirementEntry(requirement.armorType), armorSlot: requirementEntry(requirement.armorSlot), gender: requirementEntry(requirement.gender), npcFamily: requirementEntry(requirement.NPCFamily), region: requirementEntry(requirement.region) },
    dialogueNode: requirement.dialogueNode !== null && typeof requirement.dialogueNode === "object" && typeof (requirement.dialogueNode as Record<string, unknown>).nativeType === "string" && typeof (requirement.dialogueNode as Record<string, unknown>).text === "string" ? requirement.dialogueNode as { nativeType: string; text: string } : null,
    times: [requirementTime(requirement.timeRequirement1), requirementTime(requirement.timeRequirement2)],
  };
  projected.spans = requirementSpans(projected);
  projected.label = projected.spans.map((span) => "text" in span ? span.text : span.endpoint.label ?? span.endpoint.entityKey ?? "Unknown").join("");
  return projected;
}

function requirementIdentity(requirement: CatalogRequirement): string {
  const { label: _label, ...identity } = requirement;
  return JSON.stringify(identity);
}

function deduplicateRequirementGroups(groups: CatalogRequirementGroup[], seen = new Set<string>()): CatalogRequirementGroup[] {
  return groups.flatMap((group) => {
    const requirements = group.requirements.filter((requirement) => {
      const identity = requirementIdentity(requirement);
      if (seen.has(identity)) return false;
      seen.add(identity);
      return true;
    });
    if (requirements.length === 0) return [];
    const requiredCount = group.requiredCount === null ? null : Math.min(group.requiredCount, requirements.length);
    return [{ ...group, requiredCount, requirements }];
  });
}

function itemRequirementGroups(conditionById: ReadonlyMap<string, CatalogCondition>, conditionIds: string[], scope: "equipment" | "use", scalarLevel: number | null): CatalogRequirementGroup[] {
  const groups = deduplicateRequirementGroups(conditionIds.flatMap((id) => {
    const condition = conditionById.get(id);
    return condition?.scope === scope ? condition.requirements : [];
  }));
  if (scope !== "equipment" || scalarLevel === null || scalarLevel <= 0 || groups.some((group) => group.requirements.some((requirement) => requirement.type.name === "Level" && requirement.amounts.primary === scalarLevel))) return groups;
  const requirement = projectRequirement(new Map(), { requirementType: "Level", requirementTypeValue: 13, conditionRule: "Mandatory", conditionRuleValue: 0, amount1: scalarLevel, amount2: 0, float1: 0, consume: false, isPercent: false });
  return [...groups, { mode: "all", checkCount: false, requiredCount: null, requirements: [requirement] }];
}

function conditionRequirements(refs: ReadonlyMap<string, CatalogEndpoint>, payload: unknown): CatalogRequirementGroup[] {
  if (payload === null || typeof payload !== "object") return [];
  const root = payload as Record<string, unknown>, groups = Array.isArray(root.groups) ? root.groups : Array.isArray(root.requirements) ? [{ requirements: root.requirements }] : [];
  const result: CatalogRequirementGroup[] = [];
  for (const groupValue of groups) {
    if (groupValue === null || typeof groupValue !== "object") continue;
    const group = groupValue as Record<string, unknown>, values = Array.isArray(group.requirements) ? group.requirements : [];
    const requirements = values.flatMap((value) => value !== null && typeof value === "object" ? [projectRequirement(refs, value as Record<string, unknown>)] : []);
    if (requirements.length === 0) continue;
    const checkCount = group.checkCount === true, requiredCount = checkCount && typeof group.requiredCount === "number" && group.requiredCount > 0 ? group.requiredCount : null;
    result.push({ mode: requirements.some((requirement) => requirement.rule.name === "Optional") ? "any" : "all", checkCount, requiredCount, requirements });
  }
  return result;
}

// Each condition keeps its own requirements: a toggle's activation set and its inline set, or a spawner's template
// and inline groups, are separate rules that consumers select by condition ID. Consumers that combine several
// conditions of one owner, such as item requirement groups, remove repeats themselves.
export function queryConditions(db: Database): CatalogQueryResult<CatalogCondition[]> {
  const refs = entityEndpointIndex(db);
  const records = db.query<{ condition_id: string; semantics: string; scope: "equipment" | "use" | null; payload_json: string }, []>("SELECT condition_id, semantics, scope, payload_json FROM conditions ORDER BY condition_id").all().flatMap((row) => {
    const payload = parse(row.payload_json);
    if (row.semantics === "inline-requirements" && payload !== null && typeof payload === "object" && "groups" in payload && Array.isArray(payload.groups) && payload.groups.length === 0) return [];
    const requirements = deduplicateRequirementGroups(conditionRequirements(refs, payload));
    const sourceName = payload !== null && typeof payload === "object" && "sourceName" in payload && typeof payload.sourceName === "string" && payload.sourceName.length > 0 ? payload.sourceName : null;
    const label = requirements.flatMap((group) => group.requirements.map((requirement) => requirement.label).join(group.mode === "any" ? " or " : " and ")).join(", ");
    return [{ conditionId: row.condition_id, semantics: row.semantics, scope: row.scope, label: (sourceName ?? label) || row.semantics, requirements }];
  });
  return { ...identity(db), records };
}

export function queryCatalogRelations(db: Database): CatalogQueryResult<CatalogRelations> {
  return { ...identity(db), records: { drops: queryDropRows(db).records, vendors: queryVendorRows(db).records, gathers: queryGatherRows(db).records, containers: queryContainerRows(db).records, interactions: queryInteractionRows(db).records, quests: queryQuestRows(db).records, recipes: queryRecipeRows(db).records, placements: queryContainment(db).records, transitions: queryTransitions(db).records, conditions: queryConditions(db).records, gatedSources: queryGatedSources(db).records } };
}
