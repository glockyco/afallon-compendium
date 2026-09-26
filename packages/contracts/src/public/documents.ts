import { Type, type Static, type TSchema } from "typebox";
import { schemaRegistry } from "../schema-registry";
import { count, hash, number, publicMarkerCategory, resourceReference, text, PublicLevelRangeSchema, StaticResourceIdentityFields } from "./primitives";

const percent = Type.Number({ minimum: 0, maximum: 100 });
const optional = <T extends TSchema>(schema: T) => Type.Optional(schema);
const nullableText = Type.Union([Type.String(), Type.Null()]);
const identity = StaticResourceIdentityFields;

// Kinds with pages own a route and a document schema. Kinds without pages still have references,
// names, and icons, so a stat or currency renders as text with its icon rather than as a dead link.
export const PUBLIC_PAGE_KIND_VALUES = ["items", "npcs", "quests", "places", "properties", "abilities", "recipes", "gearSets"] as const;
export type PublicPageKind = typeof PUBLIC_PAGE_KIND_VALUES[number];
export const PUBLIC_REFERENCE_KIND_VALUES = [...PUBLIC_PAGE_KIND_VALUES, "currencies", "stats", "factions", "skills", "classes", "races", "enchantments", "effects", "species", "lootTables", "craftingStations"] as const;
export type PublicReferenceKind = typeof PUBLIC_REFERENCE_KIND_VALUES[number];
const pageKind = Type.Union([Type.Literal("items"), Type.Literal("npcs"), Type.Literal("quests"), Type.Literal("places"), Type.Literal("properties"), Type.Literal("abilities"), Type.Literal("recipes"), Type.Literal("gearSets")]);
const referenceKind = Type.Union([
  ...pageKind.anyOf,
  Type.Literal("currencies"), Type.Literal("stats"), Type.Literal("factions"), Type.Literal("skills"), Type.Literal("classes"), Type.Literal("races"),
  Type.Literal("enchantments"), Type.Literal("effects"), Type.Literal("species"), Type.Literal("lootTables"), Type.Literal("craftingStations"),
]);
export const PUBLIC_SLUG_PATTERN = "^[a-z0-9]+(?:-[a-z0-9]+)*$";
const slug = Type.String({ pattern: PUBLIC_SLUG_PATTERN });
const artUrl = Type.String({ pattern: "^art/[a-f0-9]{64}\\.webp$" });

export const ArtRefSchema = Type.Object({ url: artUrl, sha256: hash, bytes: count, width: Type.Integer({ minimum: 1 }), height: Type.Integer({ minimum: 1 }) }, { additionalProperties: false });
export type ArtRef = Static<typeof ArtRefSchema>;

// The only link shape. `slug` is present exactly when the kind has pages; the publication audit
// enforces that pairing because a schema cannot express it per kind.
export const EntityRefSchema = Type.Object({
  key: text, kind: referenceKind, name: text,
  slug: optional(slug), icon: optional(ArtRefSchema),
}, { additionalProperties: false });
export type EntityRef = Static<typeof EntityRefSchema>;

export const UnresolvedRefSchema = Type.Object({ key: Type.Null(), label: text }, { additionalProperties: false });
export type UnresolvedRef = Static<typeof UnresolvedRefSchema>;

export const RefSchema = Type.Union([EntityRefSchema, UnresolvedRefSchema]);
export type Ref = Static<typeof RefSchema>;

export const PlacementRefSchema = Type.Object({ placementId: text, mapSpaceId: text, label: text }, { additionalProperties: false });
export type PlacementRef = Static<typeof PlacementRefSchema>;

const tooltipTone = Type.Union([Type.Literal("positive"), Type.Literal("info"), Type.Literal("effect"), Type.Literal("muted"), Type.Literal("damage"), Type.Literal("negative"), Type.Literal("control"), Type.Literal("description")]);
export const NativeTextSpanSchema = Type.Object({ text, tone: Type.Union([tooltipTone, Type.Null()]), italic: Type.Boolean() }, { additionalProperties: false });
export const NativeTextLineSchema = Type.Object({ spans: Type.Array(NativeTextSpanSchema) }, { additionalProperties: false });
export type NativeTextSpan = Static<typeof NativeTextSpanSchema>;
export type NativeTextLine = Static<typeof NativeTextLineSchema>;

export const RequirementNamedValueSchema = Type.Object({ value: Type.Integer(), name: text }, { additionalProperties: false });
// A requirement's display text in reading order. A ref span names the entity that the requirement
// references, so a page links it; `label` is the spans' text joined for places that show plain text.
export const RequirementSpanSchema = Type.Union([
  Type.Object({ text }, { additionalProperties: false }),
  Type.Object({ ref: RefSchema }, { additionalProperties: false }),
]);
export type RequirementSpan = Static<typeof RequirementSpanSchema>;

// The catalog words each requirement from its complete native predicate: target, state, comparison, ownership,
// item condition, subtype, and threshold. A document publishes that wording with the requirement type and rule;
// the raw predicate fields stay in the catalog.
export const RequirementRefSchema = Type.Object({
  type: RequirementNamedValueSchema, rule: RequirementNamedValueSchema, label: text, spans: Type.Array(RequirementSpanSchema, { minItems: 1 }),
}, { additionalProperties: false });
export type RequirementRef = Static<typeof RequirementRefSchema>;

