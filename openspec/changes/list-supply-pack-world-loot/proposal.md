## Why

Each band of Adventurer's Supply Pack gives a 50% chance per item to be world loot instead of an item from the band's list. The page explains world loot in words, but it does not say which items those are, so readers cannot tell what a pack can give them. The native world loot rules of build 25653798 are known (`local/research/supply-pack-world-loot-20261002.md` in the main checkout), and the accepted catalog holds every input.

## What Changes

- Publication computes, for each pack band and playable class, the world loot items that the band can give and the character levels at which each can appear.
- The supply pack page lists those items under each band, beside the band's own items.
- The rule that the page does not enumerate a world pool at a fixed level is replaced: the page lists every item that can appear at some level of the band, with its levels.
- **BREAKING** The item document's pack bands carry their world loot, so the static item schema id changes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `item-property-presentation`: Supply pack bands list their world loot items with character levels.

## Impact

- Catalog query for the world loot tables and their level windows.
- Publication `packages/publication/src/documents/items.ts` and a world loot module.
- Contracts `ItemUsePackSchema` and the static item schema id.
- Site `apps/site/src/lib/detail/sections/SupplyPackBand.svelte`.
- A read-only HotRepl check of `EconomyUtilities.GetPackWorldLootPool` against the computed lists before acceptance.
