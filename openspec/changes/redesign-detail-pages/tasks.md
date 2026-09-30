## 1. Tokens and Shared Components

- [ ] 1.1 Update shared typography, contrast, spacing, and surface tokens in site CSS: 100% root, rem type, 1rem body at 1.5 line height, .875rem minimum, non-tracked readable labels, >=4.5:1 text contrast, and >=24 px controls. Verify rendered token pairings and responsive typography on the home page and a detail page.
- [ ] 1.2 Build the responsive title/answer/20rem sticky side/relations frame and single optional <=5-fact stat strip; keep the mobile order title, answer, side, relations. Verify a representative page at 1440 and 390 px, including long side content and keyboard focus.
- [ ] 1.3 Update shared headings, compact portrait/icon rows, recipe equations, eight-row previews, Show N more, and disclosure components; keep conditional row distinctions and no decorative heading icons. Verify a full relation of >8 rows and a single-row relation on desktop and phone.
- [ ] 1.4 Preserve section IDs, row anchors, and tab history when targets are in a hidden preview, closed disclosure, or talent tab. Verify direct links, repeated fragment clicks, back/forward, and unknown fragments in the browser.

## 2. Item Pages

- [ ] 2.1 Replace the item hero with How to get it routes for craft, mine, loot, search, buy, quest reward, and published starting gear; sort by guaranteed yield then known spots without equating chance with guarantee. Verify a crafted item, Iron Ore's distinct sources, an item with no known source, and an unpublished-class starting item.
- [ ] 2.2 Show one game tooltip and description in the side, Teaches and Used for equations, then complete ordered source sections; retain buy price, stack size, teacher links, skill gate, and computed experience breakpoints without duplicating the product tooltip. Verify recipe item, product, material, and differing recipe/product names at 1440 and 390 px.

## 3. Creature Pages

- [ ] 3.1 Put sorted drops first with each loot-table roll labeled separately and per-item chances distinguished; show level, health, experience per kill, and respawn in the strip when applicable and combat facts/ability chips in the side. Verify a multi-table creature, a friendly merchant, and a creature with zero or missing stats.
- [ ] 3.2 Group Where to find by place and spot count while preserving variant, condition, quest story order, random alternatives, and map links on expansion; follow with Sells, Quests, Variants. Verify a multi-place creature, a quest-gated variant, and an unplaced creature.

## 4. Quest Pages

- [ ] 4.1 Render an objective checklist with target counts, giver and turn-in, a four-fact strip when available, and the chain side stepper with requirements. Move quest text and world changes to closed final blocks; keep rewards and unlocks visible. Verify a chain middle step, a standalone quest, a world quest, and an objective map link.

## 5. Place Pages

- [ ] 5.1 Render type/range/boss/creature strip, artwork and description answer with map action, and parent/connections in the side. Show portrait bosses, other creatures, services, gathering/object category counts, quests, areas, and reachable property/POI facts. Verify a dungeon with bosses, place with no range, and inbound/outbound multi-spot connections including off-map copies.

## 6. Gathering Node Pages

- [ ] 6.1 Show yields and conditional chances first with a computed yield-bonus sentence and guide-step link, plus skill/character experience, respawn, spots and a side showing supported endpoint spawner shares without unverified attunement. Verify a spawned and placed node, node without placement, and a node without supported share.
- [ ] 6.2 Replace numbered location links with place counts and bars sorted by count; retain map spots, selection odds table, timing, and ranges in final closed blocks. Verify Small Iron Vein's many spots are navigable without 455 numbered links and that known spots map to their correct places.

## 7. Skill Pages

- [ ] 7.1 Show only verified leveling routes with linked example ranges, put the existing level curve chart and level control in the side, and group recipe rows by required-level band and nodes by gate. Verify Alchemy's complete recipes, Mining's nodes, Axes' curve and auto-attack source, productless recipes, and a skill without levels.

## 8. Class Pages

- [ ] 8.1 Show playstyle and auto attack first, four available decisive stats, talent-point side facts, starting gear, then tabbed talent trees in authored order. Preserve talent row anchors, ranks, Character Progression link, and no Experience table. Verify Shieldmaster trees, Heroic Essence, hidden-tab deep links, and exclusion of unoffered Hunter.

