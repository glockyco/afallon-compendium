## 1. Calculate Drops by Roll

- [x] 1.1 Let the odds engine find any of a set of items, and calculate each creature loot list row with its own list only. Verify with loot-odds and publication tests, including an item in two lists of one creature.
- [x] 1.2 Calculate World Loot for every creature level as runs of equal chances, with the chance that a kill gives any World Loot, and calculate cloth chances per kill without rounding. Verify with publication tests against the Footman's Bulwark level 10 chance and an item of the general World Loot list.

## 2. Publish the Groups

- [x] 2.1 Change the drop row, item, and Loot guide schemas: drop rows lose `creatureLevel` and `chanceLevel`, items gain `worldLoot`, and the Loot guide gains World Loot and cloth by creature level. Move the fightable-NPC rule into the public contracts. Verify with the contract tests and `bun run check`.
- [x] 2.2 Publish World Loot in items and the Loot guide instead of in `droppedBy`, keep the creature drops rule on pages that show World Loot, and count World Loot as a source in coverage, list visibility, search source kinds, and the enchanting materials of the crafting guide. Remove the catalog's World Loot reference level. Verify with the publication and catalog tests.
- [x] 2.3 Record whether an NPC is a dummy target in the catalog, and give dummy targets no World Loot or cloth. Verify in the running game that dummy targets cannot be killed while ordinary creatures can, build a candidate catalog, and compare it with the accepted one.

## 3. Show the Groups

- [x] 3.1 Show World Loot and Cloth groups on creature pages at the selected creature level, prerendered at the lowest level and loaded from the Loot guide for other levels. Verify with `bun run --cwd apps/site check` and the site tests.
- [x] 3.2 Split item pages into Dropped by, World Loot, and Cloth Loot sections, with a World Loot route and chance-per-kill cloth wording in How to get it and in page descriptions. Verify with the site tests.
- [x] 3.3 Show World Loot and cloth at a chosen creature level in the Loot guide with the creature page tables. Verify with the site tests.

## 4. Verify the Publication

- [x] 4.1 Publish from the accepted catalog, stage it, and compare it with the accepted publication. Verify that every World Loot row of `droppedBy` appears in its item's `worldLoot`, that creature chances change only for items in several lists of one creature, and that the graph and staging checks pass.
- [x] 4.2 Open Fangbloom, Rotbound Effigy, a scaling creature, Deathseer, Bloodtrack Gloves, Jade Band, Silk Cloth, and the Loot guide at 1280 and 390 px. Verify the groups, levels, and wording, a creature level change, and no horizontal overflow.
