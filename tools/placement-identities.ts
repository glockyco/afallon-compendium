import { createHash } from "node:crypto";
import { Assert } from "typebox/value";
import type { TSchema } from "typebox";
import {
  PlacementIdentityResultSchema,
  PlacementSnapshotSchema,
  SerializedAssetIndexSchema,
  type PlacementIdentityResult,
  type PlacementSnapshot,
  type SerializedAssetIndex,
} from "./placement-contracts";

type SerializedObject = SerializedAssetIndex["objects"][number];
type NativeNode = PlacementSnapshot["nodes"][number];
type NativeComponent = PlacementSnapshot["components"][number];
type SerializedComponent = Exclude<SerializedObject["components"][number], null>;
type NativeStream = PlacementSnapshot["streams"][number];

type SerializedModel = {
  index: SerializedAssetIndex;
  objectById: Map<string, SerializedObject>;
  objectByTransformId: Map<string, SerializedObject>;
  roots: SerializedObject[];
};

type NativeHierarchy = {
  nodeById: Map<number, NativeNode>;
};

type MappingContext = {
  model: SerializedModel;
  hierarchy: NativeHierarchy;
  nativeRootId: number | null;
  prefab: boolean;
  candidates: Map<number, Set<string>>;
};

type ResolvedBinding = {
  component: NativeComponent;
  node: NativeNode;
  serialized: SerializedObject;
  serializedComponent: SerializedComponent;
  origin: "scene" | "streamed-prefab";
  sourceIndex: SerializedAssetIndex;
  loaderSourceId: string | null;
};

type ResolutionFailure = {
  reason: PlacementIdentityResult["unresolved"][number]["reason"];
  detail: string;
  candidates: string[];
};

type LoaderResolution =
  | { sourceId: string; serialized: SerializedObject; serializedComponent: SerializedComponent }
  | ResolutionFailure;

export interface PlacementIdentityComparison {
  retainedSourceIds: string[];
  addedSourceIds: string[];
  removedSourceIds: string[];
  beforeNativeInstanceCount: number;
  afterNativeInstanceCount: number;
  changedNativeInstanceCount: number;
}

function assertContract<T extends TSchema>(schema: T, value: unknown, label: string): void {
  try {
    Assert(schema, value);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new TypeError(`${label} does not satisfy its contract: ${detail}`);
  }
}

function requireText(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string" || value.length === 0) throw new TypeError(`${label} must be a non-empty string.`);
}

