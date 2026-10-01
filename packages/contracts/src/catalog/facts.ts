import type { CatalogGatheringNode } from "./gathering";
import type { CatalogProgression } from "./progression";
import type { TooltipLine } from "./tooltip";

// Typed catalog facts and relation rows for the compendium. Publication reads these through the
// catalog queries and projects them into public documents; it never re-derives a fact from the
// opaque source payload.

// One end of a relation. An unresolved endpoint keeps the raw label so a row stays visible as text.
export type CatalogEndpoint = { entityKey: string; label: string | null } | { entityKey: null; label: string };

export interface CatalogLevelRange { min: number; max: number }

export interface CatalogEntityRow {
  entityKey: string;
  kind: string;
  nativeId: number;
  name: string | null;
  internalName?: string | null;
  description: string | null;
  iconAssetName: string | null;
  artwork: CatalogArtworkBinding[];
}

export interface CatalogArtworkBinding {
  role: "icon" | "portrait" | "artwork";
  assetId: string;
  sha256: string;
  bytes: number;
  width: number;
  height: number;
  sourceName: string;
}

export interface CatalogStatValue { stat: CatalogEndpoint; amount: number; isPercent: boolean }
export interface CatalogContextualAbilityReference { ability: CatalogEndpoint; rankIndex: number }
export interface CatalogRandomStatRule { stat: CatalogEndpoint; min: number; max: number; isPercent: boolean; whole: boolean; chance: number | null }

export interface CatalogItemGameAction {
  template: { nativeId: number; name: string | null } | null;
  type: string; chance: number; nodeAction: string; progressionType: string; teleportType: string; amount: number;
  target: CatalogEndpoint | null;
}

export interface CatalogItemFacts {
  entityKey: string;
  rarity: string | null;
  itemType: string | null;
  armorSlot: string | null;
  weaponSlot: string | null;
  weaponType: string | null;
  armorType: string | null;
  attackSpeed: number | null;
  minDamage: number | null;
  maxDamage: number | null;
  stats: CatalogStatValue[];
  randomStatsMax: number;
  randomStats: CatalogRandomStatRule[];
  sockets: Array<{ socketType: string | null; gemType: string | null }>;
  gem: { gemType: string | null; stats: CatalogStatValue[] } | null;
  enchantment: CatalogEndpoint | null;
  sellPrice: number | null;
  sellCurrency: CatalogEndpoint | null;
  buyPrice: number | null;
  buyCurrency: CatalogEndpoint | null;
  currency: CatalogEndpoint | null;
  stackLimit: number;
  questDropOnly: boolean;
  corruptionToken: boolean;
  equipmentRequirements: CatalogRequirementGroup[];
  useConditions: CatalogRequirementGroup[];
  actionAbilities: CatalogContextualAbilityReference[];
  gameActions: CatalogItemGameAction[];
  useLines: TooltipLine[];
  conditionIds: string[];
  // The set this item belongs to, from the set's own member list. An item that no set names has
  // none; the game's tooltip shows the set under the item's stats.
  gearSet: CatalogEndpoint | null;
}

