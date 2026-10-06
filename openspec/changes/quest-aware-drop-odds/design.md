## Context

`creatureDropOdds` builds every loot list that a creature binds and gives up when any of them holds a quest item, although the build-matched roll (`EconomyUtilities.GenerateDroppedLoot`) keeps a separate item count and limit for each creature list. Only World Loot lists share one item limit. `EconomyUtilities.QuestItemDropAllowed` lets a quest item through only while one of the player's quests has an open task for it, and `GenerateDroppedLoot` and `EconomyUtilities.PickMinimumDrops` both skip an item that it rejects, so a quest item without an open task is absent from the ordered rolls and from the minimum picks. The verified rules `creature-loot-entry-rolls`, `creature-loot-minimum` and `quest-only-loot` rest on this code. In the accepted 0.16.3 catalog, no creature list holds more than one quest item.

## Goals / Non-Goals

**Goals:**

- Publish an exact chance per kill for every creature drop whose chance does not depend on the reader's quests.
- Publish a quest item's chance for the time its quest needs it, marked so that every view states the condition.

**Non-Goals:**

- A chance for an item whose chance changes with the quest state. It keeps its Listed Rate with the reason.
- World-object loot lists that hold a quest item. Their roll's quest rule is not verified, so they keep their listed rate.
- Showing the Adventure Guide's own percentages.

## Decisions

- **Only the lists that contain the item take part.** Creature lists roll independently, so another list cannot change the item's chance. Ignoring only the failures of other lists would give the same chances but still calculate lists that cannot matter. World Loot keeps every eligible list, because the lists share one item limit.
- **Try every state of the other quest items.** Each quest item other than the target is calculated both droppable and not droppable, and the chance is published only when all combinations agree to within 1e-9 percentage points. A structural rule, such as "no item limit and no minimum, or the quest items roll after the item", would need a proof for each list shape and would still miss shapes that happen not to matter. Assuming that no quest is active would publish a chance that is wrong during the quest whenever a quest item can fill an item limit or join the minimum picks. With more than four other quest items, the calculation stops and the row keeps its listed rate.
- **A quest item's own task is open.** The target quest item stays droppable, which is the only state in which it can drop. The row carries `questOnly: true`, and the site words the condition. The publication carries no reader text for it.
- **World Loot uses the same quest rule.** The World Loot rolls in `GenerateDroppedLoot` and its minimum picks call the same quest check. No World Loot list holds a quest item in 0.16.3, so its chances do not change.

## Risks / Trade-offs

- [A later build adds a list with several quest items] → Each combination is calculated, at most 16 per item; beyond that the row keeps its listed rate with a reason.
- [Rounding differences between combinations] → The 1e-9 tolerance is far below any difference that a quest state causes, which changes a chance by the quest item's share of a limit or of the minimum picks.
- [Older publications] → `questOnly` is optional, so they still validate; they show their listed rates until a new publication replaces them.

## Migration Plan

Publish from the accepted catalog and compare the drop rows with the accepted publication. The 569 creature drop rows that a quest item blocked gain chances, the chances published before keep their values up to floating-point rounding, and rows of creature versions whose drops now agree merge, as relation rows with equal values do. Restaging the previous publication rolls the site back.
