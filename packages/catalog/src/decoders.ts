import { Type, type Static, type TSchema } from "typebox";
import { decodeContract, schemaRegistry, type Canonical, type Relationships } from "@afallon/contracts";
import type { ArtifactReference } from "@afallon/contracts/catalog";

const integer = Type.Integer();
const number = Type.Number();
const boolean = Type.Boolean();
const text = Type.String();
const nullableText = Type.Union([text, Type.Null()]);
const optional = <T extends TSchema>(schema: T) => Type.Optional(schema);
const availableEnum = Type.Object({ available: boolean, name: optional(text), nativeId: optional(integer), sourceName: optional(text) });
const valueEnum = Type.Object({ value: integer, name: text });
const stat = Type.Object({ sourceIndex: optional(integer), statId: integer, amount: number, isPercent: boolean });
const nonEmptyText = Type.String({ minLength: 1, pattern: "\\S" });
const contextualAbilityReference = Type.Object({ sourceIndex: Type.Integer({ minimum: 0 }), abilityId: Type.Integer({ minimum: 0 }), rankIndex: Type.Integer({ minimum: 0 }), behaviorIndex: optional(Type.Integer({ minimum: 0 })), potentialIndex: optional(Type.Integer({ minimum: 0 })) });
const itemNativeTooltip = Type.Object({
  generator: Type.Literal("ConsumableTooltip.Build(RPGItem, false)"), includeHint: Type.Literal(false),
  succeeded: Type.Literal(true), text: Type.Union([nonEmptyText, Type.Null()]), error: Type.Null(),
});
const generatedAbilityRank = Type.Object({
  rankIndex: Type.Integer({ minimum: 0 }), generator: Type.Literal("AbilityTooltipGenerator.Generate(null, RPGAbility, RPGAbilityRankData)"),
  succeeded: Type.Literal(true), text: nonEmptyText, error: Type.Null(),
});
const reward = Type.Object({ sourceIndex: optional(integer), rewardType: valueEnum, itemId: integer, currencyId: integer, treePointId: integer, factionId: integer, weaponTemplateId: integer, count: number, experience: number });
const MovementSchema = Type.Union([
  Type.Null(),
  Type.Object({ kind: Type.Literal("roaming"), roamDistance: number, roamAroundSpawner: boolean, usePOIs: boolean, poiPathName: text, poiRoamRadius: number }),
  Type.Object({ kind: Type.Literal("patrol"), patrolPathName: text, patrolPathNames: Type.Array(text), randomPath: boolean, pauseAtFirstPointSeconds: number, pauseAtLastPointSeconds: number, pauseAtPointSeconds: number }),
]);
const BehaviorSchema = Type.Object({ behaviorIndex: integer, chance: number, name: text, defaultStateType: Type.Union([text, Type.Null()]), defaultStateTemplateType: Type.Union([text, Type.Null()]), movement: MovementSchema });
const AdventurerSpecializationSchema = Type.Union([
  Type.Object({ available: Type.Literal(false) }),
  Type.Object({ available: Type.Literal(true), classId: integer, role: valueEnum, preferredTreeId: integer, behaviorName: nullableText, priorityAbilities: Type.Array(integer), blockedAbilities: Type.Array(integer), blockedBonuses: Type.Array(integer), allowedForms: Type.Array(integer) }),
]);
const AdventurerSchema = Type.Object({ authored: boolean, classId: integer, preferredTreeId: integer, keepPhaseAbilities: boolean, raceId: integer, specialization: AdventurerSpecializationSchema, aiLogicTemplateKey: nullableText });
const Vector3Schema = Type.Object({ x: number, y: number, z: number });
const FlightNetworkSchema = Type.Union([
  Type.Object({ available: Type.Literal(false), reason: text }),
  Type.Object({
    available: Type.Literal(true), networkId: text, sceneName: text, mapWorldBounds: Type.Object({ x: number, y: number, width: number, height: number }), minimumFlyoverHeight: number, currencyId: Type.Union([integer, Type.Null()]),
    stops: Type.Array(Type.Object({ id: text, name: text, landingPosition: Vector3Schema, landingYaw: number, knownInitially: boolean })),
    routes: Type.Array(Type.Object({ from: text, to: text, bidirectional: boolean, fare: number, speed: number, departureCruiseWaypoint: integer, arrivalCruiseWaypoint: integer, waypoints: Type.Array(Vector3Schema) })),
  }),
]);