## 9. Ability Pages

- [ ] 9.1 Show the selected version's game tooltip once and identify who learns/uses the ability in the answer; retain requirements, teaching sources, distinct versions, and anchored user groups. Verify a multi-version ability, Maul's talent link and condition, and an ability used only by unpublished classes.

## 10. Property Pages

- [ ] 10.1 Show purchase price, income per payment, and sell price in the strip when confirmed; locate for-sale signs and map action in the answer, with the picture/purchase panel in the side. Verify one-sign and multi-sign properties without claiming an unverified income interval or currency.

## 11. Mechanics Guides

- [ ] 11.1 Arrange each mechanics guide as overview, anchored ordered steps, nearby or following worked example, key tables, and closed evidence-backed rule list. Keep Character Progression and skill level curves accessible; verify each entity How it works link lands at its relevant guide step rather than the rule disclosure.
- [ ] 11.2 Migrate catalog rule placements to computed fact/guide-step targets; resolve topicless rules and remove rule prose from entity sections and label hints without discarding evidence. Verify linked-scope entities alone receive their supported computed values and an unsupported operand produces no invented number.

## 12. Hover Cards

- [ ] 12.1 Reduce previews to one game tooltip plus a context line or a compact identity preview without tables or rule prose, and keep every preview fact on its page. Verify item, ability, creature, node, and quest links on hover, focus, and tap.
- [ ] 12.2 Keep right-first/left-fallback positioning and mobile bottom overlay while preventing interception of adjacent rows in both movement directions. Verify upward and downward pointer transitions, dynamic content, viewport resize, keyboard dismissal, and touch.

## 13. Lists and Home

- [ ] 13.1 Apply accessible type tokens, casing, contrast, and 24 px targets to list rows, filters, home cards, and shared navigation. Keep the search field height stable, spinner inside or beside its input, and full results visible. Verify home and each list family at 1440 and 390 px, including keyboard and increased browser text size.

## 14. Publication Data

- [ ] 14.1 Derive per-place deduplicated spot counts and total item-source spots from published placements, preserving condition-bearing location rows and map selection; expose creature portraits in relation rows. Verify counts against distinct placement identities for a multi-place NPC, Small Iron Vein, and Iron Ore.
- [ ] 14.2 Derive spawner option share at lowest and highest supported skill from verified effective weights and eligible options; label denominator and source spawner or supported aggregate, omit unsupported odds. Verify both endpoints, unequal options, and incomparable spawners with fixture-based checks.
- [ ] 14.3 Investigate `For Sale 2500 Gold` object identity and `SkeletonAttack1 NPC` ability through authored data and linked provenance. Give them truthful readable labels where supported or record the unresolved identity in publication/update reporting; verify both displayed relations against their source evidence.
- [ ] 14.4 Investigate Barrowdeep Deathguard's authored Gold 15–3 bounds. Correct only with verified evidence or mark range unavailable and report the discrepancy, never silently swap. Verify the published page no longer displays an impossible range and the discrepancy has an auditable disposition.

## 15. Publish, Stage, and Accept

- [ ] 15.1 Run scoped component/publication tests, type checks, the full relevant suite, and strict OpenSpec validation; publish and stage the candidate from synchronized development and preview data. Verify successful receipts, graph integrity, and existing page/row deep links without manual stale static data pointers.
- [ ] 15.2 Browser-check every kind—item (material/product/recipe), creature, quest, place, node, skill, class, ability, property, and each mechanics guide—at 1440 and 390 px. Verify answer priority, page order, sticky and stacked side content, full relations, map links, no sideways scroll, and no annotated pink `.note` text.
- [ ] 15.3 Run an axe or equivalent accessibility audit across the hub, lists, guides, and each detail kind at both widths; independently inspect text contrast across rarity/overlay states, target sizes, keyboard focus, touch previews, and larger default text. Verify no outstanding blocker or serious finding and record any justified limitation.
- [ ] 15.4 Update the acceptance/update report with publication identities, source-data issue dispositions, screenshot/browser evidence, and verification results; accept the publication only after all gates pass and development/preview remain synchronized. Verify the selected publication and footer identify the same accepted build; deployment remains a separate explicit action.
