## Why

The list pages expose few ways to compare equipment or find quest rewards. The accepted catalog records item stats, recipe materials, and typed quest rewards, but these facts do not reach the list filters.

## What Changes

- Add an item class filter based on the game's verified equip rule. Read the native equip check before defining the published match rule.
- Add item stat and stat range filters. Distinguish fixed values from possible random values and flat values from percentages.
- Add a crafting-material filter for items that a published recipe uses.
- Add a quest reward type filter and a Class column on the ability list.
- Add a Gear column and filter to the item list. It shows the weapon type or armor type that the game's item tooltip names, such as Shield or Cloth. The Type column keeps the broad item type.
- Keep filter selections in list URLs. Link each published class page to its filtered equipment list.
- Preserve every published list row, including items with unknown equip facts. Filters must not rank equipment or claim that one item is best.

## Capabilities

### New Capabilities

- `list-filters`: Published item, quest, and ability list facts, filter behavior, URL state, and result coverage.

### Modified Capabilities

- `detail-pages`: Class pages link to the class-filtered item list.

## Impact

- Read-only evidence: the accepted catalog and bounded native review of `InventoryManager` equip methods for build 25434619.
- Catalog and contracts: expose the typed facts needed by list rows without changing game values in site code.
- Publication: `packages/publication/src/kind-registry.ts`, `lists.ts`, and the list projection path.
- Site: `apps/site/src/lib/ListTable.svelte` and the class detail page.
- Release: compare a catalog candidate with the accepted catalog, stage a publication candidate against the accepted publication, check both viewport sizes in the browser, and accept both together.