function serializedModel(index: SerializedAssetIndex, label: string): SerializedModel {
  const objectById = new Map<string, SerializedObject>();
  const objectByTransformId = new Map<string, SerializedObject>();
  const componentPathIds = new Set<string>();
  let actualAttachedMonoBehaviours = 0;

  if (index.totals.objects < index.totals.gameObjects) {
    throw new TypeError(`${label} totals.objects is smaller than totals.gameObjects.`);
  }
  if (index.totals.gameObjects !== index.objects.length) {
    throw new TypeError(`${label} totals.gameObjects does not match the indexed GameObject count.`);
  }
  if (index.totals.transforms !== index.objects.length) {
    throw new TypeError(`${label} totals.transforms does not match the indexed Transform count.`);
  }
  if (index.totals.monoBehaviours !== index.totals.attachedMonoBehaviours + index.totals.unboundMonoBehaviours) {
    throw new TypeError(`${label} MonoBehaviour totals are inconsistent.`);
  }
  if (index.totals.attachedMonoBehaviours > index.totals.monoBehaviours || index.totals.nullScripts > index.totals.monoBehaviours) {
    throw new TypeError(`${label} MonoBehaviour totals exceed the total.`);
  }

  for (const object of index.objects) {
    if (objectById.has(object.pathId)) throw new TypeError(`${label} contains duplicate GameObject path ID ${object.pathId}.`);
    if (objectByTransformId.has(object.transform.pathId)) throw new TypeError(`${label} contains duplicate Transform path ID ${object.transform.pathId}.`);
    objectById.set(object.pathId, object);
    objectByTransformId.set(object.transform.pathId, object);

    for (const component of object.components) {
      if (component === null) continue;
      if (componentPathIds.has(component.pathId)) throw new TypeError(`${label} contains duplicate component path ID ${component.pathId}.`);
      componentPathIds.add(component.pathId);
      if (component.classId === 114) actualAttachedMonoBehaviours += 1;
    }
  }

  if (index.totals.attachedMonoBehaviours !== actualAttachedMonoBehaviours) {
    throw new TypeError(`${label} totals.attachedMonoBehaviours does not match non-null MonoBehaviour slots.`);
  }

  const roots: SerializedObject[] = [];
  for (const object of index.objects) {
    const transform = object.transform;
    if (transform.parentPathId === null) {
      roots.push(object);
    } else if (!objectByTransformId.has(transform.parentPathId)) {
      throw new TypeError(`${label} Transform ${transform.pathId} references a missing parent ${transform.parentPathId}.`);
    }

    const childIds = new Set<string>();
    for (const childTransformId of transform.children) {
      if (childIds.has(childTransformId)) throw new TypeError(`${label} has duplicate child reference ${childTransformId}.`);
      childIds.add(childTransformId);
      const child = objectByTransformId.get(childTransformId);
      if (child === undefined) throw new TypeError(`${label} Transform ${transform.pathId} references missing child ${childTransformId}.`);
      if (child.transform.parentPathId !== transform.pathId) {
        throw new TypeError(`${label} child ${childTransformId} does not point back to parent ${transform.pathId}.`);
      }
    }
  }
  for (const object of index.objects) {
    const parentId = object.transform.parentPathId;
    if (parentId === null) continue;
    const parent = objectByTransformId.get(parentId);
    if (parent === undefined || parent.transform.children.indexOf(object.transform.pathId) < 0) {
      throw new TypeError(`${label} parent ${parentId} omits child ${object.transform.pathId}.`);
    }
  }

  const state = new Map<string, 0 | 1 | 2>();
  const visit = (object: SerializedObject): void => {
    const current = state.get(object.pathId) ?? 0;
    if (current === 1) throw new TypeError(`${label} contains a Transform cycle at ${object.pathId}.`);
    if (current === 2) return;
    state.set(object.pathId, 1);
    if (object.transform.parentPathId !== null) visit(objectByTransformId.get(object.transform.parentPathId)!);
    state.set(object.pathId, 2);
  };
  for (const object of index.objects) visit(object);

  if (index.rootGameObjectPathId !== null) {
    const root = objectById.get(index.rootGameObjectPathId);
    if (root === undefined) throw new TypeError(`${label} rootGameObjectPathId is not indexed.`);
    if (root.transform.parentPathId !== null) throw new TypeError(`${label} rootGameObjectPathId is not a hierarchy root.`);
  }

  return { index, objectById, objectByTransformId, roots };
}

function nativeHierarchy(snapshot: PlacementSnapshot): NativeHierarchy {
  const nodeById = new Map<number, NativeNode>();
  const childrenById = new Map<number | null, NativeNode[]>();
  for (const node of snapshot.nodes) {
    if (node.instanceId === 0) throw new TypeError("Snapshot node instance IDs must be non-zero.");
    if (node.parentInstanceId === 0) throw new TypeError("Snapshot parent instance IDs must be non-zero when present.");
    if (nodeById.has(node.instanceId)) throw new TypeError(`Snapshot contains duplicate node instance ID ${node.instanceId}.`);
    nodeById.set(node.instanceId, node);
    const children = childrenById.get(node.parentInstanceId) ?? [];
    children.push(node);
    childrenById.set(node.parentInstanceId, children);
  }
  for (const [parentId, children] of childrenById) {
    if (parentId !== null && !nodeById.has(parentId)) throw new TypeError(`Snapshot node children reference missing parent ${parentId}.`);
    if (parentId === null) continue;
    const siblingIndexes = new Set<number>();
    for (const child of children) {
      if (siblingIndexes.has(child.siblingIndex)) throw new TypeError(`Snapshot has duplicate sibling index ${child.siblingIndex} under node ${parentId}.`);
      siblingIndexes.add(child.siblingIndex);
    }
  }

  const state = new Map<number, 0 | 1 | 2>();
  const visit = (node: NativeNode): void => {
    const current = state.get(node.instanceId) ?? 0;
    if (current === 1) throw new TypeError(`Snapshot hierarchy contains a cycle at node ${node.instanceId}.`);
    if (current === 2) return;
    state.set(node.instanceId, 1);
    if (node.parentInstanceId !== null) visit(nodeById.get(node.parentInstanceId)!);
    state.set(node.instanceId, 2);
  };
  for (const node of snapshot.nodes) visit(node);
  return { nodeById };
}

