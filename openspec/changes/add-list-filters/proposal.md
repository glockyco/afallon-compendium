## Why

The browse lists are the main way into the compendium for a new reader. The item list has 1,198 rows, but it filters only by slot, type, and rarity, and each filter takes one value. A reader cannot find the gear that a class can use, a weapon or armor type, items with a stat, or crafting materials. The quest list cannot be filtered by reward. On a phone, the filter fields fill the first screen before any result shows.

## What Changes

- On wide screens, lists show their filters in a sidebar beside the results. On phones, a Filters button opens a sheet with the same filters and a button that shows the result count.
- A filter can take several values. Each value shows how many results it would give. Active filters show as removable chips above the results, with Clear all. Values that every row shares are not offered.
- The item list gets Usable by (class), Gear (weapon or armor type), Used in crafting, and stat filters. A stat filter takes a minimum and a maximum, and several stats can be combined. Each filtered stat shows as a sortable column.
- The quest list gets a Reward type filter.
- **BREAKING** Item list rows carry their stat amounts and gear type, and the static kind-list schema gets a new id.
- Each class page links to the item list with its class selected.
- Filters never rank items or call one item better than another.

## Capabilities

### New Capabilities

- `list-filters`: The filter panel, the item and quest filters, URL state, and the rule that filters do not rank.

### Modified Capabilities

- `detail-pages`: Class pages link to the gear that the class can use.

## Impact

- Read-only evidence: native review of the equip check of build 25653798 and the accepted catalog `d3b56f3f`.
- Contracts: the list row stat entries and the static kind-list schema id.
- Catalog: a query that returns the reward types of each quest.
- Publication: `packages/publication/src/kind-registry.ts` and `packages/publication/src/lists.ts`.
- Site: `apps/site/src/lib/ListTable.svelte` and new filter components, and the class page.
- Release: publish a candidate from the accepted catalog, check the lists in a browser at 1440 px, 1100 px, and 390 px, and accept the publication.
