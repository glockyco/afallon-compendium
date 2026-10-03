import { expect, test } from 'bun:test';
import { empoweredStrength } from './heroic-strength';

const settings = { baseHealthMultiplier: 3, baseDamageMultiplier: 2, gearScoreCoefficient: 0.0008, maxGearBonus: 1 };

test.each([
  [0, 3, 2],
  [625, 4.5, 3],
  [1_250, 6, 4],
  [1_900, 6, 4],
])('equipped gear score %i yields health %i× and damage %i×', (score, health, damage) => {
  expect(empoweredStrength(settings, score)).toEqual({ health, damage });
});
