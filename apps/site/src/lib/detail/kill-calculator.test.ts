import { expect, test } from 'bun:test';
import { calculateKillAward, creatureLevels, killsToNextLevel, nearestCreatureLevel, progressionExample } from './kill-calculator';

// The publication gives the possible rolls, so the maximum here is a roll that can happen.
const creature = { minExperience: 100, maxExperience: 159, experiencePerLevel: 0, lowerModifier: -25, higherModifier: 15 };

test('higher and lower creature branches truncate each percentage contribution before addition', () => {
  const sample = { ...creature, minExperience: 5, maxExperience: 11, higherModifier: 30, lowerModifier: -30 };
  expect(calculateKillAward(sample, 21, 20, undefined, 0, 0).award).toEqual({ low: 6, high: 14 });
  expect(calculateKillAward(sample, 21, 21, undefined, 0, 0).award).toEqual({ low: 5, high: 11 });
  expect(calculateKillAward(sample, 21, 22, undefined, 0, 0).award).toEqual({ low: 4, high: 8 });
  expect(calculateKillAward(sample, 21, 1, undefined, 0, 0).award).toEqual({ low: 6, high: 14 });
});

test('the selected creature level, not a record level, decides the level step', () => {
  const sample = { ...creature, minExperience: 10, maxExperience: 10, higherModifier: -20, lowerModifier: 0 };
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

test('the level bonus adds the creature level before the level step, as measured on Brinecrest', () => {
  // Brinecrest rolls 70..119 with 1 experience per level. Measured kills at level 23 gave 107, 121, 127, 132, and 133,
  // and with the character at level 22 they gave 70, 75, 92, 98, and 99.
  const brinecrest = { minExperience: 70, maxExperience: 119, experiencePerLevel: 1, lowerModifier: 0, higherModifier: -30 };
  const same = calculateKillAward(brinecrest, 23, 23, undefined, 0, 0);
  expect(same.steps[1]).toEqual({ label: 'Level 23 × 1 per level', low: 93, high: 142 });
  expect(same.award).toEqual({ low: 93, high: 142 });
  expect(calculateKillAward(brinecrest, 23, 22, undefined, 0, 0).award).toEqual({ low: 66, high: 100 });
});

test('Heroic rounds half to even before followers split down and the positive bonus remains fractional', () => {
  const sample = { ...creature, minExperience: 5, maxExperience: 7, lowerModifier: 0, higherModifier: 0 };
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

test('opening estimate chooses a real level-matched creature and keeps the published fixed-level fallback', () => {
  const brinecrest = { minExperience: 70, maxExperience: 119, experiencePerLevel: 1, lowerModifier: 0, higherModifier: -30,
    creature: { key: 'npcs:brinecrest', variant: null }, level: { min: 23, max: 23, scales: false } };
  const scaling = { ...brinecrest, creature: { key: 'npcs:scaling', variant: null }, level: { min: 30, max: 50, scales: true } };
  const guide = { curve: { cap: 60, rows: [{ level: 40, toNext: 24496 }] }, killCalculator: {
    defaultCreature: brinecrest.creature, groups: [{ name: 'Grotto', creatures: [brinecrest] }, { name: 'Hills', creatures: [scaling] }],
  } } as unknown as Parameters<typeof progressionExample>[0];
  const at40 = progressionExample(guide, 40);
  expect(at40.entry.creature.key).toBe('npcs:scaling');
  expect(at40.creatureLevel).toBe(40);
  expect(at40.award).toEqual({ low: 110, high: 159 });
  expect(at40.kills).toEqual({ low: 155, high: 223 });
  const fixed = progressionExample(guide, 23);
  expect(fixed.entry.creature.key).toBe('npcs:brinecrest');
  expect(fixed.award).toEqual({ low: 93, high: 142 });
  expect(progressionExample(guide, 60).kills).toBeNull();
  expect(killsToNextLevel(24496, fixed.award)).toEqual({ low: 173, high: 264 });
});
