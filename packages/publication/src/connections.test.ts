import { expect, test } from "bun:test";
import type { CatalogTransitionRow } from "@afallon/contracts/catalog";
import { usableTeleports } from "./connections";

// The world map spans 0 to 100 and the cave map spans 0 to 10 on both axes.
const extents = new Map([["world", [0, 0, 100, 100] as const], ["cave", [0, 0, 10, 10] as const]]);
const at = (mapSpaceId: string, x: number, y: number): CatalogTransitionRow["start"] => ({ mapSpaceId, mapPosition: [x, y], worldPosition: [x, 5, y] });
const teleport = (transitionId: string, sourceSceneKey: string, destinationSceneKey: string | null, start: CatalogTransitionRow["start"], transitionKind = "effect-teleport"): CatalogTransitionRow =>
  ({ transitionId, sourceSceneKey, destinationSceneKey, transitionKind, placementIds: [], start });
const ids = (rows: readonly CatalogTransitionRow[]) => rows.map((row) => row.transitionId);

test("keeps every teleport kind and leaves out the dungeon entrance trigger", () => {
  expect(ids(usableTeleports([
    teleport("effect", "scenes:47", "scenes:10", at("world", 50, 50)),
    teleport("action", "scenes:47", "scenes:10", at("world", 51, 50), "game-action-teleport"),
    teleport("action-effect", "scenes:47", "scenes:10", at("world", 52, 50), "game-action-effect-teleport"),
    teleport("trigger", "scenes:47", "scenes:10", at("world", 50, 50), "dungeonEntranceTrigger"),
  ], extents))).toEqual(["effect", "action", "action-effect"]);
});

test("leaves out a teleport outside its map only when another place holds a copy with the same destination", () => {
  expect(ids(usableTeleports([
    teleport("stone-copy", "scenes:15", "scenes:10", at("world", 40, 40)),
    teleport("cave-copy", "scenes:31", "scenes:10", at("cave", 40, 40)),
    teleport("cave-exit", "scenes:31", "scenes:47", at("cave", 5, 5)),
    teleport("other-destination", "scenes:32", "scenes:47", at("cave", 40, 40)),
    teleport("sanctum-exit", "scenes:30", "scenes:47", at("cave", 60, 60)),
    teleport("unplaced", "scenes:33", "scenes:10", null),
  ], extents))).toEqual(["stone-copy", "cave-exit", "other-destination", "sanctum-exit", "unplaced"]);
});

test("keeps teleports to unknown places, because two unknown destinations are not known to be the same", () => {
  expect(ids(usableTeleports([
    teleport("first-unknown", "scenes:31", null, at("cave", 40, 40)),
    teleport("second-unknown", "scenes:32", null, at("cave", 40, 40)),
  ], extents))).toEqual(["first-unknown", "second-unknown"]);
});

test("stops on a transition kind that nobody has classified", () => {
  expect(() => usableTeleports([teleport("portal", "scenes:47", "scenes:10", null, "questScenePortal")], extents)).toThrow("unknown kind questScenePortal");
});
