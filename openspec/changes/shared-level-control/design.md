## Context

`ReaderLevel.svelte` wraps `LevelSlider.svelte`, while Places and the home hub maintain independent number fields. Saved character and skill levels already live in `reader-levels.ts`; equipped gear score has its own store. Published level ranges vary by page, and a saved level must not be overwritten merely because one page offers a smaller range.

## Goals / Non-Goals

**Goals:** One control API for saved and unsaved numeric settings, predictable keyboard and pointer interaction, and a level-axis drag target with an accurately anchored marker.

**Non-Goals:** Changing list-filter min/max inputs, the map sidebar, published level ranges, storage keys, or the progression and calculator page layouts.

## Decisions

- `LevelControl.svelte` accepts `id`, `label`, `min`, `max`, `level`, and optional `readerId`, `fallback`, `slider`, `sliderMax`, `optional`, `allowFraction`, `suffix`, `valueText`, and `onSelect`. Bound `level` supplies computed pages, while `readerId` reads and writes the existing store. The separate gear-score store uses `onSelect`. A suffix such as `%` keeps a unit beside the editable number.
- Buttons step on pointer down and start an interval after 380 ms, canceled on release, cancellation, exit, or destruction. Keyboard-generated clicks use the ordinary click path. Number and slider share one key handler, and blur or Enter normalizes typed values.
- Places and the home hub omit the redundant slider to protect toolbar width. Mechanics pages and detail sections include it for wider ranges; living followers uses only the stepper because zero through ten needs little travel. The Heroic comparison retains its two creature selectors alongside the shared character-level and gear-score controls. Optional values support the existing Any setting, with empty input clearing the saved level.
- The axis drag surface calculates an integer level from the pointer's position within its own track. Its keyboard focus uses slider semantics. The marker line and arrow use the true level point, while only the fixed-width label is clamped inward near edges.

## Risks / Trade-offs

A desktop 32-pixel button differs from the mobile 44-pixel touch target, so both widths need browser checks. Decimal Experience Bonus retains its typed precision while stepping by one. Its slider shows the useful first 100 percentage points without imposing a cap on typed bonuses, and expands when a higher bonus is entered. Browser-native range sliders may differ slightly between Firefox and Chromium, but the focus indicator surrounds the thumb rather than the whole track.
