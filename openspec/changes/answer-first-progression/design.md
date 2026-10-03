## Context

The existing level curve component renders the full logarithmic chart and owns a slider, while the kill calculator owns another slider bound to the same transient page value. ReaderLevel already reads/writes the character key in browser-local reader-levels. The published document contains both the complete curve and grouped creature/place variants; calculateKillAward and killsToNextLevel already implement the verified kill rule.

## Decisions

- Build a Character Progression-specific answer component around one ReaderLevel using the existing character key. The chart component gains a chart-only mode, retaining its existing default behavior for skill pages. Put answer and journey cards side by side with matched edges, then one always-visible full curve and a breakpoint-table disclosure. Keep the page default at its published creature's starting level when no saved value exists.
- Choose a published creature that scales to the selected character level at a real place when available, falling back to the publication's default creature. Use the same pure kill functions as the calculator. The count assumes repeated kills of that exact creature/level with no followers, Heroic or Experience Bonus; no calculation of game/world effects is invented. A fixed-level creature keeps its published level when the character-level input changes.
- Compute cumulative shares with a pure helper from curve rows. The last-ten-level share uses cumulative experience at cap minus cumulative experience at cap minus ten, divided by total. Render numerical percentages including fractions at low early levels and a bar, avoiding the suggestion that XP share measures elapsed playtime. Measure chart width to keep SVG tick labels at a stable small size when the SVG scales.
- On narrow screens place the calculator's result immediately after its picker, with the always-open settings card below it; keep detailed source facts and calculation stages in disclosures. On wide screens, align the equally tall result and settings cards below the creature selector, whose width matches the settings card. Keep all stages and caveats, and give the summary, note and disclosure one consistent rhythm. Match the Heroic comparison's creature selector and slider widths without altering the shared level control.

## Verification

Pure unit tests for published example kill range, zero/cap bounds, and cumulative/journey shares. Browser smoke in Firefox and Chromium at 1440, 1100 and 390 pixels checks remembered level, control/result synchronization, disclosure access, and overflow with screenshots.
