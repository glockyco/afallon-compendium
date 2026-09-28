## Why

Long detail pages make it hard to find a section. Future zone and talent views also need tabs that retain a reader's choice in the address. Current class talent rows have anchor links, so tabs must not hide their targets.

## What Changes

- Add a shared tab set with `tab` query state, browser history, keyboard operation, and screen-reader tab semantics.
- Reveal the owner tab before following a section or row anchor inside that tab. Keep existing row expansion for anchors in long relation tables.
- Add an "On this page" list when a detail page has at least four rendered sections. Apply it to class, NPC, place, and item pages.
- Put the list beside the page content at 1440 px. Provide a compact, operable list above the sections at 390 px.
- Do not add zone content or talent grids. The zone and talent changes consume the shared tab set later.

## Capabilities

### New Capabilities

- `page-navigation`: URL-backed tabs, anchor revelation, and section-list behavior across screen widths.

### Modified Capabilities

- `detail-pages`: class, NPC, place, and item pages gain navigation for their rendered sections without changing section contents or anchor IDs.

## Impact

- Site: shared components in `apps/site/src/lib/detail/`, section rendering and page composition in `apps/site/src/lib/detail/pages/`, and row-anchor handling in `RelationTable.svelte`.
- Data: no scan, catalog, contract, or publication change. Section IDs and talent row anchors already exist in the published pages.
- Dependencies: `build-compendium-hub` owns `/` and `/map`. `publish-overworld-zones` and `show-talent-trees` consume this tab set. `explain-character-progression` later replaces class Experience sections without changing this navigation rule.
