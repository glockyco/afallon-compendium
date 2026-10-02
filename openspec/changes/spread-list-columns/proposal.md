## Why

Lists gave all their spare width to the last column that is not a number. A list wider than its values therefore packed its values against the left edge, as Recipe, Station, and Skill did with 364 px of blank card at the right, or opened one wide gap in the middle, as Type did in the property list (613 px) and the item list (200 px). The skill list showed a recipe count that was 0 for eleven of seventeen skills, and the guide list showed only names.

## What Changes

- A list's spare width first shows cut texts in full, as before, and the rest spreads in equal parts between neighbouring columns, and after the last column when its values are left-aligned. A part shows after a left-aligned value or before a number, so the space between values is the same across the row. A name keeps its cap and gains only its own part.
- The skill list names each skill's type, Crafting, Gathering, or Weapon, from the ways it gains experience, and counts recipes and gathering nodes, blank where they do not apply.
- The guide list shows what each guide explains.

## Capabilities

### New Capabilities

### Modified Capabilities
- `list-filters`: list columns share spare width evenly, and the skill and guide lists say what each entry is.

## Impact

The site (`list-layout.ts`) and the publication (`kind-registry.ts`, `lists.ts`). The kind list and root schemas are unchanged.
