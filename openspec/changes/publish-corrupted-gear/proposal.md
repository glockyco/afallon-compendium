## Why

Item pages show only an item's template stats. The accepted catalog records one Corruption Token but no corruption settings or corrupted item variants (`item_facts`, accepted catalog 6bc13a4c). Players ask how Corruption+ works, while the gear bonus and the origin of its level need separate evidence (progression UX findings, lines 63-71 and 92-96).

## What Changes

- Capture the build's corruption cap and gear bonus settings. Trace how a dropped item receives its corruption level before describing where levels come from.
- Show a corruption-level selector and calculated stats on eligible item pages. Keep the unmodified template visible and distinguish calculated values from a specific rolled item. Link to the corruption mechanics page.
- Publish `/mechanics/corruption` as a document of the `mechanics` page kind introduced by `explain-character-progression`. Explain verified Corruption+ rules, and distinguish unresolved keystone, timer, heart, and token behavior from verified facts.
- Keep every reachable item in the existing list and detail pages. Do not rank gear or add dungeon guides.

## Capabilities

### New Capabilities

- `corruption-mechanics`: A published Corruption+ reference page based on captured settings and verified rules.

### Modified Capabilities

- `item-property-presentation`: Item pages present calculated gear stats by corruption level without hiding the base item.

## Impact

- Read-only research: build-matched Ghidra methods and, if needed, a bounded HotRepl probe of settings and item generation.
- Scan and contracts: corruption settings in support evidence and catalog fact contracts.
- Catalog and publication: settings normalization, item projections, and a versioned mechanics document.
- Site: an item-page selector and the `/mechanics/corruption` page using the Mechanics navigation group.
- Publication cycle: one compared catalog candidate, one staged publication candidate, browser checks, and joint acceptance.
- Dependencies: `build-compendium-hub` owns navigation, and `explain-character-progression` owns the mechanics page kind and route. This change extends those interfaces without replacing them.
