## Why

The detail pages grew one fix at a time, and each kind now arranges its content differently. Cards of different heights sit side by side, wide relation tables squeeze into half-width columns, and notes, empty columns, duplicate rows, repeated facts, and record ids crowd the pages. On phones, tables scroll sideways and names break inside words. The pages need one structure that answers a player's questions in a fixed order, as the monster, zone, NPC, and quest pages of the Ancient Kingdoms Compendium do.

## What Changes

- Every detail page uses one structure: the breadcrumb, a title block, an optional hero, and full-width sections. No two cards share a row.
- The title block shows the name, one line of identity facts, and at most one "View on map" action. Artwork and descriptions move into the hero.
- The hero is one panel. It shows the entity as the game shows it (item tooltip, NPC portrait, place artwork, property purchase panel, ability tooltip, or recipe product tooltip) beside the description and the key facts. On an item page, the key facts answer "How to get it" with names and prices, and each line links its section.
- All sections share one heading style (icon, title, count, and one optional line) and one panel. A section without content does not appear.
- Relation tables follow shared rules: no empty columns, no column that repeats a default or a value from elsewhere on the page, one row per role only where rows are otherwise equal, names that wrap only between words, 15 visible rows with a "Show all" control, and stacked rows on phones.
- Each section explains its own values in place: plain column labels, an explanation on each label that follows a game rule, and at most one sentence in the heading line. No note appears under a table.
- Each kind orders its sections by the reader's questions. Places split bosses from other creatures, merge identical connection rows, and list only the points of interest that no other row shows. Quests show the chain, one "Start and turn-in" section, objectives, rewards, and the quest text. NPCs show a portrait hero with stats and immunities and one Quests section. A recipe shows its product's tooltip.
- Reader text shows no record id and no internal enum word. A variant or a page without a readable qualifier uses an ordinal instead of its native id.
- Reader text calls the interactive map "the map".
- The hover tooltip of an item shows its How to get it summary, as the accepted item requirement already demands.
- Place documents list the properties in the place. The field exists but the publication leaves it empty.
- Place connections say which way each teleport goes: to another place, from another place, or within the place, with the map spots where it starts. They leave out the dungeon entrance trigger, which loads nothing, and leftover copies of teleporters that stand outside the game map of their place.
- NPC variants no longer differ by the order of their stats or by a stat of zero, and a publication stops when two loot lists of one NPC would merge on the page.

## Capabilities

### New Capabilities

- `detail-pages`: the page structure, the title block, the hero, sections, relation table rules, in-place explanations, and the content of each kind.

### Modified Capabilities

- `reference-layout`: the page header and the quest layout move into `detail-pages`. The map naming rule covers all reader text.
- `item-property-presentation`: the item page shows its tooltip and a How to get it list in the hero, then full-width source sections.
- `entity-identity`: an ordinal replaces the native id as the fallback qualifier, and the Where to find table holds variant anchors without a Variant column when the page has no variants table.
- `npc-presentation`: one Start and turn-in row names whether a character starts a quest, completes it, or both.

## Impact

- Site: the detail route `apps/site/src/routes/[kind]/[slug]/`, new detail components under `apps/site/src/lib/detail/`, the item hover tooltip, `EntityTooltip.svelte` (shared floating behaviour), `EntityLink.svelte` (word wrapping), `MissingValue.svelte`, `compendium.css`. The `FactCard*.svelte`, `RefList.svelte`, `DropTable.svelte`, `VendorTable.svelte`, `ContainerTable.svelte`, `GatherTable.svelte`, `QuestTable.svelte`, `RecipeTable.svelte`, `NpcLocations.svelte`, `NpcVariants.svelte`, `AbilityPhases.svelte`, `Fact.svelte`, `FactGrid.svelte`, `ChipGrid.svelte`, and the unused `LocationList.svelte` components go away.
- Publication: fallback qualifiers and labels in `packages/publication/src/references.ts`, variant comparisons in `packages/publication/src/variants.ts`, place properties, the loot rule check, and stats in `packages/publication/src/documents.ts`, and place connections in a new `packages/publication/src/connections.ts`.
- Contracts: `isPublicPageKind`, `ConnectionRow` v2 with `direction` instead of `kind`, and the place document schema `compendium.static-place.v5`. The catalog transition query returns the position of each start object. The catalog database and the scan do not change. A new preview publication and an acceptance follow.
- Verification: the site check, unit tests for the table rules and the fallback qualifiers, and browser screenshots of every kind at 1440 px and 390 px widths.
