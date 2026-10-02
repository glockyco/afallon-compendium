## 1. Rules record

- [ ] 1.1 Write a new rules record for build 25653798 from the accepted record. Rewrite the Loot phrases so that each phrase leads into its links, and keep the link and the `linked` placement of the supply pack rules only on `supply-pack-tables`. Verify that the record validates, that only Loot phrases, links, and placements differ, and register it.
- [ ] 1.2 Build a catalog candidate with the new rules record. Verify that the catalog comparison shows only the changed Loot rules.

## 2. Contracts and publication

- [ ] 2.1 Replace `steps` and `rules` of the mechanics documents with `sections`, reduce the public rule to `{id, status, phrase, operands, links}`, replace `stepId` with `section` in `PlacedRule`, remove the Corruption `evidence` and `unknowns`, and give every changed schema a new id. Migrate the contract tests and fixtures.
- [ ] 2.2 Replace `guide-steps.ts` with guide sections. Group the rules of each topic by record section, fail on an undefined or empty section, resolve placed rules to sections, and give the Corruption rules sections without evidence text. Add the dungeon reward placed rule of items. Verify the publication tests for the five guides, an undefined section, an empty section, and the placed sections of items, NPCs, and gathering nodes.

## 3. Site

- [ ] 3.1 Add `GuideSection.svelte` and a rule phrase with a "Show N more" control for more than ten links. Render the five guides as sections with their data. Remove `GuideSteps.svelte`, `MechanicsRules.svelte`, and `rule-numbers.ts`.
- [ ] 3.2 Link How it works to section anchors from every caller, and show the How it works link of Found in objects.
- [ ] 3.3 Add the `param` property to `TabSet` and show the supply pack bands with class and level tabs. Verify that the level band stays selected across classes.
- [ ] 3.4 Check the five guides, Adventurer's Supply Pack, Soaked Bag, Human Skull, Linen Cloth, Boar Haunch, Runeweave Regalia, a corrupted reward item, the Corruption Token, Small Iron Vein, a skill, an NPC, a quest, and a class in the browser at 1440 px and 390 px, with every How it works link landing on its section and no sideways scroll.

## 4. Publication and acceptance

- [ ] 4.1 Publish a candidate against the accepted publication and stage it. Verify publication validation and the parity checks.
- [ ] 4.2 Write the update report, accept the update, stage the accepted publication in the main checkout, and sync the delta specs.
