import { Type, type Static } from "typebox";
import { schemaRegistry } from "./schema-registry";

export const SHA256_PATTERN = "^[a-f0-9]{64}$";
const NonEmptyString = Type.String({ minLength: 1 });
const Sha256 = Type.String({ pattern: SHA256_PATTERN });
const UnknownRecord = Type.Record(Type.String(), Type.Unknown());

const CompendiumConfigInputDefinition = Type.Object({
  gamePath: NonEmptyString,
  outputRoot: NonEmptyString,
  runtimeOutputRoot: NonEmptyString,
  hotreplUrl: NonEmptyString,
  character: NonEmptyString,
  finalSceneNativeId: Type.Integer({ minimum: 0 }),
  finalScenePath: NonEmptyString,
  timeoutMs: Type.Optional(Type.Integer({ minimum: 100, maximum: 120_000 })),
  mapSpaceProfile: Type.Optional(NonEmptyString),
}, { additionalProperties: false });
export const CompendiumConfigInputSchema = schemaRegistry.register("compendium.config-input.v1", CompendiumConfigInputDefinition).schema;
export type CompendiumConfigInput = Static<typeof CompendiumConfigInputSchema>;

const CompendiumConfigDefinition = Type.Object({
  gamePath: NonEmptyString,
  outputRoot: NonEmptyString,
  runtimeOutputRoot: NonEmptyString,
  hotreplUrl: NonEmptyString,
  character: NonEmptyString,
  finalSceneNativeId: Type.Integer({ minimum: 0 }),
  finalScenePath: NonEmptyString,
  timeoutMs: Type.Integer({ minimum: 100, maximum: 120_000 }),
  mapSpaceProfile: Type.Optional(NonEmptyString),
}, { additionalProperties: false });
export const CompendiumConfigSchema = schemaRegistry.register("compendium.config.v1", CompendiumConfigDefinition).schema;
export type CompendiumConfig = Static<typeof CompendiumConfigSchema>;

const RuntimeCleanupReceiptDefinition = Type.Object({
  schemaVersion: Type.Literal("compendium.runtime-owner.v1"),
  token: Type.String(),
  state: Type.String(),
  reason: Type.String(),
  cleanupErrors: Type.Array(Type.String()),
  callbacksRemaining: Type.Integer({ minimum: 0 }),
  frame: Type.Integer(),
});
export const RuntimeCleanupReceiptSchema = schemaRegistry.register("compendium.runtime-owner.v1", RuntimeCleanupReceiptDefinition).schema;
export type RuntimeCleanupReceipt = Static<typeof RuntimeCleanupReceiptSchema>;

const ContentIdentityDefinition = Type.Object({
  sha256: Sha256,
  bytes: Type.Integer({ minimum: 0 }),
}, { additionalProperties: false });
export const ContentIdentitySchema = schemaRegistry.register("compendium.content-identity.v1", ContentIdentityDefinition).schema;
export type ContentIdentity = Static<typeof ContentIdentitySchema>;

const SteamManifestDefinition = Type.Object({
  appId: NonEmptyString,
  installDir: NonEmptyString,
  buildId: NonEmptyString,
  stateFlags: Type.Integer({ minimum: 0 }),
}, { additionalProperties: false });

const GameUpdateInstallationDefinition = Type.Object({
  manifest: SteamManifestDefinition,
  inputHashes: Type.Record(Type.String(), Sha256),
}, { additionalProperties: false });

const GameUpdateLogEvidenceDefinition = Type.Object({
  content: ContentIdentitySchema,
  offset: Type.Integer({ minimum: 0 }),
  endOffset: Type.Integer({ minimum: 0 }),
}, { additionalProperties: false });

