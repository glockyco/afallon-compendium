import type { Database } from "bun:sqlite";
import { Assert, AssertError } from "typebox/value";
import { ArtifactStore, type ObjectWriteProtection } from "@afallon/artifacts";
import { queryCatalogEntities, queryCatalogFacts, queryCatalogFullEntities, queryCatalogRelations, queryChallengeStoneRoutes, queryQuestRewardTypes, querySpawnCandidateNpcs, queryWorldLootTables } from "@afallon/catalog";
import {
  PUBLICATION_DOCUMENT_BUDGET,
  STATIC_DOCUMENT_SCHEMA_IDS,
  STATIC_DOCUMENT_SCHEMAS,
  StaticKindListSchema,
  StaticSearchIndexSchema,
  artEdges,
  type EntityRef,
  type HeroicConsoleLocation,
  type PublicLevel,
  type PublicGatheringNode,
  type PublicDocument,
  type PublicItem,
  type PublicNpc,
  type PublicPlace,
  type PublicQuest,
  type PublicSkill,
  type PublicSearchEntry,
  type StaticDocument,
  type PublicationExclusion,
  type PublicationEffectDisplayName,
  type StaticKindList,
  type StaticCoverage,
  type StaticSearchIndex,
} from "@afallon/contracts/public";
import { generateArtworkResources } from "./artwork";
import { corruptionRewards } from "./corruption-rewards";
import { readerCoverage } from "./coverage";
import { usableTeleports } from "./connections";
import { projectPublicDocuments } from "./documents";
import { mergeEquivalentEffects } from "./duplicate-effects";
import { startingGearByItem } from "./documents/classes";
import { conditionsById, type EffectWorldCheck, type EffectWorldSource, type PublishedPlacement, requirementsFor } from "./documents/projection";
import { projectGatheringNodeDocuments } from "./gathering";
import { projectChallengeStoneUses, projectMechanicsDocuments } from "./mechanics";
import { assertExclusionEvidence, withoutExcludedRelations } from "./exclusions";
import { PUBLIC_KIND_REGISTRY } from "./kind-registry";
import { buildKindLists } from "./lists";
import { buildEntityReferences, createReferenceResolver } from "./references";
import { partitionStaticRecords, writeStaticJson, type GeneratedStaticResource } from "./resources";
import type { PublicationCandidateAsset } from "./selection";
import type { MapExtent } from "./map-shards";
import { levelUnion } from "./levels";
import type { PlaceVariant } from "./place-variants";
import { displayName } from "./text";
import { categoryLabel } from "@afallon/contracts/public";
import { auditPublicTooltipCoverage } from "./tooltip-coverage";

/** Raw catalog relationships not covered by the standard placement and item-source projections. */
export function recoveredSourceEvidence(db: Database, roster: ReadonlySet<string>) {
  const starting = new Map<string, string[]>();
  for (const row of db.query<{ itemKey: string; npcKey: string }, []>(`
    SELECT item_entity_key AS itemKey, json_extract(context_json, '$.ownerEntityKey') AS npcKey
    FROM item_sources WHERE source_kind = 'npc-start-item' ORDER BY item_entity_key, source_key
  `).all()) {
    if (!roster.has(row.npcKey)) continue;
    const owners = starting.get(row.itemKey) ?? [];
    if (!owners.includes(row.npcKey)) owners.push(row.npcKey);
    starting.set(row.itemKey, owners);
  }
  const spawners = new Map<string, string[]>();
  for (const row of db.query<{ npcKey: string; sceneId: number }, []>(`
    SELECT DISTINCT c.npc_entity_key AS npcKey, p.scene_native_id AS sceneId
    FROM spawn_candidates c JOIN source_identities s ON s.source_id = c.source_id
      JOIN placements p ON p.placement_id = s.placement_id
    WHERE c.npc_entity_key IS NOT NULL AND s.type_name LIKE '%NPCSpawner%'
    ORDER BY c.npc_entity_key, p.scene_native_id
  `).all()) {
    const scenes = spawners.get(row.npcKey) ?? [];
    scenes.push(`scenes:${row.sceneId}`);
    spawners.set(row.npcKey, scenes);
  }
  const lootBindings = db.query<{ tableId: number; sourceKey: string | null; world: number }, []>(`
    SELECT loot_table_id AS tableId, owner_entity_key AS sourceKey, (context = 'world') AS world
    FROM loot_bindings ORDER BY loot_table_id, owner_entity_key
  `).all().map((row) => ({ tableId: row.tableId, sourceKey: row.sourceKey, world: row.world === 1 }));
  return { adventurerStartingItems: starting, npcSpawnerScenes: spawners, lootBindings };
}

