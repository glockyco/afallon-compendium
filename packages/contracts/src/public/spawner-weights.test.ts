import { expect, test } from "bun:test";
import { spawnerChances, spawnerWeight } from "./spawner-weights";

const hole = { lowSkillWeight: 93, highSkillWeight: 32, teaserWeight: 0 };
const swirl = { lowSkillWeight: 0.5, highSkillWeight: 7, teaserWeight: 1 };

test("a weight moves evenly from level 1 to the skill cap and stays there above it", () => {
  expect([1, 150, 300].map((level) => spawnerWeight(hole, level, 150))).toEqual([93, 32, 32]);
  expect(spawnerWeight(hole, 76, 150)).toBeCloseTo(93 - 61 * 75 / 149);
});

test("a weight never drops below its minimum, and an attunement adds its bonus on top of the minimum", () => {
  expect(spawnerWeight(swirl, 1, 150)).toBe(1);
  expect(spawnerWeight(swirl, 1, 150, 10)).toBe(11);
});

test("chances divide each weight by the total weight at that level", () => {
  const chances = spawnerChances([hole, swirl], 150, 150, [0, 10]);
  expect(chances.map((chance) => chance.weight)).toEqual([32, 17]);
  expect(chances[0]!.percent + chances[1]!.percent).toBeCloseTo(100);
  expect(chances[1]!.percent).toBeCloseTo(17 / 49 * 100);
  expect(spawnerChances([{ lowSkillWeight: 0, highSkillWeight: 0, teaserWeight: 0 }], 1, 150)).toEqual([{ weight: 0, percent: 0 }]);
});
