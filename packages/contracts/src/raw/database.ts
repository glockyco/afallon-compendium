import { Type, type Static } from "typebox";

const integer = Type.Integer();
const number = Type.Number();
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
export type ObservationContext = Static<typeof ObservationContextSchema>;
const canonicalEntry = Type.Object({
  sourceKey: integer, nativeId: integer, name: nullableText, internalName: nullableText,
  description: nullableText, localization: rawObject, icon: rawObject, gameplay: rawObject,
});
const vector = Type.Object({ x: Type.Number(), y: Type.Number(), z: Type.Number() });
// RPGWorldPosition: the arrival point of the first entry into a scene (RPGGameScene.startPositionID).
const canonicalWorldPosition = Type.Object({
  sourceKey: integer, nativeId: integer, name: nullableText, internalName: nullableText,
  position: vector, useRotation: Type.Boolean(), rotation: vector,
});
export const canonicalKinds = ["items", "npcs", "quests", "lootTables", "scenes", "resources", "stats", "regions", "properties", "worldPositions"] as const;
const counts = Type.Object({ items: integer, npcs: integer, quests: integer, lootTables: integer, scenes: integer, resources: integer, stats: integer, regions: integer, properties: integer, worldPositions: integer });
const guideCoverage = Type.Object({ regionsObserved: integer, regionsExported: integer, regionsOmittedReason: text });
const petEffect = Type.Union([
  Type.Object({ nativeId: integer, sourceFieldPath: text, unavailable: text }),
  Type.Object({
    nativeId: integer, sourceFieldPath: text,
    effectType: Type.Object({ value: integer, name: text, sourceFieldPath: text }),
    duration: number, endless: Type.Boolean(),
    sourceFieldPaths: Type.Object({ duration: text, endless: text }),
    firstRank: Type.Union([
      Type.Object({ unavailable: text, sourceFieldPath: text }),
      Type.Object({ petNpcId: integer, petDuration: number, petSpawnCount: integer, sourceFieldPath: text,
        sourceFieldPaths: Type.Object({ petNpcId: text, petDuration: text, petSpawnCount: text }) }),
    ]),
  }),
]);
export const CanonicalSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.canonical.v7"),
  databaseAvailable: Type.Literal(true),
  localization: Type.Object({ apiAvailable: Type.Literal(true), language: text, loadedEntryCount: integer }),
  sourceTotals: counts, exportedTotals: counts,
  guideCoverage,
  items: Type.Array(canonicalEntry), npcs: Type.Array(canonicalEntry), quests: Type.Array(canonicalEntry),
  lootTables: Type.Array(canonicalEntry), scenes: Type.Array(canonicalEntry), resources: Type.Array(canonicalEntry), stats: Type.Array(canonicalEntry),
  regions: Type.Array(canonicalEntry), properties: Type.Array(canonicalEntry),
  worldPositions: Type.Array(canonicalWorldPosition),
  ownerActions: Type.Array(Type.Object({
    ownerKind: text, ownerId: text, ownerPath: text,
    template: Type.Union([Type.Null(), Type.Object({ nativeId: integer, internalName: nullableText, fileName: nullableText })]),
    actions: rawRows,
  })),
  petEffects: Type.Array(petEffect),
});
const { petEffects: _petEffects, ...canonicalV6Properties } = CanonicalSchema.properties;
export const CanonicalV6Schema = Type.Object({ ...canonicalV6Properties, schemaVersion: Type.Literal("compendium.canonical.v6") });
const { ownerActions: _ownerActions, ...canonicalV5Properties } = CanonicalV6Schema.properties;
export const CanonicalV5Schema = Type.Object({ ...canonicalV5Properties, schemaVersion: Type.Literal("compendium.canonical.v5") });
export const CanonicalV4Schema = Type.Object({ ...canonicalV5Properties, schemaVersion: Type.Literal("compendium.canonical.v4") });
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
export type Localization = Static<typeof LocalizationSchema>;
// The level range and dungeon that the game's QuestLevelRange computes for each non-null quest record.
// `levelRange` is null when the game computes no range; `sourceCount` counts every database entry.
export const QuestLevelsSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.quest-levels.v1"), sourceCount: integer,
  quests: Type.Array(Type.Object({ nativeId: integer, levelRange: Type.Union([Type.Null(), Type.Object({ min: integer, max: integer })]), dungeonSceneId: Type.Union([Type.Null(), integer]) })),
});
export type QuestLevels = Static<typeof QuestLevelsSchema>;
// `gameplay` carries the family's player-facing fields (recipe ranks, ability effects) when the
// collector projects them; the catalog decodes it at its typed boundary like canonical `gameplay`.
export const SupportEntrySchema = Type.Object({ sourceKey: integer, entry: definition, gameplay: Type.Optional(rawObject) });
export type SupportEntry = Static<typeof SupportEntrySchema>;
// Scans made before the progression capture carry v1 support evidence. Admission still validates it, but the
// catalog reads support evidence only from its canonical target, which must carry v2.
export const SupportV1Schema = Type.Object({
  schemaVersion: Type.Literal("compendium.support.v1"), language: text,
  sourceTotals: Type.Record(text, integer),
  tables: Type.Record(text, Type.Array(SupportEntrySchema)),
});
// v2 adds the gameplay of classes, skills, level templates, effects, enchantments, stats, factions, talent points,
// bonuses, talent trees, and spellbooks, and the rank mechanics of abilities. `requirementIssues` lists requirement
// rows that the shared condition projection could not read.
// A null record in a game table stays visible as an unavailable row with its field path.
export const SupportUnavailableSchema = Type.Object({ sourceKey: integer, unavailable: text, sourceFieldPath: text });
export type SupportUnavailable = Static<typeof SupportUnavailableSchema>;
const supportTables = Type.Record(text, Type.Array(Type.Union([SupportEntrySchema, SupportUnavailableSchema])));
export const SupportV2Schema = Type.Object({
  schemaVersion: Type.Literal("compendium.support.v2"), language: text, requirementIssues: rawRows,
  sourceTotals: Type.Record(text, integer),
  tables: supportTables,
});
// The typed values of the live `HeroicTierSettings.Get()` asset that the kill experience, Heroic Essence, creature
// scaling, affix, and Heroic gear rules read. The object is `unavailable` when the game returns no settings asset.
export const HeroicTierSettingsSchema = Type.Union([
  Type.Object({
    asset: text,
    killExperienceMultiplier: number,
    essenceTreePointId: integer, essenceBaseAmount: integer, essencePerAffix: integer,
    essenceEliteMultiplier: number, essenceRareMultiplier: number, essenceBossMultiplier: number,
    essenceHealthBaseline: number, essenceHealthFactorMin: number, essenceHealthFactorMax: number,
    baseHealthMultiplier: number, baseDamageMultiplier: number,
    gearScoreCoefficient: number, maxGearBonus: number,
    affixChance: number, extraAffixChance: number, maxAffixes: integer, rareGuaranteedAffixes: integer,
    affixLootDropMultiplier: number, heroicGearStatBonusPercent: number,
  }),
  Type.Object({ unavailable: text, sourceFieldPath: text }),
]);
export type HeroicTierSettings = Static<typeof HeroicTierSettingsSchema>;
// Earlier support artifacts remain registered for historical scan admission.
export const SupportV3Schema = Type.Object({
  schemaVersion: Type.Literal("compendium.support.v3"), language: text, requirementIssues: rawRows,
  sourceTotals: Type.Record(text, integer), tables: supportTables, heroicTierSettings: HeroicTierSettingsSchema,
});
export const SupportSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.support.v4"), language: text, requirementIssues: rawRows,
  sourceTotals: Type.Record(text, integer),
  tables: supportTables,
  heroicTierSettings: HeroicTierSettingsSchema,
});
export type Support = Static<typeof SupportSchema>;

