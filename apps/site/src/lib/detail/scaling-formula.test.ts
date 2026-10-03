import { expect, test } from 'bun:test';
import type { EffectScaling, Ref } from '@afallon/contracts/public';
import { hasScaling, rankStatNote, scalingBreakdown, scalingRows } from './scaling-formula';

const intellect: Ref = { key: 'stats:3', kind: 'stats', name: 'Intellect', slug: 'intellect' };
const strength: Ref = { key: 'stats:4', kind: 'stats', name: 'Strength', slug: 'strength' };
const health: Ref = { key: 'stats:0', kind: 'stats', name: 'Health', slug: 'health' };
const damage: EffectScaling = { baseAmount: 25, baseKind: 'flat', category: 'Slicing Damage', healing: false,
  weaponPercent: 200, weapons: ['main hand'], stats: [
    { stat: intellect, coefficientPercent: 100, source: 'damageType' },
    { stat: strength, coefficientPercent: 50, source: 'explicit' },
  ] };

const text = (scaling: EffectScaling) => scalingBreakdown(scaling).parts.map((part) =>
  `${part.label}${part.ref ? ('name' in part.ref ? part.ref.name : '') : ''}: ${part.amount}`);

test('damage lists weapon damage, flat damage, and each stat as separate parts', () => {
  expect(text(damage)).toEqual(['Main hand weapon damage: 200%', 'Slicing damage: 25', "Caster's Intellect: 100%", "Caster's Strength: 50%"]);
});

test('flat healing names its restored resource while percent bases distinguish maximum and current', () => {
  const heal: EffectScaling = { ...damage, healing: true, weaponPercent: 0, weapons: [], stats: [], baseStat: health, baseAmount: 150 };
  expect(text(heal)).toEqual(['Base healing: 150']);
  expect(text({ ...heal, baseKind: 'percentMax', baseAmount: 25 })).toEqual(["Target's maximum Health: 25%"]);
  expect(text({ ...heal, baseKind: 'percentCurrent', baseAmount: 25 })).toEqual(["Target's current Health: 25%"]);
});

test('an unknown basis is not labeled flat, zero parts vanish, and penalties keep their sign', () => {
  const unknown = scalingBreakdown({ ...damage, baseKind: 'unknown', weaponPercent: 0, stats: [] });
  expect(unknown.parts).toEqual([]);
  expect(unknown.note).toBe('The game lists an amount of 25, but how it is calculated is not known.');
  expect(hasScaling({ ...damage, baseAmount: 0, weaponPercent: 0, stats: [{ stat: strength, source: 'explicit', coefficientPercent: 0 }] })).toBe(false);
  expect(text({ ...damage, baseAmount: 0, weaponPercent: 0, stats: [{ stat: strength, source: 'explicit', coefficientPercent: -50 }] }))
    .toEqual(["Caster's Strength: −50%"]);
});

test('ranks line up by part, leaving a blank where a rank lacks that part', () => {
  const rows = scalingRows([{ ...damage, stats: [] }, { ...damage, baseAmount: 40, stats: [{ stat: intellect, coefficientPercent: 100, source: 'damageType' }] }]);
  expect(rows.map((row) => [row.part.id, ...row.amounts])).toEqual([
    ['weapon', '200%', '200%'], ['base', '25', '40'], ['stat-stats:3', '', '100%'],
  ]);
});

test('the tooltip note names stats only when one damage or one healing calculation applies to the rank', () => {
  const effect = { key: 'effects:1', kind: 'effects', name: 'Hit', slug: 'hit' } as const;
  const row = (scaling: EffectScaling, rank = 0) => ({ effect, rank, scaling });
  expect(rankStatNote([row({ ...damage, stats: [damage.stats[0]!, { stat: strength, coefficientPercent: -50, source: 'explicit' }] })], 0))
    .toBe("Adds 100% of the caster's Intellect − 50% of the caster's Strength to the Slicing Damage.");
  expect(rankStatNote([row(damage), row({ ...damage, baseAmount: 40 })], 0)).toBeUndefined();
  expect(rankStatNote([row(damage, 1)], 0)).toBeUndefined();
});