export const RequirementGroupSchema = Type.Object({
  mode: Type.Union([Type.Literal("all"), Type.Literal("any")]), checkCount: Type.Boolean(),
  requiredCount: optional(count), requirements: Type.Array(RequirementRefSchema, { minItems: 1 }),
}, { additionalProperties: false });
export type RequirementGroup = Static<typeof RequirementGroupSchema>;

// When a world source exists or works. `requires`: only while the requirements hold. `excludes`: not while
// they hold. `temporary`: for `durationSeconds` after they hold.
export const AvailabilityRuleSchema = Type.Object({
  effect: Type.Union([Type.Literal("requires"), Type.Literal("excludes"), Type.Literal("temporary")]),
  requirements: Type.Array(RequirementGroupSchema, { minItems: 1 }), durationSeconds: optional(number),
}, { additionalProperties: false });
export type AvailabilityRule = Static<typeof AvailabilityRuleSchema>;

const refs = Type.Array(RefSchema);
const requirements = Type.Array(RequirementGroupSchema);
const placements = Type.Array(PlacementRefSchema);
const availability = Type.Array(AvailabilityRuleSchema);

export const StatRowSchema = Type.Object({ stat: RefSchema, amount: number, isPercent: Type.Boolean() }, { additionalProperties: false });
export type StatRow = Static<typeof StatRowSchema>;

export const SocketRowSchema = Type.Object({ socketType: optional(text), gemType: optional(text) }, { additionalProperties: false });
export type SocketRow = Static<typeof SocketRowSchema>;

// An authored range the game rolls when the item drops. `chance` is the authored roll chance.
export const RandomStatRowSchema = Type.Object({ stat: RefSchema, min: number, max: number, isPercent: Type.Boolean(), whole: Type.Boolean(), chance: optional(percent) }, { additionalProperties: false });
export type RandomStatRow = Static<typeof RandomStatRowSchema>;

// A gem item fits one socket type and grants its stats once socketed.
export const GemSchema = Type.Object({ gemType: optional(text), stats: Type.Array(StatRowSchema) }, { additionalProperties: false });
export type Gem = Static<typeof GemSchema>;

export const PriceSchema = Type.Object({ amount: count, currency: RefSchema }, { additionalProperties: false });
export type Price = Static<typeof PriceSchema>;

// Relation rows are shared by both endpoints: an NPC's `drops` and an item's `droppedBy` use the
// same `DropRow` with `counterpart` pointing across. `chance` is present only when measured.
//
// A row never carries placement ids. Each document already lists its own `locations`, and the
// counterpart's locations belong to the counterpart's document, so repeating them per row would
// square the data: one creature with 127 placements and 18 drops would carry 2,286 placement refs
// that say nothing new. Where the source of a row has no page of its own, the row carries how many
// placements produce it and the reader reaches them through the atlas, which already highlights
// every placement of an item key or a marker category.
export const DropRowSchema = Type.Object({
  counterpart: RefSchema, min: optional(count), max: optional(count), chance: optional(percent),
  levelBand: optional(PublicLevelRangeSchema), requirements,
}, { additionalProperties: false });
export type DropRow = Static<typeof DropRowSchema>;

export const VendorRowSchema = Type.Object({ counterpart: RefSchema, price: PriceSchema, requirements }, { additionalProperties: false });
export type VendorRow = Static<typeof VendorRowSchema>;

export const GatherRowSchema = Type.Object({
  counterpart: optional(RefSchema), label: text, skill: optional(RefSchema), rank: optional(count),
  min: optional(count), max: optional(count), chance: optional(percent), placementCount: count,
}, { additionalProperties: false });
export type GatherRow = Static<typeof GatherRowSchema>;

// Loot from a world object without a page of its own: a container, or an interactive object whose action
// opens a loot table. `label` names the container type or the object.
export const ContainerRowSchema = Type.Object({
  counterpart: optional(RefSchema), label: text, min: optional(count), max: optional(count), chance: optional(percent), availability, placementCount: count,
}, { additionalProperties: false });
export type ContainerRow = Static<typeof ContainerRowSchema>;

export const QuestGivenRowSchema = Type.Object({ counterpart: RefSchema, count }, { additionalProperties: false });
export type QuestGivenRow = Static<typeof QuestGivenRowSchema>;

export const QuestRewardRowSchema = Type.Object({ counterpart: RefSchema, count, choice: Type.Boolean() }, { additionalProperties: false });
export type QuestRewardRow = Static<typeof QuestRewardRowSchema>;

export const QuestLinkRowSchema = Type.Object({ counterpart: RefSchema, role: Type.Union([Type.Literal("gives"), Type.Literal("completes")]) }, { additionalProperties: false });
export type QuestLinkRow = Static<typeof QuestLinkRowSchema>;

export const RecipeRowSchema = Type.Object({ counterpart: RefSchema, count }, { additionalProperties: false });
export type RecipeRow = Static<typeof RecipeRowSchema>;

