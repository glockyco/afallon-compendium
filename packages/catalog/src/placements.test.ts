import { expect, test } from "bun:test";
import { containerPlacementAlias, mergedPlacementId, owningContainerPlacement } from "./placements";

test("resolves a chest and its loot child to one placement", () => {
  const chestPath = "GAMEPLAY[0]/Backpack (1)[1]";
  const lootPath = `${chestPath}/Loot[0]`;
  const sourcesByPath = new Map<string, string[]>([[chestPath, ["chest-source"]], [lootPath, ["loot-source"]]]);
  const containerPlacements = new Map([["chest-source", "chest-placement"]]);

  const owner = owningContainerPlacement(lootPath, sourcesByPath, containerPlacements);
  expect(owner).toBe("chest-placement");
  const directRolePlacements = new Map([["loot-source", "chest-placement"]]);
  expect(containerPlacementAlias("loot-source", "loot-placement", lootPath, sourcesByPath, directRolePlacements, new Set(["chest-placement"]))).toBe("chest-placement");
  const aliases = new Map([["loot-source", owner!]]);
  expect(mergedPlacementId("loot-placement", false, ["loot-source"], aliases)).toBe("chest-placement");
  expect(new Set([containerPlacements.get("chest-source"), mergedPlacementId("loot-placement", false, ["loot-source"], aliases)])).toEqual(new Set(["chest-placement"]));
});

test("does not guess when no unique container ancestor exists", () => {
  expect(owningContainerPlacement("GAMEPLAY[0]/Loot[0]", new Map(), new Map())).toBeNull();
  expect(owningContainerPlacement("GAMEPLAY[0]/Chest[0]/Loot[0]", new Map([["GAMEPLAY[0]/Chest[0]", ["a", "b"]]]), new Map([["a", "one"], ["b", "two"]]))).toBeNull();
});
