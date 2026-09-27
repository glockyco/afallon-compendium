import type { PlacementRef } from '@afallon/contracts/public';

/**
 * Several placements can share one area label. A location list shows each label once and keeps one map link
 * for each placement, in first-seen order.
 */
export function groupPlacementsByLabel(placements: readonly PlacementRef[]): [string, PlacementRef[]][] {
  const groups = new Map<string, PlacementRef[]>();
  for (const placement of placements) {
    const members = groups.get(placement.label);
    if (members) members.push(placement);
    else groups.set(placement.label, [placement]);
  }
  return [...groups];
}
