import { Assert, AssertError } from "typebox/value";
import { Type, type Static, type TSchema } from "typebox";
import { CanonicalSchema, type Canonical } from "./contracts";

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

type AnyRecord = Record<string, any>;
type Diagnostic = { kind: string; sourceFieldPath: string; detail: string };
type Totals = WorldInventory["sourceTotals"];
type WorldPositionReference = Extract<WorldInventory["referencedDestinations"][number], { destinationType: "worldPosition" }>;

function assertContract<T extends TSchema>(schema: T, value: unknown, label: string): void {
  try {
    Assert(schema, value);
  } catch (error) {
    if (error instanceof AssertError) throw new Error(`${label} does not match its schema.`, { cause: error.cause.errors });
    throw error;
  }
}

function addDiagnostic(diagnostics: Diagnostic[], seen: Set<string>, kind: string, sourceFieldPath: string, detail: string) {
  const key = `${kind}\u0000${sourceFieldPath}\u0000${detail}`;
  if (seen.has(key)) return;
  seen.add(key);
  diagnostics.push({ kind, sourceFieldPath, detail });
}

function uniqueSourcePaths(rows: readonly AnyRecord[], collection: string): void {
  const paths = new Set<string>();
  for (const row of rows) {
    if (paths.has(row.sourceFieldPath)) throw new Error(`Duplicate ${collection} source identity: ${row.sourceFieldPath}`);
    paths.add(row.sourceFieldPath);
  }
}

function finiteCount(value: number, path: string): number {
  if (!Number.isInteger(value)) throw new Error(`Invalid count at ${path}: ${value}`);
  return value;
}

function checkCount(
  actual: number,
  sourceValue: number,
  exportedValue: number,
  path: string,
) {
  finiteCount(sourceValue, `sourceTotals.${path}`);
  finiteCount(exportedValue, `exportedTotals.${path}`);
  if (exportedValue < 0) throw new Error(`Exported total cannot be negative at ${path}: ${exportedValue}`);
  if (sourceValue < 0) {
    throw new Error(`World inventory native source count is unavailable for ${path}.`);
  } else if (sourceValue !== actual) {
    throw new Error(`World inventory source total does not reconcile for ${path}: native ${sourceValue}, actual ${actual}.`);
  }
  if (exportedValue !== actual) {
    throw new Error(`World inventory exported total does not reconcile for ${path}: exported ${exportedValue}, actual ${actual}.`);
  }
}

function projectedSceneId(value: unknown, path: string): number | null {
  if (value === null) return null;
  const row = value as AnyRecord;
  if (!Number.isInteger(row.nativeId)) throw new Error(`Invalid scene identity at ${path}.`);
  return row.nativeId;
}

function checkSceneReference(
  value: unknown,
  path: string,
  canonicalScenes: Map<number, Canonical["scenes"][number]>,
  diagnostics: Diagnostic[],
  seen: Set<string>,
): number | null {
  const id = projectedSceneId(value, path);
  if (id === null) return null;
  if (id < 0) throw new Error(`Negative asserted scene identity at ${path}: ${id}.`);
  const canonical = canonicalScenes.get(id);
  if (!canonical) throw new Error(`Scene reference at ${path} points to canonical scene ${id}, which is absent.`);
  const row = value as AnyRecord;
  if (row.internalName !== canonical.internalName || (row.sourceKey !== undefined && row.sourceKey !== canonical.sourceKey)) throw new Error(`Scene reference at ${path} disagrees with canonical scene ${id}.`);
  return id;
}

function checkScenePair(
  first: unknown,
  second: unknown,
  path: string,
  canonicalScenes: Map<number, Canonical["scenes"][number]>,
  diagnostics: Diagnostic[],
  seen: Set<string>,
) {
  const firstId = checkSceneReference(first, `${path}.destination`, canonicalScenes, diagnostics, seen);
  const secondId = checkSceneReference(second, `${path}.destinationScene`, canonicalScenes, diagnostics, seen);
  if (firstId !== null && secondId !== null && firstId !== secondId) throw new Error(`Mismatched destination scene identities at ${path}.`);
  if ((firstId === null) !== (secondId === null)) throw new Error(`Destination and destinationScene disagree on availability at ${path}.`);
}

