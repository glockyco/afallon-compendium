## Context

See proposal.md for the motivation. The detail route renders `FactCard.svelte`, which dispatches to one `FactCard*.svelte` component per kind. Only the detail route uses `FactCard`, and it always passes `showRelations`. Tooltips and the map panel use their own components. Each relation table (`DropTable`, `VendorTable`, and others) decides its own columns with local flags, so the rules differ between tables. `EntityLink` sets `overflow-wrap: anywhere`, which breaks names inside words. `MissingValue` shows its explanation with CSS below the value. The spec covers exactly the seven page kinds: items, NPCs, quests, places, properties, abilities, and recipes.

## Goals / Non-Goals

**Goals:** one page skeleton, one section and table model with tested rules, and one explanation mechanism.

**Non-Goals:**
- List pages, the map panel, and the development-only map evidence panel.
- The coverage page. It keeps `EntityHeader` with its description.
- A loot rules page. Each table explains its own values. A page with further reading can follow later with confirmed, qualitative content.
- Document schema changes other than connection direction. A quest-only flag on NPC drop rows and published loot constants need schema changes and stay out of scope.
- Publication inclusion of the 14 "Savers" recipe records without product or materials, and of the 8 place pages without content.
- New wording for the challenge completion condition ("Stacking effect done ..."). It stays as the authored condition.

## Decisions

### Page anatomy

| Kind | Title block facts | Hero view | Hero facts | Sections in order |
| --- | --- | --- | --- | --- |
| Item | name (rarity colour) | item tooltip | description, How to get it, Used for, buy price, stack size | Dropped by, Sold by, Found in containers, Gathered from, Collected from, From quests, Crafted from, Used in recipes, Needed for quests |
| NPC | roles, type, level, places, Boss of | portrait | description, stats, immunities, faction, species, creature type, combat facts, favoured loot, faction changes, linked NPC | Where to find, Variants, Abilities, Drops, Sells, Quests |
| Quest | quest level, minimum level, chain step, world quest, repeatable, dungeon | none | none | Quest chain, Start and turn-in, Objectives, Rewards, Quest text, World changes, Unlocks |
| Place | type, level range, parent, Adventure Guide listing | artwork | description | Bosses, Creatures, NPCs, Points of interest, Quests, Properties, Connections, Areas |
| Property | type, place | purchase panel | description, sign areas | Where to buy (only with several signs) |
| Ability | none | tooltip of the most-used version | none | Versions, Used by, Taught by |
| Recipe | station, skill, rank above zero | product tooltip | product quantity | Materials |

Every fact is conditional on a published value. Full-width sections replace the card grid, because the grid produced unequal heights and squeezed wide tables. Tabs were rejected because they hide content from find-in-page and anchors.

### Components

New components live in `apps/site/src/lib/detail/`: `DetailPage` (kind switch), `TitleBlock`, `Hero`, `Section`, `FactList`, `LinkGrid`, `RelationTable`, `Hint`, and one page component per kind. Section components per relation replace the table components listed in the proposal. The `FactCard*` components, `Fact`, `FactGrid`, `ChipGrid`, `RefList`, and the unused `LocationList` go away. `EntityHeader` keeps only its compact form for tooltips and its page form for coverage, which also keeps `Card`.

### Table rules as pure functions

`apps/site/src/lib/detail/relation-table.ts` holds the rules, and `bun test` covers them:

- `planColumns(columns, rows)` removes a column with no value. In a table with two or more rows, a column whose rows all hold one value follows its `whenShared` policy: `omitWhenShared(value)` removes it when the shared value is the default, `omitAlways` removes it because the page shows the value elsewhere, and `stateInHeading` moves the value into the heading line. This replaces the per-table `hasX` flags, which disagreed, for example the unconditional unlock column in `VendorTable`.
- `mergeRows(rows, key, merge)` merges rows whose key is equal, in first-seen order. The key holds the counterpart and every displayed value, so only the role can differ. `quest-rows.ts` builds the merged quest rows of NPCs, items, and places with it. `uniquePlacements` counts each spot of merged rows once. Container rows with different conditions keep separate rows, because each row is one ANDed availability rule, and a union would lose the OR boundary.
- `shownRowCount(total, expanded)` gives 15 rows until a reader expands the table. `RelationTable` expands it when the address fragment names an anchor in a hidden row.

