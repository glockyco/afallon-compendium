import { Type, type Static } from "typebox";
import { schemaRegistry } from "../schema-registry";

const text = Type.String({ minLength: 1 });
const number = Type.Number();
const count = Type.Integer({ minimum: 0 });
const point = Type.Object({ x: number, y: number }, { additionalProperties: false });
const position = Type.Tuple([number, number]);
const url = Type.String({ minLength: 1, pattern: "^(?!/)(?!.*\\.\\.)(?!.*:)[a-zA-Z0-9_./-]+$" });
const hash = Type.String({ pattern: "^[a-f0-9]{64}$" });

export const PUBLIC_MARKER_CATEGORY_VALUES = [
  "boss",
  "enemy",
  "neutral",
  "merchant",
  "questGiver",
  "townsfolk",
  "corruptionAltar",
  "challengeStone",
  "craftingStation",
  "container",
  "oreVein",
  "herb",
  "mushroom",
  "fishingSpot",
  "interactiveObject",
  "town",
  "fort",
  "camp",
  "property",
  "dungeonEntrance",
  "graveyard",
  "travelPoint",
] as const;
export type PublicMarkerCategory = typeof PUBLIC_MARKER_CATEGORY_VALUES[number];
const publicMarkerCategory = Type.Union([
  Type.Literal("boss"),
  Type.Literal("enemy"),
  Type.Literal("neutral"),
  Type.Literal("merchant"),
  Type.Literal("questGiver"),
  Type.Literal("townsfolk"),
  Type.Literal("corruptionAltar"),
  Type.Literal("challengeStone"),
  Type.Literal("craftingStation"),
  Type.Literal("container"),
  Type.Literal("oreVein"),
  Type.Literal("herb"),
  Type.Literal("mushroom"),
  Type.Literal("fishingSpot"),
  Type.Literal("interactiveObject"),
  Type.Literal("town"),
  Type.Literal("fort"),
  Type.Literal("camp"),
  Type.Literal("property"),
  Type.Literal("dungeonEntrance"),
  Type.Literal("graveyard"),
  Type.Literal("travelPoint"),
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

const publicPatrolPathStatus = Type.Union([Type.Literal("resolved"), Type.Literal("unresolved")]);
export const PublicPatrolPathSchema = Type.Object({
  name: text,
  status: publicPatrolPathStatus,
  reason: Type.Optional(text),
  looping: Type.Optional(Type.Boolean()),
  groupPatrol: Type.Optional(Type.Boolean()),
  groupSpacing: Type.Optional(number),
  poiRadius: Type.Optional(number),
  points: Type.Optional(Type.Array(position, { minItems: 1 })),
}, { additionalProperties: false });
export type PublicPatrolPath = Static<typeof PublicPatrolPathSchema>;

export const PublicMovementOwnerSchema = Type.Union([
  Type.Object({
    kind: Type.Literal("npcBehavior"),
    entityKey: text,
    phaseIndex: count,
    behaviorIndex: count,
    chance: number,
  }, { additionalProperties: false }),
  Type.Object({ kind: Type.Literal("spawnerOverride") }, { additionalProperties: false }),
]);
export type PublicMovementOwner = Static<typeof PublicMovementOwnerSchema>;

const publicMovementBase = { owner: PublicMovementOwnerSchema };
export const PublicRoamingMovementSchema = Type.Object({
  ...publicMovementBase,
  kind: Type.Literal("roaming"),
  distance: number,
  aroundSpawner: Type.Boolean(),
  usePois: Type.Boolean(),
  poiPathName: Type.Optional(text),
  poiPath: Type.Optional(PublicPatrolPathSchema),
  poiRoamRadius: Type.Optional(number),
}, { additionalProperties: false });
export type PublicRoamingMovement = Static<typeof PublicRoamingMovementSchema>;

export const PublicPatrolMovementSchema = Type.Object({
  ...publicMovementBase,
  kind: Type.Literal("patrol"),
  randomPath: Type.Boolean(),
  paths: Type.Array(PublicPatrolPathSchema, { minItems: 1 }),
}, { additionalProperties: false });
export type PublicPatrolMovement = Static<typeof PublicPatrolMovementSchema>;

export const PublicMovementSchema = Type.Union([PublicRoamingMovementSchema, PublicPatrolMovementSchema]);
export type PublicMovement = Static<typeof PublicMovementSchema>;

export const PublicPlacementSchema = Type.Object({
  placementId: text, mapSpaceId: text, position, height: number, label: text,
  categories: Type.Array(publicMarkerCategory, { minItems: 1, uniqueItems: true }),
  levelRange: Type.Optional(PublicLevelRangeSchema),
  entityKeys: Type.Array(text, { uniqueItems: true }),
  itemKeys: Type.Array(text, { uniqueItems: true }),
  searchText: text,
  areas: Type.Array(Type.Array(position, { minItems: 3 })),
  movement: Type.Array(PublicMovementSchema),
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

export const PUBLICATION_SCHEMA_VERSION = "compendium.publication.v13";

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

export const GuideDocumentSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.adventure-guide.v1"),
  buildId: text,
  counts: Type.Object({
    dungeons: count,
    bosses: count,
    regions: count,
    properties: count,
  }, { additionalProperties: false }),
  guide: Type.Object({
    dungeons: Type.Array(Type.Union([PublicGuideDungeonSchema, PublicGuideDungeonSummarySchema])),
    bosses: Type.Array(Type.Union([PublicGuideBossSchema, PublicGuideBossSummarySchema])),
    regions: Type.Array(PublicGuideRegionSchema),
    properties: Type.Array(PublicGuidePropertySchema),
  }, { additionalProperties: false }),
  entities: Type.Array(PublicEntitySchema),
}, { additionalProperties: false });
export type GuideDocument = Static<typeof GuideDocumentSchema>;

const StaticResourceIdentityFields = {
  buildId: text,
  catalogId: hash,
};

export const StaticResourceReferenceSchema = Type.Object({
  path: url,
  sha256: hash,
  bytes: count,
  schemaId: text,
}, { additionalProperties: false });
export type StaticResourceReference = Static<typeof StaticResourceReferenceSchema>;

export const StaticMapSummarySchema = Type.Object({
  mapSpaceId: text,
  label: text,
  bounds: Type.Object({ min: point, max: point }, { additionalProperties: false }),
  data: StaticResourceReferenceSchema,
  imagery: StaticResourceReferenceSchema,
}, { additionalProperties: false });
export type StaticMapSummary = Static<typeof StaticMapSummarySchema>;

export const StaticGuideDocumentSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.static-guide.v1"),
  ...StaticResourceIdentityFields,
  counts: GuideDocumentSchema.properties.counts,
  guide: GuideDocumentSchema.properties.guide,
  entities: GuideDocumentSchema.properties.entities,
}, { additionalProperties: false });
export type StaticGuideDocument = Static<typeof StaticGuideDocumentSchema>;

