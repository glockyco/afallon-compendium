## Why

Afallon has a world of adventurers: NPCs who arrive, take jobs, level up, earn gold, upgrade their gear, join the player's party, and fill Dungeon Finder parties. The compendium has no page that explains them, and the accepted catalog only holds the roster, arrivals, equipment bands, upgrade rewards, and kit upgrades. The native review of build 25653798 (`local/research/adventurers-20261002.md` in the main checkout) establishes how inviting, jobs, rewards, and party matching work, and names the settings that the catalog lacks.

## What Changes

- Capture the adventurer world settings that the rules read: job region names, the job duration bounds, the experience and gold per job, the most adventurers present, and the Dungeon Finder settings for tanks. Capture the pet facts of each adventurer's invite effect.
- Store them in the catalog with their sources, and verify the rules that the review left open in the running game: job durations and payouts, the invite rule, and Dungeon Finder party matching.
- Publish an Adventurers guide with sections on meeting and inviting adventurers, their jobs and progress, their gear upgrades, and Dungeon Finder parties, and link it from the Browse menu and from adventurer NPC pages.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `progression-data`: The catalog records the adventurer world and Dungeon Finder settings and the invite pet facts.
- `mechanics-pages`: An Adventurers guide explains adventurers from verified rules.

## Impact

- Scan collectors `relationships.csx` (adventurer world settings, Dungeon Finder settings) and `canonical.csx` (invite effect pet facts).
- Catalog contracts, normalization, database, and queries.
- Mechanics topics, the rules record, guide sections, the guide page, the Browse menu, and NPC pages.
- A new scan, a catalog candidate, a publication candidate, runtime checks, and joint acceptance.
