import { expect, test } from 'bun:test';
import type { PublicKindEntry } from '@afallon/contracts/public';
import { siteNavigation } from './site-navigation';

const kind = (kind: PublicKindEntry['kind'], plural: string, pages = true, list = pages): PublicKindEntry => ({ kind, label: plural, plural, route: kind, icon: 'item', pages, list, searchable: pages, columns: [], facets: [] });

test('the Browse panel keeps every published kind and hides empty columns', () => {
  const { primary, sections } = siteNavigation([kind('items', 'Items'), kind('npcs', 'NPCs'), kind('lootTables', 'Loot Tables'), kind('effects', 'Effects'), kind('stats', 'Stats', false)], '/base');
  expect(primary.map((link) => link.href)).toEqual(['/base/map/', '/base/items/']);
  expect(sections.map((section) => [section.label, section.links.map((link) => link.href)])).toEqual([
    ['World', ['/base/map/', '/base/npcs/']],
    ['Items', ['/base/items/']],
    ['Character', ['/base/effects/']],
    // A paged kind that no column names stays reachable. A kind without pages has no link.
    ['Other', ['/base/lootTables/']],
  ]);
});

test('Recipes and gathering nodes sit with Items', () => {
  const { sections } = siteNavigation([kind('items', 'Items'), kind('recipes', 'Recipes', false, true), kind('gatheringNodes', 'Gathering Nodes'), kind('mechanics', 'Mechanics')], '/base');
  expect(sections.find((section) => section.id === 'items')?.links.map((link) => link.href)).toEqual(['/base/items/', '/base/recipes/', '/base/gatheringNodes/']);
  expect(sections.some((section) => section.id === 'other')).toBe(false);
});
