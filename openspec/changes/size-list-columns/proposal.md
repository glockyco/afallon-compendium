## Why

List tables left their widths to the browser's automatic table layout, which gives spare width to the columns with the longest content. On the recipe list the name column took half the table and the other values sat far from it, and single lists carried special cases to patch the result. The recipe list also repeated each row's name in a Product column, and some lists showed a column whose value is the same in every row.

## What Changes

- List tables size each column to its widest value or heading, with caps for names and texts that name other things, and fill their card by giving the spare width to the last column that is not a number.
- When the columns do not fit, names and texts shrink first and labels after them, down to floors. Numbers and badges are never cut. A table that does not fit at its floors scrolls inside its card.
- A cut value ends in an ellipsis and shows its whole value as its title. A column with the same value in every row is not shown.
- The recipe list no longer publishes a Product column. The row links the product already.

## Capabilities

### New Capabilities

### Modified Capabilities
- `list-filters`: list column widths follow their values instead of a type-column special case.

## Impact

`apps/site/src/lib/list-layout.ts`, `ListTable.svelte`, `DataTable.svelte`, `compendium.css`, and the recipe list of `packages/publication` (`kind-registry.ts`, `lists.ts`). The recipe list resource loses its Product column.
