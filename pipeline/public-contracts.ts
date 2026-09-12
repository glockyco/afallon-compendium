import { Type, type Static } from "typebox";

const text = Type.String({ minLength: 1 });
const number = Type.Number();
const count = Type.Integer({ minimum: 0 });
const point = Type.Object({ x: number, y: number }, { additionalProperties: false });
const position = Type.Tuple([number, number]);
const url = Type.String({ minLength: 1, pattern: "^(?!/)(?!.*\\.\\.)(?!.*:)[a-zA-Z0-9_./-]+$" });
const hash = Type.String({ pattern: "^[a-f0-9]{64}$" });

export const PUBLIC_MARKER_CATEGORY_VALUES = [
  "enemy",
  "boss",
  "neutral",
  "ally",
  "npc",
  "merchant",
  "questGiver",
  "interactiveObject",
  "craftingStation",
  "resource",
  "container",
  "travelPoint",
  "town",
  "fort",
  "camp",
  "dungeonEntrance",
  "challengeStone",
] as const;
export type PublicMarkerCategory = typeof PUBLIC_MARKER_CATEGORY_VALUES[number];
const publicMarkerCategory = Type.Union([
  Type.Literal("enemy"), Type.Literal("boss"), Type.Literal("neutral"), Type.Literal("ally"), Type.Literal("npc"),
  Type.Literal("merchant"), Type.Literal("questGiver"), Type.Literal("interactiveObject"),
  Type.Literal("craftingStation"), Type.Literal("resource"), Type.Literal("container"), Type.Literal("travelPoint"),
  Type.Literal("town"), Type.Literal("fort"), Type.Literal("camp"), Type.Literal("dungeonEntrance"), Type.Literal("challengeStone"),
]);

export const PublicLevelRangeSchema = Type.Object({
  min: count,
  max: count,
}, { additionalProperties: false });
export type PublicLevelRange = Static<typeof PublicLevelRangeSchema>;

export const PublicAffineSchema = Type.Object({ origin: point, xAxis: point, yAxis: point }, { additionalProperties: false });
export type PublicAffine = Static<typeof PublicAffineSchema>;

export const PublicDetailRowSchema = Type.Object({
  label: text,
  value: Type.String(),
  entityKey: Type.Optional(text),
  placementIds: Type.Optional(Type.Array(text, { uniqueItems: true })),
}, { additionalProperties: false });
export type PublicDetailRow = Static<typeof PublicDetailRowSchema>;

export const PublicDetailSectionSchema = Type.Object({ title: text, rows: Type.Array(PublicDetailRowSchema) }, { additionalProperties: false });
export type PublicDetailSection = Static<typeof PublicDetailSectionSchema>;
const sections = Type.Array(PublicDetailSectionSchema);

export const PublicEntitySchema = Type.Object({
  entityKey: text, kind: text, nativeId: Type.Integer(), name: text,
  description: Type.Union([Type.String(), Type.Null()]),
  placementIds: Type.Array(text, { uniqueItems: true }), sections,
}, { additionalProperties: false });
export type PublicEntity = Static<typeof PublicEntitySchema>;

const publicTravelDestinationStatus = Type.Union([Type.Literal("resolved"), Type.Literal("unresolved")]);
export const PublicTravelDestinationSchema = Type.Object({
  status: publicTravelDestinationStatus,
  reason: Type.Optional(text),
  mapSpaceId: Type.Optional(text),
  placementId: Type.Optional(text),
  position: Type.Optional(position),
}, { additionalProperties: false });
export type PublicTravelDestination = Static<typeof PublicTravelDestinationSchema>;

export const PublicTravelSchema = Type.Object({
  transitionId: text,
  enabled: Type.Boolean(),
  destination: PublicTravelDestinationSchema,
}, { additionalProperties: false });
export type PublicTravel = Static<typeof PublicTravelSchema>;

export const PublicPlacementSchema = Type.Object({
  placementId: text, mapSpaceId: text, position, height: number, label: text,
  categories: Type.Array(publicMarkerCategory, { minItems: 1, uniqueItems: true }),
  levelRange: Type.Optional(PublicLevelRangeSchema),
  entityKeys: Type.Array(text, { uniqueItems: true }),
  itemKeys: Type.Array(text, { uniqueItems: true }),
  searchText: text,
  areas: Type.Array(Type.Array(position, { minItems: 3 })),
  travel: Type.Optional(PublicTravelSchema),
}, { additionalProperties: false });
export type PublicPlacement = Static<typeof PublicPlacementSchema>;

const publicRegionShape = Type.Union([Type.Literal("box"), Type.Literal("sphere")]);
export const PublicRegionSchema = Type.Object({
  id: text,
  mapSpaceId: text,
  name: text,
  shape: publicRegionShape,
  polygon: Type.Array(position, { minItems: 3 }),
}, { additionalProperties: false });
export type PublicRegion = Static<typeof PublicRegionSchema>;

