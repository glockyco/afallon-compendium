## Why

Some items exist only for adventurers, the simulated players of the world. In 0.16.3 the stronger tank kits of Agra Emberhide, Brielle Dawnfield, and Eldeth Goldvein are such items. Their pages say "No known way to get this item.", so a reader cannot tell an adventurer-only item from a source that the compendium has not found yet.

## What Changes

- Publish the adventurer world settings as item relations: kit upgrades (with the adventurer that receives them), equipment bands (with the content level from which adventurers carry the item), and job rewards (with the reward chance).
- An item page lists these relations in an Adventurers section and links the adventurer.
- When an item has no player source but adventurers carry it, How to get it says that only adventurers carry it, instead of "No known way to get this item."
- Coverage counts adventurer-only items separately from items without any known source.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `item-property-presentation`: item pages show adventurer kits, equipment bands, and rewards, and name adventurer-only items.
- `reader-coverage`: coverage separates adventurer-only items from items without a known source.

## Impact

- Catalog relations from the adventurer world settings rows that `update-game-0-16-3` records.
- Publication item documents and coverage; the site item page and its How to get it answer.
