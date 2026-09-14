import { Type, type Static, type TSchema } from "typebox";
import { CanonicalSchema, type Canonical } from "./database";

const integer = Type.Integer();
const number = Type.Number();
const boolean = Type.Boolean();
const text = Type.String();
const nullableText = Type.Union([text, Type.Null()]);
const nullableInteger = Type.Union([integer, Type.Null()]);
const nullableNumber = Type.Union([number, Type.Null()]);
const nullableBoolean = Type.Union([boolean, Type.Null()]);

function nullable<T extends TSchema>(schema: T) {
  return Type.Union([schema, Type.Null()]);
}

const vector2 = Type.Object({ x: number, y: number });
const vector3 = Type.Object({ x: number, y: number, z: number });
const hierarchyNode = Type.Object({ name: text, siblingIndex: integer });
const disposition = Type.Union([
  Type.Literal("extracted"),
  Type.Literal("unreachable"),
  Type.Literal("unused"),
  Type.Literal("unsupported"),
  Type.Literal("failed"),
  Type.Literal("currently-loaded"),
  Type.Literal("not-traversed"),
]);

const sceneEvidence = Type.Object({
  name: text,
  path: text,
  buildIndex: integer,
  handle: integer,
  isLoaded: boolean,
  rootCount: integer,
  currentGameSceneNativeId: nullableInteger,
  nativeIdMatchBasis: nullableText,
});
const coverageScene = Type.Object({
  name: text,
  path: text,
  buildIndex: integer,
  handle: integer,
  isLoaded: Type.Literal(true),
  rootCount: integer,
  currentGameSceneNativeId: nullableInteger,
  nativeIdMatchBasis: nullableText,
});
const currentGameScene = Type.Object({
  nativeId: integer,
  name: nullableText,
  internalName: nullableText,
  fileName: nullableText,
  entryDisplayName: nullableText,
  entryDescription: nullableText,
});

const coverage = Type.Object({
  dispositionValues: Type.Array(disposition),
  fullGameCoverage: Type.Literal(false),
  label: text,
  scope: text,
  includesInactiveComponents: Type.Literal(true),
  includesLoadedAddressableLoaderComponents: Type.Literal(true),
  traversalPerformed: Type.Literal(false),
  capturePerformed: Type.Literal(false),
  publicationPerformed: Type.Literal(false),
  activeScene: coverageScene,
  currentGameScene: nullable(currentGameScene),
  currentGameSceneError: nullableText,
  noDisplayNameSceneMapping: Type.Literal(true),
  noNameBasedUnreachableClaims: Type.Literal(true),
});
const runtime = Type.Object({
  game: text,
  version: text,
  unityVersion: text,
  activeScene: text,
  activeScenePath: text,
  buildSceneCount: integer,
  loadedSceneCount: integer,
  databaseAvailable: Type.Literal(true),
  databaseError: nullableText,
});

const buildOwner = Type.Object({
  nativeType: text,
  collection: text,
  index: integer,
});
const dictionaryOwner = Type.Object({
  nativeType: text,
  dictionary: text,
  sourceKey: integer,
});
const dictionaryNativeOwner = Type.Object({
  nativeType: text,
  dictionary: text,
  sourceKey: integer,
  nativeId: nullableInteger,
});
const queryOwner = Type.Object({ nativeType: text, query: text });
const componentOwner = Type.Union([
  Type.Object({
    runtimeType: text,
    observationIndex: integer,
    gameObjectName: text,
    hierarchyPath: text,
    hierarchyNodes: Type.Array(hierarchyNode),
    hierarchyDepth: integer,
    hierarchyPathTruncated: boolean,
    scene: sceneEvidence,
    position: vector3,
    activeSelf: boolean,
    activeInHierarchy: boolean,
    enabled: boolean,
  }),
  Type.Object({ runtimeType: text, observationIndex: integer, unavailable: text }),
]);

const sceneManagerRecord = Type.Object({
  name: nullableText,
  path: nullableText,
  buildIndex: integer,
  handle: integer,
  isLoaded: boolean,
  rootCount: integer,
});
const buildScene = Type.Object({
  sourceFieldPath: text,
  owner: buildOwner,
  disposition,
  buildIndex: integer,
  path: nullableText,
  pathError: nullableText,
  sceneManager: nullable(sceneManagerRecord),
  sceneManagerError: nullableText,
  exactPathLoadedEvidence: nullableText,
});