export const ContextualAbilityRefSchema = Type.Object({ ability: RefSchema, rankIndex: count }, { additionalProperties: false });
export type ContextualAbilityRef = Static<typeof ContextualAbilityRefSchema>;
export const AbilityPhaseSchema = Type.Object({ phaseIndex: count, name: optional(text), requirement: optional(text), abilities: Type.Array(ContextualAbilityRefSchema) }, { additionalProperties: false });
export type AbilityPhase = Static<typeof AbilityPhaseSchema>;

export const FactionRewardRowSchema = Type.Object({ counterpart: RefSchema, amount: number }, { additionalProperties: false });
export type FactionRewardRow = Static<typeof FactionRewardRowSchema>;

export const CreatureRowSchema = Type.Object({ counterpart: RefSchema, levelRange: optional(PublicLevelRangeSchema), roles: Type.Array(text, { uniqueItems: true }), placementCount: count }, { additionalProperties: false });
export type CreatureRow = Static<typeof CreatureRowSchema>;

const markerCategory = publicMarkerCategory;
export const PlacementGroupSchema = Type.Object({ category: markerCategory, placementCount: Type.Integer({ minimum: 1 }) }, { additionalProperties: false });
export type PlacementGroup = Static<typeof PlacementGroupSchema>;

export const ConnectionRowSchema = Type.Object({ counterpart: RefSchema, kind: text, placements }, { additionalProperties: false });
export type ConnectionRow = Static<typeof ConnectionRowSchema>;

// An interactive object whose `CompleteTask` action completes an objective's task. The object has no page,
// so the row carries its placements.
export const ObjectiveCompletionSchema = Type.Object({ label: optional(text), placements, availability }, { additionalProperties: false });
export type ObjectiveCompletion = Static<typeof ObjectiveCompletionSchema>;

// Quest objectives follow the native task types. `text` is the task's authored description, or its name
// when it has none. `unsupported` keeps the raw type name so a task the decoder does not understand stays
// visible instead of vanishing.
const objectiveBase = { index: count, text, completions: Type.Array(ObjectiveCompletionSchema), timeLimit: optional(number) };
export const QuestObjectiveSchema = Type.Union([
  Type.Object({ ...objectiveBase, type: Type.Literal("killNpc"), target: RefSchema, count: Type.Integer({ minimum: 1 }) }, { additionalProperties: false }),
  Type.Object({ ...objectiveBase, type: Type.Literal("getItem"), target: RefSchema, count: Type.Integer({ minimum: 1 }), keepItems: Type.Boolean() }, { additionalProperties: false }),
  Type.Object({ ...objectiveBase, type: Type.Literal("talkToNpc"), target: RefSchema }, { additionalProperties: false }),
  Type.Object({ ...objectiveBase, type: Type.Literal("useItem"), target: RefSchema, count: Type.Integer({ minimum: 1 }) }, { additionalProperties: false }),
  Type.Object({ ...objectiveBase, type: Type.Literal("enterScene"), target: RefSchema }, { additionalProperties: false }),
  Type.Object({ ...objectiveBase, type: Type.Literal("enterRegion") }, { additionalProperties: false }),
  Type.Object({ ...objectiveBase, type: Type.Literal("learnAbility"), target: RefSchema }, { additionalProperties: false }),
  Type.Object({ ...objectiveBase, type: Type.Literal("unsupported"), rawType: text }, { additionalProperties: false }),
]);
export type QuestObjective = Static<typeof QuestObjectiveSchema>;

export const QuestObjectiveRowSchema = Type.Object({ counterpart: RefSchema, objective: QuestObjectiveSchema }, { additionalProperties: false });
export type QuestObjectiveRow = Static<typeof QuestObjectiveRowSchema>;

// How a quest starts. An NPC has its own page and locations, so its row links the NPC and names the areas
// where it stands. A world quest zone and an interactive object have no page, so their rows carry
// placements. `pool` lists the other quests that the same zones offer.
export const QuestStartSchema = Type.Union([
  Type.Object({ kind: Type.Literal("npc"), npc: RefSchema, areas: Type.Array(text, { uniqueItems: true }) }, { additionalProperties: false }),
  Type.Object({ kind: Type.Literal("worldZone"), placements, availability, zoneDelaySeconds: optional(number), pool: refs }, { additionalProperties: false }),
  Type.Object({ kind: Type.Literal("object"), label: optional(text), placements, availability }, { additionalProperties: false }),
]);
export type QuestStart = Static<typeof QuestStartSchema>;

// A world source whose availability names the quest. `subjects` link the creatures that a spawner spawns or
// the station that a station source serves; `label` names an object or container. The rules are the
// source's complete availability, not only the rules that name the quest.
export const QuestWorldChangeSchema = Type.Object({
  sourceKind: Type.Union([Type.Literal("creature"), Type.Literal("object"), Type.Literal("container"), Type.Literal("resource"), Type.Literal("craftingStation"), Type.Literal("worldZone")]),
  subjects: refs, label: optional(text), availability: Type.Array(AvailabilityRuleSchema, { minItems: 1 }), placements,
}, { additionalProperties: false });
export type QuestWorldChange = Static<typeof QuestWorldChangeSchema>;