function validateSnapshotRelations(snapshot: PlacementSnapshot, hierarchy: NativeHierarchy): void {
  const componentById = new Map<number, NativeComponent>();
  const componentsByGameObject = new Map<number, NativeComponent[]>();
  for (const component of snapshot.components) {
    if (component.instanceId === 0 || component.gameObjectInstanceId === 0) throw new TypeError("Snapshot component and GameObject instance IDs must be non-zero.");
    if (componentById.has(component.instanceId)) throw new TypeError(`Snapshot contains duplicate component instance ID ${component.instanceId}.`);
    if (!hierarchy.nodeById.has(component.gameObjectInstanceId)) throw new TypeError(`Component ${component.instanceId} references missing GameObject ${component.gameObjectInstanceId}.`);
    componentById.set(component.instanceId, component);
    const list = componentsByGameObject.get(component.gameObjectInstanceId) ?? [];
    list.push(component);
    componentsByGameObject.set(component.gameObjectInstanceId, list);
  }
  for (const components of componentsByGameObject.values()) {
    const indexes = new Set<number>();
    for (const component of components) {
      if (indexes.has(component.componentIndex)) throw new TypeError(`Snapshot has duplicate component slot ${component.componentIndex} on GameObject ${component.gameObjectInstanceId}.`);
      indexes.add(component.componentIndex);
    }
  }

  const queried = new Set<number>();
  for (const query of snapshot.queries) {
    if (query.nativeCount !== query.componentInstanceIds.length) throw new TypeError(`Query ${query.typeName} nativeCount does not match its component IDs.`);
    const inQuery = new Set<number>();
    for (const componentId of query.componentInstanceIds) {
      if (inQuery.has(componentId)) throw new TypeError(`Query ${query.typeName} repeats component ${componentId}.`);
      if (!componentById.has(componentId)) throw new TypeError(`Query ${query.typeName} references missing component ${componentId}.`);
      inQuery.add(componentId);
      queried.add(componentId);
    }
  }
  for (const component of snapshot.components) {
    if (!queried.has(component.instanceId)) throw new TypeError(`Component ${component.instanceId} is absent from every query.`);
  }

  const streamComponentIds = new Set<number>();
  const streamRoots = new Set<number>();
  for (const stream of snapshot.streams) {
    if (stream.componentInstanceId === 0) throw new TypeError("Stream component instance IDs must be non-zero.");
    if (stream.loadedRootInstanceId === 0) throw new TypeError("Loaded stream root instance IDs must be non-zero when present.");
    if (streamComponentIds.has(stream.componentInstanceId)) throw new TypeError(`Snapshot contains duplicate stream component ${stream.componentInstanceId}.`);
    streamComponentIds.add(stream.componentInstanceId);
    const loader = componentById.get(stream.componentInstanceId);
    if (loader === undefined) throw new TypeError(`Stream references missing loader component ${stream.componentInstanceId}.`);
    if (stream.loadedRootInstanceId !== null) {
      if (!hierarchy.nodeById.has(stream.loadedRootInstanceId)) throw new TypeError(`Stream ${stream.componentInstanceId} references missing root ${stream.loadedRootInstanceId}.`);
      if (!stream.isLoaded) throw new TypeError(`Stream ${stream.componentInstanceId} has a root but is not loaded.`);
      if (streamRoots.has(stream.loadedRootInstanceId)) throw new TypeError(`Multiple streams reference loaded root ${stream.loadedRootInstanceId}.`);
      streamRoots.add(stream.loadedRootInstanceId);
    } else if (stream.isLoaded) {
      throw new TypeError(`Loaded stream ${stream.componentInstanceId} has no loaded root.`);
    }
    const rendererIds = new Set<number>();
    for (const rendererId of stream.rendererInstanceIds) {
      if (rendererId === 0) throw new TypeError("Renderer instance IDs must be non-zero.");
      if (rendererIds.has(rendererId)) throw new TypeError(`Stream ${stream.componentInstanceId} repeats renderer ${rendererId}.`);
      rendererIds.add(rendererId);
    }
  }
}

