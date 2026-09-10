import { expect, test } from "bun:test";
import { gameplayLevelRange, levelRange, selectLevelRange } from "./publication";

test("level ranges require real paired bounds", () => {
  expect(levelRange(100, 100)).toBeUndefined();
  expect(levelRange(0, 20)).toBeUndefined();
  expect(levelRange(1, null)).toBeUndefined();
  expect(levelRange(1, 20)).toEqual({ min: 1, max: 20 });
});

test("gameplay range skips empty dungeon bounds and uses zone scaling", () => {
  expect(gameplayLevelRange({ dungeonLevelMin: 0, dungeonLevelMax: 0, zoneScalingMinLevel: 1, zoneScalingMaxLevel: 20 })).toEqual({ min: 1, max: 20 });
  expect(gameplayLevelRange({ minLevel: 100, maxLevel: 100 })).toBeUndefined();
});

test("placement-specific overrides beat a differing NPC base", () => {
  expect(selectLevelRange([{ min: 1, max: 2 }], [{ min: 15, max: 30 }], [{ min: 1, max: 3 }])).toEqual({ min: 1, max: 2 });
});

test("conflicting equally specific ranges are omitted", () => {
  expect(selectLevelRange([{ min: 1, max: 2 }, { min: 2, max: 3 }], [], [{ min: 1, max: 3 }])).toBeUndefined();
  expect(selectLevelRange([], [], [{ min: 1, max: 3 }, { min: 28, max: 28 }])).toBeUndefined();
});
