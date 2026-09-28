## 1. Shared tab behavior

- [ ] 1.1 Build `TabSet` in `apps/site/src/lib/detail/` with stable tab keys, unique control IDs, URL `tab` state, shallow history updates, and a visible selected panel. Verify in a browser fixture that `?tab=grid` opens Grid, an absent key opens the first tab, and an unknown key is replaced without a new history entry. Check that unrelated query fields survive and Back and Forward restore the selected panel.
- [ ] 1.2 Add tab-list roles, labels, selected state, roving focus, and Left, Right, Home, End, and Tab behavior. Verify with keyboard interaction and a browser accessibility snapshot that focus wraps, every tab names its panel, and hidden content leaves the focus and accessibility trees.
- [ ] 1.3 Share URL selection across tab sets with the same keys on one page. Verify with two List/Grid tab sets that choosing Grid in either set changes both panels, uses one `tab` value, and gives each tab and panel a unique ID.

## 2. Anchor revelation

- [ ] 2.1 Resolve published section and row anchor IDs to their owning tab before scrolling. Preserve unrelated URL fields, replace a conflicting tab value in the same history entry, and clear an old fragment on an explicit tab selection. Verify direct links, unknown fragments, Back and Forward, and repeated same-fragment clicks in a browser fixture.
- [ ] 2.2 Coordinate tab revelation with `RelationTable.svelte` row expansion. Keep its current 15-row limit and anchor IDs. Verify `#talent-21-5` in a tab fixture and a fixture row beyond position 15. Each link opens the owner tab, expands its table if needed, and scrolls the row into view without a timer.

## 3. Section navigation

- [ ] 3.1 Add a page-scoped section registry using the existing `Section.svelte` ID and heading. Register mounted sections in DOM order, remove unmounted sections, and exclude hidden tab content. Verify with a page fixture that a fourth rendered section adds the list, removal of that section hides it, and no link targets an absent section.
- [ ] 3.2 Add the shared "On this page" navigation and its section layout. Keep section cards in one content column, add a sticky side list at 1440 px, and a compact keyboard- and touch-operable disclosure above sections at 390 px. Verify in the browser that each link reaches its heading and neither width scrolls sideways.
- [ ] 3.3 Apply the section layout to class, NPC, place, and item pages. Audit remaining detail kinds, including quests, and apply it wherever four sections can render. Verify with pages containing present and absent optional sections that labels, order, and anchors match only rendered headings. Verify Shieldmaster's tree headings and an NPC without Sells.

## 4. Integration and acceptance

- [ ] 4.1 Check the implemented site in a browser at 1440 px and 390 px. Exercise class, NPC, place, and item outlines and the four-section threshold. Exercise `?tab=grid`, a conflicting `?tab=grid#talent-21-5` link, row expansion, keyboard tabs, and Back and Forward in a browser fixture. Record visible section targets, focus behavior, and absence of horizontal page scroll.
- [ ] 4.2 Run the site type check and the relevant focused checks. Confirm no scan, catalog, contract, or publication artifact changed. Run `openspec validate add-page-navigation --strict` and confirm it passes.