const requirementGroup = Type.Object({ nativeRequirementCount: integer, requirements: rawRows });
const template = Type.Union([Type.Null(), Type.Object({ nativeId: integer, sourceName: text, groups: Type.Array(requirementGroup) })]);
export const AdventurerWorldSettingsV2Schema = Type.Object({
  asset: text, instanceCount: Type.Literal(1),
  roster: Type.Array(integer),
  arrivals: Type.Array(Type.Object({ npcId: integer, startingLevel: integer, joinAfterHours: integer })),
  equipmentBands: Type.Array(Type.Object({ itemId: integer, minimumContentLevel: integer })),
  equipmentRewardChance: number, equipmentRewards: Type.Array(integer),
  kitUpgrades: Type.Array(Type.Object({ id: text, npcId: integer, itemIds: Type.Array(integer) })),
});
export const AdventurerWorldSettingsSchema = Type.Union([
  Type.Object({ unavailable: text, sourceFieldPath: text, assetCount: integer }),
  Type.Object({
    ...AdventurerWorldSettingsV2Schema.properties,
    jobRegionNames: Type.Union([
      Type.Array(Type.Object({ name: text, sourceFieldPath: text })),
      Type.Object({ unavailable: text, sourceFieldPath: text }),
    ]),
    maximumPresent: integer, minimumJobSeconds: number, maximumJobSeconds: number,
    experienceBarPerJob: number, goldPerLevelPerJob: number,
    sourceFieldPaths: Type.Object({ maximumPresent: text, minimumJobSeconds: text, maximumJobSeconds: text, experienceBarPerJob: text, goldPerLevelPerJob: text, equipmentRewardChance: text }),
  }),
]);
export const RelationshipsSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.relationships.v3"),
  merchantBindings: Type.Array(Type.Object({ ownerNativeId: integer, merchantTableID: integer, bindingIndex: integer, requirementsTemplate: template })),
  merchantTables: Type.Array(definition), currencies: Type.Array(definition), resources: rawRows,
  merchantStock: Type.Array(Type.Object({ merchantTableID: integer, stockIndex: integer, itemID: integer, currencyID: integer, cost: integer, costSemantics: text })),
  npcLootBindings: Type.Array(Type.Object({ ownerNativeId: integer, lootTableID: integer, bindingIndex: integer, dropRate: Type.Number() })),
  worldLootBindings: Type.Array(Type.Object({ lootTableID: integer, bindingIndex: integer, dropRate: Type.Number(), minimumNPCLevel: integer, maximumNPCLevel: integer, requirementsTemplate: template })),
  worldLootSettings: Type.Object({ minimumNPCRank: integer, maximumItemsPerNPC: integer, sourceBindingCount: integer }),
  adventurerWorldSettings: AdventurerWorldSettingsSchema,
  // Scans before the property income collector lack the property settings.
  propertySettings: Type.Optional(Type.Object({ incomeInterval: Type.Number() })),
  clothDrops: Type.Object({ dropChance: Type.Number(), minimumCount: integer, maximumCount: integer, tiers: Type.Array(Type.Object({ tierIndex: integer, itemID: integer, startLevel: Type.Number(), rampEnd: Type.Number(), lowWeight: Type.Number(), highWeight: Type.Number(), teaserWeight: Type.Number() })) }),
  lootTables: Type.Array(Type.Object({ nativeId: integer, levelBandGear: Type.Boolean(), limitDroppedItems: Type.Boolean(), maxDroppedItems: integer, hasMinimumDrops: Type.Boolean(), minDroppedItems: integer, includeWorldLoot: Type.Boolean(), worldLootShare: number, bonusDropChance: number, worldLootStats: Type.Union([Type.Null(), Type.Array(integer)]), worldLootArmorType: Type.Union([Type.Null(), Type.Object({ nativeId: integer, name: nullableText })]), inlineRequirements: Type.Union([Type.Null(), Type.Object({ nativeGroupCount: integer, groups: Type.Array(requirementGroup) })]), requirementsTemplate: template })),
  lootEntries: Type.Array(Type.Object({ lootTableID: integer, entryIndex: integer, itemID: integer, min: integer, max: integer, dropRate: Type.Number() })),
  npcQuestBindings: Type.Array(Type.Object({ ownerNativeId: integer, questID: integer, association: text, associationIndex: integer })),
  quests: Type.Array(definition), tasks: Type.Array(definition),
  // Item requirement groups; absent in evidence collected before the compendium probe extension.
  items: Type.Optional(Type.Array(definition)),
  questObjectives: Type.Array(Type.Object({ questID: integer, taskID: integer, objectiveIndex: integer })),
  questItemsGiven: Type.Array(Type.Object({ questID: integer, itemID: integer })),
  questRewards: Type.Array(Type.Object({ questID: integer, rewardType: text, itemID: integer, currencyID: integer, treePointID: integer, factionID: integer, weaponTemplateID: integer })),
  requirementsTemplates: Type.Array(Type.Object({ nativeId: integer, sourceName: text, groups: rawRows })),
  requirementGroups: rawRows, requirements: rawRows, unresolved: rawRows,
  dynamicLevelBandGearLinks: rawRows,
  resourceYields: Type.Array(Type.Object({ itemID: integer, resourceID: integer, rank: integer, min: integer, max: integer })),
  reconciliation: rawObject,
});
export type Relationships = Static<typeof RelationshipsSchema>;
export const RelationshipsV2Schema = Type.Object({
  ...RelationshipsSchema.properties,
  schemaVersion: Type.Literal("compendium.relationships.v2"),
  adventurerWorldSettings: AdventurerWorldSettingsV2Schema,
});
const { adventurerWorldSettings: _adventurerWorldSettings, lootTables: _newLootTables, ...legacyRelationships } = RelationshipsV2Schema.properties;
export const RelationshipsV1Schema = Type.Object({
  ...legacyRelationships,
  schemaVersion: Type.Literal("compendium.relationships.v1"),
  lootTables: Type.Array(Type.Object({ nativeId: integer, levelBandGear: Type.Boolean(), limitDroppedItems: Type.Boolean(), maxDroppedItems: integer, hasMinimumDrops: Type.Boolean(), minDroppedItems: integer, inlineRequirements: Type.Union([Type.Null(), Type.Object({ nativeGroupCount: integer, groups: Type.Array(requirementGroup) })]), requirementsTemplate: template })),
});

