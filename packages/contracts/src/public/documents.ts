import { Type, type Static, type TSchema } from "typebox";
import { schemaRegistry } from "../schema-registry";
import { count, hash, number, publicMarkerCategory, resourceReference, text, PublicLevelRangeSchema, StaticResourceIdentityFields } from "./primitives";

const percent = Type.Number({ minimum: 0, maximum: 100 });
const optional = <T extends TSchema>(schema: T) => Type.Optional(schema);
const nullableText = Type.Union([Type.String(), Type.Null()]);
const identity = StaticResourceIdentityFields;

// Kinds with pages own a route and a document schema. Kinds without pages still have references,
// names, and icons, so a stat or currency renders as text with its icon rather than as a dead link.
export const PUBLIC_PAGE_KIND_VALUES = ["items", "npcs", "quests", "places", "properties", "abilities", "recipes"] as const;
export type PublicPageKind = typeof PUBLIC_PAGE_KIND_VALUES[number];
export const PUBLIC_REFERENCE_KIND_VALUES = [...PUBLIC_PAGE_KIND_VALUES, "currencies", "stats", "factions", "skills", "classes", "races", "enchantments", "gearSets", "effects", "species", "lootTables", "craftingStations"] as const;
export type PublicReferenceKind = typeof PUBLIC_REFERENCE_KIND_VALUES[number];
const pageKind = Type.Union([Type.Literal("items"), Type.Literal("npcs"), Type.Literal("quests"), Type.Literal("places"), Type.Literal("properties"), Type.Literal("abilities"), Type.Literal("recipes")]);
const referenceKind = Type.Union([
  ...pageKind.anyOf,
  Type.Literal("currencies"), Type.Literal("stats"), Type.Literal("factions"), Type.Literal("skills"), Type.Literal("classes"), Type.Literal("races"),
  Type.Literal("enchantments"), Type.Literal("gearSets"), Type.Literal("effects"), Type.Literal("species"), Type.Literal("lootTables"), Type.Literal("craftingStations"),
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

export const RequirementRefSchema = Type.Object({
  type: text, label: text, mandatory: Type.Boolean(),
  target: optional(RefSchema), amount: optional(number), secondaryAmount: optional(number),
}, { additionalProperties: false });
export type RequirementRef = Static<typeof RequirementRefSchema>;

const refs = Type.Array(RefSchema);
const requirements = Type.Array(RequirementRefSchema);
const placements = Type.Array(PlacementRefSchema);

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
export const DropRowSchema = Type.Object({
  counterpart: RefSchema, min: optional(count), max: optional(count), chance: optional(percent),
  levelBand: optional(PublicLevelRangeSchema), requirements, placements,
}, { additionalProperties: false });
export type DropRow = Static<typeof DropRowSchema>;

export const VendorRowSchema = Type.Object({ counterpart: RefSchema, price: PriceSchema, requirements, placements }, { additionalProperties: false });
export type VendorRow = Static<typeof VendorRowSchema>;

export const GatherRowSchema = Type.Object({
  counterpart: optional(RefSchema), label: text, skill: optional(RefSchema), rank: optional(count),
  min: optional(count), max: optional(count), chance: optional(percent), placements,
}, { additionalProperties: false });
export type GatherRow = Static<typeof GatherRowSchema>;

export const ContainerRowSchema = Type.Object({
  counterpart: optional(RefSchema), label: text, min: optional(count), max: optional(count), chance: optional(percent), requirements, placements,
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

export const AbilityPhaseSchema = Type.Object({ phaseIndex: count, name: optional(text), requirement: optional(text), abilities: refs }, { additionalProperties: false });
export type AbilityPhase = Static<typeof AbilityPhaseSchema>;

export const FactionRewardRowSchema = Type.Object({ counterpart: RefSchema, amount: number }, { additionalProperties: false });
export type FactionRewardRow = Static<typeof FactionRewardRowSchema>;

export const CreatureRowSchema = Type.Object({ counterpart: RefSchema, levelRange: optional(PublicLevelRangeSchema), roles: Type.Array(text, { uniqueItems: true }), placements }, { additionalProperties: false });
export type CreatureRow = Static<typeof CreatureRowSchema>;

const markerCategory = publicMarkerCategory;
export const PlacementGroupSchema = Type.Object({ category: markerCategory, placements: Type.Array(PlacementRefSchema, { minItems: 1 }) }, { additionalProperties: false });
export type PlacementGroup = Static<typeof PlacementGroupSchema>;

export const ConnectionRowSchema = Type.Object({ counterpart: RefSchema, kind: text, placements }, { additionalProperties: false });
export type ConnectionRow = Static<typeof ConnectionRowSchema>;

// Quest objectives follow the native task types. `unsupported` keeps the raw type name so a task
// the decoder does not understand stays visible instead of vanishing.
const objectiveBase = { index: count, label: text, description: optional(text), timeLimit: optional(number) };
export const QuestObjectiveSchema = Type.Union([
  Type.Object({ ...objectiveBase, type: Type.Literal("killNpc"), target: RefSchema, count: Type.Integer({ minimum: 1 }) }, { additionalProperties: false }),
  Type.Object({ ...objectiveBase, type: Type.Literal("getItem"), target: RefSchema, count: Type.Integer({ minimum: 1 }), keepItems: Type.Boolean() }, { additionalProperties: false }),
  Type.Object({ ...objectiveBase, type: Type.Literal("talkToNpc"), target: RefSchema }, { additionalProperties: false }),
  Type.Object({ ...objectiveBase, type: Type.Literal("useItem"), target: RefSchema, count: Type.Integer({ minimum: 1 }) }, { additionalProperties: false }),
  Type.Object({ ...objectiveBase, type: Type.Literal("enterScene"), target: RefSchema }, { additionalProperties: false }),
  Type.Object({ ...objectiveBase, type: Type.Literal("enterRegion"), target: RefSchema }, { additionalProperties: false }),
  Type.Object({ ...objectiveBase, type: Type.Literal("learnAbility"), target: RefSchema }, { additionalProperties: false }),
  Type.Object({ ...objectiveBase, type: Type.Literal("unsupported"), rawType: text }, { additionalProperties: false }),
]);
export type QuestObjective = Static<typeof QuestObjectiveSchema>;

export const QuestObjectiveRowSchema = Type.Object({ counterpart: RefSchema, objective: QuestObjectiveSchema }, { additionalProperties: false });
export type QuestObjectiveRow = Static<typeof QuestObjectiveRowSchema>;

export const ArtSchema = Type.Object({ icon: optional(ArtRefSchema), portrait: optional(ArtRefSchema), artwork: optional(ArtRefSchema) }, { additionalProperties: false });
export type Art = Static<typeof ArtSchema>;

const documentBase = { ref: EntityRefSchema, description: nullableText, art: ArtSchema, locations: placements };

export const ItemFactsSchema = Type.Object({
  rarity: optional(text), itemType: optional(text), slot: optional(text), weaponType: optional(text), armorType: optional(text), weaponSlot: optional(text),
  attackSpeed: optional(number), minDamage: optional(count), maxDamage: optional(count),
  stats: Type.Array(StatRowSchema), randomStats: Type.Array(RandomStatRowSchema), randomStatsMax: count,
  sockets: Type.Array(SocketRowSchema), gem: optional(GemSchema),
  enchantment: optional(RefSchema), sellPrice: optional(PriceSchema), buyPrice: optional(PriceSchema),
  stackLimit: count, questDropOnly: Type.Boolean(), corruptionToken: Type.Boolean(),
  levelRequirement: optional(count), requirements,
}, { additionalProperties: false });
export type ItemFacts = Static<typeof ItemFactsSchema>;

export const PublicItemSchema = Type.Object({
  ...documentBase, facts: ItemFactsSchema,
  droppedBy: Type.Array(DropRowSchema), soldBy: Type.Array(VendorRowSchema), gatheredFrom: Type.Array(GatherRowSchema),
  inContainers: Type.Array(ContainerRowSchema), rewardedBy: Type.Array(QuestRewardRowSchema), givenBy: Type.Array(QuestGivenRowSchema),
  craftedBy: Type.Array(RecipeRowSchema), usedInRecipes: Type.Array(RecipeRowSchema), usedInQuests: Type.Array(QuestObjectiveRowSchema),
}, { additionalProperties: false });
export type PublicItem = Static<typeof PublicItemSchema>;

export const NpcFactsSchema = Type.Object({
  level: optional(count), levelRange: optional(PublicLevelRangeSchema), scalesWithPlayer: Type.Boolean(),
  npcType: optional(text), creatureType: optional(text), family: optional(text),
  faction: optional(RefSchema), species: optional(RefSchema),
  roles: Type.Array(markerCategory, { uniqueItems: true }),
  respawn: optional(Type.Object({ min: number, max: number }, { additionalProperties: false })),
  experience: optional(Type.Object({ min: count, max: count }, { additionalProperties: false })),
  stats: Type.Array(StatRowSchema), immunities: Type.Array(text, { uniqueItems: true }), aggroRange: optional(number),
}, { additionalProperties: false });
export type NpcFacts = Static<typeof NpcFactsSchema>;

export const PublicNpcSchema = Type.Object({
  ...documentBase, facts: NpcFactsSchema,
  drops: Type.Array(DropRowSchema), sells: Type.Array(VendorRowSchema), quests: Type.Array(QuestLinkRowSchema),
  abilityPhases: Type.Array(AbilityPhaseSchema), factionRewards: Type.Array(FactionRewardRowSchema),
  usedInQuests: Type.Array(QuestObjectiveRowSchema), bossOf: refs, linkedNpc: optional(RefSchema),
}, { additionalProperties: false });
export type PublicNpc = Static<typeof PublicNpcSchema>;

export const QuestFactsSchema = Type.Object({
  chain: optional(Type.Object({ name: text, order: Type.Integer() }, { additionalProperties: false })),
  repeatable: Type.Boolean(), turnInWithoutNpc: Type.Boolean(), requirements,
  levelRequirement: optional(count), experience: optional(count), objectiveText: optional(text), completedDescription: optional(text),
}, { additionalProperties: false });
export type QuestFacts = Static<typeof QuestFactsSchema>;

export const PublicQuestSchema = Type.Object({
  ...documentBase, facts: QuestFactsSchema,
  givers: refs, turnIns: refs, objectives: Type.Array(QuestObjectiveSchema),
  itemsGiven: Type.Array(QuestGivenRowSchema), rewards: Type.Array(QuestRewardRowSchema), rewardChoices: Type.Array(QuestRewardRowSchema),
  previous: optional(RefSchema), next: optional(RefSchema), chainQuests: refs,
}, { additionalProperties: false });
export type PublicQuest = Static<typeof PublicQuestSchema>;

export const PLACE_TYPE_VALUES = ["dungeon", "zone", "region", "interior"] as const;
export const PlaceFactsSchema = Type.Object({
  placeType: Type.Union([Type.Literal("dungeon"), Type.Literal("zone"), Type.Literal("region"), Type.Literal("interior")]),
  levelRange: optional(PublicLevelRangeSchema), guideIncluded: Type.Boolean(), mapSpaceId: optional(text),
}, { additionalProperties: false });
export type PlaceFacts = Static<typeof PlaceFactsSchema>;

export const PublicPlaceSchema = Type.Object({
  ...documentBase, facts: PlaceFactsSchema,
  bosses: refs, creatures: Type.Array(CreatureRowSchema), npcs: Type.Array(CreatureRowSchema),
  services: Type.Array(PlacementGroupSchema), resources: Type.Array(PlacementGroupSchema), containers: Type.Array(PlacementGroupSchema),
  quests: refs, properties: refs, connections: Type.Array(ConnectionRowSchema), regions: refs, parent: optional(RefSchema),
}, { additionalProperties: false });
export type PublicPlace = Static<typeof PublicPlaceSchema>;

export const PropertyFactsSchema = Type.Object({ income: optional(number), price: optional(PriceSchema) }, { additionalProperties: false });
export type PropertyFacts = Static<typeof PropertyFactsSchema>;

export const PublicPropertySchema = Type.Object({ ...documentBase, facts: PropertyFactsSchema, place: optional(RefSchema) }, { additionalProperties: false });
export type PublicProperty = Static<typeof PublicPropertySchema>;

export const AbilityFactsSchema = Type.Object({}, { additionalProperties: false });
export type AbilityFacts = Static<typeof AbilityFactsSchema>;

export const PublicAbilitySchema = Type.Object({ ...documentBase, facts: AbilityFactsSchema, usedBy: refs, taughtBy: refs }, { additionalProperties: false });
export type PublicAbility = Static<typeof PublicAbilitySchema>;

export const RecipeFactsSchema = Type.Object({ station: optional(RefSchema), skill: optional(RefSchema), rank: optional(count) }, { additionalProperties: false });
export type RecipeFacts = Static<typeof RecipeFactsSchema>;

export const PublicRecipeSchema = Type.Object({ ...documentBase, facts: RecipeFactsSchema, product: optional(RecipeRowSchema), materials: Type.Array(RecipeRowSchema) }, { additionalProperties: false });
export type PublicRecipe = Static<typeof PublicRecipeSchema>;

export const PUBLIC_DOCUMENT_SCHEMAS = {
  items: PublicItemSchema, npcs: PublicNpcSchema, quests: PublicQuestSchema, places: PublicPlaceSchema,
  properties: PublicPropertySchema, abilities: PublicAbilitySchema, recipes: PublicRecipeSchema,
} as const satisfies Record<PublicPageKind, TSchema>;
export type PublicDocument = PublicItem | PublicNpc | PublicQuest | PublicPlace | PublicProperty | PublicAbility | PublicRecipe;
export type PublicDocumentOf<K extends PublicPageKind> = Static<typeof PUBLIC_DOCUMENT_SCHEMAS[K]>;

export const STATIC_DOCUMENT_SCHEMA_IDS = {
  items: "compendium.static-item.v1", npcs: "compendium.static-npc.v1", quests: "compendium.static-quest.v1", places: "compendium.static-place.v1",
  properties: "compendium.static-property.v1", abilities: "compendium.static-ability.v1", recipes: "compendium.static-recipe.v1",
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
export const STATIC_DOCUMENT_SCHEMAS = {
  "compendium.static-item.v1": StaticItemDocumentSchema, "compendium.static-npc.v1": StaticNpcDocumentSchema,
  "compendium.static-quest.v1": StaticQuestDocumentSchema, "compendium.static-place.v1": StaticPlaceDocumentSchema,
  "compendium.static-property.v1": StaticPropertyDocumentSchema, "compendium.static-ability.v1": StaticAbilityDocumentSchema,
  "compendium.static-recipe.v1": StaticRecipeDocumentSchema,
} as const;
export type StaticDocument = Static<typeof StaticItemDocumentSchema> | Static<typeof StaticNpcDocumentSchema> | Static<typeof StaticQuestDocumentSchema>
  | Static<typeof StaticPlaceDocumentSchema> | Static<typeof StaticPropertyDocumentSchema> | Static<typeof StaticAbilityDocumentSchema> | Static<typeof StaticRecipeDocumentSchema>;
export const documentReference = Type.Union([
  resourceReference("compendium.static-item.v1"), resourceReference("compendium.static-npc.v1"), resourceReference("compendium.static-quest.v1"), resourceReference("compendium.static-place.v1"),
  resourceReference("compendium.static-property.v1"), resourceReference("compendium.static-ability.v1"), resourceReference("compendium.static-recipe.v1"),
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

export const StaticKindListSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.static-kind-list.v1"), ...identity, kind: pageKind, rows: Type.Array(ListRowSchema),
}, { additionalProperties: false });
export type StaticKindList = Static<typeof StaticKindListSchema>;

// One search corpus for the atlas and the pages. `document` is the entry's page document when the
// kind has pages; `placementIds` lets a result open the map.
export const PublicSearchEntrySchema = Type.Object({
  ref: EntityRefSchema, level: optional(Type.Union([count, PublicLevelRangeSchema])), place: optional(text),
  placementIds: Type.Array(text, { uniqueItems: true }), sourceKinds: Type.Array(text, { uniqueItems: true }),
  document: optional(documentReference),
}, { additionalProperties: false });
export type PublicSearchEntry = Static<typeof PublicSearchEntrySchema>;

export const StaticSearchIndexSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.static-search.v3"), ...identity, part: count, entries: Type.Array(PublicSearchEntrySchema),
}, { additionalProperties: false });
export type StaticSearchIndex = Static<typeof StaticSearchIndexSchema>;

export const StaticPageEntrySchema = Type.Object({ kind: pageKind, slug, key: text, document: documentReference }, { additionalProperties: false });
export type StaticPageEntry = Static<typeof StaticPageEntrySchema>;

export const StaticPagesSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.static-pages.v1"), ...identity, entries: Type.Array(StaticPageEntrySchema),
}, { additionalProperties: false });
export type StaticPages = Static<typeof StaticPagesSchema>;

export const STATIC_COMPENDIUM_SCHEMAS = {
  ...STATIC_DOCUMENT_SCHEMAS,
  "compendium.static-kind-list.v1": StaticKindListSchema,
  "compendium.static-search.v3": StaticSearchIndexSchema,
  "compendium.static-pages.v1": StaticPagesSchema,
} as const;
export type StaticCompendiumResource = StaticDocument | StaticKindList | StaticSearchIndex | StaticPages;

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

// The static resource schemas register with the rest of STATIC_RESOURCE_SCHEMAS in resources.ts.
schemaRegistry.register("compendium.public-art-ref.v1", ArtRefSchema);
schemaRegistry.register("compendium.public-entity-ref.v1", EntityRefSchema);
schemaRegistry.register("compendium.public-unresolved-ref.v1", UnresolvedRefSchema);
schemaRegistry.register("compendium.public-placement-ref.v1", PlacementRefSchema);
schemaRegistry.register("compendium.public-requirement-ref.v1", RequirementRefSchema);
schemaRegistry.register("compendium.public-random-stat-row.v1", RandomStatRowSchema);
schemaRegistry.register("compendium.public-gem.v1", GemSchema);
schemaRegistry.register("compendium.public-drop-row.v1", DropRowSchema);
schemaRegistry.register("compendium.public-vendor-row.v1", VendorRowSchema);
schemaRegistry.register("compendium.public-gather-row.v1", GatherRowSchema);
schemaRegistry.register("compendium.public-container-row.v1", ContainerRowSchema);
schemaRegistry.register("compendium.public-quest-given-row.v1", QuestGivenRowSchema);
schemaRegistry.register("compendium.public-quest-reward-row.v1", QuestRewardRowSchema);
schemaRegistry.register("compendium.public-quest-link-row.v1", QuestLinkRowSchema);
schemaRegistry.register("compendium.public-quest-objective.v1", QuestObjectiveSchema);
schemaRegistry.register("compendium.public-quest-objective-row.v1", QuestObjectiveRowSchema);
schemaRegistry.register("compendium.public-recipe-row.v1", RecipeRowSchema);
schemaRegistry.register("compendium.public-ability-phase.v1", AbilityPhaseSchema);
schemaRegistry.register("compendium.public-faction-reward-row.v1", FactionRewardRowSchema);
schemaRegistry.register("compendium.public-creature-row.v1", CreatureRowSchema);
schemaRegistry.register("compendium.public-placement-group.v1", PlacementGroupSchema);
schemaRegistry.register("compendium.public-connection-row.v1", ConnectionRowSchema);
schemaRegistry.register("compendium.public-kind-entry.v1", PublicKindEntrySchema);
schemaRegistry.register("compendium.public-search-entry.v1", PublicSearchEntrySchema);
for (const [kind, schema] of Object.entries(PUBLIC_DOCUMENT_SCHEMAS)) schemaRegistry.register(`compendium.public-${kind}-document.v1`, schema);
