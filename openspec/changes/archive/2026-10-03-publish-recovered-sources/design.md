## Context

The publication already loads all item and NPC facts, owner game actions, and named loot tables. The starting-inventory relation and raw spawner candidates are in SQLite but not in document projection input. Existing class starting gear, item use, effect pet ranks, and NPC locations demonstrate the established document and rendering patterns.

## Goals / Non-Goals

**Goals:** Index extra source facts once during publication; expose compact evidence as typed document fields; provide contextual links on detail pages; preserve the distinction between a table's content and a bound game source.

**Non-Goals:** Infer missing NPC or item gameplay from names; count a self-removal as a grant; equate an unlock with casting; invent a source for a table with no bindings; change the catalog's extraction semantics.

## Decisions

- Query adventurer starter-inventory rows and spawner candidates once while building publication input, then resolve references in projection. Filter starter gear by the adventurer invite roster. Pages distinguish a creature's world location from a scanned spawner not represented by a map placement.
- Invert pet effect ranks directly from catalog progression facts. Only `Pet` effects with a matching rank pet are counted as summoners, not arbitrary action mentions.
- Publish item loot-table membership from authored loot entries with each table's bound NPC or world context. Keep the membership and bindings in documents for source classification, but show loot-list context only when an item has no acquisition route. Named bound drops already appear in the item source section. An unbound table without another route is information about the list only, never proof that the player can obtain the item.
- Read game-action `type`, `alterAction`, and context together: item `Remove` actions consume items; ability `Gain` plus `Unlock` in dialogues or objects grants the ability, not casts it. Deduplicate template copies of a dialogue action.
- For travel targets, check scene membership against the catalog's scene entities before creating a destination reference. A missing scene is represented as an action without a target and rendered with a reader-facing explanation.

## Risks / Trade-offs

Scene-spawner candidates without a published map spot can establish that a spawner references an NPC, but cannot provide a usable map location. The page links its scene, not a fabricated spot. Unbound loot-list membership appears only as supplemental evidence when no acquisition route is known, and the publication still retains the underlying bound-table relationships for list classification.
