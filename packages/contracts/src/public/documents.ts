import { Type, type Static, type TSchema } from "typebox";
import { schemaRegistry } from "../schema-registry";
import { count, hash, number, publicMarkerCategory, resourceReference, text, PublicAlternativeSchema, PublicLevelRangeSchema, PublicLevelSchema, StaticResourceIdentityFields } from "./primitives";

const percent = Type.Number({ minimum: 0, maximum: 100 });
const optional = <T extends TSchema>(schema: T) => Type.Optional(schema);
const nullableText = Type.Union([Type.String(), Type.Null()]);
const identity = StaticResourceIdentityFields;

// Kinds with pages own a route and a document schema. Kinds without pages still have references,
// names, and icons, so a stat or currency renders as text with its icon rather than as a dead link. A recipe has no page:
// its reference links the Crafting section of its product, and its kind keeps a list of crafts.
export const PUBLIC_PAGE_KIND_VALUES = ["items", "npcs", "quests", "places", "properties", "abilities", "classes", "skills", "mechanics", "gatheringNodes"] as const;
export type PublicPageKind = typeof PUBLIC_PAGE_KIND_VALUES[number];
export const PUBLIC_LIST_KIND_VALUES = [...PUBLIC_PAGE_KIND_VALUES, "recipes"] as const;
export type PublicListKind = typeof PUBLIC_LIST_KIND_VALUES[number];
export const PUBLIC_REFERENCE_KIND_VALUES = [...PUBLIC_LIST_KIND_VALUES, "gearSets", "currencies", "stats", "factions", "races", "enchantments", "effects", "species", "lootTables", "craftingStations"] as const;
export type PublicReferenceKind = typeof PUBLIC_REFERENCE_KIND_VALUES[number];
export const PublicPageKindSchema = Type.Union([Type.Literal("items"), Type.Literal("npcs"), Type.Literal("quests"), Type.Literal("places"), Type.Literal("properties"), Type.Literal("abilities"), Type.Literal("classes"), Type.Literal("skills"), Type.Literal("mechanics"), Type.Literal("gatheringNodes")]);
export const PublicListKindSchema = Type.Union([...PublicPageKindSchema.anyOf, Type.Literal("recipes")]);
const referenceKind = Type.Union([
  ...PublicListKindSchema.anyOf,
  Type.Literal("gearSets"), Type.Literal("currencies"), Type.Literal("stats"), Type.Literal("factions"), Type.Literal("races"),
  Type.Literal("enchantments"), Type.Literal("effects"), Type.Literal("species"), Type.Literal("lootTables"), Type.Literal("craftingStations"),
]);
export const PUBLIC_SLUG_PATTERN = "^[a-z0-9]+(?:-[a-z0-9]+)*$";
const slug = Type.String({ pattern: PUBLIC_SLUG_PATTERN });
// A variant anchor names one section of a grouped page. It uses the slug alphabet, so a URL fragment needs no escaping.
const anchor = Type.String({ pattern: PUBLIC_SLUG_PATTERN });
const artUrl = Type.String({ pattern: "^art/[a-f0-9]{64}\\.webp$" });

export const ArtRefSchema = Type.Object({ url: artUrl, sha256: hash, bytes: count, width: Type.Integer({ minimum: 1 }), height: Type.Integer({ minimum: 1 }) }, { additionalProperties: false });
export type ArtRef = Static<typeof ArtRefSchema>;