`RelationTable.svelte` renders sort controls, "Show all N", and a per-cell label element. Below 640 px, CSS shows each row as a block with these labels, and the header row becomes a line of sort controls and hints. Names use `overflow-wrap: break-word`, which breaks a word only when the word alone is wider than its column, and numbers use `white-space: nowrap`. `EntityLink`, `EntityReference`, and `EntityHeader` lose `overflow-wrap: anywhere`.

### Explanations

`apps/site/src/lib/floating.ts` holds the placement middleware, the one-open registry, and the intent timers. `EntityTooltip` and the new `Hint` both use it. `Hint` shows text only and loads no document. Column labels and `MissingValue` use `Hint`, so explanations open beside their label, one at a time, on hover, focus, or tap. Each drops table explains the loot roll, the minimum number of items, and the item chance in its label hints. The table does not depend on another page.

### Publication

`recordLabels` assigns the fallback after readable candidates. It takes positions in native-ID order, so the result is deterministic, and it rejects two equal labels in one group. A variant label becomes `Variant N`. A page qualifier becomes `(N)`. MOB no longer qualifies a variant. A record without a name reads as "Unnamed" with its kind and keeps its own page. `ensureUniqueNames` appends positions instead of native ids. Fallback-labeled variants keep `n<nativeId>` anchors, and slugs keep their native-ID collision suffix. Anchors and slugs are not reader text and stay stable across builds. `projectPlace` fills `properties` from the properties whose for-sale signs all stand in the place.

An NPC page groups its drops by the rule of their loot list: the share of kills that roll the list, the minimum number of items, and the limit. `assertDistinctLootRules` stops the publication when two loot lists of one NPC have the same rule and a minimum or a limit, because the page would show them as one group with a wrong item count.

`shownNpcStats` leaves out a stat whose amount is zero, in the page and in the variant comparison. The variant comparison compares stats and faction changes without their order. Two records that list the same stats in a different order are then not variants.

### Connections

A place document lists teleports only. The kinds `effect-teleport`, `game-action-teleport`, and `game-action-effect-teleport` differ only in how the game authors the action, so a page does not show the kind. A `dungeonEntranceTrigger` opens the dungeon panel and loads nothing, as `classifyTransition` in `packages/scan/src/world-roles.ts` records. The teleport beside it moves the player, so the publication leaves the trigger out. Any other kind stops the publication until someone decides whether it moves the player.

`ConnectionRow` v2 replaces `kind` with `direction`. The direction is `to` when the teleport starts in the place and ends in the counterpart, `from` when it starts in the counterpart and ends in the place, and `within` when it starts and ends in the place. The place document schema becomes `compendium.static-place.v5`.

Eight caves and dungeons hold an active copy of the Duskfall Depths entrance teleporter. Each copy stands at the world position of the Duskfall entrance, about 600 units from its cave and outside the game map of its cave. Castle Ruins and Glacier Cave hold copies of a second teleporter in the same way. The publication leaves out a teleport when its start lies outside the game map of its place and a teleport in another place starts within 0.1 units of the same world position and has the same destination. A teleport outside its map without such a copy stays, for example the exit of Sanctum of the Veilpiercer. The catalog transition query returns the map space, the map position, and the world position of each start object for this rule.

The Connections table has a Teleport column with "To <place>", "From <place>", or "Within this place", and a Starts at column with the map spots of the start object. Rows merge when the direction and the place are equal.

### Typed pages

`isPublicPageKind` narrows a registry or reference kind to a page kind. The loader returns the static document with its `kind`, so `DetailPage`, `TooltipPresenter`, and the map select the view of a kind by that discriminant instead of a cast.

### Recipe product

The detail route server load reads the product document with `loadDocument('items', slug)` for recipe pages and passes it to the hero.

## Risks / Trade-offs

- Challenge-stone items keep many container rows (Gold has 198). → The 15-row limit and sorting keep the section readable. Better condition wording is a separate change.
- A slug changes from `glacier-cave-43` to `glacier-cave-1`. → Existing slug policy publishes no redirects.
- Hidden rows could hide an anchor target. → `RelationTable` expands on a matching fragment.
- More content in item hover tooltips. → The summary shows plain text lines only.
- The copy rule could hide a real teleport. → The rule needs two signals: a start outside the game map of its place, and a copy at the same position in another place. A teleport outside its map without a copy stays.

## Migration Plan

Implement the site and publication changes, publish a preview candidate from the accepted catalog, verify the publication graph and the pages in a browser, then accept the publication. Nothing is deployed.
