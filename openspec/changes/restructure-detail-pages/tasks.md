## 1. Publication

- [x] 1.1 Replace native-ID fallbacks in `recordLabels` and `ensureUniqueNames` with deterministic ordinals, keep `n<nativeId>` anchors, and verify with updated `references.test.ts` cases for a place and a variant
- [x] 1.2 Fill place `properties` from property places and verify with a publication test that a place lists its property
- [ ] 1.3 Return the start position of each teleport from the catalog transition query, publish `ConnectionRow` v2 with `direction` in place document v5, leave out dungeon entrance triggers and leftover teleporter copies, and stop on an unknown transition kind, then verify with publication tests for each direction, the trigger, a copy, a teleport outside its map without a copy, and an unknown kind
- [x] 1.4 Leave out zero stats, compare variant stats and faction changes without their order, and stop when two loot lists of one NPC have the same rule, then verify with publication tests

## 2. Shared detail components

- [ ] 2.1 Extract `floating.ts` from `EntityTooltip`, add `Hint`, and move `MissingValue` to it, then verify in the browser that tooltips and hints open beside their anchors, one at a time
- [ ] 2.2 Add `relation-table.ts` with `planColumns`, `mergeRows`, `uniquePlacements`, and `shownRowCount`, and verify with unit tests for empty, default, shown-elsewhere, heading-stated, and single-row columns, role merges, separate rows for different values, unique spot counts, and the row limit
- [ ] 2.3 Add `TitleBlock`, `Hero`, `Section`, `FactList`, `LinkGrid`, and `RelationTable`, remove `overflow-wrap: anywhere` from `EntityLink`, and verify with `bun run --cwd apps/site check`

## 3. Page components

- [ ] 3.1 Build the item page and the item hover tooltip summary, and verify an item with several sources and an item without a source in the browser
- [ ] 3.2 Build the NPC page, and verify Thornmaw, Fenric Doryn, Skeleton Warrior, Outlaw Rogue, and a merchant in the browser
- [ ] 3.3 Build the place page with connection directions and start spots, and verify Duskfall Depths, Afallon, Cave (Coalway Woods 1), and Sanctum of the Veilpiercer in the browser
- [ ] 3.4 Build the quest page, and verify a chain quest and a world quest in the browser
- [ ] 3.5 Build the property, ability, and recipe pages with the recipe product load, and verify Oakenvale Inn, Cleave, and a recipe in the browser
- [ ] 3.6 Switch the route to `DetailPage`, delete the replaced components and unused CSS, and verify that a search finds no references to them

## 4. Verification and acceptance

- [ ] 4.1 Run `openspec validate restructure-detail-pages --strict`, `bunx tsc -b packages/contracts`, `bun run check`, `bun run --cwd apps/site check`, and `bun test ./packages ./apps`
- [ ] 4.2 Publish a preview candidate from the accepted catalog and verify the publication graph
- [ ] 4.3 Take screenshots of every kind at 1440 px and 390 px, and confirm no side-by-side cards, no sideways scroll, no words broken inside, and no native ids
- [ ] 4.4 Accept the publication
- [ ] 4.5 While archiving, update the `reference-layout` Purpose to name only tooltips, quest previews, search feedback, and navigation