const GameUpdateReceiptDefinition = Type.Object({
  schemaVersion: Type.Literal("compendium.game-update-receipt.v1"),
  releaseVersion: NonEmptyString,
  recordedAt: NonEmptyString,
  updated: Type.Boolean(),
  previous: GameUpdateInstallationDefinition,
  current: GameUpdateInstallationDefinition,
  evidence: Type.Object({
    connectionLog: GameUpdateLogEvidenceDefinition,
    contentLog: Type.Object({
      content: ContentIdentitySchema,
      offset: Type.Integer({ minimum: 0 }),
      endOffset: Type.Integer({ minimum: 0 }),
      result: NonEmptyString,
    }, { additionalProperties: false }),
  }, { additionalProperties: false }),
}, { additionalProperties: false });
export const GameUpdateReceiptSchema = schemaRegistry.register("compendium.game-update-receipt.v1", GameUpdateReceiptDefinition).schema;
export type GameUpdateReceipt = Static<typeof GameUpdateReceiptSchema>;

const Cpp2ilSnapshotReceiptDefinition = Type.Object({
  schemaVersion: Type.Literal("compendium.cpp2il-snapshot-receipt.v1"),
  recordedAt: NonEmptyString,
  toolVersion: NonEmptyString,
  arguments: Type.Array(NonEmptyString),
  input: Type.Object({
    manifest: SteamManifestDefinition,
    inputHashes: Type.Record(Type.String(), Sha256),
  }, { additionalProperties: false }),
}, { additionalProperties: false });
export const Cpp2ilSnapshotReceiptSchema = schemaRegistry.register("compendium.cpp2il-snapshot-receipt.v1", Cpp2ilSnapshotReceiptDefinition).schema;
export type Cpp2ilSnapshotReceipt = Static<typeof Cpp2ilSnapshotReceiptSchema>;

const SchemaIdentityReferenceDefinition = Type.Object({
  id: NonEmptyString,
  sha256: Sha256,
}, { additionalProperties: false });
export const SchemaIdentityReferenceSchema = schemaRegistry.register("compendium.schema-identity-reference.v1", SchemaIdentityReferenceDefinition).schema;
export type SchemaIdentityReference = Static<typeof SchemaIdentityReferenceSchema>;

const ArtifactDependencyDefinition = Type.Object({
  kind: Type.Union([Type.Literal("object"), Type.Literal("run-manifest")]),
  content: ContentIdentitySchema,
}, { additionalProperties: false });
export const ArtifactDependencySchema = schemaRegistry.register("compendium.artifact-dependency.v1", ArtifactDependencyDefinition).schema;
export type ArtifactDependency = Static<typeof ArtifactDependencySchema>;

const LogicalArtifactDefinition = Type.Object({
  name: NonEmptyString,
  content: ContentIdentitySchema,
  mediaType: NonEmptyString,
  schemaId: Type.Union([NonEmptyString, Type.Null()]),
  buildId: NonEmptyString,
  references: Type.Array(ArtifactDependencySchema),
}, { additionalProperties: false });
export const LogicalArtifactSchema = schemaRegistry.register("compendium.logical-artifact.v2", LogicalArtifactDefinition).schema;
export type LogicalArtifact = Static<typeof LogicalArtifactSchema>;

const StepFingerprintDefinition = Type.Object({
  implementation: Sha256,
  cacheKey: Sha256,
  transitiveModuleCount: Type.Integer({ minimum: 1 }),
  probeHashes: Type.Record(Type.String(), Sha256),
}, { additionalProperties: false });
export const StepFingerprintSchema = schemaRegistry.register("compendium.step-fingerprint.v1", StepFingerprintDefinition).schema;
export type StepFingerprint = Static<typeof StepFingerprintSchema>;

const ArtifactRunInputDefinition = Type.Object({
  buildId: NonEmptyString,
  operation: NonEmptyString,
  settings: UnknownRecord,
  schemas: Type.Array(SchemaIdentityReferenceSchema),
  implementationFingerprint: Sha256,
  cacheKey: Sha256,
  probeHashes: Type.Record(Type.String(), Sha256),
  diagnosticRevision: NonEmptyString,
  inputs: Type.Record(Type.String({ minLength: 1 }), ContentIdentitySchema),
  inputManifests: Type.Optional(Type.Array(NonEmptyString, { uniqueItems: true })),
}, { additionalProperties: false });
export const ArtifactRunInputSchema = schemaRegistry.register("compendium.artifact-run-input.v2", ArtifactRunInputDefinition).schema;
export type ArtifactRunInput = Static<typeof ArtifactRunInputSchema>;

