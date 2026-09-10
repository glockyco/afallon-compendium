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
] as const;
export type PublicMarkerCategory = typeof PUBLIC_MARKER_CATEGORY_VALUES[number];
const publicMarkerCategory = Type.Union([
  Type.Literal("enemy"), Type.Literal("boss"), Type.Literal("neutral"), Type.Literal("ally"), Type.Literal("npc"),
  Type.Literal("merchant"), Type.Literal("questGiver"), Type.Literal("interactiveObject"),
  Type.Literal("craftingStation"), Type.Literal("resource"), Type.Literal("container"), Type.Literal("travelPoint"),
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

export const PublicPlacementSchema = Type.Object({
  placementId: text, mapSpaceId: text, position, label: text,
  categories: Type.Array(publicMarkerCategory, { minItems: 1, uniqueItems: true }),
  levelRange: Type.Optional(PublicLevelRangeSchema),
  entityKeys: Type.Array(text, { uniqueItems: true }),
  areas: Type.Array(Type.Array(position, { minItems: 3 })), sections,
}, { additionalProperties: false });
export type PublicPlacement = Static<typeof PublicPlacementSchema>;

export const PublicItemSourceSchema = Type.Object({
  itemKey: text,
  sources: Type.Array(Type.Object({ label: text, kind: text, placementIds: Type.Array(text, { uniqueItems: true }), sections }, { additionalProperties: false })),
}, { additionalProperties: false });
export type PublicItemSource = Static<typeof PublicItemSourceSchema>;

export const PublicTileSchema = Type.Object({
  z: count, x: count, y: count,
  width: Type.Integer({ minimum: 1 }), height: Type.Integer({ minimum: 1 }),
  url, sha256: hash, bytes: count, mapFromPixelEdge: PublicAffineSchema,
  state: Type.Union([Type.Literal("captured"), Type.Literal("empty"), Type.Literal("partial")]),
}, { additionalProperties: false });
export type PublicTile = Static<typeof PublicTileSchema>;

export const PublicTileLayerSchema = Type.Object({
  id: text, mapSpaceId: text,
  tileSize: Type.Integer({ minimum: 1 }), finestLevel: count,
  width: Type.Integer({ minimum: 1 }), height: Type.Integer({ minimum: 1 }),
  mapFromPixelEdge: PublicAffineSchema, tiles: Type.Array(PublicTileSchema, { minItems: 1 }),
}, { additionalProperties: false });
export type PublicTileLayer = Static<typeof PublicTileLayerSchema>;

export const PublicIllustrationSchema = Type.Object({
  id: text, label: text, mapSpaceId: text,
  registration: Type.Union([Type.Literal("calibrated"), Type.Literal("orientation-only")]),
  url, width: Type.Integer({ minimum: 1 }), height: Type.Integer({ minimum: 1 }),
  mapFromPixelEdge: Type.Union([PublicAffineSchema, Type.Null()]),
}, { additionalProperties: false });
export type PublicIllustration = Static<typeof PublicIllustrationSchema>;

export const PublicationDataSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.publication.v3"), buildId: text,
  mode: Type.Union([Type.Literal("preview"), Type.Literal("release")]),
  coverage: Type.Object({ complete: Type.Boolean(), messages: Type.Array(text), excludedPlacements: count }, { additionalProperties: false }),
  maps: Type.Array(Type.Object({
    mapSpaceId: text, label: text,
    levelRange: Type.Optional(PublicLevelRangeSchema),
    bounds: Type.Object({ min: point, max: point }, { additionalProperties: false }),
  }, { additionalProperties: false }), { minItems: 1 }),
  placements: Type.Array(PublicPlacementSchema), entities: Type.Array(PublicEntitySchema),
  itemSources: Type.Array(PublicItemSourceSchema), tileLayers: Type.Array(PublicTileLayerSchema, { minItems: 1 }),
  illustrations: Type.Array(PublicIllustrationSchema),
}, { additionalProperties: false });
export type PublicationData = Static<typeof PublicationDataSchema>;
