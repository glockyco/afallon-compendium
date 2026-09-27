import type { ConnectionRow, CreatureRow, PlacementGroup, PlacementRef, Ref } from '@afallon/contracts/public';
import { connectionLabel, roleLabel } from '../format';
import { uniquePlacements } from './relation-table';

export interface PlaceConnectionRow {
  counterpart: Ref;
  way: string;
  placements: PlacementRef[];
}

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

/** A category already named by a creature or NPC row does not need a second listing. */
export function placePointsOfInterest(groups: readonly PlacementGroup[], inhabitants: readonly CreatureRow[]): PlacementGroup[] {
  const shownRoles = new Set(inhabitants.flatMap((row) => row.roles));
  return groups.filter((group) => !shownRoles.has(group.category)).sort((left, right) => roleLabel(left.category).localeCompare(roleLabel(right.category)));
}

/** Connections differ only by placement when the place and readable way of travel agree. */
export function placeConnectionRows(connections: readonly ConnectionRow[]): PlaceConnectionRow[] {
  const groups = new Map<string, ConnectionRow[]>();
  for (const connection of connections) {
    const way = connectionLabel(connection.kind);
    const key = JSON.stringify(connection.counterpart.key === null
      ? ['unresolved', connection.counterpart.label, way]
      : ['place', connection.counterpart.key, way]);
    const group = groups.get(key);
    if (group) group.push(connection);
    else groups.set(key, [connection]);
  }
  const rows: PlaceConnectionRow[] = [];
  for (const group of groups.values()) {
    const first = group[0];
    if (!first) continue;
    rows.push({
      counterpart: first.counterpart,
      way: connectionLabel(first.kind),
      placements: uniquePlacements(group.map((connection) => connection.placements)),
    });
  }
  return rows;
}
