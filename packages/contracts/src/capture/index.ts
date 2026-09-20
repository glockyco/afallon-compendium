import { schemaRegistry } from "../schema-registry";
import {
  CaptureCleanupSchema,
  CaptureChunkOutcomesSchema,
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
  CaptureSweepCleanupSchema,
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
  TileSourceProvenanceSchema,
} from "./tiles";

schemaRegistry.register("compendium.capture-survey.v1", CaptureSurveySchema);
schemaRegistry.register("compendium.capture-readiness-profile.v1", CaptureReadinessProfileSchema);
schemaRegistry.register("compendium.capture-plan.v9", CapturePlanSchema);
schemaRegistry.register("compendium.capture-session.v8", CaptureSessionSchema);
schemaRegistry.register("compendium.capture-raster.v5", CaptureRasterSchema);
schemaRegistry.register("compendium.capture-restoration.v5", CaptureRestorationSchema);
schemaRegistry.register("compendium.capture-cleanup.v1", CaptureCleanupSchema);
schemaRegistry.register("compendium.capture-outcomes.v1", CaptureChunkOutcomesSchema);
schemaRegistry.register("compendium.capture-sweep.v4", CaptureSweepSchema);
schemaRegistry.register("compendium.capture-sweep-cleanup.v1", CaptureSweepCleanupSchema);
schemaRegistry.register("compendium.capture-geometry.v5", CaptureGeometrySchema);
schemaRegistry.register("compendium.capture-readiness.v6", CaptureReadinessSchema);
schemaRegistry.register("compendium.capture-tile-checkpoint.v2", CaptureTileCheckpointSchema);
schemaRegistry.register("compendium.capture-set.v4", CaptureSetSchema);
schemaRegistry.register("compendium.illustration-evidence-input.v1", IllustrationEvidenceInputSchema);
schemaRegistry.register("compendium.illustration-registration-input.v1", IllustrationRegistrationInputSchema);
schemaRegistry.register("compendium.illustration-plan.v3", IllustrationPlanSchema);
schemaRegistry.register("compendium.illustration-registration-output.v1", IllustrationRegistrationOutputSchema);
schemaRegistry.register("compendium.illustration.v1", IllustrationOutputSchema);
schemaRegistry.register("compendium.reviewed-cell-owners.v1", ReviewedCellOwnersSchema);
schemaRegistry.register("compendium.tile-plan.v3", TilePlanSchema);
schemaRegistry.register("compendium.tile-coverage.v1", TileCoverageSchema);
schemaRegistry.register("compendium.tile-file.v1", TileFileSchema);
schemaRegistry.register("compendium.tile-level.v1", TileLevelSchema);
schemaRegistry.register("compendium.tile-source-provenance.v2", TileSourceProvenanceSchema);
schemaRegistry.register("compendium.tile-pyramid.v4", TilePyramidSchema);

export * from "./evidence";
export * from "./illustration";
export * from "./plans";
export * from "./tiles";
