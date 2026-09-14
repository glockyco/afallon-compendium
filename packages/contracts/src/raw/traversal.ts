import { Type, type Static } from "typebox";

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

const ScanCurrentSceneTargetSchema = Type.Object({
  kind: Type.Literal("current-scene"),
}, { additionalProperties: false });
const ScanBuildSceneTargetSchema = Type.Object({
  kind: Type.Literal("build-scene"),
  sceneNativeId: count,
}, { additionalProperties: false });
const ScanStreamedSourceTargetSchema = Type.Object({
  kind: Type.Literal("streamed-source"),
  sceneNativeId: count,
  sourceKey: text,
}, { additionalProperties: false });
export const ScanTargetSchema = Type.Union([ScanCurrentSceneTargetSchema, ScanBuildSceneTargetSchema, ScanStreamedSourceTargetSchema]);
export type ScanTarget = Static<typeof ScanTargetSchema>;
export const ScanPlanSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.scan-plan.v1"),
  targetTimeoutMs: Type.Integer({ minimum: 1000, maximum: 900000 }),
  targets: Type.Array(ScanTargetSchema, { minItems: 1, maxItems: 256 }),
}, { additionalProperties: false });
export type ScanPlan = Static<typeof ScanPlanSchema>;
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
export const ScanTargetEnvelopeSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.scan-target-envelope.v1"),
  buildId: text,
  targetIndex: count,
  target: ScanTargetSchema,
  targetIdentity: text,
  outcome: ScanTargetOutcomeSchema,
  observation: Type.Object({
    started: Type.Union([RuntimeScanStateSchema, Type.Null()]),
    completed: Type.Union([RuntimeScanStateSchema, Type.Null()]),
  }, { additionalProperties: false }),
  collectors: Type.Array(ScanCollectorDispositionSchema),
  diagnostics: Type.Array(Type.Object({ code: text, message: text }, { additionalProperties: false })),
}, { additionalProperties: false });
export type ScanTargetEnvelope = Static<typeof ScanTargetEnvelopeSchema>;

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
