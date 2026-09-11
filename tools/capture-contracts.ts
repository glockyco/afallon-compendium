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
const sha256 = Type.String({ pattern: "^[a-f0-9]{64}$" });
// A reviewed cut follows the walkable surface. The tile's walkable height field, rasterized
// from the hashed navigation survey, picks per pixel the slice whose cut sits just above the
// surface plus headroom. Without a cut, the tile renders with its declared frame.
export const CaptureCutSchema = Type.Object({
  source: Type.Literal("navigation"),
  survey: Type.Object({ path: text, sha256 }),
  step: Type.Number({ exclusiveMinimum: 0, maximum: 64 }),
  headroom: Type.Number({ minimum: 0, maximum: 64 }),
  cameraAbove: Type.Number({ exclusiveMinimum: 0, maximum: 2000 }),
});
export type CaptureCut = Static<typeof CaptureCutSchema>;
// Per-tile evidence of the cut applied to it. The cut heights are the rendered slices; the
// walkable range is what the survey holds under the tile. A tile without a cut records null.
const cutEvidence = Type.Union([
  Type.Null(),
  Type.Object({
    source: Type.Literal("navigation"),
    surveySha256: sha256,
    step: number, headroom: number,
    walkable: Type.Object({ minY: number, maxY: number, coverage: Type.Number({ minimum: 0, maximum: 1 }) }),
    cutHeights: Type.Array(number, { minItems: 1, maxItems: 256 }),
  }),
]);
export type CaptureCutEvidence = Static<typeof cutEvidence>;
export const CaptureReadinessProfileSchema = Type.Object({
  timeoutMs: Type.Integer({ minimum: 1000, maximum: 300000 }),
  stableFrames: Type.Integer({ minimum: 2, maximum: 10 }),
  boundaryOverlap: Type.Number({ minimum: 0, maximum: 1000 }),
  maximumSources: Type.Integer({ minimum: 1, maximum: 256 }),
});
export const CapturePlanSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.capture-plan.v6"),
  sceneNativeId: count, scenePath: text, mapSpaceId: text,
  cut: Type.Optional(CaptureCutSchema),
  width: Type.Integer({ minimum: 64, maximum: 2048 }), height: Type.Integer({ minimum: 64, maximum: 2048 }),
  cullingMask: Type.Integer({ minimum: -2147483648, maximum: 2147483647 }),
  // Reviewed capture suppression. Afallon marks foliage with no layer or tag, so a shader-name
  // prefix identifies renderers to hide during capture; terrainTrees hides terrain-instanced
  // trees and details. Both are restored after every tile.
  suppression: Type.Object({
    shaderFamilies: Type.Array(text, { maxItems: 32 }),
    terrainTrees: Type.Boolean(),
  }),
  lighting: Type.Object({ ambient: color, directionalIntensity: Type.Number({ minimum: 0, maximum: 4 }), directionalEuler: vector }),
  readiness: CaptureReadinessProfileSchema,
  tiles: Type.Array(Type.Object({
    id: Type.String({ pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$", maxLength: 80 }),
    frame,
  }), { minItems: 1, maxItems: 64 }),
});
export type CapturePlan = Static<typeof CapturePlanSchema>;

const capture = Type.Object({
  tileId: text, path: text, sha256: Type.String({ pattern: "^[a-f0-9]{64}$" }), byteSize: count,
  width: count, height: count, frame: count, restoredFrame: count,
  renderTexturesBefore: Type.Array(Type.Object({ instanceId: integer, name: Type.String(), width: count, height: count, depth: count, created: Type.Boolean(), owned: Type.Boolean() })),
  renderTexturesAfter: Type.Array(Type.Object({ instanceId: integer, name: Type.String(), width: count, height: count, depth: count, created: Type.Boolean(), owned: Type.Boolean() })),
  lightingRestored: Type.Literal(true), suppressionRestored: Type.Literal(true), activeTargetRestored: Type.Literal(true),
  suppressedRenderers: count, visualPolicy: Type.Literal("compendium.capture-visual-policy.v3"),
  cameraFrame: frame,
  projectionSamples: Type.Array(Type.Object({ world: vector, viewport: vector }), { minItems: 3 }),
  // Every rendered slice of the tile, nearest-plane first. A tile without a cut has one slice.
  slices: Type.Array(Type.Object({ index: count, cut: number, path: text, sha256, byteSize: count }), { minItems: 1, maxItems: 256 }),
});
export const CaptureSessionSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.capture-session.v5"),
  key: text, phase: Type.Union([Type.Literal("ready"), Type.Literal("restored")]),
  ownerToken: text, sceneNativeId: count, scenePath: text, sceneHandle: integer,
  resourcePrefix: text,
  resources: Type.Array(Type.Object({ kind: text, instanceId: Type.Union([integer, Type.Null()]), alive: Type.Boolean() })),
  completedCaptures: count,
  lastCapture: Type.Union([capture, Type.Null()]),
});
export type CaptureSession = Static<typeof CaptureSessionSchema>;
export const CaptureRasterSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.capture-raster.v4"),
  tileId: text, imageSha256: Type.String({ pattern: "^[a-f0-9]{64}$" }),
  width: Type.Integer({ minimum: 1 }), height: Type.Integer({ minimum: 1 }),
  coordinateSystem: Type.Literal("source-scene-world-xz"),
  pixelConvention: Type.Literal("top-left-edges"),
  cameraFrame: frame,
  cut: cutEvidence,
  verticalBounds: Type.Object({ minY: number, maxY: number }),
  worldFromPixelEdge: Type.Object({ origin: horizontal, xAxis: horizontal, yAxis: horizontal }),
  maximumProjectionErrorPixels: Type.Number({ minimum: 0, maximum: 0.25 }),
});
export type CaptureRaster = Static<typeof CaptureRasterSchema>;
const rgba = Type.Object({ r: number, g: number, b: number, a: number });
const enabledState = Type.Object({ instanceId: integer, enabled: Type.Boolean() });
const visualState = Type.Object({
  fog: Type.Boolean(), ambientMode: integer,
  ambientLight: rgba, ambientSky: rgba, ambientEquator: rgba, ambientGround: rgba,
  ambientIntensity: number, ambientProbe: Type.Array(number, { minItems: 27, maxItems: 27 }),
  reflectionIntensity: number, sunInstanceId: Type.Union([integer, Type.Null()]),
  activeTargetInstanceId: Type.Union([integer, Type.Null()]), lightEnabled: Type.Boolean(),
  lightInstanceId: integer, lightIntensity: number, lightColor: rgba,
  renderers: Type.Array(enabledState), lights: Type.Array(enabledState), projectors: Type.Array(enabledState),
  retainedParticles: Type.Array(enabledState),
  highlights: Type.Array(Type.Object({ instanceId: integer, cameraMask: integer })),
});
export const CaptureRestorationSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.capture-restoration.v4"), key: text, tileId: text,
  visualPolicy: Type.Literal("compendium.capture-visual-policy.v3"),
  colorSpace: Type.Union([Type.Literal("Gamma"), Type.Literal("Linear")]),
  frameStarted: count, frameRestored: count, renderSucceeded: Type.Boolean(),
  selections: Type.Array(Type.Object({ kind: text, instanceId: integer, reason: text })),
  lightingInputs: Type.Array(Type.Object({ instanceId: integer, type: integer, enabled: Type.Boolean(), active: Type.Boolean(), color: rgba, intensity: number, range: number, cullingMask: integer, position: vector })),
  before: visualState, during: Type.Union([visualState, Type.Null()]), after: Type.Union([visualState, Type.Null()]), errors: Type.Array(text),
});
export const CaptureCleanupSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.capture-cleanup.v1"),
  key: text, ownerToken: text, resourcePrefix: text, phase: Type.Literal("restored"), frame: count,
  remainingObjects: Type.Literal(0), errors: Type.Array(text, { maxItems: 0 }),
});