export const StaticRootManifestSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.static-root.v1"),
  ...StaticResourceIdentityFields,
  mode: Type.Union([Type.Literal("preview"), Type.Literal("release")]),
  complete: Type.Boolean(),
  world: PublicWorldSchema,
  maps: Type.Array(StaticMapSummarySchema),
  entitySearch: StaticResourceReferenceSchema,
  itemSearch: StaticResourceReferenceSchema,
  guides: Type.Record(Type.String({ pattern: "^[A-Za-z0-9-]+$" }), StaticResourceReferenceSchema),
  coverage: StaticResourceReferenceSchema,
}, { additionalProperties: false });
export type StaticRootManifest = Static<typeof StaticRootManifestSchema>;

export const StaticMapShardSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.static-map.v1"),
  ...StaticResourceIdentityFields,
  mapSpaceId: text,
  placements: Type.Array(PublicPlacementSchema),
  regions: Type.Array(PublicRegionSchema),
  connections: Type.Array(Type.Object({
    transitionId: text,
    sourcePlacementId: Type.Union([text, Type.Null()]),
    destinationMapSpaceId: Type.Union([text, Type.Null()]),
    kind: text,
  }, { additionalProperties: false })),
}, { additionalProperties: false });
export type StaticMapShard = Static<typeof StaticMapShardSchema>;

export const StaticEntitySearchSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.static-entity-search.v1"),
  ...StaticResourceIdentityFields,
  entities: Type.Array(PublicEntitySummarySchema),
}, { additionalProperties: false });
export type StaticEntitySearch = Static<typeof StaticEntitySearchSchema>;

export const StaticItemSearchSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.static-item-search.v1"),
  ...StaticResourceIdentityFields,
  items: Type.Array(Type.Object({
    itemKey: text,
    name: text,
    sourceNames: Type.Array(text, { uniqueItems: true }),
    sourceKinds: Type.Array(text, { uniqueItems: true }),
    detailPath: url,
    sourcePath: url,
  }, { additionalProperties: false })),
}, { additionalProperties: false });
export type StaticItemSearch = Static<typeof StaticItemSearchSchema>;

export const StaticEntityDetailSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.static-entity-detail.v1"),
  ...StaticResourceIdentityFields,
  entity: PublicEntitySchema,
}, { additionalProperties: false });
export type StaticEntityDetail = Static<typeof StaticEntityDetailSchema>;

export const StaticItemSourceSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.static-item-source.v1"),
  ...StaticResourceIdentityFields,
  itemSource: PublicItemSourceSchema,
}, { additionalProperties: false });
export type StaticItemSource = Static<typeof StaticItemSourceSchema>;

export const StaticCoverageSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.static-coverage.v1"),
  ...StaticResourceIdentityFields,
  complete: Type.Boolean(),
  unresolvedIssueCount: count,
  occurrenceCount: count,
  exclusionCount: count,
  messages: Type.Array(text),
}, { additionalProperties: false });
export type StaticCoverage = Static<typeof StaticCoverageSchema>;