function makeHash(label: string, material: unknown): string {
  return createHash("sha256").update(`${label}\0${JSON.stringify(material)}`).digest("hex");
}

function placementMaterial(buildId: string, sceneIndex: SerializedAssetIndex, sourceIndex: SerializedAssetIndex, origin: "scene" | "streamed-prefab", gameObjectPathId: string, loaderSourceId: string | null) {
  return {
    version: "compendium.placement-identity.v1",
    buildId,
    origin,
    scene: { path: sceneIndex.source.scenePath, buildIndex: sceneIndex.source.buildIndex, sha256: sceneIndex.source.sha256 },
    source: { sha256: sourceIndex.source.sha256, serializedFile: sourceIndex.source.serializedFile },
    gameObjectPathId,
    loaderSourceId,
  };
}

function sourceIdentityId(buildId: string, sceneIndex: SerializedAssetIndex, sourceIndex: SerializedAssetIndex, origin: "scene" | "streamed-prefab", gameObjectPathId: string, componentPathId: string, loaderSourceId: string | null): string {
  return makeHash("source", { ...placementMaterial(buildId, sceneIndex, sourceIndex, origin, gameObjectPathId, loaderSourceId), componentPathId });
}

function placementId(buildId: string, sceneIndex: SerializedAssetIndex, sourceIndex: SerializedAssetIndex, origin: "scene" | "streamed-prefab", gameObjectPathId: string, loaderSourceId: string | null): string {
  return makeHash("placement", placementMaterial(buildId, sceneIndex, sourceIndex, origin, gameObjectPathId, loaderSourceId));
}

function mappingCandidates(context: MappingContext, nodeId: number): Set<string> {
  const existing = context.candidates.get(nodeId);
  if (existing !== undefined) return existing;
  const node = context.hierarchy.nodeById.get(nodeId)!;
  let result = new Set<string>();
  if (context.prefab && nodeId === context.nativeRootId) {
    const rootId = context.model.index.rootGameObjectPathId;
    if (rootId !== null && context.model.objectById.has(rootId)) result = new Set([rootId]);
  } else if (node.parentInstanceId === null) {
    for (const object of context.model.roots) if (object.name === node.name) result.add(object.pathId);
  } else {
    const parentCandidates = mappingCandidates(context, node.parentInstanceId);
    for (const parentId of parentCandidates) {
      const parent = context.model.objectById.get(parentId)!;
      const childId = parent.transform.children[node.siblingIndex];
      const child = childId === undefined ? undefined : context.model.objectByTransformId.get(childId);
      if (child !== undefined && child.name === node.name) result.add(child.pathId);
    }
  }
  context.candidates.set(nodeId, result);
  return result;
}

function componentMatch(serialized: SerializedObject, component: NativeComponent): SerializedComponent | null {
  const slot = serialized.components[component.componentIndex];
  if (slot === undefined || slot === null || slot.typeName === null || slot.assembly === null) return null;
  if (slot.typeName !== component.typeName || slot.assembly !== component.assembly) return null;
  return slot;
}

function comparePathIds(a: string, b: string): number {
  const left = BigInt(a);
  const right = BigInt(b);
  return left < right ? -1 : left > right ? 1 : 0;
}