function checkDatabaseSceneIdentities(inventory: WorldInventory, canonical: Canonical): Map<number, Canonical["scenes"][number]> {
  const canonicalScenes = new Map<number, Canonical["scenes"][number]>();
  for (const row of canonical.scenes) {
    if (row.nativeId < 0 || row.sourceKey < 0 || row.sourceKey !== row.nativeId || canonicalScenes.has(row.nativeId)) throw new Error(`Invalid canonical scene identity: ${row.nativeId}.`);
    canonicalScenes.set(row.nativeId, row);
  }

  const databaseIds = new Set<number>();
  for (const row of inventory.databaseScenes as readonly AnyRecord[]) {
    if (row.owner.sourceKey !== row.sourceKey) throw new Error(`Database scene owner key disagrees at ${row.sourceFieldPath}.`);
    if (row.nativeId === null) {
      throw new Error(`World inventory database scene identity is unavailable at ${row.sourceFieldPath}.`);
    }
    if (row.nativeId < 0 || databaseIds.has(row.nativeId)) throw new Error(`Invalid or duplicate database scene identity: ${row.nativeId}.`);
    databaseIds.add(row.nativeId);
    const canonicalScene = canonicalScenes.get(row.nativeId);
    if (!canonicalScene || row.fields.ID !== row.nativeId || row.sourceKey !== canonicalScene.sourceKey || row.fields.entryName !== canonicalScene.internalName) throw new Error(`Database scene identity disagrees with the canonical snapshot at ${row.sourceFieldPath}.`);
  }
  if (inventory.databaseScenes.length !== canonical.scenes.length) {
    throw new Error(`Database scene row count ${inventory.databaseScenes.length} differs from canonical scene count ${canonical.scenes.length}.`);
  }
  for (const id of databaseIds) {
    if (!canonicalScenes.has(id)) throw new Error(`Database scene ${id} is absent from the canonical snapshot.`);
  }
  if (databaseIds.size !== canonicalScenes.size) throw new Error("Database scene identities differ from the canonical snapshot.");
  for (const row of inventory.buildScenes as readonly AnyRecord[]) {
    if (row.buildIndex < 0) throw new Error(`Negative build scene index at ${row.sourceFieldPath}.`);
    if (row.owner.index !== row.buildIndex) throw new Error(`Build scene owner index disagrees at ${row.sourceFieldPath}.`);
  }
  return canonicalScenes;
}

function validateStartReference(
  row: AnyRecord,
  canonicalScenes: Map<number, Canonical["scenes"][number]>,
  worldPositions: Map<number, WorldPositionReference>,
  diagnostics: Diagnostic[],
  seen: Set<string>,
) {
  const path = row.sourceFieldPath as string;
  if (row.owner.sourceKey !== row.sourceKey || row.owner.nativeId !== row.ownerNativeId) throw new Error(`Start-position owner identity disagrees at ${path}.`);
  const target = row.targetNativeId as number;
  const owner = canonicalScenes.get(row.ownerNativeId);
  if (!owner || owner.sourceKey !== row.sourceKey || owner.gameplay.startPositionId !== target) throw new Error(`Start-position reference disagrees with its canonical owner at ${path}.`);
  if (target < 0) {
    if (row.referenceStatus !== "negative-sentinel" || row.destination !== null) throw new Error(`Negative startPositionID is not retained as an unset reference at ${path}.`);
    return;
  }
  if (row.referenceStatus === "resolved-by-exact-worldPosition-ID") {
    if (row.destination === null || row.destination.nativeId !== target) throw new Error(`Resolved start-position link disagrees at ${path}.`);
    const position = worldPositions.get(target);
    if (!position || row.destination.sourceKey !== position.sourceKey || row.destination.entryName !== position.target.entryName || row.destination.matchBasis !== "exact RPGWorldPosition.ID comparison") throw new Error(`Start-position reference has no matching inventoried world position at ${path}.`);
  } else if (row.referenceStatus === "unresolved") {
    if (row.destination !== null) throw new Error(`Unresolved start-position link has a destination at ${path}.`);
    addDiagnostic(diagnostics, seen, "unresolved-reference", path, "RPGGameScene.startPositionID has no exact RPGWorldPosition.ID match.");
  } else {
    throw new Error(`Unsupported start-position reference status at ${path}: ${row.referenceStatus}.`);
  }
}

