## Why

The Versions table of an ability page put each version's whole tooltip, an Applies effects heading with its effect rows, and a users disclosure into three cells of one row. The rows grew tall and uneven, the users opened inside a cell, and on a phone the column headings broke into loose labels.

## What Changes

- The Versions section compares the versions side by side in the layout of creature versions: one column per version, headed by its icon, and one row per fact.
- The rows are what the version does, the effects it applies, its use requirements and learning classes when the versions differ in them, and its users when any version has users. A version without a value reads None.
- Each version's users show their first eight links with Show N more, and the answer's Show all link opens every version's users.
- Creature versions and ability versions share one comparison component, and link grids shrink their columns inside narrow cells.

## Capabilities

### Modified Capabilities

- `detail-pages`: the Versions section of ability pages.

## Impact

Site only: the Versions section, a shared comparison component used by both Versions and Variants, and the link grid column width.