export interface CatalogNpcAdventurer {
  class: CatalogEndpoint | null; race: CatalogEndpoint | null; preferredTree: CatalogEndpoint | null; keepPhaseAbilities: boolean; aiLogicTemplateKey: string | null;
  specialization: { class: CatalogEndpoint | null; role: string; preferredTree: CatalogEndpoint | null; behaviorName: string | null; priorityAbilities: CatalogEndpoint[]; blockedAbilities: CatalogEndpoint[]; blockedBonuses: number[]; allowedForms: number[] } | null;
}
export interface CatalogNpcFlightNetwork {
  resourcePath: string | null; stopId: string | null; interactionDistance: number | null; networkId: string; sceneName: string; mapWorldBounds: { x: number; y: number; width: number; height: number }; minimumFlyoverHeight: number; currency: CatalogEndpoint | null;
  stops: Array<{ id: string; name: string; landingPosition: { x: number; y: number; z: number }; landingYaw: number; knownInitially: boolean }>;
  routes: Array<{ from: string; to: string; bidirectional: boolean; fare: number; speed: number; departureCruiseWaypoint: number; arrivalCruiseWaypoint: number; waypoints: Array<{ x: number; y: number; z: number }> }>;
}
export interface CatalogNpcFacts {
  entityKey: string;
  minLevel: number | null;
  maxLevel: number | null;
  scalesWithPlayer: boolean;
  npcType: string | null;
  creatureType: string | null;
  family: string | null;
  faction: CatalogEndpoint | null;
  species: CatalogEndpoint | null;
  isMerchant: boolean;
  isQuestGiver: boolean;
  isCombatEnabled: boolean;
  isAuctioneer: boolean;
  isBanker: boolean;
  isFlightMaster: boolean;
  hunterTamable: boolean;
  hunterBeastRole: string | null;
  equipmentAppearanceSelections: string | null;
  adventurer: CatalogNpcAdventurer | null;
  flightNetwork: CatalogNpcFlightNetwork | null;
  minRespawn: number | null;
  maxRespawn: number | null;
  minExperience: number | null;
  maxExperience: number | null;
  // Percentages that `LevelingManager.GenerateMobEXP` adds when the creature's level is below or above the player's.
  lowerLevelExperienceModifier: number | null;
  higherLevelExperienceModifier: number | null;
  // `LevelingManager.GenerateMobEXP` adds the creature's level times this amount to the kill roll.
  experienceBonusPerLevel: number | null;
  immuneToStun: boolean;
  immuneToSlow: boolean;
  aggroRange: number | null;
  stats: CatalogStatValue[];
  abilityPhases: Array<{ phaseIndex: number; name: string | null; requirement: string | null; abilities: CatalogContextualAbilityReference[] }>;
  factionRewards: Array<{ faction: CatalogEndpoint; amount: number }>;
  linkedNpc: CatalogEndpoint | null;
  lootSpecialization: { armorType: string | null; weaponTypes: string[]; stat: CatalogEndpoint | null } | null;
}

export interface CatalogTaskFacts {
  entityKey: string;
  taskType: string;
  target: CatalogEndpoint | null;
  count: number | null;
  keepItems: boolean | null;
  sceneName: string | null;
}

export interface CatalogQuestFacts {
  entityKey: string;
  chainName: string | null;
  chainOrder: number | null;
  repeatable: boolean;
  turnInWithoutNpc: boolean;
  completedDescription: string | null;
  objectiveText: string | null;
  levelRequirement: number | null;
  // The level range and the dungeon that the game's QuestLevelRange computes; null without that evidence.
  levelRange: CatalogLevelRange | null;
  dungeon: CatalogEndpoint | null;
  experience: number | null;
  conditionIds: string[];
  worldQuest: CatalogWorldQuestFacts | null;
}

// The timing of the `RPGWorldQuest` that grants a quest when the player enters an active zone. The
// fields keep the authored seconds: active duration once it spawns, the cooldowns after completion and
// after expiry, the random jitter added to a cooldown, and the random initial cooldown at scene start.
export interface CatalogWorldQuestFacts {
  availableSeconds: number;
  cooldownAfterCompletionSeconds: number;
  cooldownAfterExpirySeconds: number;
  cooldownJitterSeconds: number;
  initialRollSeconds: number;
}

export interface CatalogPlaceFacts {
  entityKey: string;
  placeType: "dungeon" | "zone" | "region" | "interior";
  guideIncluded: boolean;
  guideDescription: string | null;
  levelRange: CatalogLevelRange | null;
  mapSpaceIds: string[];
  bosses: CatalogEndpoint[];
  parentSceneKey: string | null;
}

export interface CatalogPropertyFacts {
  entityKey: string;
  income: number | null;
  // Seconds of game time between two income payments, a global economy setting.
  incomeInterval: number | null;
  purchasePrice: number | null;
  sellPrice: number | null;
  currency: CatalogEndpoint | null;
  propertyType: string | null;
}

export interface CatalogAbilityFacts { entityKey: string; ranks: Array<{ rankIndex: number; lines: TooltipLine[] }> }

export interface CatalogRecipeFacts {
  entityKey: string;
  skill: CatalogEndpoint | null;
  station: CatalogEndpoint | null;
  learnedByDefault: boolean;
  ranks: Array<{ rank: number; unlockCost: number; experience: number; craftTime: number; products: Array<{ item: CatalogEndpoint; count: number; chance: number }>; materials: Array<{ item: CatalogEndpoint; count: number }> }>;
}

// A set's members and the tiers that reward wearing them: the game's tooltip reads
// "(3) Tier 1: +10% Poison Damage, +10 Dodge chance" under the member list.
export interface CatalogGearSetFacts {
  entityKey: string;
  members: CatalogEndpoint[];
  tiers: Array<{ equipped: number; stats: CatalogStatValue[] }>;
}

