import { expect, test } from 'bun:test';
import type { StaticResourceReference, StaticRootManifest } from '@afallon/contracts/public';
import { AtlasDataLoader, type AtlasFetch } from './atlas-data';
import { AtlasController, type AtlasSnapshot } from './atlas-controller';
import { readAtlasUrl } from './atlas-state';
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
  const sources = new Map<string, StaticResourceReference>();
  const details = new Map<string, StaticResourceReference>();
  for (const name of ['a', 'b']) {
    const itemKey = `item:${name}`;
    details.set(itemKey, register({ schemaVersion: 'compendium.static-entity-detail.v1', ...identity, entity: { entityKey: itemKey, kind: 'items', nativeId: name === 'a' ? 2 : 9, name, description: null, placementIds: [`place:${name}`], sections: [] } }));
    sources.set(itemKey, register({ schemaVersion: 'compendium.static-item-source.v1', ...identity, itemSource: { itemKey, sections: [], sources: [{ label: name, kind: 'merchant', placementIds: [`place:${name}`], sections: [] }] } }));
  }
  const entities = register({ schemaVersion: 'compendium.static-entity-search.v2', ...identity, part: 0, entities: [...details].map(([entityKey, detail], index) => ({ entityKey, detail, kind: 'items', nativeId: index ? 9 : 2, name: entityKey, description: null })) });
  const items = register({ schemaVersion: 'compendium.static-item-search.v2', ...identity, part: 0, items: [...sources].map(([itemKey, source]) => ({ itemKey, source, detail: details.get(itemKey), name: itemKey, sourceNames: ['Merchant'], sourceKinds: ['merchant'] })) });
  const parts = ['a', 'b'].map((name, part) => register({ schemaVersion: 'compendium.static-map.v2', ...identity, mapSpaceId: 'map', part, placements: [[`place:${name}`, [part * 10, 0], 0, name, ['merchant'], [], [`item:${name}`], null, null, null]], regions: [] }));
  const imagery = register({ schemaVersion: 'compendium.static-imagery.v2', ...identity, mapSpaceId: 'map', defaultLayerId: 'game', layers: [{ id: 'game', mapSpaceId: 'map', label: 'Map', kind: 'game-map', tileSize: 256, minZoom: 0, maxZoom: 0, extent: [0, 0, 256, 256], tiles: [{ z: 0, x: 0, y: 0, url: `assets/${'d'.repeat(64)}.webp`, sha256: 'd'.repeat(64), bytes: 1, width: 256, height: 256, state: 'captured', schemaId: 'image/webp' }] }] });
  const coverage = register({ schemaVersion: 'compendium.static-coverage.v1', ...identity, complete: false, unresolvedIssueCount: 1, occurrenceCount: 1, exclusionCount: 0, messages: ['Incomplete'] });
  const bounds = { min: { x: 0, y: 0 }, max: { x: 256, y: 256 } };
  const root: StaticRootManifest = {
    schemaVersion: 'compendium.static-root.v2', ...identity, mode: 'preview', complete: false,
    world: { mapSpaceId: 'world', label: 'Afallon', bounds, offsets: [{ mapSpaceId: 'map', worldX: 0, worldY: 0, source: 'native', status: 'placed' }], unplacedMapSpaceIds: [] },
    maps: [{ mapSpaceId: 'map', label: 'Map', bounds, parts, optionalGeometry: [], imagery }],
    entitySearch: [entities], itemSearch: [items], guides: {}, coverage,
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
  return { loader: new AtlasDataLoader(fetcher, 'https://atlas.invalid/data/'), bodies, counts, overrides, sources, entities, items, root, identity, register };
}

