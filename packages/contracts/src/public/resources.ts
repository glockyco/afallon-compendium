import { Type, type Static } from "typebox";
import { schemaRegistry } from "../schema-registry";
import { ContentIdentitySchema } from "../lifecycle";
import { PublicKindEntrySchema, STATIC_COMPENDIUM_SCHEMAS, artEdges, isStaticDocument, type StaticCompendiumResource } from "./documents";
import { count, hash, number, point, position, publicMarkerCategory, resourceReference, text, url, PublicLevelRangeSchema, StaticResourceIdentityFields, StaticResourceReferenceSchema, PUBLIC_MARKER_CATEGORY_LABELS, type StaticResourceReference } from "./primitives";
export { PUBLIC_MARKER_CATEGORY_VALUES, PUBLIC_MARKER_CATEGORY_LABELS, publicMarkerCategory, PublicLevelRangeSchema, StaticResourceReferenceSchema, resourceReference, type PublicMarkerCategory, type PublicLevelRange, type StaticResourceReference } from "./primitives";

export const PublicAffineSchema = Type.Object({ origin: point, xAxis: point, yAxis: point }, { additionalProperties: false });
export type PublicAffine = Static<typeof PublicAffineSchema>;

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
  travelEnabled: Type.Optional(Type.Boolean()),
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

const publicMapSchema = Type.Object({
  mapSpaceId: text, label: text,
  levelRange: Type.Optional(PublicLevelRangeSchema),
  bounds: Type.Object({ min: point, max: point }, { additionalProperties: false }),
}, { additionalProperties: false });

export const PUBLICATION_SCHEMA_VERSION = "compendium.publication.v14";

export const PublicationDataSchema = Type.Object({
  schemaVersion: Type.Literal(PUBLICATION_SCHEMA_VERSION), buildId: text,
  mode: Type.Union([Type.Literal("preview"), Type.Literal("release")]),
  coverage: Type.Object({ complete: Type.Boolean(), messages: Type.Array(text), excludedPlacements: count }, { additionalProperties: false }),
  world: PublicWorldSchema,
  maps: Type.Array(publicMapSchema, { minItems: 1 }),
  placements: Type.Array(PublicPlacementSchema),
  regions: Type.Array(PublicRegionSchema),
  tileLayers: Type.Array(PublicTileLayerSchema, { minItems: 1 }),
}, { additionalProperties: false });
export type PublicationData = Static<typeof PublicationDataSchema>;

export const StaticMapSummarySchema = Type.Object({
  mapSpaceId: text,
  label: text,
  bounds: Type.Object({ min: point, max: point }, { additionalProperties: false }),
  parts: Type.Array(resourceReference("compendium.static-map.v2"), { minItems: 1 }),
  optionalGeometry: Type.Array(resourceReference("compendium.static-geometry.v1")),
  imagery: resourceReference("compendium.static-imagery.v2"),
}, { additionalProperties: false });
export type StaticMapSummary = Static<typeof StaticMapSummarySchema>;

export const StaticRootManifestSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.static-root.v3"),
  ...StaticResourceIdentityFields,
  mode: Type.Union([Type.Literal("preview"), Type.Literal("release")]),
  complete: Type.Boolean(),
  world: PublicWorldSchema,
  maps: Type.Array(StaticMapSummarySchema),
  kinds: Type.Array(PublicKindEntrySchema, { minItems: 1 }),
  lists: Type.Record(Type.String({ pattern: "^[a-z][A-Za-z]*$" }), resourceReference("compendium.static-kind-list.v1")),
  search: Type.Array(resourceReference("compendium.static-search.v3"), { minItems: 1 }),
  pages: resourceReference("compendium.static-pages.v1"),
  coverage: resourceReference("compendium.static-coverage.v1"),
}, { additionalProperties: false });
export type StaticRootManifest = Static<typeof StaticRootManifestSchema>;

