## Why

Many item pages do not say what the item does or where it comes from. The page of Adventurer's Supply Pack shows no contents, although the pack opens one of 25 loot tables by class and level band. After `correct-published-records`, 116 items still have no known source.

An item source investigation of build 25434619 found a grant path for 17 of these items. The catalog holds a cloth drop source for 4 of them. It marks the creature eligibility of that source as unknown, and the drop query that feeds item pages omits it. The scan does not capture the paths of the other 13. These paths are item use actions, chests that visual effects spawn from prefabs, timed dungeon reward bags, and a quest pickup. The evidence is in the ignored `research/item-sources/25434619/findings-2-20260929.json`.

The investigation also corrects earlier assumptions. No owner other than items gives an item, a loot table, a currency, or a recipe through game actions. The five renown items and Expedition Supply Pack have no game actions, and a use of Epic renown reward on a research character gave nothing. Slime covered sack and Soaked bag give their gold through a chest that a visual effect spawns.

## What Changes

- The scan records the game actions of each owner type in the order that the game reads them. The catalog reports a coverage issue when an owner other than an item gives an item, a loot table, a currency, or a recipe. `publish-crafting-and-gathering` already reads item game actions.
- The scan reads the visual effects of interactable objects and item actions, and the Chest prefabs that each effect can spawn. Graves, sacrificial altars, buff pickers, and two sacks use this path.
- The scan reads the `DungeonTimerManager`, `QuestFieldInteraction`, and `HuntTanneryDirector` scene components and the Dungeon Finder settings. The targeted scan also captures Challenge stone Lumberjack, which the accepted scan missed.
- An item page shows what using the item gives: each loot table with the requirements of its action, and the rows of each chest that a visual effect can spawn. An item without game actions shows no contents. The rows keep their recorded quantity and chance without a claim of an effective chance.
- Items gain these sources: From items for item contents, Collected from rows for world objects that spawn a chest, Dungeon rewards for timed dungeon bags and Dungeon Finder runs, Dropped by rows for quest pickups, and world loot rows for cloth drops.
- The change records one decision for each item that still has no source. An item joins the exclusion list of `correct-published-records` only with the evidence that the list requires. Other items keep their pages and appear on the coverage page.
- This includes the 20 records that `correct-published-records` leaves published, and the Task board giver without a name.
- Out of scope: dialogue text and dialogue trees as reader pages, dialogue sources and dialogue teachers, and any ranking of rewards. No dialogue node gives an item or teaches a recipe in this build.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `item-property-presentation`: Item pages show what using an item gives, and the sources From items, Collected from for visual effect chests, Dungeon rewards, quest pickups, and cloth drops.
- `progression-data`: The catalog retains the game actions of every owner type, binds loot tables to item owners, and keeps the item grants of world objects and scene components.
- `reader-coverage`: Items with the new sources count as items with a known source.

## Impact

- Depends on `publish-crafting-and-gathering` for the capture of item game actions, and on `correct-published-records` for the exclusion list.
- Scan: owner actions in `packages/scan/src/probes/collectors/canonical.csx`. Visual effects, chest prefabs, and scene components in `world-sources.csx` or a new collector.
- Contracts and catalog: owner actions, loot table bindings, visual effect chests, and scene grants in `packages/contracts/src/catalog` and `packages/catalog/src`. The drop query in `packages/catalog/src/queries.ts` keeps the cloth rows.
- Publication and site: item contents, item sources, and coverage in `packages/publication/src` and `apps/site/src`.
- Evidence: the recorded native analysis of the item grant handlers, and use checks on a research character.
- Artifacts: a targeted scan, a compared catalog candidate, a publication candidate staged against the accepted publication, an update report, and joint acceptance.
