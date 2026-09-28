## Why

Recipe pages show materials but not the skill level or experience of a craft. The scan also captures resource node ranks, but the accepted catalog has no resource entities or linked rank yields.

## What Changes

- Recipe pages show each rank's required skill level, experience per craft, and the skill-level bands for full, half, or no experience. They link to the crafting rules without ranking recipes.
- Skill pages explain verified experience sources. They link gathering skills to resource nodes and distinguish known sources from any source whose game call remains unresolved.
- The catalog gains resource node entities, authored ranks, skill links, and rank-linked yields. Publication makes their names, yields, and known locations reachable through links and search.
- `/mechanics/crafting-and-gathering` explains crafting experience bands and resource spawners. It covers weighted selection by gathering skill, respawn time and jitter, player range, and attunement boosts after evidence checks.
- A read-only probe checks all attunement table entries before the page names effects beyond the decoded entry. The catalog and publication candidates follow one acceptance cycle.
- Out of scope: corruption and any claim that one recipe or item is best.

## Capabilities

### New Capabilities

- `crafting-and-gathering`: Published crafting rules, resource node reference pages, and source-aware spawner explanations.

### Modified Capabilities

- `detail-pages`: Recipe progression facts and skill experience sources appear on their existing pages.
- `progression-data`: The catalog retains resource node ranks, skills, and linked yields for publication.

## Impact

- Scan evidence: `packages/scan/src/probes/collectors/canonical.csx` and `world-sources.csx`; a read-only attunement probe.
- Contracts and catalog: resource facts, rank links, existing recipe facts, and public document schemas in `packages/contracts/src`, `packages/catalog/src`.
- Publication and site: resource references, recipe and skill documents, mechanics document, search and lists, item source links, and detail views in `packages/publication/src` and `apps/site/src`.
- Artifacts: a compared catalog candidate, a publication candidate staged against the accepted publication, an update report, and joint acceptance.