// Placements of a creature's spawners that spawn only under conditions, grouped by availability.
export const SpawnConditionSchema = Type.Object({
  availability: Type.Array(AvailabilityRuleSchema, { minItems: 1 }), placements: Type.Array(PlacementRefSchema, { minItems: 1 }),
}, { additionalProperties: false });
export type SpawnCondition = Static<typeof SpawnConditionSchema>;

// The authored `RPGWorldQuest` timing in seconds: active duration once it spawns, the cooldowns after
// completion and after expiry, the random jitter added to a cooldown, and the random initial cooldown.
export const WorldQuestFactsSchema = Type.Object({
  availableSeconds: number, cooldownAfterCompletionSeconds: number, cooldownAfterExpirySeconds: number, cooldownJitterSeconds: number, initialRollSeconds: number,
}, { additionalProperties: false });
export type WorldQuestFacts = Static<typeof WorldQuestFactsSchema>;

export const ArtSchema = Type.Object({ icon: optional(ArtRefSchema), portrait: optional(ArtRefSchema), artwork: optional(ArtRefSchema) }, { additionalProperties: false });
export type Art = Static<typeof ArtSchema>;

// A document names where its entity is only when the entity occupies space itself. A creature and
// a property stand at placements. A place IS a map space and, for a region, a region area, so it
// carries that space rather than a marker. An item, a quest, an ability, and a recipe occupy no
// space at all; a reader reaches their places through the entities that do.
const documentBase = { ref: EntityRefSchema, description: nullableText, art: ArtSchema };

export const ItemFactsSchema = Type.Object({
  rarity: optional(text), itemType: optional(text), slot: optional(text), weaponType: optional(text), armorType: optional(text), weaponSlot: optional(text),
  attackSpeed: optional(number), minDamage: optional(count), maxDamage: optional(count),
  // The game's own tooltip leads with item power and shows damage per second beside the damage
  // range: Oathbreaker's Edge reads "Item Power 99" and "(55.3 damage per second)" for 75-124 at
  // 1.80, which is the mean damage over the attack speed. Both are published so a page, a list
  // column, and a sort agree on one value.
  itemPower: optional(number), damagePerSecond: optional(number),
  stats: Type.Array(StatRowSchema), randomStats: Type.Array(RandomStatRowSchema), randomStatsMax: count,
  sockets: Type.Array(SocketRowSchema), gem: optional(GemSchema),
  enchantment: optional(RefSchema), sellPrice: optional(PriceSchema), buyPrice: optional(PriceSchema),
  stackLimit: count, questDropOnly: Type.Boolean(), corruptionToken: Type.Boolean(),
  actionAbilities: Type.Array(ContextualAbilityRefSchema), useLines: Type.Array(NativeTextLineSchema),
  // `levelRequirement` is the threshold of the item's Level equipment requirement, which lists and search sort by.
  equipmentRequirements: requirements, levelRequirement: optional(count), useConditions: requirements, gearSet: optional(RefSchema),
}, { additionalProperties: false });
export type ItemFacts = Static<typeof ItemFactsSchema>;

export const PublicItemSchema = Type.Object({
  ...documentBase, facts: ItemFactsSchema,
  droppedBy: Type.Array(DropRowSchema), soldBy: Type.Array(VendorRowSchema), gatheredFrom: Type.Array(GatherRowSchema),
  inContainers: Type.Array(ContainerRowSchema), collectedFrom: Type.Array(ContainerRowSchema), rewardedBy: Type.Array(QuestRewardRowSchema), givenBy: Type.Array(QuestGivenRowSchema),
  craftedBy: Type.Array(RecipeRowSchema), usedInRecipes: Type.Array(RecipeRowSchema), usedInQuests: Type.Array(QuestObjectiveRowSchema),
}, { additionalProperties: false });
export type PublicItem = Static<typeof PublicItemSchema>;

// What gear family this creature's dynamic loot favours. The game rolls level-band gear against
// these constraints, so a reader can tell a plate dropper from a cloth dropper.
export const LootSpecializationSchema = Type.Object({ armorType: optional(text), weaponTypes: Type.Array(text), stat: optional(RefSchema) }, { additionalProperties: false });
export type LootSpecialization = Static<typeof LootSpecializationSchema>;

export const NpcFactsSchema = Type.Object({
  level: optional(count), levelRange: optional(PublicLevelRangeSchema), scalesWithPlayer: Type.Boolean(),
  npcType: optional(text), creatureType: optional(text), family: optional(text),
  faction: optional(RefSchema), species: optional(RefSchema),
  roles: Type.Array(markerCategory, { uniqueItems: true }),
  respawn: optional(Type.Object({ min: number, max: number }, { additionalProperties: false })),
  experience: optional(Type.Object({ min: count, max: count }, { additionalProperties: false })),
  stats: Type.Array(StatRowSchema), immunities: Type.Array(text, { uniqueItems: true }), aggroRange: optional(number),
  lootSpecialization: optional(LootSpecializationSchema),
}, { additionalProperties: false });
export type NpcFacts = Static<typeof NpcFactsSchema>;

