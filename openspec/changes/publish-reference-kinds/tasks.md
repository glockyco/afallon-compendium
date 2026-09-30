## 1. Verify evidence and identity

- [ ] 1.1 Count all four kinds in the accepted catalog. Compare the 23 enchantment keys with structured item links in the accepted publication. Verify each key has one published item or record a coverage gap. Check differently named pairs by key, not by name.
- [ ] 1.2 Verify effect rank fields, ability applications, typed world actions, NPC ability ranks, and effect requirements. If captured fields do not settle a rule, use a bounded read-only game probe. Verify one named application and one named check stay separate.
- [ ] 1.3 Inspect item-use dispatch for structured effect applications. Extend capture only if the game provides a typed link. Verify one named item and effect, or confirm that prose alone creates no application link.
- [ ] 1.4 Verify enchantment eligibility and cost paths against one armor item and one weapon. Check whether empty captured costs and skill values are gaps. Verify the item section never calls an unrecorded cost free.
- [ ] 1.5 Verify faction rewards and requirements against typed kill, quest, and condition owners. Extend capture only for real missing facts. Verify that Race conditions with a `factionID` do not become faction unlocks.

## 2. Project published homes and references

- [ ] 2.1 Build reverse catalog queries for typed effect applications and checks, class and skill stats, enchantment items, and faction members. Verify unresolved references stay labeled. Check that repeated world placements do not duplicate sources.
- [ ] 2.2 If capture changes, rescan affected evidence and verify clean runtime cleanup receipts. Build a catalog candidate in all cases. Compare changed rows with the accepted catalog. Verify every reachable record remains accounted for.
- [ ] 2.3 Add public contracts for three glossary documents, enchantment list rows, and item Enchants sections. Retain entity keys, rank and tier context, evidence gaps, and anchor targets. Verify representative documents parse and malformed references fail.
- [ ] 2.4 Project every reachable effect, stat, and faction into one glossary row per kind. Project enchantments into linked item sections or anchored fallback rows with coverage gaps. Verify all catalog keys have a published home and the documents fit the 262,144-byte limit.
- [ ] 2.5 Add search entries, reference resolution, and tooltips for the published home anchors. Verify Intellect, Potion Sickness, Humans, and Enchant Vigor targets. Verify graph and entity-key parity, including embedded enchantment keys.

## 3. Present glossaries and item sections

- [ ] 3.1 Add the three glossary views, the enchanting-item list, and the item Enchants section. Verify recorded facts, missing-evidence labels, anchor scrolling, and narrow-screen rows. Do not create record-specific views for these kinds.
- [ ] 3.2 Show row content in link tooltips on hover, focus, and touch. Verify links from an item, ability, NPC, and requirement. Check that tooltips remain beside their links without blocking adjacent entries.
- [ ] 3.3 Put Effects, Stats, Factions, and Enchantments in the Reference group. Link “Items with Intellect” to the URL-backed item stat filter from `add-list-filters`. Link Humans to the existing NPC Faction facet. Verify both URLs preserve the selected filters.
- [ ] 3.4 Check headings, names, category values, and gap labels in all four surfaces. Verify sentence-case headings, title-case names, and no visible native ID, enum token, guessed number, or ranked recommendation.

## 4. Publish and accept together

- [ ] 4.1 Author the publish plan for the catalog candidate. Publish a publication candidate. Verify its graph, coverage, size, and parity checks. Compare all four published record counts with the catalog.
- [ ] 4.2 Stage the publication candidate against the accepted publication. Verify the staged resource links, search anchors, item sections, and filtered list URLs. Confirm that no old slug or redirect is published.
- [ ] 4.3 Browse the staged site at 1440 px and 390 px. Open the three glossaries, enchantment list, item Enchants section, search, tooltips, and cross-kind links. Verify anchor scrolling, readable content, and no sideways scroll at 390 px.
- [ ] 4.4 Write the update report with evidence, coverage gaps, comparison results, and browser checks. Accept the catalog and publication candidates together. Verify the selected build names both candidates and retains the prior publication as rollback.
- [ ] 4.5 Run affected-package checks and the repository checks required by the archived publication workflow. Run `openspec validate publish-reference-kinds --strict`. Verify every command passes, then remove throwaway probes and update only affected reader documentation.
