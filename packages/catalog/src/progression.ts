import { Type, type Static, type TObject, type TProperties, type TSchema } from "typebox";
import { decodeContract, schemaRegistry, type Support } from "@afallon/contracts";
import { entityKey, HEROIC_TIER_KEY, type ArtifactReference, type NormalizedCondition, type NormalizedProgressionFact, type NormalizedProgressionLink, type NormalizedReference, type NormalizedSpellbookNode, type NormalizedTalentNode, type ProgressionAppliedEffect, type ProgressionCustomStat, type ProgressionDetails, type ProgressionEnum, type ProgressionStat } from "@afallon/contracts/catalog";
import { conditionFrom } from "./conditions";
import { pointer, type Blocker } from "./context";

const integer = Type.Integer(), number = Type.Number(), boolean = Type.Boolean(), text = Type.String();
const nullableText = Type.Union([text, Type.Null()]);
const valueEnum = Type.Object({ value: integer, name: text });
const record = Type.Union([Type.Null(), Type.Object({ nativeId: integer, name: nullableText })]);
const unavailableRow = Type.Object({ sourceIndex: integer, unavailable: text, sourceFieldPath: text });
const unavailableList = Type.Object({ unavailable: text, sourceFieldPath: text });
// A collector list: its rows, or one `unavailable` object when the native list is null. A null row stays in place.
const list = <T extends TObject>(row: T) => Type.Union([Type.Array(Type.Union([row, unavailableRow])), unavailableList]);
const indexed = <T extends TProperties>(row: TObject<T>) => list(Type.Object({ sourceIndex: integer, ...row.properties }));
const requirementGroups = Type.Object({ useRequirementsTemplate: boolean, groups: list(Type.Object({ groupIndex: integer, requirements: Type.Array(Type.Unknown()) }, { additionalProperties: true })), template: Type.Union([Type.Null(), Type.Object({ groups: Type.Array(Type.Unknown()) }, { additionalProperties: true })]) });
const stat = indexed(Type.Object({ statId: integer, amount: number, isPercent: boolean }));
const baseStat = indexed(Type.Object({ statId: integer, amount: number, isPercent: boolean, bonusPerLevel: number }));
const customStat = indexed(Type.Object({ statId: integer, overrideMinValue: boolean, minValue: number, overrideMaxValue: boolean, maxValue: number, overrideStartPercentage: boolean, startPercentage: number, addedValue: number, valuePerLevel: number, isPercent: boolean, chance: number }));
const statTemplate = Type.Union([Type.Null(), Type.Object({ nativeId: integer, name: nullableText, customStats: customStat })]);
const startItems = indexed(Type.Object({ itemId: integer, count: integer, equipped: boolean }));
const actionAbilities = indexed(Type.Object({ keyType: valueEnum, abilityId: integer }));
const allocated = indexed(Type.Object({ statId: integer, maxValue: integer, cost: integer, valueAdded: integer, isPercent: boolean }));
const applied = indexed(Type.Object({ effectId: integer, chance: number, effectRank: integer, target: valueEnum, delay: number, requirements: requirementGroups }));