const sceneFields = Type.Object({
  ID: integer,
  entryName: nullableText,
  entryFileName: nullableText,
  entryDisplayName: nullableText,
  entryDescription: nullableText,
  legacyName: nullableText,
  legacyFileName: nullableText,
  legacyDisplayName: nullableText,
  legacyDescription: nullableText,
  loadingBGKey: nullableText,
  minimapImageKey: nullableText,
  mapBounds: Type.Object({ center: vector3, size: vector3, extents: vector3 }),
  mapSize: vector2,
  startPositionID: integer,
  isProceduralScene: boolean,
  SpawnPointName: nullableText,
  AlwaysSpawnAtPoint: boolean,
  includedInAdventureGuide: boolean,
  DungeonLevelMin: integer,
  DungeonLevelMax: integer,
  ZoneScalingMinLevel: integer,
  ZoneScalingMaxLevel: integer,
  adventureGuideImageKey: nullableText,
  adventureGuideDescription: nullableText,
  regionCount: integer,
  adventureGuideBossCount: integer,
});
const databaseScene = Type.Union([
  Type.Object({
    sourceFieldPath: text,
    owner: dictionaryOwner,
    sourceKey: integer,
    nativeId: integer,
    disposition,
    reachabilityEvidence: text,
    fields: sceneFields,
  }),
  Type.Object({
    sourceFieldPath: text,
    owner: dictionaryOwner,
    sourceKey: integer,
    nativeId: Type.Null(),
    disposition,
    unavailable: text,
  }),
]);

const loadedScene = Type.Object({
  sourceFieldPath: text,
  owner: buildOwner,
  disposition,
  scene: sceneEvidence,
});

const gameSceneReference = Type.Object({
  sourceKey: integer,
  nativeId: integer,
  entryName: nullableText,
  entryFileName: nullableText,
  entryDisplayName: nullableText,
  position: vector3,
  matchBasis: text,
});
const projectedScene = Type.Object({
  sourceKey: integer,
  nativeId: integer,
  name: nullableText,
  internalName: nullableText,
  fileName: nullableText,
  matchBasis: text,
});
const typedScene = Type.Object({
  nativeId: integer,
  name: nullableText,
  internalName: nullableText,
  fileName: nullableText,
  entryDisplayName: nullableText,
  entryDescription: nullableText,
});
const typedSceneDestination = Type.Object({
  typed: typedScene,
  databaseRecord: nullable(projectedScene),
  databaseRecordMatchBasis: nullableText,
});
const worldPosition = Type.Object({
  nativeId: integer,
  entryName: nullableText,
  entryFileName: nullableText,
  entryDisplayName: nullableText,
  legacyName: nullableText,
  legacyFileName: nullableText,
  displayName: nullableText,
  position: vector3,
  useRotation: boolean,
  rotation: vector3,
});

const gameSceneStartReference = Type.Object({
  sourceFieldPath: text,
  owner: dictionaryNativeOwner,
  sourceKey: integer,
  ownerNativeId: integer,
  destinationType: Type.Literal("gameScene.startPositionID"),
  targetNativeId: integer,
  disposition,
  referenceStatus: text,
  destination: nullable(gameSceneReference),
  destinationScene: Type.Null(),
  resolutionEvidence: text,
});
const worldPositionReference = Type.Object({
  sourceFieldPath: text,
  owner: dictionaryNativeOwner,
  sourceKey: integer,
  nativeId: integer,
  destinationType: Type.Literal("worldPosition"),
  disposition,
  referenceStatus: Type.Literal("typed-position-without-scene-field"),
  target: worldPosition,
  destination: Type.Null(),
  destinationScene: Type.Null(),
  sceneResolution: Type.Object({ status: Type.Literal("unsupported"), reason: text }),
});
const taskType = Type.Object({ value: integer, name: text });
const taskReference = Type.Union([
  Type.Object({
    sourceFieldPath: text,
    owner: dictionaryNativeOwner,
    sourceKey: integer,
    ownerNativeId: integer,
    destinationType: Type.Literal("task.sceneName"),
    taskType,
    disposition,
    referenceStatus: text,
    rawSceneName: nullableText,
    destination: nullable(projectedScene),
    destinationScene: nullable(projectedScene),
    resolutionEvidence: text,
  }),
  Type.Object({
    sourceFieldPath: text,
    owner: dictionaryNativeOwner,
    sourceKey: integer,
    ownerNativeId: Type.Null(),
    destinationType: Type.Literal("task.sceneName"),
    disposition,
    referenceStatus: Type.Literal("null-task-record"),
    rawSceneName: Type.Null(),
    destination: Type.Null(),
    destinationScene: Type.Null(),
  }),
]);

