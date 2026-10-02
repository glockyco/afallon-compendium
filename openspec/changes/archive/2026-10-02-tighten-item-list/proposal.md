## Why

At 1100 px the item list's table gets 758 px beside the filter panel, and 19 of the first 40 rows of a list sorted by Strength wrap onto two or three lines. Three of its columns repeat each other: a weapon row reads "Weapon | Two Handed Sword | Two Hand", so the hands appear twice and the broad type adds nothing that the weapon type does not say. In the filter panel, the Item power, Level, and Stats headings sit on their separator line, and nothing shows that the filter groups open and close.

## What Changes

- The item list shows one Type column that names what an item is: the weapon type of a weapon, the slot of jewelry, the armor type and slot of other armor, and the item type of anything else. The Gear, Slot, and Type filters stay, so no filter is lost.
- Every group of the filter panel, including Item power, Level, and Stats, opens and closes from its heading. The heading shows a chevron that turns with the group, as in the map sidebar, and the number of active filters in the group.
- Item names keep wrapping instead of ending in an ellipsis, because variants of one item differ only at the end of their names, such as "Poison Blade (Uncommon)" and "Poison Blade (Rare)".

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `list-filters`: The item list names what each item is in one Type column, and every filter group opens and closes from a heading with a chevron.

## Impact

- `packages/publication/src/kind-registry.ts` and `lists.ts` (item columns and row values), their tests.
- `apps/site/src/lib/ListFilterPanel.svelte` and `ListTable.svelte`.
- A new publication, checked at 1440, 1100, and 390 px, and accepted.
