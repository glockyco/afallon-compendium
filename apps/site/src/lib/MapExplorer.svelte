<script lang="ts">
  import { afterNavigate, pushState, replaceState } from '$app/navigation';
  import { dev } from '$app/environment';
  import { base } from '$app/paths';
  import './MapExplorer.css';
  import { onMount, tick } from 'svelte';
  import type { MapAdapter, MapRendererController, MapViewState } from './map-renderer';
  import { AtlasDataLoader } from './atlas-data';
  import { AtlasController, type AtlasSnapshot } from './atlas-controller';
  import { emptySearchIndexes, getCategoryCounts, rankResults, selectionHighlightIds, resultHighlightIds, summarizePlacements } from './atlas-search';
  import { DEFAULT_ATLAS_STATE, readAtlasUrl, writeAtlasUrl } from './atlas-state';
  import { filteredSections, linksFromSections } from './detail-utils';
  import AtlasDevelopmentDetails from './map/AtlasDevelopmentDetails.svelte';
  import AtlasCanvasShell from './map/AtlasCanvasShell.svelte';
  import AtlasSearchResults, { type ResultSummary, type SearchResult } from './map/AtlasSearchResults.svelte';
  import AtlasSidebar from './map/AtlasSidebar.svelte';
  import type { LayerOption } from './map/AtlasLayerControls.svelte';

  import {
    MARKER_IDS,
    DEFAULT_MARKER_IDS,
    MARKER_SECTION_LABELS,
    MARKER_SECTION_ORDER,
    markerFor,
    resolveMarker,
    type MarkerId,
  } from './map/marker-registry';
  import { MAX_VIEW_ZOOM, MIN_VIEW_ZOOM } from './map/interaction';
  import { canonicalLayerIds, NO_IMAGERY_LAYER_ID } from './map/layer-policy';
  import { clearWorldOffsetOverrides, downloadWorldOffsets, loadWorldOffsetOverrides, saveWorldOffsetOverrides, placementInViewport, NO_WORLD_OVERRIDES, type WorldOffsetOverrides } from './map/world-layout';
  import type { PublicEntity, PublicEntitySummary, PublicItemSource, PublicItemSummary, PublicDetailSection, PublicationData } from '@afallon/contracts/public';

  const RESULT_LIMIT = 200;
  const WEBGL_STARTUP_FAILURE = /webgl map unavailable|failed to create webgl context|webgl creation failed|webgl is not supported|exhausted gl driver options/i;

  let canvas: HTMLCanvasElement;
  let resultList: HTMLElement;
  let detailsPanel: HTMLElement;
  let searchInput: HTMLInputElement;
  let snapshot: AtlasSnapshot | null = null;
  let controller: AtlasController | null = null;
  let rendererStarting = false;
  let disposed = false;
  let adapter: MapAdapter | null = null;
  let renderer: MapRendererController | null = null;
  let mapReady = false;
  let mapUnavailable = false;
  let rendererError = '';
  let hoveredId: string | null = null;
  let hoveredResult: SearchResult | null = null;
  let viewportBounds: [number, number, number, number] | null = null;
  let view: MapViewState = { target: [0, 0, 0], zoom: -1 };
  let adapterReady = false;
  let detailOrigin: HTMLElement | null = null;
  let authoring = false;
  let panelCollapsed = false;
  let resultsCollapsed = false;
  let worldOffsetOverrides: WorldOffsetOverrides = {};
  const initialIndexes = emptySearchIndexes();
  const initialEntityDetails: ReadonlyMap<string, PublicEntity> = new Map();
  const initialItemDetails: ReadonlyMap<string, PublicItemSource> = new Map();
  const idleRequest = { status: 'idle' } as const;

  let publication: PublicationData | null = null;
  let searchIndexes = initialIndexes;
  let searchState: AtlasSnapshot['search'] = idleRequest;
  let entityDetails = initialEntityDetails;
  let itemDetails = initialItemDetails;
  let layerIds = DEFAULT_ATLAS_STATE.layerIds;
  let categoryIds = DEFAULT_ATLAS_STATE.categories;

  $: state = snapshot?.state ?? DEFAULT_ATLAS_STATE;
  $: if (snapshot && publication !== snapshot.publication) publication = snapshot.publication;
  $: if (snapshot && searchIndexes !== snapshot.indexes) searchIndexes = snapshot.indexes;
  $: if (snapshot && entityDetails !== snapshot.entityDetails) entityDetails = snapshot.entityDetails;
  $: if (snapshot && itemDetails !== snapshot.itemDetails) itemDetails = snapshot.itemDetails;
  $: mapState = snapshot?.map ?? idleRequest;
  $: if (snapshot && searchState !== snapshot.search) searchState = snapshot.search;
  $: detailLoading = snapshot?.detail.status === 'loading';
  $: detailError = snapshot?.detail.status === 'error' ? snapshot.detail.message : '';
  $: staleSelection = snapshot?.staleSelection ?? '';
  $: loading = !publication && mapState.status !== 'error';
  $: loadError = mapState.status === 'error' ? mapState.message : rendererError;
  $: if (layerIds !== state.layerIds) layerIds = state.layerIds;
  $: if (categoryIds !== state.categories) categoryIds = state.categories;
  $: categories = categoryIds.filter((id): id is MarkerId => MARKER_IDS.includes(id as MarkerId));
  $: selectedId = state.selectedPlacementId;
  $: itemKey = state.itemKey;
  $: selectedEntityKey = state.entityKey;
  $: query = state.query;
  $: itemSourceQuery = state.itemSourceQuery;
  $: detailQuery = state.detailQuery;
  $: showZones = state.showZones;
  $: showConnections = state.showConnections;
  $: showMovement = state.showMovement;

  $: layerOptions = (publication?.tileLayers ?? []).map((layer): LayerOption => ({ id: layer.id, label: mapLabel(publication, layer.mapSpaceId), kind: layer.kind })).sort((left, right) => left.label.localeCompare(right.label));
  $: tileLayerOptions = layerOptions.filter((option) => option.kind === 'captured');
  $: gameMapOptions = layerOptions.filter((option) => option.kind === 'game-map');
  $: visibleTileLayerIds = layerIds.includes('captured') ? tileLayerOptions.map((option) => option.id) : tileLayerOptions.filter((option) => layerIds.includes(option.id)).map((option) => option.id);
  $: capturedChecked = visibleTileLayerIds.length > 0;
  $: capturedPartial = visibleTileLayerIds.length > 0 && visibleTileLayerIds.length < tileLayerOptions.length;
  $: visibleGameMapIds = layerIds.includes('game-maps') ? gameMapOptions.map((option) => option.id) : gameMapOptions.filter((option) => layerIds.includes(option.id)).map((option) => option.id);
  $: gameMapsChecked = visibleGameMapIds.length > 0;
  $: gameMapsPartial = visibleGameMapIds.length > 0 && visibleGameMapIds.length < gameMapOptions.length;
  $: allMapPlacements = publication?.placements ?? [];
  $: entityIndexByKey = searchIndexes.entitiesByKey;
  $: itemIndexByKey = searchIndexes.itemsByKey;
  $: itemContext = itemKey ? itemDetails.get(itemKey) ?? null : null;
  $: sourceSearchEntries = (itemContext?.sources ?? []).map((source) => ({ source, text: [source.label, source.kind, sectionText(source.sections)].join(' ').toLocaleLowerCase() }));
  $: sourceNeedle = itemSourceQuery.trim().toLocaleLowerCase();
  $: filteredItemSources = sourceSearchEntries.filter((entry) => !sourceNeedle || entry.text.includes(sourceNeedle)).map((entry) => entry.source);
  $: itemPlacementIds = new Set(itemContext?.sources.flatMap((source) => source.placementIds) ?? []);
  $: entityByKey = entityDetails;
  $: selectedEntitySummary = selectedEntityKey ? entityIndexByKey.get(selectedEntityKey) ?? null : null;
  $: selectedEntity = selectedEntityKey ? entityByKey.get(selectedEntityKey) ?? null : null;
  $: selectedItemEntity = itemKey ? entityByKey.get(itemKey) ?? null : null;
  $: entitySearchEntries = searchIndexes.entitySearchEntries;
  $: itemSearchEntries = searchIndexes.itemSearchEntries;
  $: placementSearchText = searchIndexes.placementSearchText;
  $: searchNeedle = query.trim().toLocaleLowerCase();
  $: matchingEntities = searchNeedle ? entitySearchEntries.filter((entry) => entry.text.includes(searchNeedle)).map((entry) => entry.entity) : [];
  $: matchingItems = searchNeedle ? itemSearchEntries.filter((entry) => entry.text.includes(searchNeedle)).map((entry) => entry.item) : [];
  $: querySourcePlacementIds = new Set(matchingItems.flatMap((item) => searchIndexes.placementsByItemKey.get(item.itemKey)?.map((placement) => placement.placementId) ?? []));
  $: queryEntityPlacementIds = new Set(matchingEntities.flatMap((entity) => searchIndexes.placementsByEntityKey.get(entity.entityKey)?.map((placement) => placement.placementId) ?? []));
  // Placements that pass every filter except the category selection: the sidebar counts
  // each category against these, so an unselected category keeps its count and its row.
  $: candidatePlacements = allMapPlacements.filter((placement) => (!itemKey || (searchState.status === 'loaded' && !itemIndexByKey.has(itemKey)) || itemPlacementIds.has(placement.placementId)) && (!searchNeedle || placementSearchText.get(placement.placementId)?.includes(searchNeedle) || querySourcePlacementIds.has(placement.placementId) || queryEntityPlacementIds.has(placement.placementId)));
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
  $: effectiveOffsets = authoring ? worldOffsetOverrides : NO_WORLD_OVERRIDES;
  $: viewportPlacements = publication ? matchingPlacements.filter((placement) => placementInViewport(publication!, placement, effectiveOffsets, viewportBounds)) : [];
  $: selectedPlacement = searchIndexes.placementsById.get(selectedId ?? '') ?? null;
  $: hoveredPlacement = searchIndexes.placementsById.get(hoveredId ?? '') ?? null;
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
  $: filteredDetail = filteredSections(selectedPlacement ? selectedPlacementDetails : selectedEntity?.sections ?? [], detailQuery);
  $: extraSelection = selectedPlacement && !staleSelection && !matchingPlacements.some((placement) => placement.placementId === selectedId) ? selectedPlacement : null;
  $: adapterPlacements = extraSelection ? [...matchingPlacements, extraSelection] : matchingPlacements;
  $: highlightedPlacementIds = selectionHighlightIds(selectedPlacement, selectedEntityKey, itemKey, searchIndexes);
  $: hoveredPlacementIds = resultHighlightIds(hoveredResult, searchIndexes);
  $: resultsPending = mapState.status !== 'loaded' || Boolean(searchNeedle && searchState.status !== 'loaded') || Boolean(itemKey && !itemContext && !staleSelection);
  $: resultsError = searchState.status === 'error' ? searchState.message : '';

  function handleMapError(message: string): void {
    if (WEBGL_STARTUP_FAILURE.test(message)) {
      mapUnavailable = true;
      rendererError = '';
      return;
    }
    rendererError = message;
  }

  afterNavigate(({ to }) => {
    if (controller && to) controller.navigate(readAtlasUrl(to.url.search));
  });

  onMount(() => {
    worldOffsetOverrides = loadWorldOffsetOverrides();
    try {
      const storedPanelState = localStorage.getItem('afallon-atlas-sidebar');
      panelCollapsed = storedPanelState ? storedPanelState === 'collapsed' : window.matchMedia('(max-width: 680px)').matches;
      resultsCollapsed = localStorage.getItem('afallon-atlas-results') === 'collapsed';
    } catch {
      // Expanded panels are a safe default when browser storage is unavailable.
    }
    const onPopState = () => controller?.navigate(readAtlasUrl(window.location.search));
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
    const rootUrl = new URL(`${base}/data/publication.json`, window.location.href);
    controller = new AtlasController(new AtlasDataLoader(fetch, new URL('.', rootUrl)), {
      onChange: acceptSnapshot,
      onNavigate(next, mode) {
        const url = writeAtlasUrl(new URL(window.location.href), next);
        if (mode === 'push') pushState(url, {});
        else replaceState(url, {});
      },
      onRestoreView(next) {
        if (!next && !publication) return;
        const restored = next ? { target: [...next.target] as [number, number, number], zoom: next.zoom } : centerView(publication!.world);
        view = restored;
        adapter?.setView(restored);
      },
    });
    controller.start(readAtlasUrl(window.location.search));
    return () => {
      disposed = true;
      window.removeEventListener('popstate', onPopState);
      window.removeEventListener('keydown', onKeydown);
      controller?.dispose();
      renderer?.destroy();
      adapter = null;
    };
  });

  $: if (adapterReady && adapter && publication) {
    adapter.update({ data: publication, mapSpaceId: publication.world.mapSpaceId, layerIds: layerIds.filter((id) => id !== NO_IMAGERY_LAYER_ID), categories, placements: adapterPlacements, selectedId, highlightedPlacementIds, hoveredPlacementIds, worldOffsets: effectiveOffsets, authoring, showConnections, showMovement, showZones });
  }

  function acceptSnapshot(next: AtlasSnapshot): void {
    snapshot = next;
  }

  $: if (publication && !rendererStarting) void startRenderer().catch((error: unknown) => {
    if (disposed) return;
    mapUnavailable = true;
    rendererError = error instanceof Error ? error.message : String(error);
  });

  async function startRenderer(): Promise<void> {
    rendererStarting = true;
    await tick();
    if (disposed || !publication) return;
    const requestedView = controller?.snapshot.state.view;
    view = requestedView ? { target: [...requestedView.target] as [number, number, number], zoom: requestedView.zoom } : centerView(publication.world);
    const module = await import('./map-renderer');
    if (disposed) return;
    renderer = new module.MapRendererController(handleMapError);
    adapter = await renderer.replace(canvas, view, {
      onViewChange(nextView, bounds) { view = nextView; viewportBounds = bounds; controller?.scheduleView(nextView); },
      onSelect(placementId) { selectPlacement(placementId, canvas); },
      onHover(placementId) { hoveredResult = null; hoveredId = placementId; },
      onWorldOffsetChange(changedMapSpaceId, offset) { worldOffsetOverrides = { ...worldOffsetOverrides, [changedMapSpaceId]: offset }; saveWorldOffsetOverrides(worldOffsetOverrides); },
      onReady() { mapReady = true; },
      onError(message) { handleMapError(message); },
    });
    adapterReady = adapter !== null;
  }

  function centerView(map: PublicationData['world']): MapViewState {
    const x = (map.bounds.min.x + map.bounds.max.x) / 2;
    const y = (map.bounds.min.y + map.bounds.max.y) / 2;
    const scale = Math.min((canvas?.clientWidth || 640) / (map.bounds.max.x - map.bounds.min.x), (canvas?.clientHeight || 480) / (map.bounds.max.y - map.bounds.min.y));
    return { target: [x, y, 0], zoom: Math.log2(scale * 0.9) };
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

  function setMapView(next: MapViewState): void {
    view = next;
    adapter?.setView(next);
    controller?.dispatch({ type: 'set-view', view: next }, 'replace');
  }

  function fitMap(): void {
    if (!publication || !adapter || !mapReady) return;
    setMapView(centerView(publication.world));
  }

  function selectPlacement(placementId: string, origin: HTMLElement | HTMLCanvasElement | null = null): void {
    const placement = searchIndexes.placementsById.get(placementId);
    if (!placement) return;
    detailOrigin = origin;
    controller?.dispatch({ type: 'select-placement', placementId }, 'push');
    void focusDetails();
  }

  async function focusDetails(): Promise<void> {
    await tick();
    detailsPanel?.querySelector<HTMLElement>('h2')?.focus();
  }

  function selectEntity(entity: PublicEntity | PublicEntitySummary, origin: HTMLElement | null = null): void {
    const item = itemIndexByKey.get(entity.entityKey);
    if (item) { selectItem(item, origin); return; }
    detailOrigin = origin;
    controller?.dispatch({ type: 'select-entity', entityKey: entity.entityKey }, 'push');
    void focusDetails();
  }

  function openEntity(key: string, origin: HTMLElement): void {
    const entity = entityIndexByKey.get(key);
    if (entity) selectEntity(entity, origin);
  }

  function selectItem(item: PublicItemSummary | PublicItemSource, origin: HTMLElement | null = null): void {
    const summary = itemIndexByKey.get(item.itemKey);
    if (!summary) return;
    detailOrigin = origin;
    controller?.dispatch({ type: 'select-item', itemKey: summary.itemKey }, 'push');
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
    controller?.dispatch({ type: 'select-layers', layerIds: canonicalLayerIds(normalised) }, 'push');
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
    controller?.dispatch({ type: 'set-overlay', field: 'showConnections', visible: !showConnections }, 'push');
  }

  function toggleMovement(): void {
    controller?.dispatch({ type: 'set-overlay', field: 'showMovement', visible: !showMovement }, 'push');
  }

  function toggleZones(): void {
    controller?.dispatch({ type: 'set-overlay', field: 'showZones', visible: !showZones }, 'push');
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
    controller?.dispatch({ type: 'select-categories', categories: next }, 'push');
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
    controller?.dispatch({ type: 'select-categories', categories: next }, 'push');
  }

  async function submitSearch(): Promise<void> {
    controller?.dispatch({ type: 'search', field: 'query', query }, 'push');
    if (resultsCollapsed) {
      setResultsCollapsed(false);
      await tick();
    }
    const first = resultList?.querySelector<HTMLButtonElement>('button[data-result]');
    first?.focus();
  }

  async function closeDetails(): Promise<void> {
    const origin = detailOrigin;
    detailOrigin = null;
    controller?.dispatch({ type: 'close-details' }, 'push');
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
    <main class="state-card error" role="alert"><h1>Atlas unavailable</h1><p>{loadError}</p><p class="muted">The publication request failed. There is no fallback dataset.</p><button type="button" on:click={() => controller?.retry('map')}>Retry map data</button></main>
  {:else if publication}
    <main class="workspace" class:has-details={Boolean(selectedPlacement || selectedEntityKey || itemKey || staleSelection)} class:sidebar-collapsed={panelCollapsed} class:no-details={!dev}>
      <AtlasSidebar
        collapsed={panelCollapsed} logoBase={base} bind:searchInput {query} sections={markerSections} {categories} {categoryCounts} countsPending={resultsPending}
        placementCount={allMapPlacements.length} {isDefaultCategories} {layerOptions} {tileLayerOptions} {gameMapOptions}
        {visibleTileLayerIds} {visibleGameMapIds} {capturedChecked} {capturedPartial} {gameMapsChecked} {gameMapsPartial}
        {showConnections} {showMovement} {showZones} {authoring} {worldOffsetOverrides} onToggle={togglePanel}
        onQuery={(next) => controller?.setQuery('query', next)} onSubmitSearch={submitSearch}
        onResetCategories={() => controller?.dispatch({ type: 'select-categories', categories: DEFAULT_MARKER_IDS }, 'push')}
        onShowAllCategories={() => controller?.dispatch({ type: 'select-categories', categories: [] }, 'push')} onToggleCategory={toggleCategory}
        onToggleAllCategories={toggleAllCategories} onToggleCaptured={toggleCaptured} onToggleMapLayer={toggleMapLayer}
        onToggleGameMaps={toggleGameMaps} onToggleGameMap={toggleGameMap} onToggleConnections={toggleConnections}
        onToggleMovement={toggleMovement} onToggleZones={toggleZones} onToggleAuthoring={toggleAuthoring}
        onExportWorldOffsets={exportWorldOffsets} onDiscardWorldOffsets={discardWorldOffsets}
      />
      {#if !panelCollapsed}<button class="panel-backdrop" type="button" aria-label="Close atlas controls" on:click={togglePanel}></button>{/if}

      <section class:results-collapsed={resultsCollapsed} class="map-column" aria-label="Interactive map">
        <AtlasCanvasShell bind:canvas {mapReady} {mapUnavailable} {previewPlacement} {previewMarker}
          countsPending={resultsPending} matchingCount={matchingPlacements.length} viewportCount={resultPlacements.length} showsExtraSelection={Boolean(extraSelection)}
          onZoomIn={() => setMapView({ ...view, zoom: Math.min(MAX_VIEW_ZOOM, view.zoom + 0.5) })}
          onZoomOut={() => setMapView({ ...view, zoom: Math.max(MIN_VIEW_ZOOM, view.zoom - 0.5) })} onFit={fitMap}
        />
        {#if loadError && publication && !mapUnavailable}<div class="inline-error" role="alert">{loadError}</div>{/if}
        {#if !dev && staleSelection}<p role="alert">{staleSelection} <button type="button" on:click={closeDetails}>Clear selection</button></p>{/if}
        {#if !dev && detailError}<p role="alert">{detailError} <button type="button" on:click={() => controller?.retry('detail')}>Retry selection</button></p>{/if}
        <AtlasSearchResults bind:resultList collapsed={resultsCollapsed} {displayedResults} totalResults={rankedResults.length}
          pending={resultsPending} error={resultsError} searchPending={searchState.status === 'loading'} onRetry={() => controller?.retry('search')}
          resultLimit={RESULT_LIMIT} placementCount={resultPlacements.length} itemCount={matchingItems.length} entityCount={matchingEntities.length}
          hasViewport={Boolean(viewportBounds)} {mapUnavailable} itemContextActive={Boolean(itemContext)} selectedItemKey={itemKey}
          {selectedEntityKey} selectedPlacementId={selectedId} summaryFor={resultSummary} onToggle={toggleResults}
          onExitItemContext={() => controller?.dispatch({ type: 'exit-item-context' }, 'push')} onSelectItem={selectItem} onSelectEntity={selectEntity}
          onSelectPlacement={selectPlacement} onHover={setResultHover} onClearHover={clearResultHover}
        />
      </section>

      {#if dev}
        <AtlasDevelopmentDetails bind:detailsPanel {selectedPlacement} {selectedEntityKey} {itemKey} {staleSelection}
          {selectedItemEntity} {itemIndexByKey} {selectedEntity} {selectedEntitySummary} {detailLoading} {detailError}
          {itemContext} {entityByKey} {filteredItemSources} itemContextSections={filteredSections(itemContext?.sections ?? [], itemSourceQuery)} {selectedEntities} {filteredDetail} {selectedPlacementDetails}
          {itemSourceQuery} {detailQuery} {sourceRows} {entityLinks} onClose={closeDetails}
          onItemSourceQuery={(next) => controller?.setQuery('itemSourceQuery', next)} onDetailQuery={(next) => controller?.setQuery('detailQuery', next)}
          onRetry={() => controller?.retry('detail')} onOpenEntity={openEntity} onSelectPlacement={selectPlacement} onSelectEntity={selectEntity}
        />
      {/if}
    </main>
  {/if}
</div>
