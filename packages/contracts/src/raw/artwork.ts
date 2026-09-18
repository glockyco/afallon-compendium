import { Type, type Static } from "typebox";

const integer = Type.Integer();
const text = Type.String();
const hash = Type.String({ pattern: "^[a-f0-9]{64}$" });

// One sprite read from the running game. `image` names the PNG the collector wrote beside its
// JSON; the scan host registers those bytes as evidence objects under `artwork/<sha256>.png`.
export const ArtworkRecordSchema = Type.Object({
  family: text,
  nativeId: integer,
  role: Type.Union([Type.Literal("icon"), Type.Literal("portrait"), Type.Literal("artwork")]),
  sourceName: text,
  sourceFieldPath: text,
  status: Type.Union([Type.Literal("extracted"), Type.Literal("unsupported"), Type.Literal("missing")]),
  reason: Type.Union([text, Type.Null()]),
  image: Type.Union([Type.Null(), Type.Object({ sha256: hash, bytes: integer, width: integer, height: integer, file: text })]),
});
export type ArtworkRecord = Static<typeof ArtworkRecordSchema>;

export const ArtworkSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.artwork.v1"),
  frame: integer,
  totals: Type.Object({ extracted: integer, unsupported: integer, missing: integer, families: Type.Record(text, integer) }),
  records: Type.Array(ArtworkRecordSchema),
});
export type Artwork = Static<typeof ArtworkSchema>;
