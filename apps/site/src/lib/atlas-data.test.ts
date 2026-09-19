import { expect, jest, test } from 'bun:test';
import type { StaticResourceReference, StaticRootManifest } from '@afallon/contracts/public';
import { AtlasDataLoader, type AtlasFetch } from './atlas-data';
import { AtlasController, type AtlasSnapshot } from './atlas-controller';
import { readAtlasUrl, type AtlasState, type AtlasView } from './atlas-state';
import { selectionHighlightIds } from './atlas-search';

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
      schemaVersion: 'compendium.static-item.v1', ...identity, kind: 'items',
      document: {
        ref, description: null, art: {},
        facts: { stats: [], randomStats: [], randomStatsMax: 0, sockets: [], stackLimit: 1, questDropOnly: false, corruptionToken: false, requirements: [] },
        droppedBy: [], soldBy: [], gatheredFrom: [], inContainers: [], rewardedBy: [], givenBy: [], craftedBy: [], usedInRecipes: [], usedInQuests: [],
      },
    }));
  }
  const list = register({ schemaVersion: 'compendium.static-kind-list.v1', ...identity, kind: 'items', part: 0, rows: [...refs.values()].map((ref) => ({ ref, values: {}, facets: {} })) });
  const search = register({
    schemaVersion: 'compendium.static-search.v3', ...identity, part: 0,
    entries: [...refs].map(([key, ref]) => ({ ref, hasPlacements: true, sourceKinds: ['vendor'], document: documents.get(key) })),
  });
  const parts = ['a', 'b'].map((name, part) => register({ schemaVersion: 'compendium.static-map.v2', ...identity, mapSpaceId: 'map', part, placements: [[`place:${name}`, [part * 10, 0], 0, name, ['merchant'], [], [`item:${name}`], null, null, null]], regions: [] }));
  const imagery = register({ schemaVersion: 'compendium.static-imagery.v2', ...identity, mapSpaceId: 'map', defaultLayerId: 'game', layers: [{ id: 'game', mapSpaceId: 'map', label: 'Map', kind: 'game-map', tileSize: 256, minZoom: 0, maxZoom: 0, extent: [0, 0, 256, 256], tiles: [{ z: 0, x: 0, y: 0, url: `assets/${'d'.repeat(64)}.webp`, sha256: 'd'.repeat(64), bytes: 1, width: 256, height: 256, state: 'captured', schemaId: 'image/webp' }] }] });
  const coverage = register({ schemaVersion: 'compendium.static-coverage.v1', ...identity, complete: false, unresolvedIssueCount: 1, occurrenceCount: 1, exclusionCount: 0, messages: ['Incomplete'] });
  const bounds = { min: { x: 0, y: 0 }, max: { x: 256, y: 256 } };
  const root: StaticRootManifest = {
    schemaVersion: 'compendium.static-root.v3', ...identity, mode: 'preview', complete: false,
    world: { mapSpaceId: 'world', label: 'Afallon', bounds, offsets: [{ mapSpaceId: 'map', worldX: 0, worldY: 0, source: 'native', status: 'placed' }], unplacedMapSpaceIds: [] },
    maps: [{ mapSpaceId: 'map', label: 'Map', bounds, parts, optionalGeometry: [], imagery }],
    kinds: [{ kind: 'items', label: 'Item', plural: 'Items', route: 'items', icon: 'package', pages: true, searchable: true, columns: [], facets: [] }],
    lists: { items: [list] }, search: [search], coverage,
  };
  bodies.set('publication.json', JSON.stringify(root));
  const counts = new Map<string, number>();
  const overrides = new Map<string, () => Promise<Response>>();
  const fetcher: AtlasFetch = async (input) => {
    const path = new URL(input instanceof Request ? input.url : input).pathname.replace(/^\/data\//, '');
    counts.set(path, (counts.get(path) ?? 0) + 1);
    const override = overrides.get(path);
    if (override) return override();
    const body = bodies.get(path);
    return body ? new Response(body) : new Response('missing', { status: 404 });
  };
  return { loader: new AtlasDataLoader(fetcher, 'https://atlas.invalid/data/'), bodies, counts, overrides, documents, search, root, identity, register };
}

function observe(loader: AtlasDataLoader) {
  let latest: AtlasSnapshot | null = null;
  const listeners = new Set<() => void>();
  const navigations: { state: AtlasState; mode: 'push' | 'replace' }[] = [];
  const restoredViews: (AtlasView | null)[] = [];
  const controller = new AtlasController(loader, {
    onChange(snapshot) { latest = snapshot; for (const notify of listeners) notify(); },
    onNavigate(state, mode) { navigations.push({ state, mode }); },
    onRestoreView(view) { restoredViews.push(view); },
  });
  const until = (condition: (snapshot: AtlasSnapshot) => boolean): Promise<AtlasSnapshot> => {
    const { promise, resolve } = Promise.withResolvers<AtlasSnapshot>();
    const notify = () => { if (latest && condition(latest)) { listeners.delete(notify); resolve(latest); } };
    listeners.add(notify);
    notify();
    return promise;
  };
  return { controller, until, navigations, restoredViews };
}

