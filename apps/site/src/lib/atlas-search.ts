import type { PublicEntitySummary, PublicItemSummary, PublicPlacement, PublicationData } from '@afallon/contracts/public';
import type { ResultSummary, SearchResult } from './map/AtlasSearchResults.svelte';
import { MARKER_IDS, markerFor, resolveMarker, type MarkerId } from './map/marker-registry';

const searchKindOrder = { item: 0, placement: 1, entity: 2 };

export interface SearchIndexes {
    entitiesByKey: ReadonlyMap<string, PublicEntitySummary>;
    itemsByKey: ReadonlyMap<string, PublicItemSummary>;
    entitySearchEntries: readonly { entity: PublicEntitySummary; text: string }[];
    itemSearchEntries: readonly { item: PublicItemSummary; text: string }[];
    placementSearchText: ReadonlyMap<string, string>;
    placementsById: ReadonlyMap<string, PublicPlacement>;
    placementsByEntityKey: ReadonlyMap<string, readonly PublicPlacement[]>;
    placementsByItemKey: ReadonlyMap<string, readonly PublicPlacement[]>;
    placementSummaries: ReadonlyMap<string, ResultSummary>;
    entitySummaries: ReadonlyMap<string, ResultSummary>;
    itemSummaries: ReadonlyMap<string, ResultSummary>;
  }

export function getCategoryCounts(placements: PublicPlacement[]): Record<MarkerId, number> {
    const counts = Object.fromEntries(MARKER_IDS.map((id) => [id, 0])) as Record<MarkerId, number>;
    for (const placement of placements) for (const category of placement.categories) counts[category] += 1;
    return counts;
  }

export function rankResults(needle: string, items: PublicItemSummary[], entities: PublicEntitySummary[], placements: PublicPlacement[], names: ReadonlyMap<string, PublicEntitySummary>): SearchResult[] {
    // The atlas is small enough for exact and substring matching; avoid fuzzy ranking that obscures why a result matched.
    const rank = (name: string): number => {
      const text = name.toLocaleLowerCase();
      return text === needle ? 0 : text.startsWith(needle) ? 1 : text.includes(needle) ? 2 : 3;
    };
    const results: SearchResult[] = [];
    for (const item of items) {
      const name = names.get(item.itemKey)?.name ?? item.name;
      results.push({ kind: 'item', key: item.itemKey, name, rank: rank(name), item });
    }
    for (const entity of entities) results.push({ kind: 'entity', key: entity.entityKey, name: entity.name, rank: rank(entity.name), entity });
    for (const placement of placements) results.push({ kind: 'placement', key: placement.placementId, name: placement.label, rank: rank(placement.label), placement });
    return results.sort((a, b) => a.rank - b.rank || searchKindOrder[a.kind] - searchKindOrder[b.kind] || (a.name < b.name ? -1 : a.name > b.name ? 1 : a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  }

export function emptySearchIndexes(): SearchIndexes {
    return {
      entitiesByKey: new Map(), itemsByKey: new Map(), entitySearchEntries: [], itemSearchEntries: [], placementSearchText: new Map(),
      placementsById: new Map(),
      placementsByEntityKey: new Map(),
      placementsByItemKey: new Map(),
      placementSummaries: new Map(),
      entitySummaries: new Map(),
      itemSummaries: new Map(),
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

export function buildSearchIndexes(data: PublicationData): SearchIndexes {
    const placementsById = new Map(data.placements.map((placement) => [placement.placementId, placement]));
    const placementsByEntityKey = new Map<string, PublicPlacement[]>();
    for (const placement of data.placements) {
      for (const entityKey of placement.entityKeys) {
        const placements = placementsByEntityKey.get(entityKey) ?? [];
        placements.push(placement);
        placementsByEntityKey.set(entityKey, placements);
      }
    }
    const placementsByItemKey = new Map<string, PublicPlacement[]>();
    for (const placement of data.placements) for (const itemKey of placement.itemKeys) {
      const placements = placementsByItemKey.get(itemKey) ?? [];
      placements.push(placement);
      placementsByItemKey.set(itemKey, placements);
    }
    return {
      entitiesByKey: new Map(data.entityIndex.map((entity) => [entity.entityKey, entity])),
      itemsByKey: new Map(data.itemIndex.map((item) => [item.itemKey, item])),
      entitySearchEntries: data.entityIndex.filter((entity) => entity.kind !== 'items').map((entity) => ({ entity, text: `${entity.name} ${entity.description ?? ''}`.toLocaleLowerCase() })),
      itemSearchEntries: data.itemIndex.map((item) => ({ item, text: [item.name, ...item.sourceNames, ...item.sourceKinds].join(' ').toLocaleLowerCase() })),
      placementSearchText: new Map(data.placements.map((placement) => [placement.placementId, placement.searchText.toLocaleLowerCase()])),
      placementsById,
      placementsByEntityKey,
      placementsByItemKey,
      placementSummaries: new Map(data.placements.map((placement) => [placement.placementId, summarizePlacements([placement], 'interactiveObject')])),
      entitySummaries: new Map(data.entityIndex.map((entity) => [entity.entityKey, summarizePlacements(placementsByEntityKey.get(entity.entityKey) ?? [], 'townsfolk')])),
      itemSummaries: new Map(data.itemIndex.map((item) => [item.itemKey, summarizePlacements(placementsByItemKey.get(item.itemKey) ?? [], 'container')])),
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
    if (selectedItemKey) return placementIds(indexes.placementsByItemKey.get(selectedItemKey) ?? []);
    if (entityKey) return placementIds(indexes.placementsByEntityKey.get(entityKey) ?? []);
    if (!placement) return [];
    const related = placement.entityKeys.flatMap((key) => indexes.placementsByEntityKey.get(key) ?? []);
    return placementIds([placement, ...related]);
  }

export function resultHighlightIds(result: SearchResult | null, indexes: SearchIndexes): string[] {
    if (!result) return [];
    if (result.kind === 'placement') return [result.placement.placementId];
    if (result.kind === 'entity') return placementIds(indexes.placementsByEntityKey.get(result.entity.entityKey) ?? []);
    return placementIds(indexes.placementsByItemKey.get(result.item.itemKey) ?? []);
  }