export interface CatalogCorruptionBonus {
  stat: CatalogEndpoint;
  amountPerLevel: number;
  isPercent: boolean;
  sourceFieldPath: string;
}

export interface CatalogCorruptionFacts {
  maxLevel: number | null;
  gearAllStatsPercentPerLevel: number | null;
  gearStatBonuses: CatalogCorruptionBonus[] | null;
  mobStatBonuses: CatalogCorruptionBonus[] | null;
  affixesPerToken: number | null;
  affixes: Array<{ id: number; name: string; description: string; available: boolean }> | null;
  token: CatalogEndpoint | null;
  heart: CatalogEndpoint | null;
  dungeons: Array<{
    scene: CatalogEndpoint;
    totalSeconds: number | null;
    firstRemainingSeconds: number | null;
    secondRemainingSeconds: number | null;
    maxLootItems: number | null;
    bosses: CatalogEndpoint[] | null;
    lootTables: CatalogEndpoint[] | null;
    token: CatalogEndpoint | null;
    provenance: Array<{ path: string; sha256: string; pointer?: string }>;
  }>;
  heartRequirements: Array<{ sourceId: string; place: CatalogEndpoint | null; count: number; consume: boolean; sourceFieldPath: string; provenance: Array<{ path: string; sha256: string; pointer?: string }> }> | null;
  provenance: Array<{ path: string; sha256: string; pointer?: string }>;
}

export interface CatalogFacts {
  entities: CatalogEntityRow[];
  items: CatalogItemFacts[];
  npcs: CatalogNpcFacts[];
  quests: CatalogQuestFacts[];
  tasks: CatalogTaskFacts[];
  places: CatalogPlaceFacts[];
  properties: CatalogPropertyFacts[];
  abilities: CatalogAbilityFacts[];
  recipes: CatalogRecipeFacts[];
  gearSets: CatalogGearSetFacts[];
  progression: CatalogProgression;
  gatheringNodes: CatalogGatheringNode[];
  corruption?: CatalogCorruptionFacts | null;
}

export interface CatalogCondition { conditionId: string; semantics: string; scope: "equipment" | "use" | null; label: string; requirements: CatalogRequirementGroup[] }

// How a world source's presence depends on a condition. `requires`: the source exists or works only while
// the condition holds; its own spawn, interaction, and activation requirements and every activation toggle
// above it give this effect. `excludes`: a deactivation toggle above it removes it while the condition
// holds. `temporary`: a timed toggle above it keeps it for `durationSeconds` after the condition holds.
export type CatalogAvailabilityEffect = "requires" | "excludes" | "temporary";
export interface CatalogAvailabilityRule { effect: CatalogAvailabilityEffect; conditionId: string; durationSeconds: number | null }

