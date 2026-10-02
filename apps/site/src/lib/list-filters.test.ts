import { expect, test } from 'bun:test';
import type { ListRow, PublicKindEntry } from '@afallon/contracts/public';
import { emptyFilters, facetOptions, formatStatParam, matchesFilters, parseStatParam, readFilters, statMatches, writeFilters, type ListFilterState } from './list-filters';

const kind: PublicKindEntry = {
  kind: 'items', label: 'Item', plural: 'Items', route: 'items', icon: 'item', pages: true, list: true, searchable: true,
  columns: [{ id: 'levelRequirement', label: 'Level', sortable: true, numeric: true }],
  facets: [{ id: 'slot', label: 'Slot' }, { id: 'rarity', label: 'Rarity' }, { id: 'itemType', label: 'Type' }],
};
const row = (name: string, slot: string, rarity: string, extra: Partial<ListRow> = {}): ListRow => ({
  ref: { key: `items:${name}`, kind: 'items', name, slug: name }, values: { levelRequirement: 10 },
  facets: { slot: [slot], rarity: [rarity], itemType: ['ARMOR'] }, ...extra,
});
const rows = [row('Boots A', 'BOOTS', 'Rare'), row('Boots B', 'BOOTS', 'Common'), row('Gloves A', 'GLOVES', 'Rare'), row('Helm A', 'HEAD', 'Rare')];
const state = (facets: ListFilterState['facets']): ListFilterState => ({ ...emptyFilters(), facets });
const names = (selected: ListFilterState) => rows.filter((candidate) => matchesFilters(candidate, selected, kind, ['levelRequirement'])).map((candidate) => candidate.ref.name);

test('values of one facet widen the results and different facets narrow them', () => {
  expect(names(state({ slot: ['BOOTS', 'GLOVES'] }))).toEqual(['Boots A', 'Boots B', 'Gloves A']);
  expect(names(state({ slot: ['BOOTS', 'GLOVES'], rarity: ['Rare'] }))).toEqual(['Boots A', 'Gloves A']);
});

test('a facet counts what each value would add under the other filters', () => {
  const slots = facetOptions(rows, state({ slot: ['BOOTS'], rarity: ['Rare'] }), kind, ['levelRequirement'], kind.facets[0]!);
  expect(slots).toEqual([{ value: 'BOOTS', count: 1 }, { value: 'GLOVES', count: 1 }, { value: 'HEAD', count: 1 }]);
  const rarities = facetOptions(rows, state({ slot: ['BOOTS'] }), kind, ['levelRequirement'], kind.facets[1]!);
  expect(rarities).toEqual([{ value: 'Common', count: 1 }, { value: 'Rare', count: 1 }]);
});

test('a value that every row has is not offered unless it is selected', () => {
  expect(facetOptions(rows, emptyFilters(), kind, [], kind.facets[2]!)).toEqual([]);
  expect(facetOptions(rows, state({ itemType: ['ARMOR'] }), kind, [], kind.facets[2]!)).toEqual([{ value: 'ARMOR', count: 4 }]);
  const mixed = [...rows, row('Ring A', 'RING', 'Rare', { facets: { slot: ['RING'], rarity: ['Rare'], itemType: ['ARMOR', 'QUEST'] } })];
  expect(facetOptions(mixed, emptyFilters(), kind, [], kind.facets[2]!)).toEqual([{ value: 'QUEST', count: 1 }]);
});

test('stat bounds are inclusive, random ranges match by overlap, and units stay apart', () => {
  const fixed = row('Fixed', 'HEAD', 'Rare', { stats: [{ name: 'Strength', percent: false, min: 20, max: 20 }] });
  const random = row('Random', 'HEAD', 'Rare', { stats: [{ name: 'Health', percent: false, min: 10, max: 40 }] });
  const percent = row('Percent', 'HEAD', 'Rare', { stats: [{ name: 'Lifesteal', percent: true, min: 2, max: 2 }] });
  expect(statMatches(fixed, { key: 'Strength', min: '20', max: '20' })).toBe(true);
  expect(statMatches(fixed, { key: 'Strength', min: '21', max: '' })).toBe(false);
  expect(statMatches(fixed, { key: 'Strength', min: '', max: '' })).toBe(true);
  expect(statMatches(random, { key: 'Health', min: '35', max: '60' })).toBe(true);
  expect(statMatches(random, { key: 'Health', min: '41', max: '' })).toBe(false);
  expect(statMatches(percent, { key: 'Lifesteal', min: '', max: '' })).toBe(false);
  expect(statMatches(percent, { key: 'Lifesteal%', min: '1', max: '' })).toBe(true);
});

test('filters survive a round trip through the URL', () => {
  expect(parseStatParam('Bonus: Fire Damage:5:')).toEqual({ key: 'Bonus: Fire Damage', min: '5', max: '' });
  expect(parseStatParam('Strength')).toEqual({ key: 'Strength', min: '', max: '' });
  expect(formatStatParam({ key: 'Strength', min: '', max: '' })).toBe('Strength');
  const selected: ListFilterState = { q: 'boots', facets: { slot: ['BOOTS', 'GLOVES'] }, minimums: { levelRequirement: '5' }, maximums: { levelRequirement: '' },
    stats: [{ key: 'Lifesteal%', min: '1', max: '3' }, { key: 'Stamina', min: '', max: '' }] };
  const params = new URLSearchParams('sort=gear');
  writeFilters(params, selected, kind, ['levelRequirement']);
  expect(params.get('sort')).toBe('gear');
  const restored = readFilters(new URLSearchParams(params.toString()), kind, ['levelRequirement']);
  expect(restored).toEqual({ ...selected, facets: { slot: ['BOOTS', 'GLOVES'], rarity: [], itemType: [] } });
});
