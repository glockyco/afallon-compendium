## Context

The catalog keeps one entity for each native record. A publication can group records without changing catalog identity. The scanned world also records random activator targets and property signs. The site reads the published map, pages, and relation tables.

## Goals and Non-Goals

**Goals:** Group creature and ability pages, preserve record-specific references, present confirmed levels and random choices, and make reader pages and coverage useful.

**Non-Goals:** Preserve retired URLs, group items or places into one page, or publish a saved character's level.

## Decisions

### Group records in the publication

`groupEntities` groups NPC and ability records by NFKC-normalized, lowercase names with curly apostrophes folded to straight apostrophes and whitespace collapsed. Other kinds keep one group per native record. Each group uses its lowest-native-ID member as its page key. Its title takes the most frequent formatted spelling. Equal frequencies take the first spelling in native-ID order.

`displayName` removes native markup. It capitalizes the first lowercase letter of each word and keeps existing uppercase letters. An already lowercase short word, such as “of”, “the”, or “into”, stays lowercase inside a name. Published entity names, map labels, region names, area labels, object and container labels, and chain names use this formatter. Qualifier sources use readable labels. Native enum qualifiers use `readableFact`, which lowercases the rest of an enum label.

### Preserve record references and show useful variants

Each creature member has a key, label, anchor, optional level, optional differing portrait, and only its differing record facts. Candidate labels use place, area, level, and type before a native-ID fallback. Each reference to a member links its page and anchor. Its name adds the member label only when `variantFields` contains a difference in record facts. A variants table appears when `variantFields` is nonempty or a drop row has variant attribution. Otherwise, `Where to find` holds the variant names and anchors, including an unplaced-variant list.

A relation naming several members of the same page resolves to the page reference. Shared record facts appear once. Drop and vendor rows are attributed relative to variants that have rows. If only one variant has any drops, its rows have no variant attribution, so drops alone do not select the variants table. A creature page's level is the union of its location levels. Each variant carries the union of its own location levels.

Ability records with identical rank indexes and rank texts form one version. A version has its own anchor, ranks, users, and teaching items. A version carries an icon only when it differs from the page icon. Record references link a version anchor when the page has several versions.

### Model random choices as authored entries

The catalog stores `random_choices` and `random_choice_entries`, not `placement_alternatives`. An admitted activator with a known target count stores its enabled count and every target entry. Each entry retains its index, target path, and descendant source IDs. Repeated targets remain repeated entries. `randomChoicesByPlacement` finds each placement's enclosing choices and orders them from outermost to innermost. A choice gives its entry count, distinct target-path option count, and matching entry indexes. Its enabled count is clamped to zero through its entry count. An unknown target counts as its own option.

`enabledChance` computes the chance that a uniform pick of distinct enabled entries selects at least one entry containing a placement. `choicesChance` multiplies the chances of nested choices. Publication rejects a placement whose enclosing choices give it zero chance. Other map placements carry `alternative: { chance, options }`. When the innermost choice enables one entry, map options count its distinct targets. Otherwise, map options is one. Creature locations group compatible spots. For a one-entry choice with distinct options on that creature page, a location counts its distinct options and the chance of the matching entries. The UI writes “One of N random spots, X% chance” when N exceeds one and chance is below 100%. It omits a certain chance and writes “Random spawn” for one option.

### Use confirmed level and placement rules

`levels.ts` normalizes scene and spawner zone ranges. An override that scales uses the spawner zone range when enabled, then the scene range. A fixed override rolls its own minimum and maximum. Without a level override, the NPC record determines scaling or the fixed range. An unbounded scaling range starts at level 1. `COMPANION` and `ADVENTURER` records have no published level because their saved progression is player state. The placeholder record range 100–100 and other unconfirmed paths supply no level.

