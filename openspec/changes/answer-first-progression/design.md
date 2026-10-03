## Context

The existing level curve component renders the full logarithmic chart and owns a slider, while the kill calculator owns another slider bound to the same transient page value. ReaderLevel already reads/writes the character key in browser-local reader-levels. The published document contains both the complete curve and grouped creature/place variants; calculateKillAward and killsToNextLevel already implement the verified kill rule.

## Decisions

- Build a Character Progression-specific answer component around one ReaderLevel using the existing character key. The chart component gains a chart-only mode, retaining its existing default behavior for skill pages and the full curve disclosure. Keep the page default at its current published creature's starting level when no saved value exists.
- Use the default published creature and its group/place variant for the opening comparison, and the same pure kill functions as the calculator. The count is conditional on repeating kills of that exact creature/level with no followers, Heroic or Experience Bonus; no calculation of game/world effects is invented. A fixed-level creature keeps its published level when the character-level input changes.
- Compute cumulative shares with a pure helper from curve rows. The last-ten-level share uses cumulative experience at cap minus cumulative experience at cap minus ten, divided by total. Render numerical percentages including fractions at low early levels and a bar, avoiding the suggestion that XP share measures elapsed playtime.
- On narrow screens move the calculator's result immediately after its picker, and put detailed source facts, optional controls and stages behind disclosures. The summary remains visible and updates while optional controls are changed. Keep native select/number controls, keyboard behavior, and full-detail stages.

## Verification

Pure unit tests for published example kill range, zero/cap bounds, and cumulative/journey shares. Browser smoke in Firefox and Chromium at 1440, 1100 and 390 pixels checks remembered level, control/result synchronization, disclosure access, and overflow with screenshots.