const ClassSchema = Type.Object({ autoAttackAbilityId: integer, levelTemplateId: integer, stats: baseStat, customStats: customStat, useStatListTemplate: boolean, statListTemplate: statTemplate, skillBonuses: indexed(Type.Object({ skillId: integer, amount: integer })), talentTreeIds: indexed(Type.Object({ talentTreeId: integer })), spellbookIds: indexed(Type.Object({ spellbookId: integer })), startItems, actionAbilities, allocationStatPoints: integer, allocatedStatsEntries: allocated, allocatedStatsEntriesGame: allocated });
const SkillSchema = Type.Object({ automaticallyAdded: boolean, maxLevel: integer, levelTemplateId: integer, talentTreeIds: indexed(Type.Object({ talentTreeId: integer })), stats: baseStat, customStats: customStat, useStatListTemplate: boolean, statListTemplate: statTemplate, startItems, actionAbilities });
const LevelSchema = Type.Object({ levels: integer, baseExperience: integer, increaseAmount: number, allLevels: indexed(Type.Object({ level: integer, name: nullableText, experienceRequired: integer })) });
const EffectSchema = Type.Object({
  effectType: valueEnum, effectTag: record, isState: boolean, isBuffOnSelf: boolean, stackLimit: integer, allowMultiple: boolean, allowMixedCaster: boolean, pulses: integer, duration: number, endless: boolean, canBeManuallyRemoved: boolean, isPersistent: boolean,
  ranks: list(Type.Object({
    rankIndex: integer, mainDamageType: valueEnum, customDamageType: record, customHealingType: record, damage: integer, alteredStatId: integer, flatCalculation: boolean, cannotCrit: boolean,
    skillModifier: number, skillModifierId: integer, weaponDamageModifier: number, useWeapon1Damage: boolean, useWeapon2Damage: boolean, useRangedWeaponDamage: boolean, lifesteal: number, maxHealthModifier: number, missingHealthModifier: number, delay: number,
    requiredEffectId: integer, requiredEffectDamageModifier: number, damageStatId: integer, damageStatModifier: number, teleportType: valueEnum, gameSceneId: integer, lootTableId: integer,
    petNpcId: integer, petDuration: number, petSpawnCount: integer, knockbackDistance: number, motionDistance: number,
    dispelType: valueEnum, dispelEffectType: valueEnum, dispelEffectTag: record, dispelEffectId: integer, tauntFlatThreat: integer, resurrectHealthPercent: number,
    statEffects: stat, nestedEffects: applied,
  })),
});
const EnchantmentSchema = Type.Object({
  applyRequirements: indexed(Type.Object({ type: valueEnum, itemType: record, itemRarity: record, weaponType: record, armorType: record, armorSlot: record, weaponSlot: record })),
  tiers: list(Type.Object({ tierIndex: integer, successRate: number, enchantTime: number, skillId: integer, skillExperience: integer, currencyCosts: indexed(Type.Object({ currencyId: integer, amount: integer })), itemCosts: indexed(Type.Object({ itemId: integer, count: integer })), stats: stat })),
});
const StatSchema = Type.Object({
  minCheck: boolean, minValue: number, maxCheck: boolean, maxValue: number, baseValue: number, isPercentStat: boolean, isVitalityStat: boolean, isPersistent: boolean, startPercentage: number,
  shiftsInSprint: boolean, shiftsInBlock: boolean, shiftsOutsideCombat: boolean, shiftsInCombat: boolean, shiftAmountOutsideCombat: number, shiftIntervalOutsideCombat: number, shiftAmountInCombat: number, shiftIntervalInCombat: number,
  uiCategory: nullableText, statCategory: record, procCooldown: number,
  statBonuses: indexed(Type.Object({ statType: valueEnum, modifyValue: number, mainDamageType: valueEnum, customDamageType: record, customHealingType: record, resistanceStatId: integer, penetrationStatId: integer, statId: integer, creatureType: valueEnum })),
  onHitEffects: indexed(Type.Object({ effectId: integer, effectRank: integer, target: valueEnum, tag: valueEnum, chance: number })),
});
const FactionSchema = Type.Object({ showInReputation: boolean, stances: indexed(Type.Object({ stance: record, pointsRequired: integer, alignmentToPlayer: valueEnum })), relations: indexed(Type.Object({ factionId: integer, defaultStance: record, startingPoints: integer })) });
const TreePointSchema = Type.Object({ startAmount: integer, maxPoints: integer, gainRules: indexed(Type.Object({ gainType: valueEnum, amount: integer, classId: integer, skillId: integer, itemId: integer, itemCount: integer, npcId: integer, weaponTemplateId: integer })) });
const BonusSchema = Type.Object({ learnedByDefault: boolean, ranks: list(Type.Object({ rankIndex: integer, unlockCost: integer, isEmpty: boolean, emptyTooltip: nullableText, requirements: requirementGroups, statEffects: stat, petStatEffects: indexed(Type.Object({ targetType: valueEnum, npcId: integer, speciesId: integer, statId: integer, amount: number, isPercent: boolean })) })) });
const TalentTreeSchema = Type.Object({ tiers: integer, treePointId: integer, nodes: indexed(Type.Object({ nodeType: valueEnum, abilityId: integer, recipeId: integer, resourceNodeId: integer, bonusId: integer, tier: integer, row: integer, requirements: requirementGroups })) });
const RaceSchema = Type.Object({ availableClasses: indexed(Type.Object({ classId: integer })) });
const SpellbookSchema = Type.Object({ sourceType: valueEnum, nodes: indexed(Type.Object({ nodeType: valueEnum, abilityId: integer, bonusId: integer, unlockLevel: integer })) });
const AbilitySchema = Type.Object({
  abilityType: valueEnum, learnedByDefault: boolean, requiresRangedWeapon: boolean,
  rankMechanics: list(Type.Object({ rankIndex: integer, unlockCost: integer, activationType: valueEnum, castTime: number, channelTime: number, cooldown: number, usesGlobalCooldown: boolean, minRange: number, maxRange: number, targetType: valueEnum, areaRadius: number, coneDegree: number, coneRange: number, projectileCount: integer, maxUnitsHit: integer, effectsApplied: applied, casterEffectsApplied: applied, requirements: requirementGroups })),
}, { additionalProperties: true });

