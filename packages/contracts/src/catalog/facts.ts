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
  stackLimit: number;
  questDropOnly: boolean;
  corruptionToken: boolean;
  equipmentRequirements: CatalogRequirementGroup[];
  useConditions: CatalogRequirementGroup[];
  actionAbilities: CatalogContextualAbilityReference[];
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
  experience: number | null;
  conditionIds: string[];
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
}

export interface CatalogCondition { conditionId: string; semantics: string; scope: "equipment" | "use" | null; label: string; requirements: CatalogRequirementGroup[] }
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

// Loot rows: `displayedChance` is the value the game's own guide shows, which the measured rule
// establishes only for NPC loot entries (the authored rate rounded to one decimal). Other contexts
// keep `rawRate` and leave `displayedChance` null.
export interface CatalogDropRow {
  context: "npc" | "world" | "container";
  owner: CatalogEndpoint;
  item: CatalogEndpoint;
  lootTableId: number | null;
  entryIndex: number | null;
  min: number | null;
  max: number | null;
  rawRate: number | null;
  displayedChance: number | null;
  levelBand: CatalogLevelRange | null;
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
  conditionIds: string[];
  placementIds: string[];
}

export type CatalogQuestRelationKind = "giver" | "turnIn" | "objective" | "reward" | "rewardChoice" | "itemGiven" | "worldZone";
export interface CatalogQuestRow {
  associationId: string;
  quest: CatalogEndpoint;
  kind: CatalogQuestRelationKind;
  index: number;
  counterpart: CatalogEndpoint | null;
  task: CatalogTaskFacts | null;
  count: number | null;
  experience: number | null;
  placementIds: string[];
}

export interface CatalogRecipeRow {
  recipe: CatalogEndpoint;
  item: CatalogEndpoint;
  role: "product" | "material";
  rank: number;
  count: number;
  chance: number | null;
}

export interface CatalogPlacementRow {
  placementId: string;
  sceneNativeId: number;
  sceneKey: string;
  mapSpaceId: string | null;
  label: string | null;
  roles: Array<{ role: string; npcEntityKey: string | null; scope: string }>;
  families: string[];
}

export interface CatalogTransitionRow {
  transitionId: string;
  sourceSceneKey: string | null;
  destinationSceneKey: string | null;
  transitionKind: string;
  placementIds: string[];
}

export interface CatalogRelations {
  drops: CatalogDropRow[];
  vendors: CatalogVendorRow[];
  gathers: CatalogGatherRow[];
  containers: CatalogContainerRow[];
  quests: CatalogQuestRow[];
  recipes: CatalogRecipeRow[];
  placements: CatalogPlacementRow[];
  transitions: CatalogTransitionRow[];
  conditions: CatalogCondition[];
}
