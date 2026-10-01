import { expect, test } from "bun:test";
import { recipeRank, roundHalfEven, type CraftingRule } from "./crafting";

const rule: CraftingRule = { minimumRequiredLevel: 1, halfFromLevels: 20, noneFromLevels: 35, halfMultiplier: 0.5 };

test("a reduced amount rounds half to the even whole number", () => {
  expect([0.5, 1.5, 2.5, 3.5, 2.4, 2.6].map(roundHalfEven)).toEqual([0, 2, 2, 4, 2, 3]);
});

test("a rank's bands start at its required level and change at +10, +20, and +35 levels", () => {
  // An unlock cost below the minimum takes the minimum as its required level.
  expect(recipeRank({ rank: 1, unlockCost: 0, experience: 5 }, 300, rule)).toEqual({ rank: 1, requiredLevel: 1, baseExperience: 5, bands: [
    { band: "full", from: 1, to: 20, experience: 5 },
    { band: "half", from: 21, to: 35, experience: 2 }, { band: "none", from: 36, experience: 0 },
  ] });
  expect(recipeRank({ rank: 1, unlockCost: 40, experience: 7 }, 300, rule).bands.map((band) => [band.band, band.from, band.to, band.experience])).toEqual([
    ["full", 40, 59, 7], ["half", 60, 74, 4], ["none", 75, undefined, 0],
  ]);
});

test("bands stop at the skill's highest level, and a rank without base experience has none", () => {
  expect(recipeRank({ rank: 1, unlockCost: 290, experience: 5 }, 300, rule).bands).toEqual([
    { band: "full", from: 290, experience: 5 },
  ]);
  expect(recipeRank({ rank: 1, unlockCost: 10, experience: 0 }, 300, rule)).toEqual({ rank: 1, requiredLevel: 10, baseExperience: 0, bands: [] });
  expect(() => recipeRank({ rank: 1, unlockCost: 10, experience: 2.5 }, 300, rule)).toThrow();
});
