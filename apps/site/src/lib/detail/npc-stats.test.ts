import { expect, test } from 'bun:test';
import type { NpcStatRow } from '@afallon/contracts/public';
import { npcStatDisplay, projectNpcStat } from './npc-stats';

const health: NpcStatRow = {
  stat: { key: 'stats:0', kind: 'stats', name: 'Health' },
  startingValue: 100, amount: 187.2, perLevel: 84.24, isPercent: false,
};

test('Fangchill health includes base, added value, and gain at the selected creature level', () => {
  expect(projectNpcStat(health, 20)).toBeCloseTo(1972);
  expect(projectNpcStat(health, 30)).toBeCloseTo(2814.4);
  expect(npcStatDisplay(health, 20)).toBe('1,972');
});

test('fixed Aquarius uses its spawned level rather than the level 21 template', () => {
  const fixed: NpcStatRow = { ...health, startingValue: 100, amount: 56605, perLevel: 195 };
  expect(projectNpcStat(fixed, 20)).toBe(60605);
  expect(npcStatDisplay(fixed, 20)).toBe('60,605');
  expect(npcStatDisplay(fixed, 20, true)).toBe('At level 20: 60,605');
});

test('float coefficients from the real export retain player-readable totals', () => {
  const exported: NpcStatRow = { ...health, amount: 187.20001, perLevel: 84.240005 };
  expect(npcStatDisplay(exported, 20)).toBe('1,972');
  expect(npcStatDisplay(exported, 30)).toBe('2,814.4');
});

test('a zero added value still grows at each creature level', () => {
  const strength: NpcStatRow = { ...health, stat: { key: 'stats:27', kind: 'stats', name: 'Strength' }, startingValue: 0, amount: 0, perLevel: 5 };
  expect(projectNpcStat(strength, 20)).toBe(100);
});

test('the observed Heroic goat applies its multiplier after normal maximum health', () => {
  const goat: NpcStatRow = { ...health, amount: 57.6, perLevel: 25.92 };
  const normal = projectNpcStat(goat, 20);
  expect(normal).toBeCloseTo(676);
  expect(normal! * 4.89384).toBeCloseTo(3308.23584);
});

test('unverified stat types do not claim a complete value from the flat formula', () => {
  const movement: NpcStatRow = { ...health, stat: { key: 'stats:30', kind: 'stats', name: 'Movement Speed' }, startingValue: 5, amount: -15, perLevel: 0 };
  expect(projectNpcStat(movement, 20)).toBeUndefined();
  expect(npcStatDisplay(movement, 20)).toBe('-15 bonus');
});

test('missing coefficients or override mechanics do not present added values as totals', () => {
  for (const stat of [
    { ...health, perLevel: undefined },
    { ...health, startingValue: undefined },
    { ...health, minValue: 200 },
    { ...health, maxValue: 5000 },
    { ...health, startPercentage: 50 },
    { ...health, isPercent: true },
  ]) {
    expect(projectNpcStat(stat, 20)).toBeUndefined();
    expect(npcStatDisplay(stat, 20)).toBe('+187.2' + (stat.isPercent ? '%' : '') + ' bonus');
  }
  expect(projectNpcStat(health, 0)).toBeUndefined();
  expect(projectNpcStat(health, undefined)).toBeUndefined();
  expect(projectNpcStat(health, 20.5)).toBeUndefined();
});