export const PublicEssentialPlacementSchema = Type.Tuple([
  text, position, number, text,
  Type.Array(publicMarkerCategory, { minItems: 1, uniqueItems: true }),
  Type.Array(text, { uniqueItems: true }), Type.Array(text, { uniqueItems: true }),
  Type.Union([PublicLevelRangeSchema, Type.Null()]),
  Type.Union([Type.Boolean(), Type.Null()]),
  Type.Union([Type.Number({ exclusiveMinimum: 0 }), Type.Null()]),
]);
export type PublicEssentialPlacement = Static<typeof PublicEssentialPlacementSchema>;

export function expandEssentialPlacement(value: PublicEssentialPlacement, mapSpaceId: string): PublicPlacement {
  const [placementId, position, height, label, categories, entityKeys, itemKeys, levelRange, travelEnabled, areaRadius] = value;
  const areas: PublicPlacement["areas"] = areaRadius === null ? [] : [Array.from({ length: 48 }, (_, index) => {
    const angle = index * Math.PI * 2 / 48;
    return [position[0] + areaRadius * Math.cos(angle), position[1] + areaRadius * Math.sin(angle)];
  })];
  return { placementId, mapSpaceId, position, height, label, categories, entityKeys, itemKeys,
    ...(levelRange === null ? {} : { levelRange }), ...(travelEnabled === null ? {} : { travelEnabled }), searchText: [label, ...categories.map((category) => PUBLIC_MARKER_CATEGORY_LABELS[category])].join(" "), areas, movement: [] };
}

export const StaticMapShardSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.static-map.v2"),
  ...StaticResourceIdentityFields,
  mapSpaceId: text,
  part: count,
  placements: Type.Array(PublicEssentialPlacementSchema),
  regions: Type.Array(PublicRegionSchema),
}, { additionalProperties: false });
export type StaticMapShard = Static<typeof StaticMapShardSchema>;

export const StaticGeometrySchema = Type.Object({
  schemaVersion: Type.Literal("compendium.static-geometry.v1"),
  ...StaticResourceIdentityFields,
  mapSpaceId: text,
  part: count,
  placements: Type.Array(Type.Object({
    placementId: text,
    movement: PublicPlacementSchema.properties.movement,
    travel: PublicPlacementSchema.properties.travel,
  }, { additionalProperties: false })),
  connections: Type.Array(Type.Object({
    transitionId: text,
    sourcePlacementId: Type.Union([text, Type.Null()]),
    destinationMapSpaceId: Type.Union([text, Type.Null()]),
    kind: text,
  }, { additionalProperties: false })),
}, { additionalProperties: false });
export type StaticGeometry = Static<typeof StaticGeometrySchema>;

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
  schemaVersion: Type.Literal("compendium.static-imagery.v2"),
  ...StaticResourceIdentityFields,
  mapSpaceId: text,
  defaultLayerId: text,
  layers: Type.Array(Type.Object({
    ...PublicTileLayerSchema.properties,
    tiles: Type.Array(Type.Object({ ...PublicTileSchema.properties, schemaId: Type.Literal("image/webp") }, { additionalProperties: false }), { minItems: 1 }),
  }, { additionalProperties: false }), { minItems: 1 }),
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

export const PublicationPlanSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.publish-plan.v2"),
  buildId: text,
  catalog: Type.Object({ manifest: ContentIdentitySchema, object: ContentIdentitySchema, catalogId: hash }, { additionalProperties: false }),
  mode: Type.Union([Type.Literal("preview"), Type.Literal("release")]),
  presentation: ContentIdentitySchema,
}, { additionalProperties: false });
export type PublicationPlan = Static<typeof PublicationPlanSchema>;

export const PublicationPresentationSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.publication-presentation.v1"),
  ...StaticResourceIdentityFields,
  worldOffsets: Type.Array(PublicWorldOffsetSchema, { minItems: 1 }),
  spatialBounds: Type.Array(Type.Object({ mapSpaceId: text, minX: number, minY: number, maxX: number, maxY: number }, { additionalProperties: false }), { minItems: 1 }),
  capturedMapSpaceIds: Type.Array(text, { maxItems: 1, uniqueItems: true }),
}, { additionalProperties: false });
export type PublicationPresentation = Static<typeof PublicationPresentationSchema>;

