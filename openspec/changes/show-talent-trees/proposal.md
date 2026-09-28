## Why

Class pages publish talent names and effects in tables, but readers cannot see the tree layout or its icons. The accepted catalog has 660 talent nodes across 30 trees, while its artwork bindings have no talent or tree icons (`talent_nodes`, `progression_facts`, and `artwork_bindings` in accepted catalog 6bc13a4c).

## What Changes

- Export the `entryIcon` sprites of passive talents and talent trees. Record their artwork and publish references to it with the class documents.
- Show each class's trees in authored order as tabs. Give each tree a grid that retains its captured tier and position. Keep the existing table as a second view of the selected tree.
- Keep talent links and anchors working across tabs and views. Show names, ranks, effects, and requirements without losing nodes on narrow screens.
- Scan the changed artwork evidence and accept a reviewed catalog and publication together.
- The character planner and talent allocation are outside this change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `progression-data`: The catalog records the artwork of talent trees and passive talents as evidence-backed progression facts.
- `detail-pages`: Class pages show talent trees as tabs with a positional grid and an alternate table view.
- `entity-identity`: Talent links keep their destination when the destination tree is not the selected tab.

## Impact

- Scan artwork collector in `packages/scan/src/probes/collectors/artwork.csx` and its evidence contract.
- Catalog artwork normalization, storage, and queries in `packages/catalog/src/`, with corresponding catalog contracts in `packages/contracts/src/`.
- Publication artwork processing and class documents in `packages/publication/src/`, with public document contracts in `packages/contracts/src/`.
- Class page, talent tree section, and shared tab component in `apps/site/src/`. The shared URL-backed tab set belongs to `add-page-navigation` and is a prerequisite.
- A scan candidate, a compared catalog candidate, a staged publication candidate, browser checks, and joint acceptance.
