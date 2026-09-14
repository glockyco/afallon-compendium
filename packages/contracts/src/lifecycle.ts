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

const SchemaIdentityReferenceDefinition = Type.Object({
  id: NonEmptyString,
  sha256: Sha256,
}, { additionalProperties: false });
export const SchemaIdentityReferenceSchema = schemaRegistry.register("compendium.schema-identity-reference.v1", SchemaIdentityReferenceDefinition).schema;
export type SchemaIdentityReference = Static<typeof SchemaIdentityReferenceSchema>;

const LogicalArtifactDefinition = Type.Object({
  name: NonEmptyString,
  content: ContentIdentitySchema,
  mediaType: NonEmptyString,
  schemaId: Type.Union([NonEmptyString, Type.Null()]),
  buildId: NonEmptyString,
}, { additionalProperties: false });
export const LogicalArtifactSchema = schemaRegistry.register("compendium.logical-artifact.v1", LogicalArtifactDefinition).schema;
export type LogicalArtifact = Static<typeof LogicalArtifactSchema>;

const ArtifactRunInputDefinition = Type.Object({
  buildId: NonEmptyString,
  operation: NonEmptyString,
  settings: UnknownRecord,
  schemas: Type.Array(SchemaIdentityReferenceSchema),
  implementationFingerprint: Sha256,
  diagnosticRevision: NonEmptyString,
  inputs: Type.Record(Type.String({ minLength: 1 }), ContentIdentitySchema),
}, { additionalProperties: false });
export const ArtifactRunInputSchema = schemaRegistry.register("compendium.artifact-run-input.v1", ArtifactRunInputDefinition).schema;
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

const ArtifactRunManifestDefinition = Type.Object({
  schemaVersion: Type.Literal("compendium.artifact-run.v1"),
  revision: Type.Integer({ minimum: 0 }),
  runId: NonEmptyString,
  input: ArtifactRunInputSchema,
  outputs: Type.Array(LogicalArtifactSchema),
  timestamps: Type.Object({
    createdAt: NonEmptyString,
    updatedAt: NonEmptyString,
    completedAt: Type.Union([NonEmptyString, Type.Null()]),
  }, { additionalProperties: false }),
  status: ArtifactRunStatusSchema,
  failure: Type.Union([FailureRecordSchema, Type.Null()]),
}, { additionalProperties: false });
export const ArtifactRunManifestSchema = schemaRegistry.register("compendium.artifact-run.v1", ArtifactRunManifestDefinition).schema;
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