export const PublicEntitySummarySchema = Type.Object({
  entityKey: text, kind: text, nativeId: Type.Integer(), name: text,
  description: Type.Union([Type.String(), Type.Null()]),
  detailPath: url,
}, { additionalProperties: false });
export type PublicEntitySummary = Static<typeof PublicEntitySummarySchema>;

export const PublicItemSummarySchema = Type.Object({
  itemKey: text, name: text,
  sourceNames: Type.Array(text, { uniqueItems: true }), sourceKinds: Type.Array(text, { uniqueItems: true }),
  detailPath: url,
}, { additionalProperties: false });
export type PublicItemSummary = Static<typeof PublicItemSummarySchema>;

export const PublicWorldOffsetSchema = Type.Object({
  mapSpaceId: text,
  worldX: number,
  worldY: number,
  source: Type.Union([Type.Literal("native"), Type.Literal("reviewed"), Type.Literal("seed")]),
  status: Type.Union([Type.Literal("placed"), Type.Literal("unplaced")]),
  reason: Type.Optional(text),
}, { additionalProperties: false });
export type PublicWorldOffset = Static<typeof PublicWorldOffsetSchema>;

export const PublicWorldSchema = Type.Object({
  mapSpaceId: text,
  label: text,
  bounds: Type.Object({ min: point, max: point }, { additionalProperties: false }),
  offsets: Type.Array(PublicWorldOffsetSchema, { minItems: 1 }),
  unplacedMapSpaceIds: Type.Array(text, { uniqueItems: true }),
}, { additionalProperties: false });
export type PublicWorld = Static<typeof PublicWorldSchema>;

export const PublicItemSourceSchema = Type.Object({
  itemKey: text,
  sections,
  sources: Type.Array(Type.Object({ label: text, kind: text, placementIds: Type.Array(text, { uniqueItems: true }), sections }, { additionalProperties: false })),
}, { additionalProperties: false });
export type PublicItemSource = Static<typeof PublicItemSourceSchema>;

export const PublicTileSchema = Type.Object({
  z: Type.Integer(), x: Type.Integer(), y: Type.Integer(),
  url, sha256: hash, bytes: count,
  width: Type.Integer({ minimum: 1 }), height: Type.Integer({ minimum: 1 }),
  state: Type.Union([Type.Literal("captured"), Type.Literal("empty"), Type.Literal("partial")]),
}, { additionalProperties: false });
export type PublicTile = Static<typeof PublicTileSchema>;

// A map's imagery is one or more pyramids on the world lattice. `captured` is rendered by this
// project from the game build; `game-map` is the texture the game itself draws for that zone,
// registered through the zone's own world-to-map conversion.
export const PublicTileLayerSchema = Type.Object({
  id: text, mapSpaceId: text, label: text,
  kind: Type.Union([Type.Literal("captured"), Type.Literal("game-map")]),
  tileSize: Type.Literal(256), minZoom: Type.Integer(), maxZoom: Type.Integer(),
  extent: Type.Tuple([number, number, number, number]),
  tiles: Type.Array(PublicTileSchema, { minItems: 1 }),
}, { additionalProperties: false });
export type PublicTileLayer = Static<typeof PublicTileLayerSchema>;



const guidePlacementIds = Type.Array(text, { uniqueItems: true });
const guideDescription = Type.Optional(Type.String({ minLength: 1 }));

export const PublicGuideLootSchema = Type.Object({
  itemKey: text,
  label: Type.Optional(text),
  minimum: Type.Optional(count),
  maximum: Type.Optional(count),
  chance: Type.Optional(Type.Number({ minimum: 0, maximum: 100 })),
}, { additionalProperties: false });
export type PublicGuideLoot = Static<typeof PublicGuideLootSchema>;

export const PublicGuideAbilityPhaseSchema = Type.Object({
  phaseIndex: count,
  label: text,
  requirement: Type.Optional(Type.String({ minLength: 1 })),
  abilityIds: Type.Array(count, { uniqueItems: true }),
}, { additionalProperties: false });
export type PublicGuideAbilityPhase = Static<typeof PublicGuideAbilityPhaseSchema>;

export const PublicGuideStatSchema = Type.Object({ statId: count, label: text, value: Type.Number(), isPercent: Type.Optional(Type.Boolean()) }, { additionalProperties: false });
export type PublicGuideStat = Static<typeof PublicGuideStatSchema>;

export const PublicGuideBossSchema = Type.Object({
  bossKey: text,
  label: text,
  level: Type.Optional(count),
  levelRange: Type.Optional(PublicLevelRangeSchema),
  placementIds: guidePlacementIds,
  dungeonKeys: Type.Optional(guidePlacementIds),
  abilities: Type.Optional(Type.Array(PublicGuideAbilityPhaseSchema)),
  stats: Type.Optional(Type.Array(PublicGuideStatSchema)),
  loot: Type.Array(PublicGuideLootSchema),
  lootCount: Type.Optional(count),
}, { additionalProperties: false });
export type PublicGuideBoss = Static<typeof PublicGuideBossSchema>;

