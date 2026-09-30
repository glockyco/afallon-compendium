## Context

See `proposal.md` for the motivation. `publish-crafting-and-gathering` captures item game actions as `ItemTooltip.GetRecipeRankUpID` reads them. It publishes Recipe RankUp actions only and keeps the other action types in the catalog. `correct-published-records` adds the reviewed exclusion list.

An item source investigation of build 25434619 found these facts. The evidence is in the ignored `research/item-sources/25434619/` and `research/ghidra/25434619/item-source-functions-*-20260929.json`.

- A HotRepl probe read the game actions of items, effects, abilities, stats, NPC phases, NPC stats, class stats, dialogue text nodes, and regions. Among these owners, only items give items, loot tables, currencies, or recipes through game actions. Effect 210 rolls table 66 through its effect type, but no trigger of the effect was found in the scanned sources.
- In the accepted catalog, 145 of 210 loot tables have no loot binding. Captured interactables and resource nodes name 76 of them, and the catalog already gives sources for all their items except Scroll. Item use actions name 25, prefab interactables name 24, and effect 210 names 1. No owner was found for 19 in the scanned sources.
- `world-sources.csx` reads the actions of interactable objects, but not their visual effects. `InteractableObject.TriggerActions` reads the LootTable field only for Chest actions. It runs the template and the inline list of a `GameActions` action through `GameActionsManager.TriggerGameActions`, and the scan records both. The captured objects run 47 templates and no inline game action. None of these templates gives an item, a loot table, a currency, or a recipe.
- Of the 140 game action templates that the probe loaded, 18 have Item or Recipe actions. Their 29 Recipe actions gain the 13 Savers recipes, and their 32 Item actions remove the Chest key or the 30 appearance options. Captured interactable objects run one of them, "Remove customization items". No owner of the other 17 was found in the scanned sources.
- `VisualEffectsManager.TriggerVisualEffect` loads one `PrefabKeys` entry, chosen with `Random.Range(0, count)`, through `SoftAssets.Load` at the Resources path `RPGBSoft/<key>`. `Chest.FilterLootByDropChance` keeps a row when `Random.Range(0, 100)` is at most its chance. It then shuffles the rows and keeps `maxDrops` rows when `maxDrops` is above zero.
- `ClothDrops.Roll` runs for Humanoid and Undead creatures. It drops cloth when `Random.Range(0, 100)` is at most 75 times the loot drop multipliers. The tier weight follows a level ramp from `LowWeight` to `HighWeight`, and the count is 1 to 3. The catalog has these sources, marks their eligibility as unknown, and the drop query omits them.
- `DungeonTimerManager` gives a reward bag when all bosses die before the timer ends, and a bag with the token only when the timer ends. `DungeonFinderService` gives Adventurer's Supply Pack when a Random run completes. `HuntTanneryDirector` spawns a quest pickup when a listed creature dies while its quest task is open.
- The accepted scan captured no placement in Challenge stone Lumberjack.

## Goals / Non-Goals

**Goals:**
- Record every owner of game actions, and publish the grants of item owners.
- Publish the item grants of visual effect chests, scene components, and runtime rules that native analysis or a use check confirms.
- Give each remaining item without a source a recorded decision.

**Non-Goals:**
- No dialogue text, dialogue trees, dialogue pages, dialogue sources, or dialogue teachers.
- No effective chance for a loot roll or a prefab choice.
- No publication of an action type whose result stays unverified.

## Decisions

### Record every owner, and publish item grants only

The collectors record the game actions of each owner type in the order that the game reads them. Each action keeps its owner, its template, its type, chance, node action, amount, and targets. Among the owners in the scanned sources, only items give items, loot tables, currencies, or recipes through game actions. The catalog reports a coverage issue when another owner type gives an item, a loot table, a currency, or a recipe through game actions. A later build then cannot add a grant that the publication misses without a report.

The 17 templates without a found owner only gain Savers progress flags or remove items. When the scan finds an owner other than an item for one of these templates, the Recipe gains of that owner become coverage issues. A dialogue text node can run only a template, so a reader-facing dialogue source would have no rows in this build.

### Read the chests that visual effects spawn

A visual effect entry of an interactable object and a TriggerVisualEffect action of an item name a visual effect template. The scan resolves each prefab key of the template and reads the Chest components of the prefab. A prefab can also hold interactable objects whose Chest actions name loot tables. The scan loads the prefabs at the main menu with `Resources.Load`, as the research probe did. An offline read of the same chests agreed row for row. The catalog keeps the template, the number of prefab choices, each chest, and the costs and requirements of the object.