function failure(reason: ResolutionFailure["reason"], detail: string, candidates: Iterable<string> = []): ResolutionFailure {
  return { reason, detail, candidates: [...new Set(candidates)].sort(comparePathIds) };
}

function nearestStreamRoot(nodeId: number, hierarchy: NativeHierarchy, streamRoots: Set<number>): number | null {
  let current: number | null = nodeId;
  while (current !== null) {
    if (streamRoots.has(current)) return current;
    current = hierarchy.nodeById.get(current)!.parentInstanceId;
  }
  return null;
}

function resolveSceneComponent(component: NativeComponent, node: NativeNode, sceneContext: MappingContext, buildId: string, sceneIndex: SerializedAssetIndex): LoaderResolution {
  const candidates = mappingCandidates(sceneContext, node.instanceId);
  if (candidates.size === 0) return failure("missing-serialized-source", `Loader component ${component.instanceId} has no serialized hierarchy candidate.`);
  if (candidates.size !== 1) return failure("ambiguous-serialized-source", `Loader component ${component.instanceId} has multiple serialized hierarchy candidates.`, candidates);
  const serialized = sceneContext.model.objectById.get([...candidates][0]!)!;
  const serializedComponent = componentMatch(serialized, component);
  if (serializedComponent === null) return failure("component-mismatch", `Loader component ${component.instanceId} does not match its serialized component slot.`, candidates);
  return {
    sourceId: sourceIdentityId(buildId, sceneIndex, sceneIndex, "scene", serialized.pathId, serializedComponent.pathId, null),
    serialized,
    serializedComponent,
  };
}

