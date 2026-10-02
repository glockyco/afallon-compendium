## Why

The site uses "creature" for things you fight and "NPC" for anyone, but several labels called every NPC a creature. Every NPC page without drops, merchants and adventurers included, opened with a Drops card that said "No drops are published for this creature." The Variants line, the ability user labels, quest world changes, and the coverage gaps did the same. Adventurer pages also did not show the gear that the adventurer can take, and a gathering node page said "Placed by scenes".

## What Changes

- An NPC page opens with Drops when the NPC drops something, with Gear for an adventurer, and with an empty Drops card naming the NPC only for an NPC you fight. A friendly NPC without drops has no answer card.
- The Gear card of an adventurer gives the chance that a finished job takes an upgrade from the reward gear list, links that list, and shows the adventurer's own gear kit.
- Labels that cover every NPC say NPC: the Variants line names the NPC, ability users are NPCs, a quest world change of an NPC is an NPC, and the coverage page lists NPCs without a map location or level. Adventurer-only items are items only adventurers can get.
- Gathering node pages say Placed in the world instead of Placed by scenes.
- The NPC document schema moves to `compendium.static-npc.v10` for the adventurer gear. Item types come from one derivation for item pages, the guide, and NPC pages.

## Capabilities

### New Capabilities

### Modified Capabilities
- `detail-pages`: NPC pages choose their answer card by what the NPC offers and show adventurer gear.
- `reader-coverage`: NPC gaps name NPCs.

## Impact

`packages/contracts` (NPC adventurer gear), `packages/publication` (`npcs.ts`, `item-type.ts`, `items.ts`, `mechanics.ts`), and site components (`NpcPage`, `DetailFrame`, `DropsSection`, `VariantsSection`, ability and quest sections, `GatheringNodePage`, coverage route).
