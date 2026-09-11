<script lang="ts">
  import { pushState, replaceState } from '$app/navigation';
  import { base } from '$app/paths';
  import { onMount, tick } from 'svelte';
  import type { MapAdapter, MapAdapterUpdate, MapViewState } from './map-adapter';
  import { readMapUrl, writeMapUrl, type MapUrlState } from './map-url';
  import { filteredSections, linksFromSections } from './detail-utils';
  import DetailSections from './DetailSections.svelte';
  import {
    findItem,
    resolvePublicationAssets,
  } from './publication';
  import {
    MARKER_IDS,
    MARKER_SECTION_LABELS,
    MARKER_SECTION_ORDER,
    markerColorCss,
    markerFor,
    resolveMarker,
    type MarkerDefinition,
    type MarkerId,
  } from './map/marker-registry';
  import MapSidebarSection from './map/MapSidebarSection.svelte';
  import CategoryRow from './map/CategoryRow.svelte';
  import { markerGlyphSvg } from './map/icon-atlas';
  import { downloadWorldOffsets, loadWorldOffsetOverrides, saveWorldOffsetOverrides, type WorldOffsetOverrides } from './map/world-layout';
  import { PUBLICATION_SCHEMA_VERSION, type EntityDetailsDocument, type ItemSourcesDocument, type PublicEntity, type PublicEntitySummary, type PublicItemSource, type PublicItemSummary, type PublicPlacement, type PublicDetailSection, type PublicationData } from '../../../pipeline/public-contracts';

  interface LayerOption {
    id: string;
    label: string;
    kind: 'screenshot' | 'illustration';
    orientationOnly: boolean;
  }


  type SearchResult = { key: string; name: string; rank: number } & (
    | { kind: 'item'; item: PublicItemSummary }
    | { kind: 'entity'; entity: PublicEntitySummary }
    | { kind: 'placement'; placement: PublicPlacement }
  );
  const searchKindOrder = { item: 0, placement: 1, entity: 2 };
  const RESULT_LIMIT = 200;

  interface ResultSummary {
    marker: MarkerDefinition;
    categories: string;
    levels: string;
  }

  interface SearchIndexes {
    placementsById: ReadonlyMap<string, PublicPlacement>;
    placementsByEntityKey: ReadonlyMap<string, readonly PublicPlacement[]>;
    placementsByItemKey: ReadonlyMap<string, readonly PublicPlacement[]>;
    placementSummaries: ReadonlyMap<string, ResultSummary>;
    entitySummaries: ReadonlyMap<string, ResultSummary>;
    itemSummaries: ReadonlyMap<string, ResultSummary>;
  }

  let canvas: HTMLCanvasElement;
  let resultList: HTMLElement;
  let detailsPanel: HTMLElement;
  let searchInput: HTMLInputElement;
  let publication: PublicationData | null = null;
  let publicationUrl = '';
  let entityDetails = new Map<string, PublicEntity>();
  let itemDetails = new Map<string, PublicItemSource>();
  let detailRequests = new Map<string, Promise<void>>();
  let detailLoading = false;
  let detailError = '';
  let adapter: MapAdapter | null = null;
  let loading = true;
  let loadError = '';
  let layerId = 'captured';
  let selectedId: string | null = null;
  let query = '';
  let categories: MarkerId[] = [];
  let levelMinimum: number | null = null;
  let levelMaximum: number | null = null;
  let itemKey: string | null = null;
  let selectedEntityKey: string | null = null;
  let itemSourceQuery = '';
  let detailQuery = '';
  let hoveredId: string | null = null;
  let hoveredResult: SearchResult | null = null;
  let staleSelection = '';
  let viewportBounds: [number, number, number, number] | null = null;
  let view: MapViewState = { target: [0, 0, 0], zoom: -1 };
  let adapterReady = false;
  let detailOrigin: HTMLElement | null = null;
  let authoring = false;
  let showConnections = true;
  let panelCollapsed = false;
  let worldOffsetOverrides: WorldOffsetOverrides = {};
  let viewTimer: ReturnType<typeof setTimeout> | null = null;
  let queryTimer: ReturnType<typeof setTimeout> | null = null;
  let searchIndexes: SearchIndexes = emptySearchIndexes();

  $: layerOptions = getLayerOptions(publication);
  $: if (layerOptions.length > 0 && !layerOptions.some((layer) => layer.id === layerId)) layerId = layerOptions[0]!.id;
  $: currentLayer = layerOptions.find((layer) => layer.id === layerId) ?? null;
  $: orientationOnly = currentLayer?.orientationOnly ?? false;
  $: allMapPlacements = uniquePlacements(publication?.placements ?? []);
  $: entityIndexByKey = new Map(publication?.entityIndex.map((entity) => [entity.entityKey, entity]) ?? []);
  $: itemIndexByKey = new Map(publication?.itemIndex.map((item) => [item.itemKey, item]) ?? []);
  $: itemContext = itemKey ? itemDetails.get(itemKey) ?? null : null;
  $: sourceSearchEntries = (itemContext?.sources ?? []).map((source) => ({ source, text: [source.label, source.kind, sectionText(source.sections)].join(' ').toLocaleLowerCase() }));
  $: sourceNeedle = itemSourceQuery.trim().toLocaleLowerCase();
  $: filteredItemSources = sourceSearchEntries.filter((entry) => !sourceNeedle || entry.text.includes(sourceNeedle)).map((entry) => entry.source);
  $: itemPlacementIds = new Set(itemContext?.sources.flatMap((source) => source.placementIds) ?? []);
  $: entityByKey = entityDetails;
  $: selectedEntitySummary = selectedEntityKey ? entityIndexByKey.get(selectedEntityKey) ?? null : null;
  $: selectedEntity = selectedEntityKey ? entityByKey.get(selectedEntityKey) ?? null : null;
  $: selectedItemEntity = itemKey ? entityByKey.get(itemKey) ?? null : null;
  $: entitySearchEntries = (publication?.entityIndex ?? []).filter((entity) => entity.kind !== 'items').map((entity) => ({ entity, text: [entity.name, entity.description ?? ''].join(' ').toLocaleLowerCase() }));
  $: itemSearchEntries = (publication?.itemIndex ?? []).map((item) => ({ item, text: [item.name, ...item.sourceNames, ...item.sourceKinds].join(' ').toLocaleLowerCase() }));
  $: placementSearchText = new Map((publication?.placements ?? []).map((placement) => [placement.placementId, placement.searchText.toLocaleLowerCase()]));
  $: searchNeedle = query.trim().toLocaleLowerCase();
  $: matchingEntities = searchNeedle ? entitySearchEntries.filter((entry) => entry.text.includes(searchNeedle)).map((entry) => entry.entity) : [];
  $: matchingItems = searchNeedle ? itemSearchEntries.filter((entry) => entry.text.includes(searchNeedle)).map((entry) => entry.item) : [];
  $: querySourcePlacementIds = new Set(matchingItems.flatMap((item) => searchIndexes.placementsByItemKey.get(item.itemKey)?.map((placement) => placement.placementId) ?? []));
  $: queryEntityPlacementIds = new Set(matchingEntities.flatMap((entity) => searchIndexes.placementsByEntityKey.get(entity.entityKey)?.map((placement) => placement.placementId) ?? []));
  $: matchingPlacements = allMapPlacements.filter((placement) => (!itemKey || itemPlacementIds.has(placement.placementId)) && (categories.length === 0 || categories.some((category) => placement.categories.includes(category))) && levelMatches(placement) && (!searchNeedle || placementSearchText.get(placement.placementId)?.includes(searchNeedle) || querySourcePlacementIds.has(placement.placementId) || queryEntityPlacementIds.has(placement.placementId)));
  $: categoryCounts = getCategoryCounts(matchingPlacements);
  $: categoryFilters = MARKER_IDS.filter((category) => categoryCounts[category] > 0 || markerFor(category).defaultVisible);
  $: markerSections = MARKER_SECTION_ORDER.map((section) => ({
    id: section,
    label: MARKER_SECTION_LABELS[section],
    markers: MARKER_IDS.filter((category) => categoryFilters.includes(category) || categories.includes(category)).map((category) => markerFor(category)).filter((marker) => marker.section === section),
  })).filter((section) => section.markers.length > 0);
  $: viewportPlacements = matchingPlacements.filter((placement) => inViewport(placement, viewportBounds));
  $: selectedPlacement = publication?.placements.find((placement) => placement.placementId === selectedId) ?? null;
  $: hoveredPlacement = publication?.placements.find((placement) => placement.placementId === hoveredId) ?? null;
  $: selectedEntities = selectedPlacement ? selectedPlacement.entityKeys.map((key) => entityByKey.get(key)).filter((entity): entity is PublicEntity => Boolean(entity)) : [];
  $: selectedPlacementDetails = selectedPlacement ? [
    ...selectedEntities.flatMap((entity) => entity.sections),
    ...selectedPlacement.itemKeys.flatMap((key) => (itemDetails.get(key)?.sources ?? []).flatMap((source) => source.sections)),
  ] : [];
  $: resultPlacements = viewportBounds ? viewportPlacements : matchingPlacements;
  $: rankedResults = rankResults(searchNeedle, matchingItems, matchingEntities, resultPlacements, entityIndexByKey);
  $: displayedResults = rankedResults.slice(0, RESULT_LIMIT);
  $: filteredDetail = selectedPlacement ? filteredSections(selectedPlacementDetails, detailQuery) : [];
  $: extraSelection = selectedPlacement && !staleSelection && !orientationOnly && !matchingPlacements.some((placement) => placement.placementId === selectedId) ? selectedPlacement : null;
  $: adapterPlacements = extraSelection ? [...matchingPlacements, extraSelection] : matchingPlacements;
  $: highlightedPlacementIds = selectionHighlightIds(selectedPlacement, selectedEntityKey, itemKey, searchIndexes);
  $: hoveredPlacementIds = resultHighlightIds(hoveredResult, searchIndexes);

  onMount(() => {
    let disposed = false;
    worldOffsetOverrides = loadWorldOffsetOverrides();
    try {
      panelCollapsed = localStorage.getItem('afallon-atlas-sidebar') === 'collapsed';
    } catch {
      // The expanded sidebar is a safe default when browser storage is unavailable.
    }
    const metadataRequest = new AbortController();
    const onPopState = () => applyUrlState(readMapUrl(window.location.search));
    const onKeydown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === 'b') {
        event.preventDefault();
        togglePanel();
        return;
      }
      if (event.key === 'Escape' && !event.defaultPrevented && detailsPanel?.isConnected) {
        event.preventDefault();
        void closeDetails();
      }
    };
    window.addEventListener('popstate', onPopState);
    window.addEventListener('keydown', onKeydown);
    applyUrlState(readMapUrl(window.location.search));
    const mapDocumentUrl = new URL(`${base}/data/publication.json`, window.location.href).toString();
    publicationUrl = mapDocumentUrl;
    fetch(mapDocumentUrl, { signal: metadataRequest.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Publication request failed (${response.status})`);
        const json = (await response.json()) as PublicationData;
        if (json.schemaVersion !== PUBLICATION_SCHEMA_VERSION) throw new Error('Unsupported publication schema.');
        return resolvePublicationAssets(json, mapDocumentUrl);
      })
      .then(async (data) => {
        if (disposed) return;
        publication = data;
        searchIndexes = buildSearchIndexes(data);
        applyUrlState(readMapUrl(window.location.search));
        loading = false;
        void tick().then(() => ensureCurrentSelection());
        await tick();
        if (disposed) return;
        view = readMapUrl(window.location.search).view ?? centerView(publication.world);
        const module = await import('./map-adapter');
        if (disposed) return;
        adapter = await module.createMapAdapter(canvas, view, {
          onViewChange(nextView, bounds) {
            view = nextView;
            viewportBounds = bounds;
            scheduleViewUrl();
          },
          onSelect(placementId) {
            selectPlacement(placementId, canvas);
          },
          onHover(placementId) {
            hoveredResult = null;
            hoveredId = placementId;
          },
          onWorldOffsetChange(mapSpaceId, offset) {
            worldOffsetOverrides = { ...worldOffsetOverrides, [mapSpaceId]: offset };
            saveWorldOffsetOverrides(worldOffsetOverrides);
          },
          onError(message) {
            loadError = message;
          }
        });
        adapterReady = true;
      })
      .catch((error: unknown) => {
        if (!disposed) {
          loading = false;
          loadError = error instanceof Error ? error.message : 'The publication could not be loaded.';
        }
      });
    return () => {
      disposed = true;
      metadataRequest.abort();
      window.removeEventListener('popstate', onPopState);
      window.removeEventListener('keydown', onKeydown);
      if (viewTimer) clearTimeout(viewTimer);
      if (queryTimer) clearTimeout(queryTimer);
      adapter?.destroy();
    };
  });

  $: if (adapterReady && adapter && publication) {
    adapter.update({ data: publication, mapSpaceId: publication.world.mapSpaceId, layerId, placements: adapterPlacements, selectedId, highlightedPlacementIds, hoveredPlacementIds, worldOffsets: worldOffsetOverrides, authoring, showConnections });
  }

  async function loadEntityDetailPath(path: string): Promise<void> {
    const cacheKey = `entity:${path}`;
    const cached = detailRequests.get(cacheKey);
    if (cached) return cached;
    const request = fetch(new URL(path, publicationUrl).toString()).then(async (response) => {
      if (!response.ok) throw new Error(`Entity detail request failed (${response.status})`);
      const value = (await response.json()) as EntityDetailsDocument;
      if (value.schemaVersion !== 'compendium.publication-entity-details.v1' || value.buildId !== publication?.buildId || !Array.isArray(value.entities)) throw new Error('Unsupported entity detail document.');
      const next = new Map(entityDetails);
      for (const entity of value.entities) next.set(entity.entityKey, entity);
      entityDetails = next;
    });
    detailRequests.set(cacheKey, request);
    return request;
  }

  async function loadItemDetailPath(path: string): Promise<void> {
    const cacheKey = `item:${path}`;
    const cached = detailRequests.get(cacheKey);
    if (cached) return cached;
    const request = fetch(new URL(path, publicationUrl).toString()).then(async (response) => {
      if (!response.ok) throw new Error(`Item-source detail request failed (${response.status})`);
      const value = (await response.json()) as ItemSourcesDocument;
      if (value.schemaVersion !== 'compendium.publication-item-sources.v1' || value.buildId !== publication?.buildId || !Array.isArray(value.itemSources)) throw new Error('Unsupported item-source detail document.');
      const next = new Map(itemDetails);
      for (const item of value.itemSources) next.set(item.itemKey, item);
      itemDetails = next;
    });
    detailRequests.set(cacheKey, request);
    return request;
  }

  async function ensureCurrentSelection(): Promise<void> {
    if (!publication) return;
    const entityPaths = new Set<string>();
    const itemPaths = new Set<string>();
    if (selectedPlacement) {
      for (const key of selectedPlacement.entityKeys) {
        const summary = entityIndexByKey.get(key);
        if (summary) entityPaths.add(summary.detailPath);
      }
      for (const key of selectedPlacement.itemKeys) {
        const summary = itemIndexByKey.get(key);
        if (summary) itemPaths.add(summary.detailPath);
      }
    }
    if (selectedEntityKey) {
      const summary = entityIndexByKey.get(selectedEntityKey);
      if (summary) entityPaths.add(summary.detailPath);
    }
    if (itemKey) {
      const item = itemIndexByKey.get(itemKey);
      if (item) itemPaths.add(item.detailPath);
      const entity = entityIndexByKey.get(itemKey);
      if (entity) entityPaths.add(entity.detailPath);
    }
    if (entityPaths.size === 0 && itemPaths.size === 0) return;
    detailLoading = true;
    detailError = '';
    try {
      await Promise.all([...entityPaths].map((path) => loadEntityDetailPath(path)));
      await Promise.all([...itemPaths].map((path) => loadItemDetailPath(path)));
    } catch (error: unknown) {
      detailError = error instanceof Error ? error.message : 'The selected detail could not be loaded.';
    } finally {
      detailLoading = false;
    }
  }

  function centerView(map: PublicationData['world']): MapViewState {
    const x = (map.bounds.min.x + map.bounds.max.x) / 2;
    const y = (map.bounds.min.y + map.bounds.max.y) / 2;
    const scale = Math.min((canvas?.clientWidth || 640) / (map.bounds.max.x - map.bounds.min.x), (canvas?.clientHeight || 480) / (map.bounds.max.y - map.bounds.min.y));
    return { target: [x, y, 0], zoom: Math.log2(scale * 0.9) };
  }

  function getLayerOptions(data: PublicationData | null): LayerOption[] {
    if (!data) return [];
    const options: LayerOption[] = data.tileLayers.length > 0 ? [{ id: 'captured', label: 'Captured screenshots', kind: 'screenshot', orientationOnly: false }] : [];
    options.push(...data.illustrations.map((illustration): LayerOption => ({ id: illustration.id, label: `${illustration.label}${illustration.registration === 'orientation-only' ? ' (orientation only)' : ''}`, kind: 'illustration', orientationOnly: illustration.registration === 'orientation-only' })));
    return options;
  }

  function uniquePlacements(placements: PublicPlacement[]): PublicPlacement[] {
    const seen = new Set<string>();
    return placements.filter((placement) => {
      if (seen.has(placement.placementId)) return false;
      seen.add(placement.placementId);
      return true;
    });
  }

  function getCategoryCounts(placements: PublicPlacement[]): Record<MarkerId, number> {
    const counts = Object.fromEntries(MARKER_IDS.map((id) => [id, 0])) as Record<MarkerId, number>;
    for (const placement of placements) for (const category of placement.categories) counts[category] += 1;
    return counts;
  }

  function levelMatches(placement: PublicPlacement): boolean {
    if (levelMinimum === null && levelMaximum === null) return true;
    if (!placement.levelRange) return true;
    return (levelMinimum === null || placement.levelRange.max >= levelMinimum) && (levelMaximum === null || placement.levelRange.min <= levelMaximum);
  }

  function levelRangeLabel(range: { min: number; max: number } | undefined): string {
    return range ? `(lvl.${range.min}-${range.max})` : '';
  }

  function rankResults(needle: string, items: PublicItemSummary[], entities: PublicEntitySummary[], placements: PublicPlacement[], names: ReadonlyMap<string, PublicEntitySummary>): SearchResult[] {
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

  function emptySearchIndexes(): SearchIndexes {
    return {
      placementsById: new Map(),
      placementsByEntityKey: new Map(),
      placementsByItemKey: new Map(),
      placementSummaries: new Map(),
      entitySummaries: new Map(),
      itemSummaries: new Map(),
    };
  }

  function summarizePlacements(placements: readonly PublicPlacement[], fallbackId: MarkerId): ResultSummary {
    const categoryIds = [...new Set(placements.flatMap((placement) => placement.categories))] as MarkerId[];
    const marker = markerFor(placements[0] ? (resolveMarker(placements[0]) ?? categoryIds[0] ?? fallbackId) : fallbackId);
    const ranges = placements.flatMap((placement) => placement.levelRange ? [placement.levelRange] : []);
    const range = ranges.length > 0
      ? { min: Math.min(...ranges.map((value) => value.min)), max: Math.max(...ranges.map((value) => value.max)) }
      : null;
    return {
      marker,
      categories: categoryIds.length > 0 ? categoryIds.map((category) => markerFor(category).label).join(' · ') : 'No map category',
      levels: range ? levelRangeLabel(range) : 'Level not specified',
    };
  }

  function buildSearchIndexes(data: PublicationData): SearchIndexes {
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
      placementsById,
      placementsByEntityKey,
      placementsByItemKey,
      placementSummaries: new Map(data.placements.map((placement) => [placement.placementId, summarizePlacements([placement], 'interactiveObject')])),
      entitySummaries: new Map(data.entityIndex.map((entity) => [entity.entityKey, summarizePlacements(placementsByEntityKey.get(entity.entityKey) ?? [], 'npc')])),
      itemSummaries: new Map(data.itemIndex.map((item) => [item.itemKey, summarizePlacements(placementsByItemKey.get(item.itemKey) ?? [], 'container')])),
    };
  }

  function placementIds(placements: readonly PublicPlacement[]): string[] {
    return [...new Set(placements.map((placement) => placement.placementId))];
  }

  function selectionHighlightIds(
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

  function resultHighlightIds(result: SearchResult | null, indexes: SearchIndexes): string[] {
    if (!result) return [];
    if (result.kind === 'placement') return [result.placement.placementId];
    if (result.kind === 'entity') return placementIds(indexes.placementsByEntityKey.get(result.entity.entityKey) ?? []);
    return placementIds(indexes.placementsByItemKey.get(result.item.itemKey) ?? []);
  }

  function setResultHover(result: SearchResult): void {
    hoveredResult = result;
    hoveredId = result.kind === 'placement' ? result.placement.placementId : null;
  }

  function clearResultHover(): void {
    hoveredResult = null;
    hoveredId = null;
  }

  function resultSummary(result: SearchResult): ResultSummary {
    if (result.kind === 'placement') return searchIndexes.placementSummaries.get(result.placement.placementId) ?? summarizePlacements([result.placement], 'interactiveObject');
    if (result.kind === 'entity') return searchIndexes.entitySummaries.get(result.entity.entityKey) ?? summarizePlacements([], 'npc');
    return searchIndexes.itemSummaries.get(result.item.itemKey) ?? summarizePlacements([], 'container');
  }

  function sectionText(sections: PublicDetailSection[]): string {
    return sections.flatMap((section) => [section.title, ...section.rows.flatMap((row) => [row.label, row.value])]).join(' ');
  }

  function inViewport(placement: PublicPlacement, bounds: [number, number, number, number] | null): boolean {
    if (!bounds) return true;
    return placement.position[0] >= bounds[0] && placement.position[0] <= bounds[2] && placement.position[1] >= bounds[1] && placement.position[1] <= bounds[3];
  }

  function applyUrlState(next: MapUrlState): void {
    itemSourceQuery = next.itemSourceQuery;
    detailQuery = next.detailQuery;
    const options = getLayerOptions(publication);
    layerId = options.some((layer) => layer.id === next.layerId) ? next.layerId ?? options[0]?.id ?? 'captured' : options[0]?.id ?? 'captured';
    query = next.query;
    categories = next.categories.filter((category): category is MarkerId => MARKER_IDS.includes(category as MarkerId));
    levelMinimum = next.levelMinimum;
    levelMaximum = next.levelMaximum;
    itemKey = next.itemKey && (!publication || publication.itemIndex.some((item) => item.itemKey === next.itemKey)) ? next.itemKey : null;
    const selected = next.selectedId && publication ? publication.placements.find((placement) => placement.placementId === next.selectedId) : null;
    if (next.selectedId && publication && !selected) staleSelection = 'This link refers to a location that is not in the loaded publication.';
    else staleSelection = '';
    selectedId = selected?.placementId ?? (publication ? null : next.selectedId);
    selectedEntityKey = next.entityKey && (!publication || publication.entityIndex.some((entity) => entity.entityKey === next.entityKey)) ? next.entityKey : null;
    if (selectedEntityKey) itemKey = null;
    else if (next.entityKey && publication) staleSelection = `This link refers to an entity that is not in the loaded publication: ${next.entityKey}.`;
    if (next.itemKey && !itemKey && !selectedEntityKey && publication) staleSelection = `This link refers to an item that is not in the loaded publication: ${next.itemKey}.`;
    const restoredView = next.view ?? (publication ? centerView(publication.world) : null);
    if (restoredView) {
      view = restoredView;
      adapter?.setView(restoredView);
    }
  }

  function currentUrl(overrides: Partial<Pick<MapUrlState, 'categories' | 'levelMinimum' | 'levelMaximum'>> = {}): URL {
    return writeMapUrl(new URL(window.location.href), { layerId, selectedId, query, itemSourceQuery: itemKey ? itemSourceQuery : '', detailQuery: !itemKey && (selectedId || selectedEntityKey) ? detailQuery : '', categories: overrides.categories !== undefined ? overrides.categories : categories, levelMinimum: overrides.levelMinimum !== undefined ? overrides.levelMinimum : levelMinimum, levelMaximum: overrides.levelMaximum !== undefined ? overrides.levelMaximum : levelMaximum, itemKey, entityKey: selectedEntityKey, view });
  }

  function syncUrl(mode: 'push' | 'replace', overrides: Partial<Pick<MapUrlState, 'categories' | 'levelMinimum' | 'levelMaximum'>> = {}): void {
    // The framework router owns history, so its own helpers must be used; calling
    // window.history directly desynchronises the page store from the address bar.
    const next = currentUrl(overrides);
    if (mode === 'push') pushState(next, {});
    else replaceState(next, {});
  }

  function scheduleViewUrl(): void {
    if (viewTimer) clearTimeout(viewTimer);
    viewTimer = setTimeout(() => syncUrl('replace'), 220);
  }

  function scheduleQueryUrl(): void {
    if (queryTimer) clearTimeout(queryTimer);
    queryTimer = setTimeout(() => syncUrl('replace'), 280);
  }

  function setMapView(next: MapViewState): void {
    view = next;
    adapter?.setView(next);
    syncUrl('replace');
  }

  function selectPlacement(placementId: string, origin: HTMLElement | HTMLCanvasElement | null = null): void {
    const placement = publication?.placements.find((candidate) => candidate.placementId === placementId);
    if (!placement) return;
    selectedId = placementId;
    selectedEntityKey = null;
    staleSelection = '';
    detailOrigin = origin;
    if (!layerOptions.some((option) => option.id === layerId) || orientationOnly) layerId = layerOptions.find((option) => option.kind === 'screenshot')?.id ?? layerOptions[0]?.id ?? '';
    syncUrl('push');
    void tick().then(() => ensureCurrentSelection());
    void focusDetails();
  }

  async function focusDetails(): Promise<void> {
    await tick();
    detailsPanel?.querySelector<HTMLElement>('h2')?.focus();
  }

  function selectEntity(entity: PublicEntity | PublicEntitySummary, origin: HTMLElement | null = null): void {
    const item = findItem(publication, entity.entityKey);
    if (item) { selectItem(item, origin); return; }
    selectedEntityKey = entity.entityKey;
    selectedId = null;
    itemKey = null;
    staleSelection = '';
    detailQuery = '';
    detailOrigin = origin;
    syncUrl('push');
    void tick().then(() => ensureCurrentSelection());
    void focusDetails();
  }

  function openEntity(key: string, origin: HTMLElement): void {
    const entity = entityIndexByKey.get(key);
    if (entity) selectEntity(entity, origin);
  }

  function selectItem(item: PublicItemSummary | PublicItemSource, origin: HTMLElement | null = null): void {
    const summary = itemIndexByKey.get(item.itemKey);
    if (!summary) return;
    itemKey = summary.itemKey;
    selectedEntityKey = null;
    staleSelection = '';
    itemSourceQuery = '';
    query = '';
    selectedId = null;
    detailOrigin = origin;
    syncUrl('push');
    void tick().then(() => ensureCurrentSelection());
    void focusDetails();
  }

  function chooseLayer(nextLayerId: string): void {
    layerId = nextLayerId;
    syncUrl('push');
  }

  function toggleAuthoring(): void {
    authoring = !authoring;
  }

  function toggleConnections(): void {
    showConnections = !showConnections;
  }

  function togglePanel(): void {
    panelCollapsed = !panelCollapsed;
    try {
      localStorage.setItem('afallon-atlas-sidebar', panelCollapsed ? 'collapsed' : 'expanded');
    } catch {
      // The panel remains usable when browser storage is unavailable.
    }
  }

  function toggleAllCategories(ids: readonly MarkerId[]): void {
    const allSelected = ids.length > 0 && ids.every((id) => categories.includes(id));
    const next = allSelected
      ? categories.filter((category) => !ids.includes(category))
      : [...new Set([...categories, ...ids])];
    categories = next;
    syncUrl('push', { categories: next });
  }

  function exportWorldOffsets(): void {
    if (publication) downloadWorldOffsets(worldOffsetOverrides, publication);
  }

  function toggleCategory(category: MarkerId): void {
    const next = categories.includes(category) ? categories.filter((value) => value !== category) : [...categories, category];
    categories = next;
    syncUrl('push', { categories: next });
  }

  function updateLevelMinimum(value: string): void {
    const parsed = Number(value);
    const next = value.trim() && Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
    levelMinimum = next;
    syncUrl('replace', { levelMinimum: next });
  }

  function updateLevelMaximum(value: string): void {
    const parsed = Number(value);
    const next = value.trim() && Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
    levelMaximum = next;
    syncUrl('replace', { levelMaximum: next });
  }

  function submitSearch(): void {
    syncUrl('push');
    const first = resultList?.querySelector<HTMLButtonElement>('button[data-result]');
    first?.focus();
  }

  async function closeDetails(): Promise<void> {
    const origin = detailOrigin;
    selectedId = null;
    itemKey = null;
    selectedEntityKey = null;
    staleSelection = '';
    detailOrigin = null;
    syncUrl('push');
    await tick();
    (origin?.isConnected ? origin : searchInput)?.focus();
  }

  function sourceRows(source: PublicItemSource['sources'][number], query: string): PublicDetailSection[] {
    const needle = query.trim().toLocaleLowerCase();
    return !needle || `${source.label} ${source.kind}`.toLocaleLowerCase().includes(needle) ? source.sections : filteredSections(source.sections, needle);
  }

  function entityLinks(sections: PublicDetailSection[]) {
    return linksFromSections(sections).filter((link, index, links) => links.findIndex((candidate) => candidate.placementId === link.placementId) === index);
  }
</script>

<svelte:head>
  <title>Afallon Compendium Atlas</title>
  <meta name="description" content="A static Afallon world atlas with verified placement and item source details." />
</svelte:head>

<div class="atlas-shell">
  <header class="topbar">
    <div class="brand"><span class="brand-mark" aria-hidden="true">A</span><div><strong>Afallon Compendium</strong><small>Static world atlas</small></div></div>
    <div class="build-meta" aria-label="Publication status">
      <a href={`${base}/guide/`}>Adventure Guide</a>
      {#if publication}<span>Supported build <strong>{publication.buildId}</strong></span><span class:complete={publication.coverage.complete} class="coverage">{publication.coverage.complete ? 'Complete coverage' : 'Preview · incomplete coverage'}</span>{/if}
    </div>
  </header>

  {#if loading}
    <main class="state-card" aria-live="polite"><div class="spinner" aria-hidden="true"></div><h1>Loading the published atlas</h1><p>Only the generated static publication is used.</p></main>
  {:else if loadError && !publication}
    <main class="state-card error" role="alert"><h1>Atlas unavailable</h1><p>{loadError}</p><p class="muted">The publication request failed. There is no fallback dataset.</p></main>
  {:else if publication}
    <main class="workspace" class:has-details={Boolean(selectedPlacement || selectedEntityKey || itemKey || staleSelection)} class:sidebar-collapsed={panelCollapsed}>
      <aside class:collapsed={panelCollapsed} class="control-panel" aria-label="Atlas controls">
        <div class="panel-header">
          {#if !panelCollapsed}<div><strong>Atlas controls</strong><small>⌘/Ctrl+B to toggle</small></div>{/if}
          <button class="panel-toggle" type="button" on:click={togglePanel} aria-label={panelCollapsed ? 'Expand atlas controls' : 'Collapse atlas controls'} aria-expanded={!panelCollapsed}>{panelCollapsed ? '»' : '«'}</button>
        </div>
        {#if panelCollapsed}
          <nav class="panel-rail" aria-label="Quick category toggles">
            {#each markerSections as section}
              <div class="rail-group" aria-label={section.label}>
                {#each section.markers as marker (marker.id)}
                  <CategoryRow marker={marker} checked={categories.includes(marker.id)} count={categoryCounts[marker.id] ?? 0} compact onToggle={() => toggleCategory(marker.id)} />
                {/each}
              </div>
            {/each}
          </nav>
        {:else}
          <div class="panel-body">
            <div class="control-section search-section"><label for="atlas-search">Search places, entities, and items</label><div class="search-row"><input id="atlas-search" bind:this={searchInput} value={query} on:input={(event) => { query = (event.currentTarget as HTMLInputElement).value; scheduleQueryUrl(); }} on:keydown={(event) => { if (event.key === 'Enter') { event.preventDefault(); submitSearch(); } }} placeholder="Try a name or item" autocomplete="off" /><button class="quiet-button" type="button" on:click={() => { query = ''; scheduleQueryUrl(); searchInput?.focus(); }} aria-label="Clear search">Clear</button></div><p class="hint">Press Enter to move from search to results.</p></div>
            {#if layerOptions.length > 1}<div class="control-section"><label for="layer-select">Map layer</label><select id="layer-select" value={layerId} on:change={(event) => chooseLayer((event.currentTarget as HTMLSelectElement).value)}>{#each layerOptions as layer}<option value={layer.id}>{layer.label}</option>{/each}</select>{#if orientationOnly}<p class="notice">Orientation only. Marker navigation is disabled until a screenshot layer is selected.</p>{/if}</div>{/if}
            <div class="control-section world-tools"><h2>Map options</h2><label class="tool-option"><input type="checkbox" checked={showConnections} on:change={toggleConnections} /><span>Travel connections</span></label><label class="tool-option"><input type="checkbox" checked={authoring} on:change={toggleAuthoring} /><span>Authoring mode</span></label>{#if authoring}<button type="button" class="quiet-button" on:click={exportWorldOffsets}>Export world offsets</button><p class="hint">Drag a map boundary to review its placement. Travel lines stay visible while authoring.</p>{/if}</div>
            <div class="categories-block">
              <div class="section-heading"><h2>Map categories</h2><span class="count">{allMapPlacements.length}</span></div>
              {#each markerSections as section (section.id)}
                <MapSidebarSection title={section.label} categories={section.markers} activeCategories={categories} counts={categoryCounts} storageKey={`afallon-atlas-section-${section.id}`} onToggleCategory={toggleCategory} onToggleAll={toggleAllCategories} />
              {/each}
              {#if categories.length > 0}<button type="button" class="text-button" on:click={() => { categories = []; syncUrl('push'); }}>Clear category filters</button>{/if}
            </div>
            <div class="control-section level-filter"><div class="section-heading"><h2>Creature levels</h2>{#if levelMinimum !== null || levelMaximum !== null}<span class="active-filter">{levelMinimum ?? 0}–{levelMaximum ?? '∞'}</span>{/if}</div><div class="level-fields"><label for="level-min">From<input id="level-min" type="number" min="0" step="1" value={levelMinimum ?? ''} on:input={(event) => updateLevelMinimum((event.currentTarget as HTMLInputElement).value)} /></label><label for="level-max">To<input id="level-max" type="number" min="0" step="1" value={levelMaximum ?? ''} on:input={(event) => updateLevelMaximum((event.currentTarget as HTMLInputElement).value)} /></label></div><p class="hint">Locations without a known level stay visible.</p></div>
            <div class="coverage-card"><strong>Supported game build {publication.buildId}</strong>{#if !publication.coverage.complete}<p>Incomplete research preview. It does not represent full-world research or imagery coverage.</p>{/if}</div>
          </div>
        {/if}
      </aside>

      <section class="map-column" aria-label="Interactive map">
        <div class="map-frame"><canvas bind:this={canvas} aria-label="Afallon map. Use the result list for keyboard navigation."></canvas><div class="map-controls"><button type="button" aria-label="Zoom in" on:click={() => setMapView({ ...view, zoom: Math.min(12, view.zoom + 0.5) })}>+</button><button type="button" aria-label="Zoom out" on:click={() => setMapView({ ...view, zoom: Math.max(-12, view.zoom - 0.5) })}>−</button><button type="button" disabled={orientationOnly} on:click={() => { if (publication) setMapView(centerView(publication.world)); }}>Fit map</button></div>{#if hoveredPlacement && hoveredId !== selectedId}<div class="hover-preview"><strong>{hoveredPlacement.label}</strong><span>{hoveredPlacement.categories.map((category) => markerFor(category).label).join(' · ')} {levelRangeLabel(hoveredPlacement.levelRange)}</span></div>{/if}<div class="map-status" aria-live="polite">{matchingPlacements.length} matching placements · {resultPlacements.length} in viewport{#if extraSelection}{' · selected location also shown'}{/if}{#if orientationOnly}{' · orientation layer'}{/if}</div></div>
        {#if loadError && publication}<div class="inline-error" role="alert">{loadError}</div>{/if}
        <section class="results" aria-labelledby="results-heading" bind:this={resultList}>
          <div class="results-header">
            <div><h2 id="results-heading">Results</h2><p>{resultPlacements.length} distinct placements{#if viewportBounds}{' in the current viewport'}{/if}{#if matchingItems.length > 0}{' · '}{matchingItems.length} items{/if}{#if matchingEntities.length > 0}{' · '}{matchingEntities.length} entity definitions{/if}</p>{#if rankedResults.length > RESULT_LIMIT}<p class="result-limit">Showing the first {displayedResults.length} of {rankedResults.length} results.</p>{/if}</div>
            {#if itemContext}<button class="quiet-button" type="button" on:click={() => { itemKey = null; syncUrl('push'); }}>Exit item context</button>{/if}
          </div>
          {#if resultPlacements.length === 0 && matchingItems.length === 0 && matchingEntities.length === 0}
            <p class="empty">No published places, entities, or items match this search.</p>
          {:else}
            <ol class="result-list">
              {#each displayedResults as result (result.key)}
              {#if result.kind === 'item'}
                {@const item = result.item}
                {@const summary = resultSummary(result)}
                <li><button data-result type="button" class:selected-result={item.itemKey === itemKey} on:click={(event) => selectItem(item, event.currentTarget)} on:mouseenter={() => setResultHover(result)} on:mouseleave={clearResultHover} on:focus={() => setResultHover(result)} on:blur={clearResultHover}><span class="result-marker" style:background={markerColorCss(summary.marker)} aria-hidden="true">{@html markerGlyphSvg(summary.marker)}</span><span class="result-copy"><strong>{item.name || 'Unnamed item'}</strong><small>{summary.categories} · {summary.levels}</small></span></button></li>
              {:else if result.kind === 'entity'}
                {@const entity = result.entity}
                {@const summary = resultSummary(result)}
                <li><button data-result type="button" class:selected-result={entity.entityKey === selectedEntityKey} on:click={(event) => selectEntity(entity, event.currentTarget)} on:mouseenter={() => setResultHover(result)} on:mouseleave={clearResultHover} on:focus={() => setResultHover(result)} on:blur={clearResultHover}><span class="result-marker" style:background={markerColorCss(summary.marker)} aria-hidden="true">{@html markerGlyphSvg(summary.marker)}</span><span class="result-copy"><strong>{entity.name}</strong><small>{summary.categories} · {summary.levels}</small></span></button></li>
              {:else}
                {@const placement = result.placement}
                {@const summary = resultSummary(result)}
                <li><button data-result type="button" class:selected-result={placement.placementId === selectedId} on:click={(event) => selectPlacement(placement.placementId, event.currentTarget)} on:mouseenter={() => setResultHover(result)} on:mouseleave={clearResultHover} on:focus={() => setResultHover(result)} on:blur={clearResultHover}><span class="result-marker" style:background={markerColorCss(summary.marker)} aria-hidden="true">{@html markerGlyphSvg(summary.marker)}</span><span class="result-copy"><strong>{placement.label}</strong><small>{summary.categories} · {summary.levels}</small></span></button></li>
              {/if}
              {/each}
            </ol>
          {/if}
        </section>
      </section>

      <aside class="details-panel" bind:this={detailsPanel} aria-label="Selected details">
        {#if selectedPlacement || selectedEntityKey || itemKey || staleSelection}
          <div class="details-header">
            <div>
              <span class="eyebrow">{itemKey ? 'Item sources' : selectedEntityKey ? 'Entity details' : 'Selected location'}</span>
              <h2 tabindex="-1">{itemKey ? selectedItemEntity?.name ?? itemIndexByKey.get(itemKey)?.name ?? 'Unnamed item' : selectedEntity?.name ?? selectedEntitySummary?.name ?? selectedPlacement?.label ?? 'Unavailable selection'}</h2>
            </div>
            <button class="close-button" type="button" on:click={closeDetails} aria-label="Close details">Close</button>
          </div>
          {#if staleSelection}
            <div class="stale-warning" role="alert"><strong>Stale selection</strong><p>{staleSelection}</p><button type="button" class="text-button" on:click={closeDetails}>Show available content</button></div>
          {/if}
          {#if detailLoading}<p class="notice">Loading selected details…</p>{/if}
          {#if detailError}<p class="inline-error" role="alert">{detailError}</p>{/if}
          {#if itemKey}
            {#if selectedItemEntity}
              {#if selectedItemEntity.description}<p>{selectedItemEntity.description}</p>{/if}
              <details class="entity-block">
                <summary>Item properties and relationships</summary>
                <DetailSections sections={selectedItemEntity.sections} entities={entityByKey} onEntity={openEntity} onPlacement={selectPlacement} />
              </details>
            {/if}
            {#if itemContext && itemContext.sections.length > 0}<DetailSections sections={filteredSections(itemContext.sections, itemSourceQuery)} entities={entityByKey} onEntity={openEntity} onPlacement={selectPlacement} />{/if}
            <label class="detail-search" for="source-search">Search item sources and conditions<input id="source-search" bind:value={itemSourceQuery} on:input={scheduleQueryUrl} placeholder="Merchant, loot, requirement" /></label>
            {#if selectedPlacement}<p class="notice">Selected source: {selectedPlacement.label}. The selected item remains active.</p>{/if}
            <div class="item-sources">
              {#if filteredItemSources.length === 0}<p class="empty">No item sources match this search.</p>{/if}
              {#each filteredItemSources as source}
                <article class="source-card">
                  <div class="source-title"><strong>{source.label}</strong><span>{source.kind}</span></div>
                  <DetailSections sections={sourceRows(source, itemSourceQuery)} entities={entityByKey} onEntity={openEntity} onPlacement={selectPlacement} />
                  {#each source.placementIds as placementId}
                    <button type="button" class="source-location" on:click={(event) => selectPlacement(placementId, event.currentTarget)}>Open source location</button>
                  {/each}
                </article>
              {/each}
            </div>
          {:else if selectedEntityKey}
            {#if selectedEntity?.description ?? selectedEntitySummary?.description}<p>{selectedEntity?.description ?? selectedEntitySummary?.description}</p>{/if}
            <label class="detail-search" for="detail-search">Search this entity's details<input id="detail-search" bind:value={detailQuery} on:input={scheduleQueryUrl} placeholder="Condition, reward, requirement" /></label>
            {#each selectedEntity?.placementIds ?? [] as placementId}
              <button type="button" class="source-location" on:click={(event) => selectPlacement(placementId, event.currentTarget)}>Open location details</button>
            {/each}
            {#if selectedEntity}<DetailSections sections={filteredSections(selectedEntity.sections, detailQuery)} entities={entityByKey} onEntity={openEntity} onPlacement={selectPlacement} />{/if}
          {:else if selectedPlacement}
            <label class="detail-search" for="detail-search">Search this location's details<input id="detail-search" bind:value={detailQuery} on:input={scheduleQueryUrl} placeholder="Condition, reward, requirement" /></label>
            <div class="location-summary">
              <p class="category-line">{selectedPlacement.categories.map((category) => markerFor(category).label).join(' · ')}</p>
              {#if selectedPlacement.levelRange}<p class="level-line">{levelRangeLabel(selectedPlacement.levelRange)}</p>{/if}
            </div>
            {#each selectedEntities as entity}
              <article class="entity-block"><div class="entity-heading"><h3>{entity.name}</h3></div>{#if entity.description}<p>{entity.description}</p>{/if}<button type="button" class="inline-link" on:click={(event) => selectEntity(entity, event.currentTarget)}>Open entity details</button></article>
            {/each}
            <DetailSections sections={filteredDetail} entities={entityByKey} onEntity={openEntity} onPlacement={selectPlacement} />
            {#if entityLinks(selectedPlacementDetails).length > 0}
              <div class="linked-locations"><h3>Linked locations</h3>{#each entityLinks(selectedPlacementDetails) as link}<button class="inline-link" type="button" on:click={(event) => selectPlacement(link.placementId, event.currentTarget)}>{link.label}</button>{/each}</div>
            {/if}
          {/if}
        {:else}
          <div class="details-empty"><span class="eyebrow">Location details</span><p>Select a marker or a result to inspect it.</p></div>
        {/if}
      </aside>
    </main>
  {/if}
</div>

<style>
  :global(*) { box-sizing: border-box; }
  :global(body) { margin: 0; background: #171818; color: #e9e4d9; font-family: Inter, ui-sans-serif, system-ui, -apple-system, sans-serif; }
  :global(button), :global(input), :global(select) { font: inherit; }
  :global(button), :global(select) { cursor: pointer; }
  .atlas-shell { min-height: 100vh; background: #171818; }
  .topbar { min-height: 64px; padding: .75rem 1.15rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; border-bottom: 1px solid #393a38; background: #202120; }
  .brand { display: flex; align-items: center; gap: .7rem; letter-spacing: .01em; }
  .brand-mark { display: grid; place-items: center; width: 30px; height: 30px; border: 1px solid #bba779; color: #d7c395; font-family: Georgia, serif; font-size: 1.1rem; }
  .brand strong { display: block; font-size: .95rem; }
  .brand small { display: block; margin-top: .12rem; color: #9e9d95; font-size: .7rem; letter-spacing: .08em; text-transform: uppercase; }
  .build-meta { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: .65rem; color: #aaa9a0; font-size: .72rem; }
  .build-meta a { color: #d5b978; }
  .build-meta strong { color: #e9e4d9; font-weight: 600; }
  .coverage { padding: .25rem .45rem; border: 1px solid #896c47; color: #e4b77c; }
  .coverage.complete { border-color: #657d64; color: #a9c1a2; }
  .workspace { display: grid; grid-template-columns: 280px minmax(360px, 1fr) minmax(300px, 380px); height: calc(100dvh - 64px); min-height: 0; }
  .workspace.sidebar-collapsed { grid-template-columns: 56px minmax(360px, 1fr) minmax(300px, 380px); }
  .control-panel, .details-panel { background: #202120; overflow: auto; }
  .control-panel { display: flex; min-width: 0; flex-direction: column; overflow: hidden; border-right: 1px solid #393a38; }
  .panel-body, .panel-rail { min-height: 0; flex: 1; overflow: auto; }
  .control-panel.collapsed { overflow-x: hidden; }
  .details-panel { min-width: 0; border-left: 1px solid #393a38; padding: 1rem; }
  .details-empty { display: grid; gap: .45rem; align-content: center; min-height: 100%; color: #aaa89f; }
  .details-empty p { margin: 0; font-size: .82rem; }
  .panel-header { display: flex; align-items: center; justify-content: space-between; min-height: 52px; padding: .7rem .75rem; border-bottom: 1px solid #393a38; background: #252622; }
  .panel-header strong, .panel-header small { display: block; }
  .panel-header strong { color: #eee9dd; font-size: .78rem; }
  .panel-header small { margin-top: .2rem; color: #92928a; font-size: .66rem; }
  .panel-toggle { min-width: 28px; min-height: 28px; border: 1px solid #595846; background: transparent; color: #d5b978; font-size: 1.05rem; line-height: 1; }
  .panel-body { padding: .85rem .75rem; }
  .panel-rail { padding: .45rem 0; }
  .rail-group { padding: .25rem 0 .45rem; border-bottom: 1px solid #393a38; }
  .rail-group:last-child { border-bottom: 0; }
  .control-section { border-bottom: 1px solid #393a38; padding: 0 0 1rem; margin-bottom: 1rem; }
  label, .section-heading h2, .results-header h2, .world-tools h2 { font-size: .7rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #b8b5aa; }
  input, select { width: 100%; border: 1px solid #4a4b47; border-radius: 2px; background: #151616; color: #ece8de; padding: .55rem .6rem; }
  input:focus-visible, select:focus-visible, button:focus-visible { outline: 2px solid #d5b978; outline-offset: 2px; }
  .search-section > label, .control-section > label:not(.role-option) { display: block; margin-bottom: .45rem; }
  .search-row { display: flex; gap: .35rem; }
  .search-row input { min-width: 0; }
  .quiet-button, .close-button { border: 1px solid #55564f; background: transparent; color: #c5c1b7; padding: .45rem .55rem; border-radius: 2px; }
  .quiet-button:hover, .close-button:hover { border-color: #bba779; color: #f1eadb; }
  .hint, .muted { color: #85857e; font-size: .72rem; line-height: 1.45; }
  .section-heading { display: flex; justify-content: space-between; align-items: center; margin-bottom: .45rem; }
  .section-heading h2, .world-tools h2 { margin: 0; }
  .count { color: #d6bd84; font-size: .75rem; }
  .categories-block { margin-bottom: 1rem; }
  .categories-block > .section-heading { padding-bottom: .35rem; border-bottom: 1px solid #393a38; }
  .tool-option { display: flex; align-items: center; gap: .45rem; margin: .6rem 0; letter-spacing: normal; text-transform: none; color: #dedbd2; font-size: .78rem; cursor: pointer; }
  .tool-option input { width: 14px; height: 14px; margin: 0; accent-color: #bca36e; }
  .world-tools h2 { margin-bottom: .5rem; }
  .level-fields { display: grid; grid-template-columns: 1fr 1fr; gap: .45rem; margin-top: .45rem; }
  .level-fields label { letter-spacing: normal; text-transform: none; font-size: .68rem; }
  .level-fields input { margin-top: .3rem; }
  .active-filter { padding: .2rem .35rem; border: 1px solid #7d6843; color: #e3c681; font-size: .7rem; font-variant-numeric: tabular-nums; }
  .text-button, .inline-link { border: 0; padding: 0; background: none; color: #d5b978; text-decoration: underline; text-underline-offset: 2px; }
  .text-button { font-size: .75rem; }
  .notice, .stale-warning { padding: .55rem; border-left: 2px solid #b98751; background: #2b2721; color: #e2c399; font-size: .73rem; line-height: 1.45; }
  .coverage-card { margin-top: .9rem; padding: .7rem; border: 1px solid #66523b; background: #28241f; color: #d2bd9a; font-size: .72rem; line-height: 1.4; }
  .coverage-card strong { color: #ebd1a2; }
  .coverage-card p { margin: .35rem 0; }
  .map-column { position: relative; min-width: 0; min-height: 0; display: grid; grid-template-rows: minmax(260px, 1fr) minmax(180px, 30vh); background: #121313; }
  .map-frame { position: relative; min-height: 0; overflow: hidden; border-bottom: 1px solid #393a38; background: #151716; }
  canvas { display: block; width: 100%; height: 100%; }
  .map-controls { position: absolute; right: .75rem; top: .75rem; display: flex; gap: .3rem; }
  .map-controls button { min-width: 34px; min-height: 34px; border: 1px solid #706548; border-radius: 2px; background: #252622; color: #eee9dd; }
  .map-controls button:disabled { opacity: .45; cursor: default; }
  .map-status { position: absolute; left: .75rem; bottom: .7rem; padding: .35rem .5rem; background: rgb(18 19 19 / 88%); color: #aaa9a0; font-size: .7rem; }
  .hover-preview { position: absolute; left: 50%; top: .75rem; transform: translateX(-50%); padding: .45rem .6rem; background: #252622; border: 1px solid #706548; box-shadow: 0 3px 12px #0008; font-size: .75rem; pointer-events: none; }
  .hover-preview strong, .hover-preview span { display: block; }
  .hover-preview span { margin-top: .15rem; color: #b9b5a9; }
  .inline-error { position: absolute; z-index: 2; left: .8rem; right: .8rem; top: 3.5rem; padding: .55rem; border: 1px solid #864c45; background: #2b1f1f; color: #e5afa6; font-size: .75rem; }
  .results { padding: .8rem; overflow: auto; min-height: 0; }
  .results-header, .details-header, .source-title { display: flex; align-items: flex-start; justify-content: space-between; gap: .7rem; }
  .results-header h2, .details-header h2 { margin: 0; color: #eee9dd; font-size: .95rem; letter-spacing: .02em; text-transform: none; }
  .results-header p { margin: .25rem 0 0; color: #8e8e87; font-size: .72rem; }
  .results-header .result-limit { color: #d6bd84; }
  .result-list { list-style: none; margin: .7rem 0 0; padding: 0; display: grid; gap: .3rem; }
  .result-list button { display: grid; grid-template-columns: 22px minmax(0,1fr); align-items: center; gap: .6rem; width: 100%; padding: .6rem .55rem; border: 1px solid #383a36; background: #1c1e1d; color: #e9e4d9; text-align: left; }
  .result-list button:hover, .result-list button.selected-result { border-color: #a78b59; background: #25251f; }
  .result-marker { display: inline-grid; place-items: center; width: 22px; height: 22px; border: 1px solid rgba(0, 0, 0, .45); border-radius: 50%; color: white; }
  .result-marker :global(svg) { width: 13px; height: 13px; filter: drop-shadow(0 0 1px rgba(0, 0, 0, .8)); }
  .result-copy strong, .result-copy small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .result-copy strong { font-size: .78rem; font-weight: 600; }
  .result-copy small { margin-top: .15rem; color: #aaa89d; font-size: .67rem; }
  .empty { color: #98978e; font-size: .78rem; }
  .eyebrow { color: #bca36e; font-size: .64rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; }
  .details-header { padding-bottom: .9rem; border-bottom: 1px solid #393a38; }
  .details-header h2 { margin-top: .25rem; line-height: 1.25; }
  .close-button { font-size: .7rem; }
  .stale-warning { margin: .8rem 0; }
  .stale-warning p { margin: .35rem 0; }
  .detail-search { display: block; margin: .8rem 0; }
  .detail-search input { margin-top: .4rem; }
  .category-line { margin: .8rem 0 .25rem; color: #d4bc86; font-size: .77rem; }
  .level-line { margin: 0 0 .8rem; color: #aaa89d; font-size: .7rem; }
  .entity-heading h3, .linked-locations h3 { margin: 0 0 .4rem; color: #d7d2c6; font-size: .75rem; letter-spacing: .04em; }
  .source-card, .entity-block { padding: .65rem; margin: .65rem 0; border: 1px solid #3a3b37; background: #1b1c1b; }
  .source-title strong { font-size: .8rem; }
  .source-title span { color: #aaa89d; font-size: .68rem; }
  .source-location { width: 100%; margin-top: .5rem; padding: .5rem; border: 1px solid #806d4a; background: #2a261e; color: #e4ce99; font-size: .72rem; text-align: center; }
  .source-location:disabled { opacity: .5; cursor: default; }
  summary { cursor: pointer; color: #d4bc86; font-size: .8rem; }
  .entity-heading h3 { margin-top: .15rem; font-size: .85rem; }
  .entity-block > p { color: #c1beb4; font-size: .75rem; line-height: 1.45; }
  .linked-locations { margin-top: 1rem; }
  .linked-locations .inline-link { display: block; margin: .4rem 0; font-size: .73rem; }
  .state-card { max-width: 600px; margin: 12vh auto; padding: 2rem; border: 1px solid #3e403b; background: #202120; }
  .state-card h1 { margin-top: 0; font-size: 1.25rem; }
  .state-card p { color: #aaa9a0; font-size: .85rem; line-height: 1.5; }
  .state-card.error { border-color: #75473f; }
  .spinner { width: 22px; height: 22px; margin-bottom: 1rem; border: 2px solid #514f45; border-top-color: #d4b875; border-radius: 50%; animation: spin .8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @media (max-width: 1050px) {
    .workspace { grid-template-columns: 220px minmax(0, 1fr) minmax(280px, 340px); }
    .workspace.sidebar-collapsed { grid-template-columns: 56px minmax(0, 1fr) minmax(280px, 340px); }
    .map-column { grid-template-rows: minmax(0, 3fr) minmax(0, 1fr); }
  }
  @media (max-width: 680px) {
    .atlas-shell { height: 100dvh; min-height: 0; display: flex; flex-direction: column; }
    .topbar { align-items: flex-start; flex-direction: column; flex-shrink: 0; }
    .build-meta { justify-content: flex-start; }
    .workspace, .workspace.sidebar-collapsed { position: relative; display: grid; grid-template-columns: minmax(280px, 1fr) 280px; height: auto; flex: 1; min-height: 0; overflow-x: auto; }
    .map-column { height: 100%; min-height: 0; grid-template-rows: minmax(280px, 1fr) minmax(180px, 30vh); }
    .control-panel { position: absolute; z-index: 6; top: 0; bottom: 0; left: 0; width: min(88vw, 300px); border-right: 1px solid #393a38; box-shadow: 5px 0 20px #0008; }
    .control-panel.collapsed { width: 56px; }
    .state-card { margin: 2rem .8rem; padding: 1.2rem; }
  }
</style>
