<script lang="ts">
  import { pushState, replaceState } from '$app/navigation';
  import { dev } from '$app/environment';
  import { base } from '$app/paths';
  import './MapExplorer.css';
  import { onMount, tick } from 'svelte';
  import type { MapAdapter, MapAdapterUpdate, MapRendererController, MapViewState } from './map-renderer';
  import { readAtlasUrl, writeAtlasUrl, type AtlasState } from './atlas-state';
  import { filteredSections, linksFromSections } from './detail-utils';
  import AtlasDevelopmentDetails from './map/AtlasDevelopmentDetails.svelte';
  import AtlasCanvasShell from './map/AtlasCanvasShell.svelte';
  import AtlasSearchResults, { type ResultSummary, type SearchResult } from './map/AtlasSearchResults.svelte';
  import AtlasSidebar from './map/AtlasSidebar.svelte';
  import type { LayerOption } from './map/AtlasLayerControls.svelte';
  import {
    findItem,
    resolvePublicationAssets,
  } from './publication';
  import {
    MARKER_IDS,
    DEFAULT_MARKER_IDS,
    MARKER_SECTION_LABELS,
    MARKER_SECTION_ORDER,
    markerFor,
    resolveMarker,
    type MarkerDefinition,
    type MarkerId,
  } from './map/marker-registry';
  import { MAX_VIEW_ZOOM, MIN_VIEW_ZOOM } from './map/interaction';
  import { canonicalLayerIds, resolveLayerIds, NO_IMAGERY_LAYER_ID } from './map/layer-policy';
  import { clearWorldOffsetOverrides, downloadWorldOffsets, loadWorldOffsetOverrides, saveWorldOffsetOverrides, type WorldOffsetOverrides } from './map/world-layout';
  import { PUBLICATION_SCHEMA_VERSION, type EntityDetailsDocument, type ItemSourcesDocument, type PublicEntity, type PublicEntitySummary, type PublicItemSource, type PublicItemSummary, type PublicPlacement, type PublicDetailSection, type PublicationData } from '@afallon/contracts/public';

  const searchKindOrder = { item: 0, placement: 1, entity: 2 };
  const RESULT_LIMIT = 200;
  const WEBGL_STARTUP_FAILURE = /failed to create webgl context|webgl creation failed|webgl is not supported|exhausted gl driver options/i;

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
  let renderer: MapRendererController | null = null;
  let loading = true;
  let mapReady = false;
  let mapUnavailable = false;
  let loadError = '';
  let layerIds: string[] = [];
  let selectedId: string | null = null;
  let query = '';
  let categories: MarkerId[] = [];
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
  let showConnections = false;
  let showMovement = false;
  let showZones = false;
  let panelCollapsed = false;
  let resultsCollapsed = false;
  let worldOffsetOverrides: WorldOffsetOverrides = {};
  let viewTimer: ReturnType<typeof setTimeout> | null = null;
  let queryTimer: ReturnType<typeof setTimeout> | null = null;
  let searchIndexes: SearchIndexes = emptySearchIndexes();

  $: layerOptions = (publication?.tileLayers ?? []).map((layer): LayerOption => ({ id: layer.id, label: mapLabel(publication, layer.mapSpaceId), kind: layer.kind })).sort((left, right) => left.label.localeCompare(right.label));
  $: tileLayerOptions = layerOptions.filter((option) => option.kind === 'captured');
  $: gameMapOptions = layerOptions.filter((option) => option.kind === 'game-map');
  $: visibleTileLayerIds = layerIds.includes('captured') ? tileLayerOptions.map((option) => option.id) : tileLayerOptions.filter((option) => layerIds.includes(option.id)).map((option) => option.id);
  $: capturedChecked = visibleTileLayerIds.length > 0;
  $: capturedPartial = visibleTileLayerIds.length > 0 && visibleTileLayerIds.length < tileLayerOptions.length;
  $: visibleGameMapIds = layerIds.includes('game-maps') ? gameMapOptions.map((option) => option.id) : gameMapOptions.filter((option) => layerIds.includes(option.id)).map((option) => option.id);
  $: gameMapsChecked = visibleGameMapIds.length > 0;
  $: gameMapsPartial = visibleGameMapIds.length > 0 && visibleGameMapIds.length < gameMapOptions.length;
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
  // Placements that pass every filter except the category selection: the sidebar counts
  // each category against these, so an unselected category keeps its count and its row.
  $: candidatePlacements = allMapPlacements.filter((placement) => (!itemKey || itemPlacementIds.has(placement.placementId)) && (!searchNeedle || placementSearchText.get(placement.placementId)?.includes(searchNeedle) || querySourcePlacementIds.has(placement.placementId) || queryEntityPlacementIds.has(placement.placementId)));
  $: matchingPlacements = candidatePlacements.filter((placement) => categories.length === 0 || categories.some((category) => placement.categories.includes(category)));
  $: categoryCounts = getCategoryCounts(candidatePlacements);
  $: publishedCounts = getCategoryCounts(allMapPlacements);
  // Every category the publication carries stays listed, selected or not.
  $: isDefaultCategories = categories.length === DEFAULT_MARKER_IDS.length && DEFAULT_MARKER_IDS.every((id) => categories.includes(id));
  $: markerSections = MARKER_SECTION_ORDER.map((section) => ({
    id: section,
    label: MARKER_SECTION_LABELS[section],
    markers: MARKER_IDS.filter((category) => publishedCounts[category] > 0 || categories.includes(category)).map((category) => markerFor(category)).filter((marker) => marker.section === section),
  })).filter((section) => section.markers.length > 0);
  $: viewportPlacements = matchingPlacements.filter((placement) => inViewport(placement, viewportBounds));
  $: selectedPlacement = publication?.placements.find((placement) => placement.placementId === selectedId) ?? null;
  $: hoveredPlacement = publication?.placements.find((placement) => placement.placementId === hoveredId) ?? null;
  // The map preview names the hovered placement, and falls back to the selection.
  $: previewPlacement = hoveredPlacement ?? selectedPlacement;
  $: previewMarkerId = previewPlacement ? resolveMarker(previewPlacement) : null;
  $: previewMarker = previewMarkerId ? markerFor(previewMarkerId) : null;
  $: selectedEntities = selectedPlacement ? selectedPlacement.entityKeys.map((key) => entityByKey.get(key)).filter((entity): entity is PublicEntity => Boolean(entity)) : [];
  $: selectedPlacementDetails = selectedPlacement ? [
    ...selectedEntities.flatMap((entity) => entity.sections),
    ...selectedPlacement.itemKeys.flatMap((key) => (itemDetails.get(key)?.sources ?? []).flatMap((source) => source.sections)),
  ] : [];
  $: resultPlacements = !mapUnavailable && viewportBounds ? viewportPlacements : matchingPlacements;
  $: rankedResults = rankResults(searchNeedle, matchingItems, matchingEntities, resultPlacements, entityIndexByKey);
  $: displayedResults = rankedResults.slice(0, RESULT_LIMIT);
  $: filteredDetail = selectedPlacement ? filteredSections(selectedPlacementDetails, detailQuery) : [];
  $: extraSelection = selectedPlacement && !staleSelection && !matchingPlacements.some((placement) => placement.placementId === selectedId) ? selectedPlacement : null;
  $: adapterPlacements = extraSelection ? [...matchingPlacements, extraSelection] : matchingPlacements;
  $: highlightedPlacementIds = selectionHighlightIds(selectedPlacement, selectedEntityKey, itemKey, searchIndexes);
  $: hoveredPlacementIds = resultHighlightIds(hoveredResult, searchIndexes);

  function handleMapError(message: string): void {
    if (WEBGL_STARTUP_FAILURE.test(message)) {
      mapUnavailable = true;
      loadError = '';
      return;
    }
    loadError = message;
  }

  onMount(() => {
    let disposed = false;
    worldOffsetOverrides = loadWorldOffsetOverrides();
    try {
      const storedPanelState = localStorage.getItem('afallon-atlas-sidebar');
      panelCollapsed = storedPanelState ? storedPanelState === 'collapsed' : window.matchMedia('(max-width: 680px)').matches;
      resultsCollapsed = localStorage.getItem('afallon-atlas-results') === 'collapsed';
    } catch {
      // Expanded panels are a safe default when browser storage is unavailable.
    }
    const metadataRequest = new AbortController();
    const onPopState = () => applyUrlState(readAtlasUrl(window.location.search));
    const onKeydown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === 'k') {
        event.preventDefault();
        if (panelCollapsed) togglePanel();
        searchInput?.focus();
        searchInput?.select();
        return;
      }
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
    applyUrlState(readAtlasUrl(window.location.search));
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
        applyUrlState(readAtlasUrl(window.location.search));
        loading = false;
        void tick().then(() => ensureCurrentSelection());
        await tick();
        if (disposed) return;
        const requestedView = readAtlasUrl(window.location.search).view;
        view = requestedView ? { target: [requestedView.target[0], requestedView.target[1], requestedView.target[2]], zoom: requestedView.zoom } : centerView(publication.world);
        const module = await import('./map-renderer');
        if (disposed) return;
        renderer = new module.MapRendererController(handleMapError);
        adapter = await renderer.replace(canvas, view, {
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
          onReady() {
            mapReady = true;
          },
          onError(message) {
            handleMapError(message);
          }
        });
        adapterReady = adapter !== null;
      })
      .catch((error: unknown) => {
        if (!disposed) {
          loading = false;
          const message = error instanceof Error ? error.message : 'The publication could not be loaded.';
          if (publication) handleMapError(message);
          else loadError = message;
        }
      });
    return () => {
      disposed = true;
      metadataRequest.abort();
      window.removeEventListener('popstate', onPopState);
      window.removeEventListener('keydown', onKeydown);
      if (viewTimer) clearTimeout(viewTimer);
      if (queryTimer) clearTimeout(queryTimer);
      renderer?.destroy();
      adapter = null;
    };
  });

  $: if (adapterReady && adapter && publication) {
    adapter.update({ data: publication, mapSpaceId: publication.world.mapSpaceId, layerIds: layerIds.filter((id) => id !== NO_IMAGERY_LAYER_ID), categories, placements: adapterPlacements, selectedId, highlightedPlacementIds, hoveredPlacementIds, worldOffsets: authoring ? worldOffsetOverrides : {}, authoring, showConnections, showMovement, showZones });
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
    return {
      marker,
      categories: categoryIds.length > 0 ? categoryIds.map((category) => markerFor(category).label).join(' · ') : 'No map category',
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
      entitySummaries: new Map(data.entityIndex.map((entity) => [entity.entityKey, summarizePlacements(placementsByEntityKey.get(entity.entityKey) ?? [], 'townsfolk')])),
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
    if (result.kind === 'entity') return searchIndexes.entitySummaries.get(result.entity.entityKey) ?? summarizePlacements([], 'townsfolk');
    return searchIndexes.itemSummaries.get(result.item.itemKey) ?? summarizePlacements([], 'container');
  }

  function sectionText(sections: PublicDetailSection[]): string {
    return sections.flatMap((section) => [section.title, ...section.rows.flatMap((row) => [row.label, row.value])]).join(' ');
  }

  function inViewport(placement: PublicPlacement, bounds: [number, number, number, number] | null): boolean {
    if (!bounds) return true;
    return placement.position[0] >= bounds[0] && placement.position[0] <= bounds[2] && placement.position[1] >= bounds[1] && placement.position[1] <= bounds[3];
  }

  function applyUrlState(next: AtlasState): void {
    itemSourceQuery = next.itemSourceQuery;
    detailQuery = next.detailQuery;
    layerIds = resolveLayerIds(next.layerIds, publication?.tileLayers ?? []);
    query = next.query;
    categories = next.categories.filter((category): category is MarkerId => MARKER_IDS.includes(category as MarkerId));
    showZones = next.showZones;
    showConnections = next.showConnections;
    showMovement = next.showMovement;
    itemKey = next.itemKey && (!publication || publication.itemIndex.some((item) => item.itemKey === next.itemKey)) ? next.itemKey : null;
    const selected = next.selectedPlacementId && publication ? publication.placements.find((placement) => placement.placementId === next.selectedPlacementId) : null;
    if (next.selectedPlacementId && publication && !selected) staleSelection = 'This link refers to a location that is not in the loaded publication.';
    else staleSelection = '';
    selectedId = selected?.placementId ?? (publication ? null : next.selectedPlacementId);
    selectedEntityKey = next.entityKey && (!publication || publication.entityIndex.some((entity) => entity.entityKey === next.entityKey)) ? next.entityKey : null;
    if (selectedEntityKey) itemKey = null;
    else if (next.entityKey && publication) staleSelection = `This link refers to an entity that is not in the loaded publication: ${next.entityKey}.`;
    if (next.itemKey && !itemKey && !selectedEntityKey && publication) staleSelection = `This link refers to an item that is not in the loaded publication: ${next.itemKey}.`;
    const restoredView = next.view ?? (publication ? centerView(publication.world) : null);
    if (restoredView) {
      const rendererView: MapViewState = { target: [restoredView.target[0], restoredView.target[1], restoredView.target[2]], zoom: restoredView.zoom };
      view = rendererView;
      adapter?.setView(rendererView);
    }
  }

  function currentUrl(overrides: Partial<Pick<AtlasState, 'categories'>> = {}): URL {
    return writeAtlasUrl(new URL(window.location.href), { mapSpaceId: null, layerIds, selectedPlacementId: selectedId, query, itemSourceQuery: itemKey ? itemSourceQuery : '', detailQuery: !itemKey && (selectedId || selectedEntityKey) ? detailQuery : '', categories: overrides.categories !== undefined ? overrides.categories : categories, showZones, showConnections, showMovement, itemKey, entityKey: selectedEntityKey, view });
  }

  function syncUrl(mode: 'push' | 'replace', overrides: Partial<Pick<AtlasState, 'categories'>> = {}): void {
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

  function fitMap(): void {
    if (!publication || !adapter || !mapReady) return;
    setMapView(centerView(publication.world));
  }

  function selectPlacement(placementId: string, origin: HTMLElement | HTMLCanvasElement | null = null): void {
    const placement = publication?.placements.find((candidate) => candidate.placementId === placementId);
    if (!placement) return;
    selectedId = placementId;
    selectedEntityKey = null;
    staleSelection = '';
    detailOrigin = origin;
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

  function mapLabel(data: PublicationData | null, mapSpaceId: string): string {
    return data?.maps.find((map) => map.mapSpaceId === mapSpaceId)?.label ?? mapSpaceId;
  }

  // 'captured' stands for every tile layer, so unchecking one map expands it to the explicit rest.
  function setLayers(next: string[]): void {
    const tileIds = tileLayerOptions.map((option) => option.id);
    const chosenTiles = next.filter((id) => tileIds.includes(id));
    const withTiles = next.includes('captured') || (tileIds.length > 0 && chosenTiles.length === tileIds.length)
      ? [...next.filter((id) => !tileIds.includes(id) && id !== 'captured'), 'captured']
      : next.filter((id) => id !== 'captured');
    const gameIds = gameMapOptions.map((option) => option.id);
    const chosenGame = withTiles.filter((id) => gameIds.includes(id));
    const normalised = withTiles.includes('game-maps') || (gameIds.length > 0 && chosenGame.length === gameIds.length)
      ? [...withTiles.filter((id) => !gameIds.includes(id) && id !== 'game-maps'), 'game-maps']
      : withTiles.filter((id) => id !== 'game-maps');
    layerIds = canonicalLayerIds(normalised);
    syncUrl('push');
  }

  function toggleCaptured(): void {
    setLayers(capturedChecked
      ? layerIds.filter((id) => id !== 'captured' && !tileLayerOptions.some((option) => option.id === id))
      : [...layerIds, 'captured']);
  }

  function toggleMapLayer(id: string): void {
    const expanded = visibleTileLayerIds.includes(id) ? visibleTileLayerIds.filter((current) => current !== id) : [...visibleTileLayerIds, id];
    setLayers([...layerIds.filter((current) => !tileLayerOptions.some((option) => option.id === current) && current !== 'captured'), ...expanded]);
  }

  function toggleGameMaps(): void {
    setLayers(gameMapsChecked
      ? layerIds.filter((id) => id !== 'game-maps' && !gameMapOptions.some((option) => option.id === id))
      : [...layerIds, 'game-maps']);
  }

  function toggleGameMap(id: string): void {
    const expanded = visibleGameMapIds.includes(id) ? visibleGameMapIds.filter((current) => current !== id) : [...visibleGameMapIds, id];
    setLayers([...layerIds.filter((current) => !gameMapOptions.some((option) => option.id === current) && current !== 'game-maps'), ...expanded]);
  }


  function toggleAuthoring(): void {
    authoring = !authoring;
  }

  function toggleConnections(): void {
    showConnections = !showConnections;
    syncUrl('push');
  }

  function toggleMovement(): void {
    showMovement = !showMovement;
    syncUrl('push');
  }

  function toggleZones(): void {
    showZones = !showZones;
    syncUrl('push');
  }

  function togglePanel(): void {
    panelCollapsed = !panelCollapsed;
    try {
      localStorage.setItem('afallon-atlas-sidebar', panelCollapsed ? 'collapsed' : 'expanded');
    } catch {
      // The panel remains usable when browser storage is unavailable.
    }
  }

  function setResultsCollapsed(collapsed: boolean): void {
    resultsCollapsed = collapsed;
    try {
      localStorage.setItem('afallon-atlas-results', collapsed ? 'collapsed' : 'expanded');
    } catch {
      // The results panel remains usable when browser storage is unavailable.
    }
  }

  function toggleResults(): void {
    setResultsCollapsed(!resultsCollapsed);
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

  function discardWorldOffsets(): void {
    worldOffsetOverrides = {};
    clearWorldOffsetOverrides();
  }

  function toggleCategory(category: MarkerId): void {
    const next = categories.includes(category) ? categories.filter((value) => value !== category) : [...categories, category];
    categories = next;
    syncUrl('push', { categories: next });
  }

  async function submitSearch(): Promise<void> {
    syncUrl('push');
    if (resultsCollapsed) {
      setResultsCollapsed(false);
      await tick();
    }
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
  <title>Afallon Compendium</title>
  <meta name="description" content="Afallon interactive map — find bosses, dungeons, merchants, quests, resources, travel points, and item sources across the world." />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Afallon Compendium" />
  <meta property="og:title" content="Afallon Compendium — Interactive Map" />
  <meta property="og:description" content="Find bosses, dungeons, merchants, quests, resources, travel points, and more across Afallon." />
  <meta property="og:url" content="https://afallon.compendiums.org/" />
  <meta property="og:image" content="https://afallon.compendiums.org/og-default.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="Afallon Compendium — Interactive Map" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Afallon Compendium — Interactive Map" />
  <meta name="twitter:description" content="Find bosses, dungeons, merchants, quests, resources, travel points, and more across Afallon." />
  <meta name="twitter:image" content="https://afallon.compendiums.org/og-default.png" />
</svelte:head>

<div class="atlas-shell">
  {#if loading}
    <main class="initial-loading" role="status"><div class="loading-indicator"><div class="spinner" aria-hidden="true"></div><span>Loading map...</span></div></main>
  {:else if loadError && !publication}
    <main class="state-card error" role="alert"><h1>Atlas unavailable</h1><p>{loadError}</p><p class="muted">The publication request failed. There is no fallback dataset.</p></main>
  {:else if publication}
    <main class="workspace" class:has-details={Boolean(selectedPlacement || selectedEntityKey || itemKey || staleSelection)} class:sidebar-collapsed={panelCollapsed} class:no-details={!dev}>
      <AtlasSidebar
        collapsed={panelCollapsed} logoBase={base} bind:searchInput {query} sections={markerSections} {categories} {categoryCounts}
        placementCount={allMapPlacements.length} {isDefaultCategories} {layerOptions} {tileLayerOptions} {gameMapOptions}
        {visibleTileLayerIds} {visibleGameMapIds} {capturedChecked} {capturedPartial} {gameMapsChecked} {gameMapsPartial}
        {showConnections} {showMovement} {showZones} {authoring} {worldOffsetOverrides} onToggle={togglePanel}
        onQuery={(next) => { query = next; scheduleQueryUrl(); }} onSubmitSearch={submitSearch}
        onResetCategories={() => { categories = [...DEFAULT_MARKER_IDS]; syncUrl('push'); }}
        onShowAllCategories={() => { categories = []; syncUrl('push'); }} onToggleCategory={toggleCategory}
        onToggleAllCategories={toggleAllCategories} onToggleCaptured={toggleCaptured} onToggleMapLayer={toggleMapLayer}
        onToggleGameMaps={toggleGameMaps} onToggleGameMap={toggleGameMap} onToggleConnections={toggleConnections}
        onToggleMovement={toggleMovement} onToggleZones={toggleZones} onToggleAuthoring={toggleAuthoring}
        onExportWorldOffsets={exportWorldOffsets} onDiscardWorldOffsets={discardWorldOffsets}
      />
      {#if !panelCollapsed}<button class="panel-backdrop" type="button" aria-label="Close atlas controls" on:click={togglePanel}></button>{/if}

      <section class:results-collapsed={resultsCollapsed} class="map-column" aria-label="Interactive map">
        <AtlasCanvasShell bind:canvas {mapReady} {mapUnavailable} {previewPlacement} {previewMarker}
          matchingCount={matchingPlacements.length} viewportCount={resultPlacements.length} showsExtraSelection={Boolean(extraSelection)}
          onZoomIn={() => setMapView({ ...view, zoom: Math.min(MAX_VIEW_ZOOM, view.zoom + 0.5) })}
          onZoomOut={() => setMapView({ ...view, zoom: Math.max(MIN_VIEW_ZOOM, view.zoom - 0.5) })} onFit={fitMap}
        />
        {#if loadError && publication && !mapUnavailable}<div class="inline-error" role="alert">{loadError}</div>{/if}
        <AtlasSearchResults bind:resultList collapsed={resultsCollapsed} {displayedResults} totalResults={rankedResults.length}
          resultLimit={RESULT_LIMIT} placementCount={resultPlacements.length} itemCount={matchingItems.length} entityCount={matchingEntities.length}
          hasViewport={Boolean(viewportBounds)} {mapUnavailable} itemContextActive={Boolean(itemContext)} selectedItemKey={itemKey}
          {selectedEntityKey} selectedPlacementId={selectedId} summaryFor={resultSummary} onToggle={toggleResults}
          onExitItemContext={() => { itemKey = null; syncUrl('push'); }} onSelectItem={selectItem} onSelectEntity={selectEntity}
          onSelectPlacement={selectPlacement} onHover={setResultHover} onClearHover={clearResultHover}
        />
      </section>

      {#if dev}
        <AtlasDevelopmentDetails bind:detailsPanel {selectedPlacement} {selectedEntityKey} {itemKey} {staleSelection}
          {selectedItemEntity} {itemIndexByKey} {selectedEntity} {selectedEntitySummary} {detailLoading} {detailError}
          {itemContext} {entityByKey} {filteredItemSources} itemContextSections={filteredSections(itemContext?.sections ?? [], itemSourceQuery)} {selectedEntities} {filteredDetail} {selectedPlacementDetails}
          bind:itemSourceQuery bind:detailQuery {sourceRows} {entityLinks} onClose={closeDetails} onQueryChange={scheduleQueryUrl}
          onOpenEntity={openEntity} onSelectPlacement={selectPlacement} onSelectEntity={selectEntity}
        />
      {/if}
    </main>
  {/if}
</div>
