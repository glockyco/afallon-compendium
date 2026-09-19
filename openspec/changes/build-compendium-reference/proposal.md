## Why

The atlas answers "where is it" but the site has no reference half: production builds hide the detail panel, the Adventure Guide only mirrors four native groups, and every item, NPC, quest, and place fact is stored as an opaque `gameplay` blob rendered as auto-labelled key/value rows in development builds. The catalog already holds 1,076 items, 357 NPCs, 133 quests, 208 loot tables, 40 scenes, and 25 support families, so the missing work is a typed public model and the pages, lists, links, and search that turn it into a wiki-grade compendium.

## What Changes

- Add a compendium reference: one prerendered page per canonical entity, a filterable list per kind, hover tooltips on every entity link, a shared search corpus, and a data-coverage page.
- Add typed per-kind public documents (`PublicItem`, `PublicNpc`, `PublicQuest`, `PublicPlace`, `PublicProperty`, `PublicAbility`, `PublicRecipe`, `PublicGearSet`, and later kinds) that replace the generic `sections` projection. Each document carries its player-facing facts and its relations as named, typed row lists in both directions, computed at publication from the sealed catalog.
- Add one shared link contract, `EntityRef` (key, kind, name, slug, icon), resolved and disambiguated once at publication, embedded in every relation row, and audited so that every published reference resolves to a page or renders as text.
- Add a kind registry that owns the label, route prefix, icon, list columns, and search membership of each kind.
- Promote support families that pages link to (abilities, effects, recipes, crafting stations, factions, currencies, skills, classes, races, enchantments, gear sets, species) to canonical kinds with typed facts. Gear sets gain their members and tier bonuses, which the game's own item tooltip shows and no evidence carried.
- Decode player-facing fields from the canonical records into typed catalog facts per kind instead of leaving them in the opaque `gameplay` payload.
- Extract and publish entity artwork: item icons, ability icons, NPC portraits, and dungeon and region art referenced by the native guide.
- **BREAKING** Remove the Adventure Guide routes. Dungeons and regions become place pages, bosses become NPC pages, and properties become property pages. The `/guide` paths are deleted without redirects; an old link reaches the not-found page.
- **BREAKING** Remove the requirement that the guide mirrors the game's own structure. The native guide remains an input for artwork, descriptions, level ranges, and boss references.
- Keep the atlas selection panel development-only. Production selection behaves exactly as before, without rendering any panel, and a stale selection still explains itself inline.
- Relax the evidence-limit rule. A page may state a specific missing fact in the place that fact would occupy. Pages do not add limitation rows, sections, or banners. The full coverage ledger lives on one coverage page.
- Publish the item search and entity search from one corpus that map results and page results share. Guide records are no longer a separate, unsearchable set.

## Capabilities

### New Capabilities

- `compendium-reference`: entity pages, kind lists, cross-links and tooltips, shared search, evidence-limit presentation, coverage page, and route scheme for the reference half of the site.

### Modified Capabilities

- `adventure-guide`: the "mirrors the game's own structure" requirement is removed. Loot chance semantics and place and item links move into `compendium-reference` and apply to every page, not only boss entries.
- `interactive-atlas`: "Details answer player questions" changes so that production renders no panel at all while selection behaviour is unchanged, and a stale selection still explains itself. "Evidence limits stay outside the interface" changes to the inline-replacement rule. "Search connects items to places" changes to the shared corpus across map and pages.
- `static-publication`: "Detail and authoring controls remain development-only" changes to keep only authoring and evidence controls development-only. New requirements add typed per-kind entity documents, the `EntityRef` link contract with a publication-time audit, the kind registry, entity artwork resources, and prerender entries.
- `canonical-catalog`: new requirements add typed player-facing facts per kind and canonical kinds for the linked support families.
- `scan-workflow`: new requirement adds entity artwork extraction with content hashes and native asset provenance.

## Impact

- `packages/contracts/src/public/resources.ts`: new per-kind document schemas, `EntityRef`, kind registry schema, artwork resource schema; `PublicEntity.sections`, `PublicAdventureGuide*`, and `StaticGuideDocument` are removed after cutover.
- `packages/contracts/src/raw/database.ts` and `packages/catalog/src/{normalize,decoders,projections,queries}.ts`: typed fact decoding per kind, new canonical kinds, reverse-relation queries.
- `packages/publication/src/{entity-projection,guide-projection,guide-resources,index-resources}.ts`: replaced by per-kind projections, link resolution and audit, artwork resources, and a shared search corpus.
- `packages/scan/src/probes/collectors/`: artwork extraction probe for sprites and guide art.
- `apps/site/src/routes/`: new `/<kind>/` and `/<kind>/<slug>/` routes and `/coverage/`, with the `/guide` tree deleted; `apps/site/src/lib/` gains the fact card, relation tables, `EntityLink` with tooltip, list table, and the production atlas panel.
- `openspec/changes/build-screenshot-first-map/tasks.md` task 6a.10 (Adventure Guide surfaces) is superseded by this change and is not completed there.
- Deployment parity checks gain page and artwork resources. The essential-resource budget is unchanged because pages load their own documents.
- `README.md` and `EXPLORATION.md` describe the compendium routes and the artwork evidence.
