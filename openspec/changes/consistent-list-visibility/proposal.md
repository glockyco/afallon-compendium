## Why

An ability without a known use is hidden from the default list, but searching its name still does not find it and the reveal count ignores the search. NPCs and items with no known way to meet or acquire them are meanwhile mixed into their default lists, and fixed list columns obscure useful facts when filters narrow the results.

## What Changes

- Derive a common known-way visibility facet from each published item, NPC, and ability document. Keep entries with no known way available through a counted reveal, without excluding their pages or search entries.
- Count the hidden reveal against the current name search, facets, numeric bounds, and stat filters, so a search for Shout can reveal precisely the matching hidden entry.
- Show adventurer and party-role badges, starting levels, and contextual Class and Party Role columns in NPC lists, without inventing a place for the Friends-panel roster. Remove the redundant Enemy badge from bosses.
- Derive list columns from currently matching rows and show a Damage column for a weapon-focused item list. Keep proportional fitted table widths and mobile cards.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `list-filters`: Default visibility, accurate counted reveals, contextual columns, and NPC adventurer rows.

## Impact

Publication list projections and kind metadata, site list filters and table rendering, list contracts where needed, focused tests, and list-facing OpenSpec requirements change. Published document evidence remains the source of truth; this change does not alter detail-page or map content.