// A requirement's display text in reading order. An endpoint span names the entity that the requirement
// references, so a page can link it; the requirement label is the spans' text joined.
export type CatalogRequirementSpan = { text: string } | { endpoint: CatalogEndpoint };
export interface CatalogRequirementGroup { mode: "all" | "any"; checkCount: boolean; requiredCount: number | null; requirements: CatalogRequirement[] }
export interface CatalogRequirementNamedValue { value: number; name: string }
export interface CatalogRequirementEntry { nativeId: number; name: string | null; internalName: string | null; fileName: string | null; description: string | null; nativeType: string; text: string }
export interface CatalogRequirementTime { checkYear: boolean; checkMonth: boolean; checkWeek: boolean; checkDay: boolean; checkHour: boolean; checkMinute: boolean; checkSecond: boolean; checkGlobalSpeed: boolean; year: number; month: number; week: number; day: number; hour: number; minute: number; second: number; globalSpeed: number }
export interface CatalogRequirementReferences {
  ability: CatalogEndpoint | null; bonus: CatalogEndpoint | null; recipe: CatalogEndpoint | null; resource: CatalogEndpoint | null; effect: CatalogEndpoint | null; npc: CatalogEndpoint | null; stat: CatalogEndpoint | null; faction: CatalogEndpoint | null; combo: CatalogEndpoint | null; race: CatalogEndpoint | null; levels: CatalogEndpoint | null; class: CatalogEndpoint | null; species: CatalogEndpoint | null; item: CatalogEndpoint | null; currency: CatalogEndpoint | null; point: CatalogEndpoint | null; talentTree: CatalogEndpoint | null; skill: CatalogEndpoint | null; spellbook: CatalogEndpoint | null; weaponTemplate: CatalogEndpoint | null; enchantment: CatalogEndpoint | null; gearSet: CatalogEndpoint | null; gameScene: CatalogEndpoint | null; quest: CatalogEndpoint | null; dialogue: CatalogEndpoint | null;
}
export interface CatalogRequirementSubtypes {
  effectTag: CatalogRequirementEntry | null; factionStance: CatalogRequirementEntry | null; itemType: CatalogRequirementEntry | null; weaponType: CatalogRequirementEntry | null; weaponSlot: CatalogRequirementEntry | null; armorType: CatalogRequirementEntry | null; armorSlot: CatalogRequirementEntry | null; gender: CatalogRequirementEntry | null; npcFamily: CatalogRequirementEntry | null; region: CatalogRequirementEntry | null;
}
export interface CatalogRequirement {
  type: CatalogRequirementNamedValue;
  rule: CatalogRequirementNamedValue;
  label: string;
  spans: CatalogRequirementSpan[];
  references: CatalogRequirementReferences;
  knowledge: CatalogRequirementNamedValue | null;
  state: CatalogRequirementNamedValue | null;
  comparison: CatalogRequirementNamedValue | null;
  value: CatalogRequirementNamedValue | null;
  ownership: CatalogRequirementNamedValue | null;
  itemCondition: CatalogRequirementNamedValue | null;
  progression: CatalogRequirementNamedValue | null;
  entity: CatalogRequirementNamedValue | null;
  pointType: CatalogRequirementNamedValue | null;
  dialogueNodeState: CatalogRequirementNamedValue | null;
  effectCondition: CatalogRequirementNamedValue | null;
  amountType: CatalogRequirementNamedValue | null;
  timeType: CatalogRequirementNamedValue | null;
  timeValue: CatalogRequirementNamedValue | null;
  effectType: CatalogRequirementNamedValue | null;
  questState: CatalogRequirementNamedValue | null;
  amounts: { primary: number; secondary: number; float: number; isPercent: boolean };
  flags: { consume: boolean; first: boolean; second: boolean; third: boolean };
  subtypes: CatalogRequirementSubtypes;
  dialogueNode: { nativeType: string; text: string } | null;
  times: [CatalogRequirementTime | null, CatalogRequirementTime | null];
}

// Loot rows of the tables that creatures and the world loot settings bind, one row per table entry. `rawRate` is the
// authored entry rate, and `displayedChance` rounds it to one decimal, which is the value that the Adventure Guide
// shows for creature loot. `tableRate` is the authored chance that a kill rolls the table. `tableMinimum` and
// `tableLimit` are the fewest and the most items that one roll gives. The limit is set only when the table has more
// entries than the limit. World loot rows carry `creatureLevel`: the creature levels that can drop the item, with an
// open maximum as null.
export interface CatalogDropRow {
  context: "npc" | "world";
  owner: CatalogEndpoint;
  item: CatalogEndpoint;
  lootTableId: number;
  entryIndex: number;
  min: number | null;
  max: number | null;
  rawRate: number | null;
  displayedChance: number | null;
  tableRate: number | null;
  tableMinimum: number | null;
  tableLimit: number | null;
  creatureLevel: { min: number; max: number | null } | null;
  conditionIds: string[];
  placementIds: string[];
}

export interface CatalogVendorRow {
  npc: CatalogEndpoint;
  item: CatalogEndpoint;
  currency: CatalogEndpoint | null;
  cost: number;
  merchantTableId: number;
  stockIndex: number;
  conditionIds: string[];
  placementIds: string[];
}

export interface CatalogGatherRow {
  producerLabel: string;
  sourceId: string | null;
  sceneNativeId: number | null;
  resource: CatalogEndpoint | null;
  // The gathering node of the yield's own spawner option, when the catalog links one.
  gatheringNode: CatalogEndpoint | null;
  item: CatalogEndpoint;
  skill: CatalogEndpoint | null;
  rank: number | null;
  min: number | null;
  max: number | null;
  rawRate: number | null;
  conditionIds: string[];
  placementIds: string[];
}

export interface CatalogContainerRow {
  containerType: string | null;
  sourceId: string;
  place: CatalogEndpoint | null;
  item: CatalogEndpoint;
  min: number | null;
  max: number | null;
  rawRate: number | null;
  availability: CatalogAvailabilityRule[];
  placementIds: string[];
}