export const PublicNpcSchema = Type.Object({
  ...documentBase, facts: NpcFactsSchema, locations: placements, spawnConditions: Type.Array(SpawnConditionSchema),
  drops: Type.Array(DropRowSchema), sells: Type.Array(VendorRowSchema), quests: Type.Array(QuestLinkRowSchema),
  abilityPhases: Type.Array(AbilityPhaseSchema), factionRewards: Type.Array(FactionRewardRowSchema),
  usedInQuests: Type.Array(QuestObjectiveRowSchema), bossOf: refs, linkedNpc: optional(RefSchema),
}, { additionalProperties: false });
export type PublicNpc = Static<typeof PublicNpcSchema>;

// `levelRange` is the range the game's quest UI shows as "[min-max]"; `levelRequirement` is the minimum level
// that the quest's mandatory requirements set.
export const QuestFactsSchema = Type.Object({
  chain: optional(Type.Object({ name: text, order: Type.Integer() }, { additionalProperties: false })),
  repeatable: Type.Boolean(), turnInWithoutNpc: Type.Boolean(), requirements,
  levelRange: optional(PublicLevelRangeSchema), levelRequirement: optional(count), experience: optional(count), objectiveText: optional(text), completedDescription: optional(text),
  worldQuest: optional(WorldQuestFactsSchema),
}, { additionalProperties: false });
export type QuestFacts = Static<typeof QuestFactsSchema>;

// `chainQuests` lists the chain in authored order and includes this quest. `unlocks` lists the quests whose
// requirements name this quest. `dungeon` is the dungeon that the game assigns to the quest's objectives.
export const PublicQuestSchema = Type.Object({
  ...documentBase, facts: QuestFactsSchema,
  starts: Type.Array(QuestStartSchema), turnIns: refs, objectives: Type.Array(QuestObjectiveSchema),
  itemsGiven: Type.Array(QuestGivenRowSchema), rewards: Type.Array(QuestRewardRowSchema), rewardChoices: Type.Array(QuestRewardRowSchema),
  chainQuests: refs, unlocks: refs, worldChanges: Type.Array(QuestWorldChangeSchema), dungeon: optional(RefSchema),
}, { additionalProperties: false });
export type PublicQuest = Static<typeof PublicQuestSchema>;

export const PLACE_TYPE_VALUES = ["dungeon", "zone", "region", "interior"] as const;

// Where a place is on the world atlas: the map space it occupies, and the region areas that bound
// it. The atlas root already publishes each map space's label and bounds and each shard publishes
// its region polygons, so a place references them instead of repeating geometry.
export const PlaceSpaceSchema = Type.Object({ mapSpaceId: text, regionIds: Type.Array(text, { uniqueItems: true }) }, { additionalProperties: false });
export type PlaceSpace = Static<typeof PlaceSpaceSchema>;

export const PlaceFactsSchema = Type.Object({
  placeType: Type.Union([Type.Literal("dungeon"), Type.Literal("zone"), Type.Literal("region"), Type.Literal("interior")]),
  levelRange: optional(PublicLevelRangeSchema), guideIncluded: Type.Boolean(),
}, { additionalProperties: false });
export type PlaceFacts = Static<typeof PlaceFactsSchema>;

// `quests` start in the place; `questObjectives` have an objective target or a completion object in it.
export const PublicPlaceSchema = Type.Object({
  ...documentBase, facts: PlaceFactsSchema, space: Type.Union([PlaceSpaceSchema, Type.Null()]),
  bosses: refs, creatures: Type.Array(CreatureRowSchema), npcs: Type.Array(CreatureRowSchema),
  services: Type.Array(PlacementGroupSchema), resources: Type.Array(PlacementGroupSchema), containers: Type.Array(PlacementGroupSchema),
  quests: refs, questObjectives: refs, properties: refs, connections: Type.Array(ConnectionRowSchema), regions: refs, parent: optional(RefSchema),
}, { additionalProperties: false });
export type PublicPlace = Static<typeof PublicPlaceSchema>;

export const PropertyFactsSchema = Type.Object({ income: optional(number), price: optional(PriceSchema) }, { additionalProperties: false });
export type PropertyFacts = Static<typeof PropertyFactsSchema>;

export const PublicPropertySchema = Type.Object({ ...documentBase, facts: PropertyFactsSchema, locations: placements, place: optional(RefSchema) }, { additionalProperties: false });
export type PublicProperty = Static<typeof PublicPropertySchema>;

export const AbilityRankSchema = Type.Object({ rankIndex: count, lines: Type.Array(NativeTextLineSchema, { minItems: 1 }) }, { additionalProperties: false });
export type AbilityRank = Static<typeof AbilityRankSchema>;
export const AbilityFactsSchema = Type.Object({ ranks: Type.Array(AbilityRankSchema, { minItems: 1 }) }, { additionalProperties: false });
export type AbilityFacts = Static<typeof AbilityFactsSchema>;

export const PublicAbilitySchema = Type.Object({ ...documentBase, facts: AbilityFactsSchema, usedBy: refs, taughtBy: refs }, { additionalProperties: false });
export type PublicAbility = Static<typeof PublicAbilitySchema>;

export const RecipeFactsSchema = Type.Object({ station: optional(RefSchema), skill: optional(RefSchema), rank: optional(count) }, { additionalProperties: false });
export type RecipeFacts = Static<typeof RecipeFactsSchema>;

