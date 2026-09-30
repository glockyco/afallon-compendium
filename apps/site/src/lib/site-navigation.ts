import type { PublicKindEntry } from '@afallon/contracts/public';

export interface NavigationLink { label: string; href: string }
export interface NavigationGroup { id: string; label: string; links: NavigationLink[] }

// Top navigation groups in order. Recipes have a list without detail pages.
const GROUPS: ReadonlyArray<{ id: string; label: string; entries: readonly string[] }> = [
  { id: 'world', label: 'World', entries: ['map', 'places', 'npcs', 'quests', 'properties'] },
  { id: 'items', label: 'Items', entries: ['items', 'recipes'] },
  { id: 'character', label: 'Character', entries: ['classes', 'skills', 'abilities'] },
  { id: 'reference', label: 'Reference', entries: [] },
  { id: 'mechanics', label: 'Mechanics', entries: ['mechanics'] },
];

/**
 * The navigation groups of a publication. A paged kind that no group names goes to Reference, so the menu never hides a
 * published kind. A group without a published destination is left out.
 */
export function navigationGroups(registry: readonly PublicKindEntry[], base: string): NavigationGroup[] {
  const paged = registry.filter((entry) => entry.pages);
  const byKind = new Map<string, PublicKindEntry>(registry.filter((entry) => entry.pages || entry.list).map((entry) => [entry.kind, entry]));
  const named = new Set(GROUPS.flatMap((group) => group.entries));
  const link = (entry: PublicKindEntry): NavigationLink => ({ label: entry.plural, href: `${base}/${entry.route}/` });
  // The registry names kinds, not individual guide documents. These are the published mechanics topics.
  const mechanics = byKind.get('mechanics');
  const mechanicsLinks: NavigationLink[] = mechanics ? [
    { label: 'Character Progression', href: `${base}/${mechanics.route}/character-progression/` },
    { label: 'Heroic Tier', href: `${base}/${mechanics.route}/heroic-tier/` },
    { label: 'Crafting and Gathering', href: `${base}/${mechanics.route}/crafting-and-gathering/` },
  ] : [];
  return GROUPS.map((group) => ({
    id: group.id,
    label: group.label,
    links: [
      ...group.entries.flatMap((id) => {
        if (id === 'map') return [{ label: 'Map', href: `${base}/map/` }];
        if (id === 'mechanics') return mechanicsLinks;
        const entry = byKind.get(id);
        return entry ? [link(entry)] : [];
      }),
      ...(group.id === 'reference' ? paged.filter((entry) => !named.has(entry.kind)).map(link) : []),
    ],
  })).filter((group) => group.links.length > 0);
}
