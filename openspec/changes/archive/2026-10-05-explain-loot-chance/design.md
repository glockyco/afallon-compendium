## Context

The published Loot guide already includes the verified Loot Chance inversion rule inside the Creature Drops disclosure. Item-page drop chances are calculated with zero Loot Chance in publication. The rule has inline references to the Loot Chance and Luck stat pages.

## Goals / Non-Goals

**Goals:** Show that verified rule under a stable anchor with a short explanation of the item-page baseline, without duplicating it in the disclosure.

**Non-Goals:** No change to item-page calculations, authored stat descriptions, or other loot contexts.

## Decisions

- Give the verified rule its own visible subsection inside Creature Drops. Render the existing linked rule phrase instead of rewriting its source or losing its stat references.
- Remove that rule from the general drop-table disclosure. Leave the separate minimum-pick explanation there because it adds detail rather than repeating the Loot Chance answer.
- Explain the item-page baseline from the existing publication calculation that passes zero Loot Chance. Name Luck as the supported example of raising the stat, without claiming other unverified sources.

## Risks / Trade-offs

The subsection adds some text to the Loot page. Place it after the closed drop-table detail so the first screen still gives a concise creature-drop answer and the other loot contexts remain scannable.
