## 1. Contracts

- [ ] 1.1 Extend the catalog contracts: availability rules, requirement spans, placement areas, world quest facts, gated sources, interaction rows, and the new quest row kinds and fields. Verify that `bun run check:packages` reports only errors in the modules that the later tasks change.
- [ ] 1.2 Extend the public contracts: requirement spans, availability rules, quest starts, objective text and completions, unlocks, world changes, world quest facts, collected-from rows, NPC spawn conditions, and place quest objectives. Increase the item, NPC, quest, and place document schema IDs. Verify with the contract schema tests.

## 2. Catalog

- [ ] 2.1 Build reward, reward-choice, and item-given quest rows from `quest_rewards`. Set the association item endpoint and the `quest` item source only for item rewards. Verify with a query test for a currency reward that carries a stale item ID.
- [ ] 2.2 Drop NPC quest bindings whose NPC is not a quest giver, and record `inactive-quest-binding`. Verify with a query test.
- [ ] 2.3 Decode quest chain name, objective text, and completion text from localization, and derive the minimum level from mandatory level requirements. Verify with normalization and unit tests.
- [ ] 2.4 Emit `world-quest-offer`, `interaction-quest`, and `interaction-task` associations and `world_quest_facts`. Verify with a world relation test that uses a pool zone and object actions.
- [ ] 2.5 Emit `interaction` item sources for interactive object `Chest` actions. Verify that an item with only an interaction source has no unmodeled-source blocker.
- [ ] 2.6 Compute `source_gates` from own requirements and requirement toggles. Verify activation, deactivation, timed, nested, and sibling-path cases.
- [ ] 2.7 Compute `placement_areas`. Verify nested regions, a point outside every region, and a different map space.
- [ ] 2.8 Build requirement spans and labels for quest states and numeric comparisons. Verify with query tests.
- [ ] 2.9 Query starts, offers, objective completions, gated sources, interaction rows, availability, and areas. Verify with query tests against a fixture database.

## 3. Publication

- [ ] 3.1 Project quest starts, objectives, rewards, chain, unlocks, world changes, and world quest facts. Verify with projection tests.
- [ ] 3.2 Project item interaction rows and availability, NPC spawn conditions, and place quests and quest objectives. Verify with projection tests.
- [ ] 3.3 Use areas for placement labels and NPC name disambiguation. Verify with reference tests.
- [ ] 3.4 Update quest list columns and facets, search place and level, and the graph placement check. Verify with index resource and graph tests.

## 4. Site

- [ ] 4.1 Render linked requirement spans and availability rules. Verify on an item, an NPC, and a quest page in the browser.
- [ ] 4.2 Render the quest page starts, objectives, rewards, chain, unlocks, world changes, and world quest facts. Verify on a world quest, an object-start quest, a chain quest, and a region-objective quest.
- [ ] 4.3 Render the quest tooltip summaries, item collected-from rows, NPC spawn conditions, and place quests. Verify in the browser.
- [ ] 4.4 Render the new quest list columns and facets. Verify a type and area filter in the browser.

## 5. Runtime level range

- [ ] 5.1 Probe `QuestLevelRange` in the running game, add the level range and dungeon to the canonical collector, scan the canonical target, and add the manifest to the catalog plan. Verify the probe output against the in-game quest journal.
- [ ] 5.2 Decode the level range and dungeon, and publish them on the quest page, tooltip, and list. Verify in the browser.

## 6. Delivery

- [ ] 6.1 Run package, site, and dependency checks and the test suite.
- [ ] 6.2 Rebuild the catalog, publish, stage against the current publication, build, and preview. Verify the defects in proposal.md are gone in the browser, and record measurements in `EXPLORATION.md`.
