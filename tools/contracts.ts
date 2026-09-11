import { Type, type Static } from "typebox";

const integer = Type.Integer();
const text = Type.String();
const nullableText = Type.Union([text, Type.Null()]);
const rawObject = Type.Record(text, Type.Unknown());
const rawRows = Type.Array(rawObject);
const definition = Type.Object({ nativeId: integer, name: nullableText, internalName: nullableText });
const observationState = Type.Object({
  researchCharacter: text, frame: integer,
  scene: Type.Object({ name: text, path: text, handle: integer, isLoaded: Type.Literal(true) }),
  gameSceneNativeId: Type.Union([integer, Type.Null()]),
});
export const ObservationContextSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.observation-context.v1"),
  started: observationState, completed: observationState,
});
const canonicalEntry = Type.Object({
  sourceKey: integer, nativeId: integer, name: nullableText, internalName: nullableText,
  description: nullableText, localization: rawObject, icon: rawObject, gameplay: rawObject,
});
export const canonicalKinds = ["items", "npcs", "quests", "lootTables", "scenes", "resources", "stats", "regions", "properties"] as const;
const counts = Type.Object({ items: integer, npcs: integer, quests: integer, lootTables: integer, scenes: integer, resources: integer, stats: integer, regions: integer, properties: integer });
const guideCoverage = Type.Object({ regionsObserved: integer, regionsExported: integer, regionsOmittedReason: text });
export const CanonicalSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.canonical.v3"),
  databaseAvailable: Type.Literal(true),
  localization: Type.Object({ apiAvailable: Type.Literal(true), language: text, loadedEntryCount: integer }),
  sourceTotals: counts, exportedTotals: counts,
  guideCoverage,
  items: Type.Array(canonicalEntry), npcs: Type.Array(canonicalEntry), quests: Type.Array(canonicalEntry),
  lootTables: Type.Array(canonicalEntry), scenes: Type.Array(canonicalEntry), resources: Type.Array(canonicalEntry), stats: Type.Array(canonicalEntry),
  regions: Type.Array(canonicalEntry), properties: Type.Array(canonicalEntry),
});
export type Canonical = Static<typeof CanonicalSchema>;

export function validateCanonicalIdentityAndCounts(canonical: Canonical): Record<string, Set<number>> {
  const ids: Record<string, Set<number>> = {};
  for (const kind of canonicalKinds) {
    const rows = canonical[kind];
    const omittedRegions = kind === "regions" && rows.length === 0
      && canonical.sourceTotals.regions === canonical.guideCoverage.regionsObserved
      && canonical.exportedTotals.regions === canonical.guideCoverage.regionsExported
      && canonical.guideCoverage.regionsExported === 0;
    const countsReconcile = rows.length === canonical.sourceTotals[kind] && rows.length === canonical.exportedTotals[kind];
    const rowIdentitiesReconcile = new Set(rows.map(row => row.nativeId)).size === rows.length
      && rows.every(row => row.nativeId >= 0 && row.nativeId === row.sourceKey);
    if ((!omittedRegions && !countsReconcile) || (!omittedRegions && !rowIdentitiesReconcile)) {
      throw new Error(`Canonical ${kind} identities or counts do not reconcile.`);
    }
    ids[kind] = new Set(rows.map(row => row.nativeId));
  }
  return ids;
}

export const LocalizationSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.localization.v1"), language: text, sourceCount: integer,
  entries: Type.Array(Type.Object({ key: text, text })),
});
export const SupportSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.support.v1"), language: text,
  sourceTotals: Type.Record(text, integer),
  tables: Type.Record(text, Type.Array(Type.Object({ sourceKey: integer, entry: definition }))),
});
export type Support = Static<typeof SupportSchema>;