export function resolvePlacementIdentities(
  buildId: string,
  snapshot: PlacementSnapshot,
  sceneIndex: SerializedAssetIndex,
  prefabs: ReadonlyMap<string, SerializedAssetIndex> = new Map(),
): PlacementIdentityResult {
  requireText(buildId, "buildId");
  assertContract(PlacementSnapshotSchema, snapshot, "Placement snapshot");
  assertContract(SerializedAssetIndexSchema, sceneIndex, "Scene serialized asset index");
  if (!(prefabs instanceof Map) && (typeof prefabs !== "object" || prefabs === null || typeof (prefabs as ReadonlyMap<string, SerializedAssetIndex>).entries !== "function")) {
    throw new TypeError("Prefab indexes must be supplied as a map.");
  }

  const context = snapshot.context;
  if (!context.scene.isLoaded || context.sceneLoading || !context.sceneInitialized || context.sceneReadyHolds) {
    throw new Error("Placement identity resolution requires a loaded, initialized, non-loading, ready scene.");
  }
  if (sceneIndex.source.scenePath === null || sceneIndex.source.buildIndex === null) {
    throw new Error("The scene serialized asset index has no scene path/build index provenance.");
  }
  if (sceneIndex.source.scenePath !== context.scene.path || sceneIndex.source.buildIndex !== context.scene.buildIndex) {
    throw new Error(`Scene serialized source ${sceneIndex.source.scenePath}#${sceneIndex.source.buildIndex} does not match snapshot scene ${context.scene.path}#${context.scene.buildIndex}.`);
  }

  const sceneModel = serializedModel(sceneIndex, "Scene serialized asset index");
  const hierarchy = nativeHierarchy(snapshot);
  validateSnapshotRelations(snapshot, hierarchy);

  const prefabModels = new Map<string, SerializedModel>();
  for (const [guid, index] of prefabs.entries()) {
    requireText(guid, "Prefab asset GUID");
    assertContract(SerializedAssetIndexSchema, index, `Prefab serialized asset index ${guid}`);
    prefabModels.set(guid, serializedModel(index, `Prefab serialized asset index ${guid}`));
  }

  const streamRoots = new Set<number>();
  const streamByRoot = new Map<number, NativeStream>();
  for (const stream of snapshot.streams) {
    if (stream.loadedRootInstanceId !== null) {
      streamRoots.add(stream.loadedRootInstanceId);
      streamByRoot.set(stream.loadedRootInstanceId, stream);
    }
  }
  const sceneContext: MappingContext = { model: sceneModel, hierarchy, nativeRootId: null, prefab: false, candidates: new Map() };
  const contextByRoot = new Map<number, MappingContext>();
  const loaderResolutions = new Map<number, LoaderResolution>();
  const componentById = new Map(snapshot.components.map(component => [component.instanceId, component]));
  const unresolved: PlacementIdentityResult["unresolved"] = [];
  const successful: Array<ResolvedBinding & { sourceId: string; placementId: string; serializedFile: string }> = [];

  const resolveLoader = (stream: NativeStream): LoaderResolution => {
    const cached = loaderResolutions.get(stream.componentInstanceId);
    if (cached !== undefined) return cached;
    const loader = componentById.get(stream.componentInstanceId);
    if (loader === undefined) {
      const result = failure("unresolved-loader", `Stream ${stream.componentInstanceId} references a missing loader component.`);
      loaderResolutions.set(stream.componentInstanceId, result);
      return result;
    }
    const loaderNode = hierarchy.nodeById.get(loader.gameObjectInstanceId)!;
    if (nearestStreamRoot(loaderNode.instanceId, hierarchy, streamRoots) !== null || loaderNode.sceneHandle !== context.scene.handle) {
      const result = failure("unresolved-loader", `Stream ${stream.componentInstanceId} loader is not a resolvable active-scene component.`);
      loaderResolutions.set(stream.componentInstanceId, result);
      return result;
    }
    const resolved = resolveSceneComponent(loader, loaderNode, sceneContext, buildId, sceneIndex);
    if ("sourceId" in resolved) {
      loaderResolutions.set(stream.componentInstanceId, resolved);
      return resolved;
    }
    const result = failure("unresolved-loader", `Stream ${stream.componentInstanceId} loader resolution failed: ${resolved.detail}`, resolved.candidates);
    loaderResolutions.set(stream.componentInstanceId, result);
    return result;
  };

  const nodeFailure = (component: NativeComponent, reason: ResolutionFailure): void => {
    unresolved.push({ componentInstanceId: component.instanceId, gameObjectInstanceId: component.gameObjectInstanceId, reason: reason.reason, detail: reason.detail, candidates: reason.candidates });
  };

  for (const component of snapshot.components) {
    const node = hierarchy.nodeById.get(component.gameObjectInstanceId)!;
    const root = nearestStreamRoot(node.instanceId, hierarchy, streamRoots);
    let origin: "scene" | "streamed-prefab" = "scene";
    let sourceIndex = sceneIndex;
    let sourceContext = sceneContext;
    let loaderSourceId: string | null = null;

    if (root !== null) {
      origin = "streamed-prefab";
      const stream = streamByRoot.get(root)!;
      const loader = resolveLoader(stream);
      if (!("sourceId" in loader)) {
        nodeFailure(component, loader);
        continue;
      }
      loaderSourceId = loader.sourceId;
      if (stream.assetGuid === null) {
        nodeFailure(component, failure("missing-prefab-index", `Stream ${stream.componentInstanceId} has no asset GUID for its loaded root.`));
        continue;
      }
      const prefab = prefabModels.get(stream.assetGuid);
      if (prefab === undefined) {
        nodeFailure(component, failure("missing-prefab-index", `No prefab serialized asset index is available for GUID ${stream.assetGuid}.`));
        continue;
      }
      sourceIndex = prefab.index;
      sourceContext = contextByRoot.get(root) ?? { model: prefab, hierarchy, nativeRootId: root, prefab: true, candidates: new Map() };
      contextByRoot.set(root, sourceContext);
    } else if (node.sceneHandle !== context.scene.handle) {
      nodeFailure(component, failure("foreign-scene", `Component ${component.instanceId} belongs to scene handle ${node.sceneHandle}, not the active scene handle ${context.scene.handle}.`));
      continue;
    }

    const candidates = mappingCandidates(sourceContext, node.instanceId);
    if (candidates.size === 0) {
      nodeFailure(component, failure("missing-serialized-source", `Component ${component.instanceId} has no serialized hierarchy candidate.`));
      continue;
    }
    if (candidates.size !== 1) {
      nodeFailure(component, failure("ambiguous-serialized-source", `Component ${component.instanceId} has multiple serialized hierarchy candidates.`, candidates));
      continue;
    }
    const serialized = sourceContext.model.objectById.get([...candidates][0]!)!;
    const serializedComponent = componentMatch(serialized, component);
    if (serializedComponent === null) {
      nodeFailure(component, failure("component-mismatch", `Component ${component.instanceId} does not match serialized type, assembly, or all-component slot ${component.componentIndex}.`, candidates));
      continue;
    }
    successful.push({
      component,
      node,
      serialized,
      serializedComponent,
      origin,
      sourceIndex,
      loaderSourceId,
      sourceId: sourceIdentityId(buildId, sceneIndex, sourceIndex, origin, serialized.pathId, serializedComponent.pathId, loaderSourceId),
      placementId: placementId(buildId, sceneIndex, sourceIndex, origin, serialized.pathId, loaderSourceId),
      serializedFile: sourceIndex.source.serializedFile,
    });
  }

  const bySource = new Map<string, typeof successful>();
  const byPlacement = new Map<string, typeof successful>();
  for (const binding of successful) {
    const sources = bySource.get(binding.sourceId) ?? [];
    sources.push(binding);
    bySource.set(binding.sourceId, sources);
    const placements = byPlacement.get(binding.placementId) ?? [];
    placements.push(binding);
    byPlacement.set(binding.placementId, placements);
  }
  const duplicateComponents = new Set<number>();
  for (const bindings of bySource.values()) if (bindings.length > 1) for (const binding of bindings) duplicateComponents.add(binding.component.instanceId);
  for (const bindings of byPlacement.values()) {
    const nativeGameObjects = new Set(bindings.map(binding => binding.component.gameObjectInstanceId));
    if (nativeGameObjects.size > 1) for (const binding of bindings) duplicateComponents.add(binding.component.instanceId);
  }
  const duplicateLoaderSourceIds = new Set<string>();
  const loaderPathBySourceId = new Map<string, string>();
  for (const stream of snapshot.streams) {
    const loader = loaderResolutions.get(stream.componentInstanceId);
    if (loader !== undefined && "sourceId" in loader) {
      loaderPathBySourceId.set(loader.sourceId, loader.serialized.pathId);
      if (duplicateComponents.has(stream.componentInstanceId)) duplicateLoaderSourceIds.add(loader.sourceId);
    }
  }
  const identities: PlacementIdentityResult["identities"] = [];
  for (const binding of successful) {
    if (binding.origin === "streamed-prefab" && binding.loaderSourceId !== null && duplicateLoaderSourceIds.has(binding.loaderSourceId)) {
      unresolved.push({
        componentInstanceId: binding.component.instanceId,
        gameObjectInstanceId: binding.component.gameObjectInstanceId,
        reason: "unresolved-loader",
        detail: `Loader source ${binding.loaderSourceId} was removed because its serialized binding was ambiguous.`,
        candidates: loaderPathBySourceId.has(binding.loaderSourceId) ? [loaderPathBySourceId.get(binding.loaderSourceId)!] : [],
      });
      continue;
    }
    if (duplicateComponents.has(binding.component.instanceId)) {
      unresolved.push({
        componentInstanceId: binding.component.instanceId,
        gameObjectInstanceId: binding.component.gameObjectInstanceId,
        reason: "duplicate-placement-binding",
        detail: `Native component ${binding.component.instanceId} collides with another native binding for serialized GameObject ${binding.serialized.pathId}.`,
        candidates: [binding.serialized.pathId],
      });
      continue;
    }
    identities.push({
      componentInstanceId: binding.component.instanceId,
      gameObjectInstanceId: binding.component.gameObjectInstanceId,
      placementId: binding.placementId,
      sourceId: binding.sourceId,
      origin: binding.origin,
      sceneSourceSha256: sceneIndex.source.sha256,
      sourceSha256: binding.sourceIndex.source.sha256,
      serializedFile: binding.serializedFile,
      gameObjectPathId: binding.serialized.pathId,
      componentPathId: binding.serializedComponent.pathId,
      loaderSourceId: binding.loaderSourceId,
      typeName: binding.component.typeName,
      assembly: binding.component.assembly,
      position: binding.node.position,
    });
  }

  identities.sort((a, b) => a.sourceId.localeCompare(b.sourceId));
  unresolved.sort((a, b) => a.componentInstanceId - b.componentInstanceId || a.reason.localeCompare(b.reason));
  const result: PlacementIdentityResult = {
    schemaVersion: "compendium.placement-identities.v1",
    buildId,
    sceneNativeId: context.gameSceneNativeId,
    scenePath: context.scene.path,
    snapshotFrame: snapshot.frame,
    identities,
    unresolved,
  };
  assertContract(PlacementIdentityResultSchema, result, "Placement identity result");
  return result;
}

