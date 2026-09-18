import { schemaRegistry } from "../schema-registry";
import { CoverageDiagnosticSchema, CoverageEntrySchema, CoverageLedgerSchema } from "./coverage";
import { ArtifactReferenceSchema, NormalizationPlanSchema, PublicationPlanSchema, SceneSnapshotReferenceSchema } from "./query";
import { PlacementRolesSchema, RoleEvidenceSchema, RoleFactSchema, RoleIssueSchema } from "./roles";

schemaRegistry.register("compendium.artifact-reference.v1", ArtifactReferenceSchema);
schemaRegistry.register("compendium.scene-snapshot-reference.v1", SceneSnapshotReferenceSchema);
schemaRegistry.register("compendium.normalization-plan.v1", NormalizationPlanSchema);
schemaRegistry.register("compendium.publication-plan.v2", PublicationPlanSchema);
schemaRegistry.register("compendium.role-evidence.v1", RoleEvidenceSchema);
schemaRegistry.register("compendium.role-fact.v1", RoleFactSchema);
schemaRegistry.register("compendium.role-issue.v1", RoleIssueSchema);
schemaRegistry.register("compendium.placement-roles.v1", PlacementRolesSchema);
schemaRegistry.register("compendium.coverage-entry.v1", CoverageEntrySchema);
schemaRegistry.register("compendium.coverage-diagnostic.v1", CoverageDiagnosticSchema);
schemaRegistry.register("compendium.coverage.v2", CoverageLedgerSchema);

export * from "./coverage";
export * from "./accounting";
export * from "./plans";
export * from "./query";
export * from "./roles";

export * from "./facts";
