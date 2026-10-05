## Why

The Effects list opened in alphabetical order, so a reader browsing it first met rare or one-off effects such as adventurer pet entries. The Stats list already opens with the most common entries first. A list whose default sort is not by name also lost a reader's name sort, or its direction, on reload, because the address omitted values that matched the name defaults rather than the list's own defaults.

## What Changes

- The Effects list opens sorted by how many sources apply each effect, most applied first, with ties in name order.
- A list address omits only the list's default sort and a column's first-click direction, so any chosen sort survives a reload, and a hand-written address without a direction reads in the column's natural order.
- Numeric column headings keep their sort arrow on the left of the label, so the label lines up with the numbers below it.

## Impact

- Publication: the Effects kind entry gains a default sort.
- Site: shared list sorting and table heading styles.
