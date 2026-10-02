## Why

Currency, faction, gear set, crafting station, and race pages waste space on repeated counts and tables while some omit the facts readers need first. Currency acquisition is especially misleading when a source description sits beside a missing-source claim.

## What Changes

- Present acquisition routes from the published currency item's page on the corresponding currency page, and show prices without repeating the subject currency in every offer.
- Consolidate identical purchase sellers and faction thresholds, retaining varying offers and starting points.
- Give each of the five kinds an answer, an identity line, and a compact side card instead of redundant stat strips.
- Keep race start and playable classes together, and show cumulative set bonuses without counting duplicate pieces twice.
- Show a gear set's final-bonus threshold in its list row only when it differs from the number of available pieces.

## Capabilities

### Modified Capabilities

- `currency-purchases`: Purchase tables identify their currency once and consolidate shared sellers without hiding different offers.
- `detail-pages`: These five detail kinds display their decisive player answers and meaningful side facts without duplicated hero strips or empty desktop columns.
- `list-filters`: Gear set rows avoid an almost identical second count column while preserving exceptional thresholds.

## Impact

Site detail pages, purchase presentation, gear set list projection, and the server-side item document lookup. Published document schemas and the catalog remain unchanged.
