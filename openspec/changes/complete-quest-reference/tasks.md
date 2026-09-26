## 1. Contracts

- [x] 1.1 Extend the catalog contracts: availability rules, requirement spans, placement areas, world quest facts, gated sources, interaction rows, and the new quest row kinds and fields. Verify that `bun run check:packages` reports only errors in the modules that the later tasks change.
- [x] 1.2 Extend the public contracts: requirement spans, availability rules, quest starts, objective text and completions, unlocks, world changes, world quest facts, collected-from rows, NPC spawn conditions, and place quest objectives. Increase the item, NPC, quest, and place document schema IDs. Verify with the contract schema tests.

## 2. Catalog

- [x] 2.1 Build reward, reward-choice, and item-given quest rows from `quest_rewards`. Set the association item endpoint and the `quest` item source only for item rewards. Verify with a query test for a currency reward that carries a stale item ID.
- [x] 2.2 Drop NPC quest bindings whose NPC is not a quest giver, and record `inactive-quest-binding`. Verify with a query test.
- [x] 2.3 Decode quest chain name, objective text, and completion text from localization, and derive the minimum level from mandatory level requirements. Verify with normalization and unit tests.
- [x] 2.4 Emit `world-quest-offer`, `interaction-quest`, and `interaction-task` associations and `world_quest_facts`. Verify with a world relation test that uses a pool zone and object actions.
- [x] 2.5 Emit `interaction` item sources for interactive object `Chest` actions. Verify that an item with only an interaction source has no unmodeled-source blocker.
- [x] 2.6 Compute `source_gates` from own requirements and requirement toggles. Verify activation, deactivation, timed, nested, and sibling-path cases.
- [x] 2.7 Compute `placement_areas`. Verify nested regions, a point outside every region, and a different map space.
- [x] 2.8 Build requirement spans and labels for quest states and numeric comparisons. Verify with query tests.
- [x] 2.9 Query starts, offers, objective completions, gated sources, interaction rows, availability, and areas. Verify with query tests against a fixture database.
- [x] 2.10 Name the task target as the counterpart of each objective row, so that NPC and item pages list the quests that target them. Verify with a query test and a projection test.

## 3. Publication

- [x] 3.1 Project quest starts, objectives, rewards, chain, unlocks, world changes, and world quest facts. Verify with projection tests.
- [x] 3.2 Project item interaction rows and availability, NPC spawn conditions, and place quests and quest objectives. Verify with projection tests.
- [x] 3.3 Use areas for placement labels and NPC name disambiguation. Verify with reference tests.
- [x] 3.4 Update quest list columns and facets, quest search level, item search source kinds, and the graph placement check. Verify with index resource and graph tests.

## 4. Site

- [x] 4.1 Render linked requirement spans and availability rules. Verify on an item, an NPC, and a quest page in the browser.
- [x] 4.2 Render the quest page starts, objectives, rewards, chain, unlocks, world changes, and world quest facts. Verify on a world quest, an object-start quest, a chain quest, and a region-objective quest.
- [x] 4.3 Render the quest tooltip summaries, item collected-from rows, NPC spawn conditions, and place quests. Verify in the browser.
- [x] 4.4 Render the new quest list columns and facets. Verify a type and area filter in the browser.
- [x] 4.5 Publish quest start types as IDs and label each value of a list cell that shares its ID with a facet. Verify the quest start-type filter and an NPC row with several roles in the browser.

## 5. Runtime level range

- [x] 5.1 Probe `QuestLevelRange` in the running game and add the `quest-levels` collector to the canonical family. Verify that the ranges agree at the main menu and in the world, that `FormatPrefix` renders the same ranges, and that a candidate scan of the installed build produces a valid artifact.
- [x] 5.2 Admit the optional `quest-levels` artifact from the canonical target, decode the level range and dungeon, and publish them on the quest page, tooltip, and list. Verify with catalog and projection tests.
- [ ] 5.3 Publish the level ranges from a complete scan of the installed build through the game update workflow.

## 6. Delivery

- [x] 6.1 Run package, site, and dependency checks and the test suite.
- [ ] 6.2 Rebuild the catalog, publish, stage against the current publication, build, and preview. Verify the defects in proposal.md are gone in the browser, and record measurements in `EXPLORATION.md`.