function validateDestinationRows(
  inventory: WorldInventory,
  canonicalScenes: Map<number, Canonical["scenes"][number]>,
  diagnostics: Diagnostic[],
  seen: Set<string>,
) {
  uniqueSourcePaths(inventory.referencedDestinations as readonly AnyRecord[], "referenced destination");
  uniqueSourcePaths(inventory.transitions as readonly AnyRecord[], "transition");
  const worldPositions = new Map<number, WorldPositionReference>();
  for (const row of inventory.referencedDestinations) {
    if (row.destinationType !== "worldPosition") continue;
    if (worldPositions.has(row.nativeId)) throw new Error(`Duplicate world-position identity: ${row.nativeId}.`);
    worldPositions.set(row.nativeId, row);
  }
  for (const row of inventory.referencedDestinations as readonly AnyRecord[]) {
    const path = row.sourceFieldPath as string;
    if (row.destinationType === "gameScene.startPositionID") {
      validateStartReference(row, canonicalScenes, worldPositions, diagnostics, seen);
      continue;
    }
    if (row.destinationType === "worldPosition") {
      if (row.owner.sourceKey !== row.sourceKey || row.nativeId !== row.target.nativeId || row.nativeId < 0) throw new Error(`World-position identity disagrees at ${path}.`);
      addDiagnostic(diagnostics, seen, "unverified-scene-semantics", path, "RPGWorldPosition has no scene field; its scene destination remains intentionally unresolved.");
      continue;
    }
    if (row.destinationType === "task.sceneName") {
      if (row.owner.sourceKey !== row.sourceKey) throw new Error(`Task owner identity disagrees at ${path}.`);
      if (row.ownerNativeId === null) {
        if (row.referenceStatus !== "null-task-record") throw new Error(`Unavailable task record has an asserted reference status at ${path}.`);
        continue;
      }
      if (row.owner.nativeId !== row.ownerNativeId) throw new Error(`Task native identity disagrees at ${path}.`);
      const raw = row.rawSceneName as string | null;
      if (raw === null || raw.length === 0) {
        if (row.referenceStatus !== "null-or-empty" || row.destination !== null || row.destinationScene !== null) throw new Error(`Unset task scene reference is not retained as unused at ${path}.`);
      } else if (row.referenceStatus === "resolved-by-exact-entryName") {
        checkScenePair(row.destination, row.destinationScene, path, canonicalScenes, diagnostics, seen);
        if (row.destination === null || row.destination.internalName !== raw || row.destinationScene === null || row.destinationScene.internalName !== raw) throw new Error(`Resolved task scene name disagrees at ${path}.`);
      } else if (row.referenceStatus === "unresolved") {
        if (row.destination !== null || row.destinationScene !== null) throw new Error(`Unresolved task scene reference has a destination at ${path}.`);
        addDiagnostic(diagnostics, seen, "unresolved-reference", path, "RPGTask.sceneName does not resolve by exact RPGGameScene.entryName comparison.");
      } else {
        throw new Error(`Unsupported task scene reference status at ${path}: ${row.referenceStatus}.`);
      }
      continue;
    }
    if (row.transitionType === "questScenePortal" || row.transitionType === "dungeonEntranceTrigger") {
      validateTransition(row, canonicalScenes, diagnostics, seen);
      continue;
    }
    throw new Error(`Unknown destination reference at ${path}.`);
  }
  for (const row of inventory.transitions as readonly AnyRecord[]) validateTransition(row, canonicalScenes, diagnostics, seen);
}

function validateTransition(row: AnyRecord, canonicalScenes: Map<number, Canonical["scenes"][number]>, diagnostics: Diagnostic[], seen: Set<string>) {
  const path = row.sourceFieldPath as string;
  if (row.transitionType === "questScenePortal") {
    if (row.destinationType !== "sceneName") throw new Error(`Quest portal destination type disagrees at ${path}.`);
    if (row.rawDestination === null || row.rawDestination.length === 0) {
      if (row.destination !== null || row.destinationScene !== null) throw new Error(`Empty quest portal destination has a resolved scene at ${path}.`);
    } else if (row.destination === null || row.destinationScene === null) {
      addDiagnostic(diagnostics, seen, "unresolved-reference", path, "QuestScenePortal.DestinationScene does not resolve by exact RPGGameScene.entryName comparison.");
    } else {
      checkScenePair(row.destination, row.destinationScene, path, canonicalScenes, diagnostics, seen);
      if (row.destination === null || row.destination.internalName !== row.rawDestination || row.destinationScene === null || row.destinationScene.internalName !== row.rawDestination) throw new Error(`Resolved quest portal scene name disagrees at ${path}.`);
    }
    return;
  }
  if (row.transitionType !== "dungeonEntranceTrigger" || row.destinationType !== "typedRPGGameScene") throw new Error(`Unsupported transition type at ${path}.`);
  if (row.destination === null || row.destinationScene === null) {
    addDiagnostic(diagnostics, seen, "unresolved-reference", path, "DungeonEntranceTrigger.GameScene is unavailable.");
    return;
  }
  const destination = row.destination as AnyRecord;
  const destinationScene = row.destinationScene as AnyRecord;
  const typedId = checkSceneReference(destination.typed, `${path}.destination.typed`, canonicalScenes, diagnostics, seen);
  const sceneTypedId = checkSceneReference(destinationScene.typed, `${path}.destinationScene.typed`, canonicalScenes, diagnostics, seen);
  if (typedId !== sceneTypedId) throw new Error(`Dungeon entrance typed destination identities disagree at ${path}.`);
  for (const [key, value] of [["destination", destination], ["destinationScene", destinationScene]] as const) {
    const record = value.databaseRecord as AnyRecord | null;
    if (record === null) {
      addDiagnostic(diagnostics, seen, "unresolved-reference", `${path}.${key}.databaseRecord`, "Typed RPGGameScene reference has no exact database RPGGameScene.ID match.");
      continue;
    }
    const recordId = checkSceneReference(record, `${path}.${key}.databaseRecord`, canonicalScenes, diagnostics, seen);
    if (recordId !== typedId) throw new Error(`Dungeon entrance database record disagrees with typed destination at ${path}.${key}.`);
    if (value.databaseRecordMatchBasis !== "exact RPGGameScene.ID comparison") throw new Error(`Dungeon entrance database match lacks exact ID evidence at ${path}.${key}.`);
  }
}

