import { expect, test } from 'bun:test';
import type { CharacterProgression } from '@afallon/contracts/public';
import { calculateKillAward, killsToNextLevel } from './kill-calculator';

type Creature = CharacterProgression['killCalculator']['groups'][number]['creatures'][number];
const creature: Creature = {
  creature: { key: 'npcs:1', kind: 'npcs', name: 'Example', slug: 'example' }, level: 21,
  minExperience: 100, maxExperience: 160, lowerModifier: -25, higherModifier: 15,
};

test('a whole-number roll excludes its maximum, and an equal pair gives exactly its value', () => {
  expect(calculateKillAward(creature, 21, undefined, 0, 0).award).toEqual({ low: 100, high: 159 });
  expect(calculateKillAward({ ...creature, minExperience: 7, maxExperience: 7 }, 21, undefined, 0, 0).award).toEqual({ low: 7, high: 7 });
});

test('higher and lower creature branches truncate each percentage contribution before addition', () => {
  const sample = { ...creature, minExperience: 5, maxExperience: 12, higherModifier: 30, lowerModifier: -30 };
  expect(calculateKillAward(sample, 20, undefined, 0, 0).award).toEqual({ low: 6, high: 14 });
  expect(calculateKillAward(sample, 21, undefined, 0, 0).award).toEqual({ low: 5, high: 11 });
  expect(calculateKillAward(sample, 22, undefined, 0, 0).award).toEqual({ low: 4, high: 8 });
  expect(calculateKillAward(sample, 1, undefined, 0, 0).award).toEqual({ low: 6, high: 14 });
});

test('Heroic rounds half to even before followers split down and the positive bonus remains fractional', () => {
  const sample = { ...creature, minExperience: 5, maxExperience: 8, lowerModifier: 0, higherModifier: 0 };
  const result = calculateKillAward(sample, 21, 1.5, 2, 10);
  expect(result.steps.slice(0, -1).map(({ low, high }) => [low, high])).toEqual([
    [5, 7], [5, 7], [8, 10], [2, 3],
  ]);
  expect(result.award.low).toBeCloseTo(2.2);
  expect(result.award.high).toBeCloseTo(3.3);
  expect(calculateKillAward({ ...sample, minExperience: 3, maxExperience: 3 }, 21, 1.5, 0, 0).award).toEqual({ low: 4, high: 4 });
  expect(calculateKillAward(sample, 21, undefined, 0, -10).award).toEqual({ low: 5, high: 7 });
  expect(calculateKillAward(sample, 21, undefined, 10, 0).award).toEqual({ low: 0, high: 0 });
});

test('kills to next level invert high and low awards and exclude the capped level', () => {
  expect(killsToNextLevel(100, { low: 20, high: 34 })).toEqual({ low: 3, high: 5 });
  expect(killsToNextLevel(100, { low: 0, high: 34 })).toEqual({ low: 3, high: null });
  expect(killsToNextLevel(100, { low: 0, high: 0 })).toBeNull();
});
