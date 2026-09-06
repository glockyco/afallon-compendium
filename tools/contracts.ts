import { Type, type Static } from "typebox";

const integer = Type.Integer();
const text = Type.String();
const nullableText = Type.Union([text, Type.Null()]);
const rawObject = Type.Record(text, Type.Unknown());
const rawRows = Type.Array(rawObject);
const definition = Type.Object({ nativeId: integer, name: nullableText, internalName: nullableText });
const canonicalEntry = Type.Object({
  sourceKey: integer, nativeId: integer, name: nullableText, internalName: nullableText,
  description: nullableText, localization: rawObject, icon: rawObject, gameplay: rawObject,
});
export const canonicalKinds = ["items", "npcs", "quests", "lootTables", "scenes", "resources"] as const;
const counts = Type.Object({ items: integer, npcs: integer, quests: integer, lootTables: integer, scenes: integer, resources: integer });
export const CanonicalSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.canonical.v1"),
  databaseAvailable: Type.Literal(true),
  localization: Type.Object({ apiAvailable: Type.Literal(true), language: text, loadedEntryCount: integer }),
  sourceTotals: counts, exportedTotals: counts,
  items: Type.Array(canonicalEntry), npcs: Type.Array(canonicalEntry), quests: Type.Array(canonicalEntry),
  lootTables: Type.Array(canonicalEntry), scenes: Type.Array(canonicalEntry), resources: Type.Array(canonicalEntry),
});
export type Canonical = Static<typeof CanonicalSchema>;

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

export const WorldInventorySchema = Type.Object({
  schemaVersion: Type.Literal("compendium.world-inventory.v1"),
  coverage: Type.Object({ fullGameCoverage: Type.Literal(false), includesInactiveComponents: Type.Literal(true), traversalPerformed: Type.Literal(false) }),
  runtime: Type.Object({ databaseAvailable: Type.Literal(true), activeScene: text, activeScenePath: text }),
  buildScenes: Type.Array(Type.Object({ buildIndex: integer, path: nullableText, disposition: text })),
  databaseScenes: Type.Array(Type.Object({ nativeId: integer, disposition: text })),
  referencedDestinations: rawRows, transitions: rawRows, loadedScenes: rawRows, addressableSources: rawRows,
  componentFamilies: Type.Array(Type.Object({ family: text, activeCount: integer, includeInactiveCount: integer })),
  behaviourTypes: Type.Array(Type.Object({ nativeType: text, activeCount: integer, includeInactiveCount: integer })),
  sourceTotals: Type.Record(text, integer), exportedTotals: Type.Record(text, integer), unresolved: rawRows,
});

const intervals = Type.Array(Type.Object({ minimum: integer, maximum: integer, reachesDomainBoundary: Type.Boolean() }));
export const LootRulesSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.loot-rules.v1"),
  observation: Type.Object({ researchCharacter: text, playerLevel: integer, originalFirstGearDropDone: Type.Boolean(), restored: Type.Literal(true), sameGameplayFrame: Type.Literal(true), nativeComparisons: integer }),
  dynamicTables: Type.Array(Type.Object({ tableId: integer, sourceEntryCount: integer, entries: Type.Array(Type.Object({ entryIndex: integer, itemId: integer, requiredLevel: integer, beforeFirstGear: intervals, afterFirstGear: intervals })) })),
  itemLevels: Type.Array(Type.Object({ itemId: integer, requiredLevel: integer })),
  linkedNpcs: Type.Array(Type.Object({ npcId: integer, hasLinkedNpc: Type.Boolean(), authoredLinkedNpcId: integer, resolvedLinkedNpcId: Type.Union([integer, Type.Null()]), resolvedLootSpecNpcId: Type.Union([integer, Type.Null()]) })),
  unresolved: rawRows,
});
