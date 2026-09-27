## 1. Publication

- [ ] 1.1 Replace native-ID fallbacks in `readableSuffixes` and `ensureUniqueNames` with deterministic ordinals, keep `n<nativeId>` anchors, and verify with updated `references.test.ts` cases for a place and a variant
- [ ] 1.2 Fill place `properties` from property places and verify with a publication test that a place lists its property

## 2. Shared detail components

- [ ] 2.1 Extract `floating.ts` from `EntityTooltip`, add `Hint`, and move `MissingValue` to it, then verify in the browser that tooltips and hints open beside their anchors, one at a time
- [ ] 2.2 Add `relation-table.ts` with `planColumns`, `mergeRoles`, and `visibleRows`, and verify with unit tests for empty, default, shown-elsewhere, heading-stated, and single-row columns, role merges, separate condition rows, unique spot counts, and hidden-row targets
- [ ] 2.3 Add `TitleBlock`, `Hero`, `Section`, `FactList`, `LinkGrid`, and `RelationTable`, remove `overflow-wrap: anywhere` from `EntityLink`, and verify with `bun run --cwd apps/site check`

## 3. Page components

- [ ] 3.1 Build the item page and the item hover tooltip summary, and verify an item with several sources and an item without a source in the browser
- [ ] 3.2 Build the NPC page, and verify Thornmaw, Fenric Doryn, Skeleton Warrior, Outlaw Rogue, and a merchant in the browser
- [ ] 3.3 Build the place page, and verify Duskfall Depths and Afallon in the browser
- [ ] 3.4 Build the quest page, and verify a chain quest and a world quest in the browser
- [ ] 3.5 Build the property, ability, and recipe pages with the recipe product load, and verify Oakenvale Inn, Cleave, and a recipe in the browser
- [ ] 3.6 Switch the route to `DetailPage`, delete the replaced components and unused CSS, and verify that a search finds no references to them

## 4. Verification and acceptance

- [ ] 4.1 Run `openspec validate restructure-detail-pages --strict`, `bunx tsc -b packages/contracts`, `bun run check`, `bun run --cwd apps/site check`, and `bun test ./packages ./apps`
- [ ] 4.2 Publish a preview candidate from the accepted catalog and verify the publication graph
- [ ] 4.3 Take screenshots of every kind at 1440 px and 390 px, and confirm no side-by-side cards, no sideways scroll, no words broken inside, and no native ids
- [ ] 4.4 Accept the publication
- [ ] 4.5 While archiving, update the `reference-layout` Purpose to name only tooltips, quest previews, search feedback, and navigation
