import type { PublicKindEntry, PublicationData, StaticDocument, StaticGeometry, StaticRootManifest } from '@afallon/contracts/public';
import { MapDataLoader, mapPublicationData, type MapIndexes, type LoadedMapData, type MapRequestState } from './map-data';
import { DEFAULT_MAP_STATE, transitionMapState, type MapAction, type MapQueryField, type MapState, type MapView } from './map-state';
import { buildSearchIndexes, emptySearchIndexes, type SearchIndexes } from './map-search';
import { resolveLayerIds } from './map/layer-policy';

export interface MapSnapshot {
  state: MapState;
  publication: PublicationData | null;
  indexes: SearchIndexes;
  registry: PublicKindEntry[];
  map: MapRequestState;
  search: MapRequestState;
  detail: MapRequestState;
  /** The loaded page documents of the selection, keyed by the entity key of each page. */
  documents: ReadonlyMap<string, StaticDocument>;
  staleSelection: string;
}

export interface MapControllerOptions {
  onChange: (snapshot: MapSnapshot) => void;
  onNavigate: (state: MapState, mode: 'push' | 'replace') => void;
  onRestoreView: (view: MapView | null) => void;
}

const failed = (error: unknown): MapRequestState => ({ status: 'error', message: error instanceof Error ? error.message : String(error) });

