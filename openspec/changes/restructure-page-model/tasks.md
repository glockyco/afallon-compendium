## 1. Rules and catalog

- [ ] 1.1 Add rule placements to the rules record contract in `packages/contracts/src/catalog/mechanics.ts`, with closed unions of page kinds, targets, and scopes. Make catalog creation reject a rule without a topic and without a placement, and a placement with an unknown page kind, target, or scope. Verify catalog tests for each rejection and for a rule without a topic.
- [ ] 1.2 Write a new rules record with the placements of the design table. Keep the text, status, operands, links, and evidence of every rule of the accepted record `8e29163c`. Verify with a comparison script that only placements differ. Register the record, build a catalog candidate, and verify that the candidate differs from the accepted catalog only by the placements.

## 2. Publication

- [ ] 2.1 Split the registry flag into `pages` and `list`. Remove recipe documents and routes, keep the Recipes list, and resolve recipe references to `#crafting` of the product or to the skill recipe row. Add search aliases for recipe names that differ from their products. Verify publication tests for Runeweave Regalia, Ring of Bleed Damage, and Demonic Bulwark Looted.
- [ ] 2.2 Project the Crafting section, the hero Crafted line, the Teaches crafting block, and Used in recipes links on item documents, with a new item schema version. Verify fixtures for a crafted item with a teaching item, a recipe name that differs from its product, and a recipe whose skill does not resolve.
- [ ] 2.3 Project placed rules on facts, columns, and How it works sections, with the `linked`, `spawned`, and `placed` scopes. Remove the rule id conditions in `packages/publication/src/gathering.ts`. Compute the yield bonus values. Verify fixtures for Silver Vein, Small Iron Vein, a creature experience range, and the Mining page.
- [ ] 2.4 Project guide documents with an overview, steps, key values, a worked example, and all rules with evidence, with a new mechanics schema version. Verify fixtures for each guide and a failure for a step that names a missing rule.
- [ ] 2.5 Add the `recipeWithoutProduct` gap, point recipe gaps to their Crafting sections or skill rows, and read embedded recipe keys in parity. Verify coverage and parity tests with a baseline that has recipe pages.

## 3. Reader surfaces

- [ ] 3.1 Show one crafting block component in the Crafting and Teaches sections. Show the Crafted line, remove the recipe page component and route, and link Recipes list rows to Crafting sections. Verify Runeweave Regalia, Recipe: Runeweave Regalia, Bolt of Runeweave, Bloodthrall Signet, and the Recipes list in the browser at 1440 px and 390 px.
- [ ] 3.2 Show placed rules as label explanations and in How it works sections. Verify Silver Vein, Small Iron Vein, one creature page, and the Mining page in the browser at both widths, including hover, focus, and tap.
- [ ] 3.3 Show the guide layout and name the three guides in the Mechanics navigation group. Verify the three guides in the browser at both widths, with the disclosure closed on load and open on selection.

## 4. Stage and accept

- [ ] 4.1 Publish a candidate from the catalog candidate, and stage it against the accepted publication `f5fc5486`. Verify zero publication issues, a valid graph, and parity without a missing key.
- [ ] 4.2 Check the staged site at 1440 px and 390 px. Verify the pages from section 3, a not-found page at a former recipe route, search for Ring of Bleed Damage, the coverage recipe gaps, and no sideways scroll.
- [ ] 4.3 Write an update report, and accept the catalog and publication candidates together. Verify that `f5fc5486` remains the rollback.
- [ ] 4.4 Run the targeted contract, catalog, publication, and site tests. Run the repository checks once. Verify that `openspec validate restructure-page-model --strict` passes.