export const PublicRecipeSchema = Type.Object({ ...documentBase, facts: RecipeFactsSchema, product: optional(RecipeRowSchema), materials: Type.Array(RecipeRowSchema) }, { additionalProperties: false });
export type PublicRecipe = Static<typeof PublicRecipeSchema>;

// A set's tiers reward wearing a number of its members, which is what the game's tooltip shows
// under the member list: "(3) Tier 1: +10% Poison Damage, +10 Dodge chance".
export const GearSetTierSchema = Type.Object({ equipped: Type.Integer({ minimum: 1 }), stats: Type.Array(StatRowSchema) }, { additionalProperties: false });
export type GearSetTier = Static<typeof GearSetTierSchema>;

export const GearSetFactsSchema = Type.Object({ memberCount: count }, { additionalProperties: false });
export type GearSetFacts = Static<typeof GearSetFactsSchema>;

export const PublicGearSetSchema = Type.Object({
  ...documentBase, facts: GearSetFactsSchema, members: refs, tiers: Type.Array(GearSetTierSchema),
}, { additionalProperties: false });
export type PublicGearSet = Static<typeof PublicGearSetSchema>;

// The schema maps carry explicit types that name each schema, because the inferred types are too large
// for the compiler to serialize into declarations.
export const PUBLIC_DOCUMENT_SCHEMAS: {
  items: typeof PublicItemSchema; npcs: typeof PublicNpcSchema; quests: typeof PublicQuestSchema; places: typeof PublicPlaceSchema;
  properties: typeof PublicPropertySchema; abilities: typeof PublicAbilitySchema; recipes: typeof PublicRecipeSchema; gearSets: typeof PublicGearSetSchema;
} = {
  items: PublicItemSchema, npcs: PublicNpcSchema, quests: PublicQuestSchema, places: PublicPlaceSchema,
  properties: PublicPropertySchema, abilities: PublicAbilitySchema, recipes: PublicRecipeSchema, gearSets: PublicGearSetSchema,
} satisfies Record<PublicPageKind, TSchema>;
export type PublicDocument = PublicItem | PublicNpc | PublicQuest | PublicPlace | PublicProperty | PublicAbility | PublicRecipe | PublicGearSet;
export type PublicDocumentOf<K extends PublicPageKind> = Static<typeof PUBLIC_DOCUMENT_SCHEMAS[K]>;

export const STATIC_DOCUMENT_SCHEMA_IDS = {
  items: "compendium.static-item.v3", npcs: "compendium.static-npc.v3", quests: "compendium.static-quest.v3", places: "compendium.static-place.v3",
  properties: "compendium.static-property.v2", abilities: "compendium.static-ability.v2", recipes: "compendium.static-recipe.v2", gearSets: "compendium.static-gear-set.v2",
} as const satisfies Record<PublicPageKind, string>;
export type StaticDocumentSchemaId = typeof STATIC_DOCUMENT_SCHEMA_IDS[PublicPageKind];

const staticDocument = <K extends PublicPageKind>(kind: K) => Type.Object({
  schemaVersion: Type.Literal(STATIC_DOCUMENT_SCHEMA_IDS[kind]), ...identity, kind: Type.Literal(kind), document: PUBLIC_DOCUMENT_SCHEMAS[kind],
}, { additionalProperties: false });
export const StaticItemDocumentSchema = staticDocument("items");
export const StaticNpcDocumentSchema = staticDocument("npcs");
export const StaticQuestDocumentSchema = staticDocument("quests");
export const StaticPlaceDocumentSchema = staticDocument("places");
export const StaticPropertyDocumentSchema = staticDocument("properties");
export const StaticAbilityDocumentSchema = staticDocument("abilities");
export const StaticRecipeDocumentSchema = staticDocument("recipes");
export const StaticGearSetDocumentSchema = staticDocument("gearSets");
export const STATIC_DOCUMENT_SCHEMAS: {
  "compendium.static-item.v3": typeof StaticItemDocumentSchema; "compendium.static-npc.v3": typeof StaticNpcDocumentSchema;
  "compendium.static-quest.v3": typeof StaticQuestDocumentSchema; "compendium.static-place.v3": typeof StaticPlaceDocumentSchema;
  "compendium.static-property.v2": typeof StaticPropertyDocumentSchema; "compendium.static-ability.v2": typeof StaticAbilityDocumentSchema;
  "compendium.static-recipe.v2": typeof StaticRecipeDocumentSchema; "compendium.static-gear-set.v2": typeof StaticGearSetDocumentSchema;
} = {
  "compendium.static-item.v3": StaticItemDocumentSchema, "compendium.static-npc.v3": StaticNpcDocumentSchema,
  "compendium.static-quest.v3": StaticQuestDocumentSchema, "compendium.static-place.v3": StaticPlaceDocumentSchema,
  "compendium.static-property.v2": StaticPropertyDocumentSchema, "compendium.static-ability.v2": StaticAbilityDocumentSchema,
  "compendium.static-recipe.v2": StaticRecipeDocumentSchema, "compendium.static-gear-set.v2": StaticGearSetDocumentSchema,
};
export type StaticDocument = Static<typeof StaticItemDocumentSchema> | Static<typeof StaticNpcDocumentSchema> | Static<typeof StaticQuestDocumentSchema>
  | Static<typeof StaticPlaceDocumentSchema> | Static<typeof StaticPropertyDocumentSchema> | Static<typeof StaticAbilityDocumentSchema> | Static<typeof StaticRecipeDocumentSchema> | Static<typeof StaticGearSetDocumentSchema>;
