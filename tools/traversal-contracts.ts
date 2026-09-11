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
  phase: Type.Union([Type.Literal("loading"), Type.Literal("settling"), Type.Literal("ready"), Type.Literal("restoring"), Type.Literal("restored")]),
  frame: count,
  sceneHandle: integer,
};
export const TraversalPlanSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.traversal-plan.v1"),
  stepTimeoutMs: Type.Integer({ minimum: 1000, maximum: 300000 }),
  steps: Type.Array(Type.Object({
    sceneNativeId: count,
    streamAssetGuids: Type.Array(Type.String({ pattern: "^[a-f0-9]{32}$" }), { maxItems: 32, uniqueItems: true }),
  }), { minItems: 1, maxItems: 8 }),
});
export type TraversalPlan = Static<typeof TraversalPlanSchema>;
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