const requirementGroup = Type.Object({ nativeRequirementCount: integer, requirements: rawRows });
const template = Type.Union([Type.Null(), Type.Object({ nativeId: integer, sourceName: text, groups: Type.Array(requirementGroup) })]);
export const RelationshipsSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.relationships.v1"),
  merchantBindings: Type.Array(Type.Object({ ownerNativeId: integer, merchantTableID: integer, bindingIndex: integer, requirementsTemplate: template })),
  merchantTables: Type.Array(definition), currencies: Type.Array(definition),
  merchantStock: Type.Array(Type.Object({ merchantTableID: integer, stockIndex: integer, itemID: integer, currencyID: integer, cost: integer })),
  npcLootBindings: Type.Array(Type.Object({ ownerNativeId: integer, lootTableID: integer, bindingIndex: integer, dropRate: Type.Number() })),
  worldLootBindings: Type.Array(Type.Object({ lootTableID: integer, bindingIndex: integer, dropRate: Type.Number(), minimumNPCLevel: integer, maximumNPCLevel: integer, requirementsTemplate: template })),
  worldLootSettings: Type.Object({ minimumNPCRank: integer, maximumItemsPerNPC: integer, sourceBindingCount: integer }),
  clothDrops: Type.Object({ dropChance: Type.Number(), minimumCount: integer, maximumCount: integer, tiers: Type.Array(Type.Object({ tierIndex: integer, itemID: integer, startLevel: Type.Number(), rampEnd: Type.Number(), lowWeight: Type.Number(), highWeight: Type.Number(), teaserWeight: Type.Number() })) }),
  lootTables: Type.Array(Type.Object({ nativeId: integer, levelBandGear: Type.Boolean(), limitDroppedItems: Type.Boolean(), maxDroppedItems: integer, hasMinimumDrops: Type.Boolean(), minDroppedItems: integer, inlineRequirements: Type.Union([Type.Null(), Type.Object({ nativeGroupCount: integer, groups: Type.Array(requirementGroup) })]), requirementsTemplate: template })),
  lootEntries: Type.Array(Type.Object({ lootTableID: integer, entryIndex: integer, itemID: integer, min: integer, max: integer, dropRate: Type.Number() })),
  npcQuestBindings: Type.Array(Type.Object({ ownerNativeId: integer, questID: integer, association: text, associationIndex: integer })),
  quests: Type.Array(definition), tasks: Type.Array(definition),
  questObjectives: Type.Array(Type.Object({ questID: integer, taskID: integer, objectiveIndex: integer })),
  questItemsGiven: Type.Array(Type.Object({ questID: integer, itemID: integer })),
  questRewards: Type.Array(Type.Object({ questID: integer, rewardType: text, itemID: integer, currencyID: integer, treePointID: integer, factionID: integer, weaponTemplateID: integer })),
  requirementsTemplates: Type.Array(Type.Object({ nativeId: integer, sourceName: text, groups: rawRows })),
  requirementGroups: rawRows, requirements: rawRows, unresolved: rawRows,
  reconciliation: rawObject,
});
export type Relationships = Static<typeof RelationshipsSchema>;

const intervals = Type.Array(Type.Object({ minimum: integer, maximum: integer, reachesDomainBoundary: Type.Boolean() }));
export const LootRulesSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.loot-rules.v1"),
  observation: Type.Object({ researchCharacter: text, playerLevel: integer, originalFirstGearDropDone: Type.Boolean(), restored: Type.Literal(true), sameGameplayFrame: Type.Literal(true), nativeComparisons: integer }),
  dynamicTables: Type.Array(Type.Object({ tableId: integer, sourceEntryCount: integer, entries: Type.Array(Type.Object({ entryIndex: integer, itemId: integer, requiredLevel: integer, beforeFirstGear: intervals, afterFirstGear: intervals })) })),
  itemLevels: Type.Array(Type.Object({ itemId: integer, requiredLevel: integer })),
  linkedNpcs: Type.Array(Type.Object({ npcId: integer, hasLinkedNpc: Type.Boolean(), authoredLinkedNpcId: integer, resolvedLinkedNpcId: Type.Union([integer, Type.Null()]), resolvedLootSpecNpcId: Type.Union([integer, Type.Null()]), hasLootSpecialization: Type.Boolean(), specializationSource: Type.Union([Type.Literal("linked-npc"), Type.Literal("self"), Type.Literal("none")]), nativeRuleVerified: Type.Literal(true) })),
  unresolved: rawRows,
});
