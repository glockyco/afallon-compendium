import { describe, expect, test } from 'bun:test';
import type { ConnectionRow, CreatureRow, PlacementGroup, PlacementRef, Ref } from '@afallon/contracts/public';
import { placeConnectionRows, placeCreatureRows, placePointsOfInterest } from './place-rows';

const place: Ref = { key: 'place:afallon', kind: 'places', name: 'Afallon', slug: 'afallon' };
const boss: Ref = { key: 'npc:boss', kind: 'npcs', name: 'Boss', slug: 'boss' };
const missingBoss: Ref = { key: 'npc:missing', kind: 'npcs', name: 'Missing Boss', slug: 'missing-boss' };
const creature: Ref = { key: 'npc:other', kind: 'npcs', name: 'Other Creature', slug: 'other-creature' };

const spot = (placementId: string): PlacementRef => ({ placementId, mapSpaceId: 'world', label: 'Afallon' });

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

  test('merges teleports of one direction and place, counts each spot once, and keeps other directions apart', () => {
    const rows: ConnectionRow[] = [
      { counterpart: place, direction: 'to', placements: [spot('one'), spot('two')] },
      { counterpart: place, direction: 'to', placements: [spot('two'), spot('three')] },
      { counterpart: place, direction: 'from', placements: [] },
    ];
    const result = placeConnectionRows(rows);
    expect(result.map((row) => [row.direction, row.counterpart.key, row.placements.map((placement) => placement.placementId)])).toEqual([
      ['to', place.key, ['one', 'two', 'three']],
      ['from', place.key, []],
    ]);
  });
});
