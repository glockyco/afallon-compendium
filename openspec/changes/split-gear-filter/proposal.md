## Why

The item list's Gear filter mixed weapon types and armor types in one alphabetical list, so Cloth sat between Bow and Crossbow and Jewelry between Fist Weapon and Leather. A reader looks for one kind of gear at a time.

## What Changes

- The Gear filter becomes two filters, Weapon and Armor, each its own collapsible group. Their values and the Usable by, Slot, and Type filters stay the same.
- Item list addresses use `weapon=` and `armor=` instead of `gear=`.
- List names stay on one line and end in an ellipsis, because a few long variant names left a wide empty band between short names and their type. The tooltip and the page still show the whole name. The item list gives the spare width to its Type column instead of the name.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `list-filters`: The item list offers Weapon and Armor filters instead of one Gear filter, and list names stay on one line.

## Impact

- `packages/publication/src/kind-registry.ts` and `lists.ts`, their test, `apps/site/src/lib/list-filters.ts`, and `ListTable.svelte`.
- A new publication, checked in a browser and accepted.
