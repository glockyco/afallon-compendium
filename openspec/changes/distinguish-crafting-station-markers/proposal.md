## Why

The atlas shows every crafting station with the same hammer marker and filter. Players cannot distinguish cooking, smithing, tailoring, and other station services without opening each placement.

## What Changes

- Add distinct map markers and filters for Alchemy, Cooking, Smithing, Furnace (Metallurgy), and Tailoring stations.
- Classify a station by its extracted, typed station reference rather than its object name or displayed label.
- Keep a generic Crafting Station marker for placements whose station reference cannot be resolved to a supported type. Do not publish a Savers filter until it has a verified placement.
- Preserve one rendered marker per placement, including placements with other roles. Update published category contracts and search text to match the new filters.

## Capabilities

### New Capabilities

- `crafting-station-map-markers`: Station-specific map categories, filters, labels, and fallback behavior.

### Modified Capabilities

None.

## Impact

The change affects map shard publication, public placement categories, the site marker registry and icon atlas, filters, search, and URL-backed filter state. Existing static publications keep their own contract and require regeneration to show the new categories.