export const ItemGameplaySchema = Type.Object({
  itemType: optional(availableEnum), armorSlot: optional(availableEnum), weaponType: optional(availableEnum), armorType: optional(availableEnum), weaponSlot: optional(availableEnum), rarity: optional(availableEnum),
  questDropOnly: optional(boolean), attackSpeed: optional(number), minDamage: optional(number), maxDamage: optional(number), autoAttackAbilityId: optional(integer),
  sellPrice: optional(number), convertToCurrencyId: optional(integer), sellCurrencyId: optional(integer), buyPrice: optional(number), buyCurrencyId: optional(integer), stackLimit: optional(integer),
  isCorruptionToken: optional(boolean), enchantmentId: optional(integer), randomStatsMax: optional(integer), stats: optional(Type.Array(stat)),
  randomStats: optional(Type.Array(Type.Object({ sourceIndex: optional(integer), statId: integer, minValue: number, maxValue: number, isPercent: boolean, isInt: optional(boolean), chance: optional(number) }))), sockets: optional(Type.Array(Type.Object({ sourceIndex: optional(integer), socketType: optional(text), gemSocketType: optional(availableEnum) }))),
  gemDataAvailable: optional(boolean), gemData: optional(Type.Object({ socketType: optional(text), gemSocketType: optional(availableEnum), statsAvailable: optional(boolean), stats: optional(Type.Array(stat)) })),
  actionAbilities: Type.Array(contextualAbilityReference), nativeUseTooltip: itemNativeTooltip,
  requirementsGroupCount: optional(integer), useRequirementsTemplate: optional(boolean), requirementsTemplateId: optional(Type.Union([integer, Type.Null()])),
});
export type ItemGameplay = Static<typeof ItemGameplaySchema>;

export const NpcGameplaySchema = Type.Object({
  npcType: optional(valueEnum), creatureType: optional(valueEnum), npcFamily: optional(availableEnum), factionId: optional(integer), speciesId: optional(integer),
  hunterTamable: optional(boolean), hunterBeastRole: optional(valueEnum), equipmentAppearanceSelections: optional(text), adventurer: optional(AdventurerSchema),
  isAuctioneer: optional(boolean), isBanker: optional(boolean), isFlightMaster: optional(boolean), flightNetworkResourcePath: optional(nullableText), flightStopId: optional(nullableText), flightInteractionDistance: optional(number), flightNetwork: optional(FlightNetworkSchema),
  minLevel: optional(integer), maxLevel: optional(integer), aiPhases: optional(Type.Array(Type.Object({ phaseIndex: integer, name: nullableText, requirement: optional(nullableText), abilityRefs: Type.Array(contextualAbilityReference), behaviors: optional(Type.Array(BehaviorSchema)) }))),
  guideStats: optional(Type.Array(Type.Object({ statId: integer, value: number }))), stats: optional(Type.Array(Type.Object({ sourceIndex: optional(integer), statId: integer, minValue: optional(number), maxValue: optional(number), baseValue: optional(number), bonusPerLevel: optional(number) }))),
  isScalingWithPlayer: optional(boolean), minExperience: optional(number), maxExperience: optional(number), minRespawn: optional(number), maxRespawn: optional(number),
  isCombatEnabled: optional(boolean), isMerchant: optional(boolean), isQuestGiver: optional(boolean), linkedNpcId: optional(Type.Union([integer, Type.Null()])), hasLinkedNpc: optional(boolean),
  hasLootSpecialization: optional(boolean), lootSpecializationArmorType: optional(availableEnum), lootSpecializationWeaponType: optional(availableEnum), lootSpecializationWeaponType2: optional(availableEnum), lootSpecializationWeaponType3: optional(availableEnum), lootSpecializationStatId: optional(integer),
  useAggroRange: optional(boolean), aggroRange: optional(number), immuneToStun: optional(boolean), immuneToSlow: optional(boolean),
  factionRewards: optional(Type.Array(Type.Object({ sourceIndex: optional(integer), factionId: integer, amount: number }))),
  startItems: optional(Type.Array(Type.Object({ sourceIndex: optional(integer), itemId: integer, count: number, equipped: boolean }))),
});
export type NpcGameplay = Static<typeof NpcGameplaySchema>;

