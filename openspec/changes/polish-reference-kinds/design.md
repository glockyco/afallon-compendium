## Context

See proposal.md. The currency document has a reference to its inventory item but not the item's acquisition relations. The detail route already loads an inline item for the Corruption mechanics page. All five page kinds use the same DetailFrame and relation-table primitives.

## Goals / Non-Goals

**Goals:** Keep the published document schema unchanged and derive invariant table columns from the rows being rendered, not assumptions about specific names.

**Non-Goals:** Reproject the catalog, change combat or standing rules, or create another table style.

## Decisions

- Extend the existing inline item lookup for currency pages rather than copying source relations into currency documents. The currency answer reuses ItemSourceRoutes and points its full-source links to the inventory item's page.
- Derive shared sellers from every purchase row and show them once only when all rows agree. The price cell omits its icon and name only when its actual currency key matches the page's subject currency.
- Use FactsCard for side summaries and the existing RelationTable for every relation. Suppress faction threshold and starting-point columns only where the full row set makes them invariant, preserving the Humans exception.
- Move classes into the race answer, where they sit beside the start location, and leave the larger adventurer roster as the secondary relation.

## Risks / Trade-offs

- Honor has no linked inventory item. Its existing battleground description remains its acquisition explanation; the item-route component is used only where the reference exists.
- An item's quest-reward routes and currency rewards can describe different reward mechanisms. Both remain visible when published, rather than conflating their counts.
