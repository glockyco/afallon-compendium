## Why

Abandoned Quarry (Level 1–5) has no way in from another place, and its Getting there card is empty. In the game, a new character starts in a place that its race decides. The native character creation code reads `RPGRace.startingSceneID` (+0x68) and `startingPositionID` (+0x6C) for the selected race (`local/research/starting-place-20261002.md` in the main checkout). The catalog does not capture either field, so the compendium cannot say where new characters start.

## What Changes

- Capture each race's starting scene and starting world position.
- Store the race starts in the catalog with their source records, and expose them to publication.
- A place page where at least one playable race starts says so in its Getting there card, and names the races when not every race starts there.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `progression-data`: The catalog records each race's starting scene and position.
- `detail-pages`: A place page names the races whose new characters start there.

## Impact

- Scan collector `packages/scan/src/probes/collectors/support.csx` (race rows).
- Catalog normalization and queries for race starts, and the place document and its Getting there card.
- A new scan, a catalog candidate, and a publication candidate, accepted together.
