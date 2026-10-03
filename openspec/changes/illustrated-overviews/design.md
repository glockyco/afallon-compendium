## Context

The home page has separate local class and skill tile CSS. Small catalog lists share ListTable and publication list rows. Class descriptions and faction standing are already in detail documents, but not in list rows.

## Goals / Non-Goals

**Goals:** Reuse one visual tile component for home and small list galleries, keep comparison fields in the published list, and preserve the existing table control and responsive behavior.

**Non-Goals:** No new artwork, faction-specific treatment, or changes to large filtered catalogs.

## Decisions

- Render one `OverviewTile` component with class, compact, and editorial arrangements, using an EntityLink stretched across its tile. It accepts an existing entity reference and a small array of contextual facts, not a new duplicated catalog model.
- The list route selects six kinds for a gallery and retains ListTable behind a Gallery/Table control. Group skills by the published `type` field and use data facts in a stable grid. A table can still sort the same rows.
- Add class descriptions, skill starting status, faction starting stance, and property price currencies and income intervals to publication list values without adding unused table columns. Keep a zero NPC count rather than treating it as unavailable; omit truly missing values instead of inferring them.
- Use responsive column constraints and a compact two-column phone layout when space allows. Editorial Mechanics tiles use text instead of generic or fabricated illustrations.

## Risks / Trade-offs

Rebuilding publication is necessary before the class playstyle and faction stance appear on the static site. A tile cannot describe a faction beyond its known standing and NPC count; its detail page remains the source for deeper relations.
