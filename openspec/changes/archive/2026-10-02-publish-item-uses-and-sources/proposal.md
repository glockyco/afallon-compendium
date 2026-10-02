## Why

Many item pages do not say where the item comes from. In the accepted 0.16.3 publication, 123 items have no known source. Some of their sources are known but not published: the bands of Adventurer's Supply Pack and the chests of used bags, the supplemental cloth drops, and the token of the timed dungeon reward bags. The scan does not capture other paths: the chests that graves and sacrificial altars spawn, the quest pickups of hunt directors, and the supply pack of the Dungeon Finder.

`show-item-use-effects` added the When used section to the supply pack and the bags, but the items that they give do not name them as a source. The catalog holds the cloth drop tiers with an unknown creature rule, and the drop query omits them. The Corruption Token page names its dungeons, but coverage does not count dungeon rewards as a source.

An item source investigation of build 25434619 found these paths. Among the owners of game actions in the scanned sources, only items gave an item, a loot table, a currency, or a recipe. The evidence is in the ignored `research/item-sources/25434619/findings-2-20260929.json`. This change verifies the paths again in build 25653798.

## What Changes

- The scan records the game actions of each owner type in the order that the game reads them. The catalog reports a coverage issue when an owner other than an item gives an item, a loot table, a currency, or a recipe through game actions.
- The scan reads the visual effects of interactable objects and the Chest prefabs that each effect can spawn. Graves, sacrificial altars, and buff pickers use this path.
- The scan reads the `QuestFieldInteraction` and `HuntTanneryDirector` scene components and the Dungeon Finder settings. The targeted scan also captures Challenge stone Lumberjack, which the accepted scan missed.
- Items gain these sources: From items for the bands of supply packs and the chests of used items, Collected from rows for world objects that spawn a chest, Dungeon rewards for the Corruption Token and Dungeon Finder runs, Dropped by rows for quest pickups, and world loot rows for cloth drops. Coverage counts every source kind.
- The change records one decision for each item that still has no source. An item joins the exclusion list of `correct-published-records` only with the evidence that the list requires. Other items keep their pages and appear on the coverage page.
- Out of scope: dialogue text and dialogue trees as reader pages, dialogue sources and dialogue teachers, and any ranking of rewards.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `item-property-presentation`: Item pages show the sources From items, Collected from for visual effect chests, Dungeon rewards, quest pickups, and cloth drops.
- `progression-data`: The catalog retains the game actions of every owner type and keeps the item grants of world objects and scene components.
- `reader-coverage`: Items with the new sources count as items with a known source.

## Impact

- Scan: owner actions in `packages/scan/src/probes/collectors/canonical.csx`. Visual effects, chest prefabs, and scene components in `world-sources.csx` or a new collector.
- Contracts and catalog: owner actions, visual effect chests, scene grants, and the cloth creature rule in `packages/contracts/src/catalog` and `packages/catalog/src`.
- Publication and site: item sources and coverage in `packages/publication/src` and `apps/site/src`.
- Evidence: native analysis of the item grant handlers in build 25653798, and use checks on a research character.
- Artifacts: a targeted scan, a compared catalog candidate, a publication candidate staged against the accepted publication, an update report, and joint acceptance.
