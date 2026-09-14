import { Type, type Static } from "typebox";

const text = Type.String();
const integer = Type.Integer();
const count = Type.Integer({ minimum: 0 });
const number = Type.Number();
const boolean = Type.Boolean();
const nullableText = Type.Union([text, Type.Null()]);
const nullableInteger = Type.Union([integer, Type.Null()]);
const vector = Type.Object({ x: number, y: number, z: number });
const vector2 = Type.Object({ x: number, y: number });
const worldXZ = Type.Object({ x: number, z: number });
const quaternion = Type.Object({ x: number, y: number, z: number, w: number });
const bounds = Type.Object({ center: vector, size: vector });
const source = Type.Object({
  componentInstanceId: integer, gameObjectInstanceId: integer, transformInstanceId: integer,
  parentTransformInstanceId: nullableInteger, rootGameObjectInstanceId: integer, name: text,
  position: vector, rotation: quaternion, scale: vector, localScale: vector,
  isStatic: boolean, activeSelf: boolean, activeInHierarchy: boolean,
});
const collider = Type.Object({
  instanceId: integer, type: text, bounds, enabled: boolean, isTrigger: boolean,
  shape: Type.Union([
    Type.Object({ kind: Type.Literal("box"), center: vector, size: vector, worldCorners: Type.Array(vector, { minItems: 8, maxItems: 8 }) }),
    Type.Object({ kind: Type.Literal("sphere"), center: vector, radius: number, worldCenter: vector, worldRadius: number }),
    Type.Null(),
  ]),
});
const calibration = Type.Object({
  center: vector, size: vector2, extents: vector2, rotation: number,
  samples: Type.Array(Type.Object({ map: vector2, world: vector, roundTrip: vector2 }), { minItems: 5 }),
  playerNormalized: vector2, playerInside: boolean, playerProjected: vector,
});
export const MapGeometrySchema = Type.Object({
  schemaVersion: Type.Literal("compendium.map-geometry.v3"), frame: count,
  scene: Type.Object({ nativeId: count, path: text, name: text, handle: integer, buildIndex: integer }),
  coverage: Type.Object({ scope: Type.Literal("loaded-scene-observations"), completeGeometryCoverage: Type.Literal(false) }),
  queries: Type.Array(Type.Object({ nativeType: text, includeInactiveCount: count, sceneCount: count, foreignSceneCount: count })),
  navigationScope: text,
  player: source,
  mapZones: Type.Array(Type.Object({
    source, zoneId: integer,
    texture: Type.Union([Type.Object({ instanceId: integer, name: text, width: count, height: count }), Type.Null()]),
    collider: Type.Union([collider, Type.Null()]), calibration: Type.Union([calibration, Type.Null()]), error: nullableText,
  })),
  regions: Type.Array(Type.Object({ source, nativeId: nullableInteger, shape: text, colliders: Type.Array(collider) })),
  meshes: Type.Array(Type.Object({ instanceId: integer, name: text, vertices: count, bounds })),
  renderers: Type.Array(Type.Object({ source, type: text, enabled: boolean, isPartOfStaticBatch: boolean, bounds, meshInstanceId: nullableInteger })),
  terrains: Type.Array(Type.Object({ source, enabled: boolean, terrainData: Type.Union([Type.Object({ instanceId: integer, name: text, bounds, size: vector, heightmapResolution: count }), Type.Null()]) })),
  navigationSurfaces: Type.Array(Type.Object({
    source, implementation: Type.Union([Type.Literal("modern"), Type.Literal("legacy")]), enabled: boolean,
    agentTypeId: integer, collectObjects: text, center: vector, size: vector,
    navMeshData: Type.Union([Type.Object({ instanceId: integer, name: text, sourceBounds: bounds }), Type.Null()]),
  })),
  landmarks: Type.Array(Type.Object({
    kind: Type.Union([Type.Literal("player"), Type.Literal("authored-start"), Type.Literal("npc-producer"), Type.Literal("interaction")]),
    componentInstanceId: nullableInteger, nativeId: nullableInteger, position: vector,
    navigation: Type.Union([Type.Object({ position: vector, distance: number, areaMask: integer }), Type.Null()]),
  })),
  cameras: Type.Array(Type.Object({ source, sceneHandle: integer, isMain: boolean, enabled: boolean, orthographic: boolean, orthographicSize: number, fieldOfView: number, aspect: number, nearClip: number, farClip: number })),
});
export type MapGeometry = Static<typeof MapGeometrySchema>;

export const NavigationGeometrySchema = Type.Object({
  schemaVersion: Type.Literal("compendium.navigation-geometry.v2"), frame: count,
  vertexLayout: Type.Literal("world-xyz"), vertexCount: count, triangleCount: count,
  scene: Type.Object({ nativeId: count, path: text, name: text, handle: integer, buildIndex: integer }),
  scope: Type.Literal("all-loaded-navigation-data"), surfaceOwnership: Type.Literal("unresolved"),
  includesOffMeshLinks: Type.Literal(false), vertices: Type.Array(number), indices: Type.Array(count), areas: Type.Array(count),
});
export type NavigationGeometry = Static<typeof NavigationGeometrySchema>;

export const SceneCatalogSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.scene-catalog.v1"), buildId: Type.String({ minLength: 1 }),
  scenes: Type.Array(Type.Object({
    sourceKey: integer, nativeId: nullableInteger, entryName: nullableText, displayName: nullableText, sourceFieldPath: text,
    state: Type.Union([Type.Literal("matched"), Type.Literal("unmatched"), Type.Literal("ambiguous"), Type.Literal("unavailable")]),
    buildMatches: Type.Array(Type.Object({ buildIndex: integer, path: text })),
  })),
  buildScenes: Type.Array(Type.Object({ buildIndex: integer, path: nullableText, pathError: nullableText, nativeIds: Type.Array(integer) })),
  summary: Type.Object({ databaseScenes: count, matchedScenes: count, unmatchedScenes: count, ambiguousScenes: count, unavailableScenes: count, buildScenes: count, unclaimedBuildScenes: count, sharedBuildScenes: count }),
});
export type SceneCatalog = Static<typeof SceneCatalogSchema>;

export const NativeMapTransformSchema = Type.Object({
  origin: vector, mapXAxis: worldXZ, mapYAxis: worldXZ,
  inverse: Type.Object({ xx: number, xz: number, yx: number, yz: number }),
  maxWorldResidual: number, maxNormalizedResidual: number,
});
export type NativeMapTransform = Static<typeof NativeMapTransformSchema>;
const registration = { scope: Type.Literal("native-coordinate-registration"), sourceComponentInstanceId: integer, zoneId: integer };
export const NativeMapRegistrationSchema = Type.Union([
  Type.Object({ ...registration, state: Type.Literal("verified"), transform: NativeMapTransformSchema, issues: Type.Array(text, { maxItems: 0 }) }),
  Type.Object({ ...registration, state: Type.Literal("unresolved"), transform: Type.Null(), issues: Type.Array(text, { minItems: 1 }) }),
]);
export type NativeMapRegistration = Static<typeof NativeMapRegistrationSchema>;
export const NativeMapRegistrationSetSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.native-map-registrations.v1"), buildId: Type.String({ minLength: 1 }),
  scene: MapGeometrySchema.properties.scene,
  source: Type.Object({ path: Type.String({ minLength: 1 }), sha256: Type.String({ pattern: "^[0-9a-f]{64}$" }) }),
  registrations: Type.Array(NativeMapRegistrationSchema),
});
export type NativeMapRegistrationSet = Static<typeof NativeMapRegistrationSetSchema>;
