## Context

`apps/site/src/lib/detail/pages/CharacterProgressionPage.svelte` rendered the overview, the steps, the calculator, the level curve, the experience sources, the talent points, the creature level modifiers, and the rules, in that order. The calculator and the level curve share one selected level.

`experienceSources` in `packages/publication/src/mechanics.ts` split creatures into fixed-level and scaling creatures by the record flag `scalesWithPlayer`, and it took the fixed range from the record levels. The game sets most levels at the spawner instead. A spawner can override the level, and it can scale the level with the player into its zone range (`EXPLORATION.md`, NPC levels in build 25434619). The publication already derives the spawn levels from the map placements, for the NPC pages and the map. In the staged publication, 183 records with experience have a page and a record flag that does not scale. 114 of them spawn only at scaling spawners. 13 spawn at a fixed level that differs from the record, 12 spawn at their record level, and 44 have no published spawn.

## Goals / Non-Goals

**Goals:** An order that answers the most common questions first, and source counts that agree with the NPC pages and the map.

**Non-Goals:** Changing the steps, the rules, the level curve chart, or the mechanics schema.

## Decisions

### Level curve before the steps

The owner chose the level curve as the first section. The other mechanics pages open with steps, but Character Progression has one central data block, and readers come for it. The steps follow and explain how experience is earned. The calculator moves to the end, after the level difference table that it applies, and before the rules reference.

### Count sources by spawn level

`experienceSources` uses the published spawn level of each record, the union of its placement levels. A creature whose spawn level scales counts as a creature near the character's level, and the others count as fixed-level creatures with their lowest and highest spawn level. A creature without a published spawn is not counted, because the page cannot say where or at what level it appears. The level modifier counts use the same creatures, so the page can derive the row of creatures without a modifier from the published counts.

Alternative: keep the record levels and add a note. Rejected, because the counts would still disagree with the NPC pages and the map.

### Talent points as one paragraph

When the catalog has one level-up gain for a point type, the page states the total at the level cap: the start amount plus the gain for each level-up below the cap. It names the limit as a limit and states that game modifiers can change the gain and the limit. The heading of a point type appears only when the document has more than one point type.

## Risks / Trade-offs

- [A creature without a published spawn can still give experience, for example as a summoned creature] → The page counts only creatures with a published spawn, and the calculator offers only those. The NPC page of such a creature still shows its experience.
- [Archive order] → `publish-corrupted-gear` also modifies "Mechanics pages are guides". This change carries that text forward, so it must archive after `publish-corrupted-gear`.
