## 1. Calculate Quest-Aware Creature Odds

- [x] 1.1 Calculate a creature drop from the loot lists that contain the item, and try every state of the other quest items in creature and World Loot lists. Verify with publication tests: an item beside a quest item's list, an item in an unlimited list with a quest item, a quest item with its task open, and an item after a quest item at a full item limit, which keeps its listed rate.
- [x] 1.2 Publish `questOnly` on drop rows of quest items, keep object loot lists with a quest item on their listed rate, and correct the comments on what the Adventure Guide shows. Verify with the contract and publication tests and `bun run check`.

## 2. State the Quest Condition

- [x] 2.1 Say beside a quest item's chance that it applies while one of the reader's quests needs the item, in the creature Drops table, the item's Dropped by table and the item's source summary. Verify with `bun run --cwd apps/site check` and the site tests.

## 3. Verify the Publication

- [x] 3.1 Publish from the accepted catalog, stage it, and compare its drop rows with the accepted publication. Verify that the quest-blocked rows gain chances, that earlier chances keep their values up to floating-point rounding, that creature versions whose drops now agree merge, and that object loot rows do not change.
- [x] 3.2 Open Fangbloom, Fangbloom's Venom Sac, Infected Bear and Bear Hide in the running site at 1280 and 390 px. Verify Chance per Kill headings, the quest condition beside the quest items' chances, and no horizontal overflow.
