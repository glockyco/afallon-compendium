## 1. Capture

- [x] 1.1 Capture each item's AlterAction, action conditions, visual effect template, and every prefab chest row without instantiating prefabs on the canonical target.
- [x] 1.2 Decode and persist the captured action payload and publish chest and gated loot-table facts per item.

## 2. Reader

- [ ] 2.1 Show chest contents in When used: each item with its amount and chance, and the roll rules in reader words. Use the item page's shared table, section and disclosure components, and show no internal names (visual effects, loot tables).
- [ ] 2.2 Show the supply-pack class and level bands with their items, and the pick, world-loot and lifecycle rules in reader words, with the same components.

## 3. Proof

- [ ] 3.1 Smoke-test the collector in scene 44 and inspect used-item and supply-pack pages in the browser.
- [ ] 3.2 Run checks and strict OpenSpec validation.
