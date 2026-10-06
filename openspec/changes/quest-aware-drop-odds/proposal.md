## Why

A quest item in any loot list of a creature currently hides the chance per kill of every item the creature drops, so 569 drop rows across 52 creatures show only their listed rate. Fangbloom is one of them: its gear list and its Heart of Corruption list show listed rates because a separate list holds Fangbloom's Venom Sac. Each creature loot list rolls with its own item limit, and the build-matched roll skips a quest item when no open quest task needs it, in its ordered rolls and in its minimum picks alike. The chance per kill of every other item can therefore be calculated exactly, and a quest item's chance can be calculated for the time a quest needs it.

## What Changes

- Calculate an item's creature chance per kill from the loot lists that contain it. The other loot lists of the creature no longer decide whether its chance is shown.
- Show the chance per kill of an item that shares a loot list with a quest item when that chance is the same whether or not a quest needs the quest item. Keep the listed rate with a reason when the quest state changes it.
- Show a quest item's chance per kill for the time one of the reader's quests needs it, and say so beside the value on creature pages, item pages and the item's source summary.
- Keep world-object loot lists that hold a quest item on their listed rate, because the object roll's quest rule is not verified.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `detail-pages`: A creature drop's chance per kill depends only on the loot lists that contain the item, and a quest item's chance per kill applies while a quest needs it.

## Impact

`packages/publication/src/documents/loot-chances.ts` and `loot.ts` calculate and publish the odds, the public `DropRow` gains an optional `questOnly` mark, and the creature drop, item drop and item source views in `apps/site` state the quest condition. The catalog, the rules record and the evidence stay unchanged. A new publication from the accepted catalog carries the new chances.
