## 1. Evidence and catalog

- [x] 1.1 Record the talent tooltip rule of `AbilityTooltip.GenerateBonusTooltip` from build 25653798 with the binary hash, the method range, the decoded string literals, and the localization values. Verify the count of talents with pet stat changes and the count of talents whose stat is a percentage stat without its own percentage flag in the accepted catalog.
- [x] 1.2 Name the bonus rank and pet change types in the catalog contract. Apply the item percentage rule to talent stat changes and pet stat changes in progression normalization. Verify a catalog test for an own change and a pet change on a percentage stat.

## 2. Publication and page

- [x] 2.1 Add pet stat groups with a `kind` union to the public talent rank contract, and bump the static class schema identifier once.
- [x] 2.2 Publish the pet stat groups. Verify publication tests for a beast change, an NPC summon change, a missing NPC, and a species change.
- [x] 2.3 Check talent ranks in the tooltip coverage audit. Verify that a species change makes the audit report the talent rank.
- [x] 2.4 Show one line for the character's changes and one line for each group of pets. Verify Bonded Fury, Pathfinding, and Heart of the Pack on the Hunter page, and Bone Bulwark on the Necromancer page, at 1440 px and 390 px.

## 3. Validation

- [x] 3.1 Run `openspec validate show-pet-talent-effects --strict`, the catalog, publication and site tests, and the repository checks.
