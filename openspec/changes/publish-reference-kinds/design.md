## Context

The current change artifacts assume one detail page per record. The accepted catalog audit found 843 effects, 121 stats, 23 enchantments, and 5 factions. It found 886 effect ranks, 23 enchantment tiers, and 15 faction stances. A missing relation in the catalog does not prove that the game lacks that mechanic. The publication currently has no pages or search entries for these kinds.

The accepted publication `f5fc5486` uses build 25434619. Its documents contain the following references. Counts are references in published documents, not catalog record counts.

| Kind | Referenced records and document references | Consequence |
|---|---|---|
| Enchantments | 23 records, each referenced once from its own item document. The 23 item documents name 23 distinct enchantment keys. | The item's Enchants section is the natural home. |
| Stats | 94 records. Items make 3,221 references, NPCs 1,400, classes 113, and abilities 17. The median fan-in is 2; the maximum is 597 pages. | Link to a filtered item list instead of embedding every item in a stat row. |
| Effects | 26 records. Items make 180 references, abilities 42, NPCs 40, and quests 5. Stacking Effect Done has 172 references, including 169 from items. Night Active has 27, Potion Sickness 11, No Mount Zone 8, Combat Fatigue 8, and Feline Aspect 8. The median fan-in is 1. | Most effects are states that requirements check. A compact row explains each without a dedicated page. |
| Factions | 5 records. NPCs alone refer to them: Humans 241, Hostile 103, Neutral 37, Hostile Elementals 16, and Neutral Aggressive 1. | Link member counts to the filtered NPC list. These names describe combat alignments in this build. |

The 23 linked item documents cover all 23 enchantments counted in the accepted catalog audit. Most names match, but the links identify three differently named pairs: Enchant Strength / Strength Enchantment, Enchant Toxic Burst / Poison Enchantment, and Enchant Health / Health Enchantment. Use the structured enchantment key, never a name match. The accepted catalog audit also found no nested enchantment currency costs, item costs, or linked skill values. That absence is a capture or verification question, not proof of free enchanting.

`packages/publication/src/kind-registry.ts` already gives the NPC list a Faction column and facet. The stat filter on the item list comes from `add-list-filters`. The page-anchor pattern for records without a page comes from `restructure-page-model`.

## Goals / Non-Goals

**Goals:** Keep every reachable record and its key in a published home. Let readers follow links and inspect recorded facts without unsupported claims. Keep the difference between a recorded gap and verified absence visible.

**Non-goals:** Mechanics pages, recommended gear, rankings, guessed formulas, redirects, and compatibility aliases.

## Decisions

### Give effects, stats, and factions one glossary page each

Publish `/effects/`, `/stats/`, and `/factions/` in the Reference group. Give each reachable catalog record one row and one stable anchor. Derive anchors from formatted names, such as `/stats/#intellect`. On a collision, append a native-ID suffix, as page slugs do. Never show that ID in reader text. Give a reference and its search entry the row URL. Show the row content in its link tooltip. Keep the row key in the public glossary document and search entry for parity.

**Alternative rejected:** One detail page for each record would produce 843 effect pages and 121 stat pages from the audited catalog. Only 26 effects and 94 stats occur in the accepted publication's document references. Most effects have a fan-in of one, while one stat occurs on 597 pages. Five factions do not need separate pages to show their shared relationship model. Rows keep the catalog complete without multiplying nearly empty pages.

### Project verified facts into each row

An effect row shows its type, state, duration, stacking, removal, and rank behavior when recorded. It separates applications by abilities, items, effects, and stats from requirements that check the effect. Preserve rank, target, and chance where evidence supports them. Show an NPC or world interaction as an application only after its typed path is verified. A condition that names an effect is not itself an application.

A stat row shows its authored meaning where available. Show only verified minimum and maximum checks, percentage and vitality rules, and regeneration amounts and intervals. Link its classes and skills. Link “Items with <stat>” to the item list with that stat filter selected. Preserve fixed amounts, random ranges, and percentage units in the filtered list. Do not infer a formula from a stat name.

A faction row shows stances in authored order, with required points and alignment, default relations and starting points, and its member count. Link to the NPC list with its existing Faction facet selected. Do not confuse a combat alignment with a documented reputation reward. Show rewards or unlocks only after their typed owners and faction requirements are verified. A hidden reputation flag does not remove a faction.

**Alternative rejected:** Separate “things with X” pages or exhaustive reverse-link tables would duplicate filtered lists. Item stat references alone total 3,221, and the most referenced stat appears on 597 pages. Existing list filters keep the choice in a URL and preserve each list row's own facts.

### Put enchantments in their items

Add an Enchants section with a stable `#enchants` anchor to each linked item page. Show each tier's stat result, eligible item types, rarities, armor types and slots, weapon types and slots, currency and item costs, success rate, enchanting time, skill, and skill experience when recorded. Show the item's recorded acquisition sources through its existing sections. Check the game's eligibility and cost paths before expanding rules into item matches or interpreting absent costs. When no cost was captured, say “No cost recorded,” not “Free.”

Publish `/enchantments/` as a short list of enchanting items. Each row keeps the enchantment key and links to its item's Enchants section. An enchantment reference and search entry also target that section. If a future reachable enchantment lacks a published item, give it an anchored row on `/enchantments/`, record a coverage gap, and point its search entry and tooltip to that row. Its row shows supported facts and no invented item link. This fallback retains its key without making a new page for that record.

**Alternative rejected:** A separate enchantment page or glossary would repeat the same information beside its one-to-one item. The 23 accepted enchantment references each have one item document, so there is no missing item in this build. Three name differences also make a name-based fallback unsafe.

### Reuse publication identity and reference resolution

Project glossary documents and the item Enchants section through the existing contracts and publication paths. Keep row keys in documents and search entries. Resolve references to home-page anchors, as talent rows do. Update the coverage graph and parity checks to recognize the keys at those homes. The existing parity rule does not require a baseline URL or a list for a kind without pages. Do not retain former slugs or create redirects.

## Risks / Trade-offs

- A large glossary can exceed the document size limit or hide an anchored row behind collapsed content. Measure each document against the 262,144-byte limit. Keep anchor targets reachable and verify narrow-screen rows.
- Raw effect IDs appear in actions and conditions. Require a typed owner and a verified path before publishing an application. Keep requirements separate.
- Item-use lines are text, not structured effect links. Verify item-use dispatch before linking an item as an application. Label unrecorded sources without guessing from prose.
- Enchantment costs and faction rewards have empty captured rows. Inspect their game paths before claiming absence or adding capture fields. Keep unrecorded values distinct from zero.
- A future enchantment can lack an item. Give it the anchored fallback row and a coverage gap rather than a broken item link.
- The stat item filter depends on `add-list-filters`. Do not publish its action before the URL-backed filter works. The NPC Faction facet already exists.

## Migration Plan

Verify accepted catalog counts, links, rule semantics, and the structured enchantment-to-item mapping first. Capture missing typed facts only when the game evidence supports them. If capture changes, rescan affected data and check clean runtime cleanup receipts. Build a catalog candidate and compare changed rows with the accepted catalog.

Project glossary rows, item Enchants sections, the enchantment list, search targets, and tooltips. Publish a candidate and stage it against the accepted publication. Check graph, coverage, document size, and entity-key parity. Browse all four Reference links, representative anchors, filtered lists, search, and tooltips at 1440 px and 390 px. Record evidence in the update report. Accept the catalog and publication together, and retain the previous publication as rollback. Publish no legacy routes or redirects.
