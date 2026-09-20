import { Type, type Static } from "typebox";
import { Assert } from "typebox/value";
import { ContentIdentitySchema, SHA256_PATTERN } from "./lifecycle";
import { schemaRegistry } from "./schema-registry";

const NonEmptyString = Type.String({ minLength: 1 });
const Sha256 = Type.String({ pattern: SHA256_PATTERN });

export const UPDATE_RISK_AREAS = [
  "merged-outdoor-world",
  "teleports",
  "adventurers-and-roles",
  "dungeon-quests-and-rewards",
  "items-and-equipment",
  "weapon-proficiency",
  "healing-power",
  "loot",
  "bankers-and-auctioneers",
  "flight-network",
  "mail",
  "bank-contents",
  "auctions",
  "friends",
  "dungeon-finder",
  "adventurer-progression",
] as const;

export const UPDATE_CHECK_AREAS = [
  "installation-identity",
  "schema-comparison",
  "candidate-scan",
  "catalog-integrity",
  "publication-build",
  "runtime",
  "browser-map",
  "browser-search",
  "browser-entities",
  "browser-relations",
  "browser-artwork",
  "browser-coverage",
] as const;

const EvidencePointerDefinition = Type.Object({
  buildId: NonEmptyString,
  content: ContentIdentitySchema,
  runId: Type.Optional(NonEmptyString),
  artifact: Type.Optional(NonEmptyString),
}, { additionalProperties: false });
export const UpdateEvidencePointerSchema = schemaRegistry.register("compendium.update-evidence-pointer.v1", EvidencePointerDefinition).schema;
export type UpdateEvidencePointer = Static<typeof UpdateEvidencePointerSchema>;

const InstallationIdentityDefinition = Type.Object({
  buildId: NonEmptyString,
  inputHashes: Type.Record(Type.String(), Sha256),
}, { additionalProperties: false });

type UpdateRiskArea = typeof UPDATE_RISK_AREAS[number];
type UpdateCheckArea = typeof UPDATE_CHECK_AREAS[number];
const UpdateRiskAreaDefinition = Type.Unsafe<UpdateRiskArea>({ type: "string", enum: [...UPDATE_RISK_AREAS] });
const UpdateCheckAreaDefinition = Type.Unsafe<UpdateCheckArea>({ type: "string", enum: [...UPDATE_CHECK_AREAS] });

const RiskDispositionDefinition = Type.Object({
  area: UpdateRiskAreaDefinition,
  disposition: Type.Union([
    Type.Literal("supported-unchanged"),
    Type.Literal("supported-changed"),
    Type.Literal("not-authored"),
    Type.Literal("unsupported"),
  ]),
  detail: NonEmptyString,
  evidence: Type.Array(UpdateEvidencePointerSchema, { minItems: 1 }),
}, { additionalProperties: false });

const UpdateCheckDefinition = Type.Object({
  area: UpdateCheckAreaDefinition,
  passed: Type.Literal(true),
  detail: NonEmptyString,
  evidence: Type.Array(UpdateEvidencePointerSchema, { minItems: 1 }),
}, { additionalProperties: false });

const UpdateReportDefinition = Type.Object({
  schemaVersion: Type.Literal("compendium.update-report.v1"),
  releaseVersion: NonEmptyString,
  recordedAt: NonEmptyString,
  previous: InstallationIdentityDefinition,
  current: InstallationIdentityDefinition,
  artifacts: Type.Object({
    updateReceipt: UpdateEvidencePointerSchema,
    schemaSnapshot: UpdateEvidencePointerSchema,
    buildComparison: UpdateEvidencePointerSchema,
    scans: Type.Array(UpdateEvidencePointerSchema, { minItems: 1 }),
    reviewedInputs: Type.Array(UpdateEvidencePointerSchema, { minItems: 1 }),
    catalog: UpdateEvidencePointerSchema,
    publication: UpdateEvidencePointerSchema,
  }, { additionalProperties: false }),
  checks: Type.Array(UpdateCheckDefinition, { minItems: UPDATE_CHECK_AREAS.length, maxItems: UPDATE_CHECK_AREAS.length }),
  risks: Type.Array(RiskDispositionDefinition, { minItems: UPDATE_RISK_AREAS.length, maxItems: UPDATE_RISK_AREAS.length }),
}, { additionalProperties: false });
export const UpdateReportSchema = schemaRegistry.register("compendium.update-report.v1", UpdateReportDefinition).schema;
export type UpdateReport = Static<typeof UpdateReportSchema>;

export const AcceptedBuildDescriptorSchema = schemaRegistry.register("compendium.accepted-build.v1", Type.Object({
  schemaVersion: Type.Literal("compendium.accepted-build.v1"),
  acceptedAt: NonEmptyString,
  releaseVersion: NonEmptyString,
  buildId: NonEmptyString,
  report: ContentIdentitySchema,
  catalog: Type.Object({ catalogId: Sha256, manifest: ContentIdentitySchema, object: ContentIdentitySchema }, { additionalProperties: false }),
  publication: Type.Object({
    manifest: ContentIdentitySchema,
    root: Type.Object({ path: NonEmptyString, sha256: Sha256, bytes: Type.Integer({ minimum: 0 }), schemaId: Type.Literal("compendium.static-root.v3") }, { additionalProperties: false }),
  }, { additionalProperties: false }),
  stage: Type.Object({
    schemaVersion: Type.Literal("afallon.deployment.v2"), publicationId: Sha256, buildId: NonEmptyString, catalogId: Sha256,
    mode: Type.Union([Type.Literal("preview"), Type.Literal("release")]), coverageComplete: Type.Boolean(), selectionSha256: Sha256, publicationSha256: Sha256,
  }, { additionalProperties: false }),
  rollback: Type.Union([Type.Null(), Type.Object({
    selection: ContentIdentitySchema,
    acceptedDescriptor: Type.Optional(ContentIdentitySchema),
    buildId: NonEmptyString,
    publicationId: Sha256,
  }, { additionalProperties: false })]),
}, { additionalProperties: false })).schema;
export type AcceptedBuildDescriptor = Static<typeof AcceptedBuildDescriptorSchema>;

function assertCompleteSet(values: readonly string[], required: readonly string[], label: string): void {
  const observed = new Set(values);
  if (observed.size !== values.length) throw new Error(`Update report repeats a ${label}.`);
  const missing = required.filter(value => !observed.has(value));
  if (missing.length > 0) throw new Error(`Update report is missing ${label}: ${missing.join(", ")}.`);
}

export function validateUpdateReport(value: unknown): UpdateReport {
  Assert(UpdateReportSchema, value);
  assertCompleteSet(value.risks.map(risk => risk.area), UPDATE_RISK_AREAS, "risk disposition");
  assertCompleteSet(value.checks.map(check => check.area), UPDATE_CHECK_AREAS, "verification check");

  const currentPointers = [
    value.artifacts.schemaSnapshot,
    value.artifacts.buildComparison,
    ...value.artifacts.scans,
    ...value.artifacts.reviewedInputs,
    value.artifacts.catalog,
    value.artifacts.publication,
    ...value.checks.flatMap(check => check.evidence),
    ...value.risks.flatMap(risk => risk.evidence),
  ];
  const mismatched = currentPointers.find(pointer => pointer.buildId !== value.current.buildId);
  if (mismatched) throw new Error(`Update report mixes build ${mismatched.buildId} evidence into current build ${value.current.buildId}.`);
  if (value.artifacts.updateReceipt.buildId !== value.current.buildId) {
    throw new Error("Update receipt reference does not identify the current build.");
  }
  return value;
}