/** World effect actions include nested game actions, which the general relation query does not expose. */
function worldEffectSources(db: Database): EffectWorldSource[] {
  const rows = db.query<{ effectId: number; family: string; sceneId: number; placementId: string; sourceId: string; label: string | null }, []>(`
    SELECT DISTINCT CAST(j.atom AS INTEGER) AS effectId, d.family, p.scene_native_id AS sceneId,
      d.placement_id AS placementId, d.source_id AS sourceId,
      COALESCE(json_extract(d.data_json, '$.interactableName'), json_extract(d.data_json, '$.chestName')) AS label
    FROM source_details d JOIN placements p ON p.placement_id = d.placement_id,
      json_tree(d.data_json) j
    WHERE j.key = 'nativeId' AND j.type = 'integer' AND j.path LIKE '$.actions%'
      AND (j.path LIKE '%.effect' OR j.path LIKE '%.effectTeleport')
      AND j.atom >= 0
    ORDER BY effectId, sourceId, placementId
  `).all();
  const bySource = new Map<string, EffectWorldSource>();
  for (const row of rows) {
    // A world source can have several placements. Count its effect action once in a place.
    const key = `${row.effectId}\u0000${row.sourceId}\u0000${row.sceneId}`;
    const source = bySource.get(key) ?? { effectKey: `effects:${row.effectId}`, sourceId: row.sourceId, family: row.family,
      place: { entityKey: `scenes:${row.sceneId}`, label: `Scene ${row.sceneId}` },
      placementIds: [], label: row.label };
    if (!source.placementIds.includes(row.placementId)) source.placementIds.push(row.placementId);
    bySource.set(key, source);
  }
  const invites = db.query<{ entityKey: string; name: string | null; effectId: number }, []>(`
    SELECT d.entity_key AS entityKey, e.name,
      CAST(json_extract(d.detail_json, '$.publicData.gameplay.inviteEffectId') AS INTEGER) AS effectId
    FROM entity_details d JOIN canonical_entities e ON e.entity_key = d.entity_key
    WHERE d.entity_key LIKE 'npcs:%'
      AND json_type(d.detail_json, '$.publicData.gameplay.inviteEffectId') = 'integer'
      AND json_extract(d.detail_json, '$.publicData.gameplay.inviteEffectId') >= 0
  `).all();
  for (const { entityKey, name, effectId } of invites) {
    bySource.set(`invite\u0000${entityKey}`, { effectKey: `effects:${effectId}`, sourceId: entityKey, family: "npcInvitation",
      place: { entityKey, label: name ?? entityKey }, placementIds: [], label: name });
  }
  return [...bySource.values()];
}