export const QuestGameplaySchema = Type.Object({
  questChainName: optional(nullableText), questChainOrder: optional(integer), repeatable: optional(boolean), canBeTurnedInWithoutNpc: optional(boolean),
  completedDescription: optional(nullableText), objectiveText: optional(nullableText),
  itemsGiven: optional(Type.Array(Type.Object({ sourceIndex: optional(integer), itemId: integer, count: number }))),
  objectives: optional(Type.Array(Type.Object({ sourceIndex: optional(integer), objectiveType: valueEnum, taskId: integer, timeLimit: number }))),
  rewardsGiven: optional(Type.Array(reward)), rewardsToPick: optional(Type.Array(reward)), requirementsGroupCount: optional(integer), useRequirementsTemplate: optional(boolean), requirementsTemplateId: optional(Type.Union([integer, Type.Null()])),
});
export type QuestGameplay = Static<typeof QuestGameplaySchema>;

export const SceneGameplaySchema = Type.Object({
  startPositionId: optional(integer), includedInAdventureGuide: optional(boolean), dungeonLevelMin: optional(integer), dungeonLevelMax: optional(integer), zoneScalingMinLevel: optional(integer), zoneScalingMaxLevel: optional(integer), adventureGuideDescription: optional(nullableText),
  adventureGuideBosses: optional(Type.Array(Type.Object({ sourceIndex: optional(integer), npcId: integer }))),
});
export type SceneGameplay = Static<typeof SceneGameplaySchema>;

export const RegionGameplaySchema = Type.Object({
  includedInAdventureGuide: optional(boolean), levelRangeMin: optional(integer), levelRangeMax: optional(integer), adventureGuideDescription: optional(nullableText), parentSceneId: optional(integer),
});
export type RegionGameplay = Static<typeof RegionGameplaySchema>;

export const PropertyGameplaySchema = Type.Object({
  income: optional(number), incomeAmount: optional(number), purchasePrice: optional(number), sellPrice: optional(number), currencyId: optional(integer), propertyType: optional(valueEnum),
});
export type PropertyGameplay = Static<typeof PropertyGameplaySchema>;

export const TaskGameplaySchema = Type.Object({
  taskType: text, taskTypeValue: integer, sceneName: optional(text), abilityToLearnID: optional(integer), npcToKillID: optional(integer), npcToKillName: optional(nullableText), itemToGetID: optional(integer), itemToGetName: optional(nullableText), keepItems: optional(boolean), classRequiredID: optional(integer), skillRequiredID: optional(integer), skillRequiredName: optional(nullableText), itemToUseID: optional(integer), itemToUseName: optional(nullableText), npcToTalkToID: optional(integer), npcToTalkToName: optional(nullableText), weaponTemplateRequiredID: optional(integer), taskValue: optional(number),
});
export type TaskGameplay = Static<typeof TaskGameplaySchema>;

