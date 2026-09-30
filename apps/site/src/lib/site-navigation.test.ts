import { expect, test } from 'bun:test';
import type { PublicKindEntry } from '@afallon/contracts/public';
import { navigationGroups } from './site-navigation';

const kind = (kind: PublicKindEntry['kind'], plural: string, pages = true, list = pages): PublicKindEntry => ({ kind, label: plural, plural, route: kind, icon: 'item', pages, list, searchable: pages, columns: [], facets: [] });

test('the navigation keeps every published kind and hides empty groups', () => {
  const groups = navigationGroups([kind('items', 'Items'), kind('npcs', 'NPCs'), kind('effects', 'Effects'), kind('stats', 'Stats', false)], '/base');
  expect(groups.map((group) => [group.label, group.links.map((link) => link.href)])).toEqual([
    ['World', ['/base/map/', '/base/npcs/']],
    ['Items', ['/base/items/']],
    // A paged kind that no group names stays reachable. A kind without pages has no link.
    ['Reference', ['/base/effects/']],
  ]);
});

test('Recipes remain in Items navigation when only the list is published', () => {
  const groups = navigationGroups([kind('items', 'Items'), kind('recipes', 'Recipes', false, true), kind('mechanics', 'Mechanics')], '/base');
  expect(groups.find((group) => group.id === 'items')?.links.map((link) => link.href)).toEqual(['/base/items/', '/base/recipes/']);
  expect(groups.find((group) => group.id === 'mechanics')?.links.map((link) => link.href)).toEqual([
    '/base/mechanics/character-progression/', '/base/mechanics/heroic-tier/', '/base/mechanics/crafting-and-gathering/',
  ]);
});
