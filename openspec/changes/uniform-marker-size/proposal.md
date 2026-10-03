## Why

Each map marker category carried its own icon size. Boss markers drew at 27 against 22 for enemies and 19 for interactive objects, so bosses looked bigger than everything around them and the categories read as unequal.

## What Changes

- Every marker draws at one shared size, which the marker size setting scales.
- Selection and hover highlights use that size too, so their rings match across categories.
- The registry no longer carries a size per category.

## Capabilities

### Modified Capabilities

- `interactive-map`: marker presentation uses one size for every category.

## Impact

Site only: `marker-registry.ts`, `map/layers/markers.ts`, and the layer tests.
