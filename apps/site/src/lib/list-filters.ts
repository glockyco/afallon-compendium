import type { ListRow, ListStat, PublicKindEntry } from '@afallon/contracts/public';
import { categoryLabel } from '@afallon/contracts/public';
import { compareFacetValues, questStartLabel, readerNoun, roleLabel, sourceKindLabel } from './format';

/** A stat filter: the stat's key, and its inclusive bounds as typed. An empty bound is open. */
export type StatFilter = { key: string; min: string; max: string };
export type ListFilterState = {
  q: string;
  facets: Record<string, string[]>;
  minimums: Record<string, string>;
  maximums: Record<string, string>;
  stats: StatFilter[];
};
type Facet = PublicKindEntry['facets'][number];

// Published column and facet ids whose values are native enums, marker roles, item source kinds, or quest start
// kinds rather than authored names. Everything else prints as published, because a place or faction name is text.
const ENUM_FIELDS: Record<string, true> = { rarity: true, itemType: true, slot: true, placeType: true, weapon: true, armor: true, rewardType: true };
const BOOLEAN_LABELS: Record<string, string> = { true: 'Yes', false: 'No' };

/** The reader-facing label of a published column or facet value. */
export function listValueLabel(id: string, value: string): string {
  if (BOOLEAN_LABELS[value]) return BOOLEAN_LABELS[value]!;
  if (id === 'role') return roleLabel(value);
  if (id === 'sourceKind') return sourceKindLabel(value);
  if (id === 'startType') return questStartLabel(value);
  if (!ENUM_FIELDS[id]) return value;
  const label = readerNoun(categoryLabel(value));
  return label.charAt(0).toLocaleUpperCase('en-US') + label.slice(1);
}

/** Published facet keys stay stable in filters and URLs; the registry owns their reader-facing words. */
export function facetValueLabel(facet: Facet, value: string): string {
  return facet.valueLabels?.[value] ?? listValueLabel(facet.id, value);
}

export const emptyFilters = (): ListFilterState => ({ q: '', facets: {}, minimums: {}, maximums: {}, stats: [] });

/** A flat stat and a percentage stat with the same name are different stats. */
export function statKey(stat: Pick<ListStat, 'name' | 'percent'>): string {
  return `${stat.name}${stat.percent ? '%' : ''}`;
}

export function statLabel(key: string): string {
  return key.endsWith('%') ? `${key.slice(0, -1)} (%)` : key.endsWith('*') ? key.slice(0, -1) : key;
}

/** `Strength:20:` reads as at least 20 Strength. The last two colons hold the bounds, so a name may contain a colon. */
export function parseStatParam(value: string): StatFilter | null {
  const second = value.lastIndexOf(':');
  const first = second < 0 ? -1 : value.lastIndexOf(':', second - 1);
  if (first < 0) return value ? { key: value, min: '', max: '' } : null;
  const key = value.slice(0, first);
  return key ? { key, min: value.slice(first + 1, second), max: value.slice(second + 1) } : null;
}

export function formatStatParam(filter: StatFilter): string {
  return filter.min || filter.max ? `${filter.key}:${filter.min}:${filter.max}` : filter.key;
}

const bound = (value: string | undefined): number | undefined => value === undefined || value.trim() === '' || Number.isNaN(Number(value)) ? undefined : Number(value);

function statEntries(row: ListRow, key: string): ListStat[] {
  // The stat page's "*" key covers both flat and percentage item variants; ordinary facet keys keep their meaning.
  return (row.stats ?? []).filter((stat) => key.endsWith('*') ? stat.name === key.slice(0, -1) : statKey(stat) === key);
}

/** A fixed amount matches inside the bounds; a random range matches when it overlaps them. */
export function statMatches(row: ListRow, filter: StatFilter): boolean {
  const minimum = bound(filter.min), maximum = bound(filter.max);
  return statEntries(row, filter.key).some((stat) => (minimum === undefined || stat.max >= minimum) && (maximum === undefined || stat.min <= maximum));
}

/** The highest amount of a stat on a row, for sorting. */
export function statSortValue(row: ListRow, key: string): number | undefined {
  const entries = statEntries(row, key);
  return entries.length ? Math.max(...entries.map((stat) => stat.max)) : undefined;
}

export function statAmounts(row: ListRow, key: string): ListStat[] {
  return statEntries(row, key);
}

/**
 * Whether a row passes every active filter. `skipFacet` leaves one facet out, so that facet's counts show what each of
 * its values would add.
 */
export function matchesFilters(row: ListRow, state: ListFilterState, kind: PublicKindEntry, numericColumns: readonly string[], skipFacet?: string): boolean {
  const needle = state.q.trim().toLocaleLowerCase();
  if (needle && !row.ref.name.toLocaleLowerCase().includes(needle)) return false;
  for (const facet of kind.facets) {
    const values = row.facets[facet.id] ?? [];
    const selected = facet.id === skipFacet ? [] : state.facets[facet.id] ?? [];
    if (selected.length ? !selected.some((value) => values.includes(value)) : (facet.defaultHiddenValues ?? []).some((value) => values.includes(value))) return false;
  }
  for (const column of numericColumns) {
    const minimum = bound(state.minimums[column]), maximum = bound(state.maximums[column]);
    if (minimum === undefined && maximum === undefined) continue;
    // A row whose cell shows a range, such as a level range, matches when its range overlaps the bounds.
    const range = row.ranges?.[column];
    const value = row.values[column];
    const low = range ? range.min : typeof value === 'number' ? value : undefined;
    const high = range ? range.max ?? Infinity : low;
    if (low === undefined || high === undefined) return false;
    if (minimum !== undefined && high < minimum) return false;
    if (maximum !== undefined && low > maximum) return false;
  }
  return state.stats.every((filter) => statMatches(row, filter));
}

