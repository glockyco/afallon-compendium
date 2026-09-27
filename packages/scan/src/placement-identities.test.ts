import { expect, test } from "bun:test";
import type { PlacementSnapshot, SerializedAssetIndex } from "@afallon/contracts";
import { resolvePlacementIdentities } from "./placement-identities";

const origin = { x: 0, y: 0, z: 0 }, unit = { x: 1, y: 1, z: 1 }, still = { x: 0, y: 0, z: 0, w: 1 };
const script = { status: "resolved" as const, typeName: "Game.Chest", assembly: "Assembly-CSharp" };
const scene = { path: "Assets/Cave.unity", name: "Cave", handle: 7, buildIndex: 3, isLoaded: true };

// A scene with one root object whose serialized children carry a Game.Chest script.
function sceneIndex(names: readonly string[]): SerializedAssetIndex {
  const children = names.map((name, index) => ({
    pathId: String(10 + index), name, activeSelf: true,
    transform: { pathId: String(100 + index), parentPathId: "99", children: [], localPosition: origin, localRotation: still, localScale: unit },
    components: [{ pathId: String(100 + index), classId: 4, script: null }, { pathId: String(200 + index), classId: 114, script }],
  }));
  const root = {
    pathId: "9", name: "Quests", activeSelf: true,
    transform: { pathId: "99", parentPathId: null, children: children.map((child) => child.transform.pathId), localPosition: origin, localRotation: still, localScale: unit },
    components: [{ pathId: "99", classId: 4, script: null }],
  };
  return {
    schemaVersion: "compendium.serialized-assets.v2",
    source: { path: "level3", sha256: "a".repeat(64), bytes: 1, serializedFile: "level3", unityVersion: "2022.3", scenePath: scene.path, buildIndex: scene.buildIndex, assetName: null },
    parser: { name: "UnityPy", version: "1" }, dependencies: [], rootGameObjectPathId: null,
    totals: { objects: names.length + 1, gameObjects: names.length + 1, transforms: names.length + 1, monoBehaviours: names.length, attachedMonoBehaviours: names.length, unboundMonoBehaviours: 0, nullScripts: 0, unresolvedScripts: 0 },
    objects: [root, ...children],
  };
}

// The runtime scene: the root and the children that still exist, at their run-time sibling indexes.
function snapshot(children: ReadonlyArray<{ name: string; siblingIndex: number }>): PlacementSnapshot {
  const node = (instanceId: number, name: string, parentInstanceId: number | null, siblingIndex: number) => ({
    instanceId, sceneHandle: scene.handle, name, parentInstanceId, siblingIndex,
    localPosition: origin, localRotation: still, localScale: unit, position: origin, activeSelf: true, activeInHierarchy: true,
  });
  const components = children.map((_, index) => ({ instanceId: 50 + index, gameObjectInstanceId: 20 + index, typeName: script.typeName, assembly: script.assembly, componentIndex: 1, enabled: true }));
  return {
    schemaVersion: "compendium.placement-snapshot.v1", frame: 1,
    context: { character: "Research", gameSceneNativeId: 44, scene, sceneInitialized: true, sceneLoading: false, sceneReadyHolds: false },
    queries: [{ typeName: script.typeName, nativeCount: components.length, componentInstanceIds: components.map((component) => component.instanceId) }],
    nodes: [node(1, "Quests", null, 0), ...children.map((child, index) => node(20 + index, child.name, 1, child.siblingIndex))],
    components, streams: [],
  };
}

function resolvedPathIds(names: readonly string[], children: ReadonlyArray<{ name: string; siblingIndex: number }>): Array<string | null> {
  const result = resolvePlacementIdentities("build", snapshot(children), sceneIndex(names));
  return children.map((_, index) => result.identities.find((identity) => identity.componentInstanceId === 50 + index)?.gameObjectPathId ?? null);
}

test("children after a sibling that the game destroyed keep their serialized identities", () => {
  // The game destroyed "Timer" at run time, so "Anchor" and "Ore" moved down by one sibling index.
  expect(resolvedPathIds(["Timer", "Anchor", "Ore"], [{ name: "Anchor", siblingIndex: 0 }, { name: "Ore", siblingIndex: 1 }])).toEqual(["11", "12"]);
});

test("a moved child with two later serialized namesakes stays unresolved", () => {
  expect(resolvedPathIds(["Timer", "Anchor", "Anchor"], [{ name: "Anchor", siblingIndex: 0 }])).toEqual([null]);
});
