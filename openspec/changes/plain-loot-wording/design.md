## Context

DropRow is shared by creature `drops` and item `droppedBy`. Its `chance` is the displayed authored entry rate, `tableChance` the list-roll rate, and `tableMinimum`/`tableLimit` control the list count. World loot shares the row schema, with `creatureLevel` restricting eligible levels and the counterpart's label restricting rank. The publication presently does not know the item's effective chance per kill.

## Goals / Non-Goals

**Goals:** Keep the published numbers but distinguish the event each number describes. Preserve existing row grouping and sorted previews.

**Non-Goals:** Infer per-kill probabilities, change the catalog's roll model, or modify unrelated lists and map views.

## Decisions

- Add optional `killChance` to the common drop-row schema as a bounded percentage. The publication mapping does not populate it. Shared formatting functions choose between a probability label and the authored entry-rate label, so both NPC and item rows use the same branch.
- Keep the list-roll sentence in the NPC group heading and item source section heading. Group sentences count items from actual group rows, never a hardcoded total. Show the list's 100% roll as every kill. Do not imply that an item entry rate equals per-kill odds.
- Publish an optional internal loot-group identity on NPC rows. Two independent lists can have identical roll rules, so grouping by the rule alone merges their item counts. Use the identity only as a grouping key, never in reader text; old publications still validate. Remove the old publication guard that rejected matching limited lists.
- Use one exported explanation string with the existing Hint control in the table heading and source-card rate label. For world loot, produce a sentence from both `creatureLevel` and counterpart rank label; a singular item-row selection cannot identify the full list size, so do not invent that size.
- Render chest and gathering labels in their specific per-open and per-use contexts. Keep probabilities that are already verified separate from creature rates.
- Supplemental cloth uses a separate base roll before loot bonuses and tier-weight selection. Name its base and derived tier rates explicitly, without treating them as the item's effective probability per kill.

## Risks / Trade-offs

- A one-in-N translation rounds a verified per-kill probability to a whole number. The percentage remains visible as the precise published value.
- Existing publications omit `killChance` and continue validating because it is optional. The rate hint remains necessary until a verified figure is published for each row.