const intervals = Type.Array(Type.Object({ minimum: integer, maximum: integer, reachesDomainBoundary: Type.Boolean() }));
export const LootRulesSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.loot-rules.v1"),
  observation: Type.Object({ researchCharacter: text, playerLevel: integer, originalFirstGearDropDone: Type.Boolean(), restored: Type.Literal(true), sameGameplayFrame: Type.Literal(true), nativeComparisons: integer }),
  dynamicTables: Type.Array(Type.Object({ tableId: integer, sourceEntryCount: integer, entries: Type.Array(Type.Object({ entryIndex: integer, itemId: integer, requiredLevel: integer, beforeFirstGear: intervals, afterFirstGear: intervals })) })),
  itemLevels: Type.Array(Type.Object({ itemId: integer, requiredLevel: integer })),
  linkedNpcs: Type.Array(Type.Object({ npcId: integer, hasLinkedNpc: Type.Boolean(), authoredLinkedNpcId: integer, resolvedLinkedNpcId: Type.Union([integer, Type.Null()]), resolvedLootSpecNpcId: Type.Union([integer, Type.Null()]), hasLootSpecialization: Type.Boolean(), specializationSource: Type.Union([Type.Literal("linked-npc"), Type.Literal("self"), Type.Literal("none")]), nativeRuleVerified: Type.Literal(true) })),
  referenceLevelDomain: rawObject,
  levelBand: rawObject,
  firstGearRule: rawObject,
  unresolved: rawRows,
});
export type LootRules = Static<typeof LootRulesSchema>;
