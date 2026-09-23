## Why

The atlas uses fixed marker sizes, which can obscure dense areas or make markers difficult to see on some screens. Visitors need a single way to adjust marker size without changing which placements appear.

## What Changes

- Add a Marker Size slider under Map Options, with a 100% default, a 75–150% range, a visible percentage, and a reset action.
- Apply the chosen scale to all map placement icons and their selection or hover outlines while preserving category glyphs and marker interaction.
- Keep the setting in the atlas URL so a reload or shared link restores it. Omit the parameter at the default value.

## Capabilities

### New Capabilities

- `atlas-marker-sizing`: Visitors can change map marker size and share the chosen size in an atlas URL.

### Modified Capabilities

None. Existing station category behavior does not change.

## Impact

The atlas sidebar, URL state, map renderer, marker icon layer, and highlight layers need updates. Static publication data and marker category contracts do not change.
