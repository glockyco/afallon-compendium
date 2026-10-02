import type { PublicKindEntry } from '@afallon/contracts/public';

export interface NavigationLink { label: string; href: string }
export interface NavigationGroup { id: string; label: string; links: NavigationLink[] }
/** `primary` links stand in the bar; `sections` are the columns of the one Browse panel, which names every destination. */
export interface Navigation { primary: NavigationLink[]; sections: NavigationGroup[] }

// The most visited destinations, shown directly in the bar.
const PRIMARY: readonly string[] = ['map', 'items', 'recipes', 'quests', 'classes', 'skills'];
// Browse panel columns in order. Recipes have a list without detail pages.
const SECTIONS: ReadonlyArray<{ id: string; label: string; entries: readonly string[] }> = [
  { id: 'world', label: 'World', entries: ['map', 'places', 'npcs', 'quests', 'properties'] },
  { id: 'items', label: 'Items', entries: ['items', 'recipes', 'gatheringNodes'] },
  { id: 'character', label: 'Character', entries: ['classes', 'skills', 'abilities'] },
  { id: 'mechanics', label: 'Mechanics', entries: ['mechanics'] },
];

/**
 * The navigation of a publication. A paged kind that no column names goes to an Other column, so the menu never hides a
 * published kind. A column without a published destination is left out.
 */
export function siteNavigation(registry: readonly PublicKindEntry[], base: string): Navigation {
  const byKind = new Map<string, PublicKindEntry>(registry.filter((entry) => entry.pages || entry.list).map((entry) => [entry.kind, entry]));
  const named = new Set(SECTIONS.flatMap((section) => section.entries));
  const link = (entry: PublicKindEntry): NavigationLink => ({ label: entry.plural, href: `${base}/${entry.route}/` });
  // The registry names kinds, not individual mechanics documents, so the menu names each guide topic.
  const mechanics = byKind.get('mechanics');
  const topics: NavigationLink[] = mechanics ? [
    ['Character Progression', 'character-progression'], ['Crafting and Gathering', 'crafting-and-gathering'],
    ['Corruption', 'corruption'], ['Heroic Tier', 'heroic-tier'], ['Loot', 'loot'],
  ].map(([label, slug]) => ({ label: label!, href: `${base}/${mechanics.route}/${slug}/` })) : [];
  const links = (id: string): NavigationLink[] => {
    if (id === 'map') return [{ label: 'Map', href: `${base}/map/` }];
    if (id === 'mechanics') return topics;
    const entry = byKind.get(id);
    return entry ? [link(entry)] : [];
  };
  const other = registry.filter((entry) => entry.pages && !named.has(entry.kind)).map(link);
  const sections = [
    ...SECTIONS.map((section) => ({ id: section.id, label: section.label, links: section.entries.flatMap(links) })),
    { id: 'other', label: 'Other', links: other },
  ].filter((section) => section.links.length > 0);
  return { primary: PRIMARY.flatMap(links), sections };
}
