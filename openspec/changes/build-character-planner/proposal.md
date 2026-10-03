## Why

Class pages explain talents but cannot hold a proposed character or share one. A planner should let a reader work from their own class and level across the site without mistaking a shared preview or an unchecked talent for their remembered character.

## What Changes

- Add `/planner` for every published playable class, level, talent ranks, typed point balances, explicit purchase status, reversal controls, and versioned build links. Hunter is playable in the accepted 0.16.3 catalog.
- Verify the game's requirement evaluator, rank costs, and point grants before claiming a purchase is legal. Keep blocked and unverified selections visible with distinct reasons, while a preview remains a separate interaction state.
- Make an explicitly chosen, device-local build the site's one remembered character. Incoming links open in preview and never replace it without “Use as My Character.” Other pages read its class and level from a small shared module, not a separate character-level setting.
- Reuse the accepted 0.16.3 catalog and publication as the comparison baseline. If more data is necessary, compare the new catalog candidate with the accepted one and stage publication against the accepted build before joint acceptance.
- Reserve the stable build URL's gear field for the separate `plan-character-gear` change. This change does not choose equipment, calculate stats, or read save files.

## Capabilities

### New Capabilities

- `character-planner`: Talent planning, remembered character and cross-site class/level context, purchase status, and the stable link contract.

### Modified Capabilities

None.

## Impact

- Research: the requirement evaluator, talent rank-up/down, and point grants on game build 25653798, checked against the accepted catalog `076be02f1fcc7e88711645fa730cefde7fbbc5923d1abd7399ff7d2192f97779`.
- Contracts and publication: typed class, tree, node, rank, point and requirement facts, projected from the catalog and staged against publication `dade9f2e75c50ffbdfdbf92daa5e7aa9e2f716da6bf9494dd69172c75326bd76`.
- Site: `/planner`, shared class/level storage migrated from the current reader-level control, compact character entry, and unobtrusive context on progression, places, item, and ability pages. Gear score context waits for `plan-character-gear` and verified inputs.
- Artifacts: reviewed catalog and publication candidates when needed, staged browser checks at desktop and phone widths, and joint acceptance so development and preview use the same data.
