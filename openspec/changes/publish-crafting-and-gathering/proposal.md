## Why

Recipe pages show materials but not the skill level or experience of a craft. The scan also captures resource node ranks, but the accepted catalog has no resource entities or linked rank yields.

Recipe items do not name the recipe that they teach. The game links a recipe item to its recipe through a Recipe RankUp game action, and the scan does not capture item game actions. The Savers skill appears as a crafting skill, but its records store progress flags.

## What Changes

- Recipe pages show each rank's required skill level, experience per craft, and the skill-level bands for full, half, or no experience. They link to the crafting rules without ranking recipes.
- Skill pages explain verified experience sources. They link gathering skills to resource nodes and distinguish known sources from any source whose game call remains unresolved.
- The catalog gains resource node entities, authored ranks, skill links, and rank-linked yields. Publication makes their names, yields, and known locations reachable through links and search.
- `/mechanics/crafting-and-gathering` explains crafting experience bands and resource spawners. It covers weighted selection by gathering skill, respawn time and jitter, player range, and attunement boosts after evidence checks.
- A read-only probe checks all attunement table entries before the page names effects beyond the decoded entry. The catalog and publication candidates follow one acceptance cycle.
- The scan captures the game actions of items, including the actions of a template. A recipe item page names the recipe that the item teaches and the item that the recipe makes. A recipe page names the items that teach it.
- The Savers skill, its 13 recipes, and its crafting station get no pages, list rows, or search entries. A reviewed exclusion in the publication presentation records the reason and the evidence. The catalog keeps the records.
- Out of scope: corruption and any claim that one recipe or item is best.

## Capabilities

### New Capabilities

- `crafting-and-gathering`: Published crafting rules, resource node reference pages, source-aware spawner explanations, and reviewed exclusions of progress flags.

### Modified Capabilities

- `detail-pages`: Recipe progression facts, skill experience sources, and the links between recipe items and recipes appear on their existing pages.
- `progression-data`: The catalog retains resource node ranks, skills, linked yields, and item game actions for publication.

## Impact

- Scan evidence: `packages/scan/src/probes/collectors/canonical.csx`, including item game actions, and `world-sources.csx`; a read-only attunement probe.
- Contracts and catalog: resource facts, rank links, existing recipe facts, and public document schemas in `packages/contracts/src`, `packages/catalog/src`.
- Publication and site: resource references, recipe and skill documents, mechanics document, search and lists, item source links, and detail views in `packages/publication/src` and `apps/site/src`.
- Publication presentation: a reviewed exclusion list in `compendium.publication-presentation.v2`. Staging parity accepts only the removals that the list names.
- Artifacts: a compared catalog candidate, a publication candidate staged against the accepted publication, an update report, and joint acceptance.
