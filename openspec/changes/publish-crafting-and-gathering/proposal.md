## Why

Recipe pages show materials but not the skill level or experience of a craft. The accepted catalog has 17,344 gathering yields, but no page names the node that gives them. Build 25434619 has no resource node records: `GameDatabase.GetResources()` returns none. Gathering uses about 55 world node prefabs. Ore, herb, and fishing spawners place most of them, and scenes place some of them directly. Each prefab holds its loot table, its skill and character experience, and the requirements template that carries its skill gate and tool.

Recipe items do not name the recipe that they teach. The game links a recipe item to its recipe through a Recipe RankUp game action, and the scan does not capture item game actions.

## What Changes

- Recipe pages show each rank's required skill level, experience per craft, and the skill-level bands for full, half, or no experience. They link to the crafting rules without ranking recipes.
- Skill pages explain verified experience sources. They link gathering skills to their gathering nodes and distinguish known sources from any source whose game call remains unresolved.
- The catalog gains gathering nodes built from world evidence. Each node has its skill, skill gate and tool, skill and character experience, loot yields, spawned and placed locations, and attunement boost. Publication makes their names, yields, and known locations reachable through links and search.
- `/mechanics/crafting-and-gathering` explains crafting experience bands and gathering spawners. It covers weighted selection by gathering skill, respawn time and jitter, player range, and attunement boosts.
- The scan captures the game actions of items, including the actions of a template. A recipe item page names the recipe that the item teaches and the item that the recipe makes. A recipe page names the items that teach it.
- The catalog and publication candidates follow one acceptance cycle.
- Out of scope: the Savers skill and its recipes, which `correct-published-records` excludes before this change.
- Out of scope: corruption and any claim that one recipe or item is best.

## Capabilities

### New Capabilities

- `crafting-and-gathering`: Published crafting rules, gathering node reference pages, and source-aware spawner explanations.

### Modified Capabilities

- `detail-pages`: Recipe progression facts, skill experience sources, gathering node links, and the links between recipe items and recipes appear on their existing pages.
- `progression-data`: The catalog retains gathering nodes, their linked yields, and item game actions for publication.

## Impact

- Scan evidence: `packages/scan/src/probes/collectors/canonical.csx` for item game actions. `world-sources.csx` already captures the spawner options and node prefabs.
- Contracts and catalog: gathering node facts, yield links, existing recipe facts, and public document schemas in `packages/contracts/src` and `packages/catalog/src`.
- Publication and site: gathering node references, recipe and skill documents, the mechanics document, search and lists, item source links, and detail views in `packages/publication/src` and `apps/site/src`.
- Artifacts: a compared catalog candidate, a publication candidate staged against the accepted publication, an update report, and joint acceptance.