// The only link shape. `slug` is present exactly when the kind has pages; the publication audit
// enforces that pairing because a schema cannot express it per kind. On a page that groups several authored records,
// `variant` names the section of the referenced record.
export const EntityRefSchema = Type.Object({
  key: text, kind: referenceKind, name: text,
  slug: optional(slug), variant: optional(anchor), icon: optional(ArtRefSchema), portrait: optional(ArtRefSchema),
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
// same `DropRow` with `counterpart` pointing across.
//
// A drop row describes one item of a loot table. `chance` is the authored rate of the item's own roll, which is the
// value that the Adventure Guide shows for creature loot. The table fields describe the roll of the whole table:
// `tableChance` is the authored chance that a kill rolls the table, present only below 100. `tableMinimum` and
// `tableLimit` are the fewest and the most items that one roll of the table gives. World loot has no creature of its
// own: `creatureLevel` gives the creature levels that can drop the item, and an absent `max` leaves the range open.
//
// A row never carries placement ids. Each document already lists its own `locations`, and the
// counterpart's locations belong to the counterpart's document, so repeating them per row would
// square the data: one creature with 127 placements and 18 drops would carry 2,286 placement refs
// that say nothing new. Where the source of a row has no page of its own, the row carries how many
// placements produce it and the reader reaches them through the map, which already highlights
// every placement of an item key or a marker category.
const itemCount = Type.Integer({ minimum: 1 });
export const CreatureLevelSchema = Type.Object({ min: count, max: optional(count) }, { additionalProperties: false });
export type CreatureLevel = Static<typeof CreatureLevelSchema>;
const dropRowFields = {
  counterpart: RefSchema, min: optional(count), max: optional(count), chance: optional(percent),
  tableChance: optional(percent), tableMinimum: optional(itemCount), tableLimit: optional(itemCount),
  creatureLevel: optional(CreatureLevelSchema), requirements,
};
export const DropRowSchema = Type.Object(dropRowFields, { additionalProperties: false });
export type DropRow = Static<typeof DropRowSchema>;

const vendorRowFields = { counterpart: RefSchema, price: PriceSchema, requirements };
export const VendorRowSchema = Type.Object(vendorRowFields, { additionalProperties: false });
export type VendorRow = Static<typeof VendorRowSchema>;

// On a page with several variants, `variants` names the variants that a row applies to. It is absent when the row
// applies to every variant that has rows of its kind.
const variantAnchors = optional(Type.Array(anchor, { minItems: 1, uniqueItems: true }));
export const NpcDropRowSchema = Type.Object({ ...dropRowFields, variants: variantAnchors }, { additionalProperties: false });
export type NpcDropRow = Static<typeof NpcDropRowSchema>;
export const NpcVendorRowSchema = Type.Object({ ...vendorRowFields, variants: variantAnchors }, { additionalProperties: false });
export type NpcVendorRow = Static<typeof NpcVendorRowSchema>;

// A place is the published map space and its displayed area label; placement IDs select spots on that map.
export const PlaceSpotsSchema = Type.Object({ label: text, mapSpaceId: text, spotCount: count, placementIds: Type.Array(text, { uniqueItems: true }) }, { additionalProperties: false });
export type PlaceSpots = Static<typeof PlaceSpotsSchema>;

// Gathering requirements and temporary/blocking availability remain distinct when equivalent source rows merge.
export const GatherRowSchema = Type.Object({
  counterpart: optional(RefSchema), label: text, skill: optional(RefSchema), rank: optional(count),
  min: optional(count), max: optional(count), chance: optional(percent), requirements: Type.Array(RequirementGroupSchema), availability: Type.Array(AvailabilityRuleSchema), placementCount: count, places: Type.Array(PlaceSpotsSchema),
}, { additionalProperties: false });
export type GatherRow = Static<typeof GatherRowSchema>;

// Sources keep their distinct published spots and index the item's shared availability groups.
export const ContainerRowSchema = Type.Object({
  counterpart: optional(RefSchema), label: text, min: optional(count), max: optional(count), chance: optional(percent), availabilityIndex: count, placementCount: count,
  places: Type.Array(PlaceSpotsSchema),
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

// A material row keeps its recipe anchor and the output/skill facts needed to read the equation locally.
export const UsedInRecipeRowSchema = Type.Object({
  counterpart: RefSchema, count, product: optional(RecipeRowSchema), skill: optional(RefSchema), requiredLevel: optional(count),
}, { additionalProperties: false });
export type UsedInRecipeRow = Static<typeof UsedInRecipeRowSchema>;

// A published class that starts with the item. The class page shows the count and whether the item starts equipped.
export const StartingGearOfRowSchema = Type.Object({ class: EntityRefSchema }, { additionalProperties: false });
export type StartingGearOfRow = Static<typeof StartingGearOfRowSchema>;

export const ContextualAbilityRefSchema = Type.Object({ ability: RefSchema, rankIndex: count }, { additionalProperties: false });
export type ContextualAbilityRef = Static<typeof ContextualAbilityRefSchema>;
export const AbilityPhaseSchema = Type.Object({ phaseIndex: count, name: optional(text), requirement: optional(text), abilities: Type.Array(ContextualAbilityRefSchema) }, { additionalProperties: false });
export type AbilityPhase = Static<typeof AbilityPhaseSchema>;

export const FactionRewardRowSchema = Type.Object({ counterpart: RefSchema, amount: number }, { additionalProperties: false });
export type FactionRewardRow = Static<typeof FactionRewardRowSchema>;

// A creature of a place. `level` covers the creature's placements in the place, and `roles` their marker categories.
export const CreatureRowSchema = Type.Object({ counterpart: RefSchema, level: optional(PublicLevelSchema), roles: Type.Array(text, { uniqueItems: true }), placementCount: count }, { additionalProperties: false });
export type CreatureRow = Static<typeof CreatureRowSchema>;

const markerCategory = publicMarkerCategory;
export const PlacementGroupSchema = Type.Object({ category: markerCategory, placementCount: Type.Integer({ minimum: 1 }) }, { additionalProperties: false });
export type PlacementGroup = Static<typeof PlacementGroupSchema>;

// A teleport of a place. `direction` is `to` when the teleport starts in the place and ends in the counterpart, `from`
// when it starts in the counterpart and ends in the place, and `within` when it starts and ends in the place. The
// placements are the published spots of the object that starts the teleport.
export const ConnectionRowSchema = Type.Object({
  counterpart: RefSchema, direction: Type.Union([Type.Literal("to"), Type.Literal("from"), Type.Literal("within")]), placements,
}, { additionalProperties: false });
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

// A character that starts or completes a quest, with the areas where its variants that do so stand.
const questPerson = { npc: RefSchema, areas: Type.Array(text, { uniqueItems: true }) };
export const QuestTurnInSchema = Type.Object(questPerson, { additionalProperties: false });
export type QuestTurnIn = Static<typeof QuestTurnInSchema>;

// How a quest starts. An NPC has its own page and locations, so its row links the NPC and names the areas
// where it stands. A world quest zone and an interactive object have no page, so their rows carry
// placements. `pool` lists the other quests that the same zones offer.
export const QuestStartSchema = Type.Union([
  Type.Object({ kind: Type.Literal("npc"), ...questPerson }, { additionalProperties: false }),
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

// Where a creature appears. An entry groups the placements of variants that share a place label, availability,
// level, roles, quests, and random choice, and `variants` names those variants. `alternative` gives the chance that
// the entry's spawn is active, and `options` counts the random spots of the entry that the game picks one from.
export const NpcLocationSchema = Type.Object({
  label: text, placements: Type.Array(PlacementRefSchema, { minItems: 1 }), spotCount: count, availability,
  level: optional(PublicLevelSchema), alternative: optional(PublicAlternativeSchema),
  variants: Type.Array(anchor, { minItems: 1, uniqueItems: true }),
  roles: Type.Array(publicMarkerCategory, { uniqueItems: true }),
  quests: Type.Array(QuestLinkRowSchema),
}, { additionalProperties: false });
export type NpcLocation = Static<typeof NpcLocationSchema>;

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

// A set's tiers reward wearing a number of its members, which is what the game's tooltip shows
// under the member list: "(3) Tier 1: +10% Poison Damage, +10 Dodge chance".
export const GearSetTierSchema = Type.Object({ equipped: Type.Integer({ minimum: 1 }), stats: Type.Array(StatRowSchema) }, { additionalProperties: false });
export type GearSetTier = Static<typeof GearSetTierSchema>;

// The gear set of an item, in full on each member's page, as the game's item tooltip shows it. `key` is the catalog
// key of the set, which has no page of its own.
export const GearSetSchema = Type.Object({ key: text, name: text, members: refs, tiers: Type.Array(GearSetTierSchema) }, { additionalProperties: false });
export type GearSet = Static<typeof GearSetSchema>;

// The skill levels where a craft gives base experience, from the verified crafting rule. `firstFull` and `secondFull` are
// the game's two full-experience bands. `to` is absent when the band reaches the skill's highest level. `experience` is
// the base amount before skill modifiers.
export const RecipeExperienceBandSchema = Type.Object({
  band: Type.Union([Type.Literal("firstFull"), Type.Literal("secondFull"), Type.Literal("half"), Type.Literal("none")]),
  from: count, to: optional(count), experience: count,
}, { additionalProperties: false });
export type RecipeExperienceBand = Static<typeof RecipeExperienceBandSchema>;
// A rank's required skill level and base experience. A rank with no base experience has no bands.
export const RecipeRankSchema = Type.Object({ rank: count, requiredLevel: count, baseExperience: count, bands: Type.Array(RecipeExperienceBandSchema) }, { additionalProperties: false });
export type RecipeRank = Static<typeof RecipeRankSchema>;

// One recipe as the Crafting section of its product and the Teaches section of a recipe item show it. `recipe` keeps
// the key and the formatted name of the recipe, which has no page. `ranks` is empty when the recipe's skill does not
// resolve. `taughtBy` lists the published items whose game action teaches the recipe.
export const CraftSchema = Type.Object({
  recipe: Type.Object({ key: text, name: text }, { additionalProperties: false }),
  product: optional(RecipeRowSchema), station: optional(RefSchema), skill: optional(RefSchema), learnedByDefault: Type.Boolean(),
  materials: Type.Array(RecipeRowSchema), ranks: Type.Array(RecipeRankSchema), taughtBy: refs,
}, { additionalProperties: false });
export type Craft = Static<typeof CraftSchema>;

// A mechanics topic explains a game system of the published build. Its key and slug belong to the publication, not to a
// game record. A rule is `verified` when native evidence of the build proves its phrase, and `unknown` when the phrase
// names a branch that the evidence does not resolve. `phrase` names each operand as `{name}`, and `operands` holds its
// number. `sources` name the game methods that the evidence covers. `appearsOn` names the pages and sections where the
// rules record also places the rule.
export const MechanicsRuleSchema = Type.Object({
  id: anchor, section: anchor, status: Type.Union([Type.Literal("verified"), Type.Literal("unknown")]), phrase: text,
  operands: Type.Record(Type.String({ pattern: "^[a-z][A-Za-z0-9]*$" }), number), links: refs,
  sources: Type.Array(Type.Object({ method: text, evidence: text }, { additionalProperties: false }), { minItems: 1 }),
  appearsOn: Type.Array(text, { uniqueItems: true }),
}, { additionalProperties: false });
export type MechanicsRule = Static<typeof MechanicsRuleSchema>;

// Entity placements retain only a target and a link to the explanatory guide step. Rule prose and evidence live in the guide.
export const PlacedRuleSchema = Type.Object({
  target: anchor, guide: EntityRefSchema, stepId: anchor,
  levelChances: optional(Type.Array(Type.Object({ level: count, chance: percent }, { additionalProperties: false }), { minItems: 1 })),
}, { additionalProperties: false });
export type PlacedRule = Static<typeof PlacedRuleSchema>;

// Captured build settings travel with eligible gear so the page never substitutes site constants.
// A preview uses template stats only; saved rolls, socketed gems and Heroic bonuses are separate.
export const CorruptionPreviewSchema = Type.Object({
  maxLevel: Type.Integer({ minimum: 1 }), allStatsPercentPerLevel: number,
  statBonuses: Type.Array(Type.Object({ stat: RefSchema, amountPerLevel: number, isPercent: Type.Boolean() }, { additionalProperties: false })),
}, { additionalProperties: false });
export type CorruptionPreview = Static<typeof CorruptionPreviewSchema>;
// A template token has no saved value or affixes. These settings explain what its saved tooltip
// describes without pretending that the template is a particular rolled token.
export const CorruptionTokenInfoSchema = Type.Object({
  mobStatBonuses: optional(Type.Array(Type.Object({ stat: RefSchema, amountPerLevel: number, isPercent: Type.Boolean() }, { additionalProperties: false }))),
  affixesPerToken: optional(count),
}, { additionalProperties: false });


export const ItemFactsSchema = Type.Object({
  rarity: optional(text), itemType: optional(text), slot: optional(text), weaponType: optional(text), armorType: optional(text), weaponSlot: optional(text),
  attackSpeed: optional(number), minDamage: optional(count), maxDamage: optional(count),
  // The game's own tooltip leads with item power and shows damage per second beside the damage
  // range: Oathbreaker's Edge reads "Item Power 99" and "(55.3 damage per second)" for 75-124 at
  // 1.80, which is the mean damage over the attack speed. Both are published so a page, a list
  // column, and a sort agree on one value.
  itemPower: optional(number), damagePerSecond: optional(number),
  corruption: optional(CorruptionPreviewSchema), tokenInfo: optional(CorruptionTokenInfoSchema),
  stats: Type.Array(StatRowSchema), randomStats: Type.Array(RandomStatRowSchema), randomStatsMax: count,
  sockets: Type.Array(SocketRowSchema), gem: optional(GemSchema),
  enchantment: optional(RefSchema), sellPrice: optional(PriceSchema), buyPrice: optional(PriceSchema), currency: optional(RefSchema),
  stackLimit: count, questDropOnly: Type.Boolean(), corruptionToken: Type.Boolean(),
  // A direct item action has a known rank; a game action targets an ability without publishing a rank.
  actionAbilities: Type.Array(Type.Object({ ability: RefSchema, rankIndex: optional(count) }, { additionalProperties: false })), useLines: Type.Array(NativeTextLineSchema),
  // `levelRequirement` is the threshold of the item's Level equipment requirement, which lists and search sort by.
  equipmentRequirements: requirements, levelRequirement: optional(count), useConditions: requirements, gearSet: optional(GearSetSchema),
}, { additionalProperties: false });
export type ItemFacts = Static<typeof ItemFactsSchema>;

export const CurrencyPurchaseRowSchema = Type.Object({
  item: RefSchema, price: PriceSchema, soldBy: Type.Array(RefSchema, { minItems: 1 }),
}, { additionalProperties: false });
export type CurrencyPurchaseRow = Static<typeof CurrencyPurchaseRowSchema>;

export const PublicItemSchema = Type.Object({
  ...documentBase, facts: ItemFactsSchema, sourceSpotCount: count, sourceAvailabilities: Type.Array(availability),
  droppedBy: Type.Array(DropRowSchema), soldBy: Type.Array(VendorRowSchema), buys: Type.Array(CurrencyPurchaseRowSchema), gatheredFrom: Type.Array(GatherRowSchema),
  inContainers: Type.Array(ContainerRowSchema), collectedFrom: Type.Array(ContainerRowSchema), rewardedBy: Type.Array(QuestRewardRowSchema), givenBy: Type.Array(QuestGivenRowSchema),
  // `crafting` is the recipe that makes the item, and `teaches` the recipe of the item's first Recipe rank-up game action,
  // which the game's item tooltip reads. A row of `usedInRecipes` links the product's Crafting section and carries the
  // matching product quantity, skill, and verified first-rank gate for the material's recipe equation.
  crafting: optional(CraftSchema), teaches: optional(CraftSchema), usedInRecipes: Type.Array(UsedInRecipeRowSchema), usedInQuests: Type.Array(QuestObjectiveRowSchema),
  startingGearOf: Type.Array(StartingGearOfRowSchema), placedRules: Type.Array(PlacedRuleSchema),
}, { additionalProperties: false });
export type PublicItem = Static<typeof PublicItemSchema>;

// What gear family this creature's dynamic loot favours. The game rolls level-band gear against
// these constraints, so a reader can tell a plate dropper from a cloth dropper.
export const LootSpecializationSchema = Type.Object({ armorType: optional(text), weaponTypes: Type.Array(text), stat: optional(RefSchema) }, { additionalProperties: false });
export type LootSpecialization = Static<typeof LootSpecializationSchema>;

// Facts that every variant of the page shares. `level` summarizes the levels of all locations. A fact that differs
// between variants is absent here and appears in each variant.
export const NpcFactsSchema = Type.Object({
  level: optional(PublicLevelSchema),
  npcType: optional(text), creatureType: optional(text), family: optional(text),
  faction: optional(RefSchema), species: optional(RefSchema),
  roles: Type.Array(markerCategory, { uniqueItems: true }),
  respawn: optional(Type.Object({ min: number, max: number }, { additionalProperties: false })),
  experience: optional(Type.Object({ min: count, max: count }, { additionalProperties: false })),
  stats: Type.Array(StatRowSchema), immunities: Type.Array(text, { uniqueItems: true }), aggroRange: optional(number),
  lootSpecialization: optional(LootSpecializationSchema),
}, { additionalProperties: false });
export type NpcFacts = Static<typeof NpcFactsSchema>;

// The authored record facts that can differ between the variants of one page.
export const NPC_VARIANT_FIELD_VALUES = ["npcType", "creatureType", "family", "faction", "species", "respawn", "experience", "stats", "immunities", "aggroRange", "lootSpecialization", "abilityPhases", "factionRewards", "linkedNpc"] as const;
export type NpcVariantField = typeof NPC_VARIANT_FIELD_VALUES[number];
const npcVariantField = Type.Union([
  Type.Literal("npcType"), Type.Literal("creatureType"), Type.Literal("family"), Type.Literal("faction"), Type.Literal("species"), Type.Literal("respawn"), Type.Literal("experience"),
  Type.Literal("stats"), Type.Literal("immunities"), Type.Literal("aggroRange"), Type.Literal("lootSpecialization"), Type.Literal("abilityPhases"), Type.Literal("factionRewards"), Type.Literal("linkedNpc"),
]);

export const NpcVariantFactsSchema = Type.Object({
  npcType: optional(text), creatureType: optional(text), family: optional(text), faction: optional(RefSchema), species: optional(RefSchema),
  respawn: optional(Type.Object({ min: number, max: number }, { additionalProperties: false })),
  experience: optional(Type.Object({ min: count, max: count }, { additionalProperties: false })),
  stats: optional(Type.Array(StatRowSchema)), immunities: optional(Type.Array(text, { uniqueItems: true })), aggroRange: optional(number),
  lootSpecialization: optional(LootSpecializationSchema), abilityPhases: optional(Type.Array(AbilityPhaseSchema)),
  factionRewards: optional(Type.Array(FactionRewardRowSchema)), linkedNpc: optional(RefSchema),
}, { additionalProperties: false });
export type NpcVariantFacts = Static<typeof NpcVariantFactsSchema>;

// One authored record of the creature. `label` tells the variant apart from the others, and `facts` holds values for
// the page's `variantFields` that this record has. `level` covers the variant's locations. `portrait` is present when
// it differs from the page portrait.
export const NpcVariantSchema = Type.Object({
  key: text, anchor, label: text, level: optional(PublicLevelSchema), portrait: optional(ArtRefSchema), facts: NpcVariantFactsSchema,
}, { additionalProperties: false });
export type NpcVariant = Static<typeof NpcVariantSchema>;

// A page groups the records that share a display name. `variantFields` lists the record facts that differ between
// them, so an empty list means that the variants differ only in where, when, and with what services they appear.
export const PublicNpcSchema = Type.Object({
  ...documentBase, facts: NpcFactsSchema,
  variantFields: Type.Array(npcVariantField, { uniqueItems: true }), variants: Type.Array(NpcVariantSchema, { minItems: 1 }),
  locations: Type.Array(NpcLocationSchema), places: Type.Array(PlaceSpotsSchema), spotCount: count,
  drops: Type.Array(NpcDropRowSchema), sells: Type.Array(NpcVendorRowSchema), quests: Type.Array(QuestLinkRowSchema),
  abilityPhases: Type.Array(AbilityPhaseSchema), factionRewards: Type.Array(FactionRewardRowSchema),
  usedInQuests: Type.Array(QuestObjectiveRowSchema), bossOf: refs, linkedNpc: optional(RefSchema), placedRules: Type.Array(PlacedRuleSchema),
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
  starts: Type.Array(QuestStartSchema), turnIns: Type.Array(QuestTurnInSchema), objectives: Type.Array(QuestObjectiveSchema),
  itemsGiven: Type.Array(QuestGivenRowSchema), rewards: Type.Array(QuestRewardRowSchema), rewardChoices: Type.Array(QuestRewardRowSchema),
  chainQuests: refs, unlocks: refs, worldChanges: Type.Array(QuestWorldChangeSchema), dungeon: optional(RefSchema), placedRules: Type.Array(PlacedRuleSchema),
}, { additionalProperties: false });
export type PublicQuest = Static<typeof PublicQuestSchema>;

export const PLACE_TYPE_VALUES = ["dungeon", "zone", "region", "interior"] as const;

// Where a place is on the world map: the map space it occupies, and the region areas that bound
// it. Variants share their host's map space but select only their own unique markers.
export const PlaceSpaceSchema = Type.Object({ mapSpaceId: text, regionIds: Type.Array(text, { uniqueItems: true }), placementIds: optional(Type.Array(text, { uniqueItems: true })) }, { additionalProperties: false });
export type PlaceSpace = Static<typeof PlaceSpaceSchema>;

export const PlaceFactsSchema = Type.Object({
  placeType: Type.Union([Type.Literal("dungeon"), Type.Literal("zone"), Type.Literal("region"), Type.Literal("interior")]),
  levelRange: optional(PublicLevelRangeSchema), guideIncluded: Type.Boolean(),
}, { additionalProperties: false });
export type PlaceFacts = Static<typeof PlaceFactsSchema>;

// `quests` start in the place; `questObjectives` have an objective target or a completion object in it.
export const PublicPlaceSchema = Type.Object({
  ...documentBase, facts: PlaceFactsSchema, space: Type.Union([PlaceSpaceSchema, Type.Null()]), variantOf: optional(RefSchema),
  bosses: refs, creatures: Type.Array(CreatureRowSchema), npcs: Type.Array(CreatureRowSchema),
  services: Type.Array(PlacementGroupSchema), resources: Type.Array(PlacementGroupSchema), containers: Type.Array(PlacementGroupSchema),
  quests: refs, questObjectives: refs, properties: refs, connections: Type.Array(ConnectionRowSchema), regions: refs, parent: optional(RefSchema),
}, { additionalProperties: false });
export type PublicPlace = Static<typeof PublicPlaceSchema>;

// The authored RPGProperty record: House or Business, and the purchase price, the sell price, and the income in the
// property's currency. The game pays the income of each owned property once every `incomeInterval` seconds of game
// time, only while the game runs.
export const PropertyFactsSchema = Type.Object({
  propertyType: optional(text), price: optional(PriceSchema), sellPrice: optional(PriceSchema), income: optional(PriceSchema),
  incomeInterval: optional(Type.Number({ exclusiveMinimum: 0 })),
}, { additionalProperties: false });
export type PropertyFacts = Static<typeof PropertyFactsSchema>;

// `locations` are the for-sale signs of the property, and `place` is the place that holds them.
export const PublicPropertySchema = Type.Object({ ...documentBase, facts: PropertyFactsSchema, locations: placements, place: optional(RefSchema) }, { additionalProperties: false });
export type PublicProperty = Static<typeof PublicPropertySchema>;

export const AbilityRankSchema = Type.Object({ rankIndex: count, lines: Type.Array(NativeTextLineSchema, { minItems: 1 }) }, { additionalProperties: false });
export type AbilityRank = Static<typeof AbilityRankSchema>;

// The records of one ability name that share the same rank texts. `keys` lists their catalog entity keys. `icon` is
// present when it differs from the page icon.
// How a published class learns an ability: as its auto attack, or through a node of one of its talent trees. `talent`
// links the row of that node on the class page, and `requirements` are the requirements of the node.
export const LearnerRowSchema = Type.Object({
  class: RefSchema, via: Type.Union([Type.Literal("autoAttack"), Type.Literal("talentTree")]),
  tree: optional(text), tier: optional(count), talent: optional(RefSchema), requirements,
}, { additionalProperties: false });
export type LearnerRow = Static<typeof LearnerRowSchema>;

// `useRequirements` are what a character needs to use the version: costs, such as "Costs 9 Mana", and conditions, such
// as "Ursine Aspect is active". The ability tooltip shows neither.
export const AbilityVersionSchema = Type.Object({
  keys: Type.Array(text, { minItems: 1, uniqueItems: true }), anchor, icon: optional(ArtRefSchema),
  ranks: Type.Array(AbilityRankSchema, { minItems: 1 }), useRequirements: requirements, learnedBy: Type.Array(LearnerRowSchema), usedBy: refs, usedByItems: refs, taughtBy: refs,
}, { additionalProperties: false });
export type AbilityVersion = Static<typeof AbilityVersionSchema>;

// A page groups the ability records that share a display name. Records whose rank texts differ are separate versions.
export const PublicAbilitySchema = Type.Object({ ...documentBase, versions: Type.Array(AbilityVersionSchema, { minItems: 1 }) }, { additionalProperties: false });
export type PublicAbility = Static<typeof PublicAbilitySchema>;

// One rank of a passive talent: the stats that it changes, and the tooltip text that the game authored for a rank that
// changes no stat.
export const TalentRankSchema = Type.Object({ rank: count, stats: Type.Array(StatRowSchema), text: Type.Array(NativeTextLineSchema) }, { additionalProperties: false });
export type TalentRank = Static<typeof TalentRankSchema>;
// One node of a talent tree. An ability node links its ability. A passive talent shows its first rank and its last rank.
export const TalentRowSchema = Type.Object({
  anchor, tier: count, position: count, name: text, ability: optional(RefSchema), ranks: count,
  first: optional(TalentRankSchema), last: optional(TalentRankSchema), requirements,
}, { additionalProperties: false });
export type TalentRow = Static<typeof TalentRowSchema>;
// `points` names the talent points that the tree spends.
export const TalentTreeSchema = Type.Object({ anchor, name: text, points: optional(text), rows: Type.Array(TalentRowSchema) }, { additionalProperties: false });
export type TalentTree = Static<typeof TalentTreeSchema>;
export const TalentPointsSchema = Type.Object({
  name: text, start: count, max: count,
  gains: Type.Array(Type.Object({ trigger: Type.Union([Type.Literal("characterLevelUp"), Type.Literal("skillLevelUp"), Type.Literal("npcKilled"), Type.Literal("itemGained"), Type.Literal("weaponTemplateLevelUp")]), amount: count }, { additionalProperties: false })),
}, { additionalProperties: false });
export type TalentPoints = Static<typeof TalentPointsSchema>;
export const ClassFactsSchema = Type.Object({
  races: Type.Array(text), weapons: Type.Array(text), autoAttack: optional(RefSchema), talentPoints: Type.Array(TalentPointsSchema), highestLevel: optional(count),
}, { additionalProperties: false });
export type ClassFacts = Static<typeof ClassFactsSchema>;
export const StartingItemRowSchema = Type.Object({ item: RefSchema, count, equipped: Type.Boolean() }, { additionalProperties: false });
export type StartingItemRow = Static<typeof StartingItemRowSchema>;
// Each row is the experience from its level to the next level, from the first level to the level before the cap.
export const LevelCurveSchema = Type.Object({ template: text, cap: count, rows: Type.Array(Type.Object({ level: count, toNext: count }, { additionalProperties: false }), { minItems: 1 }) }, { additionalProperties: false });
export type LevelCurve = Static<typeof LevelCurveSchema>;
export const PublicClassSchema = Type.Object({
  ...documentBase, facts: ClassFactsSchema, trees: Type.Array(TalentTreeSchema), startingGear: Type.Array(StartingItemRowSchema), placedRules: Type.Array(PlacedRuleSchema),
}, { additionalProperties: false });
export type PublicClass = Static<typeof PublicClassSchema>;
// `automatic` is false when a character does not receive the skill automatically.
export const SkillFactsSchema = Type.Object({ highestLevel: optional(count), automatic: Type.Boolean() }, { additionalProperties: false });
export type SkillFacts = Static<typeof SkillFactsSchema>;
// A recipe of the skill. `recipe` keeps the key and the name of the recipe, which has no page. `anchor` is the row's
// anchor, which a reference to a recipe without a published product links. `product` links the Crafting section.
export const SkillRecipeRowSchema = Type.Object({
  recipe: Type.Object({ key: text, name: text }, { additionalProperties: false }), anchor, product: optional(RefSchema), station: optional(RefSchema), requiredLevel: optional(count),
}, { additionalProperties: false });
export type SkillRecipeRow = Static<typeof SkillRecipeRowSchema>;
// `curve` is the skill's level template up to its highest level, when the skill has one.
// A gathering node that trains the skill, with its own requirements and its skill experience per use.
export const SkillGatheringNodeRowSchema = Type.Object({ node: RefSchema, requirements, experience: optional(count) }, { additionalProperties: false });
export type SkillGatheringNodeRow = Static<typeof SkillGatheringNodeRowSchema>;
// The verified ways that give the skill experience. `autoAttack` gives the experience of one hit with a weapon of the
// skill's type. `crafting` and `gathering` are present when a published recipe or gathering node trains the skill.
export const SkillExperienceSourcesSchema = Type.Object({
  autoAttack: optional(Type.Object({ perHit: count }, { additionalProperties: false })), crafting: Type.Boolean(), gathering: Type.Boolean(),
}, { additionalProperties: false });
export type SkillExperienceSources = Static<typeof SkillExperienceSourcesSchema>;
export const PublicSkillSchema = Type.Object({
  ...documentBase, facts: SkillFactsSchema, recipes: Type.Array(SkillRecipeRowSchema), curve: optional(LevelCurveSchema),
  gatheringNodes: Type.Array(SkillGatheringNodeRowSchema), experience: SkillExperienceSourcesSchema, placedRules: Type.Array(PlacedRuleSchema),
}, { additionalProperties: false });
export type PublicSkill = Static<typeof PublicSkillSchema>;

// Authored weights are not probabilities. Shares use the verified effective weights at each endpoint.
export const SpawnerOptionSchema = Type.Object({ node: RefSchema, lowSkillWeight: number, highSkillWeight: number, teaserWeight: number,
  shares: optional(Type.Array(Type.Object({ skillLevel: count, percent }, { additionalProperties: false }), { minItems: 1 })),
}, { additionalProperties: false });
export type SpawnerOption = Static<typeof SpawnerOptionSchema>;
// One group's denominator is one spawner's eligible options, not the sum of all spawners in the group.
export const SpawnerGroupSchema = Type.Object({
  skill: optional(RefSchema), skillCap: count, respawnSeconds: number, jitterSeconds: number, despawnSeconds: number, playerRange: number,
  options: Type.Array(SpawnerOptionSchema, { minItems: 1 }), spawners: Type.Integer({ minimum: 1 }), placementCount: count, unplaced: count,
}, { additionalProperties: false });
export type SpawnerGroup = Static<typeof SpawnerGroupSchema>;
// Objects that a scene places directly and that share one cooldown.
export const PlacedNodeGroupSchema = Type.Object({ cooldownSeconds: number, objects: Type.Integer({ minimum: 1 }), placementCount: count, unplaced: count }, { additionalProperties: false });
export type PlacedNodeGroup = Static<typeof PlacedNodeGroupSchema>;
// An item of the node's loot table with its authored count range and chance.
export const NodeYieldRowSchema = Type.Object({ counterpart: RefSchema, min: optional(count), max: optional(count), chance: optional(percent) }, { additionalProperties: false });
export type NodeYieldRow = Static<typeof NodeYieldRowSchema>;
// `requirements` are the node's own requirements, such as a skill level and a tool. `requiredLevel` is the level of the
// requirement on the node's own skill. `variant` is true when another node shares the name but differs in content.
export const GatheringNodeFactsSchema = Type.Object({
  skill: optional(RefSchema), requiredLevel: optional(count), skillExperience: optional(count), characterExperience: optional(count), requirements, variant: Type.Boolean(),
}, { additionalProperties: false });
export type GatheringNodeFacts = Static<typeof GatheringNodeFactsSchema>;
// `placedRules` identify supported computed values and guide explanations, never embed the rule prose.
export const PublicGatheringNodeSchema = Type.Object({
  ...documentBase, facts: GatheringNodeFactsSchema, yields: Type.Array(NodeYieldRowSchema),
  spawners: Type.Array(SpawnerGroupSchema), placed: Type.Array(PlacedNodeGroupSchema), places: Type.Array(PlaceSpotsSchema),
  spotCount: count, placedRules: Type.Array(PlacedRuleSchema),
}, { additionalProperties: false });
export type PublicGatheringNode = Static<typeof PublicGatheringNodeSchema>;

const levelSpan = Type.Object({ count, minLevel: count, maxLevel: count }, { additionalProperties: false });
// The levels of the records that give character experience. A fixed-level creature keeps its authored range. A scaling
// creature takes its level from the player within the zone range of its spawner, so `aboveFixed` lists the scaling
// creatures whose spawned level can exceed the highest fixed level, with that spawned level.
export const ExperienceSourcesSchema = Type.Object({
  fixedCreatures: levelSpan,
  scalingCreatures: Type.Object({ count, aboveFixed: Type.Array(Type.Object({ creature: RefSchema, level: PublicLevelSchema }, { additionalProperties: false })) }, { additionalProperties: false }),
  quests: Type.Object({ count, maxLevel: count, maxRequirement: optional(count), withoutRange: count }, { additionalProperties: false }),
  levelModifiers: Type.Array(Type.Object({ lower: number, higher: number, creatures: count }, { additionalProperties: false })),
}, { additionalProperties: false });
export type ExperienceSources = Static<typeof ExperienceSourcesSchema>;
// A guide explains its topic before it lists the rules. `overview` has at most three sentences. Each step summarizes the
// named rules of the topic in the order in which the game applies them.
export const GuideStepSchema = Type.Object({ id: anchor, title: text, text, rules: Type.Array(anchor, { minItems: 1, uniqueItems: true }) }, { additionalProperties: false });
export type GuideStep = Static<typeof GuideStepSchema>;
const guide = { overview: text, steps: Type.Array(GuideStepSchema, { minItems: 1 }) };
// A kill of a fixed-level creature at its own level without modifiers: the base roll from `lowest` to `highest`.
export const KillExampleSchema = Type.Object({ creature: EntityRefSchema, level: count, lowest: count, highest: count }, { additionalProperties: false });
export type KillExample = Static<typeof KillExampleSchema>;
export const CharacterProgressionSchema = Type.Object({
  ...documentBase, topic: Type.Literal("character-progression"), curve: LevelCurveSchema, sources: ExperienceSourcesSchema,
  talentPoints: Type.Array(TalentPointsSchema), rules: Type.Array(MechanicsRuleSchema), ...guide, example: optional(KillExampleSchema),
}, { additionalProperties: false });
export type CharacterProgression = Static<typeof CharacterProgressionSchema>;
// The captured values of the build's Heroic tier settings, or the reason that the scan has none.
export const HeroicSettingsSchema = Type.Union([
  Type.Object({
    killExperienceMultiplier: number, essencePoints: optional(text), essenceBaseAmount: count, essencePerAffix: count,
    essenceEliteMultiplier: number, essenceRareMultiplier: number, essenceBossMultiplier: number,
    essenceHealthBaseline: number, essenceHealthFactorMin: number, essenceHealthFactorMax: number,
    baseHealthMultiplier: number, baseDamageMultiplier: number, gearScoreCoefficient: number, maxGearBonus: number,
    affixChance: number, extraAffixChance: number, maxAffixes: count, rareGuaranteedAffixes: count,
    affixLootDropMultiplier: number, heroicGearStatBonusPercent: number,
  }, { additionalProperties: false }),
  Type.Object({ unavailable: text }, { additionalProperties: false }),
]);
export type HeroicSettings = Static<typeof HeroicSettingsSchema>;
// Heroic Essence per kill for each creature rank and affix count at the health baseline, before the stored fraction.
export const EssenceExampleSchema = Type.Object({
  affixCounts: Type.Array(count, { minItems: 1 }),
  rows: Type.Array(Type.Object({ rank: Type.Union([Type.Literal("other"), Type.Literal("elite"), Type.Literal("rare"), Type.Literal("boss")]), essence: Type.Array(number, { minItems: 1 }) }, { additionalProperties: false }), { minItems: 1 }),
}, { additionalProperties: false });
export type EssenceExample = Static<typeof EssenceExampleSchema>;
export const HeroicTierSchema = Type.Object({
  ...documentBase, topic: Type.Literal("heroic-tier"), settings: HeroicSettingsSchema, rules: Type.Array(MechanicsRuleSchema), ...guide, example: optional(EssenceExampleSchema),
}, { additionalProperties: false });
export type HeroicTier = Static<typeof HeroicTierSchema>;
// The most common spawner group of each gathering skill, as an example of weighted node selection. An example names no
// placements; the gathering node pages list them.
export const SpawnerExampleSchema = Type.Object({
  skill: optional(RefSchema), skillCap: count, respawnSeconds: number, jitterSeconds: number, despawnSeconds: number, playerRange: number,
  options: Type.Array(SpawnerOptionSchema, { minItems: 1 }), spawners: Type.Integer({ minimum: 1 }),
}, { additionalProperties: false });
export type SpawnerExample = Static<typeof SpawnerExampleSchema>;
// A worked craft and a worked gather. `product` links the Crafting section of the crafted item.
export const CraftingExampleSchema = Type.Object({
  craft: Type.Object({ product: EntityRefSchema, skill: RefSchema, rank: RecipeRankSchema }, { additionalProperties: false }),
  gather: Type.Object({ node: EntityRefSchema, skill: RefSchema, levelChances: Type.Array(Type.Object({ level: count, chance: percent }, { additionalProperties: false }), { minItems: 1 }) }, { additionalProperties: false }),
}, { additionalProperties: false });
export type CraftingExample = Static<typeof CraftingExampleSchema>;
export const CraftingAndGatheringSchema = Type.Object({
  ...documentBase, topic: Type.Literal("crafting-and-gathering"), rules: Type.Array(MechanicsRuleSchema), ...guide,
  spawnerExamples: Type.Array(SpawnerExampleSchema), example: CraftingExampleSchema,
}, { additionalProperties: false });
export type CraftingAndGathering = Static<typeof CraftingAndGatheringSchema>;
// Build-specific settings stay alongside the guide, not embedded as numeric constants in site copy.
const CorruptionBonusSchema = Type.Object({ stat: text, amountPerLevel: number, isPercent: Type.Boolean() }, { additionalProperties: false });
export const CorruptionGuideSchema = Type.Object({
  ...documentBase, topic: Type.Literal("corruption"), rules: Type.Array(MechanicsRuleSchema), ...guide,
  maxLevel: optional(count), gearAllStatsPercentPerLevel: optional(number),
  nativeRules: Type.Object({
    altarWithoutTokenIncrement: count, completionFirstBonus: count, completionSecondBonus: count,
    completionOtherwiseBonus: count, timeoutDecrease: count, timeoutMinimum: count,
  }, { additionalProperties: false }),
  gearStatBonuses: optional(Type.Array(CorruptionBonusSchema)), mobStatBonuses: optional(Type.Array(CorruptionBonusSchema)),
  affixesPerToken: optional(count), affixes: optional(Type.Array(Type.Object({
    name: text, description: text, available: Type.Boolean(),
  }, { additionalProperties: false }))),
  dungeons: Type.Array(Type.Object({
    place: EntityRefSchema, totalSeconds: optional(count), firstRemainingSeconds: optional(count),
    secondRemainingSeconds: optional(count), maxLootItems: optional(count),
    bosses: optional(Type.Array(EntityRefSchema)), rewardsFromBossDrops: optional(Type.Boolean()),
  }, { additionalProperties: false })),
  token: optional(EntityRefSchema), heart: optional(EntityRefSchema),
  heartRequirements: optional(Type.Array(Type.Object({
    stoneName: optional(text), regionName: optional(text), place: optional(EntityRefSchema),
    destinations: Type.Array(EntityRefSchema), unlinkedDestinations: optional(Type.Array(text)),
    spot: optional(PlacementRefSchema), count: count,
  }, { additionalProperties: false }))),
  example: optional(Type.Object({
    item: EntityRefSchema, level: count, stat: text, baseStat: number, calculatedStat: number,
    basePower: optional(number), calculatedPower: optional(number),
  }, { additionalProperties: false })),
  evidence: Type.Array(text), unknowns: Type.Array(text),
}, { additionalProperties: false });
export type CorruptionGuide = Static<typeof CorruptionGuideSchema>;
export const PublicMechanicsSchema = Type.Union([CharacterProgressionSchema, HeroicTierSchema, CraftingAndGatheringSchema, CorruptionGuideSchema]);
export type PublicMechanics = Static<typeof PublicMechanicsSchema>;

// The schema maps carry explicit types that name each schema, because the inferred types are too large
// for the compiler to serialize into declarations.
export const PUBLIC_DOCUMENT_SCHEMAS: {
  items: typeof PublicItemSchema; npcs: typeof PublicNpcSchema; quests: typeof PublicQuestSchema; places: typeof PublicPlaceSchema;
  properties: typeof PublicPropertySchema; abilities: typeof PublicAbilitySchema;
  classes: typeof PublicClassSchema; skills: typeof PublicSkillSchema; mechanics: typeof PublicMechanicsSchema; gatheringNodes: typeof PublicGatheringNodeSchema;
} = {
  items: PublicItemSchema, npcs: PublicNpcSchema, quests: PublicQuestSchema, places: PublicPlaceSchema,
  properties: PublicPropertySchema, abilities: PublicAbilitySchema,
  classes: PublicClassSchema, skills: PublicSkillSchema, mechanics: PublicMechanicsSchema, gatheringNodes: PublicGatheringNodeSchema,
} satisfies Record<PublicPageKind, TSchema>;
export type PublicDocument = PublicItem | PublicNpc | PublicQuest | PublicPlace | PublicProperty | PublicAbility | PublicClass | PublicSkill | PublicMechanics | PublicGatheringNode;
export type PublicDocumentOf<K extends PublicPageKind> = Static<typeof PUBLIC_DOCUMENT_SCHEMAS[K]>;

export const STATIC_DOCUMENT_SCHEMA_IDS = {
  items: "compendium.static-item.v12", npcs: "compendium.static-npc.v6", quests: "compendium.static-quest.v6", places: "compendium.static-place.v7",
  properties: "compendium.static-property.v4", abilities: "compendium.static-ability.v6",
  classes: "compendium.static-class.v4", skills: "compendium.static-skill.v5", mechanics: "compendium.static-mechanics.v6", gatheringNodes: "compendium.static-gathering-node.v4",
} as const satisfies Record<PublicPageKind, string>;
export type StaticDocumentSchemaId = typeof STATIC_DOCUMENT_SCHEMA_IDS[PublicPageKind];

/** Whether a reference kind has pages, which lets a caller narrow a registry or reference kind without a cast. */
export function isPublicPageKind(kind: string): kind is PublicPageKind {
  return Object.hasOwn(STATIC_DOCUMENT_SCHEMA_IDS, kind);
}

const staticDocument = <K extends PublicPageKind>(kind: K) => Type.Object({
  schemaVersion: Type.Literal(STATIC_DOCUMENT_SCHEMA_IDS[kind]), ...identity, kind: Type.Literal(kind), document: PUBLIC_DOCUMENT_SCHEMAS[kind],
}, { additionalProperties: false });
export const StaticItemDocumentSchema = staticDocument("items");
export const StaticNpcDocumentSchema = staticDocument("npcs");
export const StaticQuestDocumentSchema = staticDocument("quests");
export const StaticPlaceDocumentSchema = staticDocument("places");
export const StaticPropertyDocumentSchema = staticDocument("properties");
export const StaticAbilityDocumentSchema = staticDocument("abilities");
export const StaticClassDocumentSchema = staticDocument("classes");
export const StaticSkillDocumentSchema = staticDocument("skills");
export const StaticMechanicsDocumentSchema = staticDocument("mechanics");
export const StaticGatheringNodeDocumentSchema = staticDocument("gatheringNodes");
export const STATIC_DOCUMENT_SCHEMAS: {
  "compendium.static-item.v12": typeof StaticItemDocumentSchema; "compendium.static-npc.v6": typeof StaticNpcDocumentSchema;
  "compendium.static-quest.v6": typeof StaticQuestDocumentSchema; "compendium.static-place.v7": typeof StaticPlaceDocumentSchema;
  "compendium.static-property.v4": typeof StaticPropertyDocumentSchema; "compendium.static-ability.v6": typeof StaticAbilityDocumentSchema;
  "compendium.static-class.v4": typeof StaticClassDocumentSchema;
  "compendium.static-skill.v5": typeof StaticSkillDocumentSchema; "compendium.static-mechanics.v6": typeof StaticMechanicsDocumentSchema;
  "compendium.static-gathering-node.v4": typeof StaticGatheringNodeDocumentSchema;
} = {
  "compendium.static-item.v12": StaticItemDocumentSchema, "compendium.static-npc.v6": StaticNpcDocumentSchema,
  "compendium.static-quest.v6": StaticQuestDocumentSchema, "compendium.static-place.v7": StaticPlaceDocumentSchema,
  "compendium.static-property.v4": StaticPropertyDocumentSchema, "compendium.static-ability.v6": StaticAbilityDocumentSchema,
  "compendium.static-class.v4": StaticClassDocumentSchema,
  "compendium.static-skill.v5": StaticSkillDocumentSchema, "compendium.static-mechanics.v6": StaticMechanicsDocumentSchema,
  "compendium.static-gathering-node.v4": StaticGatheringNodeDocumentSchema,
};
export type StaticDocument = Static<typeof StaticItemDocumentSchema> | Static<typeof StaticNpcDocumentSchema> | Static<typeof StaticQuestDocumentSchema>
  | Static<typeof StaticPlaceDocumentSchema> | Static<typeof StaticPropertyDocumentSchema> | Static<typeof StaticAbilityDocumentSchema>
  | Static<typeof StaticClassDocumentSchema> | Static<typeof StaticSkillDocumentSchema> | Static<typeof StaticMechanicsDocumentSchema> | Static<typeof StaticGatheringNodeDocumentSchema>;
export const documentReference = Type.Union([
  resourceReference("compendium.static-item.v12"), resourceReference("compendium.static-npc.v6"), resourceReference("compendium.static-quest.v6"), resourceReference("compendium.static-place.v7"),
  resourceReference("compendium.static-property.v4"), resourceReference("compendium.static-ability.v6"),
  resourceReference("compendium.static-class.v4"), resourceReference("compendium.static-skill.v5"), resourceReference("compendium.static-mechanics.v6"),
  resourceReference("compendium.static-gathering-node.v4"),
]);
export type DocumentReference = Static<typeof documentReference>;

// The registry is data the site reads: labels, routes, and list shape per kind. A kind absent
// from the registry is not routed.
export const ListColumnSchema = Type.Object({ id: text, label: text, sortable: Type.Boolean(), numeric: Type.Boolean() }, { additionalProperties: false });
export type ListColumn = Static<typeof ListColumnSchema>;
export const ListFacetSchema = Type.Object({ id: text, label: text, defaultHiddenValues: optional(Type.Array(text, { minItems: 1, uniqueItems: true })) }, { additionalProperties: false });
export type ListFacet = Static<typeof ListFacetSchema>;

export const PublicKindEntrySchema = Type.Object({
  kind: referenceKind, label: text, plural: text, route: slug, icon: text,
  // `list` is true when the kind has a list page; a kind with pages always has one.
  pages: Type.Boolean(), list: Type.Boolean(), searchable: Type.Boolean(),
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
  schemaVersion: Type.Literal("compendium.static-kind-list.v5"), ...identity, kind: PublicListKindSchema, part: count, rows: Type.Array(ListRowSchema),
}, { additionalProperties: false });
export type StaticKindList = Static<typeof StaticKindListSchema>;

// One search corpus for the map and the pages, and the index of published pages: an entry of a
// paged kind carries that entity's slug in its reference and its document reference, so the site
// derives its prerender entries from the corpus instead of a second list that repeats it.
//
// An entry names no placements. The map shards already carry each placement's entity and item
// keys, so the map resolves an entry's places from data it has loaded; repeating them here cost
// 1.86 MB of a 2.93 MB corpus, up to 594 ids for one creature. `hasPlacements` is the one bit a
// result needs to offer a map link before the shards are consulted.
export const PublicSearchEntrySchema = Type.Object({
  ref: EntityRefSchema, level: optional(Type.Union([count, PublicLevelRangeSchema])), place: optional(text),
  hasPlacements: Type.Boolean(), sourceKinds: Type.Array(text, { uniqueItems: true }),
  // Other names that find the entry, such as the name of a recipe that differs from the name of its product.
  aliases: optional(Type.Array(text, { minItems: 1, uniqueItems: true })),
  document: optional(documentReference),
}, { additionalProperties: false });
export type PublicSearchEntry = Static<typeof PublicSearchEntrySchema>;

export const StaticSearchIndexSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.static-search.v6"), ...identity, part: count, entries: Type.Array(PublicSearchEntrySchema),
}, { additionalProperties: false });
export type StaticSearchIndex = Static<typeof StaticSearchIndexSchema>;

export const STATIC_COMPENDIUM_SCHEMAS: typeof STATIC_DOCUMENT_SCHEMAS & {
  "compendium.static-kind-list.v5": typeof StaticKindListSchema; "compendium.static-search.v6": typeof StaticSearchIndexSchema;
} = {
  ...STATIC_DOCUMENT_SCHEMAS,
  "compendium.static-kind-list.v5": StaticKindListSchema,
  "compendium.static-search.v6": StaticSearchIndexSchema,
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
  if ("variants" in document) for (const variant of document.variants) art.push(variant.portrait);
  if ("versions" in document) for (const version of document.versions) art.push(version.icon);
  for (const ref of collectRefs(document)) { if (ref.icon) art.push(ref.icon); if (ref.portrait) art.push(ref.portrait); }
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

// Full placement references and compact per-place IDs both select published map spots.
// The publication graph validates each ID against its published placement set.
export function collectPlacementRefs(value: unknown, into: PlacementRef[] = []): PlacementRef[] {
  if (Array.isArray(value)) { for (const item of value) collectPlacementRefs(item, into); return into; }
  if (value === null || typeof value !== "object") return into;
  const record = value as Record<string, unknown>;
  if (typeof record.placementId === "string" && typeof record.mapSpaceId === "string" && typeof record.label === "string") into.push(record as PlacementRef);
  if (typeof record.mapSpaceId === "string" && typeof record.label === "string" && Array.isArray(record.placementIds))
    for (const placementId of record.placementIds) if (typeof placementId === "string")
      into.push({ placementId, mapSpaceId: record.mapSpaceId, label: record.label });
  for (const child of Object.values(record)) collectPlacementRefs(child, into);
  return into;
}

// The static resource schemas register with the rest of STATIC_RESOURCE_SCHEMAS in resources.ts.
schemaRegistry.register("compendium.public-art-ref.v1", ArtRefSchema);
schemaRegistry.register("compendium.public-entity-ref.v3", EntityRefSchema);
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
schemaRegistry.register("compendium.public-drop-row.v4", DropRowSchema);
schemaRegistry.register("compendium.public-vendor-row.v3", VendorRowSchema);
schemaRegistry.register("compendium.public-npc-drop-row.v1", NpcDropRowSchema);
schemaRegistry.register("compendium.public-npc-vendor-row.v1", NpcVendorRowSchema);
schemaRegistry.register("compendium.public-place-spots.v2", PlaceSpotsSchema);
schemaRegistry.register("compendium.public-gather-row.v3", GatherRowSchema);
schemaRegistry.register("compendium.public-container-row.v5", ContainerRowSchema);
schemaRegistry.register("compendium.public-quest-given-row.v1", QuestGivenRowSchema);
schemaRegistry.register("compendium.public-quest-reward-row.v1", QuestRewardRowSchema);
schemaRegistry.register("compendium.public-quest-link-row.v1", QuestLinkRowSchema);
schemaRegistry.register("compendium.public-objective-completion.v1", ObjectiveCompletionSchema);
schemaRegistry.register("compendium.public-quest-objective.v2", QuestObjectiveSchema);
schemaRegistry.register("compendium.public-quest-objective-row.v2", QuestObjectiveRowSchema);
schemaRegistry.register("compendium.public-quest-start.v1", QuestStartSchema);
schemaRegistry.register("compendium.public-quest-world-change.v1", QuestWorldChangeSchema);
schemaRegistry.register("compendium.public-npc-location.v2", NpcLocationSchema);
schemaRegistry.register("compendium.public-npc-variant.v1", NpcVariantSchema);
schemaRegistry.register("compendium.public-world-quest-facts.v1", WorldQuestFactsSchema);
schemaRegistry.register("compendium.public-recipe-row.v1", RecipeRowSchema);
schemaRegistry.register("compendium.public-used-in-recipe-row.v1", UsedInRecipeRowSchema);
schemaRegistry.register("compendium.public-craft.v1", CraftSchema);
schemaRegistry.register("compendium.public-placed-rule.v2", PlacedRuleSchema);
schemaRegistry.register("compendium.public-contextual-ability-ref.v1", ContextualAbilityRefSchema);
schemaRegistry.register("compendium.public-ability-rank.v1", AbilityRankSchema);
schemaRegistry.register("compendium.public-ability-version.v3", AbilityVersionSchema);
schemaRegistry.register("compendium.public-ability-phase.v2", AbilityPhaseSchema);
schemaRegistry.register("compendium.public-faction-reward-row.v1", FactionRewardRowSchema);
schemaRegistry.register("compendium.public-creature-row.v1", CreatureRowSchema);
schemaRegistry.register("compendium.public-placement-group.v1", PlacementGroupSchema);
schemaRegistry.register("compendium.public-connection-row.v2", ConnectionRowSchema);
schemaRegistry.register("compendium.public-kind-entry.v3", PublicKindEntrySchema);
schemaRegistry.register("compendium.public-search-entry.v2", PublicSearchEntrySchema);
// Schema ids are lower case with hyphens, so a camel-case kind becomes hyphenated. A public document schema
// shares the version of its static document schema.
for (const [kind, schema] of Object.entries(PUBLIC_DOCUMENT_SCHEMAS)) schemaRegistry.register(`compendium.public-${kind.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}-document.${STATIC_DOCUMENT_SCHEMA_IDS[kind as PublicPageKind].split(".").at(-1)!}`, schema);