export const StaticImagerySchema = Type.Object({
  schemaVersion: Type.Literal("compendium.static-imagery.v1"),
  ...StaticResourceIdentityFields,
  mapSpaceId: text,
  defaultLayerId: text,
  layers: Type.Array(PublicTileLayerSchema, { minItems: 1 }),
}, { additionalProperties: false });
export type StaticImagery = Static<typeof StaticImagerySchema>;

export interface StaticIdentityContract {
  buildId: string;
  catalogId: string;
}

export function assertStaticResourceIdentity(expected: StaticIdentityContract, resource: StaticIdentityContract): void {
  if (resource.buildId !== expected.buildId) throw new Error(`Static resource build mismatch: expected ${expected.buildId}, received ${resource.buildId}.`);
  if (resource.catalogId !== expected.catalogId) throw new Error(`Static resource catalog mismatch: expected ${expected.catalogId}, received ${resource.catalogId}.`);
}

schemaRegistry.register("compendium.static-root.v1", StaticRootManifestSchema);
schemaRegistry.register("compendium.static-guide.v1", StaticGuideDocumentSchema);
schemaRegistry.register("compendium.static-map.v1", StaticMapShardSchema);
schemaRegistry.register("compendium.static-entity-search.v1", StaticEntitySearchSchema);
schemaRegistry.register("compendium.static-item-search.v1", StaticItemSearchSchema);
schemaRegistry.register("compendium.static-entity-detail.v1", StaticEntityDetailSchema);
schemaRegistry.register("compendium.static-item-source.v1", StaticItemSourceSchema);
schemaRegistry.register("compendium.static-coverage.v1", StaticCoverageSchema);
schemaRegistry.register("compendium.static-imagery.v1", StaticImagerySchema);
schemaRegistry.register("compendium.public-level-range.v1", PublicLevelRangeSchema);
schemaRegistry.register("compendium.public-affine.v1", PublicAffineSchema);
schemaRegistry.register("compendium.public-detail-row.v1", PublicDetailRowSchema);
schemaRegistry.register("compendium.public-detail-section.v1", PublicDetailSectionSchema);
schemaRegistry.register("compendium.public-entity.v1", PublicEntitySchema);
schemaRegistry.register("compendium.public-travel-destination.v1", PublicTravelDestinationSchema);
schemaRegistry.register("compendium.public-travel.v1", PublicTravelSchema);
schemaRegistry.register("compendium.public-patrol-path.v1", PublicPatrolPathSchema);
schemaRegistry.register("compendium.public-movement-owner.v1", PublicMovementOwnerSchema);
schemaRegistry.register("compendium.public-roaming-movement.v1", PublicRoamingMovementSchema);
schemaRegistry.register("compendium.public-patrol-movement.v1", PublicPatrolMovementSchema);
schemaRegistry.register("compendium.public-movement.v1", PublicMovementSchema);
schemaRegistry.register("compendium.public-placement.v1", PublicPlacementSchema);
schemaRegistry.register("compendium.public-region.v1", PublicRegionSchema);
schemaRegistry.register("compendium.public-entity-summary.v1", PublicEntitySummarySchema);
schemaRegistry.register("compendium.public-item-summary.v1", PublicItemSummarySchema);
schemaRegistry.register("compendium.public-world-offset.v1", PublicWorldOffsetSchema);
schemaRegistry.register("compendium.public-world.v1", PublicWorldSchema);
schemaRegistry.register("compendium.public-item-source.v1", PublicItemSourceSchema);
schemaRegistry.register("compendium.public-tile.v1", PublicTileSchema);
schemaRegistry.register("compendium.public-tile-layer.v1", PublicTileLayerSchema);
schemaRegistry.register("compendium.public-guide-loot.v1", PublicGuideLootSchema);
schemaRegistry.register("compendium.public-guide-ability-phase.v1", PublicGuideAbilityPhaseSchema);
schemaRegistry.register("compendium.public-guide-stat.v1", PublicGuideStatSchema);
schemaRegistry.register("compendium.public-guide-boss.v1", PublicGuideBossSchema);
schemaRegistry.register("compendium.public-guide-boss-summary.v1", PublicGuideBossSummarySchema);
schemaRegistry.register("compendium.public-guide-dungeon.v1", PublicGuideDungeonSchema);
schemaRegistry.register("compendium.public-guide-dungeon-summary.v1", PublicGuideDungeonSummarySchema);
schemaRegistry.register("compendium.public-guide-region.v1", PublicGuideRegionSchema);
schemaRegistry.register("compendium.public-guide-property.v1", PublicGuidePropertySchema);
schemaRegistry.register("compendium.public-adventure-guide.v1", PublicAdventureGuideSchema);
schemaRegistry.register("compendium.public-adventure-guide-summary.v1", PublicAdventureGuideSummarySchema);
schemaRegistry.register(PUBLICATION_SCHEMA_VERSION, PublicationDataSchema);
schemaRegistry.register("compendium.adventure-guide.v1", GuideDocumentSchema);