export const documentReference = Type.Union([
  resourceReference("compendium.static-item.v3"), resourceReference("compendium.static-npc.v3"), resourceReference("compendium.static-quest.v3"), resourceReference("compendium.static-place.v3"),
  resourceReference("compendium.static-property.v2"), resourceReference("compendium.static-ability.v2"), resourceReference("compendium.static-recipe.v2"), resourceReference("compendium.static-gear-set.v2"),
]);
export type DocumentReference = Static<typeof documentReference>;

// The registry is data the site reads: labels, routes, and list shape per kind. A kind absent
// from the registry is not routed.
export const ListColumnSchema = Type.Object({ id: text, label: text, sortable: Type.Boolean(), numeric: Type.Boolean() }, { additionalProperties: false });
export type ListColumn = Static<typeof ListColumnSchema>;
export const ListFacetSchema = Type.Object({ id: text, label: text }, { additionalProperties: false });
export type ListFacet = Static<typeof ListFacetSchema>;

export const PublicKindEntrySchema = Type.Object({
  kind: referenceKind, label: text, plural: text, route: slug, icon: text,
  pages: Type.Boolean(), searchable: Type.Boolean(),
  columns: Type.Array(ListColumnSchema), facets: Type.Array(ListFacetSchema),
}, { additionalProperties: false });
export type PublicKindEntry = Static<typeof PublicKindEntrySchema>;

const listValue = Type.Union([Type.String(), Type.Number(), Type.Null()]);
export const ListRowSchema = Type.Object({ ref: EntityRefSchema, values: Type.Record(Type.String(), listValue), facets: Type.Record(Type.String(), Type.Array(Type.String())) }, { additionalProperties: false });
export type ListRow = Static<typeof ListRowSchema>;

// A kind's list is partitioned like the map shards and the search corpus, because one row carries
// its reference, its icon, and its column and facet values, and a kind can hold thousands of rows.
// The list page loads every part; the budget bounds each file, not the data.
export const StaticKindListSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.static-kind-list.v1"), ...identity, kind: pageKind, part: count, rows: Type.Array(ListRowSchema),
}, { additionalProperties: false });
export type StaticKindList = Static<typeof StaticKindListSchema>;

// One search corpus for the atlas and the pages, and the index of published pages: an entry of a
// paged kind carries that entity's slug in its reference and its document reference, so the site
// derives its prerender entries from the corpus instead of a second list that repeats it.
//
// An entry names no placements. The map shards already carry each placement's entity and item
// keys, so the atlas resolves an entry's places from data it has loaded; repeating them here cost
// 1.86 MB of a 2.93 MB corpus, up to 594 ids for one creature. `hasPlacements` is the one bit a
// result needs to offer a map link before the shards are consulted.
export const PublicSearchEntrySchema = Type.Object({
  ref: EntityRefSchema, level: optional(Type.Union([count, PublicLevelRangeSchema])), place: optional(text),
  hasPlacements: Type.Boolean(), sourceKinds: Type.Array(text, { uniqueItems: true }),
  document: optional(documentReference),
}, { additionalProperties: false });
export type PublicSearchEntry = Static<typeof PublicSearchEntrySchema>;

export const StaticSearchIndexSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.static-search.v3"), ...identity, part: count, entries: Type.Array(PublicSearchEntrySchema),
}, { additionalProperties: false });
export type StaticSearchIndex = Static<typeof StaticSearchIndexSchema>;

export const STATIC_COMPENDIUM_SCHEMAS: typeof STATIC_DOCUMENT_SCHEMAS & {
  "compendium.static-kind-list.v1": typeof StaticKindListSchema; "compendium.static-search.v3": typeof StaticSearchIndexSchema;
} = {
  ...STATIC_DOCUMENT_SCHEMAS,
  "compendium.static-kind-list.v1": StaticKindListSchema,
  "compendium.static-search.v3": StaticSearchIndexSchema,
};
export type StaticCompendiumResource = StaticDocument | StaticKindList | StaticSearchIndex;

export function isStaticDocumentSchemaId(schemaId: string): schemaId is StaticDocumentSchemaId {
  return Object.hasOwn(STATIC_DOCUMENT_SCHEMAS, schemaId);
}

export function isStaticDocument(value: { schemaVersion: string }): value is StaticDocument {
  return isStaticDocumentSchemaId(value.schemaVersion);
}

export function isEntityRef(ref: Ref): ref is EntityRef { return ref.key !== null; }

export function artEdges(document: PublicDocument): ArtRef[] {
  const art = [document.art.icon, document.art.portrait, document.art.artwork];
  for (const ref of collectRefs(document)) if (ref.icon) art.push(ref.icon);
  return art.filter((value): value is ArtRef => value !== undefined);
}