// Loot from an interactive object whose `Chest` action names a loot table: a pumpkin, a coin purse, or an
// egg cluster that a quest asks for. `objectName` is the object's authored display name, which can carry markup.
export interface CatalogInteractionRow {
  objectName: string | null;
  sourceId: string;
  place: CatalogEndpoint | null;
  item: CatalogEndpoint;
  min: number | null;
  max: number | null;
  rawRate: number | null;
  availability: CatalogAvailabilityRule[];
  placementIds: string[];
}

// `giver` and `turnIn` rows name an NPC whose native quest service is on. `worldOffer` rows name a world
// quest zone that offers the quest; `objectStart` rows name an interactive object whose `Quest` action
// starts it. An `objective` row's counterpart is its task's target. Reward rows come from the typed rewards,
// so `counterpart` is the entity that `rewardType` names: an item, a currency, or a faction.
export type CatalogQuestRelationKind = "giver" | "turnIn" | "objective" | "reward" | "rewardChoice" | "itemGiven" | "worldOffer" | "objectStart";
export interface CatalogQuestRow {
  associationId: string;
  quest: CatalogEndpoint;
  kind: CatalogQuestRelationKind;
  index: number;
  counterpart: CatalogEndpoint | null;
  task: CatalogTaskFacts | null;
  count: number | null;
  rewardType: string | null;
  // The world source of a `worldOffer` or `objectStart` row, its object name, and its availability.
  sourceId: string | null;
  label: string | null;
  availability: CatalogAvailabilityRule[];
  // The objects whose `CompleteTask` action completes an `objective` row's task.
  completions: CatalogObjectiveCompletion[];
  worldOffer: CatalogWorldOffer | null;
  placementIds: string[];
}

export interface CatalogObjectiveCompletion { sourceId: string; label: string | null; placementIds: string[]; availability: CatalogAvailabilityRule[] }

// A zone's delay before it picks the next quest, and every quest in the zone's effective pool.
export interface CatalogWorldOffer { zoneDelaySeconds: number | null; pool: CatalogEndpoint[] }

// A world source with at least one availability rule. `subjects` are the NPCs a spawner can spawn or the
// crafting station a station source serves; `label` is an interactive object's or container's name.
export type CatalogGatedSourceFamily = "npcProducer" | "interaction" | "container" | "resource" | "craftingStation" | "worldQuestZone";
export interface CatalogGatedSourceRow {
  sourceId: string;
  family: CatalogGatedSourceFamily;
  label: string | null;
  subjects: CatalogEndpoint[];
  placementIds: string[];
  availability: CatalogAvailabilityRule[];
}

export interface CatalogRecipeRow {
  recipe: CatalogEndpoint;
  item: CatalogEndpoint;
  role: "product" | "material";
  rank: number;
  count: number;
  chance: number | null;
}

// A RandomActivator choice that can disable a placement. `entries` counts the entries of the choice's list, and
// `options` counts their distinct targets. `enabled` is how many distinct entries the game enables, and `entryIndexes`
// lists the entries whose targets contain the placement.
export interface CatalogRandomChoice {
  choiceId: string;
  entries: number;
  options: number;
  enabled: number;
  entryIndexes: number[];
}

export interface CatalogPlacementRow {
  placementId: string;
  sceneNativeId: number;
  sceneKey: string;
  mapSpaceId: string | null;
  label: string | null;
  // The smallest named region that contains the placement's map position, when one does.
  area: string | null;
  roles: Array<{ role: string; npcEntityKey: string | null; scope: string }>;
  families: string[];
  randomChoices: ReadonlyArray<CatalogRandomChoice>;
}

export interface CatalogTransitionRow {
  transitionId: string;
  sourceSceneKey: string | null;
  destinationSceneKey: string | null;
  transitionKind: string;
  placementIds: string[];
  // The object that starts the transition, when the scan identified it. `mapPosition` is null when the object has no
  // position on a map.
  start: { mapSpaceId: string | null; mapPosition: [number, number] | null; worldPosition: [number, number, number] } | null;
}

export interface CatalogRelations {
  drops: CatalogDropRow[];
  vendors: CatalogVendorRow[];
  gathers: CatalogGatherRow[];
  containers: CatalogContainerRow[];
  interactions: CatalogInteractionRow[];
  quests: CatalogQuestRow[];
  recipes: CatalogRecipeRow[];
  placements: CatalogPlacementRow[];
  transitions: CatalogTransitionRow[];
  conditions: CatalogCondition[];
  gatedSources: CatalogGatedSourceRow[];
}
