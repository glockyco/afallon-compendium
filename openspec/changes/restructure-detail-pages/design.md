## Context

See proposal.md for the motivation. The detail route renders `FactCard.svelte`, which dispatches to one `FactCard*.svelte` component per kind. Only the detail route uses `FactCard`, and it always passes `showRelations`. Tooltips and the map panel use their own components. Each relation table (`DropTable`, `VendorTable`, and others) decides its own columns with local flags, so the rules differ between tables. `EntityLink` sets `overflow-wrap: anywhere`, which breaks names inside words. `MissingValue` shows its explanation with CSS below the value. The spec covers exactly the seven page kinds: items, NPCs, quests, places, properties, abilities, and recipes.

## Goals / Non-Goals

**Goals:** one page skeleton, one section and table model with tested rules, and one explanation mechanism.

**Non-Goals:**
- List pages, the map panel, and the development-only map evidence panel.
- The coverage page. It keeps `EntityHeader` with its description.
- A loot rules page. Each table explains its own values. A page with further reading can follow later with confirmed, qualitative content.
- Document schema changes. Connection direction, a quest-only flag on NPC drop rows, and published loot constants need schema changes and stay out of scope.
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

- `planColumns(columns, rows)` removes a column with no value. For tables with two or more rows, it removes a column whose value is equal on every row when the column is marked `default` or `shownElsewhere`. A column marked `stateInHeading` becomes a heading-line sentence. This replaces the per-table `hasX` flags, which disagreed, for example the unconditional unlock column in `VendorTable`.
- `mergeRoles(rows, identity)` merges rows whose identity key is equal. The key is the counterpart and every displayed value, including conditions and placement ids. Only the role differs. Spot counts come from unique placement ids. Container rows with different conditions keep separate rows, because each row is one ANDed availability rule, and a union would lose the OR boundary.
- `visibleRows(rows, limit, targetId)` returns 15 rows, or all rows when the address fragment names a hidden row.

`RelationTable.svelte` renders sort controls, "Show all N", and a per-cell label element. Below 640 px, CSS shows each row as a block with these labels, so hints work in both layouts. Names use `overflow-wrap: normal`, and numbers use `white-space: nowrap`. `EntityLink` loses `overflow-wrap: anywhere`.

### Explanations

`apps/site/src/lib/floating.ts` holds the placement middleware, the one-open registry, and the intent timers. `EntityTooltip` and the new `Hint` both use it. `Hint` shows text only and loads no document. Column labels and `MissingValue` use `Hint`, so explanations open beside their label, one at a time, on hover, focus, or tap. Each drops table explains the loot roll, the minimum number of items, and the item chance in its label hints. The table does not depend on another page.

### Publication

`readableSuffixes` assigns the fallback after readable candidates. It takes positions in native-ID order, so the result is deterministic. A variant label becomes `Variant N`. A page qualifier becomes `(N)`. `ensureUniqueNames` appends positions instead of native ids. Fallback-labeled variants keep `n<nativeId>` anchors, and slugs keep their native-ID collision suffix. Anchors and slugs are not reader text and stay stable across builds. `projectPlace` fills `properties` from the properties whose place is the page.

### Recipe product

The detail route server load reads the product document with `loadDocumentForRef` for recipe pages and passes it to the hero.

## Risks / Trade-offs

- Challenge-stone items keep many container rows (Gold has 198). → The 15-row limit and sorting keep the section readable. Better condition wording is a separate change.
- A slug changes from `glacier-cave-43` to `glacier-cave-1`. → Existing slug policy publishes no redirects.
- Hidden rows could hide an anchor target. → `visibleRows` expands on a matching fragment.
- More content in item hover tooltips. → The summary shows counts only.

## Migration Plan

Implement the site and publication changes, publish a preview candidate from the accepted catalog, verify the publication graph and the pages in a browser, then accept the publication. Nothing is deployed.
