import { expect, test } from 'bun:test';
import type { PublicGearSet } from '@afallon/contracts/public';
import { PUBLIC_KIND_BY_KIND } from './kind-registry';
import { buildKindLists } from './lists';

const piece: PublicGearSet['pieces'][number] = { item: { key: 'items:1', kind: 'items', name: 'Set piece', slug: 'set-piece' } };
const set = (name: string, count: number, threshold: number): PublicGearSet => ({
  ref: { key: `gearSets:${name}`, kind: 'gearSets', name, slug: name.toLowerCase() },
  description: null, art: {},
  type: 'Cloth', pieces: Array.from({ length: count }, () => piece), tiers: [{ equipped: threshold, stats: [] }],
});

test('a set with an exceptional last-bonus threshold retains it without duplicating ordinary piece counts', () => {
  const ordinary = set('Dawnstrider', 2, 2);
  const exceptional = set('Vermincrawl Garb', 7, 6);
  const lists = buildKindLists({ buildId: 'test', catalogId: 'test' }, [PUBLIC_KIND_BY_KIND.gearSets],
    new Map([[ordinary.ref.key, ordinary], [exceptional.ref.key, exceptional]]));
  const rows = lists.get('gearSets')?.flatMap((part) => part.rows) ?? [];
  expect(rows.map((row) => [row.ref.name, row.values.pieces, row.values.lastBonus])).toEqual([
    ['Dawnstrider', 2, null], ['Vermincrawl Garb', 7, 6],
  ]);
  expect(PUBLIC_KIND_BY_KIND.gearSets.columns.map((column) => [column.id, column.numeric])).toEqual([['type', false], ['pieces', true]]);
});
