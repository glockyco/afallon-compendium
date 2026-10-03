## Decisions

- Publish the default in the Effects kind entry, as the Stats list does, so the site reads one source of truth for each list's opening order.
- Treat a missing direction in the address as the column's first-click order: A to Z for text, high to low for numbers. This matches clicking a heading and keeps addresses short. The list's default sort keeps its own published direction.
- Reverse the flex order of a numeric heading's label and arrow instead of hiding the idle arrow's space, so the arrow stays discoverable on hover and focus without shifting the label.

## Risks / Trade-offs

An address saved before this change with `?sort=name` on the Stats list now reads A to Z instead of the list's descending default, which is what the address says.