const sweepArtifactReference = Type.Object({ path: text, bytes: count, sha256: Type.String({ pattern: "^[a-f0-9]{64}$" }) });
export const CaptureSweepSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.capture-sweep.v3"),
  runId: text,
  ownerToken: text,
  finalScene: Type.Object({ nativeId: count, path: text }),
  plans: Type.Array(Type.Object({
    runId: text, manifestPath: text, manifestSha256: Type.String({ pattern: "^[a-f0-9]{64}$" }),
    sceneNativeId: count, scenePath: text, mapSpaceId: text,
  }), { minItems: 1 }),
  sceneTransitions: Type.Array(sweepArtifactReference, { minItems: 1 }),
  runtimeCleanup: sweepArtifactReference,
  completed: Type.Literal(true),
});
export type CaptureSweep = Static<typeof CaptureSweepSchema>;

const geometryBounds = Type.Object({ center: vector, size: vector });
const queryCounts = Type.Object({ all: count, scene: count, foreign: count });
const optionalId = Type.Union([integer, Type.Null()]);
export const CaptureGeometrySchema = Type.Object({
  schemaVersion: Type.Literal("compendium.capture-geometry.v3"),
  visualPolicy: Type.Literal("compendium.capture-visual-policy.v3"),
  excludedRenderers: Type.Array(Type.Object({ instanceId: integer, reason: text })),
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
  schemaVersion: Type.Literal("compendium.capture-readiness.v3"),
  tileId: text, ownerToken: text, sceneNativeId: count, sceneHandle: integer,
  inventoryPath: text, inventorySha256: Type.String({ pattern: "^[a-f0-9]{64}$" }),
  observedFrames: Type.Array(count, { minItems: 2 }), stableFrames: count,
  requiredSources: count, excludedSources: count, empty: Type.Boolean(),
  captureFrame: frame,
  cut: cutEvidence,
  streamKey: Type.Union([text, Type.Null()]),
});
export type CaptureReadiness = Static<typeof CaptureReadinessSchema>;

const artifactReference = Type.Object({ path: text, bytes: count, sha256 });
const uuid = Type.String({ pattern: "^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$" });
const captureTileOrigin = Type.Object({ runId: uuid, ownerToken: uuid, captureKey: text });
const captureTileArtifacts = Type.Object({
  image: artifactReference,
  raster: artifactReference,
  readiness: artifactReference,
  restoration: artifactReference,
  nativeContext: Type.Array(artifactReference, { minItems: 1 }),
});
export const CaptureTileCheckpointSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.capture-tile-checkpoint.v1"),
  tileId: text,
  compatibilityKey: sha256,
  artifacts: captureTileArtifacts,
  origin: captureTileOrigin,
});
export type CaptureTileCheckpoint = Static<typeof CaptureTileCheckpointSchema>;

const captureSetTile = Type.Object({
  id: text,
  compatibilityKey: sha256,
  status: Type.Union([Type.Literal("captured"), Type.Literal("reused")]),
  artifacts: captureTileArtifacts,
  origin: captureTileOrigin,
});
export const CaptureSetSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.capture-set.v2"),
  buildId: text,
  sceneNativeId: count,
  scenePath: text,
  mapSpaceId: text,
  width: Type.Integer({ minimum: 1 }),
  height: Type.Integer({ minimum: 1 }),
  expectedTiles: Type.Array(text, { minItems: 1 }),
  tiles: Type.Array(captureSetTile, { minItems: 1 }),
  completeImagery: Type.Literal(false),
});
export type CaptureSet = Static<typeof CaptureSetSchema>;
