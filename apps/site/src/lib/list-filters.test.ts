import { expect, test } from 'bun:test';
import type { ListRow, PublicKindEntry } from '@afallon/contracts/public';
import { emptyFilters, facetOptions, facetValueLabel, formatStatParam, hiddenFacetOptions, listValueLabel, matchesFilters, parseStatParam, readFilters, statMatches, writeFilters, type ListFilterState } from './list-filters';

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

test('authored filter values use sentence case while game names keep their spelling', () => {
  expect(listValueLabel('rewardType', 'ITEM_CHOICE')).toBe('Item choice');
  expect(listValueLabel('slot', 'OFF_HAND')).toBe('Off hand');
  expect(listValueLabel('area', 'Duskfall Depths')).toBe('Duskfall Depths');
});

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

test('the Scales with filter includes abilities with the selected rank stat and excludes unrelated abilities', () => {
  const abilityKind: PublicKindEntry = { ...kind, kind: 'abilities', facets: [{ id: 'scalesWith', label: 'Scales With' }] };
  const ability = (name: string, stats: string[]): ListRow => ({
    ref: { key: `abilities:${name}`, kind: 'abilities', name, slug: name.toLowerCase().replaceAll(' ', '-') },
    values: { scalesWith: stats.join(', ') || null }, facets: { scalesWith: stats },
  });
  const abilities = [ability('Brutal Slice', ['Intellect']), ability('Fireball', ['Intellect', 'Healing Power']),
    ability('Shield Bash', ['Strength']), ability('Blink', [])];
  const selected = { ...emptyFilters(), facets: { scalesWith: ['Intellect'] } };
  expect(abilities.filter((entry) => matchesFilters(entry, selected, abilityKind, [])).map((entry) => entry.ref.name))
    .toEqual(['Brutal Slice', 'Fireball']);
  expect(abilities.filter((entry) => matchesFilters(entry, { ...selected, facets: { scalesWith: ['Strength'] } }, abilityKind, [])).map((entry) => entry.ref.name))
    .toEqual(['Shield Bash']);
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
    { id: 'sourceKind', label: 'Source' }, { id: 'knownWay', label: 'Availability', defaultHiddenValues: ['unknown'], valueLabels: { known: 'Used', unknown: 'Nobody Uses It' } },
  ] };
  const ability = (name: string, known: boolean): ListRow => ({
    ref: { key: `abilities:${name}`, kind: 'abilities', name, slug: name.toLowerCase() },
    values: { source: known ? 'Guardian' : null },
    facets: { sourceKind: known ? ['Creature'] : [], knownWay: [known ? 'known' : 'unknown'] },
  });
  const entries = [ability('Defiant Shout', true), ability('Shout', false),
    ...Array.from({ length: 53 }, (_, index) => ability(`Unused Ability ${index}`, false))];
  expect(hiddenFacetOptions(entries, emptyFilters(), abilities, [])[0]?.count).toBe(54);
  const search = { ...emptyFilters(), q: 'shout' };
  expect(entries.filter((entry) => matchesFilters(entry, search, abilities, [])).map((entry) => entry.ref.name)).toEqual(['Defiant Shout']);
  expect(hiddenFacetOptions(entries, search, abilities, []).map(({ value, count }) => [value, count])).toEqual([['unknown', 1]]);
  const revealed = { ...search, facets: { knownWay: ['unknown'] } };
  expect(entries.filter((entry) => matchesFilters(entry, revealed, abilities, [])).map((entry) => entry.ref.name)).toEqual(['Shout']);
  expect(hiddenFacetOptions(entries, revealed, abilities, [])).toEqual([]);
  expect(facetValueLabel(abilities.facets[1]!, 'unknown')).toBe('Nobody Uses It');
});

test('hidden reveal count obeys other facets, inclusive bounds, and stat requirements', () => {
  const items: PublicKindEntry = { ...kind, facets: [...kind.facets, { id: 'knownWay', label: 'Availability', defaultHiddenValues: ['unknown'] }] };
  const hidden = (name: string, slot: string, level: number, stat: number): ListRow => row(name, slot, 'Rare', {
    values: { levelRequirement: level }, facets: { slot: [slot], rarity: ['Rare'], itemType: ['ARMOR'], knownWay: ['unknown'] },
    stats: [{ name: 'Strength', percent: false, min: stat, max: stat }],
  });
  const entries = [hidden('Sword of Echoes', 'HANDS', 20, 30), hidden('Sword of Wind', 'HANDS', 21, 12), hidden('Sword of Mist', 'HEAD', 20, 30)];
  const narrowed: ListFilterState = { ...emptyFilters(), q: 'sword', facets: { slot: ['HANDS'] }, minimums: { levelRequirement: '20' },
    maximums: { levelRequirement: '20' }, stats: [{ key: 'Strength', min: '30', max: '' }] };
  expect(hiddenFacetOptions(entries, narrowed, items, ['levelRequirement'])[0]?.count).toBe(1);
  expect(hiddenFacetOptions(entries, { ...narrowed, minimums: { levelRequirement: '21' } }, items, ['levelRequirement'])).toEqual([]);
  expect(hiddenFacetOptions(entries, { ...narrowed, facets: { slot: ['BOOTS'] } }, items, ['levelRequirement'])).toEqual([]);
});

test('a level shown as a range matches the level bounds it overlaps, and an open range has no upper end', () => {
  const npcs: PublicKindEntry = { ...kind, kind: 'npcs', columns: [{ id: 'level', label: 'Level', sortable: true, numeric: true }], facets: [] };
  const npc = (name: string, level: string, range: ListRow['ranges']): ListRow => ({ ref: { key: `npcs:${name}`, kind: 'npcs', name, slug: name }, values: { level }, facets: {}, ranges: range });
  const roster = [npc('Bandit', '15–30', { level: { min: 15, max: 30 } }), npc('Wolf', '8', { level: { min: 8, max: 8 } }), npc('Shade', '40+', { level: { min: 40 } })];
  const matching = (minimum: string, maximum: string) => roster.filter((candidate) => matchesFilters(candidate, { ...emptyFilters(), minimums: { level: minimum }, maximums: { level: maximum } }, npcs, ['level'])).map((candidate) => candidate.ref.name);
  expect(matching('20', '')).toEqual(['Bandit', 'Shade']);
  expect(matching('', '15')).toEqual(['Bandit', 'Wolf']);
  expect(matching('31', '39')).toEqual([]);
  expect(matching('100', '')).toEqual(['Shade']);
  // A level shown only as text, with no published numbers, cannot satisfy a bound.
  expect(matchesFilters(npc('Unknown', '?', undefined), { ...emptyFilters(), minimums: { level: '1' } }, npcs, ['level'])).toBe(false);
});
