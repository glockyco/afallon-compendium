import { Type, type Static } from "typebox";

const text = Type.String({ minLength: 1 });
const id = Type.String({ pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" });
const integer = Type.Integer();
const count = Type.Integer({ minimum: 0 });
const positive = Type.Number({ exclusiveMinimum: 0 });
const relativePath = Type.String({ minLength: 1, pattern: "^(?!/)(?![A-Za-z]:)[^\\u0000-\\u001f\\u007f]+$" });
const hash = Type.String({ pattern: "^[a-f0-9]{64}$" });
const reference = Type.Object({ path: relativePath, sha256: hash });

export const TileReferenceSchema = reference;
export type TileReference = Static<typeof TileReferenceSchema>;

export const TilePlanSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.tile-plan.v2"),
  buildId: text,
  mapSpaceId: id,
  profile: TileReferenceSchema,
  sources: Type.Array(TileReferenceSchema, { minItems: 1, maxItems: 4096 }),
  tileSize: Type.Optional(Type.Integer({ minimum: 1, maximum: 2048 })),
  format: Type.Optional(Type.Literal("webp")),
});
export type TilePlan = Static<typeof TilePlanSchema>;

export const TileCoverageSchema = Type.Object({
  state: Type.Union([Type.Literal("captured"), Type.Literal("empty"), Type.Literal("partial"), Type.Literal("missing")]),
  coveredPixels: count,
  emptyPixels: count,
  missingPixels: count,
  sourceTileIds: Type.Array(text),
});
export type TileCoverage = Static<typeof TileCoverageSchema>;
export type TileBounds = { min: { x: number; y: number }; max: { x: number; y: number }; width: number; height: number };

export const TileFileSchema = Type.Object({
  z: integer,
  x: integer,
  y: integer,
  width: Type.Integer({ minimum: 1 }),
  height: Type.Integer({ minimum: 1 }),
  coverage: TileCoverageSchema,
  path: relativePath,
  bytes: count,
  sha256: hash,
  mediaType: Type.Literal("image/webp"),
});
export type TileFile = Static<typeof TileFileSchema>;

export const TileLevelSchema = Type.Object({
  z: integer,
  tiles: Type.Array(TileFileSchema),
});
export type TileLevel = Static<typeof TileLevelSchema>;

export const TileSourceProvenanceSchema = Type.Object({
  manifest: TileReferenceSchema,
  runId: text,
  captureSet: TileReferenceSchema,
  sceneNativeId: count,
  scenePath: text,
  mapSpaceId: id,
  completeImagery: Type.Literal(false),
  width: Type.Integer({ minimum: 1 }),
  height: Type.Integer({ minimum: 1 }),
  tiles: Type.Array(Type.Object({
    id: text,
    compatibilityKey: hash,
    status: Type.Union([Type.Literal("captured"), Type.Literal("reused")]),
    empty: Type.Boolean(),
    origin: Type.Object({ runId: text, ownerToken: text, captureKey: text }),
    verticalBounds: Type.Object({ minY: Type.Number(), maxY: Type.Number() }),
    image: TileReferenceSchema,
    raster: TileReferenceSchema,
    readiness: TileReferenceSchema,
    restoration: TileReferenceSchema,
    nativeContext: Type.Array(TileReferenceSchema, { minItems: 1 }),
  })),
});
export type TileSourceProvenance = Static<typeof TileSourceProvenanceSchema>;

export const TilePyramidSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.tile-pyramid.v3"),
  buildId: text,
  mapSpaceId: id,
  plan: TileReferenceSchema,
  profile: TileReferenceSchema,
  coordinateSystem: Type.Literal("map-space-xy"),
  pixelConvention: Type.Literal("top-left-edges"),
  extent: Type.Tuple([Type.Number(), Type.Number(), Type.Number(), Type.Number()]),
  minZoom: integer,
  maxZoom: integer,
  format: Type.Literal("webp-lossless"),
  tileSize: Type.Literal(256),
  levels: Type.Array(TileLevelSchema, { minItems: 1 }),
  sources: Type.Array(TileSourceProvenanceSchema, { minItems: 1 }),
  coverage: Type.Object({
    complete: Type.Boolean(),
    blocker: Type.Boolean(),
    reasons: Type.Array(text),
    missingPositions: Type.Array(Type.Object({ z: integer, x: integer, y: integer })),
    emptyPositions: Type.Array(Type.Object({ z: integer, x: integer, y: integer })),
    partialPositions: Type.Array(Type.Object({ z: integer, x: integer, y: integer })),
  }),
  totals: Type.Object({ files: count, bytes: count }),
});
export type TilePyramid = Static<typeof TilePyramidSchema>;
export interface TileGenerationResult {
  manifest: string;
  index: string;
  files: number;
  bytes: number;
  complete: boolean;
}
