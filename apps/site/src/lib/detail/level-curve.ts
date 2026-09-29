import type { LevelCurve } from '@afallon/contracts/public';

/** The value at a level is the total experience earned before reaching that level. */
export function cumulativeExperience(curve: LevelCurve): number[] {
  const totals = [0, 0];
  for (const row of curve.rows) totals[row.level + 1] = (totals[row.level] ?? 0) + row.toNext;
  return totals;
}
