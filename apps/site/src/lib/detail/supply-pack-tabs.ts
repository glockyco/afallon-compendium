import type { ItemUsePack } from '@afallon/contracts/public';
import { formatNumber, nameOf } from '../format';

/** One level band of a class: its tab key, its tab label, and the pack table that the band opens. */
export interface PackBand { key: string; label: string; pack: ItemUsePack }

/** The bands that one class can open, in level order. A pack without a class condition belongs to every class. */
export interface PackClass { key: string; label: string; bands: PackBand[] }

const slug = (text: string) => text.toLocaleLowerCase('en-US').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function band(pack: ItemUsePack): PackBand {
  if (pack.minLevel === undefined) return { key: 'all-levels', label: 'All levels', pack };
  if (pack.maxLevel === undefined) return { key: `levels-${pack.minLevel}-and-higher`, label: `Levels ${formatNumber(pack.minLevel)} and higher`, pack };
  return { key: `levels-${pack.minLevel}-${pack.maxLevel}`, label: `Levels ${formatNumber(pack.minLevel)}–${formatNumber(pack.maxLevel)}`, pack };
}

/**
 * The pack tables grouped by class, so a reader picks a class and then a level band. A table that names several classes
 * appears under each of them. The classes keep the order of their first table, and the bands of a class run from the
 * lowest level up.
 */
export function packClasses(packs: readonly ItemUsePack[]): PackClass[] {
  const classes = new Map<string, PackClass>();
  for (const pack of packs) {
    const owners = pack.classes.length ? pack.classes.map((ref) => ({ key: slug(nameOf(ref)), label: nameOf(ref) })) : [{ key: 'all-classes', label: 'All classes' }];
    for (const owner of owners) {
      const entry = classes.get(owner.key) ?? { ...owner, bands: [] };
      entry.bands.push(band(pack));
      classes.set(owner.key, entry);
    }
  }
  for (const entry of classes.values()) entry.bands.sort((left, right) => (left.pack.minLevel ?? 0) - (right.pack.minLevel ?? 0));
  return [...classes.values()];
}

/** How many items a pack table gives, and the share of them that comes from world loot. */
export function packPicksText(pack: ItemUsePack): string {
  const count = `Gives ${formatNumber(pack.minimumPicks)} ${pack.minimumPicks === 1 ? 'item' : 'items'}`;
  const bonus = pack.bonusChance > 0 ? `, with a ${formatNumber(pack.bonusChance)}% chance of one more` : '';
  const limit = pack.maximumPicks !== undefined && pack.maximumPicks < pack.minimumPicks + 1 ? ` (at most ${formatNumber(pack.maximumPicks)})` : '';
  const world = pack.worldShare > 0 ? ` Each item has a ${formatNumber(pack.worldShare)}% chance to be random world loot instead of an item from the list.` : '';
  return `${count}${bonus}${limit}.${world}`;
}

/** Whether every table gives the same number of items with the same world loot share, so one sentence covers them. */
export function sharedPicks(packs: readonly ItemUsePack[]): boolean {
  const first = packs[0];
  return first !== undefined && packs.every((pack) => pack.minimumPicks === first.minimumPicks && pack.maximumPicks === first.maximumPicks
    && pack.bonusChance === first.bonusChance && pack.worldShare === first.worldShare);
}
