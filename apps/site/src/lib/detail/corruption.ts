import type { ItemFacts, Ref } from '@afallon/contracts/public';

type Preview = NonNullable<ItemFacts['corruption']>;

// The tooltip rounds each scaled weapon endpoint to nearest with midpoint-to-even ties.
// The combat weapon component keeps the unrounded multiplier; this function models display only.
export function roundTooltipDamage(value: number): number {
  const lower = Math.floor(value);
  const fraction = value - lower;
  if (fraction < 0.5) return lower;
  if (fraction > 0.5) return lower + 1;
  return lower % 2 === 0 ? lower : lower + 1;
}

export function scaledTemplateStat(base: number, stat: Ref, level: number, settings: Preview): number {
  const extra = base * level * settings.allStatsPercentPerLevel / 100;
  return base + extra + settings.statBonuses.reduce((total, bonus) =>
    bonus.stat.key === stat.key && stat.key !== null
      ? total + level * bonus.amountPerLevel * (bonus.isPercent ? base / 100 : 1)
      : total, 0);
}

export function corruptionDisplay(facts: ItemFacts, level: number) {
  const settings = facts.corruption;
  if (!settings || !Number.isInteger(level) || level < 0 || level > settings.maxLevel) return undefined;
  const stats = facts.stats.map((row) => ({ ...row, amount: scaledTemplateStat(row.amount, row.stat, level, settings) }));
  const itemPower = facts.itemPower === undefined ? undefined : Math.trunc(scaledTemplateStat(facts.itemPower,
    { key: 'stats:53', kind: 'stats', name: 'Item power' }, level, settings));
  const multiplier = 1 + level * settings.allStatsPercentPerLevel / 100;
  const minDamage = facts.minDamage === undefined ? undefined : roundTooltipDamage(facts.minDamage * multiplier);
  const maxDamage = facts.maxDamage === undefined ? undefined : roundTooltipDamage(facts.maxDamage * multiplier);
  const damagePerSecond = minDamage !== undefined && maxDamage !== undefined && facts.attackSpeed !== undefined && facts.attackSpeed > 0
    ? (minDamage + maxDamage) / 2 / facts.attackSpeed : undefined;
  return { stats, itemPower, minDamage, maxDamage, damagePerSecond };
}

const statFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });
export function tooltipStat(value: number): string { return statFormat.format(value); }
