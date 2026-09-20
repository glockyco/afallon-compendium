## Why

Afallon 0.16.2 replaces the three outdoor scenes with one world and adds substantial item, quest, NPC, travel, and economy data. The current build 25153357 evidence cannot describe this release, and direct regeneration would risk mixing stale spatial review with new runtime data.

## What Changes

- Add a repeatable game-update workflow that records the installed Steam build and executable input hashes before and after an update.
- Keep the selected scan, catalog, publication, and production stage on the prior build until the new build passes reconciliation.
- Inventory and compare the new runtime data before changing extraction contracts or reviewed spatial inputs.
- Reconcile the merged outdoor world, teleport destinations, flight network, and all changed scene identities with new build-scoped map evidence.
- Reconcile release-note risk areas against runtime evidence: adventurers, roles, dungeon quests, items, equipment slots, weapon proficiency, loot, stats, bankers, auctioneers, and travel connections.
- Regenerate a complete build-scoped scan, required imagery, catalog, and preview publication without mixing evidence from build 25153357.
- Verify representative map, search, entity, relation, and coverage behavior before selecting or deploying the new publication.
- Preserve unsupported player-state systems, such as mail, bank contents, auctions, friends, and Dungeon Finder queues, outside the static compendium unless runtime evidence establishes a durable authored-data contract.

## Capabilities

### New Capabilities

- `game-update-workflow`: Defines installation identity, evidence reconciliation, candidate generation, comparison, and selection for an Afallon game update.

### Modified Capabilities

None. The existing scan, catalog, publication, and atlas contracts remain authoritative. This change defines how a new game build is admitted through them.

## Impact

- Operator CLI and documentation for updating the CrossOver Steam installation.
- Build identity and update evidence under the local artifact store.
- Runtime scan plans, collectors, and typed contracts where 0.16.2 changes source shapes.
- Reviewed map-space and capture inputs for the merged outdoor world.
- Catalog normalization and publication projections for newly supported authored data.
- Local build-scoped artifacts and production staging. Game binaries, raw evidence, captures, and generated publications remain untracked.
