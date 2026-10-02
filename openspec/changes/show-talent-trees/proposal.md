## Why

Class pages list talents in tables. The game shows each talent tree as a grid of icons with lines between talents that depend on each other, and readers know the trees by that picture. The accepted catalog `d3b56f3f` (build 25653798) has 31 talent trees and 558 bonuses, but no icon for any tree or passive talent, and it does not record what the game's tree panel uses to draw the grid. The page layout is undecided until we have the icons and can compare them with the game's own panel.

## What Changes

- Capture the icon of each talent tree and each passive talent (bonus) from the game, with explicit issues for missing or unreadable sprites.
- Capture the layout facts that the game's talent tree panel reads: the tree's tier count, each node's tier and row, and the requirements that the panel draws as lines between nodes.
- Store the icons and layout facts in the catalog with their source records and scan evidence.
- Collect screenshots of the in-game talent tree panel and a preview of the captured data, so that the class page layout can be decided from both.
- The class page, the published class document, and talent links are out of scope. A later change designs them from the screenshots.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `progression-data`: The catalog records the icons of talent trees and passive talents and the layout facts of each tree.

## Impact

- Scan collectors `packages/scan/src/probes/collectors/artwork.csx` and the progression collector that records talent nodes, with their evidence contracts.
- Catalog contracts, normalization, database, and queries in `packages/catalog/src/` and `packages/contracts/src/catalog/`.
- A new scan of build 25653798, a catalog candidate compared with accepted catalog `d3b56f3f`, and a publication built from it. Published pages do not change.
