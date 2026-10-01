import { expect, jest, test } from 'bun:test';
import type { PublicSearchEntry, StaticResourceReference, StaticRootManifest } from '@afallon/contracts/public';
import { MapDataLoader, type MapFetch } from './map-data';
import { MapController, type MapSnapshot } from './map-controller';
import { readMapUrl, type MapState, type MapView } from './map-state';
import { rankCompendiumEntries, selectionHighlightIds } from './map-search';

function fixture() {
  const identity = { buildId: 'build', catalogId: 'c'.repeat(64) };
  const bodies = new Map<string, string>();
  const register = (value: { schemaVersion: string; [key: string]: unknown }): StaticResourceReference => {
    const body = `${JSON.stringify(value)}\n`;
    const sha256 = new Bun.CryptoHasher('sha256').update(body).digest('hex');
    const path = `resources/${sha256}.json`;
    bodies.set(path, body);
    return { path, sha256, bytes: new TextEncoder().encode(body).length, schemaId: value.schemaVersion };
  };
  const refs = new Map<string, { key: string; kind: 'items'; name: string; slug: string }>();
  const documents = new Map<string, StaticResourceReference>();
  for (const name of ['a', 'b']) {
    const key = `item:${name}`;
    const ref = { key, kind: 'items' as const, name, slug: name };
    refs.set(key, ref);
    documents.set(key, register({
      schemaVersion: 'compendium.static-item.v12', ...identity, kind: 'items',
      document: {
        ref, description: null, art: {}, sourceSpotCount: 1, sourceAvailabilities: [],
        facts: { stats: [], randomStats: [], randomStatsMax: 0, sockets: [], stackLimit: 1, questDropOnly: false, corruptionToken: false, actionAbilities: [], useLines: [], equipmentRequirements: [], useConditions: [] },
        droppedBy: [], soldBy: [], buys: [], gatheredFrom: [], inContainers: [], collectedFrom: [], rewardedBy: [], givenBy: [], usedInRecipes: [], usedInQuests: [], startingGearOf: [], placedRules: [],
      },
    }));
  }
  const list = register({ schemaVersion: 'compendium.static-kind-list.v5', ...identity, kind: 'items', part: 0, rows: [...refs.values()].map((ref) => ({ ref, values: {}, facets: {} })) });
  const search = register({
    schemaVersion: 'compendium.static-search.v6', ...identity, part: 0,
    entries: [...refs].map(([key, ref]) => ({ ref, hasPlacements: true, sourceKinds: ['vendor'], document: documents.get(key) })),
  });
  const parts = ['a', 'b'].map((name, part) => register({ schemaVersion: 'compendium.static-map.v3', ...identity, mapSpaceId: 'map', part, placements: [[`place:${name}`, [part * 10, 0], 0, name, ['merchant'], [], [`item:${name}`], null, null, null, null]], regions: [] }));
  const imagery = register({ schemaVersion: 'compendium.static-imagery.v2', ...identity, mapSpaceId: 'map', defaultLayerId: 'game', layers: [{ id: 'game', mapSpaceId: 'map', label: 'Map', kind: 'game-map', tileSize: 256, minZoom: 0, maxZoom: 0, extent: [0, 0, 256, 256], tiles: [{ z: 0, x: 0, y: 0, url: `assets/${'d'.repeat(64)}.webp`, sha256: 'd'.repeat(64), bytes: 1, width: 256, height: 256, state: 'captured', schemaId: 'image/webp' }] }] });
  const coverage = register({ schemaVersion: 'compendium.static-coverage.v3', ...identity, pages: [{ kind: 'items', count: 1 }], mapCount: 1, placementCount: 1, gaps: [] });
  const exclusions = register({ schemaVersion: 'compendium.static-exclusions.v1', ...identity, exclusions: [] });
  const bounds = { min: { x: 0, y: 0 }, max: { x: 256, y: 256 } };
  const root: StaticRootManifest = {
    schemaVersion: 'compendium.static-root.v8', ...identity, mode: 'preview', complete: false,
    release: { version: '0.16.2.1', dataDate: '2026-09-28', patchNotes: { title: 'Afallon 0.16.2.1', url: 'https://store.steampowered.com/news/app/2597810/view/1844115010501029', date: '2026-09-21' } },
    world: { mapSpaceId: 'world', label: 'Afallon', bounds, offsets: [{ mapSpaceId: 'map', worldX: 0, worldY: 0, source: 'native', status: 'placed' }], unplacedMapSpaceIds: [] },
    maps: [{ mapSpaceId: 'map', label: 'Map', bounds, parts, optionalGeometry: [], imagery }],
    kinds: [{ kind: 'items', label: 'Item', plural: 'Items', route: 'items', icon: 'package', pages: true, list: true, searchable: true, columns: [], facets: [] }],
    lists: { items: [list] }, search: [search], coverage, exclusions,
  };
  bodies.set('publication.json', JSON.stringify(root));
  const counts = new Map<string, number>();
  const overrides = new Map<string, () => Promise<Response>>();
  const fetcher: MapFetch = async (input) => {
    const path = new URL(input instanceof Request ? input.url : input).pathname.replace(/^\/data\//, '');
    counts.set(path, (counts.get(path) ?? 0) + 1);
    const override = overrides.get(path);
    if (override) return override();
    const body = bodies.get(path);
    return body ? new Response(body) : new Response('missing', { status: 404 });
  };
  return { loader: new MapDataLoader(fetcher, 'https://map.invalid/data/'), bodies, counts, overrides, documents, search, root, identity, register };
}

function observe(loader: MapDataLoader) {
  let latest: MapSnapshot | null = null;
  const listeners = new Set<() => void>();
  const navigations: { state: MapState; mode: 'push' | 'replace' }[] = [];
  const restoredViews: (MapView | null)[] = [];
  const controller = new MapController(loader, {
    onChange(snapshot) { latest = snapshot; for (const notify of listeners) notify(); },
    onNavigate(state, mode) { navigations.push({ state, mode }); },
    onRestoreView(view) { restoredViews.push(view); },
  });
  const until = (condition: (snapshot: MapSnapshot) => boolean): Promise<MapSnapshot> => {
    const { promise, resolve } = Promise.withResolvers<MapSnapshot>();
    const notify = () => { if (latest && condition(latest)) { listeners.delete(notify); resolve(latest); } };
    listeners.add(notify);
    notify();
    return promise;
  };
  return { controller, until, navigations, restoredViews };
}

function responseGate() { return Promise.withResolvers<Response>(); }

test('search finds a craft by its recipe alias without requiring a recipe page', () => {
  const product: PublicSearchEntry = {
    ref: { key: 'items:1', kind: 'items', name: 'Bloodthrall Signet', slug: 'bloodthrall-signet' },
    aliases: ['Ring of Bleed Damage'], hasPlacements: false, sourceKinds: [],
  };
  const skill: PublicSearchEntry = {
    ref: { key: 'skills:1', kind: 'skills', name: 'Smithing', slug: 'smithing' },
    aliases: ['Demonic Bulwark Looted'], hasPlacements: false, sourceKinds: [],
  };
  expect(rankCompendiumEntries('ring of bleed damage', [product, skill])).toEqual([product]);
  expect(rankCompendiumEntries('demonic bulwark looted', [product, skill])).toEqual([skill]);
});

test('Recipes list rows resolve to item Crafting sections without recipe documents', async () => {
  const data = fixture();
  const ref = { key: 'item:a', kind: 'items' as const, name: 'Iron Bar recipe', slug: 'a', variant: 'crafting' };
  const recipeList = data.register({ schemaVersion: 'compendium.static-kind-list.v5', ...data.identity, kind: 'recipes', part: 0, rows: [{ ref, values: {}, facets: {} }] });
  data.root.lists.recipes = [recipeList];
  data.root.kinds.push({ kind: 'recipes', label: 'Recipe', plural: 'Recipes', route: 'recipes', icon: 'recipe', pages: false, list: true, searchable: false, columns: [], facets: [] });
  data.bodies.set('publication.json', JSON.stringify(data.root));
  const list = await data.loader.loadList('recipes');
  expect(list.rows[0]?.ref).toEqual(ref);
  expect((await data.loader.loadPageForRef(ref)).document.ref.key).toBe('item:a');
});

test('loads all geometry before first render and retries a failed geometry resource with the map', async () => {
  const data = fixture();
  const original = data.root.maps[0]!;
  const areaRadius = 4;
  const geometryReferences: StaticResourceReference[] = [];
  data.root.maps = ['a', 'b'].map((name, index) => {
    const mapSpaceId = `map:${name}`;
    const part = data.register({ schemaVersion: 'compendium.static-map.v3', ...data.identity, mapSpaceId, part: 0,
      placements: [[`place:${name}`, [index * 10, 0], 0, name, ['merchant'], ['item:a'], [`item:${name}`], null, null, areaRadius, null]], regions: [] });
    const geometry = data.register({ schemaVersion: 'compendium.static-geometry.v1', ...data.identity, mapSpaceId, part: 0,
      placements: [{ placementId: `place:${name}`, movement: [{ kind: 'roaming', owner: { kind: 'spawnerOverride' }, distance: 12, aroundSpawner: true, usePois: false }] }], connections: [] });
    geometryReferences.push(geometry);
    const imageryBody = JSON.parse(data.bodies.get(original.imagery.path)!);
    imageryBody.mapSpaceId = mapSpaceId;
    imageryBody.defaultLayerId = `game:${name}`;
    imageryBody.layers[0].mapSpaceId = mapSpaceId;
    imageryBody.layers[0].id = `game:${name}`;
    return { ...original, mapSpaceId, parts: [part], optionalGeometry: [geometry], imagery: data.register(imageryBody) };
  });
  data.root.world.offsets = data.root.maps.map(({ mapSpaceId }) => ({ mapSpaceId, worldX: 0, worldY: 0, source: 'native', status: 'placed' }));
  data.bodies.set('publication.json', JSON.stringify(data.root));
  const remoteGeometry = geometryReferences[1]!.path;
  data.overrides.set(remoteGeometry, async () => new Response('unavailable', { status: 503 }));
  const { controller, until } = observe(data.loader);
  try {
    controller.start(readMapUrl(''));
    const failed = await until((snapshot) => snapshot.map.status === 'error');
    expect(failed.publication).toBeNull();
    expect(geometryReferences.map(({ path }) => data.counts.get(path))).toEqual([1, 1]);
    data.overrides.delete(remoteGeometry);
    controller.retry('map');
    const recovered = await until((snapshot) => snapshot.map.status === 'loaded');
    expect(recovered.publication?.placements.every((placement) => placement.areas.length === 1)).toBe(true);
    expect(recovered.publication?.placements.filter((placement) => placement.movement.length > 0).map((placement) => placement.placementId)).toEqual(['place:a', 'place:b']);
    expect(geometryReferences.map(({ path }) => data.counts.get(path))).toEqual([1, 2]);
  } finally { controller.dispose(); }
});

test('verified requests deduplicate failures and allow explicit retry without refetching successful resources', async () => {
  const data = fixture();
  const path = data.documents.get('item:a')!.path;
  data.overrides.set(path, async () => new Response('unavailable', { status: 503 }));
  const [first, second] = await Promise.all([data.loader.loadIndexes(), data.loader.loadIndexes()]);
  expect(first).toBe(second);
  await expect(data.loader.loadDocument('items', 'a')).rejects.toThrow('503');
  await expect(data.loader.loadDocument('items', 'a')).rejects.toThrow('503');
  expect(data.counts.get(path)).toBe(1);
  expect(data.loader.state(path).status).toBe('error');
  data.overrides.delete(path);
  data.loader.retryFailed();
  const resource = await data.loader.loadDocument('items', 'a');
  expect(resource.document.ref.key).toBe('item:a');
  expect(data.loader.state(path).status).toBe('loaded');
  expect(data.counts.get(path)).toBe(2);
  expect(data.counts.get(data.search.path)).toBe(1);
  expect(data.counts.get('publication.json')).toBe(1);
});

test('essential multipart maps become usable while search is delayed, and navigation loads an uncached document', async () => {
  const data = fixture();
  const search = responseGate();
  data.overrides.set(data.search.path, () => search.promise);
  const { controller, until } = observe(data.loader);
  controller.start(readMapUrl(''));
  const map = await until((snapshot) => snapshot.map.status === 'loaded');
  expect(map.search.status).toBe('loading');
  expect(map.publication?.placements.map((placement) => placement.placementId)).toEqual(['place:a', 'place:b']);
  controller.navigate(readMapUrl('?item=item%3Ab'));
  search.resolve(new Response(data.bodies.get(data.search.path)));
  const restored = await until((snapshot) => snapshot.detail.status === 'loaded');
  expect(restored.documents.get('item:b')?.document.ref.key).toBe('item:b');
  expect(selectionHighlightIds(null, null, restored.state.itemKey, restored.indexes)).toEqual(['place:b']);
  // Selecting a place must not light up every place that shares one of its drops: Kraath's loot
  // keys are carried by 37 other placements, which highlighted every boss on the map.
  const shard = restored.indexes.placementsById.get('place:b')!;
  expect(selectionHighlightIds(shard, null, null, restored.indexes)).toEqual(['place:b']);
  expect(data.counts.get(data.documents.get('item:b')!.path)).toBe(1);
  controller.navigate(readMapUrl('?selected=removed'));
  expect(controller.snapshot.staleSelection).not.toBe('');
  expect(controller.snapshot.indexes.placementsById.has('removed')).toBe(false);
  controller.dispose();
});

test('a gathering node map action selects every published spawner and placed spot', async () => {
  const data = fixture();
  const ref = { key: 'gatheringNodes:iron', kind: 'gatheringNodes' as const, name: 'Small Iron Vein', slug: 'small-iron-vein' };
  const node = data.register({
    schemaVersion: 'compendium.static-gathering-node.v4', ...data.identity, kind: 'gatheringNodes',
    document: {
      ref, description: null, art: {}, facts: { requirements: [], variant: false },
      yields: [], spawners: [], placed: [], placedRules: [],
      places: [{ label: 'Map', mapSpaceId: 'map', spotCount: 2, placementIds: ['place:a', 'place:b'] }],
      spotCount: 2,
    },
  });
  const search = JSON.parse(data.bodies.get(data.search.path)!);
  search.entries.push({ ref, hasPlacements: true, sourceKinds: [], document: node });
  data.root.search = [data.register(search)];
  data.bodies.set('publication.json', JSON.stringify(data.root));
  const { controller, until } = observe(data.loader);
  try {
    controller.start(readMapUrl(`?entity=${encodeURIComponent(ref.key)}`));
    const selected = await until((snapshot) => snapshot.detail.status === 'loaded' && snapshot.documents.has(ref.key));
    expect(selectionHighlightIds(null, ref.key, null, selected.indexes)).toEqual(['place:a', 'place:b']);
    expect(selected.indexes.placementsByEntryKey.get(ref.key)?.length).toBe(2);
  } finally { controller.dispose(); }
});

test('an obsolete failure cannot replace the new selection loading state, and current failures can retry', async () => {
  const data = fixture();
  const a = responseGate(), b = responseGate();
  const pathA = data.documents.get('item:a')!.path, pathB = data.documents.get('item:b')!.path;
  data.overrides.set(pathA, () => a.promise);
  data.overrides.set(pathB, () => b.promise);
  const { controller, until } = observe(data.loader);
  controller.start(readMapUrl('?item=item%3Aa'));
  await until((snapshot) => snapshot.map.status === 'loaded' && snapshot.search.status === 'loaded');
  controller.navigate(readMapUrl('?item=item%3Ab'));
  a.resolve(new Response('old failure', { status: 503 }));
  await data.loader.loadDocument('items', 'a').catch(() => undefined);
  expect(controller.snapshot.state.itemKey).toBe('item:b');
  expect(controller.snapshot.detail.status).toBe('loading');
  b.resolve(new Response('new failure', { status: 502 }));
  await until((snapshot) => snapshot.detail.status === 'error');
  expect(controller.snapshot.detail).toMatchObject({ status: 'error', message: expect.stringContaining('502') });
  data.overrides.delete(pathB);
  controller.retry('detail');
  const recovered = await until((snapshot) => snapshot.detail.status === 'loaded');
  expect(recovered.documents.get('item:b')?.document.ref.key).toBe('item:b');
  expect(data.counts.get(pathB)).toBe(2);
  controller.dispose();
});

test('history restoration invalidates pending query and camera persistence', async () => {
  const data = fixture();
  const { controller, until, navigations, restoredViews } = observe(data.loader);
  try {
    controller.start(readMapUrl(''));
    await until((snapshot) => snapshot.map.status === 'loaded' && snapshot.search.status === 'loaded');
    jest.useFakeTimers();
    controller.setQuery('query', 'pending');
    controller.scheduleView({ target: [90, 30, 0], zoom: 3 });
    const restored = readMapUrl('?layers=game-maps&selected=place%3Ab&q=restored&categories=merchant&x=10&y=20&z=0&zoom=2');
    controller.navigate(restored);
    jest.advanceTimersByTime(320);
    expect(controller.snapshot.state).toEqual(restored);
    expect(navigations).toEqual([]);
    expect(restoredViews).toEqual([null, restored.view]);
  } finally { controller.dispose(); jest.useRealTimers(); }
});

test('pending persistence keeps a new item selection and never restores a cleared query or moves the camera', async () => {
  const data = fixture();
  const { controller, until, navigations, restoredViews } = observe(data.loader);
  try {
    controller.start(readMapUrl(''));
    await until((snapshot) => snapshot.map.status === 'loaded' && snapshot.search.status === 'loaded');
    jest.useFakeTimers();
    controller.setQuery('query', 'merchant');
    const view: MapView = { target: [60, 40, 0], zoom: 2 };
    controller.scheduleView(view);
    controller.dispatch({ type: 'select-item', itemKey: 'item:a' }, 'push');
    controller.dispatch({ type: 'select-placement', placementId: 'place:a' }, 'push');
    jest.advanceTimersByTime(320);
    expect(controller.snapshot.state).toMatchObject({ itemKey: 'item:a', selectedPlacementId: 'place:a', entityKey: null, query: '', view });
    expect(navigations.map(({ mode }) => mode)).toEqual(['push', 'push', 'replace', 'replace']);
    expect(navigations.slice(1).every(({ state }) => state.itemKey === 'item:a' && state.selectedPlacementId === 'place:a' && state.query === '')).toBe(true);
    expect(restoredViews).toEqual([null]);
  } finally { controller.dispose(); jest.useRealTimers(); }
});

test('explicit camera commands supersede pending movement and disposal cancels persistence', async () => {
  const data = fixture();
  const { controller, until, navigations } = observe(data.loader);
  try {
    controller.start(readMapUrl(''));
    await until((snapshot) => snapshot.map.status === 'loaded' && snapshot.search.status === 'loaded');
    jest.useFakeTimers();
    controller.scheduleView({ target: [60, 40, 0], zoom: 2 });
    const fitted: MapView = { target: [128, 128, 0], zoom: 0 };
    controller.dispatch({ type: 'set-view', view: fitted }, 'replace');
    jest.advanceTimersByTime(260);
    expect(controller.snapshot.state.view).toEqual(fitted);
    expect(navigations.map(({ state }) => state.view)).toEqual([fitted]);
    controller.setQuery('query', 'unmounted');
    controller.scheduleView({ target: [0, 0, 0], zoom: 1 });
    controller.dispose();
    jest.advanceTimersByTime(320);
    expect(navigations.map(({ state }) => state.view)).toEqual([fitted]);
    expect(controller.snapshot.state.view).toEqual(fitted);
  } finally { controller.dispose(); jest.useRealTimers(); }
});

test('document resources reject hash mismatches', async () => {
  const data = fixture();
  const path = data.documents.get('item:a')!.path;
  data.bodies.set(path, data.bodies.get(path)!.replace('"name":"a"', '"name":"z"'));
  await expect(data.loader.loadDocument('items', 'a')).rejects.toThrow('hash mismatch');
});

test('document resources reject build identity mismatches after hash verification', async () => {
  const data = fixture();
  const original = JSON.parse(data.bodies.get(data.documents.get('item:a')!.path)!);
  const mismatched = data.register({ ...original, buildId: 'other-build' });
  const searchBody = JSON.parse(data.bodies.get(data.search.path)!);
  searchBody.entries[0].document = mismatched;
  data.root.search = [data.register(searchBody)];
  data.bodies.set('publication.json', JSON.stringify(data.root));
  await expect(data.loader.loadDocument('items', 'a')).rejects.toThrow('build mismatch');
});
