import { expect, test } from 'bun:test';
import type { ItemFacts } from '@afallon/contracts/public';
import { corruptionDisplay, roundTooltipDamage } from './corruption';

const stat = (id: number, name: string, amount: number) => ({ stat: { key: `stats:${id}`, kind: 'stats' as const, name }, amount, isPercent: false });
const settings = { maxLevel: 30, allStatsPercentPerLevel: 5, statBonuses: [
  { stat: { key: 'stats:0', kind: 'stats' as const, name: 'Health' }, amountPerLevel: 15, isPercent: true },
  { stat: { key: 'stats:53', kind: 'stats' as const, name: 'Item power' }, amountPerLevel: 5, isPercent: false },
] };
const armor = { itemType: 'ARMOR', itemPower: 15, stats: [stat(10, 'Stamina', 2), stat(27, 'Strength', 2), stat(7, 'Armor', 22), stat(11, 'Agility', 3)],
  randomStats: [], sockets: [], corruption: settings } as unknown as ItemFacts;
const sword = { itemType: 'WEAPON', itemPower: 5, minDamage: 13, maxDamage: 22, attackSpeed: 2.8, stats: [stat(27, 'Strength', 3)],
  randomStats: [], sockets: [], corruption: settings } as unknown as ItemFacts;

test('armor calculated template matches measured level zero, one, five and cap', () => {
  expect(corruptionDisplay(armor, 0)).toMatchObject({ itemPower: 15, stats: [{ amount: 2 }, { amount: 2 }, { amount: 22 }, { amount: 3 }] });
  expect(corruptionDisplay(armor, 1)).toMatchObject({ itemPower: 20, stats: [{ amount: 2.1 }, { amount: 2.1 }, { amount: 23.1 }, { amount: 3.15 }] });
  expect(corruptionDisplay(armor, 5)).toMatchObject({ itemPower: 43, stats: [{ amount: 2.5 }, { amount: 2.5 }, { amount: 27.5 }, { amount: 3.75 }] });
  expect(corruptionDisplay(armor, 30)).toMatchObject({ itemPower: 187, stats: [{ amount: 5 }, { amount: 5 }, { amount: 55 }, { amount: 7.5 }] });
  expect(armor.stats[0]?.amount).toBe(2);
  expect(corruptionDisplay(armor, 31)).toBeUndefined();
});

test('weapon endpoints use midpoint-to-even before displayed DPS', () => {
  for (const [level, power, min, max, dps] of [
    [0, 5, 13, 22, '6.3'], [1, 10, 14, 23, '6.6'], [5, 31, 16, 28, '7.9'], [30, 162, 32, 55, '15.5'],
  ] as const) {
    const result = corruptionDisplay(sword, level);
    if (!result || result.damagePerSecond === undefined) throw new Error(`Missing weapon preview at level ${level}.`);
    expect([result.itemPower, result.minDamage, result.maxDamage, result.damagePerSecond.toFixed(1)]).toEqual([power, min, max, dps]);
  }
  expect(roundTooltipDamage(27.5)).toBe(28);
  expect(roundTooltipDamage(32.5)).toBe(32);
});

test('matching bonus types add independently without scaling rolls or gems', () => {
  const healthBonus = settings.statBonuses[0];
  if (!healthBonus) throw new Error('Missing Health bonus fixture.');
  const gear = { ...armor, itemPower: 100, stats: [stat(0, 'Health', 100)], randomStats: [{ stat: stat(0, 'Health', 0).stat, min: 34.77, max: 34.77, isPercent: false, whole: false }],
    gem: { stats: [stat(27, 'Strength', 3)] }, corruption: { ...settings, statBonuses: [...settings.statBonuses, { stat: healthBonus.stat, amountPerLevel: 4, isPercent: false }] } } as ItemFacts;
  expect(corruptionDisplay(gear, 5)).toMatchObject({ itemPower: 150, stats: [{ amount: 220 }] });
  expect(gear.randomStats[0]?.min).toBe(34.77);
  expect(gear.gem?.stats[0]?.amount).toBe(3);
  expect(corruptionDisplay({ ...gear, corruption: undefined }, 5)).toBeUndefined();
});
