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
  sockets: Array<{ socketType: string }>;
  enchantment: CatalogEndpoint | null;
  sellPrice: number | null;
  sellCurrency: CatalogEndpoint | null;
  buyPrice: number | null;
  buyCurrency: CatalogEndpoint | null;
  stackLimit: number;
  questDropOnly: boolean;
  corruptionToken: boolean;
  levelRequirement: number | null;
  actionAbilities: CatalogEndpoint[];
  conditionIds: string[];
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
  minRespawn: number | null;
  maxRespawn: number | null;
  minExperience: number | null;
  maxExperience: number | null;
  immuneToStun: boolean;
  immuneToSlow: boolean;
  aggroRange: number | null;
  stats: CatalogStatValue[];
  abilityPhases: Array<{ phaseIndex: number; name: string | null; requirement: string | null; abilities: CatalogEndpoint[] }>;
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

export interface CatalogRecipeFacts {
  entityKey: string;
  skill: CatalogEndpoint | null;
  station: CatalogEndpoint | null;
  learnedByDefault: boolean;
  ranks: Array<{ rank: number; unlockCost: number; experience: number; craftTime: number; products: Array<{ item: CatalogEndpoint; count: number; chance: number }>; materials: Array<{ item: CatalogEndpoint; count: number }> }>;
}

export interface CatalogFacts {
  entities: CatalogEntityRow[];
  items: CatalogItemFacts[];
  npcs: CatalogNpcFacts[];
  quests: CatalogQuestFacts[];
  tasks: CatalogTaskFacts[];
  places: CatalogPlaceFacts[];
  properties: CatalogPropertyFacts[];
  recipes: CatalogRecipeFacts[];
}

export interface CatalogCondition { conditionId: string; semantics: string; label: string; requirements: CatalogRequirement[] }
export interface CatalogRequirement { type: string; mandatory: boolean; target: CatalogEndpoint | null; amount: number | null; secondaryAmount: number | null; label: string }

// Loot rows: `displayedChance` is the value the game's own guide shows, which the measured rule
// establishes only for NPC loot entries (the authored rate rounded to one decimal). Other contexts
// keep `rawRate` and leave `displayedChance` null.
export interface CatalogDropRow {
  context: "npc" | "world" | "container";
  owner: CatalogEndpoint;
  item: CatalogEndpoint;
  lootTableId: number;
  entryIndex: number;
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
  containerLabel: string;
  sourceId: string;
  sceneNativeId: number | null;
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
