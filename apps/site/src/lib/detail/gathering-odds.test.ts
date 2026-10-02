import { expect, test } from 'bun:test';
import type { Attunement, SpawnerOption } from '@afallon/contracts/public';
import { attunementBoosts, interpolateChance, relevantAttunements } from './gathering-odds';

const node = (key: string) => ({ key, kind: 'gatheringNodes' as const, name: key, slug: key });
const option = (key: string): SpawnerOption => ({ node: node(key), lowSkillWeight: 1, highSkillWeight: 1, teaserWeight: 0 });
const tonic = (key: string, boost: number, nodes: string[]): Attunement => ({ item: { key, kind: 'items', name: key, slug: key }, effect: `${key} effect`, boost, nodes: nodes.map(node) });

test('only active attunements add their bonus, and two active attunements for one node add up', () => {
  const options = [option('iron'), option('silver')];
  const attunements = [tonic('prospecting', 10, ['iron']), tonic('silver-tonic', 10, ['silver']), tonic('deep', 20, ['iron'])];
  expect(attunementBoosts(options, attunements, ['prospecting', 'deep'])).toEqual([30, 0]);
  expect(attunementBoosts(options, attunements, [])).toEqual([0, 0]);
  expect(relevantAttunements([option('silver')], attunements).map((attunement) => attunement.item.key)).toEqual(['silver-tonic']);
});

test('a chance moves evenly between published levels and keeps the nearest one outside them', () => {
  const points = [{ level: 10, chance: 1 }, { level: 150, chance: 15 }];
  expect([5, 10, 80, 150, 200].map((level) => interpolateChance(points, level))).toEqual([1, 1, 8, 15, 15]);
  expect(interpolateChance([], 5)).toBeUndefined();
});
