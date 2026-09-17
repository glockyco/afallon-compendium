import { Type, type Static } from "typebox";
import { Assert } from "typebox/value";

const integer = Type.Integer();
const count = Type.Integer({ minimum: 0 });
const text = Type.String({ minLength: 1 });
const vector = Type.Object({ x: Type.Number(), y: Type.Number(), z: Type.Number() });
const rotation = Type.Object({ x: Type.Number(), y: Type.Number(), z: Type.Number(), w: Type.Number() });
const common = {
  key: text,
  // "settling": the scene is loaded and the player was placed at the capture position; the
  // loaders that placement started are still running.
  // "returned": the target scene loaded and the game reloaded the source scene at once; the
  // target is not reachable by loading it.
  phase: Type.Union([Type.Literal("loading"), Type.Literal("settling"), Type.Literal("ready"), Type.Literal("returned"), Type.Literal("restoring"), Type.Literal("restored")]),
  frame: count,
  sceneHandle: integer,
};
export const TraversalPlanSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.traversal-plan.v1"),
  // A challenge-stone scene loads and then reloads its parent area; that returns in under 15 seconds
  // but a parent area alone loads for near 4 minutes.
  stepTimeoutMs: Type.Integer({ minimum: 1000, maximum: 900000 }),
  steps: Type.Array(Type.Object({
    sceneNativeId: count,
    streamAssetGuids: Type.Array(Type.String({ pattern: "^[a-f0-9]{32}$" }), { maxItems: 32, uniqueItems: true }),
  }), { minItems: 1, maxItems: 8 }),
});
export type TraversalPlan = Static<typeof TraversalPlanSchema>;

export const ScanCurrentSceneTargetSchema = Type.Object({
  kind: Type.Literal("current-scene"),
}, { additionalProperties: false });
export type ScanCurrentSceneTarget = Static<typeof ScanCurrentSceneTargetSchema>;
export const ScanBuildSceneTargetSchema = Type.Object({
  kind: Type.Literal("build-scene"),
  sceneNativeId: count,
}, { additionalProperties: false });
export type ScanBuildSceneTarget = Static<typeof ScanBuildSceneTargetSchema>;
export const ScanStreamedSourceTargetSchema = Type.Object({
  kind: Type.Literal("streamed-source"),
  sceneNativeId: count,
  sourceKey: text,
}, { additionalProperties: false });
export type ScanStreamedSourceTarget = Static<typeof ScanStreamedSourceTargetSchema>;
export const ScanTargetSchema = Type.Union([ScanCurrentSceneTargetSchema, ScanBuildSceneTargetSchema, ScanStreamedSourceTargetSchema]);
export type ScanTarget = Static<typeof ScanTargetSchema>;
export const ScanPlanSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.scan-plan.v1"),
  targetTimeoutMs: Type.Integer({ minimum: 1000, maximum: 900000 }),
  targets: Type.Array(ScanTargetSchema, { minItems: 1, maxItems: 256 }),
}, { additionalProperties: false });
export type ScanPlan = Static<typeof ScanPlanSchema>;
const contentIdentity = Type.Object({ sha256: Type.String({ pattern: "^[a-f0-9]{64}$" }), bytes: count }, { additionalProperties: false });
export const ScanPlanningEvidenceSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.scan-planning-evidence.v1"),
  buildId: text,
  sourceRunId: text,
  plan: contentIdentity,
  inventory: contentIdentity,
  observationContext: contentIdentity,
  targets: Type.Array(Type.Object({ target: ScanTargetSchema, targetIdentity: text }, { additionalProperties: false }), { minItems: 1 }),
}, { additionalProperties: false });
export type ScanPlanningEvidence = Static<typeof ScanPlanningEvidenceSchema>;
export const SCAN_COLLECTOR_FAMILIES = ["canonical", "inventory", "producers", "placements", "roles", "relationships", "spatial", "coverage"] as const;
export const ScanCollectorFamilySchema = Type.Union([
  Type.Literal("canonical"),
  Type.Literal("inventory"),
  Type.Literal("producers"),
  Type.Literal("placements"),
  Type.Literal("roles"),
  Type.Literal("relationships"),
  Type.Literal("spatial"),
  Type.Literal("coverage"),
]);
export type ScanCollectorFamily = Static<typeof ScanCollectorFamilySchema>;
export const ScanCollectorDispositionSchema = Type.Object({
  family: ScanCollectorFamilySchema,
  status: Type.Union([Type.Literal("collect"), Type.Literal("not-applicable")]),
  evidence: text,
}, { additionalProperties: false });
export type ScanCollectorDisposition = Static<typeof ScanCollectorDispositionSchema>;