`map-shards.ts` computes record levels per placement from spawner details and uses the union for markers. Documents use those same placement levels for locations, variants, page unions, and place creature rows. Creature list rows format an open range as “15+”. Hostility follows placement categories from faction standing, not combat enablement. `shownCategories` hides `townsfolk` when the creature offers a service. The same category logic serves map markers and pages.

Creature locations group compatible placements by label, availability, level, roles, quests, and random choice. They sort by the earliest chain order among their availability-rule quests and own quests, then by label and placement ID. Quest starts and turn-ins group records by page. Each character entry contains its reference and the sorted area labels of its participating variants. `turnIns` has the shape `Array<{ npc, areas }>`. Multiple participating variants use a page reference.

### Use readable identity and list only page kinds

Page slugs derive from formatted display names and qualifiers. A native-ID suffix resolves a remaining slug collision. Items use rarity, gear type, weapon damage, level requirement, or stats as qualifier candidates. Places use type, parent, closed level range, combinations, or an entrance area with an ordinal when needed. Creature member labels use place, area, level, type, or native ID. Qualifiers do not use a level of zero or an internal scene object name.

Gear sets have no page or list. A member item embeds its set's key, title-cased name, member references, and tiers. A tier records its required equipped count and stats.

### Present entities with one visual system

`EntityHeader` renders real artwork only, then a title, one fact line, and an optional description. A fact has an optional label and optional link. The header does not render badges or fallback glyphs. The item page embeds its in-game tooltip card with linked references. Its `How to get it` summary links to source relation tables below. A property page embeds a purchase panel with available artwork, type, purchase price, income per payment, and sale price. Its `Where to buy it` card links to the for-sale sign locations.

A for-sale sign reads its typed `RPGProperty` reference. The catalog merges its type, currency, purchase price, sale price, and income with the canonical property record. Repeated signs of one property must agree. A conflicting field in a canonical record also fails normalization. Map sign markers include the property page key. The interval and currency of property income are not confirmed, so the panel does not claim either.

The quest page uses Start, Turn-in, and Requirements cards with the same card style. Its header gives the chain name and step as a labeled fact. Objective completion and reward columns appear only when useful. Requirements and availability render inline phrases with type prefixes, and availability rules order requires before excludes before temporary. An item requirement uses “Has X”, “Does not have X”, or “X equipped” for its ownership state. Search places a spinner inside its input during loading. Site navigation names the map “Map”.

On desktop, `EntityTooltip` starts at `right-start` beside its link. Floating UI tries `left-start`, `bottom-start`, and `top-start`, then shifts inside the viewport. Its size and position update as content loads, scrolls, or resizes. Narrow screens use a fixed bottom overlay.

### Separate reader coverage from the operator gate

`compendium.static-coverage.v2` contains page counts per kind, map count, map-location count, and five gap groups. Each gap carries affected page references. The groups are `itemWithoutSource`, `npcWithoutLocation`, `npcWithoutLevel`, `placeWithoutMap`, and `unresolvedReference`. The coverage page explains these groups and links affected pages. The publication graph checks map and placement counts, page counts, and gap references. The map does not load coverage. Operator gate numbers and publication issues remain in publish command output.

The parity reader compares published entity keys from search entries, page keys, creature variant keys, ability version keys, and embedded gear set keys. Baseline resources are read by field shape, without requiring current schemas. A list remains required only for a kind that still has pages. Parity does not preserve old page URLs.

### Quit after a confirmed release

The quit probe registers `Application.Quit()` as a runtime cleanup callback. The runtime release writes its clean receipt before the game quits. The tool waits for the HotRepl listener to close.

## Risks and Remaining Work

- Page slugs and page-local anchors can change when names or facts change. Old URLs have no redirect.
- Confirm the property income interval and currency with native evidence before publishing them.
- Derive world loot drops on item pages from the native loot rule.
- Explain the challenge completion effect in availability.
- Rebuild the catalog from the rescan, publish a candidate, review the affected pages in a browser, and accept the publication. Deployment remains separate.
