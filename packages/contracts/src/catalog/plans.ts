import { Type, type Static } from "typebox";
import { ContentIdentitySchema } from "../lifecycle";
import { PublicTileLayerSchema } from "../public";
import { schemaRegistry } from "../schema-registry";

const text = Type.String({ minLength: 1 });

// `mechanicsRules` is the registered `compendium.mechanics-rules.v2` record of the build's verified calculation rules.
export const CatalogPlanSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.catalog-plan.v2"),
  buildId: text,
  scans: Type.Array(ContentIdentitySchema, { minItems: 1, uniqueItems: true }),
  canonicalTarget: Type.Object({ manifest: ContentIdentitySchema, targetIdentity: text }, { additionalProperties: false }),
  spatialProfile: ContentIdentitySchema,
  imagery: Type.Array(ContentIdentitySchema, { uniqueItems: true }),
  coverageReview: ContentIdentitySchema,
  mechanicsRules: ContentIdentitySchema,
}, { additionalProperties: false });
export type CatalogPlan = Static<typeof CatalogPlanSchema>;

export const CatalogImagerySchema = Type.Object({
  schemaVersion: Type.Literal("compendium.catalog-imagery.v1"),
  buildId: text,
  layer: PublicTileLayerSchema,
  inputs: Type.Array(ContentIdentitySchema, { minItems: 1, uniqueItems: true }),
  manifests: Type.Optional(Type.Array(ContentIdentitySchema, { uniqueItems: true })),
}, { additionalProperties: false });
export type CatalogImagery = Static<typeof CatalogImagerySchema>;

schemaRegistry.register("compendium.catalog-plan.v2", CatalogPlanSchema);
schemaRegistry.register("compendium.catalog-imagery.v1", CatalogImagerySchema);