const ArtifactRunStatusSchema = Type.Union([Type.Literal("running"), Type.Literal("succeeded"), Type.Literal("failed")]);
export type ArtifactRunStatus = Static<typeof ArtifactRunStatusSchema>;

const RunInputDefinition = Type.Object({
  buildId: NonEmptyString,
  toolRevision: NonEmptyString,
  command: NonEmptyString,
  settings: UnknownRecord,
  inputHashes: Type.Record(Type.String(), Sha256),
}, { additionalProperties: false });
export const RunInputSchema = schemaRegistry.register("compendium.run-input.v1", RunInputDefinition).schema;
export type RunInput = Static<typeof RunInputSchema>;

const ArtifactRecordDefinition = Type.Object({
  path: NonEmptyString,
  bytes: Type.Integer({ minimum: 0 }),
  sha256: Sha256,
}, { additionalProperties: false });
export const ArtifactRecordSchema = schemaRegistry.register("compendium.artifact-record.v1", ArtifactRecordDefinition).schema;
export type ArtifactRecord = Static<typeof ArtifactRecordSchema>;

export const RUN_STATUS_VALUES = ["running", "succeeded", "failed"] as const;
const RunStatusSchema = Type.Union([
  Type.Literal("running"),
  Type.Literal("succeeded"),
  Type.Literal("failed"),
]);
export type RunStatus = Static<typeof RunStatusSchema>;

const RunTimestampsDefinition = Type.Object({
  createdAt: NonEmptyString,
  startedAt: NonEmptyString,
  updatedAt: NonEmptyString,
  completedAt: Type.Union([NonEmptyString, Type.Null()]),
}, { additionalProperties: false });
export const RunTimestampsSchema = schemaRegistry.register("compendium.run-timestamps.v1", RunTimestampsDefinition).schema;
export type RunTimestamps = Static<typeof RunTimestampsSchema>;

const FailureRecordDefinition = Type.Object({
  name: NonEmptyString,
  message: Type.String(),
  stack: Type.Optional(Type.String()),
  details: Type.Optional(Type.Unknown()),
}, { additionalProperties: false });
export const FailureRecordSchema = schemaRegistry.register("compendium.failure-record.v1", FailureRecordDefinition).schema;
export type FailureRecord = Static<typeof FailureRecordSchema>;

export const ArtifactRunPhaseSchema = Type.Union([Type.Literal("preparation"), Type.Literal("execution"), Type.Literal("finalization")]);
export type ArtifactRunPhase = Static<typeof ArtifactRunPhaseSchema>;

const ArtifactRunManifestDefinition = Type.Object({
  schemaVersion: Type.Literal("compendium.artifact-run.v2"),
  revision: Type.Integer({ minimum: 0 }),
  runId: NonEmptyString,
  phase: ArtifactRunPhaseSchema,
  execution: Type.Object({ host: NonEmptyString, pid: Type.Integer({ minimum: 1 }) }, { additionalProperties: false }),
  input: ArtifactRunInputSchema,
  outputs: Type.Array(LogicalArtifactSchema),
  reuse: Type.Union([Type.Null(), Type.Object({ sourceRunId: NonEmptyString, sourceManifest: ContentIdentitySchema, outputNames: Type.Array(NonEmptyString) }, { additionalProperties: false })]),
  timestamps: Type.Object({
    createdAt: NonEmptyString,
    updatedAt: NonEmptyString,
    completedAt: Type.Union([NonEmptyString, Type.Null()]),
  }, { additionalProperties: false }),
  status: ArtifactRunStatusSchema,
  failure: Type.Union([FailureRecordSchema, Type.Null()]),
}, { additionalProperties: false });
export const ArtifactRunManifestSchema = schemaRegistry.register("compendium.artifact-run.v2", ArtifactRunManifestDefinition).schema;
export type ArtifactRunManifest = Static<typeof ArtifactRunManifestSchema>;

