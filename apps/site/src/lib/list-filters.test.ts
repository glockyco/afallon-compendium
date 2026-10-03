import { expect, test } from 'bun:test';
import type { ListRow, PublicKindEntry } from '@afallon/contracts/public';
import { emptyFilters, facetOptions, formatStatParam, hiddenFacetOptions, matchesFilters, parseStatParam, readFilters, statMatches, writeFilters, type ListFilterState } from './list-filters';

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

test('a stat page finds both item bonus units without widening ordinary variant filters', () => {
  const flat = row('Flat', 'HEAD', 'Rare', { stats: [{ name: 'Movement Speed', percent: false, min: 3, max: 3 }] });
  const percent = row('Percent', 'HEAD', 'Rare', { stats: [{ name: 'Movement Speed', percent: true, min: 5, max: 5 }] });
  const unrelated = row('Other', 'HEAD', 'Rare', { stats: [{ name: 'Attack Speed', percent: true, min: 5, max: 5 }] });
  const statPage = { key: 'Movement Speed*', min: '', max: '' };
  expect([flat, percent, unrelated].filter((candidate) => statMatches(candidate, statPage)).map((entry) => entry.ref.name))
    .toEqual(['Flat', 'Percent']);
  expect(statMatches(percent, { ...statPage, key: 'Movement Speed' })).toBe(false);
  expect(statMatches(flat, { ...statPage, key: 'Movement Speed%' })).toBe(false);
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

test('a Shout search counts only its matching hidden ability and reveal retains the name search', () => {
  const abilities: PublicKindEntry = { ...kind, kind: 'abilities', facets: [
    { id: 'sourceKind', label: 'Source' }, { id: 'knownWay', label: 'Availability', defaultHiddenValues: ['No Known Way'] },
  ] };
  const ability = (name: string, known: boolean): ListRow => ({
    ref: { key: `abilities:${name}`, kind: 'abilities', name, slug: name.toLowerCase() },
    values: { source: known ? 'Guardian' : 'No Known Use' },
    facets: { sourceKind: [known ? 'Creature' : 'No Known Use'], knownWay: [known ? 'Known Way' : 'No Known Way'] },
  });
  const entries = [ability('Defiant Shout', true), ability('Shout', false),
    ...Array.from({ length: 53 }, (_, index) => ability(`Unused Ability ${index}`, false))];
  expect(hiddenFacetOptions(entries, emptyFilters(), abilities, [])[0]?.count).toBe(54);
  const search = { ...emptyFilters(), q: 'shout' };
  expect(entries.filter((entry) => matchesFilters(entry, search, abilities, [])).map((entry) => entry.ref.name)).toEqual(['Defiant Shout']);
  expect(hiddenFacetOptions(entries, search, abilities, []).map(({ value, count }) => [value, count])).toEqual([['No Known Way', 1]]);
  const revealed = { ...search, facets: { knownWay: ['No Known Way'] } };
  expect(entries.filter((entry) => matchesFilters(entry, revealed, abilities, [])).map((entry) => entry.ref.name)).toEqual(['Shout']);
  expect(hiddenFacetOptions(entries, revealed, abilities, [])).toEqual([]);
});

test('hidden reveal count obeys other facets, inclusive bounds, and stat requirements', () => {
  const items: PublicKindEntry = { ...kind, facets: [...kind.facets, { id: 'knownWay', label: 'Availability', defaultHiddenValues: ['No Known Way'] }] };
  const hidden = (name: string, slot: string, level: number, stat: number): ListRow => row(name, slot, 'Rare', {
    values: { levelRequirement: level }, facets: { slot: [slot], rarity: ['Rare'], itemType: ['ARMOR'], knownWay: ['No Known Way'] },
    stats: [{ name: 'Strength', percent: false, min: stat, max: stat }],
  });
  const entries = [hidden('Sword of Echoes', 'HANDS', 20, 30), hidden('Sword of Wind', 'HANDS', 21, 12), hidden('Sword of Mist', 'HEAD', 20, 30)];
  const narrowed: ListFilterState = { ...emptyFilters(), q: 'sword', facets: { slot: ['HANDS'] }, minimums: { levelRequirement: '20' },
    maximums: { levelRequirement: '20' }, stats: [{ key: 'Strength', min: '30', max: '' }] };
  expect(hiddenFacetOptions(entries, narrowed, items, ['levelRequirement'])[0]?.count).toBe(1);
  expect(hiddenFacetOptions(entries, { ...narrowed, minimums: { levelRequirement: '21' } }, items, ['levelRequirement'])).toEqual([]);
  expect(hiddenFacetOptions(entries, { ...narrowed, facets: { slot: ['BOOTS'] } }, items, ['levelRequirement'])).toEqual([]);
});
