## Why

The game authors several creature and ability records with the same player-facing name. One page per record splits a character's locations and an ability's users. Random choices, levels, hostility, and item sources need consistent presentation across the map and pages. Readers also need clear names, useful item and property pages, and a view of publication gaps.

## What Changes

- **BREAKING** Creature and ability records with the same normalized name share a page. Creature records retain variant anchors. Ability records with identical rank texts share a version.
- Record-specific references retain their variant. References to several variants of one page resolve to that page. Creature pages show a variants table for differing record facts or variant-attributed drops. Otherwise, their location table names the variants.
- Random activators publish choices, entry membership, and the chance that a placement stays active. Map markers and creature locations show random spots and chance. Confirmed native rules supply creature levels. Placement categories supply hostility and services.
- Quest starts and turn-ins group records of one character and list its areas. Creature locations follow the earliest chain order of their availability quests and own quests.
- Names and map labels use the publication's title-case formatter. Slugs follow display names, with native IDs only for collisions. Items, places, and creature variants use readable qualifiers where possible.
- Gear sets have no pages. Member item pages embed set members and tiers. Item pages show an in-game tooltip card with links and a linked acquisition summary. Property pages show the purchase panel and for-sale signs.
- Entity pages share one header style. Quest pages use aligned Start, Turn-in, and Requirements cards, with a labeled chain fact. Requirements use inline phrases. Search shows its loading spinner in the input and navigation calls the atlas “Map”. Entity tooltips open beside links when space permits.
- A reader-facing coverage page lists published pages, maps, map locations, and gaps with affected pages. Publication parity checks entity keys rather than old URLs. The quit tool releases runtime ownership before game exit.

## Capabilities

### New Capabilities

- `entity-identity`: name grouping, variants, ability versions, references, display names, slugs, and qualifiers.
- `npc-presentation`: random choices, creature levels, hostility, locations, and quest characters.
- `reference-layout`: shared headers, tooltips, quest layout, search feedback, and navigation.
- `item-property-presentation`: embedded gear sets, item acquisition, and property purchase facts.
- `requirements-presentation`: availability phrases and item ownership text.
- `reader-coverage`: published counts and gaps for readers.

### Modified Capabilities

- `game-update-workflow`: entity-key parity across publication shapes and confirmed runtime cleanup.

## Impact

- `packages/catalog` records random choices, property sign facts, and requirement spans.
- `packages/publication` groups records, projects levels and alternatives, produces documents and maps, and builds reader coverage.
- `packages/contracts/src/public` defines the page, map, and coverage resources.
- `apps/site` renders entity pages, tooltips, search, map labels, and coverage. Its parity script compares baseline and candidate by shape.
- `tools/update/quit-game.ts` requests game exit after runtime cleanup.
- A catalog rebuild from the rescan, publication, browser review, and acceptance remain open. Deployment is a separate decision.