export const RuntimeScanStateSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.runtime-scan-state.v1"),
  frame: count,
  character: text,
  scene: Type.Object({ name: text, path: text, handle: integer, isLoaded: Type.Literal(true) }, { additionalProperties: false }),
  gameSceneNativeId: Type.Union([count, Type.Null()]),
  position: vector,
  rotation,
}, { additionalProperties: false });
export type RuntimeScanState = Static<typeof RuntimeScanStateSchema>;
export const ScanTargetOutcomeSchema = Type.Union([
  Type.Literal("succeeded"),
  Type.Literal("failed"),
  Type.Literal("unsupported"),
  Type.Literal("unreachable"),
  Type.Literal("not-attempted"),
]);
export type ScanTargetOutcome = Static<typeof ScanTargetOutcomeSchema>;
export const ScanSourceEvidenceSchema = Type.Object({
  sceneNativeId: count,
  sourceKey: text,
  loaderInstanceId: Type.Union([integer, Type.Null()]),
  assetGuid: Type.Union([text, Type.Null()]),
  runtimeKey: Type.Union([text, Type.Null()]),
  disposition: text,
  detail: text,
}, { additionalProperties: false });
export type ScanSourceEvidence = Static<typeof ScanSourceEvidenceSchema>;
export const ScanEvidenceArtifactSchema = Type.Object({
  family: ScanCollectorFamilySchema,
  name: text,
  schema: Type.Object({ id: text, sha256: Type.String({ pattern: "^[a-f0-9]{64}$" }) }, { additionalProperties: false }),
  content: Type.Object({ sha256: Type.String({ pattern: "^[a-f0-9]{64}$" }), bytes: count }, { additionalProperties: false }),
  observationContext: Type.Union([Type.Object({ sha256: Type.String({ pattern: "^[a-f0-9]{64}$" }), bytes: count }, { additionalProperties: false }), Type.Null()]),
  inputs: Type.Array(Type.Object({ sha256: Type.String({ pattern: "^[a-f0-9]{64}$" }), bytes: count }, { additionalProperties: false })),
  authoredIdentities: Type.Array(text, { uniqueItems: true }),
}, { additionalProperties: false });
export type ScanEvidenceArtifact = Static<typeof ScanEvidenceArtifactSchema>;
export const ScanTargetEnvelopeSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.scan-target-envelope.v2"),
  buildId: text,
  sourceRunId: text,
  targetIndex: count,
  target: ScanTargetSchema,
  targetIdentity: text,
  outcome: ScanTargetOutcomeSchema,
  observation: Type.Object({
    started: Type.Union([RuntimeScanStateSchema, Type.Null()]),
    completed: Type.Union([RuntimeScanStateSchema, Type.Null()]),
  }, { additionalProperties: false }),
  collectors: Type.Array(ScanCollectorDispositionSchema),
  artifacts: Type.Array(ScanEvidenceArtifactSchema),
  sourceEvidence: Type.Union([ScanSourceEvidenceSchema, Type.Null()]),
  diagnostics: Type.Array(Type.Object({ code: text, message: text }, { additionalProperties: false })),
}, { additionalProperties: false });
export type ScanTargetEnvelope = Static<typeof ScanTargetEnvelopeSchema>;

