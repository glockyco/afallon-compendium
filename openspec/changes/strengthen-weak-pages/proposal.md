## Why

Readers judge the Compendium by its weakest page. Stat links carried a framed kind glyph and the accent colour, so "+15 Armor" read as a button and broke the game look of item tooltips. Stat previews printed "Base: 0 · Min: 0". Title blocks could stack a type line and a facts line under the name, and pages without side facts kept an empty 20rem column beside a squeezed main column.

## What Changes

- A stat link shows no icon, takes the colour of its text, and marks itself with a dotted underline everywhere. Links inside an item tooltip read as game text.
- The stat preview states only the facts that tell a stat apart.
- The title block puts the type and the identity facts on one line.
- A page without side facts uses the full width. Side cards share one frame, and a facts card holds the numbers that used to sit in a lone stat strip.
- Link grids show their first eight links and a Show N more control.
- The item page's How to get it routes are one shared section, so other pages can show an item's routes.
- A hover card opens beside the hovered line of a link that wraps, instead of beside the whole paragraph, where it ran off the screen.

## Capabilities

### Modified Capabilities

- `detail-pages`: the full-width layout without side facts and one side card frame.
- `compendium-reference`: stat links.
- `compendium-tooltips`: text links in item tooltips and the stat preview.
- `reference-layout`: hover card placement for a link that wraps.

## Impact

Site only: `EntityLink`, `EntityReference`, `kind-icon`, `ItemTooltip`, `StatTooltip`, `TitleBlock`, `DetailFrame`, `LinkGrid`, the new `SideCard` and `FactsCard`, and `ItemSourceRoutes`.
