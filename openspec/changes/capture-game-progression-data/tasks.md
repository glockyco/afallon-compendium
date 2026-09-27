## 1. Contracts

- [ ] 1.1 Add `SupportSchema` with the identity `compendium.support.v2` to `packages/contracts/src/raw/database.ts`, and keep the v1 schema registered for the admission of older targets. Verify that `bunx tsc -b packages/contracts` passes and that `schemaRegistry.require` resolves both identities.
- [ ] 1.2 Add the fact types for classes, spellbooks, talent trees, bonuses, talent points, skills, level templates, effects, enchantments, stats, factions, and ability rank mechanics to `CatalogFacts`, and the learner, unlock, and applier relations to `CatalogRelations`, in `packages/contracts/src/catalog/facts.ts`. Verify that `bunx tsc -b packages/contracts` passes.

## 2. Support collector

- [ ] 2.1 Compose the support collector with the `conditions` module and the v2 schema in `packages/scan/src/collectors.ts`. Verify that the scan package tests build the collector bundle.
- [ ] 2.2 Project classes, spellbooks, talent trees with the requirement groups of each node, bonuses with the requirement groups of each rank, and talent points in `support.csx`. Record a requirements template with the groups of the template. Verify with a HotRepl probe that Shieldmaster names its spellbooks and the talent tree Bastion Breaker.
- [ ] 2.3 Project skills, level templates, effects, enchantments, stats, factions, and ability rank mechanics in `support.csx`. Record every null record, list, or list member as an `unavailable` row with its field path. Verify with a HotRepl probe that each table count equals its source total and that a Stun effect records its type and duration, and write the measured byte count of the support artifact into this task.

## 3. Catalog

- [ ] 3.1 Add decoders for the new support tables to `packages/catalog/src/decoders.ts`, with an unsupported-enum issue for each enum value without a name. Verify with decoder tests for a Stun effect, a bonus rank with a percentage stat, a talent node with a requirement group, and an enum value without a name.
- [ ] 3.2 Normalize the decoded tables in `packages/catalog/src/normalize.ts`. Put the requirement groups of talent nodes and bonus ranks in `conditions` with the owner types `talentTreeNode` and `bonusRank`, and record a missing-reference issue for each ID that no record has. Verify with a normalization test in which a node names a missing ability: the issue appears and no learner is derived.
- [ ] 3.3 Add the link tables and the JSON detail columns to `packages/catalog/src/database.ts`, and store the rank mechanics of each ability next to its tooltip lines in `ability_facts`. Verify with a database test that writes and reads each new fact.
- [ ] 3.4 Return the new facts from `queryCatalogFacts`, and derive the learners of each ability, the unlocks of each recipe and resource node, and the appliers of each effect in `queryCatalogRelations`, sorted by class or skill, then level, tier, and row. Verify with query tests: a spellbook ability node at level 10 lists its class at level 10, and a skill talent tree recipe node at tier 2 lists the tree, tier 2, and its row.
- [ ] 3.5 Map `compendium.support.v2` to the relationships family and load support evidence of the canonical target with the v2 schema in `packages/catalog/src/evidence.ts`. Verify with admission tests: a v1 canonical target stops the build with an error that names the target, and a v1 scene scan beside a v2 canonical target is admitted.

## 4. Scan and catalog candidate

- [ ] 4.1 Run `local/scan-25434619-scene-44.json` with the configured research character through the HotRepl runtime procedure. Verify that the run manifest has the status `succeeded` and that the runtime receipt is clean.
- [ ] 4.2 Author a catalog plan that replaces the scene 44 manifest with the new run and keeps the other five scans. Build the catalog candidate through the bootstrap review, the bootstrap catalog, the complete review, and the final catalog, as `local/catalog-rescan-25434619.sh` does. Verify that the final catalog reports no unresolved coverage issue.
- [ ] 4.3 Compare the candidate with the accepted catalog 80fe12e0 through `tools/update/compare-catalogs.ts`. Verify that the only differences are the new facts and the new condition rows. Stop for review on any other difference.
- [ ] 4.4 Check the scenarios of the progression-data spec against the candidate: the talent trees of Shieldmaster, the talent point gain rules, the experience of each class level, and the learners of one class ability. Verify that each scenario holds in the candidate, and write the result of each check into this task.

## 5. Checks

- [ ] 5.1 Run `bunx tsc -b packages/contracts`, `bun run check`, `bun run --cwd apps/site check`, `bun test ./packages ./apps`, and `openspec validate capture-game-progression-data --strict`. Verify that each command passes.