/** Hidden rows that would pass all current controls if the reader reveals their default-hidden value. */
export function hiddenFacetOptions(rows: readonly ListRow[], state: ListFilterState, kind: PublicKindEntry, numericColumns: readonly string[]): Array<{ facet: Facet; value: string; count: number }> {
  const options: Array<{ facet: Facet; value: string; count: number }> = [];
  for (const facet of kind.facets) {
    if ((state.facets[facet.id] ?? []).length) continue;
    for (const value of facet.defaultHiddenValues ?? []) {
      const revealed = { ...state, facets: { ...state.facets, [facet.id]: [value] } };
      let count = 0;
      for (const row of rows) if (matchesFilters(row, revealed, kind, numericColumns)) count += 1;
      if (count) options.push({ facet, value, count });
    }
  }
  return options;
}

export type FacetOption = { value: string; count: number };

/**
 * The values a facet offers, each with the number of rows it would match under the other filters. A value that every
 * row has separates nothing and is left out unless it is selected, so a facet whose values all cover every row offers
 * nothing.
 */
export function facetOptions(rows: readonly ListRow[], state: ListFilterState, kind: PublicKindEntry, numericColumns: readonly string[], facet: Facet): FacetOption[] {
  const selected = state.facets[facet.id] ?? [];
  const totals = new Map<string, number>();
  for (const row of rows) for (const value of new Set(row.facets[facet.id] ?? [])) totals.set(value, (totals.get(value) ?? 0) + 1);
  const offered = [...totals].filter(([value, total]) => total < rows.length || selected.includes(value)).map(([value]) => value);
  const counts = new Map<string, number>();
  for (const row of rows) {
    if (!matchesFilters(row, state, kind, numericColumns, facet.id)) continue;
    for (const value of new Set(row.facets[facet.id] ?? [])) counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  // A hidden-by-default value counts its rows even though the list hides them until it is selected.
  for (const value of facet.defaultHiddenValues ?? []) {
    if (!offered.includes(value)) continue;
    const hidden = rows.filter((row) => (row.facets[facet.id] ?? []).includes(value) && matchesFilters(row, { ...state, facets: { ...state.facets, [facet.id]: [value] } }, kind, numericColumns)).length;
    counts.set(value, hidden);
  }
  return offered.sort((left, right) => compareFacetValues(facet.id, left, right))
    .filter((value) => (counts.get(value) ?? 0) > 0 || selected.includes(value))
    .map((value) => ({ value, count: counts.get(value) ?? 0 }));
}

/** The stats that rows carry, most common first. */
export function statOptions(rows: readonly ListRow[]): Array<{ key: string; count: number }> {
  const counts = new Map<string, number>();
  for (const row of rows) for (const key of new Set((row.stats ?? []).map(statKey))) counts.set(key, (counts.get(key) ?? 0) + 1);
  return [...counts].map(([key, count]) => ({ key, count })).sort((left, right) => right.count - left.count || left.key.localeCompare(right.key));
}

export function readFilters(params: URLSearchParams, kind: PublicKindEntry, numericColumns: readonly string[]): ListFilterState {
  return {
    q: params.get('q') ?? '',
    facets: Object.fromEntries(kind.facets.map((facet) => [facet.id, params.getAll(facet.id)])),
    minimums: Object.fromEntries(numericColumns.map((column) => [column, params.get(`min.${column}`) ?? ''])),
    maximums: Object.fromEntries(numericColumns.map((column) => [column, params.get(`max.${column}`) ?? ''])),
    stats: params.getAll('stat').map(parseStatParam).filter((filter): filter is StatFilter => filter !== null),
  };
}

export function writeFilters(params: URLSearchParams, state: ListFilterState, kind: PublicKindEntry, numericColumns: readonly string[]): void {
  const write = (key: string, value: string) => value ? params.set(key, value) : params.delete(key);
  write('q', state.q.trim());
  for (const facet of kind.facets) {
    params.delete(facet.id);
    for (const value of state.facets[facet.id] ?? []) params.append(facet.id, value);
  }
  for (const column of numericColumns) {
    write(`min.${column}`, state.minimums[column] ?? '');
    write(`max.${column}`, state.maximums[column] ?? '');
  }
  params.delete('stat');
  for (const filter of state.stats) params.append('stat', formatStatParam(filter));
}

/** The filters that the Filters button counts: each facet value, each range with a bound, and each stat. */
export function activeFilterCount(state: ListFilterState): number {
  const ranges = new Set([...Object.entries(state.minimums), ...Object.entries(state.maximums)].filter(([, value]) => value.trim()).map(([column]) => column));
  return Object.values(state.facets).reduce((sum, values) => sum + values.length, 0) + ranges.size + state.stats.length;
}