export function validateScanTargetEnvelope(value: unknown, expected?: { buildId: string; sourceRunId?: string }): ScanTargetEnvelope {
  try { Assert(ScanTargetEnvelopeSchema, value); }
  catch (error) {
    const row = value !== null && typeof value === "object" ? value as Record<string, unknown> : {};
    throw new Error(`Scan target ${String(row.targetIdentity ?? "unknown")} at index ${String(row.targetIndex ?? "unknown")} has a malformed envelope.`, { cause: error });
  }
  const label = `Scan target ${value.targetIdentity} at index ${value.targetIndex}`;
  if (expected !== undefined && value.buildId !== expected.buildId) throw new Error(`${label} belongs to build ${value.buildId}, not ${expected.buildId}.`);
  if (expected?.sourceRunId !== undefined && value.sourceRunId !== expected.sourceRunId) throw new Error(`${label} belongs to another source run.`);
  const target = value.target;
  const identity = target.kind === "current-scene" ? target.kind : target.kind === "build-scene" ? `${target.kind}:${target.sceneNativeId}` : `${target.kind}:${target.sceneNativeId}:${target.sourceKey}`;
  if (value.targetIdentity !== identity) throw new Error(`${label} has an inconsistent target identity.`);
  const dispositions = new Map<ScanCollectorFamily, ScanCollectorDisposition>();
  for (const [index, disposition] of value.collectors.entries()) {
    if (dispositions.has(disposition.family)) throw new Error(`${label} repeats family disposition ${disposition.family} at collectors/${index}.`);
    dispositions.set(disposition.family, disposition);
  }
  for (const family of SCAN_COLLECTOR_FAMILIES) if (!dispositions.has(family)) throw new Error(`${label} has no disposition for family ${family}.`);
  const artifactKeys = new Set<string>();
  const collected = new Set<ScanCollectorFamily>();
  for (const [index, artifact] of value.artifacts.entries()) {
    const key = `${artifact.family}\0${artifact.name}`;
    if (artifactKeys.has(key)) throw new Error(`${label} repeats artifact ${artifact.family}/${artifact.name} at artifacts/${index}.`);
    artifactKeys.add(key);
    if (dispositions.get(artifact.family)?.status !== "collect") throw new Error(`${label} declares artifact ${artifact.name} in an inapplicable family.`);
    collected.add(artifact.family);
    if (value.outcome === "succeeded" && artifact.family !== "coverage" && artifact.observationContext === null) throw new Error(`${label} artifact ${artifact.name} has no observation context.`);
  }
  if (value.outcome === "succeeded") {
    if (value.observation.started === null || value.observation.completed === null) throw new Error(`${label} has no restoration observation.`);
    for (const disposition of dispositions.values()) if (disposition.status === "collect" && !collected.has(disposition.family)) throw new Error(`${label} has no artifact for applicable family ${disposition.family}.`);
  }
  return value;
}
export const ScanCoverageSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.scan-coverage.v1"),
  targetIdentity: text,
  issues: Type.Array(Type.Object({ collector: text, recordPath: text, detail: text }, { additionalProperties: false })),
}, { additionalProperties: false });
export type ScanCoverage = Static<typeof ScanCoverageSchema>;

export const SceneVisitSchema = Type.Object({
  ...common,
  sourceSceneNativeId: count,
  sourceSceneHandle: integer,
  targetSceneNativeId: count,
  finalSceneNativeId: Type.Optional(count),
  sceneNativeId: Type.Union([count, Type.Null()]),
  sceneReady: Type.Boolean(),
  readiness: Type.Object({
    sceneLoaded: Type.Boolean(),
    sceneInitialized: Type.Union([Type.Boolean(), Type.Null()]),
    sceneLoading: Type.Union([Type.Boolean(), Type.Null()]),
    sceneReadyHolds: Type.Boolean(),
    restoreRequested: Type.Boolean(),
    loadProgress: Type.Union([Type.Number(), Type.Null()]),
    loadDone: Type.Union([Type.Boolean(), Type.Null()]),
    allowSceneActivation: Type.Union([Type.Boolean(), Type.Null()]),
    progressText: Type.Union([Type.String(), Type.Null()]),
    timeScale: Type.Number(),
    unscaledDeltaTime: Type.Number(),
  }),
  sourcePosition: vector,
  position: Type.Union([vector, Type.Null()]),
  sourceRotation: rotation,
  rotation: Type.Union([rotation, Type.Null()]),
});
export type SceneVisit = Static<typeof SceneVisitSchema>;
export const StreamVisitSchema = Type.Object({
  ...common,
  rows: Type.Array(Type.Object({
    loaderInstanceId: integer,
    assetGuid: text,
    activeInHierarchy: Type.Boolean(),
    enabled: Type.Boolean(),
    initiallyLoaded: Type.Boolean(),
    loaded: Type.Boolean(),
    loading: Type.Boolean(),
    hasHandle: Type.Boolean(),
    rootInstanceId: Type.Union([integer, Type.Null()]),
    skippedReason: Type.Union([Type.Null(), Type.Literal("inactive"), Type.Literal("disabled")]),
    holdUntil: Type.Number(),
    originalHoldUntil: Type.Number(),
    position: vector,
    playerDistance: Type.Number(),
    loadDistance: Type.Number(),
  })),
});
export type StreamVisit = Static<typeof StreamVisitSchema>;
export const StreamCleanupSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.stream-cleanup.v1"),
  key: text, ownerToken: text, sceneHandle: integer, frame: count,
  rows: StreamVisitSchema.properties.rows,
  remainingOwnedRoots: Type.Literal(0), errors: Type.Array(text, { maxItems: 0 }),
});
export type StreamCleanup = Static<typeof StreamCleanupSchema>;