export const PublicGuideBossSummarySchema = Type.Object({
  bossKey: text,
  label: text,
  level: Type.Optional(count),
  levelRange: Type.Optional(PublicLevelRangeSchema),
  placementIds: guidePlacementIds,
  dungeonKeys: Type.Optional(guidePlacementIds),
  lootCount: count,
}, { additionalProperties: false });
export type PublicGuideBossSummary = Static<typeof PublicGuideBossSummarySchema>;

export const PublicGuideDungeonSchema = Type.Object({
  dungeonKey: text,
  label: text,
  description: guideDescription,
  levelRange: Type.Optional(PublicLevelRangeSchema),
  placementIds: guidePlacementIds,
  bosses: Type.Array(PublicGuideBossSchema),
}, { additionalProperties: false });
export type PublicGuideDungeon = Static<typeof PublicGuideDungeonSchema>;

export const PublicGuideDungeonSummarySchema = Type.Object({
  dungeonKey: text,
  label: text,
  description: guideDescription,
  levelRange: Type.Optional(PublicLevelRangeSchema),
  placementIds: guidePlacementIds,
  bosses: Type.Array(PublicGuideBossSummarySchema),
}, { additionalProperties: false });
export type PublicGuideDungeonSummary = Static<typeof PublicGuideDungeonSummarySchema>;

export const PublicGuideRegionSchema = Type.Object({
  regionKey: text,
  label: text,
  description: guideDescription,
  levelRange: Type.Optional(PublicLevelRangeSchema),
  placementIds: guidePlacementIds,
}, { additionalProperties: false });
export type PublicGuideRegion = Static<typeof PublicGuideRegionSchema>;

export const PublicGuidePropertySchema = Type.Object({
  propertyKey: text,
  label: text,
  description: guideDescription,
  income: Type.Optional(Type.Number()),
  placementIds: guidePlacementIds,
}, { additionalProperties: false });
export type PublicGuideProperty = Static<typeof PublicGuidePropertySchema>;

export const PublicAdventureGuideSchema = Type.Object({
  dungeons: Type.Array(PublicGuideDungeonSchema),
  bosses: Type.Array(PublicGuideBossSchema),
  regions: Type.Array(PublicGuideRegionSchema),
  properties: Type.Array(PublicGuidePropertySchema),
}, { additionalProperties: false });
export type PublicAdventureGuide = Static<typeof PublicAdventureGuideSchema>;

export const PublicAdventureGuideSummarySchema = Type.Object({
  dungeons: Type.Array(PublicGuideDungeonSummarySchema),
  bosses: Type.Array(PublicGuideBossSummarySchema),
  regions: Type.Array(PublicGuideRegionSchema),
  properties: Type.Array(PublicGuidePropertySchema),
}, { additionalProperties: false });
export type PublicAdventureGuideSummary = Static<typeof PublicAdventureGuideSummarySchema>;

const publicMapSchema = Type.Object({
  mapSpaceId: text, label: text,
  levelRange: Type.Optional(PublicLevelRangeSchema),
  bounds: Type.Object({ min: point, max: point }, { additionalProperties: false }),
}, { additionalProperties: false });

export const PUBLICATION_SCHEMA_VERSION = "compendium.publication.v12";

export const PublicationDataSchema = Type.Object({
  schemaVersion: Type.Literal(PUBLICATION_SCHEMA_VERSION), buildId: text,
  mode: Type.Union([Type.Literal("preview"), Type.Literal("release")]),
  coverage: Type.Object({ complete: Type.Boolean(), messages: Type.Array(text), excludedPlacements: count }, { additionalProperties: false }),
  world: PublicWorldSchema,
  maps: Type.Array(publicMapSchema, { minItems: 1 }),
  placements: Type.Array(PublicPlacementSchema),
  regions: Type.Array(PublicRegionSchema),
  entityIndex: Type.Array(PublicEntitySummarySchema), itemIndex: Type.Array(PublicItemSummarySchema),
  tileLayers: Type.Array(PublicTileLayerSchema, { minItems: 1 }),
}, { additionalProperties: false });
export type PublicationData = Static<typeof PublicationDataSchema>;

export const EntityDetailsDocumentSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.publication-entity-details.v1"), buildId: text,
  entities: Type.Array(PublicEntitySchema),
}, { additionalProperties: false });
export type EntityDetailsDocument = Static<typeof EntityDetailsDocumentSchema>;

export const ItemSourcesDocumentSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.publication-item-sources.v1"), buildId: text,
  itemSources: Type.Array(PublicItemSourceSchema),
}, { additionalProperties: false });
export type ItemSourcesDocument = Static<typeof ItemSourcesDocumentSchema>;
