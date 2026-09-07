import { Type, type Static } from "typebox";

const text = Type.String({ minLength: 1 });
const integer = Type.Integer();
const count = Type.Integer({ minimum: 0 });
const number = Type.Number();
const vector = Type.Object({ x: number, y: number, z: number });
const horizontal = Type.Object({ x: number, z: number });
const color = Type.Object({ r: Type.Number({ minimum: 0, maximum: 4 }), g: Type.Number({ minimum: 0, maximum: 4 }), b: Type.Number({ minimum: 0, maximum: 4 }) });
const frame = Type.Object({
  center: horizontal,
  worldSize: Type.Object({ x: Type.Number({ exclusiveMinimum: 0, maximum: 100000 }), z: Type.Number({ exclusiveMinimum: 0, maximum: 100000 }) }),
  cameraY: number,
  nearClip: Type.Number({ exclusiveMinimum: 0 }),
  farClip: Type.Number({ exclusiveMinimum: 0, maximum: 100000 }),
});
export const CaptureReadinessProfileSchema = Type.Object({
  timeoutMs: Type.Integer({ minimum: 1000, maximum: 300000 }),
  stableFrames: Type.Integer({ minimum: 2, maximum: 10 }),
  boundaryOverlap: Type.Number({ minimum: 0, maximum: 1000 }),
  maximumSources: Type.Integer({ minimum: 1, maximum: 256 }),
});
export const CapturePlanSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.capture-plan.v2"),
  sceneNativeId: count, scenePath: text, mapSpaceId: text, floorId: Type.Union([text, Type.Null()]),
  width: Type.Integer({ minimum: 64, maximum: 2048 }), height: Type.Integer({ minimum: 64, maximum: 2048 }),
  cullingMask: Type.Integer({ minimum: -2147483648, maximum: 2147483647 }),
  lighting: Type.Object({ ambient: color, directionalIntensity: Type.Number({ minimum: 0, maximum: 4 }), directionalEuler: vector }),
  readiness: CaptureReadinessProfileSchema,
  tiles: Type.Array(Type.Object({
    id: Type.String({ pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$", maxLength: 80 }),
    frame,
    suppressedRendererIds: Type.Array(integer, { uniqueItems: true, maxItems: 5000 }),
  }), { minItems: 1, maxItems: 64 }),
});
export type CapturePlan = Static<typeof CapturePlanSchema>;

const capture = Type.Object({
  tileId: text, path: text, sha256: Type.String({ pattern: "^[a-f0-9]{64}$" }), byteSize: count,
  width: count, height: count, frame: count, restoredFrame: count,
  lightingRestored: Type.Literal(true), suppressionRestored: Type.Literal(true), activeTargetRestored: Type.Literal(true),
  suppressedRenderers: count,
  cameraFrame: frame,
  projectionSamples: Type.Array(Type.Object({ world: vector, viewport: vector }), { minItems: 3 }),
});
export const CaptureSessionSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.capture-session.v1"),
  key: text, phase: Type.Union([Type.Literal("ready"), Type.Literal("restored")]),
  ownerToken: text, sceneNativeId: count, scenePath: text, sceneHandle: integer,
  resourcePrefix: text,
  resources: Type.Array(Type.Object({ kind: text, instanceId: Type.Union([integer, Type.Null()]), alive: Type.Boolean() })),
  completedCaptures: count,
  lastCapture: Type.Union([capture, Type.Null()]),
});
export type CaptureSession = Static<typeof CaptureSessionSchema>;
const rgba = Type.Object({ r: number, g: number, b: number, a: number });
const visualState = Type.Object({
  fog: Type.Boolean(), ambientMode: integer,
  ambientLight: rgba, ambientSky: rgba, ambientEquator: rgba, ambientGround: rgba,
  ambientIntensity: number, ambientProbe: Type.Array(number, { minItems: 27, maxItems: 27 }),
  activeTargetInstanceId: Type.Union([integer, Type.Null()]), lightEnabled: Type.Boolean(),
  renderers: Type.Array(Type.Object({ instanceId: integer, enabled: Type.Boolean() })),
});
export const CaptureRestorationSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.capture-restoration.v1"), key: text, tileId: text,
  frameStarted: count, frameRestored: count, renderSucceeded: Type.Boolean(),
  before: visualState, after: Type.Union([visualState, Type.Null()]), errors: Type.Array(text),
});
export const CaptureCleanupSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.capture-cleanup.v1"),
  key: text, ownerToken: text, resourcePrefix: text, phase: Type.Literal("restored"), frame: count,
  remainingObjects: Type.Literal(0), errors: Type.Array(text, { maxItems: 0 }),
});

