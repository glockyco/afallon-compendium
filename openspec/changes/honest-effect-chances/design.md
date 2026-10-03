## Context

The site renders stat proc chances in both a compact tooltip and a detail page. Ability effects appear in a compact list, creature table, and effect-source table. Item-use and on-hit application records share a published item-effect collection. The source chance of zero is a special always-run action sentinel, not a zero probability.

## Goals / Non-Goals

**Goals:** Make the event and prerequisite for each displayed effect, random-stat, or chest roll clear without changing its numeric value or table layout.

**Non-Goals:** Alter creature drop rules, world loot, gathering, enchanting, random NPC spots, or the mechanics rules record.

## Decisions

- Keep site wording close to existing detail cards and relation tables. State conditional stat-proc sequence inline and use existing table-column hints for application attempts.
- Suppress the zero action-chance sentinel during item-effect projection, leaving 100 and zero both without a chance column value. Use the same item-effect records for summary and detail display.
- Explain independent random-stat entries compactly inside the existing game-like tooltip. Name the positive maximum and qualify each entry chance with “if reached”.
- Explain the chest limit in the existing short sentence beside capped chest tables so the row's per-open roll does not imply guaranteed delivery after a successful roll.

## Risks / Trade-offs

A published item effect activated through an ability and a direct item action currently share a `Use` trigger, so their roll contexts cannot always be distinguished from that collection alone. Keep any item-page label neutral for such rows and use ability pages for precise application semantics rather than inventing provenance.
