import { expect, test } from 'bun:test';
import type { ItemFacts } from '@afallon/contracts/public';
import { compareItems, itemDisplay } from './item-comparison';

const gear = { itemPower: 15, minDamage: 14, maxDamage: 23, attackSpeed: 2.4, damagePerSecond: (14 + 23) / 2 / 2.4,
  stats: [{ stat: { key: 'stats:27', kind: 'stats', name: 'Strength' }, amount: 8, isPercent: false }],
  randomStats: [{ stat: { key: 'stats:27', kind: 'stats', name: 'Strength' }, min: 2, max: 8, isPercent: false, whole: true }],
  sockets: [], heroic: { statBonusPercent: 50 },
} as unknown as ItemFacts;

test('normal and Heroic compare fixed stats and rounded weapon endpoints, not random rolls', () => {
  const rows = compareItems(itemDisplay(gear, 0, false), itemDisplay(gear, 0, true), 0, 0);
  expect(rows).toEqual(expect.arrayContaining([
    expect.objectContaining({ name: 'Item Power', before: '15', after: '22', difference: '+7' }),
    expect.objectContaining({ name: 'Damage', before: '14–23', after: '21–34', difference: '+7–11' }),
    expect.objectContaining({ name: 'Strength', before: '+8', after: '+12', difference: '+4' }),
  ]));
  expect(rows.some((row) => row.name.includes('Random'))).toBe(false);
  expect(gear.randomStats[0]?.min).toBe(2);
});
