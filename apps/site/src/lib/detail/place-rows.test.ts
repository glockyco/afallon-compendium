import { describe, expect, test } from 'bun:test';
import type { CreatureRow, PlacementGroup, Ref } from '@afallon/contracts/public';
import { placeCreatureRows, placePointsOfInterest } from './place-rows';

const boss: Ref = { key: 'npc:boss', kind: 'npcs', name: 'Boss', slug: 'boss' };
const missingBoss: Ref = { key: 'npc:missing', kind: 'npcs', name: 'Missing Boss', slug: 'missing-boss' };
const creature: Ref = { key: 'npc:other', kind: 'npcs', name: 'Other Creature', slug: 'other-creature' };

describe('place relation rows', () => {
  test('places each boss in one section and adds bosses with no creature row', () => {
    const rows: CreatureRow[] = [
      { counterpart: boss, roles: ['boss'], placementCount: 2, level: { min: 30, scales: false } },
      { counterpart: creature, roles: ['neutral'], placementCount: 1 },
    ];
    const result = placeCreatureRows([boss, missingBoss], rows);
    expect(result.bosses.map((row) => row.counterpart.key)).toEqual([boss.key, missingBoss.key]);
    expect(result.creatures.map((row) => row.counterpart.key)).toEqual([creature.key]);
    expect(result.bosses[1]?.placementCount).toBe(0);
  });

  test('shows only categories not represented by any inhabitant role, sorted by label', () => {
    const groups: PlacementGroup[] = [
      { category: 'oreVein', placementCount: 4 },
      { category: 'merchant', placementCount: 3 },
      { category: 'container', placementCount: 8 },
    ];
    expect(placePointsOfInterest(groups, [{ counterpart: creature, roles: ['merchant'], placementCount: 3 }]).map((row) => row.category)).toEqual(['container', 'oreVein']);
  });
});