export const RecipeGameplaySchema = Type.Object({
  learnedByDefault: boolean, craftingSkillId: integer, craftingStationId: integer,
  ranks: Type.Array(Type.Object({ rankIndex: integer, unlockCost: number, experience: number, craftTime: number, craftedItems: Type.Array(Type.Object({ itemId: integer, count: number, chance: number })), components: Type.Array(Type.Object({ itemId: integer, count: number })) })),
});
export type RecipeGameplay = Static<typeof RecipeGameplaySchema>;

export const CraftingStationGameplaySchema = Type.Object({ maxDistance: number, craftSkillIds: Type.Array(integer) });
export type CraftingStationGameplay = Static<typeof CraftingStationGameplaySchema>;

export const GearSetGameplaySchema = Type.Object({
  itemsInSet: Type.Array(Type.Object({ sourceIndex: optional(integer), itemId: integer })),
  gearSetTiers: Type.Array(Type.Object({ tierIndex: integer, equippedAmount: integer, stats: Type.Array(stat) })),
});
export type GearSetGameplay = Static<typeof GearSetGameplaySchema>;

export const AbilityGameplaySchema = Type.Object({ ranks: Type.Array(generatedAbilityRank, { minItems: 1 }) });
export type AbilityGameplay = Static<typeof AbilityGameplaySchema>;

export const SupportedGameplaySchema = Type.Union([ItemGameplaySchema, NpcGameplaySchema, QuestGameplaySchema, SceneGameplaySchema, RegionGameplaySchema, PropertyGameplaySchema, TaskGameplaySchema, RecipeGameplaySchema, CraftingStationGameplaySchema, Type.Object({
  isMerchant: optional(boolean), isQuestGiver: optional(boolean), startPositionId: optional(integer), minLevel: optional(integer), maxLevel: optional(integer), includedInAdventureGuide: optional(boolean), dungeonLevelMin: optional(integer), dungeonLevelMax: optional(integer), levelRangeMin: optional(integer), levelRangeMax: optional(integer), adventureGuideDescription: optional(nullableText), income: optional(number), isPercentStat: optional(boolean), adventureGuideBosses: optional(Type.Array(Type.Object({ sourceIndex: optional(integer), npcId: integer }))), aiPhases: optional(Type.Array(Type.Object({ phaseIndex: integer, name: nullableText, requirement: optional(nullableText), abilityRefs: Type.Array(contextualAbilityReference), behaviors: optional(Type.Array(BehaviorSchema)) }))), guideStats: optional(Type.Array(Type.Object({ statId: integer, value: number }))),
})]);
export interface SupportedGameplay {
  isMerchant?: boolean;
  isQuestGiver?: boolean;
  startPositionId?: number;
  minLevel?: number;
  maxLevel?: number;
  includedInAdventureGuide?: boolean;
  dungeonLevelMin?: number;
  dungeonLevelMax?: number;
  levelRangeMin?: number;
  levelRangeMax?: number;
  adventureGuideDescription?: string | null;
  income?: number;
  isPercentStat?: boolean;
  adventureGuideBosses?: Array<{ sourceIndex?: number; npcId: number }>;
  aiPhases?: Array<{ phaseIndex: number; name: string | null; requirement?: string | null; abilityRefs: Array<{ sourceIndex: number; abilityId: number; rankIndex: number; behaviorIndex?: number; potentialIndex?: number }> }>;
  guideStats?: Array<{ statId: number; value: number }>;
}

export interface GameplayCoverageIssue { path: string; detail: string }
export interface DecodedGameplay<T> { value: T; issues: GameplayCoverageIssue[] }
export interface DecodedReference { nativeId: number | null; label: string }
export interface DecodedPrice { amount: number; currencyId: number | null }

