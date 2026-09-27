import type { NormalizedReference, ProvenanceReference } from "./query";

// Progression facts: how characters progress and what game systems do. The catalog resolves each native id to a
// reference. A reference whose record is missing keeps the id in its label and has no entity key, and the catalog
// records a missing-reference coverage issue for it. An enum keeps its native number and name.

export interface ProgressionEnum { value: number; name: string }
export interface ProgressionStat { stat: NormalizedReference; amount: number; isPercent: boolean }
export interface ProgressionCustomStat { stat: NormalizedReference; minValue: number | null; maxValue: number | null; startPercentage: number | null; addedValue: number; valuePerLevel: number; isPercent: boolean; chance: number }
export interface ProgressionStartItem { item: NormalizedReference; count: number; equipped: boolean }
export interface ProgressionActionAbility { ability: NormalizedReference; keyType: ProgressionEnum }
export interface ProgressionAllocatedStat { stat: NormalizedReference; maxValue: number; cost: number; valueAdded: number; isPercent: boolean }
export interface ProgressionAppliedEffect { effect: NormalizedReference; chance: number; rank: number; target: ProgressionEnum; delay: number }

export interface ProgressionClass {
  autoAttackAbility: NormalizedReference | null;
  levelTemplate: NormalizedReference | null;
  // `stats` are the class's base stats with their growth per level. `customStats` override stat rules for the class.
  // A class that uses a stat list template takes `customStats` from the template.
  stats: Array<ProgressionStat & { bonusPerLevel: number }>;
  customStats: ProgressionCustomStat[];
  statListTemplate: { nativeId: number; name: string | null } | null;
  skillBonuses: Array<{ skill: NormalizedReference; amount: number }>;
  startItems: ProgressionStartItem[];
  actionAbilities: ProgressionActionAbility[];
  allocationStatPoints: number;
  allocatedStats: ProgressionAllocatedStat[];
}

export interface ProgressionSkill {
  automaticallyAdded: boolean;
  maxLevel: number;
  levelTemplate: NormalizedReference | null;
  stats: Array<ProgressionStat & { bonusPerLevel: number }>;
  customStats: ProgressionCustomStat[];
  statListTemplate: { nativeId: number; name: string | null } | null;
  startItems: ProgressionStartItem[];
  actionAbilities: ProgressionActionAbility[];
}

export interface ProgressionLevelTemplate { levels: number; baseExperience: number; increaseAmount: number; rows: Array<{ level: number; name: string | null; experienceRequired: number }> }

export interface ProgressionEffectRank {
  rank: number;
  damageType: ProgressionEnum; customDamageType: string | null; customHealingType: string | null;
  damage: number; alteredStat: NormalizedReference | null; flatCalculation: boolean; cannotCrit: boolean;
  skillModifier: number; skillModifierStat: NormalizedReference | null; weaponDamageModifier: number; useWeapon1Damage: boolean; useWeapon2Damage: boolean;
  lifesteal: number; maxHealthModifier: number; missingHealthModifier: number; delay: number;
  requiredEffect: NormalizedReference | null; requiredEffectDamageModifier: number; damageStat: NormalizedReference | null; damageStatModifier: number;
  teleportType: ProgressionEnum; teleportScene: NormalizedReference | null; lootTable: NormalizedReference | null;
  pet: NormalizedReference | null; petDuration: number; petSpawnCount: number;
  knockbackDistance: number; motionDistance: number;
  dispelType: ProgressionEnum; dispelEffectType: ProgressionEnum; dispelEffectTag: string | null; dispelEffect: NormalizedReference | null;
  tauntFlatThreat: number; resurrectHealthPercent: number;
  statEffects: ProgressionStat[];
  nestedEffects: ProgressionAppliedEffect[];
}
export interface ProgressionEffect {
  effectType: ProgressionEnum; tag: string | null; isState: boolean; isBuffOnSelf: boolean; stackLimit: number; allowMultiple: boolean; allowMixedCaster: boolean;
  pulses: number; duration: number; endless: boolean; canBeManuallyRemoved: boolean; isPersistent: boolean;
  ranks: ProgressionEffectRank[];
}

export interface ProgressionEnchantment {
  appliesTo: Array<{ type: ProgressionEnum; itemType: string | null; itemRarity: string | null; weaponType: string | null; armorType: string | null; armorSlot: string | null; weaponSlot: string | null }>;
  tiers: Array<{ tier: number; successRate: number; enchantTime: number; skill: NormalizedReference | null; skillExperience: number; currencyCosts: Array<{ currency: NormalizedReference; amount: number }>; itemCosts: Array<{ item: NormalizedReference; count: number }>; stats: ProgressionStat[] }>;
}

export interface ProgressionStatRules {
  minValue: number | null; maxValue: number | null; baseValue: number; isPercentStat: boolean; isVitalityStat: boolean; isPersistent: boolean; startPercentage: number;
  regeneration: Array<{ when: "outside-combat" | "in-combat"; amount: number; interval: number }>;
  shiftsInSprint: boolean; shiftsInBlock: boolean;
  uiCategory: string | null; statCategory: string | null; procCooldown: number;
  statBonuses: Array<{ statType: ProgressionEnum; modifyValue: number; damageType: ProgressionEnum; customDamageType: string | null; customHealingType: string | null; resistanceStat: NormalizedReference | null; penetrationStat: NormalizedReference | null; stat: NormalizedReference | null; creatureType: ProgressionEnum }>;
  onHitEffects: Array<{ effect: NormalizedReference; rank: number; target: ProgressionEnum; tag: ProgressionEnum; chance: number }>;
}

