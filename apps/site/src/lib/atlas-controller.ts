import type { PublicEntity, PublicItemSource, PublicationData, StaticCoverage, StaticGeometry, StaticRootManifest } from '@afallon/contracts/public';
import { AtlasDataLoader, atlasPublicationData, type AtlasIndexes, type AtlasMapData, type AtlasRequestState } from './atlas-data';
import { DEFAULT_ATLAS_STATE, transitionAtlasState, type AtlasAction, type AtlasState, type AtlasView } from './atlas-state';
import { buildSearchIndexes, emptySearchIndexes, selectionHighlightIds, type SearchIndexes } from './atlas-search';
import { resolveLayerIds } from './map/layer-policy';

export interface AtlasSnapshot {
  state: AtlasState;
  publication: PublicationData | null;
  indexes: SearchIndexes;
  map: AtlasRequestState;
  search: AtlasRequestState;
  detail: AtlasRequestState;
  geometry: AtlasRequestState;
  entityDetails: ReadonlyMap<string, PublicEntity>;
  itemDetails: ReadonlyMap<string, PublicItemSource>;
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
  #geometryStates = new Map<string, AtlasRequestState>();
  #hoveredIds: readonly string[] = [];
  #selectionGeneration = 0;
  #selectionKey = '';
  #disposed = false;
  #snapshot: AtlasSnapshot = {
    state: DEFAULT_ATLAS_STATE, publication: null, indexes: emptySearchIndexes(),
    map: { status: 'idle' }, search: { status: 'idle' }, detail: { status: 'idle' }, geometry: { status: 'idle' },
    entityDetails: new Map(), itemDetails: new Map(), staleSelection: '',
  };

  constructor(loader: AtlasDataLoader, options: AtlasControllerOptions) { this.#loader = loader; this.#options = options; }
  get snapshot(): AtlasSnapshot { return this.#snapshot; }

  start(state: AtlasState): void {
    this.navigate(state);
    void this.#loadMap();
    void this.#loadSearch();
  }

  navigate(state: AtlasState): void {
    this.dispatch({ type: 'replace', state });
    this.#options.onRestoreView(state.view);
  }

  dispatch(action: AtlasAction, mode?: 'push' | 'replace'): void {
    let state = transitionAtlasState(this.#snapshot.state, action);
    if (this.#base) state = { ...state, layerIds: resolveLayerIds(state.layerIds, this.#base.tileLayers) };
    this.#snapshot = { ...this.#snapshot, state };
    this.#selectionEffects();
    this.#geometryEffects();
    this.#emit();
    if (mode) this.#options.onNavigate(this.#snapshot.state, mode);
  }

  hover(placementIds: readonly string[]): void {
    this.#hoveredIds = placementIds;
    this.#geometryEffects();
  }

  retry(feature: 'map' | 'search' | 'detail' | 'geometry'): void {
    this.#loader.retryFailed();
    if (feature === 'map') void this.#loadMap();
    if (feature === 'search') void this.#loadSearch();
    if (feature === 'detail') { this.#selectionKey = ''; this.#selectionEffects(); }
    if (feature === 'geometry') {
      for (const [id, state] of this.#geometryStates) if (state.status === 'error') this.#geometryStates.delete(id);
      this.#geometryEffects();
    }
  }

  dispose(): void { this.#disposed = true; this.#selectionGeneration++; }

  async #loadMap(): Promise<void> {
    if (this.#snapshot.map.status === 'loading' || this.#snapshot.map.status === 'loaded') return;
    this.#snapshot = { ...this.#snapshot, map: { status: 'loading' } };
    this.#emit();
    try {
      const [root, maps, coverage] = await Promise.all([this.#loader.loadRoot(), this.#loader.loadMaps(), this.#loader.loadCoverage()]);
      if (this.#disposed) return;
      this.#root = root; this.#maps = maps; this.#coverage = coverage;
      this.#base = atlasPublicationData(root, maps, coverage, this.#search);
      this.#snapshot = { ...this.#snapshot, map: { status: 'loaded' }, state: { ...this.#snapshot.state, layerIds: resolveLayerIds(this.#snapshot.state.layerIds, this.#base.tileLayers) } };
      this.#compose();
      this.#selectionKey = '';
      this.#selectionEffects();
      this.#geometryEffects();
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
      this.#search = await this.#loader.loadIndexes();
      if (this.#disposed) return;
      this.#snapshot = { ...this.#snapshot, search: { status: 'loaded' } };
      if (this.#base && this.#root && this.#maps && this.#coverage) {
        const indexed = atlasPublicationData(this.#root, this.#maps, this.#coverage, this.#search);
        this.#base = { ...this.#base, entityIndex: indexed.entityIndex, itemIndex: indexed.itemIndex };
        this.#compose();
      }
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
    this.#snapshot = { ...this.#snapshot, publication, indexes: buildSearchIndexes(publication) };
  }

  #selectionEffects(): void {
    let { state } = this.#snapshot;
    const { indexes } = this.#snapshot;
    if (state.entityKey && state.itemKey && this.#search?.entitiesByKey.has(state.entityKey)) {
      state = { ...state, itemKey: null };
      this.#snapshot = { ...this.#snapshot, state };
    }
    const key = JSON.stringify([state.selectedPlacementId, state.entityKey, state.itemKey]);
    if (key === this.#selectionKey) return;
    this.#selectionKey = key;
    const generation = ++this.#selectionGeneration;
    let staleSelection = '';
    const placement = state.selectedPlacementId ? indexes.placementsById.get(state.selectedPlacementId) : undefined;
    if (state.selectedPlacementId && this.#base && !placement) staleSelection = 'This link refers to a location that is not in the loaded publication.';
    if (this.#search && state.entityKey && !this.#search.entitiesByKey.has(state.entityKey)) staleSelection = `This link refers to an entity that is not in the loaded publication: ${state.entityKey}.`;
    if (this.#search && state.itemKey && !this.#search.itemsByKey.has(state.itemKey)) staleSelection = `This link refers to an item that is not in the loaded publication: ${state.itemKey}.`;
    const entityKeys = new Set(placement?.entityKeys ?? []);
    const itemKeys = new Set(placement?.itemKeys ?? []);
    if (state.entityKey) entityKeys.add(state.entityKey);
    if (state.itemKey) itemKeys.add(state.itemKey);
    this.#snapshot = { ...this.#snapshot, staleSelection, detail: { status: entityKeys.size || itemKeys.size ? 'loading' : 'idle' } };
    if (staleSelection || (!entityKeys.size && !itemKeys.size)) {
      this.#snapshot = { ...this.#snapshot, detail: { status: 'idle' } };
      return;
    }
    this.#emit();
    void (async () => {
      try {
        const search = await this.#loader.loadIndexes();
        if (state.itemKey && search.entitiesByKey.has(state.itemKey)) entityKeys.add(state.itemKey);
        const [entities, items] = await Promise.all([
          Promise.all([...entityKeys].map((entityKey) => this.#loader.loadEntity(entityKey))),
          Promise.all([...itemKeys].map((itemKey) => this.#loader.loadItemSource(itemKey))),
        ]);
        if (this.#disposed) return;
        this.#snapshot = {
          ...this.#snapshot,
          entityDetails: new Map([...this.#snapshot.entityDetails, ...entities.map(({ entity }) => [entity.entityKey, entity] as const)]),
          itemDetails: new Map([...this.#snapshot.itemDetails, ...items.map(({ itemSource }) => [itemSource.itemKey, itemSource] as const)]),
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

  #geometryEffects(): void {
    if (!this.#base) return;
    const { state, indexes } = this.#snapshot;
    const required = new Set<string>();
    if (state.showConnections || state.showMovement) this.#base.maps.forEach((map) => required.add(map.mapSpaceId));
    const selected = state.selectedPlacementId ? indexes.placementsById.get(state.selectedPlacementId) ?? null : null;
    const ids = [...this.#hoveredIds, ...selectionHighlightIds(selected, state.entityKey, state.itemKey, indexes)];
    if (selected) ids.push(selected.placementId);
    for (const id of ids) { const placement = indexes.placementsById.get(id); if (placement) required.add(placement.mapSpaceId); }
    for (const mapSpaceId of required) {
      if (this.#geometryStates.has(mapSpaceId)) continue;
      this.#geometryStates.set(mapSpaceId, { status: 'loading' });
      void this.#loader.loadGeometry(mapSpaceId).then((parts) => {
        if (this.#disposed) return;
        const known = new Set(this.#base!.placements.filter((placement) => placement.mapSpaceId === mapSpaceId).map((placement) => placement.placementId));
        for (const part of parts) for (const placement of part.placements) if (!known.delete(placement.placementId)) throw new Error(`Geometry has an unknown or duplicate placement ${placement.placementId}.`);
        this.#geometry.set(mapSpaceId, parts);
        this.#compose();
        this.#geometryStates.set(mapSpaceId, { status: 'loaded' });
      }).catch((error: unknown) => {
        if (!this.#disposed) this.#geometryStates.set(mapSpaceId, failed(error));
      }).finally(() => { if (!this.#disposed) this.#geometryEffects(); });
    }
    const states = [...required].map((id) => this.#geometryStates.get(id)!);
    const error = states.find((value) => value.status === 'error');
    const geometry: AtlasRequestState = error ?? { status: states.some((value) => value.status === 'loading') ? 'loading' : states.length ? 'loaded' : 'idle' };
    this.#snapshot = { ...this.#snapshot, geometry };
    this.#emit();
  }

  #emit(): void { if (!this.#disposed) this.#options.onChange(this.#snapshot); }
}
