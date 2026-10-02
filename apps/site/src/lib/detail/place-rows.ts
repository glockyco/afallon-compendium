import type { CreatureRow, Ref } from '@afallon/contracts/public';

/** Show a boss only once, even when its place has no creature row for it. */
export function placeCreatureRows(bosses: readonly Ref[], creatures: readonly CreatureRow[]): { bosses: CreatureRow[]; creatures: CreatureRow[] } {
  const bossKeys = new Set(bosses.flatMap((boss) => boss.key === null ? [] : [boss.key]));
  const bossRows: CreatureRow[] = [];
  const otherRows: CreatureRow[] = [];
  for (const creature of creatures) {
    (creature.counterpart.key !== null && bossKeys.has(creature.counterpart.key) ? bossRows : otherRows).push(creature);
  }
  for (const boss of bosses) {
    if (!bossRows.some((row) => boss.key !== null && row.counterpart.key === boss.key)) {
      bossRows.push({ counterpart: boss, roles: [], placementCount: 0 });
    }
  }
  return { bosses: bossRows, creatures: otherRows };
}
