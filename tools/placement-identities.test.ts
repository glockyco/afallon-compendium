import { expect, test } from "bun:test";
import type { PlacementSnapshot, SerializedAssetIndex } from "@afallon/contracts"
import { comparePlacementIdentities, resolvePlacementIdentities } from "./placement-identities";

const guid = "1".repeat(32);
const scenePath = "Assets/World.unity";
const interactionType = "Game.Interaction";
const vector = (x = 0) => ({ x, y: 0, z: 0 });
const rotation = () => ({ x: 0, y: 0, z: 0, w: 1 });
const script = (pathId: string, typeName: string) => ({ pathId, classId: 114, typeName, assembly: "Assembly-CSharp" });

function object(pathId: string, transformId: string, name: string, scripts: Array<ReturnType<typeof script> | null>): SerializedAssetIndex["objects"][number] {
  return {
    pathId, name, activeSelf: true,
    transform: { pathId: transformId, parentPathId: null, children: [], localPosition: vector(), localRotation: rotation(), localScale: { x: 1, y: 1, z: 1 } },
    components: [{ pathId: transformId, classId: 4, typeName: null, assembly: null }, ...scripts],
  };
}

function index(objects: SerializedAssetIndex["objects"], prefab: boolean): SerializedAssetIndex {
  const components = objects.flatMap(object => object.components).filter(component => component !== null);
  const monoBehaviours = components.filter(component => component.classId === 114).length;
  return {
    schemaVersion: "compendium.serialized-assets.v1",
    source: { path: prefab ? "Afallon_Data/shared.bundle" : "Afallon_Data/level16", sha256: (prefab ? "b" : "a").repeat(64), bytes: 1, serializedFile: prefab ? "CAB-shared" : "level16", unityVersion: "2022.3.62f2", scenePath: prefab ? null : scenePath, buildIndex: prefab ? null : 16, assetName: prefab ? "Assets/Shared.prefab" : null },
    parser: { name: "UnityPy", version: "1.25.3" }, dependencies: [],
    rootGameObjectPathId: prefab ? objects[0]!.pathId : null,
    totals: { objects: objects.length + components.length, gameObjects: objects.length, transforms: objects.length, monoBehaviours, attachedMonoBehaviours: monoBehaviours, unboundMonoBehaviours: 0, nullScripts: 0 },
    objects,
  };
}

function fixture(offset = 0) {
  const scene = index([
    object("1", "11", "Loader A", [script("21", "AddressableLoader")]),
    object("2", "12", "Loader B", [script("22", "AddressableLoader")]),
  ], false);
  const prefab = index([object("9223372036854775700", "9223372036854775701", "Shared", [null, script("9007199254740992", interactionType), script("9007199254740993", interactionType)])], true);
  const handle = 500 + offset;
  const nodes: PlacementSnapshot["nodes"] = [1, 2, 101, 102].map((id, position) => ({
    instanceId: id + offset, sceneHandle: handle,
    name: position < 2 ? scene.objects[position]!.name : `Instantiated ${offset}`,
    parentInstanceId: null, siblingIndex: position + Math.abs(offset),
    localPosition: vector(), localRotation: rotation(), localScale: { x: 1, y: 1, z: 1 }, position: vector(id + offset), activeSelf: true, activeInHierarchy: true,
  }));
  const components: PlacementSnapshot["components"] = [0, 1].flatMap(position => [
    { instanceId: 201 + position + offset, gameObjectInstanceId: 1 + position + offset, typeName: "AddressableLoader", assembly: "Assembly-CSharp", componentIndex: 1, enabled: true },
    ...[2, 3].map(slot => ({ instanceId: 300 + position * 10 + slot + offset, gameObjectInstanceId: 101 + position + offset, typeName: interactionType, assembly: "Assembly-CSharp", componentIndex: slot, enabled: true })),
  ]);
  const snapshot: PlacementSnapshot = {
    schemaVersion: "compendium.placement-snapshot.v1", frame: 100 + Math.abs(offset),
    context: { character: "Research", gameSceneNativeId: 3, scene: { path: scenePath, name: "World", handle, buildIndex: 16, isLoaded: true }, sceneInitialized: true, sceneLoading: false, sceneReadyHolds: false },
    nodes, components,
    queries: ["AddressableLoader", interactionType].map(typeName => {
      const componentInstanceIds = components.filter(component => component.typeName === typeName).map(component => component.instanceId);
      return { typeName, nativeCount: componentInstanceIds.length, componentInstanceIds };
    }),
    streams: [0, 1].map(position => ({ componentInstanceId: 201 + position + offset, assetGuid: guid, loadedRootInstanceId: 101 + position + offset, isLoaded: true, isLoading: false, hasInstanceHandle: true, enabled: true, loadDistance: 100, unloadDistance: 110, holdUntil: 0, rendererInstanceIds: [] })),
  };
  return { scene, snapshot, prefabs: new Map([[guid, prefab]]) };
}

function resolveFixture(input: ReturnType<typeof fixture>) {
  return resolvePlacementIdentities("build", input.snapshot, input.scene, input.prefabs);
}

test("shared prefab instances and component roles retain distinct serialized identities across runtime changes", () => {
  const before = resolveFixture(fixture());
  const after = resolveFixture(fixture(-1000));
  expect(before.unresolved).toEqual([]);
  const streamed = before.identities.filter(identity => identity.origin === "streamed-prefab");
  expect(new Set(streamed.map(identity => identity.sourceId)).size).toBe(4);
  expect(new Set(streamed.map(identity => identity.placementId)).size).toBe(2);
  const comparison = comparePlacementIdentities(before, after);
  expect(comparison.retainedSourceIds).toEqual(before.identities.map(identity => identity.sourceId));
  expect(comparison.addedSourceIds).toEqual([]);
  expect(comparison.removedSourceIds).toEqual([]);
  expect(comparison.changedNativeInstanceCount).toBe(6);
});

test("pending native scene holds prevent placement binding", () => {
  const input = fixture();
  input.snapshot.context.sceneReadyHolds = true;
  expect(() => resolveFixture(input)).toThrow();
});

test("ambiguous serialized roots remain unresolved", () => {
  const input = fixture();
  input.scene.objects[1]!.name = "Loader A";
  input.snapshot.nodes[1]!.name = "Loader A";
  const result = resolveFixture(input);
  expect(result.identities).toEqual([]);
  expect(result.unresolved.filter(row => row.reason === "ambiguous-serialized-source").length).toBe(2);
});

test("colliding loader bindings cannot leave apparently resolved prefab descendants", () => {
  const input = fixture();
  input.snapshot.nodes[1]!.name = "Loader A";
  const secondGuid = "2".repeat(32);
  const other = structuredClone(input.prefabs.get(guid)!);
  other.source.sha256 = "c".repeat(64);
  other.source.serializedFile = "CAB-other";
  input.prefabs.set(secondGuid, other);
  input.snapshot.streams[1]!.assetGuid = secondGuid;
  const result = resolveFixture(input);
  expect(result.identities).toEqual([]);
  expect(result.unresolved.filter(row => row.reason === "duplicate-placement-binding").length).toBe(2);
  expect(result.unresolved.filter(row => row.reason === "unresolved-loader").length).toBe(4);
});
