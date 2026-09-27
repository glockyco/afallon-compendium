## Why

The game authors one NPC record for each pose, time of day, story stage, and flight point of one character. The compendium publishes each record as its own page, so a player sees "Fenric Doryn (#206)", "(#234)", and "(#235)" for one fisherman. 41 names cover 119 of 478 NPC records, and 29 ability names cover 74 ability records. The investigation found further defects in the same data. Random spawn choices show as simultaneous spawns. NPC levels show three different values. Friendly quest givers carry the "enemy" role. Some item and place names are not readable. Tooltips and quest pages have layout faults. Two operator tools misbehave.

## What Changes

- **BREAKING** One NPC page for each display name, compared without case. The page lists where and when the character appears and shows a variants table only when records differ in level, health, abilities, loot, or hostility. Old per-record NPC URLs return 404. No redirects are published.
- **BREAKING** One ability page for each display name, with the same variant model.
- References that mean one record (quest objectives, quest start and turn-in, drops, map markers) link to the character page and to the section of that record.
- Quest start and turn-in lists show each character once.
- A random activator becomes a placement rule: "one of N" alternatives, weighted by repeated targets. The map and the pages show these alternatives as alternatives.
- NPC levels come from rules that native code or runtime observation confirms. A spawner that scales with the player gives "scales with the player" in the spawner's zone range, or the scene's range. An NPC whose rule is not confirmed shows no level. The map, pages, and lists use the same rule.
- Hostility comes from faction standing, not from "combat enabled".
- **BREAKING** Page slugs follow display names in every kind. The code that kept old slug suffixes stable is removed.
- Item and place name qualifiers use the fact that differs, compare names without case, and never show "lvl. 0" or an internal scene name.
- Tooltips are positioned from their measured size, flip and shift to fit, reposition on load, scroll, and resize, and scroll only when no side fits. Quest tooltips shorten the completion text.
- The quest page removes empty and constant columns, joins offer and completion text, and uses one content width.
- The publication parity gate checks entity coverage instead of URL survival. A deployed entity must remain published as a page or as a variant of a page.
- `quit-game.ts` releases runtime ownership before the game quits.

## Capabilities

### New Capabilities
- `entity-identity`: how records group into public pages, how variants and their anchors are published, and how names and slugs are formed.
- `npc-presentation`: NPC levels, hostility, spawn alternatives, and where-to-find content.
- `reference-layout`: tooltip positioning and quest page layout.

### Modified Capabilities
- `game-update-workflow`: the parity gate checks entity coverage instead of URL survival, and the quit tool confirms cleanup before the game exits.

## Impact

- `packages/catalog`: random activator placement rules, NPC level rule inputs.
- `packages/publication`: `references.ts`, `documents.ts`, `lists.ts`, `map-shards.ts`, search, and document contracts in `packages/contracts/src/public`.
- `apps/site`: NPC and ability pages, quest page, tooltips (new dependency `@floating-ui/dom`), `scripts/publication-parity.ts`.
- `tools/update/quit-game.ts`.
- Research: targeted Ghidra decompilation of the NPC level functions for build 25434619.
- A new catalog and a new accepted publication. Deployment remains a separate decision.
