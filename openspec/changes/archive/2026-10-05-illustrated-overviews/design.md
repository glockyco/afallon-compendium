## Context

The home page has separate local class and skill tile CSS. Small catalog lists share ListTable and publication list rows. Class descriptions and faction standing are already in detail documents, but not in list rows.

## Goals / Non-Goals

**Goals:** Reuse one visual tile component for home and small list galleries, keep comparison fields in the published list, and preserve the existing table control and responsive behavior.

**Non-Goals:** No new artwork, faction-specific treatment, or changes to large filtered catalogs.

## Decisions

- Render one `OverviewTile` component with class icons, compact skills, art-free editorial topics, and image-on-top cards for scenery and portrait art. An EntityLink stretches across each tile. Properties use their full-size published scene at a fixed crop ratio; square race and faction portraits retain their faces within a shallow image band instead of stretching a 128-pixel image across the card.
- The list route selects six kinds for a gallery and retains ListTable behind a Gallery/Table control. Group skills by the published `type` field and use data facts in a stable grid. A table can still sort the same rows.
- Add class descriptions, skill starting status, faction starting stance, and property price amounts and income intervals to publication list values without adding unused table columns. Keep a zero NPC count rather than treating it as unavailable; omit truly missing values instead of inferring them.
- Put the existing property document's full artwork reference on its list row and its published currency references in relation fields. Render the price through the same Price component as the detail page, so coin art, amount, and name stay consistent. Keep income interval available alongside the amount.
- Use responsive column constraints and a compact two-column phone layout when space allows. Editorial Mechanics tiles use text instead of generic or fabricated illustrations.

## Risks / Trade-offs

Rebuilding publication is necessary before gallery cards can load full property artwork and currency icons from list rows. Without full artwork, a property tile presents its compact icon centered in an image band instead of enlarging that icon as scenery. A tile cannot describe a faction beyond its known standing and NPC count; its detail page remains the source for deeper relations.