const npcTypes = ["MOB", "ELITE", "RARE", "BOSS", "MERCHANT", "BANK", "QUEST_GIVER", "DIALOGUE", "COMPANION", "ADVENTURER", "QUEST_COMPANION"] as const;
const creatureTypes = ["NONE", "BEAST", "HUMANOID", "UNDEAD", "DEMON", "DRAGONKIN", "ELEMENTAL", "GIANT", "MECHANICAL"] as const;
const taskTypes = ["enterScene", "enterRegion", "learnAbility", "learnRecipe", "killNPC", "getItem", "reachLevel", "reachSkillLevel", "useItem", "talkToNPC", "reachWeaponTemplateLevel", "killNPCFamily"] as const;
const rewardTypes = ["item", "currency", "treePoint", "Experience", "FactionPoint", "weaponTemplateEXP"] as const;
const propertyTypes = ["House", "Business"] as const;
const hunterBeastRoles = ["Ravager", "Guardian", "Scout"] as const;
const adventurerRoles = ["Damage", "Tank", "Healer"] as const;

function decode<T extends TSchema>(schema: T, value: unknown, reference: ArtifactReference, path: string): Static<T> {
  return decodeContract(schema, value, { objectId: reference.sha256, target: `${reference.path}${path}` });
}
function valueEnumIssue(value: { value: number; name: string } | undefined, names: readonly string[], path: string, issues: GameplayCoverageIssue[]): string | null {
  if (!value) return null;
  if (value.value < 0 || value.value >= names.length || names[value.value] !== value.name) issues.push({ path, detail: `Unsupported enum value ${value.value} (${value.name}).` });
  return value.name;
}
export function availableEnumName(value: { available: boolean; name?: string } | undefined, path: string, issues: GameplayCoverageIssue[]): string | null {
  if (!value) return null;
  if (!value.available || !value.name) { issues.push({ path, detail: "Enum value is unavailable." }); return null; }
  return value.name;
}
export function decodedReference(nativeId: number | null | undefined, label: string): DecodedReference | null {
  if (nativeId === undefined || nativeId === null) return null;
  return nativeId < 0 ? null : { nativeId, label };
}
export function decodedPrice(amount: number | null | undefined, currencyId: number | null | undefined): DecodedPrice | null {
  if (amount === undefined || amount === null || amount === 0 && (currencyId === undefined || currencyId === null || currencyId < 0)) return null;
  return { amount, currencyId: currencyId === undefined || currencyId === null || currencyId < 0 ? null : currencyId };
}

