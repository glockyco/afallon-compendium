import type { NpcStatRow } from '@afallon/contracts/public';

const precise = new Intl.NumberFormat('en-US', { maximumFractionDigits: 3 });
// Other stat types can use bounds or modifiers outside the verified flat combat projection.
const VERIFIED_FLAT_STATS: Record<string, true> = {
  'stats:0': true, 'stats:27': true, 'stats:20': true, 'stats:21': true,
};

/** A creature's authored stat bonus is added to its starting value before the level gain. */
export function projectNpcStat(stat: NpcStatRow, level: number | undefined): number | undefined {
  if (!stat.stat.key || !Object.hasOwn(VERIFIED_FLAT_STATS, stat.stat.key)) return undefined;
  if (stat.isPercent || stat.startingValue === undefined || stat.perLevel === undefined ||
    stat.minValue !== undefined || stat.maxValue !== undefined || stat.startPercentage !== undefined ||
    level === undefined || !Number.isInteger(level) || level < 1) return undefined;
  return stat.startingValue + stat.amount + level * stat.perLevel;
}

/** Keep the authored sign and up to three meaningful decimal places in a stat operand. */
export function npcStatAmount(amount: number, isPercent = false): string {
  return `${amount < 0 ? '-' : '+'}${precise.format(Math.abs(amount))}${isPercent ? '%' : ''}`;
}

/** Never label a creature's authored bonus as the complete stat when its rule is unknown. */
export function npcStatDisplay(stat: NpcStatRow, level: number | undefined, nameLevel = false): string {
  const total = projectNpcStat(stat, level);
  return total === undefined ? `${npcStatAmount(stat.amount, stat.isPercent)} bonus`
    : `${nameLevel ? `At level ${level}: ` : ''}${precise.format(total)}`;
}
