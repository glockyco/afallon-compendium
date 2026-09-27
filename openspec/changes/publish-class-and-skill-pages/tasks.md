## 1. Race evidence and catalog

- [x] 1.1 Project `availableClasses` of each race into the race gameplay in `packages/scan/src/probes/collectors/support.csx`, with an unavailable row for a null list member. Verify with a read-only HotRepl probe that Dwarf, Human, and Orc each list Shieldmaster, Wizard, Necromancer, Assassin, and Druid, and that every other support table equals the scanned v2 evidence.
- [x] 1.2 Decode the class lists into a `races` progression fact, and derive the offered classes, in `packages/catalog/src/progression.ts` and `packages/catalog/src/queries.ts`. Verify with tests: a class that a race names is offered, and a class ID without a record becomes a missing-reference issue and is not offered.
- [x] 1.3 Build the phrases of the `Bonus`, `Ability`, and `StatCost` requirement types in `requirementSpans`, and add the names of talents, level templates, and talent points to the reference index of the queries. Verify with query tests for "Weighted Strikes rank 4 or higher", "Cleave learned", and "Costs 9 Mana", and that no requirement label of the candidate catalog contains a record id such as "bonuses 288".
- [x] 1.4 Run `local/scan-25434619-scene-44.json`, point `local/catalog-progression-25434619.sh` at the new run, and build the catalog candidate. Verify that the scan succeeds with a clean `runtime-cleanup.json`, that the candidate offers exactly the five classes, and that the row comparison with the accepted catalog 80fe12e0 shows only progression facts, race facts, new conditions, and the scan-to-scan differences of scene 44. Result: scan fa12e638 succeeded with a clean receipt, and catalog candidate 6bc13a4c offers exactly the five classes. The comparison shows the progression tables, 695 new conditions, five missing references in the game data, and the scene 44 variation of the previous change (eight placement heights, world sources, and unplaced sources).

## 2. Contracts

- [ ] 2.1 Add `classes` and `skills` to the public page kinds, and add the schemas `compendium.static-class.v1`, `compendium.static-skill.v1`, and `compendium.static-ability.v4` in `packages/contracts/src/public/documents.ts`. The ability version gains its learners and its use requirements. Verify that `bunx tsc -b packages/contracts` passes and that the contract tests accept a fixture document of each new schema.

## 3. Publication

- [ ] 3.1 Set `pages: true` and `searchable: true` for `classes` and `skills` in the kind registry, with the list columns Talent trees and Abilities for classes, and Highest level and Recipes for skills. Give a class a page only when a race offers it. Verify with a reference test: Shieldmaster has a slug, and Hunter has none.
- [ ] 3.2 Give each talent tree row the anchor `talent-<tree>-<node>`, and resolve talent references on a class page to the row of the same class. Verify with a reference test: a Heroic Ascension talent that appears in two trees resolves to the row of the class that owns the page.
- [ ] 3.3 Project class documents: the races, weapon types, auto attack, talent points, and highest level in the hero; one table for each talent tree with rows by tier and position, first-rank and last-rank effects, and node requirements; the starting gear; and the experience per level. Verify with a projection test on a fixture class with two trees and a five-rank talent, and verify that the largest class document of the candidate is smaller than 262,144 bytes.
- [ ] 3.4 Project skill documents: the recipes with their products and stations, the automatic flag, and the experience up to the highest level. Verify with projection tests for a crafting skill, a weapon skill, and a skill with a highest level of zero.
- [ ] 3.5 Project the learners of each ability version, only for classes with a page, with the tree, the tier, the node requirements, and the row link, and project the use requirements of each version. Verify with projection tests for an ability from a talent tree, an auto attack, and an ability whose only class has no page.
- [ ] 3.6 Compare the level and the experience limit of the loaded research character with the class level template through a read-only probe, and set the label of the experience column from the result. Verify that the probe result decides the label, and write the result into this task.
- [ ] 3.7 Build the list rows and the search entries of classes and skills. Verify with a list test that a class row shows its number of talent trees and abilities, and that the search entries include classes and skills.

## 4. Site

- [ ] 4.1 Add the class page with its talent tree, starting gear, and experience sections, and dispatch it in `DetailPage.svelte`. Verify in the browser at 1440 px and 390 px that the Shieldmaster page shows its sections in the order of the spec and does not scroll sideways.
- [ ] 4.2 Add the skill page, and dispatch it in `DetailPage.svelte`. Verify in the browser that the Alchemy page shows 15 of its 22 recipes with a control that shows all, and that the Axes page shows 300 experience rows behind the same control.
- [ ] 4.3 Add the Learned by section, and show the use requirements in the ability hero and in the Versions table. Verify in the browser that the Maul page names Druid, Primal Feral, and tier 2, that its link opens the Maul row on the Druid page, and that the Barbed Quarrel page shows "Costs 9 Mana" and no Learned by section.
- [ ] 4.4 Add the class, skill, and talent tooltips, and dispatch them in `TooltipPresenter.svelte`. Verify in the browser that a class link, a skill link, and a talent requirement each show their tooltip on hover and on focus.
- [ ] 4.5 Verify in the browser that the top navigation, with Classes and Skills, keeps one row of links at 1440 px and two rows at 390 px.

## 5. Publication and acceptance

- [ ] 5.1 Author a publish plan with the new catalog, publish a candidate, and stage it with the accepted publication 808fafa2 as its baseline. Verify that the publish run reports no publication issues, and that the graph and update parity checks pass.
- [ ] 5.2 Check the staged candidate in the browser at 1440 px and 390 px: the class and skill pages and lists, search, the ability pages, and a class requirement on an item page that now links its class. Verify each scenario of this change, and write the results into this task.
- [ ] 5.3 Author the update report, and accept the catalog candidate and the publication candidate together. Verify that the accepted build names both candidates and keeps 808fafa2 as its rollback.

## 6. Checks

- [ ] 6.1 Run `bunx tsc -b packages/contracts`, `bun run check`, `bun run --cwd apps/site check`, `bun test ./packages ./apps`, and `openspec validate publish-class-and-skill-pages --strict`. Verify that each command passes.