export class MapController {
  readonly #loader: MapDataLoader;
  readonly #options: MapControllerOptions;
  #root: StaticRootManifest | null = null;
  #maps: LoadedMapData[] | null = null;
  #search: MapIndexes | undefined;
  #base: PublicationData | null = null;
  #geometry = new Map<string, StaticGeometry[]>();
  #selectionGeneration = 0;
  #selectionKey = '';
  #disposed = false;
  #viewTimer: ReturnType<typeof setTimeout> | undefined;
  #queryTimer: ReturnType<typeof setTimeout> | undefined;
  #imageryBounds: readonly [number, number, number, number] | null = null;
  readonly #pendingImagery = new Set<string>();
  #snapshot: MapSnapshot = {
    state: DEFAULT_MAP_STATE,
    publication: null,
    indexes: emptySearchIndexes(),
    registry: [],
    map: { status: 'idle' },
    search: { status: 'idle' },
    detail: { status: 'idle' },
    documents: new Map(),
    staleSelection: '',
  };

  constructor(loader: MapDataLoader, options: MapControllerOptions) { this.#loader = loader; this.#options = options; }
  get snapshot(): MapSnapshot { return this.#snapshot; }

  start(state: MapState): void {
    this.navigate(state);
    void this.#loadMap();
  }

  /** Search data is independent of map readiness and is fetched only when needed. */
  ensureSearch(): void { void this.#loadSearch(); }

  navigate(state: MapState): void {
    if (this.#disposed) return;
    this.#cancelPersistence();
    this.dispatch({ type: 'replace', state });
    this.#options.onRestoreView(this.#snapshot.state.view);
  }

  dispatch(action: MapAction, mode?: 'push' | 'replace'): void {
    if (this.#disposed) return;
    if (action.type === 'set-view') {
      clearTimeout(this.#viewTimer);
      this.#viewTimer = undefined;
    }
    let state = transitionMapState(this.#snapshot.state, action);
    if (this.#base && (action.type === 'select-layers' || action.type === 'replace')) {
      state = transitionMapState(state, { type: 'select-layers', layerIds: resolveLayerIds(state.layerIds, this.#base.tileLayers) });
    }
    this.#snapshot = { ...this.#snapshot, state };
    if (state.query || state.itemSourceQuery || state.detailQuery || state.selectedPlacementId || state.entityKey || state.itemKey || state.placeKey) this.ensureSearch();
    this.#selectionEffects();
    this.#emit();
    if (mode) this.#options.onNavigate(this.#snapshot.state, mode);
  }

  setQuery(field: MapQueryField, query: string): void {
    if (this.#disposed) return;
    this.dispatch({ type: 'search', field, query });
    clearTimeout(this.#queryTimer);
    this.#queryTimer = setTimeout(() => {
      this.#queryTimer = undefined;
      this.dispatch({ type: 'search', field, query: this.#snapshot.state[field] }, 'replace');
    }, 280);
  }

  scheduleView(view: MapView): void {
    if (this.#disposed) return;
    clearTimeout(this.#viewTimer);
    this.#viewTimer = setTimeout(() => {
      this.#viewTimer = undefined;
      this.dispatch({ type: 'set-view', view }, 'replace');
    }, 220);
  }

  /** Fetch a map's imagery manifest only when its published bounds enter the live camera. */
  ensureImagery(bounds: readonly [number, number, number, number]): void {
    this.#imageryBounds = bounds;
    if (this.#disposed || !this.#root || !this.#maps) return;
    for (const map of this.#root.maps) {
      const { min, max } = map.bounds;
      if (min.x > bounds[2] || max.x < bounds[0] || min.y > bounds[3] || max.y < bounds[1]) continue;
      if (this.#maps.find((loaded) => loaded.mapSpaceId === map.mapSpaceId)?.imagery || this.#pendingImagery.has(map.mapSpaceId)) continue;
      this.#pendingImagery.add(map.mapSpaceId);
      void this.#loader.loadImagery(map.mapSpaceId).then((imagery) => {
        if (this.#disposed || !this.#maps || !this.#root) return;
        this.#maps = this.#maps.map((loaded) => loaded.mapSpaceId === map.mapSpaceId ? { ...loaded, imagery } : loaded);
        this.#base = mapPublicationData(this.#root, this.#maps);
        this.#compose();
        this.#emit();
      }, (error: unknown) => {
        if (!this.#disposed) {
          this.#snapshot = { ...this.#snapshot, map: failed(error) };
          this.#emit();
        }
      }).finally(() => this.#pendingImagery.delete(map.mapSpaceId));
    }
  }

  #cancelPersistence(): void {
    clearTimeout(this.#viewTimer);
    clearTimeout(this.#queryTimer);
    this.#viewTimer = undefined;
    this.#queryTimer = undefined;
  }

  retry(feature: 'map' | 'search' | 'detail'): void {
    this.#loader.retryFailed();
    if (feature === 'map') void this.#loadMap();
    if (feature === 'search') void this.#loadSearch();
    if (feature === 'detail') { this.#selectionKey = ''; this.#selectionEffects(); }
  }

  dispose(): void { this.#disposed = true; this.#selectionGeneration++; this.#cancelPersistence(); }

  async #loadMap(): Promise<void> {
    if (this.#snapshot.map.status === 'loading' || this.#snapshot.map.status === 'loaded') return;
    this.#snapshot = { ...this.#snapshot, map: { status: 'loading' } };
    this.#emit();
    try {
      const root = await this.#loader.loadRoot();
      const state = this.#snapshot.state;
      const customLayers = state.layerIds.some((id) => !['game-maps', 'captured', 'none'].includes(id));
      const zoom = state.view?.zoom;
      const scale = zoom === undefined ? 1 : 2 ** zoom;
      const bounds: readonly [number, number, number, number] | null = this.#imageryBounds ?? (state.view && !customLayers
        ? [state.view.target[0] - 720 / scale, state.view.target[1] - 450 / scale, state.view.target[0] + 720 / scale, state.view.target[1] + 450 / scale]
        : null);
      const visibleSpaces = bounds ? new Set(root.maps.filter(({ bounds: map }) => map.min.x <= bounds[2] && map.max.x >= bounds[0] && map.min.y <= bounds[3] && map.max.y >= bounds[1]).map(({ mapSpaceId }) => mapSpaceId)) : undefined;
      const [maps, geometry] = await Promise.all([
        this.#loader.loadMaps(visibleSpaces),
        Promise.all(root.maps.map(async ({ mapSpaceId }) => [mapSpaceId, await this.#loader.loadGeometry(mapSpaceId)] as const)),
      ]);
      if (this.#disposed) return;
      for (const [mapSpaceId, parts] of geometry) {
        const known = new Set(maps.find((map) => map.mapSpaceId === mapSpaceId)?.placements.map((placement) => placement.placementId) ?? []);
        for (const part of parts) for (const placement of part.placements) {
          if (!known.delete(placement.placementId)) throw new Error(`Geometry has an unknown or duplicate placement ${placement.placementId}.`);
        }
      }
      this.#root = root;
      this.#maps = maps;
      this.#geometry = new Map(geometry);
      this.#base = mapPublicationData(root, maps);
      this.#snapshot = {
        ...this.#snapshot,
        map: { status: 'loaded' },
        state: transitionMapState(this.#snapshot.state, { type: 'select-layers', layerIds: this.#snapshot.state.layerIds.length === 0 && this.#base.tileLayers.length === 0 && maps.some((map) => !map.imagery)
          ? ['game-maps'] : resolveLayerIds(this.#snapshot.state.layerIds, this.#base.tileLayers) }),
      };
      this.#compose();
      this.#selectionKey = '';
      this.#selectionEffects();
      if (this.#imageryBounds) this.ensureImagery(this.#imageryBounds);
    } catch (error) {
      if (!this.#disposed) this.#snapshot = { ...this.#snapshot, map: failed(error) };
    }
    this.#emit();
  }

  async #loadSearch(): Promise<void> {
    if (this.#snapshot.search.status === 'loading' || this.#snapshot.search.status === 'loaded') return;
    this.#snapshot = { ...this.#snapshot, search: { status: 'loading' } };
    this.#emit();
    try {
      const [search, registry] = await Promise.all([this.#loader.loadIndexes(), this.#loader.loadRegistry()]);
      this.#search = search;
      if (this.#disposed) return;
      this.#snapshot = { ...this.#snapshot, registry, search: { status: 'loaded' } };
      this.#compose();
      this.#selectionKey = '';
      this.#selectionEffects();
    } catch (error) {
      if (!this.#disposed) this.#snapshot = { ...this.#snapshot, search: failed(error) };
    }
    this.#emit();
  }

  #compose(): void {
    if (!this.#base) return;
    const geometry = new Map<string, StaticGeometry['placements'][number]>();
    for (const parts of this.#geometry.values()) for (const part of parts) for (const placement of part.placements) {
      if (geometry.has(placement.placementId)) throw new Error(`Duplicate geometry for ${placement.placementId}.`);
      geometry.set(placement.placementId, placement);
    }
    const publication = geometry.size === 0 ? this.#base : {
      ...this.#base,
      placements: this.#base.placements.map((placement) => {
        const extra = geometry.get(placement.placementId);
        return extra ? { ...placement, ...extra } : placement;
      }),
    };
    const nodeSpots = new Map([...this.#snapshot.documents.values()].flatMap((page) => page.kind === 'gatheringNodes'
      ? [[page.document.ref.key, page.document.places.flatMap((place) => place.placementIds)] as const] : []));
    this.#snapshot = { ...this.#snapshot, publication, indexes: buildSearchIndexes(publication, this.#search?.entries ?? [], nodeSpots) };
  }

  #selectionEffects(): void {
    let { state } = this.#snapshot;
    const { indexes } = this.#snapshot;
    if (state.entityKey && state.itemKey && this.#search?.entriesByKey.has(state.entityKey)) {
      state = { ...state, itemKey: null };
      this.#snapshot = { ...this.#snapshot, state };
    }
    const key = JSON.stringify([state.selectedPlacementId, state.entityKey, state.itemKey, state.placeKey]);
    if (key === this.#selectionKey) return;
    this.#selectionKey = key;
    const generation = ++this.#selectionGeneration;
    let staleSelection = '';
    const placement = state.selectedPlacementId ? indexes.placementsById.get(state.selectedPlacementId) : undefined;
    if (state.selectedPlacementId && this.#base && !placement) staleSelection = 'This link refers to a location that is not in the loaded publication.';
    if (this.#search && state.entityKey && !this.#search.entriesByKey.has(state.entityKey)) staleSelection = `This link refers to an entity that is not in the loaded publication: ${state.entityKey}.`;
    if (this.#search && state.itemKey && !this.#search.entriesByKey.has(state.itemKey)) staleSelection = `This link refers to an item that is not in the loaded publication: ${state.itemKey}.`;
    if (this.#search && state.placeKey && this.#search.entriesByKey.get(state.placeKey)?.ref.kind !== 'places') staleSelection = `This link refers to a place that is not in the loaded publication: ${state.placeKey}.`;

    const entryKeys = new Set(placement?.entityKeys ?? []);
    if (state.entityKey) entryKeys.add(state.entityKey);
    if (state.itemKey) entryKeys.add(state.itemKey);
    if (state.placeKey) entryKeys.add(state.placeKey);
    const entries = [...entryKeys].map((entryKey) => this.#search?.entriesByKey.get(entryKey)).filter((entry) => entry?.document && entry.ref.slug);
    this.#snapshot = { ...this.#snapshot, staleSelection, detail: { status: entries.length ? 'loading' : 'idle' } };
    if (staleSelection || entries.length === 0) {
      this.#snapshot = { ...this.#snapshot, detail: { status: 'idle' } };
      return;
    }
    this.#emit();
    void (async () => {
      try {
        const pages = await Promise.all(entries.map((entry) => this.#loader.loadPageForRef(entry!.ref)));
        if (this.#disposed) return;
        this.#snapshot = {
          ...this.#snapshot,
          documents: new Map([...this.#snapshot.documents, ...pages.map((page) => [page.document.ref.key, page] as const)]),
          ...(generation === this.#selectionGeneration ? { detail: { status: 'loaded' as const } } : {}),
        };
        this.#compose();
        this.#emit();
      } catch (error) {
        if (this.#disposed || generation !== this.#selectionGeneration) return;
        this.#snapshot = { ...this.#snapshot, detail: failed(error) };
        this.#emit();
      }
    })();
  }

  #emit(): void { if (!this.#disposed) this.#options.onChange(this.#snapshot); }
}
