## 1. Verify game rules before using them

- [ ] 1.1 Find the action trigger of dialogue text nodes, effects, scene regions, and stats with bounded Ghidra analysis under `.agent/skills/native-analysis/SKILL.md`. Record which list each owner reads and when a template replaces it. Check other recovered types field by field, and add an owner only with a confirmed field. Verify the binary hash, the method ranges, the diagnostics, and each ambiguous branch.
- [ ] 1.2 Record the result of the LootTable, Item, Currency, NPC, Point, Faction, and Effect actions in the action handler. Confirm an ambiguous branch with a use on a research character. Verify that each published action type has a recorded result.
- [ ] 1.3 Count the actions of each owner type and action type with a read-only HotRepl probe. Record the counts with the build identity. Verify that the counts include the actions of templates.

## 2. Scan and catalog

- [ ] 2.1 Read the actions of the owners from task 1.1 in the collectors. Add a dialogue collector that records each text node with actions, its dialogue, and its starting NPCs, without text. Verify fixtures for an inline list, a template list, and a node without an NPC.
- [ ] 2.2 Keep the actions by owner in the catalog, and bind each LootTable target to its owner. Record unresolved owners and targets as coverage issues. Verify a fixture where an item and a dialogue node share one loot table.
- [ ] 2.3 Run a targeted scan and build a catalog candidate. Compare it with the accepted catalog. Verify that every counted action from task 1.3 is present, and report the loot tables that still have no owner.

## 3. Publication

- [ ] 3.1 Project the verified use results of items: Contents rows, currency amounts, companions, and recipes. Verify fixtures for a renown box, a gold sack, a companion contract, and an unverified action type.
- [ ] 3.2 Project From items and From dialogue sources, and count them in coverage and in item source kinds. Verify fixtures for both sources and for a loot table with two owners.
- [ ] 3.3 Project dialogue recipe teachers with the first-match rule of the game. Verify fixtures for a dialogue teacher, a node with two Recipe actions, and a recipe without a teacher.
- [ ] 3.4 List the items that still have no source, including the 20 records that `correct-published-records` left published and the Task board giver. Record one decision for each item: an exclusion entry with evidence of its kind, or a kept page. Verify each decision against a recorded read-only catalog query.

## 4. Reader surfaces

- [ ] 4.1 Show the Contents section and the use lines of the hero. Verify Epic renown reward, Slime covered sack, and Adventure 2 companion in the browser at 1440 px and 390 px.
- [ ] 4.2 Show the From items and From dialogue sections, their How to get it lines, and their hover summary lines. Verify an item from a renown box and an item from dialogue in the browser at both widths.
- [ ] 4.3 Show dialogue and other teachers on recipe pages. Verify a recipe with a dialogue teacher in the browser at both widths.

## 5. Stage and accept

- [ ] 5.1 Publish a candidate from the compared catalog candidate, and stage it against the accepted publication. Verify zero publication issues, a valid graph, and parity with only the listed removals.
- [ ] 5.2 Check the staged site at 1440 px and 390 px. Verify the pages from section 4, the coverage count of items without a known source, and no sideways scroll.
- [ ] 5.3 Write an update report, and accept the catalog and publication candidates together. Verify that the former publication remains the rollback.
- [ ] 5.4 Run the targeted scan, catalog, publication, and site tests. Run the repository checks once. Verify that `openspec validate publish-item-uses-and-sources --strict` passes.
