import { decodeContract, type Canonical, type LootRules, type Relationships } from "@afallon/contracts";
import { entityKey, stableJson, type ArtifactReference, type ItemSource, type NormalizedDatabaseInput, type NormalizedCondition, type ProvenanceReference } from "@afallon/contracts/catalog";
import { RelationshipExtrasSchema, type SupportedGameplay } from "./decoders";
import { conditionFrom } from "./conditions";
import { pointer, type Blocker } from "./context";

export type ItemSourceAccumulator = Omit<ItemSource["sources"][number], "probability">;
export function addSourceIndex(index: Map<number, Map<string, ItemSourceAccumulator>>, itemId: number | null, sourceKind: ItemSource["sources"][number]["sourceKind"], sourceKey: string, placementIds: Iterable<string>, conditionIds: Iterable<string>, context: Record<string, unknown>) {
  if (itemId === null || itemId < 0) return;
  let rows = index.get(itemId);
  if (!rows) { rows = new Map(); index.set(itemId, rows); }
  const key = `${sourceKind}:${sourceKey}`;
  const previous = rows.get(key);
  if (previous) {
    if (stableJson({ ...previous.context, provenance: [] }) !== stableJson({ ...context, provenance: [] })) throw new Error(`Conflicting authored item source ${key}.`);
    const previousEvidence: unknown[] = Array.isArray(previous.context.provenance) ? previous.context.provenance : [];
    const observedEvidence: unknown[] = Array.isArray(context.provenance) ? context.provenance : [];
    previous.context.provenance = [...new Map([...previousEvidence, ...observedEvidence].map((reference) => [stableJson(reference), reference])).values()];
    previous.placementIds = [...new Set([...previous.placementIds, ...placementIds])].sort();
    previous.conditionIds = [...new Set([...previous.conditionIds, ...conditionIds])].sort();
  } else rows.set(key, { sourceKind, sourceKey, placementIds: [...new Set(placementIds)].sort(), conditionIds: [...new Set(conditionIds)].sort(), context });
}
type Located = { sourceIndex: number; provenance: ProvenanceReference[] };
type MerchantBinding = Relationships["merchantBindings"][number] & Located & { conditionId: string | null };
type LootBinding = (Relationships["npcLootBindings"][number] | Relationships["worldLootBindings"][number]) & Located & { context: "npc" | "world"; conditionId: string | null; ownerNativeId: number | null; dropRateSemantics: string };
type LootEntry = Relationships["lootEntries"][number] & Located & { dropRateSemantics: string };
export interface RelationData {
  merchantTables: Relationships["merchantTables"];
  merchantBindings: MerchantBinding[];
  merchantStock: Array<Relationships["merchantStock"][number] & Located>;
  lootTables: Relationships["lootTables"];
  lootBindings: LootBinding[];
  lootEntries: LootEntry[];
  linkedNpcRules: LootRules["linkedNpcs"];
  resourceYields: Array<Relationships["resourceYields"][number] & Located & { yieldId: string }>;
  questAssociations: Array<Record<string, unknown> & { associationId: string; associationKind: string; provenance: ProvenanceReference[] }>;
  conditions: NormalizedCondition[];
  itemIndex: Map<number, Map<string, ItemSourceAccumulator>>;
}

