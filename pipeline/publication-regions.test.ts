import { expect, test } from "bun:test";
import { categoryForRole, foldMapIcons, publicRegionFromNormalized } from "./publication";
import type { NormalizedPlacement } from "./normalized-contracts";

const offset = { worldX: 100, worldY: -20 };

test("map icon scopes map to the public marker categories", () => {
  expect(categoryForRole({ role: "mapIcon", scope: "town" })).toBe("town");
  expect(categoryForRole({ role: "mapIcon", scope: "fort" })).toBe("fort");
  expect(categoryForRole({ role: "mapIcon", scope: "camp" })).toBe("camp");
  expect(categoryForRole({ role: "mapIcon", scope: "dungeon" })).toBe("dungeonEntrance");
  expect(categoryForRole({ role: "mapIcon", scope: "challengeStone" })).toBe("challengeStone");
  expect(categoryForRole({ role: "mapIcon", scope: "quest" })).toBeNull();
});

test("sphere regions publish a 32-point map polygon", () => {
  const region = publicRegionFromNormalized({
    regionId: "region-1",
    name: "The Vale",
    shape: "sphere",
    mapSpaceId: "surface",
    mapGeometry: { kind: "sphere", center: [10, 20], radius: 4 },
  }, offset);
  expect(region?.polygon).toHaveLength(32);
  expect(region?.polygon[0]).toEqual([114, 0]);
  expect(region?.polygon[16]).toEqual([106, 0]);
  expect(region?.name).toBe("The Vale");
});

test("unresolved regions are excluded from publication", () => {
  expect(publicRegionFromNormalized({
    regionId: "region-unresolved",
    name: "Unknown",
    shape: "box",
    mapSpaceId: null,
    mapGeometry: { kind: "box", corners: [[0, 0], [1, 0], [1, 1], [0, 1]] },
  })).toBeNull();
  expect(publicRegionFromNormalized({
    regionId: "region-unresolved-geometry",
    name: "Unknown",
    shape: "box",
    mapSpaceId: "surface",
    mapGeometry: null,
  })).toBeNull();
});

function iconPlacement(placementId: string, scene: number, label: string | null, roles: NormalizedPlacement["roles"] = [{ role: "mapIcon", npcId: null, scope: "camp", sourceIds: [`source-${placementId}`] }]): NormalizedPlacement {
  return { placementId, buildId: "b", sceneNativeId: scene, scenePath: `scene-${scene}`, identity: null, label, mapSpaceId: "world-surface", worldPosition: { x: 1150.14, y: 3, z: -469.14 }, mapPosition: { x: 1150.14, y: -469.14 }, sourceIds: [`source-${placementId}`], roles, shape: null, provenance: [] } as NormalizedPlacement;
}

test("one map icon observed from several scenes publishes once, titled by any titled copy", () => {
  const folded = foldMapIcons([iconPlacement("c", 41, null), iconPlacement("a", 3, "Aradia's camp"), iconPlacement("b", 9, "Aradia's camp"), iconPlacement("d", 38, null, [{ role: "mapIcon", npcId: null, scope: "fort", sourceIds: ["s"] }]), iconPlacement("e", 3, null, [{ role: "npc", npcId: 4, scope: null, sourceIds: ["s"] }])]);
  expect(folded.map((placement) => [placement.placementId, placement.label])).toEqual([["a", "Aradia's camp"], ["d", null], ["e", null]]);
  expect(() => foldMapIcons([iconPlacement("a", 3, "Aradia's camp"), iconPlacement("b", 9, "Oakreach Trading Post")])).toThrow(/different titles/);
});
