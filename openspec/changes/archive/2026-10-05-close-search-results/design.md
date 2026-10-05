## Decisions

- The field is a combobox with a listbox of results, so assistive technology announces the highlighted result while focus stays in the field.
- Closing on focus loss checks whether focus moved into the results, so tabbing to a result or its map link keeps the list open.
- A navigation clears the query, because the next page has a different subject and stale results would hide its heading.