export function decodeItemGameplay(value: unknown, reference: ArtifactReference, path: string): DecodedGameplay<ItemGameplay> {
  const decoded = decode(ItemGameplaySchema, value, reference, path), issues: GameplayCoverageIssue[] = [];
  const itemType = availableEnumName(decoded.itemType, `${path}/itemType`, issues);
  availableEnumName(decoded.rarity, `${path}/rarity`, issues);
  const equipmentFields = itemType === "WEAPON" ? ["weaponType", "weaponSlot"] as const : itemType === "ARMOR" || itemType === "Trinket" ? ["armorSlot", "armorType"] as const : [];
  for (const field of equipmentFields) availableEnumName(decoded[field], `${path}/${field}`, issues);
  decoded.sockets?.forEach((row, index) => availableEnumName(row.gemSocketType, `${path}/sockets/${index}/gemSocketType`, issues));
  return { value: decoded, issues };
}
export function decodeNpcGameplay(value: unknown, reference: ArtifactReference, path: string): DecodedGameplay<NpcGameplay> {
  const decoded = decode(NpcGameplaySchema, value, reference, path), issues: GameplayCoverageIssue[] = [];
  valueEnumIssue(decoded.npcType, npcTypes, `${path}/npcType`, issues); valueEnumIssue(decoded.creatureType, creatureTypes, `${path}/creatureType`, issues);
  valueEnumIssue(decoded.hunterBeastRole, hunterBeastRoles, `${path}/hunterBeastRole`, issues);
  if (decoded.adventurer?.specialization.available) valueEnumIssue(decoded.adventurer.specialization.role, adventurerRoles, `${path}/adventurer/specialization/role`, issues);
  for (const field of ["npcFamily", "lootSpecializationArmorType", "lootSpecializationWeaponType", "lootSpecializationWeaponType2", "lootSpecializationWeaponType3"] as const) if (decoded[field]?.available) availableEnumName(decoded[field], `${path}/${field}`, issues);
  if (decoded.isFlightMaster && !decoded.flightNetwork?.available) issues.push({ path: `${path}/flightNetwork`, detail: decoded.flightNetwork?.reason ?? "Flight master has no flight network evidence." });
  if (decoded.flightNetwork?.available) {
    const stops = new Set(decoded.flightNetwork.stops.map((stop) => stop.id));
    if (stops.size !== decoded.flightNetwork.stops.length) issues.push({ path: `${path}/flightNetwork/stops`, detail: "Flight network contains duplicate stop IDs." });
    if (decoded.isFlightMaster && (!decoded.flightStopId || !stops.has(decoded.flightStopId))) issues.push({ path: `${path}/flightStopId`, detail: `Flight master stop ${decoded.flightStopId ?? "<empty>"} is absent from its network.` });
    decoded.flightNetwork.routes.forEach((route, index) => {
      if (!stops.has(route.from)) issues.push({ path: `${path}/flightNetwork/routes/${index}/from`, detail: `Flight route references missing stop ${route.from}.` });
      if (!stops.has(route.to)) issues.push({ path: `${path}/flightNetwork/routes/${index}/to`, detail: `Flight route references missing stop ${route.to}.` });
    });
  }
  return { value: decoded, issues };
}
export function decodeQuestGameplay(value: unknown, reference: ArtifactReference, path: string): DecodedGameplay<QuestGameplay> {
  const decoded = decode(QuestGameplaySchema, value, reference, path), issues: GameplayCoverageIssue[] = [];
  decoded.objectives?.forEach((row, index) => valueEnumIssue(row.objectiveType, ["task"], `${path}/objectives/${index}/objectiveType`, issues));
  for (const [field, rows] of [["rewardsGiven", decoded.rewardsGiven], ["rewardsToPick", decoded.rewardsToPick]] as const) rows?.forEach((row, index) => valueEnumIssue(row.rewardType, rewardTypes, `${path}/${field}/${index}/rewardType`, issues));
  return { value: decoded, issues };
}
export function decodeSceneGameplay(value: unknown, reference: ArtifactReference, path: string): DecodedGameplay<SceneGameplay> { return { value: decode(SceneGameplaySchema, value, reference, path), issues: [] }; }
export function decodeRegionGameplay(value: unknown, reference: ArtifactReference, path: string): DecodedGameplay<RegionGameplay> { return { value: decode(RegionGameplaySchema, value, reference, path), issues: [] }; }
export function decodePropertyGameplay(value: unknown, reference: ArtifactReference, path: string): DecodedGameplay<PropertyGameplay> { const decoded = decode(PropertyGameplaySchema, value, reference, path), issues: GameplayCoverageIssue[] = []; valueEnumIssue(decoded.propertyType, propertyTypes, `${path}/propertyType`, issues); return { value: decoded, issues }; }
export function decodeTaskGameplay(value: unknown, reference: ArtifactReference, path: string): DecodedGameplay<TaskGameplay> { const decoded = decode(TaskGameplaySchema, value, reference, path), issues: GameplayCoverageIssue[] = []; if (decoded.taskTypeValue < 0 || decoded.taskTypeValue >= taskTypes.length || taskTypes[decoded.taskTypeValue] !== decoded.taskType) issues.push({ path: `${path}/taskType`, detail: `Unsupported task type ${decoded.taskTypeValue} (${decoded.taskType}).` }); return { value: decoded, issues }; }
export function decodeRecipeGameplay(value: unknown, reference: ArtifactReference, path: string): DecodedGameplay<RecipeGameplay> { return { value: decode(RecipeGameplaySchema, value, reference, path), issues: [] }; }
export function decodeCraftingStationGameplay(value: unknown, reference: ArtifactReference, path: string): DecodedGameplay<CraftingStationGameplay> { return { value: decode(CraftingStationGameplaySchema, value, reference, path), issues: [] }; }
export function decodeGearSetGameplay(value: unknown, reference: ArtifactReference, path: string): DecodedGameplay<GearSetGameplay> { return { value: decode(GearSetGameplaySchema, value, reference, path), issues: [] }; }
export function decodeAbilityGameplay(value: unknown, reference: ArtifactReference, path: string): DecodedGameplay<AbilityGameplay> {
  const decoded = decode(AbilityGameplaySchema, value, reference, path);
  decoded.ranks.forEach((rank, index) => {
    if (rank.rankIndex !== index) throw new Error(`Ability rank identity ${rank.rankIndex} does not match source position ${index} at ${path}/ranks/${index}.`);
  });
  return { value: decoded, issues: [] };
}

