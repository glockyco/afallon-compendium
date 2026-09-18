import { expect, test } from "bun:test";
import { owningContainerPlacement } from "./placements";

test("resolves a chest and its loot child to one placement", () => {
  const chestPath = "GAMEPLAY[0]/Backpack (1)[1]";
  const lootPath = `${chestPath}/Loot[0]`;
  const sourcesByPath = new Map<string, string[]>([[chestPath, ["chest-source"]], [lootPath, ["loot-source"]]]);
  const containerPlacements = new Map([["chest-source", "chest-placement"]]);

  expect(owningContainerPlacement(lootPath, sourcesByPath, containerPlacements)).toBe("chest-placement");
  expect(new Set([containerPlacements.get("chest-source"), owningContainerPlacement(lootPath, sourcesByPath, containerPlacements)])).toEqual(new Set(["chest-placement"]));
});

test("does not guess when no unique container ancestor exists", () => {
  expect(owningContainerPlacement("GAMEPLAY[0]/Loot[0]", new Map(), new Map())).toBeNull();
  expect(owningContainerPlacement("GAMEPLAY[0]/Chest[0]/Loot[0]", new Map([["GAMEPLAY[0]/Chest[0]", ["a", "b"]]]), new Map([["a", "one"], ["b", "two"]]))).toBeNull();
});