function responseGate() { return Promise.withResolvers<Response>(); }

test('loads all geometry before first render and retries a failed geometry resource with the map', async () => {
  const data = fixture();
  const original = data.root.maps[0]!;
  const areaRadius = 4;
  const geometryReferences: StaticResourceReference[] = [];
  data.root.maps = ['a', 'b'].map((name, index) => {
    const mapSpaceId = `map:${name}`;
    const part = data.register({ schemaVersion: 'compendium.static-map.v2', ...data.identity, mapSpaceId, part: 0,
      placements: [[`place:${name}`, [index * 10, 0], 0, name, ['merchant'], ['item:a'], [`item:${name}`], null, null, areaRadius]], regions: [] });
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
    controller.start(readAtlasUrl(''));
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
  controller.start(readAtlasUrl(''));
  const map = await until((snapshot) => snapshot.map.status === 'loaded');
  expect(map.search.status).toBe('loading');
  expect(map.publication?.placements.map((placement) => placement.placementId)).toEqual(['place:a', 'place:b']);
  controller.navigate(readAtlasUrl('?item=item%3Ab'));
  search.resolve(new Response(data.bodies.get(data.search.path)));
  const restored = await until((snapshot) => snapshot.detail.status === 'loaded');
  expect(restored.documents.get('item:b')?.ref.key).toBe('item:b');
  expect(selectionHighlightIds(null, null, restored.state.itemKey, restored.indexes)).toEqual(['place:b']);
  // Selecting a place must not light up every place that shares one of its drops: Kraath's loot
  // keys are carried by 37 other placements, which highlighted every boss on the map.
  const shard = restored.indexes.placementsById.get('place:b')!;
  expect(selectionHighlightIds(shard, null, null, restored.indexes)).toEqual(['place:b']);
  expect(data.counts.get(data.documents.get('item:b')!.path)).toBe(1);
  controller.navigate(readAtlasUrl('?selected=removed'));
  expect(controller.snapshot.staleSelection).not.toBe('');
  expect(controller.snapshot.indexes.placementsById.has('removed')).toBe(false);
  controller.dispose();
});

test('an obsolete failure cannot replace the new selection loading state, and current failures can retry', async () => {
  const data = fixture();
  const a = responseGate(), b = responseGate();
  const pathA = data.documents.get('item:a')!.path, pathB = data.documents.get('item:b')!.path;
  data.overrides.set(pathA, () => a.promise);
  data.overrides.set(pathB, () => b.promise);
  const { controller, until } = observe(data.loader);
  controller.start(readAtlasUrl('?item=item%3Aa'));
  await until((snapshot) => snapshot.map.status === 'loaded' && snapshot.search.status === 'loaded');
  controller.navigate(readAtlasUrl('?item=item%3Ab'));
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
  expect(recovered.documents.get('item:b')?.ref.key).toBe('item:b');
  expect(data.counts.get(pathB)).toBe(2);
  controller.dispose();
});

test('history restoration invalidates pending query and camera persistence', async () => {
  const data = fixture();
  const { controller, until, navigations, restoredViews } = observe(data.loader);
  try {
    controller.start(readAtlasUrl(''));
    await until((snapshot) => snapshot.map.status === 'loaded' && snapshot.search.status === 'loaded');
    jest.useFakeTimers();
    controller.setQuery('query', 'pending');
    controller.scheduleView({ target: [90, 30, 0], zoom: 3 });
    const restored = readAtlasUrl('?layers=game-maps&selected=place%3Ab&q=restored&categories=merchant&x=10&y=20&z=0&zoom=2');
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
    controller.start(readAtlasUrl(''));
    await until((snapshot) => snapshot.map.status === 'loaded' && snapshot.search.status === 'loaded');
    jest.useFakeTimers();
    controller.setQuery('query', 'merchant');
    const view: AtlasView = { target: [60, 40, 0], zoom: 2 };
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
    controller.start(readAtlasUrl(''));
    await until((snapshot) => snapshot.map.status === 'loaded' && snapshot.search.status === 'loaded');
    jest.useFakeTimers();
    controller.scheduleView({ target: [60, 40, 0], zoom: 2 });
    const fitted: AtlasView = { target: [128, 128, 0], zoom: 0 };
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