// Every `EntityRef` inside a document, wherever it sits. Documents are plain JSON: any object with
// a string `key`, a `kind`, and a `name` is a reference.
export function collectRefs(value: unknown, into: EntityRef[] = []): EntityRef[] {
  if (Array.isArray(value)) { for (const item of value) collectRefs(item, into); return into; }
  if (value === null || typeof value !== "object") return into;
  const record = value as Record<string, unknown>;
  if (typeof record.key === "string" && typeof record.kind === "string" && typeof record.name === "string") into.push(record as EntityRef);
  for (const child of Object.values(record)) collectRefs(child, into);
  return into;
}

// Every `PlacementRef` inside a document, wherever it sits: an object with a string `placementId`, a string
// `mapSpaceId`, and a string `label`. The publication graph requires each one to be a published placement.
export function collectPlacementRefs(value: unknown, into: PlacementRef[] = []): PlacementRef[] {
  if (Array.isArray(value)) { for (const item of value) collectPlacementRefs(item, into); return into; }
  if (value === null || typeof value !== "object") return into;
  const record = value as Record<string, unknown>;
  if (typeof record.placementId === "string" && typeof record.mapSpaceId === "string" && typeof record.label === "string") into.push(record as PlacementRef);
  for (const child of Object.values(record)) collectPlacementRefs(child, into);
  return into;
}

// The static resource schemas register with the rest of STATIC_RESOURCE_SCHEMAS in resources.ts.
schemaRegistry.register("compendium.public-art-ref.v1", ArtRefSchema);
schemaRegistry.register("compendium.public-entity-ref.v1", EntityRefSchema);
schemaRegistry.register("compendium.public-unresolved-ref.v1", UnresolvedRefSchema);
schemaRegistry.register("compendium.public-placement-ref.v1", PlacementRefSchema);
schemaRegistry.register("compendium.public-native-text-span.v1", NativeTextSpanSchema);
schemaRegistry.register("compendium.public-native-text-line.v1", NativeTextLineSchema);
schemaRegistry.register("compendium.public-requirement-span.v1", RequirementSpanSchema);
schemaRegistry.register("compendium.public-requirement-ref.v3", RequirementRefSchema);
schemaRegistry.register("compendium.public-requirement-group.v3", RequirementGroupSchema);
schemaRegistry.register("compendium.public-availability-rule.v1", AvailabilityRuleSchema);
schemaRegistry.register("compendium.public-place-space.v1", PlaceSpaceSchema);
schemaRegistry.register("compendium.public-gear-set-tier.v1", GearSetTierSchema);
schemaRegistry.register("compendium.public-loot-specialization.v1", LootSpecializationSchema);
schemaRegistry.register("compendium.public-random-stat-row.v1", RandomStatRowSchema);
schemaRegistry.register("compendium.public-gem.v1", GemSchema);
schemaRegistry.register("compendium.public-drop-row.v3", DropRowSchema);
schemaRegistry.register("compendium.public-vendor-row.v3", VendorRowSchema);
schemaRegistry.register("compendium.public-gather-row.v1", GatherRowSchema);
schemaRegistry.register("compendium.public-container-row.v3", ContainerRowSchema);
schemaRegistry.register("compendium.public-quest-given-row.v1", QuestGivenRowSchema);
schemaRegistry.register("compendium.public-quest-reward-row.v1", QuestRewardRowSchema);
schemaRegistry.register("compendium.public-quest-link-row.v1", QuestLinkRowSchema);
schemaRegistry.register("compendium.public-objective-completion.v1", ObjectiveCompletionSchema);
schemaRegistry.register("compendium.public-quest-objective.v2", QuestObjectiveSchema);
schemaRegistry.register("compendium.public-quest-objective-row.v2", QuestObjectiveRowSchema);
schemaRegistry.register("compendium.public-quest-start.v1", QuestStartSchema);
schemaRegistry.register("compendium.public-quest-world-change.v1", QuestWorldChangeSchema);
schemaRegistry.register("compendium.public-spawn-condition.v1", SpawnConditionSchema);
schemaRegistry.register("compendium.public-world-quest-facts.v1", WorldQuestFactsSchema);
schemaRegistry.register("compendium.public-recipe-row.v1", RecipeRowSchema);
schemaRegistry.register("compendium.public-contextual-ability-ref.v1", ContextualAbilityRefSchema);
schemaRegistry.register("compendium.public-ability-rank.v1", AbilityRankSchema);
schemaRegistry.register("compendium.public-ability-phase.v2", AbilityPhaseSchema);
schemaRegistry.register("compendium.public-faction-reward-row.v1", FactionRewardRowSchema);
schemaRegistry.register("compendium.public-creature-row.v1", CreatureRowSchema);
schemaRegistry.register("compendium.public-placement-group.v1", PlacementGroupSchema);
schemaRegistry.register("compendium.public-connection-row.v1", ConnectionRowSchema);
schemaRegistry.register("compendium.public-kind-entry.v1", PublicKindEntrySchema);
schemaRegistry.register("compendium.public-search-entry.v1", PublicSearchEntrySchema);
// Schema ids are lower case with hyphens, so a camel-case kind becomes hyphenated. A public document schema
// shares the version of its static document schema.
for (const [kind, schema] of Object.entries(PUBLIC_DOCUMENT_SCHEMAS)) schemaRegistry.register(`compendium.public-${kind.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}-document.${STATIC_DOCUMENT_SCHEMA_IDS[kind as PublicPageKind].split(".").at(-1)!}`, schema);
