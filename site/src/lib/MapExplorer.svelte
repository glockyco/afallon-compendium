<script lang="ts">
  import { base } from '$app/paths';
  import { onMount, tick } from 'svelte';
  import type { MapAdapterUpdate, MapViewState } from './map-adapter';
  import { readMapUrl, writeMapUrl, type MapUrlState } from './map-url';
  import { filteredSections, linksFromSections } from './detail-utils';
  import DetailSections from './DetailSections.svelte';
  import {
    findItem,
    resolvePublicationAssets,
    roleLabel,
    ROLE_ORDER,
    ROLE_STYLES
  } from './publication';
  import type { PublicEntity, PublicItemSource, PublicPlacement, PublicDetailSection, PublicationData } from '../../../pipeline/public-contracts';

  type Adapter = {
    update(next: MapAdapterUpdate): void;
    destroy(): void;
  };

  interface LayerOption {
    id: string;
    label: string;
    kind: 'screenshot' | 'illustration';
    orientationOnly: boolean;
  }


  type SearchResult = { key: string; name: string; rank: number } & (
    | { kind: 'item'; item: PublicItemSource }
    | { kind: 'entity'; entity: PublicEntity }
    | { kind: 'placement'; placement: PublicPlacement }
  );
  const searchKindOrder = { item: 0, placement: 1, entity: 2 };

  let canvas: HTMLCanvasElement;
  let resultList: HTMLElement;
  let detailsPanel: HTMLElement;
  let searchInput: HTMLInputElement;
  let publication: PublicationData | null = null;
  let adapter: Adapter | null = null;
  let loading = true;
  let loadError = '';
  let mapSpaceId = '';
  let floorId: string | null = null;
  let layerId = '';
  let selectedId: string | null = null;
  let query = '';
  let roles: string[] = [];
  let itemKey: string | null = null;
  let selectedEntityKey: string | null = null;
  let itemSourceQuery = '';
  let detailQuery = '';
  let hoveredId: string | null = null;
  let staleSelection = '';
  let viewportBounds: [number, number, number, number] | null = null;
  let view: MapViewState = { target: [0, 0, 0], zoom: -1 };
  let adapterReady = false;
  let detailOrigin: HTMLElement | null = null;
  let viewTimer: ReturnType<typeof setTimeout> | null = null;
  let queryTimer: ReturnType<typeof setTimeout> | null = null;

  $: activeMap = publication?.maps.find((map) => map.mapSpaceId === mapSpaceId) ?? publication?.maps[0] ?? null;
  $: activeFloors = activeMap?.floors ?? [];
  $: layerOptions = getLayerOptions(publication, mapSpaceId, floorId);
  $: if (layerOptions.length > 0 && !layerOptions.some((layer) => layer.id === layerId)) layerId = layerOptions[0]!.id;
  $: currentLayer = layerOptions.find((layer) => layer.id === layerId) ?? null;
  $: orientationOnly = currentLayer?.orientationOnly ?? false;
  $: allMapPlacements = uniquePlacements(publication?.placements.filter((placement) => placement.mapSpaceId === mapSpaceId && placement.floorId === floorId) ?? []);
  $: itemContext = findItem(publication, itemKey);
  $: sourceSearchEntries = (itemContext?.sources ?? []).map((source) => ({ source, text: [source.label, source.kind, sectionText(source.sections)].join(' ').toLocaleLowerCase() }));
  $: sourceNeedle = itemSourceQuery.trim().toLocaleLowerCase();
  $: filteredItemSources = sourceSearchEntries.filter((entry) => !sourceNeedle || entry.text.includes(sourceNeedle)).map((entry) => entry.source);
  $: itemPlacementIds = new Set(itemContext?.sources.flatMap((source) => source.placementIds) ?? []);
  $: entityByKey = new Map(publication?.entities.map((entity) => [entity.entityKey, entity]) ?? []);
  $: selectedEntity = selectedEntityKey ? entityByKey.get(selectedEntityKey) ?? null : null;
  $: selectedItemEntity = itemKey ? entityByKey.get(itemKey) ?? null : null;
  $: entitySearchEntries = (publication?.entities ?? []).filter((entity) => entity.kind !== 'items').map((entity) => ({ entity, text: [entity.entityKey, entity.name, entity.kind, entity.description ?? ''].join(' ').toLocaleLowerCase() }));
  $: itemSearchEntries = (publication?.itemSources ?? []).map((item) => ({ item, text: [item.itemKey, entityByKey.get(item.itemKey)?.name ?? '', ...item.sources.flatMap((source) => [source.label, source.kind, sectionText(source.sections)])].join(' ').toLocaleLowerCase() }));
  $: placementSearchText = new Map((publication?.placements ?? []).map((placement) => [placement.placementId, [placement.label, ...placement.roles, sectionText(placement.sections), ...placement.entityKeys.flatMap((key) => { const entity = entityByKey.get(key); return entity ? [entity.name, entity.kind, entity.description ?? ''] : []; })].join(' ').toLocaleLowerCase()]));
  $: searchNeedle = query.trim().toLocaleLowerCase();
  $: matchingEntities = searchNeedle ? entitySearchEntries.filter((entry) => entry.text.includes(searchNeedle)).map((entry) => entry.entity) : [];
  $: matchingItems = searchNeedle ? itemSearchEntries.filter((entry) => entry.text.includes(searchNeedle)).map((entry) => entry.item) : [];
  $: querySourcePlacementIds = new Set(matchingItems.flatMap((item) => item.sources.flatMap((source) => source.placementIds)));
  $: roleCounts = getRoleCounts(allMapPlacements);
  $: roleFilters = [...new Set([...ROLE_ORDER, ...allMapPlacements.flatMap((placement) => placement.roles)])];
  $: matchingPlacements = allMapPlacements.filter((placement) => (!itemKey || itemPlacementIds.has(placement.placementId)) && (roles.length === 0 || roles.some((role) => placement.roles.includes(role))) && (!searchNeedle || placementSearchText.get(placement.placementId)?.includes(searchNeedle) || querySourcePlacementIds.has(placement.placementId)));
  $: if (selectedId && !allMapPlacements.some((placement) => placement.placementId === selectedId) && !staleSelection) {
    const selected = publication?.placements.find((placement) => placement.placementId === selectedId);
    if (selected) staleSelection = `Selected location “${selected.label}” is outside the current map or floor.`;
  }
  $: viewportPlacements = matchingPlacements.filter((placement) => inViewport(placement, viewportBounds));
  $: selectedPlacement = publication?.placements.find((placement) => placement.placementId === selectedId) ?? null;
  $: hoveredPlacement = publication?.placements.find((placement) => placement.placementId === hoveredId) ?? null;
  $: selectedEntities = selectedPlacement ? selectedPlacement.entityKeys.map((key) => entityByKey.get(key)).filter((entity): entity is PublicEntity => Boolean(entity)) : [];
  $: resultPlacements = viewportBounds ? viewportPlacements : matchingPlacements;
  $: rankedResults = rankResults(searchNeedle, matchingItems, matchingEntities, resultPlacements, entityByKey);
  $: filteredDetail = selectedPlacement ? filteredSections(selectedPlacement.sections, detailQuery) : [];
  $: extraSelection = selectedPlacement && !staleSelection && !orientationOnly && !matchingPlacements.some((placement) => placement.placementId === selectedId) ? selectedPlacement : null;
  $: adapterPlacements = extraSelection ? [...matchingPlacements, extraSelection] : matchingPlacements;

  onMount(() => {
    let disposed = false;
    const metadataRequest = new AbortController();
    const onPopState = () => applyUrlState(readMapUrl(window.location.search), false);
    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented && detailsPanel?.isConnected) {
        event.preventDefault();
        void closeDetails();
      }
    };
    window.addEventListener('popstate', onPopState);
    window.addEventListener('keydown', onKeydown);
    applyUrlState(readMapUrl(window.location.search), false);
    const publicationUrl = new URL(`${base}/data/publication.json`, window.location.href).toString();
    fetch(publicationUrl, { signal: metadataRequest.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Publication request failed (${response.status})`);
        const json = (await response.json()) as PublicationData;
        if (json.schemaVersion !== 'compendium.publication.v1') throw new Error('Unsupported publication schema.');
        return resolvePublicationAssets(json, publicationUrl);
      })
      .then(async (data) => {
        if (disposed) return;
        publication = data;
        applyUrlState(readMapUrl(window.location.search), false);
        const map = publication.maps.find((candidate) => candidate.mapSpaceId === mapSpaceId) ?? publication.maps[0];
        if (!map) throw new Error('Publication has no map spaces.');
        mapSpaceId = map.mapSpaceId;
        if (floorId !== null && !map.floors.some((floor) => floor.floorId === floorId)) floorId = map.floors[0]?.floorId ?? null;
        loading = false;
        await tick();
        if (disposed) return;
        view = readMapUrl(window.location.search).view ?? centerView(map);
        const module = await import('./map-adapter');
        if (disposed) return;
        adapter = await module.createMapAdapter(canvas, {
          onViewChange(nextView, bounds) {
            view = nextView;
            viewportBounds = bounds;
            scheduleViewUrl();
          },
          onSelect(placementId) {
            selectPlacement(placementId, canvas);
          },
          onHover(placementId) {
            hoveredId = placementId;
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

  $: if (adapterReady && adapter && publication && activeMap) {
    adapter.update({ data: publication, mapSpaceId, floorId, layerId, placements: adapterPlacements, selectedId, view });
  }

  function centerView(map: PublicationData['maps'][number]): MapViewState {
    const x = (map.bounds.min.x + map.bounds.max.x) / 2;
    const y = (map.bounds.min.y + map.bounds.max.y) / 2;
    const scale = Math.min((canvas?.clientWidth || 640) / (map.bounds.max.x - map.bounds.min.x), (canvas?.clientHeight || 480) / (map.bounds.max.y - map.bounds.min.y));
    return { target: [x, y, 0], zoom: Math.log2(scale * 0.9) };
  }

  function getLayerOptions(data: PublicationData | null, mapId: string, floor: string | null): LayerOption[] {
    if (!data) return [];
    const options: LayerOption[] = data.tileLayers.filter((layer) => layer.mapSpaceId === mapId && layer.floorId === floor).map((layer): LayerOption => ({ id: layer.id, label: 'Captured screenshots', kind: 'screenshot', orientationOnly: false }));
    options.push(...data.illustrations.filter((illustration) => illustration.mapSpaceId === mapId && illustration.floorId === floor).map((illustration): LayerOption => ({ id: illustration.id, label: `${illustration.label}${illustration.registration === 'orientation-only' ? ' (orientation only)' : ''}`, kind: 'illustration', orientationOnly: illustration.registration === 'orientation-only' })));
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

  function getRoleCounts(placements: PublicPlacement[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const placement of placements) for (const role of placement.roles) counts[role] = (counts[role] ?? 0) + 1;
    return counts;
  }

  function rankResults(needle: string, items: PublicItemSource[], entities: PublicEntity[], placements: PublicPlacement[], names: ReadonlyMap<string, PublicEntity>): SearchResult[] {
    const rank = (name: string): number => {
      const text = name.toLocaleLowerCase();
      return text === needle ? 0 : text.startsWith(needle) ? 1 : text.includes(needle) ? 2 : 3;
    };
    const results: SearchResult[] = [];
    for (const item of items) {
      const name = names.get(item.itemKey)?.name ?? item.itemKey;
      results.push({ kind: 'item', key: item.itemKey, name, rank: rank(name), item });
    }
    for (const entity of entities) results.push({ kind: 'entity', key: entity.entityKey, name: entity.name, rank: rank(entity.name), entity });
    for (const placement of placements) results.push({ kind: 'placement', key: placement.placementId, name: placement.label, rank: rank(placement.label), placement });
    return results.sort((a, b) => a.rank - b.rank || searchKindOrder[a.kind] - searchKindOrder[b.kind] || (a.name < b.name ? -1 : a.name > b.name ? 1 : a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  }

  function sectionText(sections: PublicDetailSection[]): string {
    return sections.flatMap((section) => [section.title, ...section.rows.flatMap((row) => [row.label, row.value])]).join(' ');
  }

  function inViewport(placement: PublicPlacement, bounds: [number, number, number, number] | null): boolean {
    if (!bounds) return true;
    return placement.position[0] >= bounds[0] && placement.position[0] <= bounds[2] && placement.position[1] >= bounds[1] && placement.position[1] <= bounds[3];
  }

  function applyUrlState(next: MapUrlState, explicit: boolean): void {
    itemSourceQuery = next.itemSourceQuery;
    detailQuery = next.detailQuery;
    if (!publication) {
      mapSpaceId = next.mapSpaceId ?? '';
      floorId = next.floorId;
      layerId = next.layerId ?? '';
      selectedId = next.selectedId;
      query = next.query;
      roles = next.roles;
      itemKey = next.itemKey;
      selectedEntityKey = next.entityKey;
      if (next.view) view = next.view;
      return;
    }
    const map = publication.maps.find((candidate) => candidate.mapSpaceId === next.mapSpaceId) ?? publication.maps[0];
    if (!map) return;
    mapSpaceId = map.mapSpaceId;
    floorId = next.floorId && map.floors.some((floor) => floor.floorId === next.floorId) ? next.floorId : map.floors[0]?.floorId ?? null;
    const options = getLayerOptions(publication, mapSpaceId, floorId);
    layerId = options.some((layer) => layer.id === next.layerId) ? next.layerId ?? options[0]?.id ?? '' : options[0]?.id ?? '';
    query = next.query;
    roles = next.roles;
    itemKey = next.itemKey && publication.itemSources.some((item) => item.itemKey === next.itemKey) ? next.itemKey : null;
    const selected = next.selectedId ? publication.placements.find((placement) => placement.placementId === next.selectedId) : null;
    if (next.selectedId && !selected) staleSelection = `This link refers to a location that is not in the loaded publication: ${next.selectedId}.`;
    else if (selected && (selected.mapSpaceId !== mapSpaceId || selected.floorId !== floorId)) staleSelection = `Selected location “${selected.label}” is not on this map or floor.`;
    else staleSelection = '';
    selectedId = selected && !staleSelection ? selected.placementId : null;
    selectedEntityKey = next.entityKey && publication.entities.some((entity) => entity.entityKey === next.entityKey) ? next.entityKey : null;
    if (selectedEntityKey) itemKey = null;
    else if (next.entityKey) staleSelection = `This link refers to an entity that is not in the loaded publication: ${next.entityKey}.`;
    if (next.itemKey && !itemKey && !selectedEntityKey) staleSelection = `This link refers to an item that is not in the loaded publication: ${next.itemKey}.`;
    if (next.view) view = next.view;
    else if (!explicit) view = centerView(map);
  }

  function currentUrl(): URL {
    return writeMapUrl(new URL(window.location.href), { mapSpaceId, floorId, layerId, selectedId, query, itemSourceQuery: itemKey ? itemSourceQuery : '', detailQuery: !itemKey && (selectedId || selectedEntityKey) ? detailQuery : '', roles, itemKey, entityKey: selectedEntityKey, view });
  }

  function syncUrl(mode: 'push' | 'replace'): void {
    window.history[mode === 'push' ? 'pushState' : 'replaceState']({}, '', currentUrl());
  }

  function scheduleViewUrl(): void {
    if (viewTimer) clearTimeout(viewTimer);
    viewTimer = setTimeout(() => syncUrl('replace'), 220);
  }

  function scheduleQueryUrl(): void {
    if (queryTimer) clearTimeout(queryTimer);
    queryTimer = setTimeout(() => syncUrl('replace'), 280);
  }

  function selectPlacement(placementId: string, origin: HTMLElement | HTMLCanvasElement | null = null): void {
    const placement = publication?.placements.find((candidate) => candidate.placementId === placementId);
    if (!placement) return;
    const zoom = !orientationOnly && placement.mapSpaceId === mapSpaceId && placement.floorId === floorId ? Math.max(view.zoom, 1) : 1;
    selectedId = placementId;
    selectedEntityKey = null;
    staleSelection = '';
    detailOrigin = origin;
    mapSpaceId = placement.mapSpaceId;
    floorId = placement.floorId;
    const options = getLayerOptions(publication, mapSpaceId, floorId);
    if (!options.some((option) => option.id === layerId) || orientationOnly) layerId = options.find((option) => option.kind === 'screenshot')?.id ?? options[0]?.id ?? '';
    view = { target: [placement.position[0], placement.position[1], 0], zoom };
    viewportBounds = null;
    syncUrl('push');
    void focusDetails();
  }

  async function focusDetails(): Promise<void> {
    await tick();
    detailsPanel?.querySelector<HTMLElement>('h2')?.focus();
  }

  function selectEntity(entity: PublicEntity, origin: HTMLElement | null = null): void {
    const item = findItem(publication, entity.entityKey);
    if (item) { selectItem(item, origin); return; }
    selectedEntityKey = entity.entityKey;
    selectedId = null;
    itemKey = null;
    staleSelection = '';
    detailQuery = '';
    detailOrigin = origin;
    syncUrl('push');
    void focusDetails();
  }

  function openEntity(key: string, origin: HTMLElement): void {
    const entity = entityByKey.get(key);
    if (entity) selectEntity(entity, origin);
  }

  function selectItem(item: PublicItemSource, origin: HTMLElement | null = null): void {
    itemKey = item.itemKey;
    selectedEntityKey = null;
    staleSelection = '';
    itemSourceQuery = '';
    query = '';
    selectedId = null;
    detailOrigin = origin;
    syncUrl('push');
    void focusDetails();
  }

  function openDestination(placement: PublicPlacement): void {
    const destination = placement.destination;
    if (!destination) return;
    const destinationMap = publication?.maps.find((map) => map.mapSpaceId === destination.mapSpaceId);
    if (!destinationMap) {
      staleSelection = `The destination map “${destination.mapSpaceId}” is not included in this publication.`;
      return;
    }
    if (destinationMap.floors.length > 0 && destination.floorId === null) {
      staleSelection = `The destination on “${destination.mapSpaceId}” has no verified floor.`;
      return;
    }
    mapSpaceId = destination.mapSpaceId;
    floorId = destination.floorId;
    const options = getLayerOptions(publication, mapSpaceId, floorId);
    const destinationLayer = options.find((option) => option.kind === 'screenshot') ?? options[0];
    layerId = destinationLayer?.id ?? '';
    selectedId = null;
    staleSelection = '';
    viewportBounds = null;
    if (destination.position && destinationLayer && !destinationLayer.orientationOnly) view = { target: [destination.position[0], destination.position[1], 0], zoom: 1 };
    syncUrl('push');
  }

  function chooseMap(nextMapId: string): void {
    const nextMap = publication?.maps.find((map) => map.mapSpaceId === nextMapId);
    if (!nextMap) return;
    mapSpaceId = nextMapId;
    floorId = nextMap.floors[0]?.floorId ?? null;
    layerId = getLayerOptions(publication, mapSpaceId, floorId)[0]?.id ?? '';
    selectedId = null;
    staleSelection = '';
    viewportBounds = null;
    view = centerView(nextMap);
    syncUrl('push');
  }

  function chooseFloor(nextFloorId: string): void {
    floorId = nextFloorId || null;
    const options = getLayerOptions(publication, mapSpaceId, floorId);
    layerId = options[0]?.id ?? '';
    selectedId = null;
    viewportBounds = null;
    const map = activeMap;
    if (map) view = centerView(map);
    syncUrl('push');
  }

  function chooseLayer(nextLayerId: string): void {
    layerId = nextLayerId;
    syncUrl('push');
  }

  function toggleRole(role: string): void {
    roles = roles.includes(role) ? roles.filter((value) => value !== role) : [...roles, role];
    syncUrl('push');
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
      {#if publication}<span>Build <strong>{publication.buildId}</strong></span><span class:complete={publication.coverage.complete} class="coverage">{publication.coverage.complete ? 'Complete coverage' : 'Preview · incomplete coverage'}</span>{/if}
    </div>
  </header>

  {#if loading}
    <main class="state-card" aria-live="polite"><div class="spinner" aria-hidden="true"></div><h1>Loading the published atlas</h1><p>Only the generated static publication is used. No game or extraction service is contacted.</p></main>
  {:else if loadError && !publication}
    <main class="state-card error" role="alert"><h1>Atlas unavailable</h1><p>{loadError}</p><p class="muted">The publication request failed. There is no fallback dataset.</p></main>
  {:else if publication}
    <main class="workspace" class:has-details={Boolean(selectedPlacement || selectedEntity || itemContext || staleSelection)}>
      <aside class="control-panel" aria-label="Atlas controls">
        <div class="control-section search-section"><label for="atlas-search">Search places, entities, and items</label><div class="search-row"><input id="atlas-search" bind:this={searchInput} value={query} on:input={(event) => { query = (event.currentTarget as HTMLInputElement).value; scheduleQueryUrl(); }} on:keydown={(event) => { if (event.key === 'Enter') { event.preventDefault(); submitSearch(); } }} placeholder="Try a name or item" autocomplete="off" /><button class="quiet-button" type="button" on:click={() => { query = ''; scheduleQueryUrl(); searchInput?.focus(); }} aria-label="Clear search">Clear</button></div><p class="hint">Press Enter to move from search to results.</p></div>
        <div class="control-section"><label for="map-select">Map space</label><select id="map-select" value={mapSpaceId} on:change={(event) => chooseMap((event.currentTarget as HTMLSelectElement).value)}>{#each publication.maps as map}<option value={map.mapSpaceId}>{map.label}</option>{/each}</select></div>
        <div class="control-section"><label for="floor-select">Floor</label><select id="floor-select" value={floorId ?? ''} on:change={(event) => chooseFloor((event.currentTarget as HTMLSelectElement).value)}>{#if activeFloors.length === 0}<option value="">Outdoor / base map</option>{:else}{#each activeFloors as floor}<option value={floor.floorId}>{floor.label}</option>{/each}{/if}</select></div>
        <div class="control-section"><label for="layer-select">Map layer</label><select id="layer-select" value={layerId} on:change={(event) => chooseLayer((event.currentTarget as HTMLSelectElement).value)}>{#each layerOptions as layer}<option value={layer.id}>{layer.label}</option>{/each}</select>{#if orientationOnly}<p class="notice">Orientation only. Marker navigation is disabled until a screenshot layer is selected.</p>{/if}</div>
        <div class="control-section roles"><div class="section-heading"><h2>Categories</h2><span class="count">{allMapPlacements.length}</span></div>{#each roleFilters.filter((role) => roleCounts[role] || roles.includes(role)) as role}<label class="role-option"><input type="checkbox" checked={roles.includes(role)} on:change={() => toggleRole(role)} /><span class="role-symbol" style:background={`rgb(${ROLE_STYLES[role]?.color.join(',') ?? '95,95,95'})`} aria-hidden="true">{ROLE_STYLES[role]?.symbol ?? 'P'}</span><span>{roleLabel(role)}<small>{ROLE_STYLES[role]?.hint ?? 'Other authored placement role'}</small></span><strong>{roleCounts[role] ?? 0}</strong></label>{/each}{#if roles.length > 0}<button type="button" class="text-button" on:click={() => { roles = []; syncUrl('push'); }}>Clear category filters</button>{/if}</div>
        {#if !publication.coverage.complete}<div class="coverage-card"><strong>Research preview</strong><p>This artifact is not a complete release. Missing coverage is not the same as an absent location.</p>{#each publication.coverage.messages as message}<p class="coverage-message">{message}</p>{/each}<span>{publication.coverage.excludedPlacements} excluded placements</span></div>{/if}
      </aside>

      <section class="map-column" aria-label="Interactive map">
        <div class="map-frame"><canvas bind:this={canvas} aria-label="Afallon map. Use the result list for keyboard navigation."></canvas><div class="map-controls"><button type="button" aria-label="Zoom in" on:click={() => { view = { ...view, zoom: Math.min(12, view.zoom + 0.5) }; syncUrl('replace'); }}>+</button><button type="button" aria-label="Zoom out" on:click={() => { view = { ...view, zoom: Math.max(-12, view.zoom - 0.5) }; syncUrl('replace'); }}>−</button><button type="button" disabled={orientationOnly} on:click={() => { if (activeMap) { view = centerView(activeMap); syncUrl('replace'); } }}>Fit map</button></div>{#if hoveredPlacement && hoveredId !== selectedId}<div class="hover-preview"><strong>{hoveredPlacement.label}</strong><span>{hoveredPlacement.roles.map(roleLabel).join(' · ') || 'Published placement'}</span></div>{/if}<div class="map-status" aria-live="polite">{matchingPlacements.length} matching placements · {resultPlacements.length} in viewport{#if extraSelection}{' · selected location also shown'}{/if}{#if orientationOnly}{' · orientation layer'}{/if}</div></div>
        {#if loadError && publication}<div class="inline-error" role="alert">{loadError}</div>{/if}
        <section class="results" aria-labelledby="results-heading" bind:this={resultList}>
          <div class="results-header">
            <div><h2 id="results-heading">Results</h2><p>{resultPlacements.length} distinct placements{#if viewportBounds}{' in the current viewport'}{/if}{#if matchingItems.length > 0}{' · '}{matchingItems.length} items{/if}{#if matchingEntities.length > 0}{' · '}{matchingEntities.length} entity definitions{/if}</p></div>
            {#if itemContext}<button class="quiet-button" type="button" on:click={() => { itemKey = null; syncUrl('push'); }}>Exit item context</button>{/if}
          </div>
          {#if resultPlacements.length === 0 && matchingItems.length === 0 && matchingEntities.length === 0}
            <p class="empty">No published places, entities, or items match this search.</p>
          {:else}
            <ol class="result-list">
              {#each rankedResults as result (result.key)}
              {#if result.kind === 'item'}
                {@const item = result.item}
                <li><button data-result type="button" class:selected-result={item.itemKey === itemKey} on:click={(event) => selectItem(item, event.currentTarget)}><span class="result-marker item-marker" aria-hidden="true"></span><span class="result-copy"><strong>{entityByKey.get(item.itemKey)?.name ?? item.itemKey}</strong><small>Item · {item.sources.length} known sources</small></span></button></li>
              {:else if result.kind === 'entity'}
                {@const entity = result.entity}
                <li><button data-result type="button" class:selected-result={entity.entityKey === selectedEntityKey} on:click={(event) => selectEntity(entity, event.currentTarget)}><span class="result-marker entity-marker" aria-hidden="true"></span><span class="result-copy"><strong>{entity.name}</strong><small>{entity.kind} · {entity.placementIds.length} mapped placements</small></span></button></li>
              {:else}
                {@const placement = result.placement}
                <li><button data-result type="button" class:selected-result={placement.placementId === selectedId} on:click={(event) => selectPlacement(placement.placementId, event.currentTarget)} on:mouseenter={() => hoveredId = placement.placementId} on:mouseleave={() => hoveredId = null}><span class="result-marker" aria-hidden="true"></span><span class="result-copy"><strong>{placement.label}</strong><small>{placement.roles.map(roleLabel).join(' · ')}</small></span><span class="result-coords">{placement.position[0].toFixed(0)}, {placement.position[1].toFixed(0)}</span></button></li>
              {/if}
              {/each}
            </ol>
          {/if}
        </section>
      </section>

      {#if selectedPlacement || selectedEntity || itemContext || staleSelection}
        <aside class="details-panel" bind:this={detailsPanel} aria-label="Selected details">
          <div class="details-header">
            <div>
              <span class="eyebrow">{itemContext ? 'Item sources' : selectedEntity ? 'Entity details' : 'Selected location'}</span>
              <h2 tabindex="-1">{itemContext ? selectedItemEntity?.name ?? itemContext.itemKey : selectedEntity?.name ?? selectedPlacement?.label ?? 'Unavailable selection'}</h2>
            </div>
            <button class="close-button" type="button" on:click={closeDetails} aria-label="Close details">Close</button>
          </div>
          {#if staleSelection}
            <div class="stale-warning" role="alert"><strong>Stale selection</strong><p>{staleSelection}</p><button type="button" class="text-button" on:click={closeDetails}>Show available content</button></div>
          {/if}
          {#if itemContext}
            {#if selectedItemEntity}
              {#if selectedItemEntity.description}<p>{selectedItemEntity.description}</p>{/if}
              <details class="entity-block">
                <summary>Item properties and relationships</summary>
                <DetailSections sections={selectedItemEntity.sections} entities={entityByKey} onEntity={openEntity} onPlacement={selectPlacement} />
              </details>
            {/if}
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
          {:else if selectedEntity}
            <p class="roles-line">{selectedEntity.kind} · {selectedEntity.entityKey}</p>
            {#if selectedEntity.description}<p>{selectedEntity.description}</p>{/if}
            <label class="detail-search" for="detail-search">Search this entity's details<input id="detail-search" bind:value={detailQuery} on:input={scheduleQueryUrl} placeholder="Condition, reward, requirement" /></label>
            {#if selectedEntity.placementIds.length === 0}<p class="notice">This definition has no mapped placements in this preview.</p>{/if}
            {#each selectedEntity.placementIds as placementId}
              <button type="button" class="source-location" on:click={(event) => selectPlacement(placementId, event.currentTarget)}>Open location details</button>
            {/each}
            <DetailSections sections={filteredSections(selectedEntity.sections, detailQuery)} entities={entityByKey} onEntity={openEntity} onPlacement={selectPlacement} />
          {:else if selectedPlacement}
            <label class="detail-search" for="detail-search">Search this location's details<input id="detail-search" bind:value={detailQuery} on:input={scheduleQueryUrl} placeholder="Condition, reward, requirement" /></label>
            <div class="location-summary">
              <p class="roles-line">{selectedPlacement.roles.map(roleLabel).join(' · ')}</p>
              <p class="coordinates">Map coordinates {selectedPlacement.position[0].toFixed(2)}, {selectedPlacement.position[1].toFixed(2)}</p>
              {#if orientationOnly}<p class="notice">This orientation-only layer cannot provide precise marker navigation.</p>{/if}
            </div>
            {#each selectedEntities as entity}
              <article class="entity-block"><div class="entity-heading"><span>{entity.kind}</span><h3>{entity.name}</h3></div>{#if entity.description}<p>{entity.description}</p>{/if}<button type="button" class="inline-link" on:click={(event) => selectEntity(entity, event.currentTarget)}>Open entity details</button></article>
            {/each}
            <DetailSections sections={filteredDetail} entities={entityByKey} onEntity={openEntity} onPlacement={selectPlacement} />
            {#if selectedPlacement.destination}<button class="destination-button" type="button" on:click={() => openDestination(selectedPlacement)}>Open destination map</button>{/if}
            {#if entityLinks(selectedPlacement.sections).length > 0}
              <div class="linked-locations"><h3>Linked locations</h3>{#each entityLinks(selectedPlacement.sections) as link}<button class="inline-link" type="button" on:click={(event) => selectPlacement(link.placementId, event.currentTarget)}>{link.label}</button>{/each}</div>
            {/if}
          {/if}
        </aside>
      {/if}
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
  .build-meta strong { color: #e9e4d9; font-weight: 600; }
  .coverage { padding: .25rem .45rem; border: 1px solid #896c47; color: #e4b77c; }
  .coverage.complete { border-color: #657d64; color: #a9c1a2; }
  .workspace { display: grid; grid-template-columns: 248px minmax(360px, 1fr); height: calc(100dvh - 64px); min-height: 0; }
  .workspace.has-details { grid-template-columns: 248px minmax(360px, 1fr) minmax(300px, 380px); }
  .control-panel, .details-panel { background: #202120; overflow: auto; }
  .control-panel { border-right: 1px solid #393a38; padding: 1rem .85rem; }
  .details-panel { border-left: 1px solid #393a38; padding: 1rem; }
  .control-section { border-bottom: 1px solid #393a38; padding: 0 0 1rem; margin-bottom: 1rem; }
  label, .section-heading h2, .results-header h2 { font-size: .7rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #b8b5aa; }
  input, select { width: 100%; border: 1px solid #4a4b47; border-radius: 2px; background: #151616; color: #ece8de; padding: .55rem .6rem; }
  input:focus-visible, select:focus-visible, button:focus-visible { outline: 2px solid #d5b978; outline-offset: 2px; }
  .search-section > label, .control-section > label:not(.role-option) { display: block; margin-bottom: .45rem; }
  .search-row { display: flex; gap: .35rem; }
  .search-row input { min-width: 0; }
  .quiet-button, .close-button { border: 1px solid #55564f; background: transparent; color: #c5c1b7; padding: .45rem .55rem; border-radius: 2px; }
  .quiet-button:hover, .close-button:hover { border-color: #bba779; color: #f1eadb; }
  .hint, .muted { color: #85857e; font-size: .72rem; line-height: 1.45; }
  .section-heading { display: flex; justify-content: space-between; align-items: center; margin-bottom: .45rem; }
  .section-heading h2 { margin: 0; }
  .count { color: #d6bd84; font-size: .75rem; }
  .role-option { display: grid; grid-template-columns: 17px 17px minmax(0,1fr) auto; align-items: start; gap: .4rem; margin: .55rem 0; letter-spacing: normal; text-transform: none; color: #dedbd2; font-size: .78rem; cursor: pointer; }
  .role-option input { width: 14px; height: 14px; margin: 1px 0 0; accent-color: #bca36e; }
  .role-symbol, .result-marker { display: inline-block; width: 8px; height: 8px; margin-top: .25rem; border: 1px solid #d3b87c; background: #d3b87c; }
  .role-symbol { display: grid; place-items: center; width: 17px; height: 17px; margin-top: 0; border-radius: 50%; border-color: #888; color: white; font-size: 10px; }
  .role-option small { display: block; margin-top: .15rem; color: #85857e; font-size: .67rem; line-height: 1.25; }
  .role-option strong { color: #aaa9a0; font-size: .72rem; font-weight: 500; }
  .text-button, .inline-link { border: 0; padding: 0; background: none; color: #d5b978; text-decoration: underline; text-underline-offset: 2px; }
  .text-button { font-size: .75rem; }
  .notice, .stale-warning { padding: .55rem; border-left: 2px solid #b98751; background: #2b2721; color: #e2c399; font-size: .73rem; line-height: 1.45; }
  .coverage-card { margin-top: .9rem; padding: .7rem; border: 1px solid #66523b; background: #28241f; color: #d2bd9a; font-size: .72rem; line-height: 1.4; }
  .coverage-card strong { color: #ebd1a2; }
  .coverage-card p { margin: .35rem 0; }
  .coverage-card > span { color: #ab9678; }
  .coverage-message { color: #c3b39c; }
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
  .result-list { list-style: none; margin: .7rem 0 0; padding: 0; display: grid; gap: .3rem; }
  .result-list button { display: grid; grid-template-columns: 10px minmax(0,1fr) auto; align-items: center; gap: .55rem; width: 100%; padding: .55rem .5rem; border: 1px solid #383a36; background: #1c1e1d; color: #e9e4d9; text-align: left; }
  .result-list button:hover, .result-list button.selected-result { border-color: #a78b59; background: #25251f; }
  .result-marker { border-radius: 50%; }
  .entity-marker { border-radius: 0; background: transparent; }
  .item-marker { border-radius: 0; transform: rotate(45deg); background: transparent; }
  .result-copy strong, .result-copy small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .result-copy strong { font-size: .78rem; font-weight: 600; }
  .result-copy small { margin-top: .15rem; color: #aaa89d; font-size: .67rem; }
  .result-coords { color: #898a83; font-size: .65rem; white-space: nowrap; }
  .empty { color: #98978e; font-size: .78rem; }
  .eyebrow { color: #bca36e; font-size: .64rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; }
  .details-header { padding-bottom: .9rem; border-bottom: 1px solid #393a38; }
  .details-header h2 { margin-top: .25rem; line-height: 1.25; }
  .close-button { font-size: .7rem; }
  .stale-warning { margin: .8rem 0; }
  .stale-warning p { margin: .35rem 0; }
  .detail-search { display: block; margin: .8rem 0; }
  .detail-search input { margin-top: .4rem; }
  .roles-line { margin: .8rem 0 .25rem; color: #d4bc86; font-size: .77rem; }
  .coordinates { margin: 0 0 .8rem; color: #8e8e87; font-size: .7rem; }
  .entity-heading h3, .linked-locations h3 { margin: 0 0 .4rem; color: #d7d2c6; font-size: .75rem; letter-spacing: .04em; }
  .source-card, .entity-block { padding: .65rem; margin: .65rem 0; border: 1px solid #3a3b37; background: #1b1c1b; }
  .source-title strong { font-size: .8rem; }
  .source-title span, .entity-heading span { color: #aaa89d; font-size: .68rem; }
  .source-location, .destination-button { width: 100%; margin-top: .5rem; padding: .5rem; border: 1px solid #806d4a; background: #2a261e; color: #e4ce99; font-size: .72rem; text-align: center; }
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
    .workspace, .workspace.has-details { grid-template-columns: 220px minmax(0, 1fr); }
    .workspace.has-details { grid-template-rows: minmax(0, 1fr) minmax(0, 45%); }
    .workspace.has-details .control-panel { grid-row: 1 / -1; }
    .workspace.has-details .map-column { grid-column: 2; }
    .map-column { grid-template-rows: minmax(0, 3fr) minmax(0, 1fr); }
    .details-panel { grid-column: 2; min-height: 0; border-top: 1px solid #706548; }
  }
  @media (max-width: 680px) {
    .atlas-shell { height: 100dvh; min-height: 0; display: flex; flex-direction: column; }
    .topbar { align-items: flex-start; flex-direction: column; flex-shrink: 0; }
    .build-meta { justify-content: flex-start; }
    .workspace, .workspace.has-details { grid-template-columns: minmax(0, 1fr); grid-template-rows: minmax(0, 26dvh) minmax(0, 1fr); height: auto; flex: 1; }
    .workspace.has-details { grid-template-rows: minmax(0, 12dvh) minmax(0, 1fr) minmax(0, 45dvh); }
    .control-panel { border-right: 0; border-bottom: 1px solid #393a38; min-height: 0; }
    .workspace.has-details .control-panel { grid-row: auto; }
    .workspace.has-details .map-column, .details-panel { grid-column: 1; }
    .details-panel { border-left: 0; }
    .result-coords { display: none; }
    .state-card { margin: 2rem .8rem; padding: 1.2rem; }
  }
</style>
