## Context

Canonical item actions currently capture the action type and target but not AlterAction, action conditions, or visual-effect chest contents. Loot tables and rows are already stored in the catalog. The 0.16.3 native rules distinguish independent chest rows from weighted supply-pack picks.

## Goals / Non-Goals

**Goals:** Capture item use facts on the canonical target, persist and publish them, and explain their actual gates and roll rules on item pages.

**Non-Goals:** Predict random outcomes or enumerate the changing world pool for every player level.

## Decisions

- Read effect templates and their addressable prefab AssetPointers without instantiating or activating them. Preserve each chest and row, including currency, counts, and chance. An unavailable prefab is reported as unavailable, never an empty chest.
- Preserve ordered action modes and class/level conditions. Resolve loot-table references against catalog tables and rows, not a hand-maintained item list.
- Chest rows are independent chance checks, subject to a positive max-drops cap. Pack rows are weighted picks after eligibility checks. State the distinct roll rules separately.
- Keep the source item consumed only when the pack's loot is taken, as the native lifecycle specifies.

## Risks / Trade-offs

A live rescan is necessary to populate newly captured action fields. Prior canonical evidence cannot establish chest contents or action modes and must not silently substitute default values.
