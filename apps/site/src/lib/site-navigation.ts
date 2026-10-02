import type { PublicKindEntry } from '@afallon/contracts/public';

/** A destination. `description` is the one line that the Browse panel shows under its label; `icon` names a kind glyph. */
export interface NavigationLink { label: string; href: string; description?: string; icon?: string }
export interface NavigationGroup { id: string; label: string; links: NavigationLink[] }
/** `primary` links stand in the bar; `sections` are the columns of the one Browse panel, which names every destination. */
export interface Navigation { primary: NavigationLink[]; sections: NavigationGroup[] }

/** The page that supports the Compendium on Ko-fi. */
export const KOFI_URL = 'https://ko-fi.com/wowmuch';

// The most visited destinations, shown directly in the bar. Mechanics opens the list of guides.
const PRIMARY: readonly string[] = ['map', 'items', 'quests', 'classes', 'mechanics'];
// Browse panel columns in order. Recipes have a list without detail pages.
const SECTIONS: ReadonlyArray<{ id: string; label: string; entries: readonly string[] }> = [
  { id: 'world', label: 'World', entries: ['map', 'places', 'npcs', 'quests', 'properties', 'factions'] },
  { id: 'items', label: 'Items', entries: ['items', 'recipes', 'gatheringNodes', 'gearSets', 'currencies', 'craftingStations'] },
  { id: 'character', label: 'Character', entries: ['classes', 'races', 'skills', 'abilities', 'stats', 'effects'] },
  { id: 'mechanics', label: 'Mechanics', entries: ['mechanics'] },
];

// What a reader finds behind each destination of the Browse panel.
const DESCRIPTIONS: Readonly<Record<string, string>> = {
  map: 'Spawns and resources',
  places: 'Zones and dungeons',
  npcs: 'Creatures and vendors',
  quests: 'Objectives and rewards',
  properties: 'Buildings you can buy',
  factions: 'Stances and standing',
  items: 'Gear and materials',
  recipes: 'Materials and products',
  gatheringNodes: 'Veins, herbs, and fish',
  gearSets: 'Matching piece bonuses',
  currencies: 'What each coin buys',
  craftingStations: 'Where to craft and what',
  classes: 'Talent trees and abilities',
  races: 'Starting place and classes',
  skills: 'Levels and training',
  abilities: 'What each ability does',
  stats: 'What each stat does',
  effects: 'Buffs, debuffs, and states',
};

/** The mechanics guides in the order of the menu: each topic's label, the slug of its page, and its menu line. The hub lists them too. */
export const GUIDE_TOPICS: ReadonlyArray<{ label: string; slug: string; description: string }> = [
  { label: 'Adventurers', slug: 'adventurers', description: 'Jobs and parties' },
  { label: 'Character Progression', slug: 'character-progression', description: 'Experience and talents' },
  { label: 'Crafting and Gathering', slug: 'crafting-and-gathering', description: 'Recipes and nodes' },
  { label: 'Combat', slug: 'combat', description: 'Stats, damage, and effects' },
  { label: 'Corruption', slug: 'corruption', description: 'Tokens and timed dungeons' },
  { label: 'Factions and Reputation', slug: 'factions', description: 'Standing and stances' },
  { label: 'Heroic Tier', slug: 'heroic-tier', description: 'Heroic creatures and gear' },
  { label: 'Loot', slug: 'loot', description: 'Bags, chests, and packs' },
  { label: 'Travel', slug: 'travel', description: 'Flight masters and routes' },
  { label: 'World Quests', slug: 'world-quests', description: 'Timed quests in zones' },
];

/**
 * The navigation of a publication. A paged kind that no column names goes to an Other column, so the menu never hides a
 * published kind. A column without a published destination is left out.
 */
export function siteNavigation(registry: readonly PublicKindEntry[], base: string): Navigation {
  const byKind = new Map<string, PublicKindEntry>(registry.filter((entry) => entry.pages || entry.list).map((entry) => [entry.kind, entry]));
  const named = new Set(SECTIONS.flatMap((section) => section.entries));
  const link = (entry: PublicKindEntry): NavigationLink => ({ label: entry.plural, href: `${base}/${entry.route}/`, icon: entry.icon,
    ...(DESCRIPTIONS[entry.kind] ? { description: DESCRIPTIONS[entry.kind] } : {}) });
  // The registry names kinds, not individual mechanics documents, so the menu names each guide topic.
  const mechanics = byKind.get('mechanics');
  const topics: NavigationLink[] = mechanics ? GUIDE_TOPICS.map(({ label, slug, description }) => ({ label, href: `${base}/${mechanics.route}/${slug}/`, description })) : [];
  const links = (id: string): NavigationLink[] => {
    if (id === 'map') return [{ label: 'Map', href: `${base}/map/`, icon: 'world-map', description: DESCRIPTIONS.map }];
    if (id === 'mechanics') return topics;
    const entry = byKind.get(id);
    return entry ? [link(entry)] : [];
  };
  const other = registry.filter((entry) => entry.pages && !named.has(entry.kind)).map(link);
  const sections = [
    ...SECTIONS.map((section) => ({ id: section.id, label: section.label, links: section.entries.flatMap(links) })),
    { id: 'other', label: 'Other', links: other },
  ].filter((section) => section.links.length > 0);
  // The bar keeps its links short; the panel carries the descriptions and glyphs.
  const primary = PRIMARY.flatMap((id): NavigationLink[] => id === 'mechanics' ? (mechanics ? [{ label: mechanics.plural, href: `${base}/${mechanics.route}/` }] : []) : links(id).map(({ label, href }) => ({ label, href })));
  return { primary, sections };
}
