## 1. Capture

- [x] 1.1 Capture each item's AlterAction, action conditions, visual effect template, and every prefab chest row without instantiating prefabs on the canonical target.
- [x] 1.2 Decode and persist the captured action payload and publish chest and gated loot-table facts per item.

## 2. Reader

- [x] 2.1 Show chest contents in When used: each item with its amount and chance, and the roll rules in reader words. Use the item page's shared table, section and disclosure components, and show no internal names (visual effects, loot tables). Commits ecc6fdb and b8b6211.
- [x] 2.2 Show the supply-pack class and level bands with their items, and the pick, world-loot and lifecycle rules in reader words, with the same components. Bands list only playable classes (commit b036c1d).

## 3. Proof

- [x] 3.1 Smoke-test the collector in scene 44 and inspect used-item and supply-pack pages in the browser. Scan run f86c5314, Soaked Bag and Adventurer's Supply Pack checked at 1440 and 390 px.
- [x] 3.2 Run checks and strict OpenSpec validation.
