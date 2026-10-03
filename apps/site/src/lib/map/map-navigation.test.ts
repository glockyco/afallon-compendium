import { expect, test } from 'bun:test';
import type { PublicPlacement, PublicationData } from '@afallon/contracts/public';
import { emptySearchIndexes } from '../map-search';
import { entityResults, framePlacements, linkedPlacements, visibleResults } from './map-navigation';

const map = {
  world: { offsets: [{ mapSpaceId: 'surface', worldX: 0, worldY: 0 }, { mapSpaceId: 'dungeon', worldX: 1000, worldY: 0 }] },
  tileLayers: [
    { mapSpaceId: 'surface', kind: 'game-map', maxZoom: 0 },
    { mapSpaceId: 'surface', kind: 'captured', maxZoom: 1 },
    { mapSpaceId: 'dungeon', kind: 'game-map', maxZoom: 3 },
    { mapSpaceId: 'dungeon', kind: 'captured', maxZoom: 4 },
  ],
} as PublicationData;
const spot = (id: string, x: number, y: number, mapSpaceId = 'surface') => ({ placementId: id, position: [x, y], mapSpaceId, label: id }) as PublicPlacement;
const bandits = [spot('bandit-a', -200, 100), spot('bandit-b', 250, -100), spot('bandit-c', 1050, 200, 'dungeon')];
const unrelated = spot('unrelated', -700, 400);
const indexes = { ...emptySearchIndexes(),
  placementsById: new Map([...bandits, unrelated].map((placement) => [placement.placementId, placement])),
  placementsByEntryKey: new Map([['npcs:27', bandits]]),
};

function contains(view: { target: readonly number[]; zoom: number }, points: readonly PublicPlacement[], width: number, height: number): boolean {
  return points.every((placement) => {
    return Math.abs(placement.position[0] - view.target[0]!) <= width / 2 ** view.zoom / 2
      && Math.abs(placement.position[1] - view.target[1]!) <= height / 2 ** view.zoom / 2;
  });
}

test('an inbound selected link frames only its selected spot and respects an explicit camera', () => {
  const link = { selectedPlacementId: 'bandit-a', entityKey: 'npcs:27', view: null };
  const spots = linkedPlacements(link, indexes);
  expect(spots.map((placement) => placement.placementId)).toEqual(['bandit-a']);
  const view = framePlacements(map, spots, {}, 600, 400)!;
  expect(view.target).toEqual([-200, 100, 0]);
  expect(view.zoom).toBe(1);
  expect(linkedPlacements({ ...link, view: view }, indexes)).toEqual([]);
  expect(linkedPlacements({ ...link, selectedPlacementId: 'deleted' }, indexes)).toEqual([]);
  expect(framePlacements(map, [], {}, 600, 400)).toBeNull();
});

test('a dungeon spot frames no closer than its own imagery while a multi-map frame respects the least detailed map', () => {
  const dungeonView = framePlacements(map, [bandits[2]!], {}, 1600, 1000)!;
  expect(dungeonView.target).toEqual([1050, 200, 0]);
  expect(dungeonView.zoom).toBe(4);
  const multiMapView = framePlacements(map, [bandits[0]!, bandits[2]!], {}, 10000, 6000)!;
  expect(multiMapView.zoom).toBe(1);
  expect(contains(multiMapView, [bandits[0]!, bandits[2]!], 10000, 6000)).toBe(true);
});

test('entity spot framing includes translated distant spots in landscape and portrait views', () => {
  const spots = linkedPlacements({ selectedPlacementId: null, entityKey: 'npcs:27', view: null }, indexes);
  for (const [width, height] of [[1100, 650], [390, 640]]) {
    const view = framePlacements(map, spots, {}, width!, height!)!;
    expect(contains(view, bandits, width!, height!)).toBe(true);
    expect(contains(view, [unrelated], width!, height!)).toBe(false);
  }
  const moved = framePlacements(map, spots, { dungeon: { worldX: 1300, worldY: 0 } }, 1100, 650)!;
  expect(moved.target[0]).toBeGreaterThan(framePlacements(map, spots, {}, 1100, 650)!.target[0]);
});

test('entity results include every linked enemy despite default category and viewport filters', () => {
  const visibleByDefault = [unrelated];
  const all = [...visibleByDefault, ...bandits];
  const entity = entityResults(all, 'npcs:27', indexes);
  expect(entity.map((placement) => placement.placementId)).toEqual(['bandit-a', 'bandit-b', 'bandit-c']);
  expect(visibleResults(entity, [bandits[0]!], { search: false, entityKey: 'npcs:27', mapUnavailable: false, hasViewport: true })).toEqual(entity);
  expect(visibleResults(all, visibleByDefault, { search: false, entityKey: null, mapUnavailable: false, hasViewport: true })).toEqual(visibleByDefault);
  expect(entityResults(all, 'npcs:missing', indexes)).toEqual([]);
});
