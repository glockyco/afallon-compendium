## Context

The NPC projection already publishes flight stops, reachable destinations, authored fares, ability phases, and roster invitations. The NPC page had no applied-effect backlink, and the effect projection already derives invitation and NPC-ability sources from the same catalog. The roster's 115 distinct characters use only five avatar portrait assets, including a human-female placeholder on Brughan Redthorn, while the game invitation effect has its own generic male icon. These are not character-specific likenesses.

## Goals / Non-Goals

**Goals:** Preserve route direction, distinguish unplaced station names from actual map spots, avoid invented durations and merchant roles, and link only published effects. Let weak NPC pages use available services and abilities first.

**Non-Goals:** Do not invent map coordinates, imply every route shares a fare when it does not, substitute an effect icon for an NPC likeness, or change catalog capture.

## Decisions

- Use the published stop name to identify a flight master's departure station. A named stop is not a map placement, so it does not create a fabricated map marker.
- Use shared RelationTable and EntityLink for flights and routes. A shared zero fare or direction is stated once instead of taking a column.
- Use an evidence-checked content-free exclusion for NPCs with no usable place or game relationship. Other unplaced NPCs with abilities retain their pages and lead with what they can do.
- Add appliedEffects to the NPC document, derived from the same ability-applier and invitation facts as effect pages, including invitations discovered through the world. Bump the NPC document schema. Invitation pet duration comes from the effect's rank, not its zero base duration. Roster adventurers use class abilities, so their unused NPC-record phase abilities do not create applied-effect links on either page.
- Keep game-authored NPC portraits, including shared avatar assets, in references and documents. The class icon remains a fallback when no portrait exists.
- Side facts use the shared card. Pages without meaningful secondary facts opt out of the frame's side column.

## Risks / Trade-offs

Shared game-authored portraits may not uniquely identify a character, but removing them would depart from the source without runtime evidence. Keeping them preserves publication update parity. Flight stops without world placements remain named without a map action. Effect backlinks require republishing the NPC document and verifying source parity with effect pages.
