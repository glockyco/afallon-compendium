## Context

`shownRowCount` in `apps/site/src/lib/detail/relation-table.ts` gave the visible rows of relation tables and place lists. The item source lists, the boss cards of places, the recipe uses of items, and the ability user previews each compared their length with eight on their own.

## Goals / Non-Goals

**Goals:** One rule for every list that hides rows, owned by one function.

**Non-Goals:** Changing sort orders, row anchors, or the controls themselves.

## Decisions

- Show every row up to ten. Above ten, show eight. The owner proposed these numbers: the smallest hidden part is three rows, and a short list never needs a click.
- Every list that hides rows calls `shownRowCount`. The ability page creates its full user section only when the preview hides rows, so the preview and the section agree.

## Risks / Trade-offs

- [A list of nine or ten rows is longer on first view] → Two more rows cost less than a control that opens one or two rows.
