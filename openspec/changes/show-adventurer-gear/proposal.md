## Why

The Adventurers guide says that completed jobs can upgrade an adventurer's gear, but not which gear. A reader who wants to know what an adventurer can end up wearing has to open item pages one by one. The item pages also describe an equipment band as the gear that adventurers "carry" from a level, although the band only sets the adventurer level from which an item can be picked as an upgrade.

## What Changes

- The Gear upgrades section of the Adventurers guide explains, from build-matched native code, how an upgrade is picked: the reward gear list, the item's adventurer level, the start at a random item, the class and score checks, arrival gear, and gear kits.
- The section lists the reward gear with each item's type and adventurer level, and each adventurer's gear kit.
- Item pages state in one sentence that the item is on the reward gear list from its adventurer level, name the adventurer whose kit holds it, and link the guide section.
- The mechanics document schema moves to `compendium.static-mechanics.v13`.

## Capabilities

### New Capabilities

### Modified Capabilities
- `mechanics-pages`: the Adventurers guide lists the gear that adventurers can take.
- `item-property-presentation`: item pages describe adventurer gear correctly and link the guide.

## Impact

Rules record 19 adds four verified rules and five evidence objects, so the catalog is rebuilt. `packages/contracts` (guide schema, item placement target), `packages/publication` (`mechanics.ts`, the shared `item-type.ts`, guide lead), and the site (`GuidePage.svelte`, `AdventurerGearTables.svelte`, `ItemPage.svelte`).
