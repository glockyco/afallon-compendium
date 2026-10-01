## Why

A list with more than eight rows showed eight and a Show N more control. A list of nine rows therefore hid one row behind "Show 1 more", which reads as a mistake and costs a click to see one row.

## What Changes

- A list of up to ten rows shows every row.
- A longer list shows its first eight rows and Show N more, so N is always at least three.
- The relation tables, the place lists, the source lists of items, the boss cards of places, the recipe uses of items, and the ability user previews follow this one rule.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `detail-pages`: long lists show their whole length up to ten rows, and hide at least three rows otherwise.

## Impact

Site only: the shared row count of `apps/site/src/lib/detail/relation-table.ts` and the lists that had their own limit of eight.
