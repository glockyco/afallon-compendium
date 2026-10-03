import { categoryLabel, type EntityRef, type PublicItem } from '@afallon/contracts/public';

export interface HeroicItemOption {
  ref: EntityRef;
  slot: string;
  rarity?: string;
}

/** The item page's eligibility is authoritative, including creature drop locations and paused areas. */
export function heroicItemOption(item: PublicItem): HeroicItemOption | undefined {
  if (!item.facts.heroic) return undefined;
  const slot = item.facts.slot ?? item.facts.weaponSlot ?? (item.facts.itemType === 'WEAPON' ? 'Weapon' : 'Other');
  return { ref: item.ref, slot: categoryLabel(slot), rarity: item.facts.rarity };
}

export function sortHeroicItemOptions(options: HeroicItemOption[]): HeroicItemOption[] {
  return options.sort((a, b) => a.slot.localeCompare(b.slot, 'en') || a.ref.name.localeCompare(b.ref.name, 'en') || a.ref.key.localeCompare(b.ref.key, 'en'));
}
