## Context

DropRow is shared by creature `drops` and item `droppedBy`. Its `chance` is the Adventure Guide's authored entry rate, `tableChance` the list gate, and `tableMinimum`/`tableLimit` the list count. World loot additionally depends on level, rank, previous world tables' shared capacity and player eligibility. Native evidence and a live roll probe establish the exact neutral-baseline law. A qualifying world object's nested LootTable action instead uses the same ordered item and weighted-minimum rolls without the world gate, global world cap, or Luck.

## Goals / Non-Goals

**Goals:** Publish computed baseline odds where all inputs are available, keep a clear missing-input reason otherwise, and preserve grouped list semantics.

**Non-Goals:** Claim an unconditional chance independent of a player's active modifiers, current level, quest state, eligibility for kill rewards, or nonneutral Loot Chance. Do not modify unrelated lists and map views.

## Decisions

- Model the build-matched roll with a pure bounded-state calculation: creature table gates truncate the random value before comparison, world gates do not; eligible entries roll independently in authored order until a cap, then a minimum picks unselected entries by authored weight without replacement. Prior world tables consume the shared world cap. Object LootTable actions skip the world gate and Luck. Unsupported inputs keep Listed Rate with a precise reason.
- Populate `killChance` and `chanceLevel` for a qualifying kill at zero Loot Chance, neutral Heroic/world multipliers and no active drop modifiers. Populate `openChance` and `openChanceLevel` for qualifying world-object opens when the object is known to trigger a nested LootTable action with a known minimum. State the creature or player level chosen and never imply an unconditional rate. Creature-specific raw table rates use the actual integer-truncated gate probability (a raw 5 passes on 6% of neutral kills); World Loot retains the untruncated 5%.
- Publish an optional internal loot-group identity on NPC rows. Two independent lists can have identical roll rules, so grouping by the rule alone merges their item counts. Use the identity only as a grouping key, never in reader text; old publications still validate. Remove the old publication guard that rejected matching limited lists.
- Use one exported explanation string with the existing Hint control in the table heading and source-card rate label. For world loot, produce a sentence from both `creatureLevel` and counterpart rank label; a singular item-row selection cannot identify the full list size, so do not invent that size.
- Render chest and gathering labels in their specific per-open and per-use contexts. Keep probabilities that are already verified separate from creature rates.
- Supplemental cloth uses a separate base roll before loot bonuses and tier-weight selection. Name its base and derived tier rates explicitly, without treating them as the item's effective probability per kill.

## Risks / Trade-offs

- A one-in-N interpretation rounds the reciprocal of the computed percentage for rates below 1%; the publication retains the unrounded probability.
- Old publications omit computed odds and continue validating. Missing quest conditions, table data, level eligibility or object guarantee information preserve Listed Rate with the missing prerequisite explained.