for (const [name, schema] of [["class", ClassSchema], ["skill", SkillSchema], ["level-template", LevelSchema], ["effect", EffectSchema], ["enchantment", EnchantmentSchema], ["stat", StatSchema], ["faction", FactionSchema], ["tree-point", TreePointSchema], ["bonus", BonusSchema], ["talent-tree", TalentTreeSchema], ["spellbook", SpellbookSchema], ["race", RaceSchema], ["ability", AbilitySchema]] as const) schemaRegistry.register(`compendium.catalog-${name}-progression.v${name === "effect" ? 2 : 1}`, schema);

type Rows<T> = Static<typeof unavailableList> | Array<T | Static<typeof unavailableRow>>;

export interface ProgressionRows {
  progressionFacts: NormalizedProgressionFact[];
  progressionLinks: NormalizedProgressionLink[];
  talentNodes: NormalizedTalentNode[];
  spellbookNodes: NormalizedSpellbookNode[];
  conditions: NormalizedCondition[];
}

/**
 * Decodes the progression tables and Heroic tier settings of `compendium.support.v4` evidence and resolves their
 * references. `knownKeys` holds the names of catalog entities by key. Bonuses, level templates, talent points, and
 * spellbooks are not entities, so their keys come from the support tables.
 */
export function normalizeProgression(support: Support, reference: ArtifactReference, entityNames: ReadonlyMap<string, string | null>, blockers: Blocker[]): ProgressionRows {
  const out: ProgressionRows = { progressionFacts: [], progressionLinks: [], talentNodes: [], spellbookNodes: [], conditions: [] };
  // A display name can be empty, as for the level templates. Facts then have no name, and references read the internal
  // name, so that no reference has an empty label.
  const labels = new Map<string, string | null>([...entityNames].map(([key, name]) => [key, name || null]));
  const internalNames = new Map<string, string>();
  for (const [kind, table] of Object.entries(support.tables)) for (const row of table) {
    if ("unavailable" in row) continue;
    const key = entityKey(kind, row.entry.nativeId);
    if (!labels.get(key)) labels.set(key, row.entry.name || null);
    if (row.entry.internalName) internalNames.set(key, row.entry.internalName);
  }
  const nonEntityKinds = new Set(["bonuses", "levels", "treePoints", "spellbooks"]);
  const exists = (key: string, kind: string) => entityNames.has(key) || nonEntityKinds.has(kind) && labels.has(key);
  const decode = <T extends TSchema>(schema: T, value: unknown, path: string): Static<T> => decodeContract(schema, value, { objectId: reference.sha256, target: `${reference.path}${path}` });
  const nameIssue = (value: ProgressionEnum, path: string) => { if (/^-?\d+$/.test(value.name)) blockers.push({ kind: "unsupported-enum", key: `support:${path}`, detail: `Unsupported enum value ${value.value} (${value.name}).`, provenance: [pointer(reference, path)] }); return value; };
  const named = (value: ProgressionEnum, path: string): ProgressionEnum => nameIssue({ value: value.value, name: value.name }, path);
  const ref = (kind: string, nativeId: number, path: string): NormalizedReference | null => {
    if (nativeId < 0) return null;
    const key = entityKey(kind, nativeId);
    if (!exists(key, kind)) { blockers.push({ kind: "missing-reference", key: `${path}:${key}`, detail: `Progression fact references missing ${key}.`, provenance: [pointer(reference, path)] }); return { entityKey: null, label: `${kind} ${nativeId}` }; }
    return { entityKey: key, label: labels.get(key) ?? internalNames.get(key) ?? key };
  };
  const required = (kind: string, nativeId: number, path: string): NormalizedReference => ref(kind, nativeId, path) ?? { entityKey: null, label: `${kind} ${nativeId}` };
  function rows<T extends object>(value: Rows<T>, path: string): Array<{ row: T; path: string }> {
    if (!Array.isArray(value)) { blockers.push({ kind: "unavailable-progression-data", key: `support:${path}`, detail: `${value.unavailable} at ${value.sourceFieldPath}.`, provenance: [pointer(reference, path)] }); return []; }
    return value.flatMap((row, index) => {
      if ("unavailable" in row) { blockers.push({ kind: "unavailable-progression-data", key: `support:${path}/${index}`, detail: `${row.unavailable} at ${row.sourceFieldPath}.`, provenance: [pointer(reference, `${path}/${index}`)] }); return []; }
      return [{ row, path: `${path}/${index}` }];
    });
  }
  const stats = (value: Static<typeof stat>, path: string): ProgressionStat[] => rows(value, path).map(({ row, path: rowPath }) => ({ stat: required("stats", row.statId, `${rowPath}/statId`), amount: row.amount, isPercent: row.isPercent }));
  const customStats = (value: Static<typeof customStat>, path: string): ProgressionCustomStat[] => rows(value, path).map(({ row, path: rowPath }) => ({ stat: required("stats", row.statId, `${rowPath}/statId`), minValue: row.overrideMinValue ? row.minValue : null, maxValue: row.overrideMaxValue ? row.maxValue : null, startPercentage: row.overrideStartPercentage ? row.startPercentage : null, addedValue: row.addedValue, valuePerLevel: row.valuePerLevel, isPercent: row.isPercent, chance: row.chance }));
  const effects = (value: Static<typeof applied>, path: string): ProgressionAppliedEffect[] => rows(value, path).map(({ row, path: rowPath }) => ({ effect: required("effects", row.effectId, `${rowPath}/effectId`), chance: row.chance, rank: row.effectRank, target: named(row.target, `${rowPath}/target`), delay: row.delay }));
  const recordName = (value: Static<typeof record>) => value === null ? null : value.name;
  // Requirement groups keep the payload shape of other conditions: `{ groups }`. A node that uses a template reads the
  // groups of the template, as the game does.
  const condition = (ownerType: string, ownerKey: string, value: Static<typeof requirementGroups>, path: string): string | null => {
    const groups = value.useRequirementsTemplate ? value.template?.groups ?? [] : rows(value.groups, `${path}/groups`).map(({ row }) => row);
    if (groups.length === 0) return null;
    const row = conditionFrom(ownerType, ownerKey, { groups }, value.useRequirementsTemplate ? "requirements-template" : "inline-requirements", path, [pointer(reference, path)]);
    out.conditions.push(row);
    return row.conditionId;
  };
  const fact = (value: ProgressionDetails & { entityKey: string }, path: string) => { const row: NormalizedProgressionFact = { ...value, name: labels.get(value.entityKey) ?? null, provenance: [pointer(reference, path)] }; out.progressionFacts.push(row); };
  const each = (kind: string, visit: (key: string, gameplay: unknown, path: string) => void) => {
    for (const [index, row] of (support.tables[kind] ?? []).entries()) {
      const path = `/tables/${kind}/${index}`;
      if ("unavailable" in row) continue;
      if (row.gameplay === undefined) throw new Error(`Support ${kind} ${row.entry.nativeId} has no gameplay; the catalog needs compendium.support.v4 evidence.`);
      visit(entityKey(kind, row.entry.nativeId), row.gameplay, `${path}/gameplay`);
    }
  };

  each("classes", (key, gameplay, path) => {
    const value = decode(ClassSchema, gameplay, path);
    const template = value.useStatListTemplate ? value.statListTemplate : null;
    fact({ entityKey: key, kind: "classes", details: {
      autoAttackAbility: ref("abilities", value.autoAttackAbilityId, `${path}/autoAttackAbilityId`), levelTemplate: ref("levels", value.levelTemplateId, `${path}/levelTemplateId`),
      stats: rows(value.stats, `${path}/stats`).map(({ row, path: rowPath }) => ({ stat: required("stats", row.statId, `${rowPath}/statId`), amount: row.amount, isPercent: row.isPercent, bonusPerLevel: row.bonusPerLevel })),
      customStats: template ? customStats(template.customStats, `${path}/statListTemplate/customStats`) : customStats(value.customStats, `${path}/customStats`),
      statListTemplate: template ? { nativeId: template.nativeId, name: template.name } : null,
      skillBonuses: rows(value.skillBonuses, `${path}/skillBonuses`).map(({ row, path: rowPath }) => ({ skill: required("skills", row.skillId, `${rowPath}/skillId`), amount: row.amount })),
      startItems: rows(value.startItems, `${path}/startItems`).map(({ row, path: rowPath }) => ({ item: required("items", row.itemId, `${rowPath}/itemId`), count: row.count, equipped: row.equipped })),
      actionAbilities: rows(value.actionAbilities, `${path}/actionAbilities`).map(({ row, path: rowPath }) => ({ ability: required("abilities", row.abilityId, `${rowPath}/abilityId`), keyType: named(row.keyType, `${rowPath}/keyType`) })),
      allocationStatPoints: value.allocationStatPoints,
      allocatedStats: rows(value.allocatedStatsEntriesGame, `${path}/allocatedStatsEntriesGame`).map(({ row, path: rowPath }) => ({ stat: required("stats", row.statId, `${rowPath}/statId`), maxValue: row.maxValue, cost: row.cost, valueAdded: row.valueAdded, isPercent: row.isPercent })),
    } }, path);
    for (const [linkIndex, { row, path: rowPath }] of rows(value.talentTreeIds, `${path}/talentTreeIds`).entries()) out.progressionLinks.push({ ownerKey: key, linkIndex, linkKind: "talentTree", target: required("talentTrees", row.talentTreeId, `${rowPath}/talentTreeId`), provenance: [pointer(reference, rowPath)] });
    for (const [linkIndex, { row, path: rowPath }] of rows(value.spellbookIds, `${path}/spellbookIds`).entries()) out.progressionLinks.push({ ownerKey: key, linkIndex, linkKind: "spellbook", target: required("spellbooks", row.spellbookId, `${rowPath}/spellbookId`), provenance: [pointer(reference, rowPath)] });
  });
  each("skills", (key, gameplay, path) => {
    const value = decode(SkillSchema, gameplay, path);
    const template = value.useStatListTemplate ? value.statListTemplate : null;
    fact({ entityKey: key, kind: "skills", details: {
      automaticallyAdded: value.automaticallyAdded, maxLevel: value.maxLevel, levelTemplate: ref("levels", value.levelTemplateId, `${path}/levelTemplateId`),
      stats: rows(value.stats, `${path}/stats`).map(({ row, path: rowPath }) => ({ stat: required("stats", row.statId, `${rowPath}/statId`), amount: row.amount, isPercent: row.isPercent, bonusPerLevel: row.bonusPerLevel })),
      customStats: template ? customStats(template.customStats, `${path}/statListTemplate/customStats`) : customStats(value.customStats, `${path}/customStats`),
      statListTemplate: template ? { nativeId: template.nativeId, name: template.name } : null,
      startItems: rows(value.startItems, `${path}/startItems`).map(({ row, path: rowPath }) => ({ item: required("items", row.itemId, `${rowPath}/itemId`), count: row.count, equipped: row.equipped })),
      actionAbilities: rows(value.actionAbilities, `${path}/actionAbilities`).map(({ row, path: rowPath }) => ({ ability: required("abilities", row.abilityId, `${rowPath}/abilityId`), keyType: named(row.keyType, `${rowPath}/keyType`) })),
    } }, path);
    for (const [linkIndex, { row, path: rowPath }] of rows(value.talentTreeIds, `${path}/talentTreeIds`).entries()) out.progressionLinks.push({ ownerKey: key, linkIndex, linkKind: "talentTree", target: required("talentTrees", row.talentTreeId, `${rowPath}/talentTreeId`), provenance: [pointer(reference, rowPath)] });
  });
  each("levels", (key, gameplay, path) => {
    const value = decode(LevelSchema, gameplay, path);
    fact({ entityKey: key, kind: "levels", details: { levels: value.levels, baseExperience: value.baseExperience, increaseAmount: value.increaseAmount, rows: rows(value.allLevels, `${path}/allLevels`).map(({ row }) => ({ level: row.level, name: row.name, experienceRequired: row.experienceRequired })) } }, path);
  });
  each("effects", (key, gameplay, path) => {
    const value = decode(EffectSchema, gameplay, path);
    fact({ entityKey: key, kind: "effects", details: {
      effectType: named(value.effectType, `${path}/effectType`), tag: recordName(value.effectTag), isState: value.isState, isBuffOnSelf: value.isBuffOnSelf, stackLimit: value.stackLimit, allowMultiple: value.allowMultiple, allowMixedCaster: value.allowMixedCaster,
      pulses: value.pulses, duration: value.duration, endless: value.endless, canBeManuallyRemoved: value.canBeManuallyRemoved, isPersistent: value.isPersistent,
      ranks: rows(value.ranks, `${path}/ranks`).map(({ row, path: rankPath }) => ({
        rank: row.rankIndex, damageType: named(row.mainDamageType, `${rankPath}/mainDamageType`), customDamageType: recordName(row.customDamageType), customHealingType: recordName(row.customHealingType),
        damage: row.damage, alteredStat: ref("stats", row.alteredStatId, `${rankPath}/alteredStatId`), flatCalculation: row.flatCalculation, cannotCrit: row.cannotCrit,
        skillModifier: row.skillModifier, skillModifierStat: ref("stats", row.skillModifierId, `${rankPath}/skillModifierId`), weaponDamageModifier: row.weaponDamageModifier, useWeapon1Damage: row.useWeapon1Damage, useWeapon2Damage: row.useWeapon2Damage, useRangedWeaponDamage: row.useRangedWeaponDamage,
        lifesteal: row.lifesteal, maxHealthModifier: row.maxHealthModifier, missingHealthModifier: row.missingHealthModifier, delay: row.delay,
        requiredEffect: ref("effects", row.requiredEffectId, `${rankPath}/requiredEffectId`), requiredEffectDamageModifier: row.requiredEffectDamageModifier, damageStat: ref("stats", row.damageStatId, `${rankPath}/damageStatId`), damageStatModifier: row.damageStatModifier,
        teleportType: named(row.teleportType, `${rankPath}/teleportType`), teleportScene: ref("scenes", row.gameSceneId, `${rankPath}/gameSceneId`), lootTable: ref("lootTables", row.lootTableId, `${rankPath}/lootTableId`),
        pet: ref("npcs", row.petNpcId, `${rankPath}/petNpcId`), petDuration: row.petDuration, petSpawnCount: row.petSpawnCount, knockbackDistance: row.knockbackDistance, motionDistance: row.motionDistance,
        dispelType: named(row.dispelType, `${rankPath}/dispelType`), dispelEffectType: named(row.dispelEffectType, `${rankPath}/dispelEffectType`), dispelEffectTag: recordName(row.dispelEffectTag), dispelEffect: ref("effects", row.dispelEffectId, `${rankPath}/dispelEffectId`),
        tauntFlatThreat: row.tauntFlatThreat, resurrectHealthPercent: row.resurrectHealthPercent,
        statEffects: stats(row.statEffects, `${rankPath}/statEffects`), nestedEffects: effects(row.nestedEffects, `${rankPath}/nestedEffects`),
      })),
    } }, path);
  });
  each("enchantments", (key, gameplay, path) => {
    const value = decode(EnchantmentSchema, gameplay, path);
    fact({ entityKey: key, kind: "enchantments", details: {
      appliesTo: rows(value.applyRequirements, `${path}/applyRequirements`).map(({ row, path: rowPath }) => ({ type: named(row.type, `${rowPath}/type`), itemType: recordName(row.itemType), itemRarity: recordName(row.itemRarity), weaponType: recordName(row.weaponType), armorType: recordName(row.armorType), armorSlot: recordName(row.armorSlot), weaponSlot: recordName(row.weaponSlot) })),
      tiers: rows(value.tiers, `${path}/tiers`).map(({ row, path: tierPath }) => ({
        tier: row.tierIndex, successRate: row.successRate, enchantTime: row.enchantTime, skill: ref("skills", row.skillId, `${tierPath}/skillId`), skillExperience: row.skillExperience,
        currencyCosts: rows(row.currencyCosts, `${tierPath}/currencyCosts`).map(({ row: cost, path: costPath }) => ({ currency: required("currencies", cost.currencyId, `${costPath}/currencyId`), amount: cost.amount })),
        itemCosts: rows(row.itemCosts, `${tierPath}/itemCosts`).map(({ row: cost, path: costPath }) => ({ item: required("items", cost.itemId, `${costPath}/itemId`), count: cost.count })),
        stats: stats(row.stats, `${tierPath}/stats`),
      })),
    } }, path);
  });
  each("stats", (key, gameplay, path) => {
    const value = decode(StatSchema, gameplay, path);
    const regeneration: Array<{ when: "outside-combat" | "in-combat"; amount: number; interval: number }> = [];
    if (value.shiftsOutsideCombat) regeneration.push({ when: "outside-combat", amount: value.shiftAmountOutsideCombat, interval: value.shiftIntervalOutsideCombat });
    if (value.shiftsInCombat) regeneration.push({ when: "in-combat", amount: value.shiftAmountInCombat, interval: value.shiftIntervalInCombat });
    fact({ entityKey: key, kind: "stats", details: {
      minValue: value.minCheck ? value.minValue : null, maxValue: value.maxCheck ? value.maxValue : null, baseValue: value.baseValue, isPercentStat: value.isPercentStat, isVitalityStat: value.isVitalityStat, isPersistent: value.isPersistent, startPercentage: value.startPercentage,
      regeneration, shiftsInSprint: value.shiftsInSprint, shiftsInBlock: value.shiftsInBlock, uiCategory: value.uiCategory, statCategory: recordName(value.statCategory), procCooldown: value.procCooldown,
      statBonuses: rows(value.statBonuses, `${path}/statBonuses`).map(({ row, path: rowPath }) => ({ statType: named(row.statType, `${rowPath}/statType`), modifyValue: row.modifyValue, damageType: named(row.mainDamageType, `${rowPath}/mainDamageType`), customDamageType: recordName(row.customDamageType), customHealingType: recordName(row.customHealingType), resistanceStat: ref("stats", row.resistanceStatId, `${rowPath}/resistanceStatId`), penetrationStat: ref("stats", row.penetrationStatId, `${rowPath}/penetrationStatId`), stat: ref("stats", row.statId, `${rowPath}/statId`), creatureType: named(row.creatureType, `${rowPath}/creatureType`) })),
      onHitEffects: rows(value.onHitEffects, `${path}/onHitEffects`).map(({ row, path: rowPath }) => ({ effect: required("effects", row.effectId, `${rowPath}/effectId`), rank: row.effectRank, target: named(row.target, `${rowPath}/target`), tag: named(row.tag, `${rowPath}/tag`), chance: row.chance })),
    } }, path);
  });
  each("factions", (key, gameplay, path) => {
    const value = decode(FactionSchema, gameplay, path);
    fact({ entityKey: key, kind: "factions", details: {
      showInReputation: value.showInReputation,
      stances: rows(value.stances, `${path}/stances`).map(({ row, path: rowPath }) => ({ stance: recordName(row.stance), pointsRequired: row.pointsRequired, alignmentToPlayer: named(row.alignmentToPlayer, `${rowPath}/alignmentToPlayer`) })),
      relations: rows(value.relations, `${path}/relations`).map(({ row, path: rowPath }) => ({ faction: required("factions", row.factionId, `${rowPath}/factionId`), defaultStance: recordName(row.defaultStance), startingPoints: row.startingPoints })),
    } }, path);
  });
  each("treePoints", (key, gameplay, path) => {
    const value = decode(TreePointSchema, gameplay, path);
    fact({ entityKey: key, kind: "treePoints", details: {
      startAmount: value.startAmount, maxPoints: value.maxPoints,
      gainRules: rows(value.gainRules, `${path}/gainRules`).map(({ row, path: rowPath }) => ({ trigger: named(row.gainType, `${rowPath}/gainType`), amount: row.amount, class: ref("classes", row.classId, `${rowPath}/classId`), skill: ref("skills", row.skillId, `${rowPath}/skillId`), item: ref("items", row.itemId, `${rowPath}/itemId`), itemCount: row.itemCount, npc: ref("npcs", row.npcId, `${rowPath}/npcId`), weaponTemplateId: row.weaponTemplateId < 0 ? null : row.weaponTemplateId })),
    } }, path);
  });
  each("bonuses", (key, gameplay, path) => {
    const value = decode(BonusSchema, gameplay, path);
    fact({ entityKey: key, kind: "bonuses", details: {
      learnedByDefault: value.learnedByDefault,
      ranks: rows(value.ranks, `${path}/ranks`).map(({ row, path: rankPath }) => ({
        rank: row.rankIndex, unlockCost: row.unlockCost, isEmpty: row.isEmpty, emptyTooltip: row.isEmpty ? row.emptyTooltip : null,
        conditionId: condition("bonusRank", `${key}:${row.rankIndex}`, row.requirements, `${rankPath}/requirements`),
        statEffects: stats(row.statEffects, `${rankPath}/statEffects`),
        petStatEffects: rows(row.petStatEffects, `${rankPath}/petStatEffects`).map(({ row: pet, path: petPath }) => ({ stat: required("stats", pet.statId, `${petPath}/statId`), amount: pet.amount, isPercent: pet.isPercent, targetType: named(pet.targetType, `${petPath}/targetType`), npc: ref("npcs", pet.npcId, `${petPath}/npcId`), speciesId: pet.speciesId < 0 ? null : pet.speciesId })),
      })),
    } }, path);
  });
  each("talentTrees", (key, gameplay, path) => {
    const value = decode(TalentTreeSchema, gameplay, path);
    fact({ entityKey: key, kind: "talentTrees", details: { tiers: value.tiers, treePoint: ref("treePoints", value.treePointId, `${path}/treePointId`) } }, path);
    for (const { row, path: nodePath } of rows(value.nodes, `${path}/nodes`)) {
      const nodeType = named(row.nodeType, `${nodePath}/nodeType`);
      const target = nodeTarget(nodeType.name, { ability: row.abilityId, bonus: row.bonusId, recipe: row.recipeId, resourceNode: row.resourceNodeId }, nodePath);
      out.talentNodes.push({ treeKey: key, nodeIndex: row.sourceIndex, nodeType, target, tier: row.tier, row: row.row, conditionId: condition("talentTreeNode", `${key}:${row.sourceIndex}`, row.requirements, `${nodePath}/requirements`), provenance: [pointer(reference, nodePath)] });
    }
  });
  each("spellbooks", (key, gameplay, path) => {
    const value = decode(SpellbookSchema, gameplay, path);
    fact({ entityKey: key, kind: "spellbooks", details: { sourceType: named(value.sourceType, `${path}/sourceType`) } }, path);
    for (const { row, path: nodePath } of rows(value.nodes, `${path}/nodes`)) {
      const nodeType = named(row.nodeType, `${nodePath}/nodeType`);
      out.spellbookNodes.push({ bookKey: key, nodeIndex: row.sourceIndex, nodeType, target: nodeTarget(nodeType.name, { ability: row.abilityId, bonus: row.bonusId }, nodePath), unlockLevel: row.unlockLevel, provenance: [pointer(reference, nodePath)] });
    }
  });
  each("races", (key, gameplay, path) => {
    const value = decode(RaceSchema, gameplay, path);
    fact({ entityKey: key, kind: "races", details: { offeredClasses: rows(value.availableClasses, `${path}/availableClasses`).map(({ row, path: rowPath }) => required("classes", row.classId, `${rowPath}/classId`)) } }, path);
  });
  each("abilities", (key, gameplay, path) => {
    const value = decode(AbilitySchema, gameplay, path);
    fact({ entityKey: key, kind: "abilities", details: {
      abilityType: named(value.abilityType, `${path}/abilityType`), learnedByDefault: value.learnedByDefault, requiresRangedWeapon: value.requiresRangedWeapon,
      ranks: rows(value.rankMechanics, `${path}/rankMechanics`).map(({ row, path: rankPath }) => ({
        rank: row.rankIndex, unlockCost: row.unlockCost, activationType: named(row.activationType, `${rankPath}/activationType`), castTime: row.castTime, channelTime: row.channelTime, cooldown: row.cooldown, usesGlobalCooldown: row.usesGlobalCooldown,
        minRange: row.minRange, maxRange: row.maxRange, targetType: named(row.targetType, `${rankPath}/targetType`), areaRadius: row.areaRadius, coneDegree: row.coneDegree, coneRange: row.coneRange, projectileCount: row.projectileCount, maxUnitsHit: row.maxUnitsHit,
        conditionId: condition("abilityRank", `${key}:${row.rankIndex}`, row.requirements, `${rankPath}/requirements`),
        effectsApplied: effects(row.effectsApplied, `${rankPath}/effectsApplied`), casterEffectsApplied: effects(row.casterEffectsApplied, `${rankPath}/casterEffectsApplied`),
      })),
    } }, path);
  });
  const heroic = support.heroicTierSettings;
  if ("unavailable" in heroic) blockers.push({ kind: "unavailable-progression-data", key: "support:/heroicTierSettings", detail: `${heroic.unavailable} at ${heroic.sourceFieldPath}.`, provenance: [pointer(reference, "/heroicTierSettings")] });
  else {
    const { asset, essenceTreePointId, ...values } = heroic;
    fact({ entityKey: HEROIC_TIER_KEY, kind: "heroicTier", details: { asset, essenceTreePoint: ref("treePoints", essenceTreePointId, "/heroicTierSettings/essenceTreePointId"), ...values } }, "/heroicTierSettings");
  }
  return out;

  // A node names the record of its type. The game reads only the id that matches the node type.
  function nodeTarget(nodeType: string, ids: { ability: number; bonus: number; recipe?: number; resourceNode?: number }, path: string): NormalizedReference | null {
    if (nodeType === "ability") return ref("abilities", ids.ability, `${path}/abilityId`);
    if (nodeType === "bonus") return ref("bonuses", ids.bonus, `${path}/bonusId`);
    if (nodeType === "recipe" && ids.recipe !== undefined) return ref("recipes", ids.recipe, `${path}/recipeId`);
    if (nodeType === "resourceNode" && ids.resourceNode !== undefined) return ref("resources", ids.resourceNode, `${path}/resourceNodeId`);
    blockers.push({ kind: "unsupported-enum", key: `support:${path}/nodeType`, detail: `Unsupported progression node type ${nodeType}.`, provenance: [pointer(reference, `${path}/nodeType`)] });
    return null;
  }
}