const transition = Type.Union([
  Type.Object({
    sourceFieldPath: text,
    owner: componentOwner,
    transitionType: Type.Literal("questScenePortal"),
    disposition,
    destinationDisposition: disposition,
    destinationType: Type.Literal("sceneName"),
    rawDestination: nullableText,
    destination: nullable(projectedScene),
    destinationScene: nullable(projectedScene),
    resolutionEvidence: text,
  }),
  Type.Object({
    sourceFieldPath: text,
    owner: Type.Object({ runtimeType: text, observationIndex: integer, unavailable: text }),
    transitionType: Type.Literal("questScenePortal"),
    disposition,
    destinationDisposition: Type.Literal("unsupported"),
    destinationType: Type.Literal("sceneName"),
    rawDestination: Type.Null(),
    destination: Type.Null(),
    destinationScene: Type.Null(),
    unavailable: text,
  }),
  Type.Object({
    sourceFieldPath: text,
    owner: componentOwner,
    transitionType: Type.Literal("dungeonEntranceTrigger"),
    disposition,
    destinationDisposition: disposition,
    destinationType: Type.Literal("typedRPGGameScene"),
    destination: nullable(typedSceneDestination),
    destinationScene: nullable(typedSceneDestination),
    resolutionEvidence: text,
  }),
  Type.Object({
    sourceFieldPath: text,
    owner: Type.Object({ runtimeType: text, observationIndex: integer, unavailable: text }),
    transitionType: Type.Literal("dungeonEntranceTrigger"),
    disposition,
    destinationDisposition: Type.Literal("unsupported"),
    destinationType: Type.Literal("typedRPGGameScene"),
    destination: Type.Null(),
    destinationScene: Type.Null(),
    unavailable: text,
  }),
]);

const referencedDestination = Type.Union([gameSceneStartReference, worldPositionReference, taskReference, transition]);

const addressableEvidence = Type.Object({
  loaderComponent: Type.Literal("currently-loaded"),
  addressableAsset: Type.Object({
    AssetGUID: nullableText,
    RuntimeKey: nullableText,
    RuntimeKeyType: nullableText,
    RuntimeKeyIsValid: nullableBoolean,
  }),
  loadedOrLoading: nullableBoolean,
  loadedStateError: nullableText,
});
const addressableSettings = Type.Object({
  sourceFieldPath: text,
  loadDistance: number,
  unloadHysteresis: number,
  showEditorPreview: boolean,
  ParentsUnderLoader: nullableBoolean,
  UnloadDistance: nullableNumber,
  parentsUnderLoaderError: nullableText,
  unloadDistanceError: nullableText,
});
const addressableSource = Type.Union([
  Type.Object({
    sourceFieldPath: text,
    owner: componentOwner,
    sourceKey: nullableText,
    assetGuid: nullableText,
    runtimeKey: nullableText,
    runtimeKeyType: nullableText,
    runtimeKeyIsValid: nullableBoolean,
    assetReferenceAvailable: boolean,
    keyDisposition: text,
    disposition,
    evidence: addressableEvidence,
    settings: addressableSettings,
    category: nullableText,
    categoryError: nullableText,
    activeSelf: nullableBoolean,
    activeInHierarchy: nullableBoolean,
    componentEnabled: boolean,
  }),
  Type.Object({
    sourceFieldPath: text,
    owner: Type.Object({ runtimeType: text, observationIndex: integer, unavailable: text }),
    sourceKey: Type.Null(),
    disposition,
    unavailable: text,
  }),
]);

const componentFamily = Type.Object({
  sourceFieldPath: text,
  owner: queryOwner,
  family: text,
  runtimeType: text,
  disposition,
  activeCount: integer,
  includeInactiveCount: integer,
  activeQueryError: nullableText,
  includeInactiveQueryError: nullableText,
  includesInactive: Type.Literal(true),
});
const behaviourType = Type.Object({ nativeType: text, includeInactiveCount: integer, activeCount: integer });

const diagnostic = Type.Object({
  kind: text,
  sourceFieldPath: text,
  ownerNativeId: Type.Optional(nullableInteger),
  sourceKey: Type.Optional(integer),
  buildIndex: Type.Optional(integer),
  runtimeType: Type.Optional(text),
  transitionType: Type.Optional(text),
  rawDestination: Type.Optional(nullableText),
  rawSceneName: Type.Optional(nullableText),
  detail: text,
});
const totals = Type.Object({
  buildScenes: integer,
  databaseScenes: integer,
  worldPositions: integer,
  gameSceneStartPositionReferences: integer,
  taskSceneReferences: integer,
  loadedScenes: integer,
  addressableSources: integer,
  loadedTransitions: integer,
  referencedDestinations: integer,
  componentFamilies: integer,
  behaviourTypes: integer,
  behaviourComponents: integer,
});

export const WorldInventorySchema = Type.Object({
  schemaVersion: Type.Literal("compendium.world-inventory.v2"),
  coverage,
  runtime,
  buildScenes: Type.Array(buildScene),
  databaseScenes: Type.Array(databaseScene),
  referencedDestinations: Type.Array(referencedDestination),
  transitions: Type.Array(transition),
  loadedScenes: Type.Array(loadedScene),
  addressableSources: Type.Array(addressableSource),
  componentFamilies: Type.Array(componentFamily),
  behaviourTypes: Type.Array(behaviourType),
  sourceTotals: totals,
  exportedTotals: totals,
  unresolved: Type.Array(diagnostic),
});
export type WorldInventory = Static<typeof WorldInventorySchema>;