/** A typed console's observed zone names its place; its catalog placement supplies the map spot. */
function heroicConsoleLocations(db: Database, placements: ReadonlyMap<string, PublishedPlacement>, refs: ReadonlyMap<string, EntityRef>): HeroicConsoleLocation[] {
  const observations = db.query<{ placementId: string; zoneName: string | null }, []>(`
    SELECT DISTINCT d.placement_id AS placementId,
      json_extract(d.data_json, '$.source.source.hierarchyNodes[1].name') AS zoneName,
      json_extract(d.data_json, '$.source.source.hierarchyNodes[1].siblingIndex') AS zoneOrder
    FROM source_details d JOIN placements p ON p.placement_id = d.placement_id
    WHERE d.family = 'heroicConsole'
      AND json_extract(d.data_json, '$.source.sourceScene.nativeId') = p.scene_native_id
    ORDER BY zoneOrder, placementId
  `).all();
  const zones = new Map<string, EntityRef[]>();
  for (const ref of refs.values()) if (ref.kind === "places") {
    const name = displayName(ref.name);
    zones.set(name, [...zones.get(name) ?? [], ref]);
  }
  const locations: HeroicConsoleLocation[] = [];
  for (const { placementId, zoneName } of observations) {
    const spot = placements.get(placementId);
    if (!spot || !spot.categories.includes("heroicConsole")) continue;
    const places = zoneName === null ? [] : zones.get(displayName(zoneName)) ?? [];
    if (places.length !== 1) throw new Error(`Heroic Console ${placementId} does not have one published place for its scanned zone.`);
    locations.push({ place: places[0]!, spot: { placementId: spot.placementId, mapSpaceId: spot.mapSpaceId, label: spot.label } });
  }
  return locations;
}

/** Keep world-only requirement owners grouped by their recorded scene or source, not by raw occurrence. */
function worldEffectChecks(db: Database): EffectWorldCheck[] {
  const place = (id: number): EffectWorldCheck["place"] => ({ entityKey: `scenes:${id}`, label: `Scene ${id}` });
  const result: EffectWorldCheck[] = [];
  const world = db.query<{ conditionId: string; ownerKey: string }, []>(
    "SELECT condition_id AS conditionId, owner_key AS ownerKey FROM conditions WHERE owner_type = 'world-source' ORDER BY condition_id",
  ).all();
  for (const row of world) {
    const scene = row.ownerKey.match(/:build-scene:(\d+):([^:]+):/);
    result.push({ conditionId: row.conditionId, sourceId: row.ownerKey,
      family: scene?.[2] ?? "World Interaction", place: scene ? place(Number(scene[1])) : null });
  }
  const sources = db.query<{ conditionId: string; sourceId: string; family: string | null; sceneId: number }, []>(`
    SELECT DISTINCT c.condition_id AS conditionId, s.source_id AS sourceId,
      (SELECT d.family FROM source_details d WHERE d.source_id = s.source_id ORDER BY d.detail_id LIMIT 1) AS family,
      p.scene_native_id AS sceneId
    FROM conditions c JOIN source_identities s ON s.source_id = substr(c.owner_key, 8)
      JOIN placements p ON p.placement_id = s.placement_id
    WHERE c.owner_type = 'source'
  `).all();
  for (const row of sources) result.push({ conditionId: row.conditionId, sourceId: row.sourceId,
    family: row.family ?? "World Interaction", place: place(row.sceneId) });
  return result;
}

export interface GeneratedIndexResources {
  refs: ReadonlyMap<string, EntityRef>;
  documents: ReadonlyMap<string, GeneratedStaticResource<StaticDocument>>;
  lists: ReadonlyMap<string, GeneratedStaticResource<StaticKindList>[]>;
  search: GeneratedStaticResource<StaticSearchIndex>[];
  artwork: PublicationCandidateAsset[];
  coverage: Pick<StaticCoverage, "pages" | "gaps">;
  publicationIssues: string[];
}

function assertSameIdentity(expected: { buildId: string; catalogId: string }, actual: { buildId: string; catalogId: string }, subject: string): void {
  if (actual.buildId !== expected.buildId || actual.catalogId !== expected.catalogId) throw new Error(`${subject} query identity does not match the entity query.`);
}

function searchLevel(document: PublicDocument): PublicSearchEntry["level"] {
  switch (document.ref.kind) {
    case "items": return (document as PublicItem).facts.levelRequirement;
    case "npcs": {
      const level = (document as PublicNpc).facts.level;
      return level === undefined || level.max === undefined ? undefined : level.min === level.max ? level.min : { min: level.min, max: level.max };
    }
    case "quests": {
      const facts = (document as PublicQuest).facts;
      return facts.levelRange ?? facts.levelRequirement;
    }
    case "places": return (document as PublicPlace).facts.levelRange;
    default: return undefined;
  }
}

