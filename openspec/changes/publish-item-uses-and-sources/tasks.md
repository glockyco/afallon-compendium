## 1. Record the verified game rules

- [ ] 1.1 Record the native rules of `ItemPackLootBag`, `VisualEffectsManager` with `Chest`, `ClothDrops`, `DungeonTimerManager`, `DungeonFinderService`, `HuntTanneryDirector`, `EconomyUtilities.QuestItemDropAllowed`, and `InteractableObject.TriggerActions` from the research batches under `.agent/skills/native-analysis/SKILL.md`. Verify the binary hash, the method ranges, and the diagnostics of each batch.
- [ ] 1.2 Record the action counts of each owner type and action type from a read-only HotRepl probe, with the build identity. Verify that the counts include the actions of templates, and that only item owners give items, loot tables, currencies, or recipes.
- [ ] 1.3 Record the use checks of Adventurer's Supply Pack, Slime covered sack, and Epic renown reward on a research character. Verify that the character save is restored byte for byte.

## 2. Scan and catalog

- [ ] 2.1 Read the actions of every owner type in the collectors. Verify fixtures for an inline list, a template list, and a non-item owner with an Item action.
- [ ] 2.2 Read the visual effects of interactable objects and item actions, and the Chest components and Chest actions of each prefab that a template can spawn. Verify fixtures for a grave, the sacrificial altar, and Slime covered sack against the offline chest read.
- [ ] 2.3 Read the `DungeonTimerManager`, `QuestFieldInteraction`, and `HuntTanneryDirector` components and `DungeonFinderSettings`. Verify fixtures for a dungeon timer, a hunt pickup with its task, and the supply pack setting.
- [ ] 2.4 Keep owner actions, item loot bindings with requirement groups, visual effect chests, and scene grants in the catalog. Report a grant of a non-item owner and each unresolved target as coverage issues. Verify a fixture where an item and an interactable object share one loot table.
- [ ] 2.5 Keep the supplemental cloth rows in the drop query with the Humanoid and Undead rule. Verify a fixture that returns the Linen Cloth row with its tier ramp.
- [ ] 2.6 Run a targeted scan that includes Challenge stone Lumberjack, and build a catalog candidate. Compare it with the accepted catalog. Verify that every counted action from task 1.2 is present, and report the loot tables that still have no owner.

## 3. Publication

- [ ] 3.1 Project the verified use results of items: loot table contents with their requirements, and visual effect chests. Verify fixtures for Adventurer's Supply Pack, Slime covered sack, Epic renown reward without contents, and an unverified action type.
- [ ] 3.2 Project From items, Collected from rows for visual effect chests, Dungeon rewards, quest pickup rows, and cloth world loot rows. Count them in coverage and in item source kinds. Verify fixtures for each source and for a loot table with two owners.
- [ ] 3.3 List the items that still have no source, including the 20 records that `correct-published-records` left published and the Task board giver. Record one decision for each item: an exclusion entry with evidence of its kind, or a kept page. Verify each decision against a recorded read-only catalog query.

## 4. Reader surfaces

- [ ] 4.1 Show the Contents section and the use lines of the hero. Verify Adventurer's Supply Pack, Slime covered sack, and Epic renown reward in the browser at 1440 px and 390 px.
- [ ] 4.2 Show the new source sections, their How to get it lines, and their hover summary lines. Verify Druid staff, Human skull, Corruption Token, Boar Haunch, and Linen Cloth in the browser at both widths.

## 5. Stage and accept

- [ ] 5.1 Publish a candidate from the compared catalog candidate, and stage it against the accepted publication. Verify zero publication issues, a valid graph, and parity with only the listed removals.
- [ ] 5.2 Check the staged site at 1440 px and 390 px. Verify the pages from section 4, the coverage count of items without a known source, and no sideways scroll.
- [ ] 5.3 Write an update report, and accept the catalog and publication candidates together. Verify that the former publication remains the rollback.
- [ ] 5.4 Run the targeted scan, catalog, publication, and site tests. Run the repository checks once. Verify that `openspec validate publish-item-uses-and-sources --strict` passes.
