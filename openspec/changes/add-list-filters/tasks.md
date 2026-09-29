## 1. Verify the equipment rule

- [ ] 1.1 Follow `.agent/skills/native-analysis/SKILL.md` in the main checkout. Verify the build 25434619 binary hash and bounded unwind ranges for `InventoryManager.CanEquipWeaponFromBag`, `GetRequirementFailedMessage`, and the relevant equip paths. Review decompilation and assembly for both hands and armor. If a branch remains unclear, use a bounded read-only HotRepl probe. Record which captured fields determine class compatibility, and verify one allowed weapon, one disallowed weapon, and one armor case before task 2.1.
- [ ] 1.2 Query the accepted catalog for item types and weapon types, class `allowedWeaponTypes`, fixed and random stat units, recipe material roles, and all typed quest rewards. Verify that the proposed comparison uses matching captured names and identify any missing source field. If a missing field requires capture, add a targeted scan task before catalog projection and compare that scan with the accepted evidence.

## 2. Catalog and list contract

- [ ] 2.1 Expose each quest's distinct reward types from the `given` and `pick` sets, including rewards with no target, through the catalog query that publication reads. Exclude `itemGiven`, which supplies quest items. Verify with a focused query test that an experience-only row appears, a choice retains its type, and an `itemGiven` row alone does not mark a quest as rewarding an item.
- [ ] 2.2 Extend the public list row contract with typed fixed and possible random stat amounts and percentage units. Cut over the static list schema and all manifest references, resource edges, graph checks, loader merge, and fixtures to the new version without a legacy alias. Verify contract decoding and graph checks for a list with two stat units and a random interval.
- [ ] 2.3 Build a catalog candidate from the accepted scan inputs. Compare its tables and rows with accepted catalog `3d602d72deaba6489e02b00babda425718cc5f5694090e1975e6465fe1e1f4`, including counts for item stats, recipe materials, class detail fields, and quest rewards. Record every difference and verify that no reachable source record disappears. If task 1.2 requires a scan, use the reviewed new scan in the candidate instead.

## 3. Publication

- [ ] 3.1 Project each published class's verified equipment matches into item list facets in `packages/publication/src/lists.ts`. Use captured weapon types and the rule from task 1.1. Keep unknown items on the unfiltered list. Verify with a focused fixture test that an allowed weapon matches, a disallowed weapon does not, and armor follows the verified branch.
- [ ] 3.2 Project item fixed stats, random ranges, units, and the Crafting material facet from `PublicItem.facts` and `usedInRecipes`. Preserve Item power in its existing numeric column. Verify with a fixture that a material matches, its product alone does not, and the random interval remains possible rather than fixed.
- [ ] 3.3 Add Reward type to the quest registry facets and Class to the ability registry columns. Build the quest facet from the typed catalog query and the ability column from distinct published class learners across versions. Verify that a quest with an unlinked experience reward matches Experience, a choice reward matches Item, and an ability keeps NPC users in Used by.
- [ ] 3.4 Project the gear type into item list rows as a Gear column and facet from the published weapon type or armor type. Verify with a fixture that a shield shows Shield, a cloth armor piece shows its armor type, and a material has an empty cell.
- [ ] 3.5 Measure the generated list shards against the current publication size budget. Compare item, quest, and ability row counts with the prior publication. Verify that the new filter metadata does not remove an unfiltered row or make a shard exceed the budget.

## 4. Site

- [ ] 4.1 Extend `apps/site/src/lib/ListTable.svelte` with stat selection and inclusive minimum and maximum bounds. Match captured fixed values or intersecting random ranges only in the selected unit. Show the matched amount as fixed or possible. Verify an interval boundary and a flat-versus-percentage case with a focused behavior test or a throwaway browser exercise.
- [ ] 4.2 Render the Class, Crafting material, Gear, and Reward type filter controls through the existing list pattern. Keep `class`, `stat`, stat bounds, and reward choices in the URL alongside existing `slot`, search, and sort. Verify in the browser that direct links, reload, Back, Forward, and Clear filters restore the expected rows and control values.
- [ ] 4.3 Link each published class detail page to `/items` with its Class filter selected. Verify in the browser that Shieldmaster opens the same results as selecting Shieldmaster on the item list and that the URL contains no legacy path.
- [ ] 4.4 Check all new filter labels, amount indicators, and the ability Class column in the browser. Verify that reader text has no record ids or raw enum words, that blank class cells do not invent a learner, and that no filtered result is ranked or recommended.

## 5. Publish and accept

- [ ] 5.1 Author the publication plan with the catalog candidate from task 2.3. Publish a candidate and stage it against the accepted publication. Verify zero new publication issues and passing graph and update parity checks. Record the row counts and the expected list-only changes.
- [ ] 5.2 Inspect the staged publication in a browser at 1440 px and 390 px. Exercise item class, stat, range, material, gear, and combined URL filters, quest reward types, the ability Class column, and class-page gear links. Verify the unfiltered counts, readable labels, responsive layout, and no horizontal page overflow at 390 px.
- [ ] 5.3 Author an update report and accept the catalog candidate and publication candidate together. Verify that the accepted build names both candidates and retains the previous accepted publication as rollback.
- [ ] 5.4 Run targeted contract, catalog, publication, and site checks for changed behavior, then the repository's final type checks and test suite. Run `openspec validate add-list-filters --strict`. Verify that each command passes and remove throwaway verification scripts.