The sacrificial altar of the challenge stones Cemetary, logging camp, Pyromancer, and Lumberjack uses both forms. Its visual effect spawns three sacrifice objects with their own costs: 150 gold, 300 gold, and 15 Corrupted emeralds. Their visual effects load one of 16 chests, one of 18 chests, or one of six item sets. Each item set holds three interactable objects whose Chest actions name loot tables. A Collected from row names the altar, the cost of the sacrifice, and the number of prefabs. Thus a 100% row in an item set does not read as a certain result.

### Read the item grants of scene components and runtime rules

`DungeonTimerManager` keeps its boss loot tables, `maxLootItems`, its target times, and its token item. The rules record holds the corruption level rule of the bag, and the publication shows the token and the table rows without an effective chance. `HuntTanneryDirector` keeps its creature and pickup pairs. A pickup row names its quest and task, because the pickup appears only while that task is open. `DungeonFinderSettings.SupplyPack` gives Adventurer's Supply Pack to a completed Random run.

### Publish cloth drops with their verified eligibility

The drop query keeps the supplemental cloth rows. A row names Humanoid and Undead creatures, the 75% base chance before the loot drop multipliers, the count 1 to 3, and the level ramp of the tier. It claims no effective chance.

### Bind loot tables to item owners

A LootTable action of an item creates a loot binding from the item to its table. The binding keeps the requirement groups of the action, such as the class and level band of each Adventurer's Supply Pack table. Items in the table gain a From items source.

### Publish verified action results only

The recorded native analysis confirms the results of LootTable and TriggerVisualEffect actions. Use checks on a research character confirmed Adventurer's Supply Pack and Slime covered sack. The publication shows a Contents section for these results. An item without game actions shows no Contents section. The Ability and Effect actions of companion contracts stay coverage issues until an analysis or a use check confirms their result.

### Decide each remaining item without a source

After the catalog candidate exists, the publication lists the items that still have no source. Each item gets one recorded decision. It joins the exclusion list of `correct-published-records` with evidence of its kind, or it keeps its page and its coverage row. A missing source alone is not evidence for an exclusion. An item that occurs only in loot tables without a known owner is "no owner found in the scanned sources", not unobtainable.

### Place the item source rules on the item pages

The native rules of this change go into a new rules record as reviewed rules without a topic. `restructure-page-model` defines rule placements, and each rule names the item page targets where a reader needs it. The contract adds the targets of this change: the Contents, From items, and Dungeon rewards sections, and the chance and condition columns of the source sections.

| Rules | Placement |
|---|---|
| row filter of a chest, prefab choice of a visual effect | Contents and Collected from, chance column |
| loot table roll of an item action, level filter, minimum drops | Contents, chance column |
| dungeon bag level and loot, Dungeon Finder supply pack | Dungeon rewards, condition column |
| quest pickup and quest drop rules | Dropped by, condition column |
| cloth drop chance, tier ramp, and count | Dropped by, world loot row |

Alternatives considered: a new mechanics topic with its own guide. Each of these rules concerns one kind of item row, and the rows already show the values. A guide would repeat the rows without a process for the reader to follow. A later change can add a topic when a process appears, for example the corruption guide of `publish-corrupted-gear`.

## Risks / Trade-offs

- A runtime prefab load can differ from the build files. → The scan compares the runtime rows with an offline read of the same prefab, and records a difference as a coverage issue.
- One loot table or chest can have several owners. → Each owner keeps its own binding, and the item page lists each owner once.
- A condition, such as an open quest task or an altar cost, changes what a reader can get. → Each row names its condition, and no row claims an effective chance.
- New sources change coverage counts and document sizes. → The update report explains each changed count, and the graph checks the size budgets.

## Migration Plan

Apply this change after `publish-crafting-and-gathering`, `correct-published-records`, and `restructure-page-model` are accepted. Write the item source rules with their placements in a new rules record. Run a targeted scan with the owner actions, the visual effect chests, the scene components, and Challenge stone Lumberjack. Build a catalog candidate, and compare it with the accepted catalog. Publish a candidate, stage it against the accepted publication, and check the affected pages at 1440 px and 390 px. Write an update report, and accept the catalog and publication together. The former publication stays as the rollback.
