## Why

Corrupted Emerald converts to a spendable currency, but its item page does not tell readers what that currency can buy. The catalog already records merchant stock prices by currency; connecting the item's conversion to those prices makes this information discoverable.

## What Changes

- Preserve each item's resolved conversion currency in normalized catalog facts, backed by the existing raw item export.
- Publish the conversion currency and purchasable items, costs, and selling merchants on converting item documents; merge identical item-and-cost offers across sellers.
- Show a responsive Buys relation table on currency item pages, using the existing price and relation-table treatments.
- Generate and stage candidates from the existing scan evidence, leaving the accepted artifacts unchanged.

## Capabilities

### New Capabilities

- `currency-purchases`: Catalog-to-publication currency conversion and item-page purchase discovery.

### Modified Capabilities

- `detail-pages`: Currency item pages gain a Buys relation section.

## Impact

Catalog schema and item facts, public item schema and fixtures, item detail presentation, local publication candidate and staging. No new game scan or accepted-build replacement.