const RequirementEnumSchema = Type.Object({ value: integer, name: text });
const RequirementEntrySchema = Type.Union([Type.Null(), Type.Object({ nativeId: integer, name: nullableText, internalName: nullableText, fileName: nullableText, description: nullableText, nativeType: text, text })]);
const RequirementObjectSchema = Type.Union([Type.Null(), Type.Object({ nativeType: text, text })]);
const TimeRequirementSchema = Type.Object({ checkYear: boolean, checkMonth: boolean, checkWeek: boolean, checkDay: boolean, checkHour: boolean, checkMinute: boolean, checkSecond: boolean, checkGlobalSpeed: boolean, year: integer, month: integer, week: integer, day: integer, hour: integer, minute: integer, second: integer, globalSpeed: number });
const RequirementSchema = Type.Object({
  sourceFieldPath: optional(text), groupIndex: optional(integer), requirementIndex: optional(integer), requirementType: optional(text), requirementTypeValue: optional(integer), conditionRule: optional(text), conditionRuleValue: optional(integer), evaluation: optional(text),
  abilityID: optional(integer), bonusID: optional(integer), recipeID: optional(integer), resourceID: optional(integer), effectID: optional(integer), NPCID: optional(integer), statID: optional(integer), factionID: optional(integer), comboID: optional(integer), raceID: optional(integer), levelsID: optional(integer), classID: optional(integer), speciesID: optional(integer), itemID: optional(integer), currencyID: optional(integer), pointID: optional(integer), talentTreeID: optional(integer), skillID: optional(integer), spellbookID: optional(integer), weaponTemplateID: optional(integer), enchantmentID: optional(integer), gearSetID: optional(integer), gameSceneID: optional(integer), questID: optional(integer), dialogueID: optional(integer),
  knowledge: optional(RequirementEnumSchema), state: optional(RequirementEnumSchema), comparison: optional(RequirementEnumSchema), value: optional(RequirementEnumSchema), ownership: optional(RequirementEnumSchema), itemCondition: optional(RequirementEnumSchema), progression: optional(RequirementEnumSchema), entity: optional(RequirementEnumSchema), pointType: optional(RequirementEnumSchema), dialogueNodeState: optional(RequirementEnumSchema), effectCondition: optional(RequirementEnumSchema), amountType: optional(RequirementEnumSchema), timeType: optional(RequirementEnumSchema), timeValue: optional(RequirementEnumSchema), effectType: optional(RequirementEnumSchema), questState: optional(RequirementEnumSchema),
  amount1: optional(number), amount2: optional(number), float1: optional(number), consume: optional(boolean), boolBalue1: optional(boolean), boolBalue2: optional(boolean), boolBalue3: optional(boolean), isPercent: optional(boolean),
  effectTag: optional(RequirementEntrySchema), factionStance: optional(RequirementEntrySchema), itemType: optional(RequirementEntrySchema), weaponType: optional(RequirementEntrySchema), weaponSlot: optional(RequirementEntrySchema), armorType: optional(RequirementEntrySchema), armorSlot: optional(RequirementEntrySchema), gender: optional(RequirementEntrySchema), NPCFamily: optional(RequirementEntrySchema), region: optional(RequirementEntrySchema), dialogueNode: optional(RequirementObjectSchema), timeRequirement1: optional(TimeRequirementSchema), timeRequirement2: optional(TimeRequirementSchema),
});
const RequirementGroupSchema = Type.Object({ nativeRequirementCount: integer, checkCount: optional(boolean), requiredCount: optional(integer), requirements: Type.Array(Type.Union([RequirementSchema, Type.Null()])) });
export const RequirementTemplateSchema = Type.Union([Type.Null(), Type.Object({ nativeId: integer, sourceName: Type.Union([text, Type.Null()]), groups: Type.Array(Type.Union([RequirementGroupSchema, Type.Null()])) })]);
export const RelationshipExtrasSchema = Type.Object({ sourceFieldPath: optional(text), dropRateSemantics: optional(text), rewardSource: optional(text), rewardIndex: optional(integer), itemIndex: optional(integer), count: optional(number), useRequirementsTemplate: optional(boolean) });

