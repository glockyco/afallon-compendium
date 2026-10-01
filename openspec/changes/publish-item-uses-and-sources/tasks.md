## 1. Record the verified game rules

- [ ] 1.1 Record the native rules of `ClothDrops`, the rewards of `DungeonTimerManager`, the completion rewards of `DungeonFinderService`, `HuntTanneryDirector`, `EconomyUtilities.QuestItemDropAllowed`, and the visual effect path of `InteractableObject.TriggerActions` from build 25653798 under `.agent/skills/native-analysis/SKILL.md`. Write them into a new rules record with the placements of the design. The item use rules of `ItemPackLootBag` and `VisualEffectsManager` with `Chest` are already the Loot rules. Verify the binary hash, the method ranges against the unwind table, the diagnostics of each batch, and that catalog creation accepts the record.
- [ ] 1.2 Record the game action counts of each owner type from a read-only HotRepl probe of build 25653798, with the build identity. Verify that the counts include the actions of templates, and that among the probed owners only items give items, loot tables, currencies, or recipes. List the templates with Item or Recipe actions and their owners in the probe and the accepted catalog.
- [ ] 1.3 Record the use checks of Adventurer's Supply Pack, Slime covered sack, and Epic renown reward on a research character of build 25653798. Verify that the character save is restored byte for byte.

## 2. Scan and catalog

- [ ] 2.1 Read the actions of every owner type in the collectors. Verify fixtures for an inline list, a template list, and a non-item owner with an Item action.
- [ ] 2.2 Read the visual effects of interactable objects, and the Chest components and Chest actions of each prefab that their templates can spawn. Verify fixtures for a grave, the sacrificial altar, and Slime covered sack against the offline chest read.
- [ ] 2.3 Read the `QuestFieldInteraction` and `HuntTanneryDirector` components and `DungeonFinderSettings`. The corruption collector already reads `DungeonTimerManager`. Verify fixtures for a hunt pickup with its task and the supply pack setting.
- [ ] 2.4 Keep owner actions, visual effect chests of world objects, and scene grants in the catalog. Report a grant through the game actions of a non-item owner and each unresolved target as coverage issues. Verify a fixture where an item and an interactable object share one loot table.
- [ ] 2.5 Mark the supplemental cloth rows with the verified creature rule, and keep them in the drop query. Verify a fixture that returns the Linen Cloth row with its tier ramp.
- [ ] 2.6 Run a targeted scan that includes Challenge stone Lumberjack, and build a catalog candidate. Compare it with the accepted catalog. Verify that every counted action from task 1.2 is present. Report the loot tables and the game action templates that still have no owner.

## 3. Publication

- [x] 3.1 Project the verified use results of items. `show-item-use-effects` publishes the When used section with the supply pack bands and the chests of visual effects, so this change adds no Contents section.
- [ ] 3.2 Project From items rows for the items of supply pack bands and use chests, Collected from rows for visual effect chests of world objects, Dungeon rewards for the Corruption Token, quest pickup rows, and cloth world loot rows. Count every source kind, including dungeon rewards, in coverage. Verify fixtures for each source, for a loot table with two owners, and for an altar sacrifice with its cost and its number of prefabs.
- [ ] 3.3 List the items that still have no source, including the Task board giver. Record one decision for each item: an exclusion entry with evidence of its kind, or a kept page. Verify each decision against a recorded read-only catalog query.

## 4. Reader surfaces

- [ ] 4.1 Show the new source sections, their How to get it lines, and their hover summary lines. Verify Druid Staff, Poison Sword, Human skull, Frost Shard Necklace, Corruption Token, Boar Haunch, and Linen Cloth in the browser at 1440 px and 390 px.

## 5. Stage and accept

- [ ] 5.1 Publish a candidate from the compared catalog candidate, and stage it against the accepted publication. Verify zero publication issues, a valid graph, and parity with only the listed removals.
- [ ] 5.2 Check the staged site at 1440 px and 390 px. Verify the pages from section 4, the coverage count of items without a known source, and no sideways scroll.
- [ ] 5.3 Write an update report, and accept the catalog and publication candidates together. Verify that the former publication remains the rollback.
- [ ] 5.4 Run the targeted scan, catalog, publication, and site tests. Run the repository checks once. Verify that `openspec validate publish-item-uses-and-sources --strict` passes.
