import type { PublicPlacement, PublicSearchEntry, PublicationData } from '@afallon/contracts/public';
import type { ResultSummary, SearchResult } from './atlas-search-types';
import { MARKER_IDS, markerFor, resolveMarker, type MarkerId } from './map/marker-registry';

const searchKindOrder: Record<SearchResult['kind'], number> = { entry: 0, placement: 1 };

export interface SearchIndexes {
  entriesByKey: ReadonlyMap<string, PublicSearchEntry>;
  searchEntries: readonly { entry: PublicSearchEntry; text: string }[];
  placementSearchText: ReadonlyMap<string, string>;
  placementsById: ReadonlyMap<string, PublicPlacement>;
  placementsByEntryKey: ReadonlyMap<string, readonly PublicPlacement[]>;
  placementSummaries: ReadonlyMap<string, ResultSummary>;
  entrySummaries: ReadonlyMap<string, ResultSummary>;
}

export function getCategoryCounts(placements: PublicPlacement[]): Record<MarkerId, number> {
  const counts = Object.fromEntries(MARKER_IDS.map((id) => [id, 0])) as Record<MarkerId, number>;
  for (const placement of placements) for (const category of placement.categories) counts[category] += 1;
  return counts;
}

function nameRank(needle: string, name: string): number {
  const text = name.toLocaleLowerCase();
  return text === needle ? 0 : text.startsWith(needle) ? 1 : text.includes(needle) ? 2 : 3;
}

export function rankCompendiumEntries(query: string, entries: readonly PublicSearchEntry[]): PublicSearchEntry[] {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return [];
  return entries
    .filter((entry) => entry.ref.name.toLocaleLowerCase().includes(needle))
    .sort((left, right) => nameRank(needle, left.ref.name) - nameRank(needle, right.ref.name) || left.ref.name.localeCompare(right.ref.name) || left.ref.key.localeCompare(right.ref.key));
}

export function rankResults(needle: string, entries: PublicSearchEntry[], placements: PublicPlacement[]): SearchResult[] {
  const results: SearchResult[] = [
    ...entries.map((entry): SearchResult => ({ kind: 'entry', key: entry.ref.key, name: entry.ref.name, rank: nameRank(needle, entry.ref.name), entry })),
    ...placements.map((placement): SearchResult => ({ kind: 'placement', key: placement.placementId, name: placement.label, rank: nameRank(needle, placement.label), placement })),
  ];
  return results.sort((left, right) => left.rank - right.rank || (searchKindOrder[left.kind] ?? 0) - (searchKindOrder[right.kind] ?? 0) || left.name.localeCompare(right.name) || left.key.localeCompare(right.key));
}

export function emptySearchIndexes(): SearchIndexes {
  return {
    entriesByKey: new Map(),
    searchEntries: [],
    placementSearchText: new Map(),
    placementsById: new Map(),
    placementsByEntryKey: new Map(),
    placementSummaries: new Map(),
    entrySummaries: new Map(),
  };
}

export function summarizePlacements(placements: readonly PublicPlacement[], fallbackId: MarkerId): ResultSummary {
  const categoryIds = [...new Set(placements.flatMap((placement) => placement.categories))] as MarkerId[];
  const marker = markerFor(placements[0] ? (resolveMarker(placements[0]) ?? categoryIds[0] ?? fallbackId) : fallbackId);
  return {
    marker,
    categories: categoryIds.length > 0 ? categoryIds.map((category) => markerFor(category).label).join(' · ') : 'No map category',
  };
}

export function buildSearchIndexes(data: PublicationData, entries: readonly PublicSearchEntry[]): SearchIndexes {
  const placementsById = new Map(data.placements.map((placement) => [placement.placementId, placement]));
  const placementsByEntryKey = new Map<string, PublicPlacement[]>();
  for (const placement of data.placements) {
    for (const key of [...placement.entityKeys, ...placement.itemKeys]) {
      const known = placementsByEntryKey.get(key) ?? [];
      if (!known.some((candidate) => candidate.placementId === placement.placementId)) known.push(placement);
      placementsByEntryKey.set(key, known);
    }
  }
  return {
    entriesByKey: new Map(entries.map((entry) => [entry.ref.key, entry])),
    searchEntries: entries.map((entry) => ({ entry, text: [entry.ref.name, entry.place ?? '', ...entry.sourceKinds].join(' ').toLocaleLowerCase() })),
    placementSearchText: new Map(data.placements.map((placement) => [placement.placementId, placement.searchText.toLocaleLowerCase()])),
    placementsById,
    placementsByEntryKey,
    placementSummaries: new Map(data.placements.map((placement) => [placement.placementId, summarizePlacements([placement], 'interactiveObject')])),
    entrySummaries: new Map(entries.map((entry) => [entry.ref.key, summarizePlacements(placementsByEntryKey.get(entry.ref.key) ?? [], entry.ref.kind === 'items' ? 'container' : 'townsfolk')])),
  };
}

export function placementIds(placements: readonly PublicPlacement[]): string[] {
  return [...new Set(placements.map((placement) => placement.placementId))];
}

export function selectionHighlightIds(
  placement: PublicPlacement | null,
  entityKey: string | null,
  selectedItemKey: string | null,
  indexes: SearchIndexes,
): string[] {
  const selectedKey = selectedItemKey ?? entityKey;
  if (selectedKey) return placementIds(indexes.placementsByEntryKey.get(selectedKey) ?? []);
  if (!placement) return [];
  const related = [...placement.entityKeys, ...placement.itemKeys].flatMap((key) => indexes.placementsByEntryKey.get(key) ?? []);
  return placementIds([placement, ...related]);
}

export function resultHighlightIds(result: SearchResult | null, indexes: SearchIndexes): string[] {
  if (!result) return [];
  if (result.kind === 'placement') return [result.placement.placementId];
  return placementIds(indexes.placementsByEntryKey.get(result.entry.ref.key) ?? []);
}