export interface ProgressionFaction {
  showInReputation: boolean;
  stances: Array<{ stance: string | null; pointsRequired: number; alignmentToPlayer: ProgressionEnum }>;
  relations: Array<{ faction: NormalizedReference; defaultStance: string | null; startingPoints: number }>;
}

export interface ProgressionTreePoint {
  startAmount: number; maxPoints: number;
  gainRules: Array<{ trigger: ProgressionEnum; amount: number; class: NormalizedReference | null; skill: NormalizedReference | null; item: NormalizedReference | null; itemCount: number; npc: NormalizedReference | null; weaponTemplateId: number | null }>;
}

export interface ProgressionBonus {
  learnedByDefault: boolean;
  ranks: Array<{ rank: number; unlockCost: number; isEmpty: boolean; emptyTooltip: string | null; conditionId: string | null; statEffects: ProgressionStat[]; petStatEffects: Array<ProgressionStat & { targetType: ProgressionEnum; npc: NormalizedReference | null; speciesId: number | null }> }>;
}

export interface ProgressionTalentTree { tiers: number; treePoint: NormalizedReference | null }
export interface ProgressionSpellbook { sourceType: ProgressionEnum }
// The classes that a race offers, in authored order. A class without a record keeps its id in the label and has no key.
export interface ProgressionRace { offeredClasses: NormalizedReference[] }

export interface ProgressionAbility {
  abilityType: ProgressionEnum; learnedByDefault: boolean; requiresRangedWeapon: boolean;
  ranks: Array<{ rank: number; unlockCost: number; activationType: ProgressionEnum; castTime: number; channelTime: number; cooldown: number; usesGlobalCooldown: boolean; minRange: number; maxRange: number; targetType: ProgressionEnum; areaRadius: number; coneDegree: number; coneRange: number; projectileCount: number; maxUnitsHit: number; conditionId: string | null; effectsApplied: ProgressionAppliedEffect[]; casterEffectsApplied: ProgressionAppliedEffect[] }>;
}

export type ProgressionDetails =
  | { kind: "classes"; details: ProgressionClass }
  | { kind: "skills"; details: ProgressionSkill }
  | { kind: "levels"; details: ProgressionLevelTemplate }
  | { kind: "effects"; details: ProgressionEffect }
  | { kind: "enchantments"; details: ProgressionEnchantment }
  | { kind: "stats"; details: ProgressionStatRules }
  | { kind: "factions"; details: ProgressionFaction }
  | { kind: "treePoints"; details: ProgressionTreePoint }
  | { kind: "bonuses"; details: ProgressionBonus }
  | { kind: "talentTrees"; details: ProgressionTalentTree }
  | { kind: "spellbooks"; details: ProgressionSpellbook }
  | { kind: "races"; details: ProgressionRace }
  | { kind: "abilities"; details: ProgressionAbility };
export type ProgressionKind = ProgressionDetails["kind"];

export type NormalizedProgressionFact = ProgressionDetails & { entityKey: string; name: string | null; provenance: ProvenanceReference[] };
// A class or skill that holds a talent tree or a spellbook, in authored order.
export interface NormalizedProgressionLink { ownerKey: string; linkIndex: number; linkKind: "talentTree" | "spellbook"; target: NormalizedReference; provenance: ProvenanceReference[] }
export interface NormalizedTalentNode { treeKey: string; nodeIndex: number; nodeType: ProgressionEnum; target: NormalizedReference | null; tier: number; row: number; conditionId: string | null; provenance: ProvenanceReference[] }
export interface NormalizedSpellbookNode { bookKey: string; nodeIndex: number; nodeType: ProgressionEnum; target: NormalizedReference | null; unlockLevel: number; provenance: ProvenanceReference[] }

// Query output. `learners` answers who gives an ability, `unlocks` which talent node unlocks a recipe or a resource
// node, and `appliers` what applies an effect.
export type CatalogProgressionFact = ProgressionDetails & { entityKey: string; name: string | null };
export interface CatalogProgressionLearner {
  ability: string;
  owner: NormalizedReference;
  via: "talentTree" | "spellbook" | "autoAttack" | "actionAbility";
  source: NormalizedReference | null;
  level: number | null; tier: number | null; row: number | null;
}
export interface CatalogProgressionUnlock { target: string; owner: NormalizedReference | null; tree: NormalizedReference; tier: number; row: number }
export interface CatalogProgressionApplier { effect: string; source: NormalizedReference; via: "ability" | "casterAbility" | "effect" | "statOnHit"; rank: number | null; chance: number }
export interface CatalogProgression {
  facts: CatalogProgressionFact[];
  links: Array<{ owner: string; linkIndex: number; linkKind: "talentTree" | "spellbook"; target: NormalizedReference }>;
  talentNodes: Array<{ tree: string; nodeIndex: number; nodeType: string; target: NormalizedReference | null; tier: number; row: number; conditionId: string | null }>;
  spellbookNodes: Array<{ book: string; nodeIndex: number; nodeType: string; target: NormalizedReference | null; unlockLevel: number }>;
  learners: CatalogProgressionLearner[];
  unlocks: CatalogProgressionUnlock[];
  appliers: CatalogProgressionApplier[];
  // Keys of the classes that at least one race offers.
  offeredClasses: string[];
}