schemaRegistry.register("compendium.catalog-item-gameplay.v1", ItemGameplaySchema);
schemaRegistry.register("compendium.catalog-npc-gameplay.v1", NpcGameplaySchema);
schemaRegistry.register("compendium.catalog-quest-gameplay.v1", QuestGameplaySchema);
schemaRegistry.register("compendium.catalog-scene-gameplay.v1", SceneGameplaySchema);
schemaRegistry.register("compendium.catalog-region-gameplay.v1", RegionGameplaySchema);
schemaRegistry.register("compendium.catalog-property-gameplay.v1", PropertyGameplaySchema);
schemaRegistry.register("compendium.catalog-task-gameplay.v1", TaskGameplaySchema);
schemaRegistry.register("compendium.catalog-recipe-gameplay.v1", RecipeGameplaySchema);
schemaRegistry.register("compendium.catalog-crafting-station-gameplay.v1", CraftingStationGameplaySchema);
schemaRegistry.register("compendium.catalog-gear-set-gameplay.v1", GearSetGameplaySchema);
schemaRegistry.register("compendium.catalog-ability-gameplay.v1", AbilityGameplaySchema);
schemaRegistry.register("compendium.catalog-supported-gameplay.v1", SupportedGameplaySchema);
schemaRegistry.register("compendium.catalog-requirement-template.v1", RequirementTemplateSchema);
schemaRegistry.register("compendium.catalog-relationship-extras.v1", RelationshipExtrasSchema);

export function decodeGameplay(value: unknown, reference: ArtifactReference, pointer: string): SupportedGameplay { return decode(SupportedGameplaySchema, value, reference, `${pointer}/gameplay`) as SupportedGameplay; }

export function validateSupportedSemantics(canonical: Canonical, relationships: Relationships, canonicalReference: ArtifactReference, relationshipReference: ArtifactReference) {
  const gameplay = new Map<string, SupportedGameplay>();
  for (const kind of ["items", "npcs", "quests", "lootTables", "scenes", "resources", "stats", "regions", "properties"] as const) for (const [index, row] of canonical[kind].entries()) gameplay.set(`${kind}:${row.nativeId}`, decodeGameplay(row.gameplay, canonicalReference, `/${kind}/${index}`));
  for (const [family, rows] of Object.entries(relationships)) {
    if (!Array.isArray(rows)) continue;
    for (const [index, row] of rows.entries()) {
      if (row === null || typeof row !== "object" || Array.isArray(row)) continue;
      decodeContract(RelationshipExtrasSchema, row, { objectId: relationshipReference.sha256, target: `relationships/${family}/${index}` });
      if ("requirementsTemplate" in row) decodeContract(RequirementTemplateSchema, row.requirementsTemplate, { objectId: relationshipReference.sha256, target: `relationships/${family}/${index}/requirementsTemplate` });
    }
  }
  return gameplay;
}
