## Context

See `proposal.md` for the motivation. `publish-crafting-and-gathering` captures item game actions, and `show-item-use-effects` publishes the When used section of Adventurer's Supply Pack and the used bags from the item actions and the chests of their visual effects. Its Loot topic holds the verified rules of `ItemPackLootBag` and `VisualEffectsManager` with `Chest`. `correct-published-records` adds the reviewed exclusion list.

An item source investigation of build 25434619 found these facts. The evidence is in the ignored `research/item-sources/25434619/` and `research/ghidra/25434619/item-source-functions-*-20260929.json`. Task 1 verifies them again in build 25653798 before the publication relies on them.

- A HotRepl probe read the game actions of items, effects, abilities, stats, NPC phases, NPC stats, class stats, dialogue text nodes, and regions. Among these owners, only items give items, loot tables, currencies, or recipes through game actions. Effect 210 rolls table 66 through its effect type, but no trigger of the effect was found in the scanned sources.
- `world-sources.csx` reads the actions of interactable objects, but not their visual effects. `InteractableObject.TriggerActions` reads the LootTable field only for Chest actions. It runs the template and the inline list of a `GameActions` action through `GameActionsManager.TriggerGameActions`, and the scan records both.
- Of the 140 game action templates that the probe loaded, 18 have Item or Recipe actions. Their Recipe actions gain the Savers recipes, and their Item actions remove items. Captured interactable objects run one of them. No owner of the other 17 was found in the scanned sources.
- `ClothDrops.Roll` runs for Humanoid and Undead creatures. It drops cloth when `Random.Range(0, 100)` is at most 75 times the loot drop multipliers. The creature's level picks the tier by weight. A tier's weight follows a level ramp from `LowWeight` to `HighWeight`, and the count is 1 to 3. The 0.16.3 catalog holds the five tiers and marks their creature rule as unknown.
- `DungeonTimerManager` gives a reward bag when all bosses die before the timer ends, and a bag with the token only when the timer ends. `DungeonFinderService` gives Adventurer's Supply Pack when a Random run completes. `HuntTanneryDirector` spawns a quest pickup when a listed creature dies while its quest task is open.
- The accepted scan captured no placement in Challenge stone Lumberjack.

## Goals / Non-Goals

**Goals:**
- Record every owner of game actions, and publish the grants of item owners.
- Publish the item grants of item uses, visual effect chests, scene components, and runtime rules that native analysis or a use check confirms.
- Give each remaining item without a source a recorded decision.

**Non-Goals:**
- No dialogue text, dialogue trees, dialogue pages, dialogue sources, or dialogue teachers.
- No effective chance for a loot roll or a prefab choice.
- No publication of an action type whose result stays unverified.

## Decisions

### Record every owner, and publish item grants only

The collectors record the game actions of each owner type in the order that the game reads them. Each action keeps its owner, its template, its type, chance, node action, amount, and targets. The catalog reports a coverage issue when another owner type than an item gives an item, a loot table, a currency, or a recipe through game actions. A later build then cannot add a grant that the publication misses without a report.

### Name the items that an item use gives

A LootTable action of an item makes the item a From items source of each item in the table, with the class and level band of the action. A visual effect chest of an item action makes the item a From items source of each chest row, with the recorded row chance. The rows take their values from the same catalog facts as the When used section of the source item, so both pages agree.

### Read the chests that visual effects spawn

A visual effect entry of an interactable object names a visual effect template. The scan resolves each prefab key of the template and reads the Chest components of the prefab. A prefab can also hold interactable objects whose Chest actions name loot tables. The scan loads the prefabs at the main menu with `Resources.Load`, as the item collector does. The catalog keeps the template, the number of prefab choices, each chest, and the costs and requirements of the object.

The sacrificial altar of the challenge stones uses both forms. Its visual effect spawns three sacrifice objects with their own costs. Their visual effects load one of several chests or item sets. A Collected from row names the altar, the cost of the sacrifice, and the number of prefabs. Thus a 100% row in an item set does not read as a certain result.

### Read the item grants of scene components and runtime rules

The corruption collector keeps the boss loot tables, `maxLootItems`, the target times, and the token item of each `DungeonTimerManager`. The Corruption Token page names the dungeons that give it, and coverage counts dungeon rewards as a source. `HuntTanneryDirector` keeps its creature and pickup pairs. A pickup row names its quest and task, because the pickup appears only while that task is open. `DungeonFinderSettings.SupplyPack` gives Adventurer's Supply Pack to a completed Random run.

### Publish cloth drops with their verified creature rule

`EconomyUtilities.GenerateDroppedLoot` calls `ClothDrops.Roll` for every dropped loot of a creature, with the creature's level and the loot drop multipliers of the creature. The catalog names the creature types that the roll accepts and keeps the roll chance, the count, and the tier weights. The page of each cloth shows a Cloth loot section with the creature types, the roll chance, the count, and the chance per kill for each range of creature levels. Both chances come before the loot drop multipliers. The weights stop changing at the last start level or ramp end, so the last range is open. The Loot guide holds the rules, and the section links to them.

### Decide each remaining item without a source

After the catalog candidate exists, the publication lists the items that still have no source. Each item gets one recorded decision. It joins the exclusion list of `correct-published-records` with evidence of its kind, or it keeps its page and its coverage row. A missing source alone is not evidence for an exclusion. An item that occurs only in loot tables without a known owner is "no owner found in the scanned sources", not unobtainable.

### Place the item source rules in the Loot guide

The native rules of this change go into the rules record in the Loot topic, in sections for world objects, dungeon rewards, quest pickups, and cloth drops. Each rule names the item page targets where a reader needs it: the From items, Collected from, Dungeon rewards, Dropped by, and Cloth loot sections.

## Risks / Trade-offs

- A runtime prefab load can differ from the build files. → The scan compares the runtime rows with an offline read of the same prefab, and records a difference as a coverage issue.
- One loot table or chest can have several owners. → Each owner keeps its own row, and the item page lists each owner once.
- A condition, such as an open quest task or an altar cost, changes what a reader can get. → Each row names its condition, and no row claims an effective chance.
- New sources change coverage counts and document sizes. → The update report explains each changed count, and the graph checks the size budgets.

## Migration Plan

Verify the rules in build 25653798 and write them into a new rules record. Run a targeted scan with the owner actions, the visual effect chests, the scene components, and Challenge stone Lumberjack. Build a catalog candidate, and compare it with the accepted catalog. Publish a candidate, stage it against the accepted publication, and check the affected pages at 1440 px and 390 px. Write an update report, and accept the catalog and publication together. The former publication stays as the rollback.