const ArtifactLatestSuccessDefinition = Type.Object({
  schemaVersion: Type.Literal("compendium.artifact-latest-success.v1"),
  buildId: NonEmptyString,
  operation: NonEmptyString,
  runId: NonEmptyString,
  manifest: Type.Object({
    path: NonEmptyString,
    sha256: Sha256,
    bytes: Type.Integer({ minimum: 0 }),
  }, { additionalProperties: false }),
  selectedAt: NonEmptyString,
}, { additionalProperties: false });
export const ArtifactLatestSuccessSchema = schemaRegistry.register("compendium.artifact-latest-success.v1", ArtifactLatestSuccessDefinition).schema;
export type ArtifactLatestSuccess = Static<typeof ArtifactLatestSuccessSchema>;

const ArtifactLeaseDefinition = Type.Object({
  schemaVersion: Type.Literal("compendium.artifact-lease.v2"),
  leaseId: NonEmptyString,
  runId: NonEmptyString,
  buildId: NonEmptyString,
  operation: NonEmptyString,
  createdAt: NonEmptyString,
  updatedAt: NonEmptyString,
  objects: Type.Array(ContentIdentitySchema),
  pendingObjects: Type.Array(ContentIdentitySchema),
  manifests: Type.Array(ContentIdentitySchema),
}, { additionalProperties: false });
export const ArtifactLeaseSchema = schemaRegistry.register("compendium.artifact-lease.v2", ArtifactLeaseDefinition).schema;
export type ArtifactLease = Static<typeof ArtifactLeaseSchema>;

const GarbageCollectionReportDefinition = Type.Object({
  schemaVersion: Type.Literal("compendium.artifact-gc-report.v1"),
  generatedAt: NonEmptyString,
  dryRun: Type.Literal(true),
  objects: Type.Array(Type.Object({
    content: ContentIdentitySchema,
    path: NonEmptyString,
    protections: Type.Array(NonEmptyString),
    disposition: Type.Union([Type.Literal("preserve"), Type.Literal("unreachable")]),
  }, { additionalProperties: false })),
  summary: Type.Object({ total: Type.Integer({ minimum: 0 }), preserved: Type.Integer({ minimum: 0 }), unreachable: Type.Integer({ minimum: 0 }) }, { additionalProperties: false }),
}, { additionalProperties: false });
export const GarbageCollectionReportSchema = schemaRegistry.register("compendium.artifact-gc-report.v1", GarbageCollectionReportDefinition).schema;
export type GarbageCollectionReport = Static<typeof GarbageCollectionReportSchema>;

const RunManifestDefinition = Type.Object({
  schemaVersion: Type.Literal(1),
  runId: NonEmptyString,
  input: RunInputSchema,
  timestamps: RunTimestampsSchema,
  status: RunStatusSchema,
  artifacts: Type.Array(ArtifactRecordSchema),
  failure: Type.Union([FailureRecordSchema, Type.Null()]),
}, { additionalProperties: false });
export const RunManifestSchema = schemaRegistry.register("compendium.run-manifest.v1", RunManifestDefinition).schema;
export type RunManifest = Static<typeof RunManifestSchema>;

const LatestSuccessPointerDefinition = Type.Object({
  schemaVersion: Type.Literal(1),
  buildId: NonEmptyString,
  command: NonEmptyString,
  runId: NonEmptyString,
  status: Type.Literal("succeeded"),
  manifestPath: NonEmptyString,
  directory: NonEmptyString,
  selectedAt: NonEmptyString,
}, { additionalProperties: false });
export const LatestSuccessPointerSchema = schemaRegistry.register("compendium.latest-success.v1", LatestSuccessPointerDefinition).schema;
export type LatestSuccessPointer = Static<typeof LatestSuccessPointerSchema>;
