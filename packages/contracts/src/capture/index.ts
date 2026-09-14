import { schemaRegistry } from "../schema-registry";
import {
  CaptureCleanupSchema,
  CaptureGeometrySchema,
  CapturePlanSchema,
  CaptureRasterSchema,
  CaptureReadinessProfileSchema,
  CaptureReadinessSchema,
  CaptureRestorationSchema,
  CaptureSessionSchema,
  CaptureSetSchema,
  CaptureSurveySchema,
  CaptureSweepSchema,
  CaptureTileCheckpointSchema,
} from "./evidence";
import {
  IllustrationEvidenceInputSchema,
  IllustrationOutputSchema,
  IllustrationPlanSchema,
  IllustrationRegistrationInputSchema,
  IllustrationRegistrationOutputSchema,
} from "./illustration";
import { ReviewedCellOwnersSchema } from "./plans";
import {
  TileCoverageSchema,
  TileFileSchema,
  TileLevelSchema,
  TilePlanSchema,
  TilePyramidSchema,
  TileReferenceSchema,
  TileSourceProvenanceSchema,
} from "./tiles";

schemaRegistry.register("compendium.capture-survey.v1", CaptureSurveySchema);
schemaRegistry.register("compendium.capture-readiness-profile.v1", CaptureReadinessProfileSchema);
schemaRegistry.register("compendium.capture-plan.v9", CapturePlanSchema);
schemaRegistry.register("compendium.capture-session.v8", CaptureSessionSchema);
schemaRegistry.register("compendium.capture-raster.v5", CaptureRasterSchema);
schemaRegistry.register("compendium.capture-restoration.v5", CaptureRestorationSchema);
schemaRegistry.register("compendium.capture-cleanup.v1", CaptureCleanupSchema);
schemaRegistry.register("compendium.capture-sweep.v3", CaptureSweepSchema);
schemaRegistry.register("compendium.capture-geometry.v5", CaptureGeometrySchema);
schemaRegistry.register("compendium.capture-readiness.v5", CaptureReadinessSchema);
schemaRegistry.register("compendium.capture-tile-checkpoint.v1", CaptureTileCheckpointSchema);
schemaRegistry.register("compendium.capture-set.v3", CaptureSetSchema);
schemaRegistry.register("compendium.illustration-evidence-input.v1", IllustrationEvidenceInputSchema);
schemaRegistry.register("compendium.illustration-registration-input.v1", IllustrationRegistrationInputSchema);
schemaRegistry.register("compendium.illustration-plan.v2", IllustrationPlanSchema);
schemaRegistry.register("compendium.illustration-registration-output.v1", IllustrationRegistrationOutputSchema);
schemaRegistry.register("compendium.illustration.v1", IllustrationOutputSchema);
schemaRegistry.register("compendium.reviewed-cell-owners.v1", ReviewedCellOwnersSchema);
schemaRegistry.register("compendium.tile-reference.v1", TileReferenceSchema);
schemaRegistry.register("compendium.tile-plan.v2", TilePlanSchema);
schemaRegistry.register("compendium.tile-coverage.v1", TileCoverageSchema);
schemaRegistry.register("compendium.tile-file.v1", TileFileSchema);
schemaRegistry.register("compendium.tile-level.v1", TileLevelSchema);
schemaRegistry.register("compendium.tile-source-provenance.v1", TileSourceProvenanceSchema);
schemaRegistry.register("compendium.tile-pyramid.v3", TilePyramidSchema);

export * from "./evidence";
export * from "./illustration";
export * from "./plans";
export * from "./tiles";
