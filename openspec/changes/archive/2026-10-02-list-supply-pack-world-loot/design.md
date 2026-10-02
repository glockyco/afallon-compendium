## Context

`EconomyUtilities.GetPackWorldLootPool` (RVA `0x53de50`) builds the world loot candidates of a pack table for a player level and class. The native review (`local/research/supply-pack-world-loot-20261002.md` in the main checkout) gives these rules:

- Candidates come from the global world loot tables (`RPGBuilderEconomySettings.WorldLootTables`). A table counts when the player level lies within its minimum and maximum level, where a bound of 0 or less is open. The accepted catalog has five tables (133 open, 142 up to 14, 143 7–20, 144 13–27, 145 from 20) with 306 rows.
- A quest-only item needs an active quest. The accepted world tables hold none.
- `IsPackWorldLootLevelAllowed` (RVA `0x540ff0`): an item with a level requirement above 0 needs `level - 4 <= requirement <= level + 2`. Before the character's first gear drop, the requirement must also be at most the level.
- `IsItemSuitedForPack` (RVA `0x5404e0`): a weapon needs the class's weapon type. Other equipment that is not an accessory (`IsAccessoryItem`, RVA `0x53f500`) needs the band's armor type when the band names one. Then every piece of equipment, weapons included, that has a main stat (`IsPrimaryStat`, RVA `0x5410a0`: stats 27, 28, and 135) needs one of the band's wanted stats (`HasWantedPrimaryStat`, RVA `0x53f170`). Items that cannot be equipped pass.
- In the running game, `IsAccessoryItem` is true for trinkets and for items in the ring, neck, and cape slots, and false for every other world loot item.
- The pool function weights picks by row rate. The read-only probe returned no usable weights, so the page names no chance.

## Goals / Non-Goals

**Goals:**
- List every world loot item that a band can give a playable class, with the character levels at which it can appear.
- Compute the list in publication from catalog facts with the native rules, and check it against the game.

**Non-Goals:**
- A chance per world loot item. The weights change with the character's level and the other candidates.
- The first gear drop rule. Until a character's first gear drop, world loot also needs a requirement at or below the character's level (`FirstGearDropPending`, RVA `0x53b870`). The code that ends this state is not identified, so the page does not describe it, and the levels shown apply after the first gear drop.

## Decisions

### Compute level windows, not fixed-level pools

For each band and class, publication evaluates every character level from the band's lowest level to its highest, or for an open band to the level beyond which no requirement can still qualify. An item lists the levels at which it is a candidate as one or more ranges. An item that is still a candidate at the last evaluated level of an open band shows no upper level.

### The rules match the game's own pools

A read-only HotRepl check called `GetPackWorldLootPool` for Shieldmaster levels 1 and 6, Wizard level 22, Hunter level 22, and Berserker level 30, and `IsAccessoryItem` for all 303 world loot items (`local/research/runtime-20261002/supply-pack-*.result.json` in the main checkout). The first comparison found two differences from the native review: capes are accessories, and weapons also need a wanted main stat. With both corrected, the computed pools match the game's pools item for item in all five cases.

### Classes match weapons by name

The class weapon types and the item weapon types match by name, as the list filters do, because the capture keeps no weapon type ids.

## Risks / Trade-offs

- The rules come from decompiled code and five sampled pools. → A later build that changes accessory slots or item types needs the same runtime comparison before its publication is accepted.
- Bands get longer. → The world loot list sits under the band's own items, and long lists open with a Show all control.
