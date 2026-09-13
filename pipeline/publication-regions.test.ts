import { expect, test } from "bun:test";
import { categoryForRole, foldTravelPlacements, foldMapIcons, foldRegions, publicRegionFromNormalized } from "./publication";
import type { PublicPlacement } from "./public-contracts";
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
  const folded = foldMapIcons([iconPlacement("c", 41, null), iconPlacement("a", 3, "Aradia's camp"), iconPlacement("b", 9, "Aradia's camp"), iconPlacement("d", 38, null, [{ role: "mapIcon", npcId: null, scope: "fort", sourceIds: ["s"] }]), iconPlacement("e", 3, null, [{ role: "npc", npcId: 4, scope: "authored", sourceIds: ["s"] }])]);
  expect(folded.map((placement) => [placement.placementId, placement.label])).toEqual([["a", "Aradia's camp"], ["d", null], ["e", null]]);
  expect(() => foldMapIcons([iconPlacement("a", 3, "Aradia's camp"), iconPlacement("b", 9, "Oakreach Trading Post")])).toThrow(/different titles/);
});

test("a region authored by several scenes publishes once", () => {
  const box = (id: string, name: string, dx = 0) => ({ id, mapSpaceId: "world-surface", name, shape: "box" as const, polygon: [[0 + dx, 0], [10 + dx, 0], [10 + dx, 10], [0 + dx, 10]] as Array<[number, number]> });
  expect(foldRegions([box("b", "Briarstead"), box("a", "Briarstead"), box("c", "Briarstead", 5), box("d", "Fellgrove")]).map((region) => region.id)).toEqual(["a", "c", "d"]);
});

function publicPlacement(placementId: string, mapSpaceId: string, position: [number, number], categories: PublicPlacement["categories"], label: string, destination?: { mapSpaceId: string; position: [number, number] }): PublicPlacement {
  return {
    placementId, mapSpaceId, position, height: 0, label, categories, entityKeys: [], itemKeys: [], areas: [], movement: [], searchText: label,
    ...(destination ? { travel: { transitionId: `transition-${placementId}`, enabled: true, destination: { status: "resolved", ...destination } } } : {}),
  };
}

test("a dungeon marker absorbs equivalent normal and corrupted entrances", () => {
  const dungeon = publicPlacement("dungeon", "world", [100, 100], ["dungeonEntrance"], "Dungeon entrance");
  const normal = publicPlacement("normal", "world", [103, 100], ["travelPoint"], "Duskfall Depths", { mapSpaceId: "duskfall", position: [500, 600] });
  const corrupted = publicPlacement("corrupted", "world", [104, 100], ["travelPoint"], "Duskfall Depths", { mapSpaceId: "duskfall", position: [500, 600] });
  const corruptedUnresolved = { ...publicPlacement("corrupted-unresolved", "world", [104.5, 100], ["travelPoint"], "Duskfall Depths Corrupted"), travel: { transitionId: "corrupted-unresolved", enabled: true, destination: { status: "unresolved" as const, reason: "Destination scene is unresolved." } } };
  const interiorEntrance = publicPlacement("interior", "duskfall", [510, 600], ["travelPoint"], "Coalway Swamp", { mapSpaceId: "world", position: [100, 100] });
  const caveNormal = publicPlacement("cave-a", "world", [20, 20], ["travelPoint"], "Cave", { mapSpaceId: "cave", position: [700, 800] });
  const caveCorrupted = publicPlacement("cave-b", "world", [20.02, 20], ["travelPoint"], "Cave", { mapSpaceId: "cave", position: [700, 800] });
  const unresolvedNormal = { ...publicPlacement("unresolved-a", "world", [40, 40], ["travelPoint"], "Challenge Stone"), travel: { transitionId: "unresolved-a", enabled: true, destination: { status: "unresolved" as const, reason: "Destination is not published." } } };
  const unresolvedCorrupted = { ...unresolvedNormal, placementId: "unresolved-b", travel: { ...unresolvedNormal.travel, transitionId: "unresolved-b" } };
  const result = foldTravelPlacements([dungeon, normal, corrupted, corruptedUnresolved, interiorEntrance, caveNormal, caveCorrupted, unresolvedNormal, unresolvedCorrupted]);

  expect(result.placements.map((placement) => placement.placementId)).toEqual(["dungeon", "interior", "cave-a", "unresolved-a"]);
  expect(result.placements[0]).toMatchObject({ label: "Duskfall Depths", categories: ["dungeonEntrance", "travelPoint"], travel: normal.travel });
  expect(result.replacementIds.get("normal")).toBe("dungeon");
  expect(result.replacementIds.get("corrupted")).toBe("dungeon");
  expect(result.replacementIds.get("corrupted-unresolved")).toBe("dungeon");
  expect(result.placements[1]).toBe(interiorEntrance);
  expect(result.replacementIds.get("cave-b")).toBe("cave-a");
  expect(result.replacementIds.get("unresolved-b")).toBe("unresolved-a");
});
