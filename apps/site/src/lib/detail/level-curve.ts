import type { LevelCurve } from '@afallon/contracts/public';

/** The value at a level is the total experience earned before reaching that level. */
export function cumulativeExperience(curve: LevelCurve): number[] {
  const totals = [0, 0];
  for (const row of curve.rows) totals[row.level + 1] = (totals[row.level] ?? 0) + row.toNext;
  return totals;
}

/** Published XP shares, not time played; the final ten level transitions are cap - 10 through cap. */
export function journeyShares(curve: LevelCurve, level: number): { earned: number; remaining: number; finalTen: number; total: number } {
  const totals = cumulativeExperience(curve);
  const total = totals[curve.cap] ?? 0;
  const earned = totals[Math.min(curve.cap, Math.max(1, level))] ?? 0;
  if (total === 0) return { earned: 0, remaining: 0, finalTen: 0, total };
  return {
    earned: earned / total,
    remaining: (total - earned) / total,
    finalTen: (total - (totals[Math.max(1, curve.cap - 10)] ?? 0)) / total,
    total,
  };
}
