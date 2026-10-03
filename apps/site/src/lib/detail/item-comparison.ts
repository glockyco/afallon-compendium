import type { ItemFacts } from '@afallon/contracts/public';
import { formatNumber, rangeText, signedAmount } from '../format';
import { equipmentDisplay, tooltipStat, type EquipmentDisplay } from './corruption';

export type Display = EquipmentDisplay;
export type Change = { name: string; before: string; after: string; difference: string; negative: boolean };
const displayedStat = (amount: number, isPercent: boolean, level: number): string =>
  level === 0 ? signedAmount(amount, isPercent) : `${amount < 0 ? '-' : '+'}${tooltipStat(Math.abs(amount))}${isPercent ? '%' : ''}`;
const displayedNumber = (text: string): number => Number(text.replaceAll(',', '').replace('%', ''));
const delta = (difference: number, isPercent = false): string =>
  `${difference < 0 ? '-' : '+'}${tooltipStat(Math.abs(difference))}${isPercent ? '%' : ''}`;

/** Normal gear uses its published template values; both modified versions use the same tooltip arithmetic. */
export function itemDisplay(facts: ItemFacts, corruptionLevel: number, heroic: boolean): Display {
  return equipmentDisplay(facts, corruptionLevel, heroic) ?? {
    stats: facts.stats, itemPower: facts.itemPower, minDamage: facts.minDamage, maxDamage: facts.maxDamage, damagePerSecond: facts.damagePerSecond,
  };
}

export function compareItems(before: Display, after: Display, fromLevel: number, toLevel: number): Change[] {
  const rows: Change[] = [];
  const numeric = (name: string, left: number | undefined, right: number | undefined, render = formatNumber) => {
    if (left === undefined || right === undefined || left === right) return;
    const beforeText = render(left), afterText = render(right);
    if (beforeText === afterText) return;
    const difference = Number((displayedNumber(afterText) - displayedNumber(beforeText)).toFixed(2));
    rows.push({ name, before: beforeText, after: afterText, difference: delta(difference), negative: difference < 0 });
  };
  numeric('Item Power', before.itemPower, after.itemPower);
  if (before.minDamage !== undefined && before.maxDamage !== undefined && after.minDamage !== undefined && after.maxDamage !== undefined && (before.minDamage !== after.minDamage || before.maxDamage !== after.maxDamage)) {
    const low = after.minDamage - before.minDamage, high = after.maxDamage - before.maxDamage;
    rows.push({ name: 'Damage', before: rangeText(before.minDamage, before.maxDamage)!, after: rangeText(after.minDamage, after.maxDamage)!,
      difference: `${low < 0 ? '-' : '+'}${rangeText(Math.abs(low), Math.abs(high))}`, negative: low < 0 });
  }
  numeric('Damage per Second', before.damagePerSecond === undefined ? undefined : Number(before.damagePerSecond.toFixed(1)), after.damagePerSecond === undefined ? undefined : Number(after.damagePerSecond.toFixed(1)), (value) => value.toFixed(1));
  before.stats.forEach((stat, index) => {
    const next = after.stats[index];
    if (!next || next.amount === stat.amount) return;
    const beforeText = displayedStat(stat.amount, stat.isPercent, fromLevel);
    const afterText = displayedStat(next.amount, next.isPercent, toLevel);
    if (beforeText === afterText) return;
    const difference = Number((displayedNumber(afterText) - displayedNumber(beforeText)).toFixed(2));
    rows.push({ name: stat.stat.key === null ? stat.stat.label : stat.stat.name, before: beforeText, after: afterText,
      difference: delta(difference, stat.isPercent), negative: difference < 0 });
  });
  return rows;
}