export function relationRows(value: Relationships, canonical: Canonical, nativeLootRules: LootRules, roles: NormalizedDatabaseInput["roles"], knownEntities: ReadonlySet<string>, gameplay: ReadonlyMap<string, SupportedGameplay>, reference: ArtifactReference, lootReference: ArtifactReference, blockers: Blocker[]): RelationData {
  const merchantBindings: MerchantBinding[] = [], merchantStock: RelationData["merchantStock"] = [], lootBindings: LootBinding[] = [], lootEntries: LootEntry[] = [];
  const resourceYields: RelationData["resourceYields"] = [], questAssociations: RelationData["questAssociations"] = [], conditions: NormalizedCondition[] = [];
  const itemIndex = new Map<number, Map<string, ItemSourceAccumulator>>();
  const merchantTables = new Map(value.merchantTables.map((row) => [row.nativeId, row]));
  const tables = new Map(value.lootTables.map((row) => [row.nativeId, row]));
  const valid = (kind: string, id: number, path: string, definitions?: ReadonlyMap<number, unknown>) => {
    if (id < 0) return false;
    if (definitions ? definitions.has(id) : knownEntities.has(entityKey(kind, id))) return true;
    blockers.push({ kind: "missing-reference", key: `${path}:${kind}:${id}`, detail: `Source references missing ${kind}:${id}.`, provenance: [pointer(reference, path)] });
    return false;
  };
  const npcPlacements = new Map<number, Set<string>>();
  const npcProvenance = new Map<number, ProvenanceReference[]>();
  for (const role of roles) if (role.npcId !== null) {
    const placements = npcPlacements.get(role.npcId) ?? new Set<string>(); placements.add(role.placementId); npcPlacements.set(role.npcId, placements);
    const refs = npcProvenance.get(role.npcId) ?? [];
    refs.push(...role.evidence);
    npcProvenance.set(role.npcId, refs);
  }
  const merchantByTable = new Map<number, MerchantBinding[]>();
  const npcLootByTable = new Map<number, LootBinding[]>();
  const worldLootByTable = new Map<number, LootBinding[]>();
  function group<T>(map: Map<number, T[]>, key: number, row: T) { const rows = map.get(key) ?? []; rows.push(row); map.set(key, rows); }
  for (const [sourceIndex, row] of value.merchantBindings.entries()) {
    const path = `/merchantBindings/${sourceIndex}`;
    if (!valid("npcs", row.ownerNativeId, path) || !valid("merchantTables", row.merchantTableID, path, merchantTables)) continue;
    const condition = row.requirementsTemplate === null ? null : conditionFrom("merchant-binding", `merchant:${row.ownerNativeId}:${row.bindingIndex}`, row.requirementsTemplate, "merchant-requirements-template", decodeContract(RelationshipExtrasSchema, row, { objectId: reference.sha256, target: path }).sourceFieldPath ?? null, [pointer(reference, `${path}/requirementsTemplate`)]);
    if (condition) conditions.push(condition);
    const normalized = { ...row, sourceIndex, conditionId: condition?.conditionId ?? null, provenance: [pointer(reference, path)] };
    merchantBindings.push(normalized);
    if (gameplay.get(`npcs:${row.ownerNativeId}`)?.isMerchant === true) group(merchantByTable, row.merchantTableID, normalized);
  }
  for (const [sourceIndex, row] of value.merchantStock.entries()) {
    const path = `/merchantStock/${sourceIndex}`, provenance = [pointer(reference, path)];
    if (!valid("merchantTables", row.merchantTableID, path, merchantTables) || !valid("items", row.itemID, path) || !valid("currencies", row.currencyID, path)) continue;
    merchantStock.push({ ...row, sourceIndex, provenance });
    for (const binding of merchantByTable.get(row.merchantTableID) ?? []) addSourceIndex(itemIndex, row.itemID, "merchant", `${binding.ownerNativeId}:${binding.bindingIndex}:${row.stockIndex}`, npcPlacements.get(binding.ownerNativeId) ?? [], binding.conditionId ? [binding.conditionId] : [], {
      ownerEntityKeys: [entityKey("npcs", binding.ownerNativeId)], ownerNativeId: binding.ownerNativeId, bindingIndex: binding.bindingIndex,
      merchantTableId: row.merchantTableID, stockIndex: row.stockIndex, currencyId: row.currencyID, cost: row.cost, costSemantics: row.costSemantics, requirementsTemplate: binding.requirementsTemplate,
      provenance: [...provenance, ...binding.provenance, ...(npcProvenance.get(binding.ownerNativeId) ?? [])], derivation: { rule: "merchant-stock-source", version: 1 },
    });
  }
  for (const [family, context] of [["npcLootBindings", "npc"], ["worldLootBindings", "world"]] as const) for (const [sourceIndex, row] of value[family].entries()) {
    const path = `/${family}/${sourceIndex}`;
    const ownerNativeId = "ownerNativeId" in row ? row.ownerNativeId : null;
    if ((ownerNativeId !== null && !valid("npcs", ownerNativeId, path)) || !valid("lootTables", row.lootTableID, path, tables)) continue;
    const condition = "requirementsTemplate" in row && row.requirementsTemplate !== null ? conditionFrom("loot-binding", `loot:${context}:${ownerNativeId ?? "world"}:${row.bindingIndex}`, row.requirementsTemplate, "loot-requirements-template", decodeContract(RelationshipExtrasSchema, row, { objectId: reference.sha256, target: path }).sourceFieldPath ?? null, [pointer(reference, `${path}/requirementsTemplate`)]) : null;
    if (condition) conditions.push(condition);
    const metadata = { sourceIndex, context, conditionId: condition?.conditionId ?? null, dropRateSemantics: "authored raw rate; effective probability unresolved", provenance: [pointer(reference, path)] };
    const normalized: LootBinding = "ownerNativeId" in row ? { ...row, ...metadata } : { ...row, ...metadata, ownerNativeId: null };
    lootBindings.push(normalized); group(context === "npc" ? npcLootByTable : worldLootByTable, row.lootTableID, normalized);
  }
  const eligibility = new Map(nativeLootRules.dynamicTables.flatMap((table, tableIndex) => table.entries.map((entry, entryIndex) => [`${table.tableId}:${entry.entryIndex}`, { requiredLevel: entry.requiredLevel, beforeFirstGear: entry.beforeFirstGear, afterFirstGear: entry.afterFirstGear, observedPlayerLevel: nativeLootRules.observation.playerLevel, referenceLevelDomain: nativeLootRules.referenceLevelDomain, levelBand: nativeLootRules.levelBand, firstGearRule: nativeLootRules.firstGearRule, provenance: [pointer(lootReference, `/dynamicTables/${tableIndex}/entries/${entryIndex}`)] }] as const)));
  const specializations = new Map(nativeLootRules.linkedNpcs.map((row, index) => [row.npcId, { ...row, provenance: [pointer(lootReference, `/linkedNpcs/${index}`)] }]));
  for (const [sourceIndex, row] of value.lootEntries.entries()) {
    const path = `/lootEntries/${sourceIndex}`, provenance = [pointer(reference, path)];
    if (!valid("items", row.itemID, path) || !valid("lootTables", row.lootTableID, path, tables)) continue;
    lootEntries.push({ ...row, sourceIndex, provenance, dropRateSemantics: "authored raw rate; effective probability unresolved" });
    const context = { lootTableId: row.lootTableID, entryIndex: row.entryIndex, min: row.min, max: row.max, rawRate: row.dropRate, tableRules: tables.get(row.lootTableID)!, levelEligibility: eligibility.get(`${row.lootTableID}:${row.entryIndex}`) ?? null, probability: null, derivation: { rule: "loot-item-source", version: 1 } };
    for (const [sourceKind, bindings] of [["npc-loot", npcLootByTable], ["world-loot", worldLootByTable]] as const) for (const binding of bindings.get(row.lootTableID) ?? []) {
      const owner = binding.ownerNativeId;
      addSourceIndex(itemIndex, row.itemID, sourceKind, `${owner === null ? "" : `${owner}:`}${binding.bindingIndex}:${row.entryIndex}`, owner === null ? [] : npcPlacements.get(owner) ?? [], binding.conditionId ? [binding.conditionId] : [], {
        ...context, ownerEntityKeys: owner === null ? [] : [entityKey("npcs", owner)], ownerNativeId: owner, bindingIndex: binding.bindingIndex, outerRawRate: binding.dropRate,
        ...(sourceKind === "npc-loot" ? { lootSpecialization: owner === null ? null : specializations.get(owner) ?? null } : { ...binding, worldLootSettings: value.worldLootSettings }),
        provenance: [...provenance, ...binding.provenance, pointer(reference, `/lootTables/${value.lootTables.indexOf(tables.get(row.lootTableID)!)}`), ...(owner === null ? [] : npcProvenance.get(owner) ?? [])],
      });
    }
  }
  for (const [index, tier] of value.clothDrops.tiers.entries()) if (valid("items", tier.itemID, `/clothDrops/tiers/${index}`)) addSourceIndex(itemIndex, tier.itemID, "world-loot", `cloth:${tier.tierIndex}`, [], [], { sourceLabel: "Supplemental cloth loot", tier, rawRate: value.clothDrops.dropChance, min: value.clothDrops.minimumCount, max: value.clothDrops.maximumCount, locationScope: "NPC eligibility for this supplemental source is not established.", provenance: [pointer(reference, `/clothDrops/tiers/${index}`), pointer(reference, "/clothDrops")] });
  const questOwners = new Map<number, Set<number>>();
  for (const [index, row] of value.npcQuestBindings.entries()) {
    const path = `/npcQuestBindings/${index}`;
    if (!valid("npcs", row.ownerNativeId, path) || !valid("quests", row.questID, path)) continue;
    questAssociations.push({ ...row, associationId: `npc:${row.ownerNativeId}:${row.association}:${row.associationIndex}`, associationKind: "npc-quest", provenance: [pointer(reference, path)] });
    if (gameplay.get(`npcs:${row.ownerNativeId}`)?.isQuestGiver === true) { const owners = questOwners.get(row.questID) ?? new Set<number>(); owners.add(row.ownerNativeId); questOwners.set(row.questID, owners); }
  }
  for (const [index, row] of value.questObjectives.entries()) if (valid("quests", row.questID, `/questObjectives/${index}`) && valid("tasks", row.taskID, `/questObjectives/${index}`)) questAssociations.push({ ...row, associationId: `objective:${row.questID}:${row.objectiveIndex}`, associationKind: "quest-objective", provenance: [pointer(reference, `/questObjectives/${index}`)] });
  for (const [family, kind] of [["questItemsGiven", "quest-item-given"], ["questRewards", "quest-reward"]] as const) for (const [index, row] of value[family].entries()) {
    const path = `/${family}/${index}`;
    if (!valid("quests", row.questID, path)) continue;
    const metadata = decodeContract(RelationshipExtrasSchema, row, { objectId: reference.sha256, target: path });
    const sourceIndex = kind === "quest-item-given" ? metadata.itemIndex : metadata.rewardIndex;
    if (sourceIndex === undefined || (kind === "quest-reward" && metadata.rewardSource === undefined)) throw new Error(`Quest output ${reference.sha256}${path} has no authored source identity.`);
    const associationId = `${kind === "quest-item-given" ? "given" : "reward"}:${row.questID}:${metadata.rewardSource ?? ""}:${sourceIndex}`;
    const provenance = [pointer(reference, path)];
    questAssociations.push({ ...row, associationId, associationKind: kind, provenance });
    if (row.itemID >= 0 && valid("items", row.itemID, path)) addSourceIndex(itemIndex, row.itemID, "quest", associationId, [...questOwners.get(row.questID) ?? []].flatMap((owner) => [...npcPlacements.get(owner) ?? []]), [], { ...row, ownerEntityKeys: [entityKey("quests", row.questID)], questId: row.questID, association: kind, locationScope: "Associated quest NPCs; delivery at each NPC is not established.", provenance });
  }
  for (const [sourceIndex, row] of value.resourceYields.entries()) if (valid("items", row.itemID, `/resourceYields/${sourceIndex}`) && valid("resources", row.resourceID, `/resourceYields/${sourceIndex}`)) {
    const yieldId = `relationship:${sourceIndex}`, provenance = [pointer(reference, `/resourceYields/${sourceIndex}`)];
    resourceYields.push({ ...row, sourceIndex, yieldId, provenance });
    addSourceIndex(itemIndex, row.itemID, "resource", yieldId, [], [], { resourceId: row.resourceID, rank: row.rank, min: row.min, max: row.max, provenance });
  }
  return { merchantTables: [...merchantTables.values()], lootTables: [...tables.values()], merchantBindings, merchantStock, lootBindings, lootEntries, linkedNpcRules: nativeLootRules.linkedNpcs, resourceYields, questAssociations, conditions, itemIndex };
}