function itemSourceKinds(document: PublicDocument): string[] {
  if (document.ref.kind !== "items") return [];
  const item = document as PublicItem;
  return [item.droppedBy.length > 0 ? "drop" : null, item.soldBy.length > 0 ? "vendor" : null,
    item.gatheredFrom.length > 0 ? "gather" : null, item.inContainers.length > 0 ? "container" : null,
    item.collectedFrom.length > 0 ? "interaction" : null, item.rewardedBy.length > 0 ? "quest" : null,
    item.crafting ? "recipe" : null, item.startingGearOf.length > 0 ? "startingGear" : null].filter((value): value is string => value !== null);
}
/** Other names that find a craft or an enchanting item through its item page. */
export function searchAliases(document: PublicDocument): string[] {
  if (document.ref.kind === "items") {
    const item = document as PublicItem;
    return [...new Set([item.crafting?.recipe.name, item.facts.enchanting && item.facts.enchantment?.key !== null ? item.facts.enchantment?.name : undefined]
      .filter((name): name is string => Boolean(name && name !== document.ref.name)))];
  }
  return document.ref.kind === "skills" ? (document as PublicSkill).recipes.filter((row) => !row.product || row.product.key === null || !row.product.slug).map((row) => row.recipe.name) : [];
}

// The weapon types of a class come from its entity gameplay, as the game names them: "One handed sword" reads "One
// Handed Sword".
function classWeapons(details: readonly { entityKey: string; kind: string; publicData: { gameplay: unknown } }[]): ReadonlyMap<string, readonly string[]> {
  const result = new Map<string, string[]>();
  for (const detail of details) {
    if (detail.kind !== "classes") continue;
    const gameplay = detail.publicData.gameplay, list = gameplay !== null && typeof gameplay === "object" && "allowedWeaponTypes" in gameplay && Array.isArray(gameplay.allowedWeaponTypes) ? gameplay.allowedWeaponTypes : [];
    result.set(detail.entityKey, list.flatMap((row: unknown) => row !== null && typeof row === "object" && "name" in row && typeof row.name === "string" && row.name ? [categoryLabel(row.name)] : []));
  }
  return result;
}
/** Publish both ends of a Heart stone route without treating its host scene as a destination. */
export function attachChallengeStonePages(documents: Map<string, PublicDocument>, heartKey: string | null,
  uses: PublicItem["challengeStoneUses"]): void {
  if (!heartKey || !uses) return;
  const heart = documents.get(heartKey);
  if (!heart || heart.ref.kind !== "items") throw new Error(`Heart has no published item page: ${heartKey}.`);
  documents.set(heartKey, { ...heart, challengeStoneUses: uses });
  for (const use of uses) {
    if (!use.spot || !use.stoneName || !use.regionName) continue;
    for (const destination of use.destinations) {
      const place = documents.get(destination.key);
      if (!place || place.ref.kind !== "places") throw new Error(`Challenge destination has no published place page: ${destination.key}.`);
      const placeDoc = place as PublicPlace;
      const start: NonNullable<PublicPlace["challengeStoneStart"]> = {
        heart: heart.ref, stoneName: use.stoneName, regionName: use.regionName, spot: use.spot, count: use.count,
      };
      if (placeDoc.challengeStoneStart && (placeDoc.challengeStoneStart.spot.placementId !== use.spot.placementId
        || placeDoc.challengeStoneStart.count !== use.count)) throw new Error(`Challenge destination has conflicting stone routes: ${destination.key}.`);
      documents.set(destination.key, { ...placeDoc, challengeStoneStart: start });
    }
  }
}


