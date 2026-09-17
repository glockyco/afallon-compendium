import { createHash } from "node:crypto";
import type { Canonical, LootRules, NpcProducersInput, PlacementIdentityResult, PlacementSnapshot, Relationships, WorldSources, MapGeometry, SpatialResolution } from "@afallon/contracts";
import type { ArtifactReference, NormalizedCondition, NormalizedDatabaseInput, NormalizedEntity, ItemSource, NormalizedPlacement, NormalizedRegion, NormalizedRegionGeometry, NormalizedPatrolPath, NormalizedSource, NormalizedSourceDetail, NormalizedSceneSpawn, NormalizedSpawnCandidate, EntityDetail, CategoryMetadata, CatalogCoverageState, PlacementRoles } from "@afallon/contracts/catalog";
import { entityKey, publicEntityDetails, stableJson } from "@afallon/contracts/catalog";
import { hashRelation } from "./database";
import { record, integerOrNull, numberOrNull, sorted, compareText, type JsonRecord } from "./context";
export function entityDetails(entities: NormalizedEntity[], roles: NormalizedDatabaseInput["roles"], itemSources: ItemSource[], conditions: NormalizedCondition[], relationData: { merchantBindings: JsonRecord[]; merchantStock: JsonRecord[]; lootBindings: JsonRecord[]; lootEntries: JsonRecord[]; resourceYields: JsonRecord[]; questAssociations: JsonRecord[]; transitions: JsonRecord[] }): EntityDetail[] {
  const merchantOwners = new Map<number, number[]>();
  const enabledMerchants = new Set<number>(), enabledQuestGivers = new Set<number>();
  for (const entity of entities) if (entity.kind === "npcs") {
    const gameplay = record(entity.publicData.gameplay);
    if (gameplay?.isMerchant === true) enabledMerchants.add(entity.nativeId);
    if (gameplay?.isQuestGiver === true) enabledQuestGivers.add(entity.nativeId);
  }
  for (const row of relationData.merchantBindings) { const tableId = integerOrNull(row.merchantTableID); const ownerId = integerOrNull(row.ownerNativeId); if (tableId !== null && ownerId !== null && enabledMerchants.has(ownerId)) merchantOwners.set(tableId, [...(merchantOwners.get(tableId) ?? []), ownerId]); }
  const rolesByNpc = new Map<number, NormalizedDatabaseInput["roles"]>();
  for (const role of roles) if (role.npcId !== null) { const rows = rolesByNpc.get(role.npcId) ?? []; rows.push(role); rolesByNpc.set(role.npcId, rows); }
  const itemsById = new Map(itemSources.map((row) => [row.itemId, row]));
  const relationIndex = (rows: JsonRecord[], keys: (row: JsonRecord) => string[]) => {
    const index = new Map<string, JsonRecord[]>();
    for (const row of rows) for (const key of new Set(keys(row))) { const bucket = index.get(key) ?? []; bucket.push(row); index.set(key, bucket); }
    return index;
  };
  const merchantStockIndex = relationIndex(relationData.merchantStock, (row) => [`items:${row.itemID}`, `currencies:${row.currencyID}`, ...(merchantOwners.get(Number(row.merchantTableID)) ?? []).map((id) => `npcs:${id}`)]);
  const lootBindingsIndex = relationIndex(relationData.lootBindings, (row) => row.ownerNativeId === null ? [] : [`npcs:${row.ownerNativeId}`]);
  const lootOwners = new Map<number, string[]>();
  for (const row of relationData.lootBindings) if (typeof row.ownerNativeId === "number" && typeof row.lootTableID === "number") { const owners = lootOwners.get(row.lootTableID) ?? []; owners.push(`npcs:${row.ownerNativeId}`); lootOwners.set(row.lootTableID, owners); }
  const lootEntriesIndex = relationIndex(relationData.lootEntries, (row) => [`items:${row.itemID}`, ...(lootOwners.get(Number(row.lootTableID)) ?? [])]);
  const resourcesIndex = relationIndex(relationData.resourceYields, (row) => [`items:${row.itemID}`, `resources:${row.resourceID}`]);
  const questsIndex = relationIndex(relationData.questAssociations, (row) => [`npcs:${row.ownerNativeId}`, `quests:${row.questID}`, `tasks:${row.taskID}`, `items:${row.itemID}`]);
  const transitionsIndex = relationIndex(relationData.transitions, (row) => [`scenes:${row.sourceSceneNativeId}`, `scenes:${row.destinationSceneNativeId}`]);
  const merchantBindingsIndex = relationIndex(relationData.merchantBindings, (row) => [`npcs:${row.ownerNativeId}`]);
  const conditionsByOwner = new Map<string, NormalizedCondition[]>();
  const conditionsById = new Map(conditions.map((row) => [row.conditionId, row]));
  for (const condition of conditions) { const rows = conditionsByOwner.get(condition.ownerKey) ?? []; rows.push(condition); conditionsByOwner.set(condition.ownerKey, rows); }
  const result = entities.map((entity) => {
    const entityRoles = entity.kind === "npcs" ? rolesByNpc.get(entity.nativeId) ?? [] : [];
    const placementIds = [...new Set(entityRoles.map((row) => row.placementId))].sort(compareText);
    const sourceIds = new Set(entityRoles.map((row) => row.sourceId));
    const indexedSources = (entity.kind === "items" ? itemsById.get(entity.nativeId) : undefined)?.sources.map((source) => ({ sourceKind: source.sourceKind, sourceKey: source.sourceKey, placementIds: source.placementIds, conditionIds: source.conditionIds, context: source.context })) ?? [];
    const roleSources = entityRoles.map((role) => ({ sourceKind: "placement-role", sourceKey: `${role.placementId}:${role.sourceId}:${role.role}`, placementIds: [role.placementId], conditionIds: [], context: { role: role.role, scope: role.scope } }));
    const sources = [...indexedSources, ...roleSources];
    const merchantStock = (merchantStockIndex.get(entity.entityKey) ?? []).flatMap((row) => { const tableId = integerOrNull(row.merchantTableID); const owners = tableId === null ? [] : [...new Set(merchantOwners.get(tableId) ?? [])]; const itemId = integerOrNull(row.itemID); const currencyId = integerOrNull(row.currencyID); if (owners.length === 0 || (entity.kind === "items" && itemId !== entity.nativeId) || (entity.kind === "currencies" && currencyId !== entity.nativeId) || (entity.kind === "npcs" && !owners.includes(entity.nativeId)) || !["items", "currencies", "npcs"].includes(entity.kind)) return []; return [{ merchantTableId: tableId, stockIndex: integerOrNull(row.stockIndex), itemId, currencyId, cost: numberOrNull(row.cost), ownerNativeIds: owners }]; });
    const lootBindings = (lootBindingsIndex.get(entity.entityKey) ?? []).flatMap((row) => { const ownerId = integerOrNull(row.ownerNativeId); if (entity.kind !== "npcs" || ownerId !== entity.nativeId) return []; return [{ context: row.context === "world" ? "world" as const : "npc" as const, ownerNativeId: ownerId, lootTableId: integerOrNull(row.lootTableID), bindingIndex: integerOrNull(row.bindingIndex), rawRate: numberOrNull(row.dropRate), conditionId: typeof row.conditionId === "string" ? row.conditionId : null }]; });
    const ownedLootTables = new Set(lootBindings.map((row) => row.lootTableId));
    const lootEntries = (lootEntriesIndex.get(entity.entityKey) ?? []).flatMap((row) => { const itemId = integerOrNull(row.itemID); const tableId = integerOrNull(row.lootTableID); if ((entity.kind !== "items" || itemId !== entity.nativeId) && !ownedLootTables.has(tableId)) return []; return [{ lootTableId: tableId, entryIndex: integerOrNull(row.entryIndex), itemId, min: numberOrNull(row.min), max: numberOrNull(row.max), rawRate: numberOrNull(row.dropRate) }]; });
    const resourceYields = (resourcesIndex.get(entity.entityKey) ?? []).flatMap((row) => { const itemId = integerOrNull(row.itemID); const resourceId = integerOrNull(row.resourceID); if ((entity.kind !== "items" || itemId !== entity.nativeId) && (entity.kind !== "resources" || resourceId !== entity.nativeId)) return []; return [{ yieldId: String(row.yieldId), sourceId: typeof row.sourceId === "string" ? row.sourceId : null, resourceId, itemId, rank: integerOrNull(row.rank), min: integerOrNull(row.min), max: integerOrNull(row.max) }]; });
    const questAssociations = (questsIndex.get(entity.entityKey) ?? []).flatMap((row) => { const ownerId = integerOrNull(row.ownerNativeId); if (row.associationKind === "npc-quest" && (ownerId === null || !enabledQuestGivers.has(ownerId))) return []; const questId = integerOrNull(row.questID); const taskId = integerOrNull(row.taskID); const itemId = integerOrNull(row.itemID); if ((entity.kind !== "npcs" || ownerId !== entity.nativeId) && (entity.kind !== "quests" || questId !== entity.nativeId) && (entity.kind !== "tasks" || taskId !== entity.nativeId) && (entity.kind !== "items" || itemId !== entity.nativeId)) return []; return [{ associationId: String(row.associationId), associationKind: String(row.associationKind), ownerNativeId: ownerId, questId, taskId, itemId, context: row }]; });
    const transitions = (transitionsIndex.get(entity.entityKey) ?? []).flatMap((row) => { const sourceScene = integerOrNull(row.sourceSceneNativeId); const destinationScene = integerOrNull(row.destinationSceneNativeId); if (entity.kind !== "scenes" || (sourceScene !== entity.nativeId && destinationScene !== entity.nativeId)) return []; return [{ transitionId: String(row.transitionId), sourceSceneNativeId: sourceScene, destinationSceneNativeId: destinationScene, transitionKind: String(row.transitionKind) }]; });
    const conditionIds = new Set(indexedSources.flatMap((source) => source.conditionIds));
    for (const binding of merchantBindingsIndex.get(entity.entityKey) ?? []) if (entity.kind === "npcs" && binding.ownerNativeId === entity.nativeId && typeof binding.conditionId === "string") conditionIds.add(binding.conditionId);
    for (const row of lootBindings) if (row.conditionId) conditionIds.add(row.conditionId);
    for (const source of sourceIds) for (const condition of conditionsByOwner.get(`source:${source}`) ?? []) conditionIds.add(condition.conditionId);
    const projectedConditions = [...new Map([...conditionIds].flatMap((id) => { const row = conditionsById.get(id); return row ? [[id, row] as const] : []; }).concat((conditionsByOwner.get(entity.entityKey) ?? []).map((row) => [row.conditionId, row] as const))).values()];
    return { entityKey: entity.entityKey, kind: entity.kind, nativeId: entity.nativeId, name: entity.name, internalName: entity.internalName, description: entity.description, publicData: entity.publicData, roles: [...new Set(entityRoles.map((row) => row.role))].sort(compareText), placementIds, sources, relationships: { merchantStock, lootBindings, lootEntries, resourceYields, questAssociations, transitions, conditions: projectedConditions }, provenance: entity.provenance };
  });
  return sorted(result, (a, b) => compareText(a.entityKey, b.entityKey));
}

