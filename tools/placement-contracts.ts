import { Type, type Static } from "typebox";

const text = Type.String({ minLength: 1 });
const integer = Type.Integer();
const count = Type.Integer({ minimum: 0 });
const pathId = Type.String({ pattern: "^-?[1-9][0-9]*$" });
const nullablePathId = Type.Union([pathId, Type.Null()]);
const nullableInteger = Type.Union([integer, Type.Null()]);
const nullableText = Type.Union([text, Type.Null()]);
const vector = Type.Object({ x: Type.Number(), y: Type.Number(), z: Type.Number() });
const rotation = Type.Object({ x: Type.Number(), y: Type.Number(), z: Type.Number(), w: Type.Number() });
const file = Type.Object({ path: text, sha256: Type.String({ pattern: "^[a-f0-9]{64}$" }), bytes: count });

export const SerializedAssetIndexSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.serialized-assets.v1"),
  source: Type.Object({ path: text, sha256: file.properties.sha256, bytes: count, serializedFile: text, unityVersion: text, scenePath: nullableText, buildIndex: nullableInteger, assetName: nullableText }),
  parser: Type.Object({ name: Type.Literal("UnityPy"), version: text }),
  dependencies: Type.Array(file),
  rootGameObjectPathId: nullablePathId,
  totals: Type.Object({ objects: count, gameObjects: count, transforms: count, monoBehaviours: count, attachedMonoBehaviours: count, unboundMonoBehaviours: count, nullScripts: count }),
  objects: Type.Array(Type.Object({
    pathId,
    name: Type.String(),
    activeSelf: Type.Boolean(),
    transform: Type.Object({ pathId, parentPathId: nullablePathId, children: Type.Array(pathId), localPosition: vector, localRotation: rotation, localScale: vector }),
    components: Type.Array(Type.Union([Type.Object({ pathId, classId: integer, typeName: nullableText, assembly: nullableText }), Type.Null()])),
  })),
});
export type SerializedAssetIndex = Static<typeof SerializedAssetIndexSchema>;

export const PlacementSnapshotSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.placement-snapshot.v1"),
  frame: count,
  context: Type.Object({
    character: text,
    gameSceneNativeId: Type.Integer({ minimum: 0 }),
    scene: Type.Object({ path: text, name: text, handle: integer, buildIndex: integer, isLoaded: Type.Boolean() }),
    sceneInitialized: Type.Boolean(),
    sceneLoading: Type.Boolean(),
    sceneReadyHolds: Type.Boolean(),
  }),
  queries: Type.Array(Type.Object({ typeName: text, nativeCount: count, componentInstanceIds: Type.Array(integer) })),
  nodes: Type.Array(Type.Object({
    instanceId: integer,
    sceneHandle: integer,
    name: Type.String(),
    parentInstanceId: nullableInteger,
    siblingIndex: count,
    localPosition: vector,
    localRotation: rotation,
    localScale: vector,
    position: vector,
    activeSelf: Type.Boolean(),
    activeInHierarchy: Type.Boolean(),
  })),
  components: Type.Array(Type.Object({
    instanceId: integer,
    gameObjectInstanceId: integer,
    typeName: text,
    assembly: text,
    componentIndex: count,
    enabled: Type.Union([Type.Boolean(), Type.Null()]),
  })),
  streams: Type.Array(Type.Object({
    componentInstanceId: integer,
    assetGuid: nullableText,
    loadedRootInstanceId: nullableInteger,
    isLoaded: Type.Boolean(),
    isLoading: Type.Boolean(),
    hasInstanceHandle: Type.Boolean(),
    enabled: Type.Boolean(),
    loadDistance: Type.Number(),
    unloadDistance: Type.Number(),
    holdUntil: Type.Number(),
    rendererInstanceIds: Type.Array(integer),
  })),
});
export type PlacementSnapshot = Static<typeof PlacementSnapshotSchema>;

export const PlacementIdentityResultSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.placement-identities.v1"),
  buildId: text,
  sceneNativeId: count,
  scenePath: text,
  snapshotFrame: count,
  identities: Type.Array(Type.Object({
    componentInstanceId: integer,
    gameObjectInstanceId: integer,
    placementId: text,
    sourceId: text,
    origin: Type.Union([Type.Literal("scene"), Type.Literal("streamed-prefab")]),
    sceneSourceSha256: file.properties.sha256,
    sourceSha256: file.properties.sha256,
    serializedFile: text,
    gameObjectPathId: pathId,
    componentPathId: pathId,
    loaderSourceId: nullableText,
    typeName: text,
    assembly: text,
    position: vector,
  })),
  unresolved: Type.Array(Type.Object({
    componentInstanceId: integer,
    gameObjectInstanceId: integer,
    reason: Type.Union([Type.Literal("foreign-scene"), Type.Literal("missing-serialized-source"), Type.Literal("ambiguous-serialized-source"), Type.Literal("component-mismatch"), Type.Literal("unresolved-loader"), Type.Literal("missing-prefab-index"), Type.Literal("duplicate-placement-binding")]),
    detail: text,
    candidates: Type.Array(pathId),
  })),
});
export type PlacementIdentityResult = Static<typeof PlacementIdentityResultSchema>;
