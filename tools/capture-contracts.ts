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
export const CapturePlanSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.capture-plan.v1"),
  sceneNativeId: count, scenePath: text, mapSpaceId: text, floorId: Type.Union([text, Type.Null()]),
  width: Type.Integer({ minimum: 64, maximum: 2048 }), height: Type.Integer({ minimum: 64, maximum: 2048 }),
  cullingMask: Type.Integer({ minimum: -2147483648, maximum: 2147483647 }),
  lighting: Type.Object({ ambient: color, directionalIntensity: Type.Number({ minimum: 0, maximum: 4 }), directionalEuler: vector }),
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