schemaRegistry.register("compendium.publish-plan.v2", PublicationPlanSchema);
schemaRegistry.register("compendium.publication-presentation.v1", PublicationPresentationSchema);

export const STATIC_RESOURCE_SCHEMAS = {
  "compendium.static-root.v3": StaticRootManifestSchema,
  "compendium.static-map.v2": StaticMapShardSchema,
  "compendium.static-geometry.v1": StaticGeometrySchema,
  "compendium.static-coverage.v1": StaticCoverageSchema,
  "compendium.static-imagery.v2": StaticImagerySchema,
  ...STATIC_COMPENDIUM_SCHEMAS,
} as const;
export type StaticResource = StaticRootManifest | StaticMapShard | StaticGeometry | StaticCoverage | StaticImagery | StaticCompendiumResource;

export function staticResourceSchema(schemaId: string) {
  if (!Object.hasOwn(STATIC_RESOURCE_SCHEMAS, schemaId)) throw new Error(`Unknown static resource schema: ${schemaId}.`);
  return STATIC_RESOURCE_SCHEMAS[schemaId as keyof typeof STATIC_RESOURCE_SCHEMAS];
}

export function staticResourceEdges(value: StaticResource): StaticResourceReference[] {
  switch (value.schemaVersion) {
    case "compendium.static-root.v3": return [...value.maps.flatMap((map) => [...map.parts, ...map.optionalGeometry, map.imagery]), ...Object.values(value.lists), ...value.search, value.pages, value.coverage];
    case "compendium.static-pages.v1": return value.entries.map((entry) => entry.document);
    case "compendium.static-search.v3": return value.entries.flatMap((entry) => entry.document ? [entry.document] : []);
    case "compendium.static-kind-list.v1": return value.rows.flatMap((row) => row.ref.icon ? [{ path: row.ref.icon.url, sha256: row.ref.icon.sha256, bytes: row.ref.icon.bytes, schemaId: "image/webp" }] : []);
    case "compendium.static-imagery.v2": return value.layers.flatMap((layer) => layer.tiles.map((tile) => ({ path: tile.url, sha256: tile.sha256, bytes: tile.bytes, schemaId: tile.schemaId })));
    case "compendium.static-map.v2":
    case "compendium.static-geometry.v1":
    case "compendium.static-coverage.v1": return [];
    default:
      if (isStaticDocument(value)) return artEdges(value.document).map((art) => ({ path: art.url, sha256: art.sha256, bytes: art.bytes, schemaId: "image/webp" }));
      throw new Error("Unknown static resource kind.");
  }
}

for (const [schemaId, schema] of Object.entries(STATIC_RESOURCE_SCHEMAS)) schemaRegistry.register(schemaId, schema);
schemaRegistry.register("compendium.public-level-range.v1", PublicLevelRangeSchema);
schemaRegistry.register("compendium.public-affine.v1", PublicAffineSchema);
schemaRegistry.register("compendium.public-travel-destination.v1", PublicTravelDestinationSchema);
schemaRegistry.register("compendium.public-travel.v1", PublicTravelSchema);
schemaRegistry.register("compendium.public-patrol-path.v1", PublicPatrolPathSchema);
schemaRegistry.register("compendium.public-movement-owner.v1", PublicMovementOwnerSchema);
schemaRegistry.register("compendium.public-roaming-movement.v1", PublicRoamingMovementSchema);
schemaRegistry.register("compendium.public-patrol-movement.v1", PublicPatrolMovementSchema);
schemaRegistry.register("compendium.public-movement.v1", PublicMovementSchema);
schemaRegistry.register("compendium.public-placement.v1", PublicPlacementSchema);
schemaRegistry.register("compendium.public-region.v1", PublicRegionSchema);
schemaRegistry.register("compendium.public-world-offset.v1", PublicWorldOffsetSchema);
schemaRegistry.register("compendium.public-world.v1", PublicWorldSchema);
schemaRegistry.register("compendium.public-tile.v1", PublicTileSchema);
schemaRegistry.register("compendium.public-tile-layer.v1", PublicTileLayerSchema);
schemaRegistry.register(PUBLICATION_SCHEMA_VERSION, PublicationDataSchema);