function observe(loader: AtlasDataLoader) {
  let latest: AtlasSnapshot | null = null;
  const listeners = new Set<() => void>();
  const controller = new AtlasController(loader, { onChange(snapshot) { latest = snapshot; for (const notify of listeners) notify(); }, onNavigate() {}, onRestoreView() {} });
  const until = (condition: (snapshot: AtlasSnapshot) => boolean): Promise<AtlasSnapshot> => {
    const { promise, resolve } = Promise.withResolvers<AtlasSnapshot>();
    const notify = () => { if (latest && condition(latest)) { listeners.delete(notify); resolve(latest); } };
    listeners.add(notify);
    notify();
    return promise;
  };
  return { controller, until };
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
  const path = data.sources.get('item:a')!.path;
  data.overrides.set(path, async () => new Response('unavailable', { status: 503 }));
  const [first, second] = await Promise.all([data.loader.loadIndexes(), data.loader.loadIndexes()]);
  expect(first).toBe(second);
  await expect(data.loader.loadItemSource('item:a')).rejects.toThrow('503');
  await expect(data.loader.loadItemSource('item:a')).rejects.toThrow('503');
  expect(data.counts.get(path)).toBe(1);
  expect(data.loader.state(path).status).toBe('error');
  data.overrides.delete(path);
  data.loader.retryFailed();
  const source = await data.loader.loadItemSource('item:a');
  expect(source.itemSource.sources[0]?.placementIds).toEqual(['place:a']);
  expect(data.loader.state(path).status).toBe('loaded');
  expect(data.counts.get(path)).toBe(2);
  expect(data.counts.get(data.items.path)).toBe(1);
  expect(data.counts.get('publication.json')).toBe(1);
});

test('essential multipart maps become usable while search is delayed, and navigation loads uncached item sources', async () => {
  const data = fixture();
  const search = responseGate();
  data.overrides.set(data.items.path, () => search.promise);
  const { controller, until } = observe(data.loader);
  controller.start(readAtlasUrl(''));
  const map = await until((snapshot) => snapshot.map.status === 'loaded');
  expect(map.search.status).toBe('loading');
  expect(map.publication?.placements.map((placement) => placement.placementId)).toEqual(['place:a', 'place:b']);
  controller.navigate(readAtlasUrl('?item=item%3Ab'));
  search.resolve(new Response(data.bodies.get(data.items.path)));
  const restored = await until((snapshot) => snapshot.detail.status === 'loaded');
  expect(restored.itemDetails.get('item:b')?.sources[0]?.placementIds).toEqual(['place:b']);
  expect(selectionHighlightIds(null, null, restored.state.itemKey, restored.indexes)).toEqual(['place:b']);
  expect(data.counts.get(data.sources.get('item:b')!.path)).toBe(1);
  controller.navigate(readAtlasUrl('?selected=removed'));
  expect(controller.snapshot.staleSelection).not.toBe('');
  expect(controller.snapshot.indexes.placementsById.has('removed')).toBe(false);
  controller.dispose();
});

test('an obsolete failure cannot replace the new selection loading state, and current failures can retry', async () => {
  const data = fixture();
  const a = responseGate(), b = responseGate();
  const pathA = data.sources.get('item:a')!.path, pathB = data.sources.get('item:b')!.path;
  data.overrides.set(pathA, () => a.promise);
  data.overrides.set(pathB, () => b.promise);
  const { controller, until } = observe(data.loader);
  controller.start(readAtlasUrl('?item=item%3Aa'));
  await until((snapshot) => snapshot.map.status === 'loaded' && snapshot.search.status === 'loaded');
  controller.navigate(readAtlasUrl('?item=item%3Ab'));
  a.resolve(new Response('old failure', { status: 503 }));
  await data.loader.loadItemSource('item:a').catch(() => undefined);
  expect(controller.snapshot.state.itemKey).toBe('item:b');
  expect(controller.snapshot.detail.status).toBe('loading');
  b.resolve(new Response('new failure', { status: 502 }));
  await until((snapshot) => snapshot.detail.status === 'error');
  expect(controller.snapshot.detail).toMatchObject({ status: 'error', message: expect.stringContaining('502') });
  data.overrides.delete(pathB);
  controller.retry('detail');
  const recovered = await until((snapshot) => snapshot.detail.status === 'loaded');
  expect(recovered.itemDetails.get('item:b')?.sources[0]?.placementIds).toEqual(['place:b']);
  expect(data.counts.get(pathB)).toBe(2);
  controller.dispose();
});