const geometryBounds = Type.Object({ center: vector, size: vector });
const queryCounts = Type.Object({ all: count, scene: count, foreign: count });
const optionalId = Type.Union([integer, Type.Null()]);
export const CaptureGeometrySchema = Type.Object({
  schemaVersion: Type.Literal("compendium.capture-geometry.v1"),
  frame: count,
  scene: Type.Object({ nativeId: count, handle: integer, path: text, ready: Type.Boolean() }),
  frustum: geometryBounds,
  preloadEnvelope: Type.Object({ center: vector, radius: Type.Number({ minimum: 0 }) }),
  nativeNeedsPreload: Type.Boolean(),
  queries: Type.Object({ loaders: queryCounts, renderers: queryCounts, terrains: queryCounts }),
  sources: Type.Array(Type.Object({
    instanceId: integer, assetGuid: Type.Union([text, Type.Null()]), hierarchyPath: text,
    category: Type.Union([text, Type.Null()]), position: vector,
    activeSelf: Type.Boolean(), activeInHierarchy: Type.Boolean(), enabled: Type.Boolean(),
    coversEnvelope: Type.Boolean(), coversFrustum: Type.Boolean(), intersectsFrustum: Type.Boolean(),
    loadedOrLoading: Type.Boolean(), loaded: Type.Boolean(), loading: Type.Boolean(), hasHandle: Type.Boolean(),
    automaticLoadPending: Type.Boolean(),
    rootId: optionalId, rootActive: Type.Union([Type.Boolean(), Type.Null()]),
    holdUntil: number, loadDistance: number,
  })),
  meshes: Type.Array(Type.Object({
    rendererId: integer, kind: Type.Union([Type.Literal("mesh"), Type.Literal("skinned")]),
    meshId: optionalId, meshName: Type.Union([text, Type.Null()]), vertices: Type.Union([count, Type.Null()]),
    bounds: geometryBounds, intersectsFrustum: Type.Boolean(), sourceLoaderId: optionalId, materialIds: Type.Array(optionalId),
  })),
  terrains: Type.Array(Type.Object({
    instanceId: integer, dataId: optionalId, dataName: Type.Union([text, Type.Null()]),
    bounds: Type.Union([geometryBounds, Type.Null()]), heightmapResolution: Type.Union([count, Type.Null()]),
    sourceLoaderId: optionalId,
  })),
  otherRenderers: Type.Array(Type.Object({ instanceId: integer, type: text, bounds: geometryBounds, sourceLoaderId: optionalId })),
  issues: Type.Array(Type.Object({ kind: text, sourceId: integer, detail: text })),
});
export type CaptureGeometry = Static<typeof CaptureGeometrySchema>;
export const CaptureReadinessSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.capture-readiness.v1"),
  tileId: text, ownerToken: text, sceneNativeId: count, sceneHandle: integer,
  inventoryPath: text, inventorySha256: Type.String({ pattern: "^[a-f0-9]{64}$" }),
  observedFrames: Type.Array(count, { minItems: 2 }), stableFrames: count,
  requiredSources: count, excludedSources: count, empty: Type.Boolean(),
  streamKey: Type.Union([text, Type.Null()]),
});
export type CaptureReadiness = Static<typeof CaptureReadinessSchema>;
