import { expect, test } from 'bun:test';
import type { PublicItem } from '@afallon/contracts/public';
import { heroicItemOption, sortHeroicItemOptions } from './item-picker-options';

function gear(name: string, slot: string, eligible: boolean): PublicItem {
  return {
    ref: { key: `items:${name}`, kind: 'items', name, slug: name.toLowerCase().replaceAll(' ', '-') },
    facts: { slot, rarity: 'Rare', ...(eligible ? { heroic: { statBonusPercent: 50 } } : {}) },
  } as PublicItem;
}

test('Heroic picker includes eligible weapons, armor and trinkets, not gear limited to paused places', () => {
  const items = [gear('Dragon Rend', 'MAIN HAND', true), gear('Felglass Greatsword', 'MAIN HAND', false),
    gear('Runed Boots', 'FEET', true), gear('Moon Charm', 'Trinket', true)];
  const choices = sortHeroicItemOptions(items.flatMap((item) => heroicItemOption(item) ?? []));
  expect(choices.map(({ ref, slot, rarity }) => [ref.name, slot, rarity])).toEqual([
    ['Runed Boots', 'feet', 'Rare'], ['Dragon Rend', 'main hand', 'Rare'], ['Moon Charm', 'trinket', 'Rare'],
  ]);
});