function resultSceneSourceHashes(result: PlacementIdentityResult): Set<string> {
  return new Set(result.identities.map(identity => identity.sceneSourceSha256));
}

function validateComparisonResult(result: PlacementIdentityResult, label: string): void {
  assertContract(PlacementIdentityResultSchema, result, label);
  const sourceIds = new Set<string>();
  for (const identity of result.identities) {
    if (sourceIds.has(identity.sourceId)) throw new TypeError(`${label} contains duplicate source ID ${identity.sourceId}.`);
    sourceIds.add(identity.sourceId);
  }
  const sceneHashes = resultSceneSourceHashes(result);
  if (sceneHashes.size > 1) throw new TypeError(`${label} contains identities from multiple scene serialized sources.`);
}

export function comparePlacementIdentities(before: PlacementIdentityResult, after: PlacementIdentityResult): PlacementIdentityComparison {
  validateComparisonResult(before, "Before placement identity result");
  validateComparisonResult(after, "After placement identity result");
  if (before.buildId !== after.buildId) throw new Error("Cannot compare placement identities from different builds.");
  if (before.sceneNativeId !== after.sceneNativeId) throw new Error("Cannot compare placement identities from different native scenes.");
  if (before.scenePath !== after.scenePath) throw new Error("Cannot compare placement identities from different scene paths.");
  const beforeSceneHashes = resultSceneSourceHashes(before);
  const afterSceneHashes = resultSceneSourceHashes(after);
  if (beforeSceneHashes.size > 0 && afterSceneHashes.size > 0 && [...beforeSceneHashes][0] !== [...afterSceneHashes][0]) {
    throw new Error("Cannot compare placement identities from different serialized scene sources.");
  }

  const beforeBySource = new Map(before.identities.map(identity => [identity.sourceId, identity]));
  const afterBySource = new Map(after.identities.map(identity => [identity.sourceId, identity]));
  const retainedSourceIds = [...beforeBySource.keys()].filter(sourceId => afterBySource.has(sourceId)).sort();
  const addedSourceIds = [...afterBySource.keys()].filter(sourceId => !beforeBySource.has(sourceId)).sort();
  const removedSourceIds = [...beforeBySource.keys()].filter(sourceId => !afterBySource.has(sourceId)).sort();
  let changedNativeInstanceCount = 0;
  for (const sourceId of retainedSourceIds) {
    const beforeIdentity = beforeBySource.get(sourceId)!;
    const afterIdentity = afterBySource.get(sourceId)!;
    if (beforeIdentity.componentInstanceId !== afterIdentity.componentInstanceId || beforeIdentity.gameObjectInstanceId !== afterIdentity.gameObjectInstanceId) changedNativeInstanceCount += 1;
  }
  return {
    retainedSourceIds,
    addedSourceIds,
    removedSourceIds,
    beforeNativeInstanceCount: before.identities.length,
    afterNativeInstanceCount: after.identities.length,
    changedNativeInstanceCount,
  };
}
