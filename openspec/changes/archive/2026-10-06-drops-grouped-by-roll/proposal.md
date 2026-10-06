## Why

Every kill that rewards the player runs three separate rolls, and the site shows only the first. `EconomyUtilities.GenerateDroppedLoot` rolls each of the creature's own loot lists, then World Loot, and then, for Humanoid and Undead creatures, cloth, and puts the results in one loot bag. Creature pages list only the own loot lists, which is also all that the in-game Adventure Guide shows, so readers cannot see that a level 27 kill gives World Loot on 11.4% of kills or that an Undead kill gives cloth on 75%. Item pages put World Loot into the same table as creatures, which leaves its Level column empty for every creature row and repeats one creature list's rule on every row. An item that two of a creature's lists contain shows their combined chance in both lists' tables, and cloth tables call per-kill chances "base rates".

## What Changes

- Creature pages show one group per roll of a kill: each own loot list, then World Loot, then cloth. World Loot and cloth show their items and chances per kill at the creature level, and they follow the creature level control that the page already offers for its experience and combat stats.
- A creature loot list's row shows that list's chance per kill, so an item in two lists of one creature has a different chance in each list.
- Item pages show creature drops, World Loot, and cloth in separate sections. The World Loot section gives the item's chance per kill at each creature level that can drop it, and the How to get it answer has its own World Loot route.
- Cloth chances are chances per kill, worded like every other drop chance.
- The Loot guide shows World Loot and cloth at a chosen creature level, from the same data that creature pages use.
- **BREAKING** (publication contract): World Loot leaves an item's `droppedBy` rows, and a drop row no longer has `creatureLevel` or `chanceLevel`. Items publish `worldLoot`, and the Loot guide publishes World Loot and cloth by creature level.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `detail-pages`: Creature drops are grouped by roll, World Loot and cloth appear on creature pages, item pages separate World Loot from creature drops, and each loot list row shows its own chance.
- `item-property-presentation`: How to get it has a World Loot route, and cloth chances are per kill.
- `mechanics-pages`: The Loot guide shows World Loot and cloth by creature level.
- `reader-coverage`: World Loot counts as an item source.

## Impact

`packages/publication` computes World Loot and cloth by creature level once, publishes them in the Loot guide and in each item, and computes creature drop chances per loot list. `packages/contracts/src/public` changes the drop row, item, and Loot guide schemas and shares the rule for which NPCs a player can fight. In `apps/site`, creature pages load the Loot guide for levels that their prerendered data does not cover, and the item, creature, and Loot guide pages render the new groups. The catalog, the rules record, and the evidence stay unchanged, and the catalog stops deriving the unused World Loot reference level. A new publication from the accepted catalog carries the changes.
