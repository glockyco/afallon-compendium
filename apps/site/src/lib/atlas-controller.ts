import type { PublicDocument, PublicKindEntry, PublicationData, StaticCoverage, StaticGeometry, StaticRootManifest } from '@afallon/contracts/public';
import { AtlasDataLoader, atlasPublicationData, type AtlasIndexes, type AtlasMapData, type AtlasRequestState } from './atlas-data';
import { DEFAULT_ATLAS_STATE, transitionAtlasState, type AtlasAction, type AtlasQueryField, type AtlasState, type AtlasView } from './atlas-state';
import { buildSearchIndexes, emptySearchIndexes, type SearchIndexes } from './atlas-search';
import { resolveLayerIds } from './map/layer-policy';

export interface AtlasSnapshot {
  state: AtlasState;
  publication: PublicationData | null;
  indexes: SearchIndexes;
  registry: PublicKindEntry[];
  map: AtlasRequestState;
  search: AtlasRequestState;
  detail: AtlasRequestState;
  documents: ReadonlyMap<string, PublicDocument>;
  staleSelection: string;
}

export interface AtlasControllerOptions {
  onChange: (snapshot: AtlasSnapshot) => void;
  onNavigate: (state: AtlasState, mode: 'push' | 'replace') => void;
  onRestoreView: (view: AtlasView | null) => void;
}

const failed = (error: unknown): AtlasRequestState => ({ status: 'error', message: error instanceof Error ? error.message : String(error) });

export class AtlasController {
  readonly #loader: AtlasDataLoader;
  readonly #options: AtlasControllerOptions;
  #root: StaticRootManifest | null = null;
  #maps: AtlasMapData[] | null = null;
  #coverage: StaticCoverage | null = null;
  #search: AtlasIndexes | undefined;
  #base: PublicationData | null = null;
  #geometry = new Map<string, StaticGeometry[]>();
  #selectionGeneration = 0;
  #selectionKey = '';
  #disposed = false;
  #viewTimer: ReturnType<typeof setTimeout> | undefined;
  #queryTimer: ReturnType<typeof setTimeout> | undefined;
  #snapshot: AtlasSnapshot = {
    state: DEFAULT_ATLAS_STATE,
    publication: null,
    indexes: emptySearchIndexes(),
    registry: [],
    map: { status: 'idle' },
    search: { status: 'idle' },
    detail: { status: 'idle' },
    documents: new Map(),
    staleSelection: '',
  };

  constructor(loader: AtlasDataLoader, options: AtlasControllerOptions) { this.#loader = loader; this.#options = options; }
  get snapshot(): AtlasSnapshot { return this.#snapshot; }

  start(state: AtlasState): void {
    this.navigate(state);
    void this.#loadMap();
    void this.#loadSearch();
  }

  navigate(state: AtlasState): void {
    if (this.#disposed) return;
    this.#cancelPersistence();
    this.dispatch({ type: 'replace', state });
    this.#options.onRestoreView(this.#snapshot.state.view);
  }

  dispatch(action: AtlasAction, mode?: 'push' | 'replace'): void {
    if (this.#disposed) return;
    if (action.type === 'set-view') {
      clearTimeout(this.#viewTimer);
      this.#viewTimer = undefined;
    }
    let state = transitionAtlasState(this.#snapshot.state, action);
    if (this.#base && (action.type === 'select-layers' || action.type === 'replace')) {
      state = transitionAtlasState(state, { type: 'select-layers', layerIds: resolveLayerIds(state.layerIds, this.#base.tileLayers) });
    }
    this.#snapshot = { ...this.#snapshot, state };
    this.#selectionEffects();
    this.#emit();
    if (mode) this.#options.onNavigate(this.#snapshot.state, mode);
  }

  setQuery(field: AtlasQueryField, query: string): void {
    if (this.#disposed) return;
    this.dispatch({ type: 'search', field, query });
    clearTimeout(this.#queryTimer);
    this.#queryTimer = setTimeout(() => {
      this.#queryTimer = undefined;
      this.dispatch({ type: 'search', field, query: this.#snapshot.state[field] }, 'replace');
    }, 280);
  }

  scheduleView(view: AtlasView): void {
    if (this.#disposed) return;
    clearTimeout(this.#viewTimer);
    this.#viewTimer = setTimeout(() => {
      this.#viewTimer = undefined;
      this.dispatch({ type: 'set-view', view }, 'replace');
    }, 220);
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
      const [maps, coverage, geometry] = await Promise.all([
        this.#loader.loadMaps(),
        this.#loader.loadCoverage(),
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
      this.#coverage = coverage;
      this.#geometry = new Map(geometry);
      this.#base = atlasPublicationData(root, maps, coverage);
      this.#snapshot = {
        ...this.#snapshot,
        map: { status: 'loaded' },
        state: transitionAtlasState(this.#snapshot.state, { type: 'select-layers', layerIds: resolveLayerIds(this.#snapshot.state.layerIds, this.#base.tileLayers) }),
      };
      this.#compose();
      this.#selectionKey = '';
      this.#selectionEffects();
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
    this.#snapshot = { ...this.#snapshot, publication, indexes: buildSearchIndexes(publication, this.#search?.entries ?? []) };
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

    const entryKeys = new Set([...(placement?.entityKeys ?? []), ...(placement?.itemKeys ?? [])]);
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
        const documents = await Promise.all(entries.map((entry) => this.#loader.loadDocumentForRef(entry!.ref)));
        if (this.#disposed) return;
        this.#snapshot = {
          ...this.#snapshot,
          documents: new Map([...this.#snapshot.documents, ...documents.map((document) => [document.ref.key, document] as const)]),
          ...(generation === this.#selectionGeneration ? { detail: { status: 'loaded' as const } } : {}),
        };
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
