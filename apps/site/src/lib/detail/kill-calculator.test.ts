import { expect, test } from 'bun:test';
import { calculateKillAward, creatureLevels, killsToNextLevel, nearestCreatureLevel } from './kill-calculator';

const creature = { minExperience: 100, maxExperience: 160, lowerModifier: -25, higherModifier: 15 };

test('a whole-number roll excludes its maximum, and an equal pair gives exactly its value', () => {
  expect(calculateKillAward(creature, 21, 21, undefined, 0, 0).award).toEqual({ low: 100, high: 159 });
  expect(calculateKillAward({ ...creature, minExperience: 7, maxExperience: 7 }, 21, 21, undefined, 0, 0).award).toEqual({ low: 7, high: 7 });
});

test('higher and lower creature branches truncate each percentage contribution before addition', () => {
  const sample = { ...creature, minExperience: 5, maxExperience: 12, higherModifier: 30, lowerModifier: -30 };
  expect(calculateKillAward(sample, 21, 20, undefined, 0, 0).award).toEqual({ low: 6, high: 14 });
  expect(calculateKillAward(sample, 21, 21, undefined, 0, 0).award).toEqual({ low: 5, high: 11 });
  expect(calculateKillAward(sample, 21, 22, undefined, 0, 0).award).toEqual({ low: 4, high: 8 });
  expect(calculateKillAward(sample, 21, 1, undefined, 0, 0).award).toEqual({ low: 6, high: 14 });
});

test('the selected creature level, not a record level, decides the level step', () => {
  const sample = { ...creature, minExperience: 10, maxExperience: 11, higherModifier: -20, lowerModifier: 0 };
  expect(calculateKillAward(sample, 16, 15, undefined, 0, 0).steps[1]).toEqual({ label: 'Creature above the player: -20%', low: 8, high: 8 });
  expect(calculateKillAward(sample, 14, 15, undefined, 0, 0).steps[1]).toEqual({ label: 'Creature below the player: no change', low: 10, high: 10 });
  expect(calculateKillAward(sample, 15, 15, undefined, 0, 0).steps[1]).toEqual({ label: 'Same level as the player', low: 10, high: 10 });
});

test('a creature level starts at the character level, limited to the levels of its place', () => {
  const fixed = { min: 5, max: 6, scales: false }, scaling = { min: 15, max: 30, scales: true }, open = { min: 5, scales: true };
  expect(creatureLevels(fixed, 60)).toEqual([5, 6]);
  expect(creatureLevels(open, 8)).toEqual([5, 6, 7, 8]);
  expect([nearestCreatureLevel(fixed, 1, 60), nearestCreatureLevel(fixed, 6, 60), nearestCreatureLevel(fixed, 40, 60)]).toEqual([5, 6, 6]);
  expect([nearestCreatureLevel(scaling, 12, 60), nearestCreatureLevel(scaling, 20, 60), nearestCreatureLevel(scaling, 31, 60)]).toEqual([15, 20, 30]);
  expect(nearestCreatureLevel(open, 59, 60)).toBe(59);
});

test('Heroic rounds half to even before followers split down and the positive bonus remains fractional', () => {
  const sample = { ...creature, minExperience: 5, maxExperience: 8, lowerModifier: 0, higherModifier: 0 };
  const result = calculateKillAward(sample, 21, 21, 1.5, 2, 10);
  expect(result.steps.slice(0, -1).map(({ low, high }) => [low, high])).toEqual([
    [5, 7], [5, 7], [8, 10], [2, 3],
  ]);
  expect(result.award.low).toBeCloseTo(2.2);
  expect(result.award.high).toBeCloseTo(3.3);
  expect(calculateKillAward({ ...sample, minExperience: 3, maxExperience: 3 }, 21, 21, 1.5, 0, 0).award).toEqual({ low: 4, high: 4 });
  expect(calculateKillAward(sample, 21, 21, undefined, 0, -10).award).toEqual({ low: 5, high: 7 });
  expect(calculateKillAward(sample, 21, 21, undefined, 10, 0).award).toEqual({ low: 0, high: 0 });
});

test('kills to next level invert high and low awards and exclude the capped level', () => {
  expect(killsToNextLevel(100, { low: 20, high: 34 })).toEqual({ low: 3, high: 5 });
  expect(killsToNextLevel(100, { low: 0, high: 34 })).toEqual({ low: 3, high: null });
  expect(killsToNextLevel(100, { low: 0, high: 0 })).toBeNull();
});