function validateComponentCounts(inventory: WorldInventory) {
  for (const row of inventory.componentFamilies as readonly AnyRecord[]) {
    if (row.activeCount < 0 || row.includeInactiveCount < 0) {
      throw new Error(`World inventory component-family count is unavailable at ${row.sourceFieldPath}.`);
    } else if (row.activeCount > row.includeInactiveCount) {
      throw new Error(`Active component count exceeds include-inactive count at ${row.sourceFieldPath}.`);
    }
  }
  for (const row of inventory.behaviourTypes as readonly AnyRecord[]) {
    if (row.activeCount < 0 || row.includeInactiveCount < 0) {
      throw new Error(`World inventory behaviour count is unavailable for ${row.nativeType}.`);
    } else if (row.activeCount > row.includeInactiveCount) {
      throw new Error(`Active behaviour count exceeds include-inactive count for ${row.nativeType}.`);
    }
  }
}

export function validateWorldInventory(inventory: WorldInventory, canonical: Canonical) {
  assertContract(WorldInventorySchema, inventory, "World inventory");
  assertContract(CanonicalSchema, canonical, "Canonical snapshot");
  const diagnostics: Diagnostic[] = [];
  const seen = new Set<string>();
  for (const row of inventory.unresolved) addDiagnostic(diagnostics, seen, row.kind, row.sourceFieldPath, row.detail);

  uniqueSourcePaths(inventory.buildScenes as readonly AnyRecord[], "build scene");
  uniqueSourcePaths(inventory.databaseScenes as readonly AnyRecord[], "database scene");
  uniqueSourcePaths(inventory.loadedScenes as readonly AnyRecord[], "loaded scene");
  uniqueSourcePaths(inventory.addressableSources as readonly AnyRecord[], "addressable source");
  uniqueSourcePaths(inventory.componentFamilies as readonly AnyRecord[], "component family");
  const families = new Set<string>();
  for (const row of inventory.componentFamilies) {
    if (families.has(row.family)) throw new Error(`Duplicate component family identity: ${row.family}.`);
    families.add(row.family);
  }
  const behaviourTypes = new Set<string>();
  for (const row of inventory.behaviourTypes) {
    if (behaviourTypes.has(row.nativeType)) throw new Error(`Duplicate behaviour type identity: ${row.nativeType}.`);
    behaviourTypes.add(row.nativeType);
  }

  const canonicalScenes = checkDatabaseSceneIdentities(inventory, canonical);
  validateDestinationRows(inventory, canonicalScenes, diagnostics, seen);
  validateComponentCounts(inventory);

  const behaviourComponents = inventory.behaviourTypes.reduce((sum, row) => sum + row.includeInactiveCount, 0);

  const counts: Totals = {
    buildScenes: inventory.buildScenes.length,
    databaseScenes: inventory.databaseScenes.length,
    worldPositions: inventory.referencedDestinations.filter((row) => row.destinationType === "worldPosition").length,
    gameSceneStartPositionReferences: inventory.referencedDestinations.filter((row) => row.destinationType === "gameScene.startPositionID").length,
    taskSceneReferences: inventory.referencedDestinations.filter((row) => row.destinationType === "task.sceneName").length,
    loadedScenes: inventory.loadedScenes.length,
    addressableSources: inventory.addressableSources.length,
    loadedTransitions: inventory.transitions.length,
    referencedDestinations: inventory.referencedDestinations.length,
    componentFamilies: inventory.componentFamilies.length,
    behaviourTypes: inventory.behaviourTypes.length,
    behaviourComponents,
  };
  for (const key of Object.keys(counts) as (keyof Totals)[]) checkCount(counts[key], inventory.sourceTotals[key], inventory.exportedTotals[key], key);
  return { counts, diagnostics };
}
