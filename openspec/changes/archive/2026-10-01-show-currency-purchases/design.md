## Context

The raw item decoder already reads `convertToCurrencyId`, but item-fact normalization does not retain it. `merchant_stock` records currency entity keys and costs, and publication already groups merchant offers for `soldBy` on product items. The site uses `RelationTable`, `EntityLink`, and `Price` for related content. Existing catalog and publication plans can rebuild candidates from stored evidence without scanning.

## Goals / Non-Goals

**Goals:** Preserve the resolved currency conversion, publish the inverse merchant offers, and stage a candidate that renders currency purchases in existing item page conventions.

**Non-Goals:** Creating currencies not represented by an item, changing the accepted build, altering merchant inventory or exchange rates, or scanning the running game.

## Decisions

- Add a nullable currency entity-key column in `item_facts`, resolve the authored ID against canonical currencies during normalization, and carry the reference through catalog queries and contracts. A nullable reference leaves ordinary items unchanged.
- Construct purchase rows from already-queryable merchant relations for the converted currency. Merge by purchased item key plus cost, deduplicate merchant refs, and sort deterministically. Preserve a currency ref in each price so the existing `Price` component renders it.
- Add `facts.currency` and `buys` to the public item schema, bump its schema ID, and update fixtures and consumers. Render Buys in the normal item relation stack using `RelationTable`'s eight-row disclosure; no special answer-card sentence is needed.
- Rebuild catalog from the existing scan plans, compare all old/new catalog facts with currency excluded, publish using the new catalog ID, and stage the new selection against the previous accepted publication.

## Risks / Trade-offs

Some merchant tables have multiple sellers; grouping by product and cost makes seller identity explicit while avoiding duplicated products. A currency with no stock has no visible Buys rows. Gold's 336 distinct offers and their sellers exceed the earlier 256 KiB document limit, so the per-document budget must increase without altering map-part or initial-load budgets. The catalog schema version change produces a different candidate ID despite otherwise identical source evidence.
