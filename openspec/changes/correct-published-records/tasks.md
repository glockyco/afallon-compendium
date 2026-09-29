## 1. Verify the remaining scene evidence

- [ ] 1.1 Run a read-only HotRepl probe that calls `Application.CanStreamedLevelBeLoaded` for the entry name of each of the 42 scene records. Record the results with the build identity. Verify that the 30 matched records load, and record the result of each of the 12 unmatched records.
- [ ] 1.2 Find the scene load of effect teleports and game action teleports with bounded Ghidra analysis under `.agent/skills/native-analysis/SKILL.md`. Record the field of `RPGGameScene` that names the loaded scene. Verify the binary hash, the method ranges, the diagnostics, and the assembly of each ambiguous branch.
- [ ] 1.3 Check in the game whether a player can use the two frost challenge stones in the overworld. Record their active state, their requirements, and the result of use. Verify with a screenshot or a probe result for each stone.
- [ ] 1.4 Trace the owners of the effects that target Searing Plains and Tutorial ICE cave. Decide the five candidate scene records and the two frost challenge scene records from tasks 1.1 to 1.3. Exclude a record only when it cannot load, no region carries its name, it has no placement, and nothing that a player can trigger leads to it. Write the decision and its evidence into this task.

## 2. Contracts and the exclusion list

- [ ] 2.1 Add `compendium.publication-presentation.v2` with exclusion entries of a catalog key, a reason code, and evidence text. Verify that the schema rejects an entry without evidence, an unknown reason code, and a duplicate key.
- [ ] 2.2 Add the static exclusions resource with the excluded keys and reason codes, and reference it from the root. Verify that the graph check rejects a key that is both excluded and published.
- [ ] 2.3 Add a required `startingGearOf` array to the item document schema, and increase its version. Verify schema fixtures for an item with three classes and an item with none.
- [ ] 2.4 Write the v2 presentation input from the accepted v1 input. Add Savers (`skills:4` and 13 recipes), 9 test-named items, 30 appearance options, SM_hc_Inn, Iron Vein Icon, Test Area, The Void, and the records from task 1.4. Verify each evidence text against a recorded read-only catalog query.

## 3. Publication

- [ ] 3.1 Select records before reference building. Keep excluded records in reference building for their names, and keep them out of name qualification, lists, search, and counts. Convert each reference to an excluded record to the unresolved text form before the graph check, and omit relation rows whose counterpart is excluded. Verify fixtures for a qualifier that disappears, a requirement that names an excluded recipe as text, and a graph check that passes.
- [ ] 3.2 Check each exclusion again against the catalog with the check of its kind. Verify that a fixture fails and names the entry when an excluded item gains a source, when an excluded NPC gains a placement, and when the key is unknown.
- [ ] 3.3 Project `startingGearOf` rows from the starting items of each class with a page. Count them as a source in coverage and in item source kinds. Verify that Novice Staff has three classes, Rune Shield has none, and the fixture coverage counts the source.

## 4. Site and staging

- [ ] 4.1 Show the Starting gear of How to get it line with links to the Starting gear sections of the class pages, and its hover summary line. Verify Novice Staff and both Simple Iron Swords in the browser at 1440 px and 390 px.
- [ ] 4.2 Remove the highest-level rule for crafting skills from the hub. Verify in the browser that the hub lists the same crafting skills as before.
- [ ] 4.3 Make parity accept a missing baseline key only when the exclusion resource of the candidate names it. Verify focused parity tests for a listed removal and an unlisted removal.

## 5. Stage and accept

- [ ] 5.1 Publish a candidate from accepted catalog `6bc13a4c` with the v2 presentation input. Stage it against accepted publication `5f9bea82`. Verify zero publication issues, a valid graph, and parity with only the listed removals.
- [ ] 5.2 Check the staged site at 1440 px and 390 px. Verify that search finds no Dev Ring, Savers, Hair 1, SM_hc_Inn, or Test Area. Verify that Purge the Plagued Field still lists its giver without a name, the skill list, the place names from task 1.4, and the coverage count of items without a known source.
- [ ] 5.3 Write an update report and accept the publication. Verify that the accepted catalog stays `6bc13a4c` and that the former publication remains the rollback.
- [ ] 5.4 Run the targeted contract, publication, parity, and site tests. Run the repository checks once. Verify that `openspec validate correct-published-records --strict` passes.
