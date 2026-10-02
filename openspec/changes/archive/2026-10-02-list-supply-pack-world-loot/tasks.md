## 1. Rules

- [x] 1.1 Confirm `IsAccessoryItem` and `GetPackWorldLootPool` in a running game for Shieldmaster levels 1 and 6, Wizard level 22, Hunter level 22, and Berserker level 30, and compare every item with the computed pool.

## 2. Data

- [x] 2.1 Query the world loot tables, their level windows, and their rows from the catalog.
- [x] 2.2 Compute the world loot items and level windows of each pack band and playable class in publication, and add them to the pack bands with a new static item schema id. Test a weapon of another class, armor of another type, a main stat that the band does not want, an item without a level requirement, and an open band.

## 3. Page

- [x] 3.1 List the world loot items under each band on the supply pack page with their character levels.
  - Result: each band of the Adventurer's Supply Pack lists its world loot for each class with the character levels at which each item can appear.
- [x] 3.2 Publish, check the supply pack page in a browser at 1440 px and 390 px, and accept the publication.
  - Result: checked at 1440, 1100, and 390 px without sideways scroll. Accepted with catalog `bc70e233` and publication `bb9d1a14` (update report `local/update-report-25653798-talent-capture.json`, accepted descriptor `8ec84a05` in the main checkout).