export async function generateIndexResources(
  db: Database,
  store: ArtifactStore,
  placements: ReadonlyMap<string, PublishedPlacement>,
  placementIdsByKey: ReadonlyMap<string, readonly string[]>,
  regionIdsByMapSpace: ReadonlyMap<string, readonly string[]>,
  npcLevels: ReadonlyMap<string, ReadonlyMap<string, PublicLevel>>,
  mapExtents: ReadonlyMap<string, MapExtent>,
  exclusions: readonly PublicationExclusion[],
  protection?: ObjectWriteProtection,
  placeVariants: ReadonlyMap<string, PlaceVariant> = new Map(),
  overworldMapSpaceIds: ReadonlySet<string> = new Set(),
  effectDisplayNames: readonly PublicationEffectDisplayName[] = [],
): Promise<GeneratedIndexResources> {
  const entities = queryCatalogEntities(db), facts = queryCatalogFacts(db), catalogRelations = queryCatalogRelations(db);
  assertSameIdentity(entities, facts, "Fact");
  assertSameIdentity(entities, catalogRelations, "Relation");
  // Place names and place pages read only the teleports that a player can use.
  const usable = { ...catalogRelations.records, transitions: usableTeleports(catalogRelations.records.transitions, mapExtents) };
  // No page shows a row for an excluded record, and excluded records take no part in names.
  const excluded = new Set(exclusions.map((exclusion) => exclusion.key));
  const relations = { ...catalogRelations, records: withoutExcludedRelations(usable, excluded) };
  const identity = { buildId: entities.buildId, catalogId: entities.catalogId };
  // Talent bonuses are not entities, but class pages show their icons.
  const bonusArtwork = facts.records.progression.facts.flatMap((fact) => fact.kind === "bonuses" && fact.artwork?.length ? [{ entityKey: fact.entityKey, artwork: fact.artwork }] : []);
  const effectWorldSources = worldEffectSources(db);
  const artwork = await generateArtworkResources(store, [...entities.records, ...bonusArtwork], protection);
  const levelsByRecord = new Map<string, PublicLevel[]>();
  for (const levels of npcLevels.values()) for (const [key, level] of levels) levelsByRecord.set(key, [...levelsByRecord.get(key) ?? [], level]);
  const spawnedLevels = new Map([...levelsByRecord].map(([key, levels]) => [key, levelUnion(levels)!] as const));
  const effectWorldChecks = worldEffectChecks(db);
  const references = buildEntityReferences(entities.records, { facts: facts.records, relations: relations.records, artByEntity: artwork.artByEntity, excluded,
    npcLevels: spawnedLevels, effectWorldSources, effectDisplayNames });
  const refs = new Map(references.refs);
  const publishedKeys = new Set(refs.keys());
  // Each exclusion must still hold in this catalog, so the check reads the relations before exclusion.
  const spawnCandidates = querySpawnCandidateNpcs(db);
  assertSameIdentity(entities, spawnCandidates, "Spawn candidate");
  assertExclusionEvidence(exclusions, { entities: entities.records, facts: facts.records, relations: usable, spawnCandidates: new Set(spawnCandidates.records), startingGear: startingGearByItem(entities.records, facts.records, refs), placementIdsByKey, excluded,
    lootItemKeys: new Set((db.query("SELECT DISTINCT e.item_entity_key AS itemKey FROM loot_entries e JOIN loot_bindings b ON b.loot_table_id = e.loot_table_id").all() as Array<{ itemKey: string }>).map((row) => row.itemKey)) });
  const catalogPlacements = new Map(relations.records.placements.map((placement) => [placement.placementId, placement]));
  const publishedPlacements = new Map([...placements].map(([placementId, placement]) => {
    const catalogPlacement = catalogPlacements.get(placementId), scene = catalogPlacement ? refs.get(catalogPlacement.sceneKey) : undefined;
    const area = displayName(catalogPlacement?.area ?? "");
    return [placementId, area ? { ...placement, label: area } : scene?.kind === "places" ? { ...placement, label: scene.name } : placement] as const;
  }));
  const consoleLocations = heroicConsoleLocations(db, publishedPlacements, refs);
  const heroicConsolesByPlace = new Map<string, HeroicConsoleLocation["spot"][]>();
  for (const { place, spot } of consoleLocations) heroicConsolesByPlace.set(place.key, [...heroicConsolesByPlace.get(place.key) ?? [], spot]);
  const conditions = conditionsById(relations.records.conditions), resolve = createReferenceResolver(refs);
  const nodeDocuments = projectGatheringNodeDocuments(facts.records, relations.records, { resolve, conditions, placements: publishedPlacements,
    requirements: (conditionIds) => requirementsFor(conditionIds, conditions, resolve) });
  const stoneRoutes = queryChallengeStoneRoutes(db, facts.records.corruption?.heartRequirements?.map((row) => row.sourceId) ?? []);
  const bossDropTables = new Map<string, Set<number>>();
  for (const binding of db.query("SELECT owner_entity_key, loot_table_id FROM loot_bindings WHERE context = 'npc'").all() as Array<{ owner_entity_key: string; loot_table_id: number }>) {
    const tables = bossDropTables.get(binding.owner_entity_key) ?? new Set<number>();
    tables.add(binding.loot_table_id);
    bossDropTables.set(binding.owner_entity_key, tables);
  }
  const rewards = facts.records.corruption
    ? corruptionRewards(facts.records.corruption, facts.records,
      db.query("SELECT loot_table_id AS lootTableId, item_entity_key AS itemKey FROM loot_entries")
        .all() as Array<{ lootTableId: number; itemKey: string }>, bossDropTables, publishedKeys, resolve)
    : undefined;
  const stoneUses = projectChallengeStoneUses(facts.records, publishedKeys, resolve, catalogRelations.records.transitions, publishedPlacements, stoneRoutes);
  const challengeStones = new Map((stoneUses ?? []).flatMap((use) => use.spot ? use.destinations.map((destination) => [destination.key, use.spot!] as const) : []));
  const recovery = recoveredSourceEvidence(db, new Set(facts.records.adventurerInviteEffects.map((row) => row.adventurer.entityKey).filter((key): key is string => key !== null)));
  const entityDocuments = projectPublicDocuments({ entities: entities.records, facts: facts.records, relations: relations.records, references,
    resolve, artByEntity: artwork.artByEntity, placements: publishedPlacements, regionIdsByMapSpace, npcLevels, placementIdsByKey, excluded, placeVariants, heroicConsolesByPlace,
    classWeapons: classWeapons(queryCatalogFullEntities(db).records), corruptionRewards: rewards, overworldMapSpaceIds, challengeStones,
    worldLootTables: queryWorldLootTables(db).records, effectWorldSources, effectWorldChecks, ...recovery });
  const publicDocuments = new Map<string, PublicDocument>([...entityDocuments, ...projectMechanicsDocuments(facts.records, publishedKeys, spawnedLevels, resolve, conditions, entityDocuments, bossDropTables, rewards, consoleLocations), ...nodeDocuments]);
  attachChallengeStonePages(publicDocuments, facts.records.corruption?.heart?.entityKey ?? null, stoneUses);
  mergeEquivalentEffects(publicDocuments, refs);

  const documents = new Map<string, GeneratedStaticResource<StaticDocument>>();
  for (const [key, document] of publicDocuments) {
    if (!document.ref.slug || !Object.hasOwn(STATIC_DOCUMENT_SCHEMA_IDS, document.ref.kind)) throw new Error(`Document has no registered page kind: ${key}.`);
    const kind = document.ref.kind as keyof typeof STATIC_DOCUMENT_SCHEMA_IDS;
    const schemaVersion = STATIC_DOCUMENT_SCHEMA_IDS[kind];
    const value = { schemaVersion, ...identity, kind, document } as StaticDocument;
    try {
      Assert(STATIC_DOCUMENT_SCHEMAS[schemaVersion], value);
    } catch (error) {
      if (error instanceof AssertError) throw new Error(`Invalid publication document ${key}: ${JSON.stringify([...error.cause.errors].slice(0, 5))}`, { cause: error });
      throw error;
    }
    const resource = await writeStaticJson<StaticDocument>(store, schemaVersion, value, protection);
    if (resource.identity.bytes > PUBLICATION_DOCUMENT_BUDGET) throw new Error(`Publication document ${key} is ${resource.identity.bytes} bytes, exceeding its ${PUBLICATION_DOCUMENT_BUDGET}-byte budget.`);
    documents.set(key, resource);
  }

  const schemaIdByKey = new Map([...documents].map(([key, resource]) => [key, resource.reference.schemaId]));
  const publicationIssues = auditPublicTooltipCoverage(facts.records, relations.records, publicDocuments, schemaIdByKey, excluded);

  const listValues = buildKindLists(identity, PUBLIC_KIND_REGISTRY, publicDocuments, facts.records, refs, excluded, queryQuestRewardTypes(db).records);
  const lists = new Map<string, GeneratedStaticResource<StaticKindList>[]>();
  for (const [kind, values] of listValues) {
    const resources: GeneratedStaticResource<StaticKindList>[] = [];
    for (const value of values) {
      Assert(StaticKindListSchema, value);
      resources.push(await writeStaticJson(store, value.schemaVersion, value, protection));
    }
    lists.set(kind, resources);
  }

  const listRowsByKey = new Map([...listValues.values()].flatMap((parts) => parts.flatMap((list) => list.rows.map((row) => [row.ref.key, row] as const))));
  const entries: PublicSearchEntry[] = [];
  for (const [key, document] of publicDocuments) {
    const registry = PUBLIC_KIND_REGISTRY.find((entry) => entry.kind === document.ref.kind);
    const resource = documents.get(key);
    if (!registry?.searchable || !resource) continue;
    const level = searchLevel(document);
    const placementIds = [...new Set(placementIdsByKey.get(key) ?? [])].filter((placementId) => placements.has(placementId));
    const sceneKeys = new Set(placementIds.map((placementId) => catalogPlacements.get(placementId)?.sceneKey).filter((sceneKey): sceneKey is string => sceneKey !== undefined && refs.get(sceneKey)?.kind === "places"));
    const onlySceneKey = sceneKeys.size === 1 ? sceneKeys.values().next().value : undefined;
    const place = onlySceneKey === undefined ? (sceneKeys.size > 1 ? `${sceneKeys.size} places` : undefined) : refs.get(onlySceneKey)?.name;
    const aliases = searchAliases(document);
    entries.push({ ref: document.ref, ...(aliases.length ? { aliases } : {}), ...(level === undefined ? {} : { level }), ...(place ? { place } : {}),
      hasPlacements: placementIds.length > 0 || document.ref.kind === "gatheringNodes" && (document as PublicGatheringNode).spotCount > 0,
      sourceKinds: listRowsByKey.get(key)?.facets.sourceKind ?? itemSourceKinds(document),
      document: resource.reference as PublicSearchEntry["document"],
    });
  }
  const search: GeneratedStaticResource<StaticSearchIndex>[] = [];
  for (const value of partitionStaticRecords(entries, (partEntries, part): StaticSearchIndex => ({ schemaVersion: "compendium.static-search.v6", ...identity, part, entries: partEntries }))) {
    Assert(StaticSearchIndexSchema, value);
    search.push(await writeStaticJson(store, value.schemaVersion, value, protection));
  }

  const usedArtwork = new Set([...publicDocuments.values()].flatMap((document) => artEdges(document).map((art) => art.url)));
  const assets = [...usedArtwork].map((path) => {
    const asset = artwork.assetsByPath.get(path);
    if (!asset) throw new Error(`Document artwork has no publication asset: ${path}.`);
    return asset;
  }).sort((left, right) => left.path.localeCompare(right.path));
  return { refs, documents, lists, search, artwork: assets, coverage: readerCoverage(publicDocuments.values(), facts.records), publicationIssues };
}
