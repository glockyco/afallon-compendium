## 1. Verify equipment and stat evidence

- [ ] 1.1 Review build-25653798 native equip check, item level and weapon restrictions, slot/hand interactions, using the existing bounded Ghidra output first. Compare with accepted catalog inputs and read-only examples for Druid and a weapon-limited class; record supported and unknown cases with methods and evidence paths.
- [ ] 1.2 Review class stat-list precedence, level growth, item roll/effect calculations, stacking and caps in native output and bounded runtime examples, including a nonconstant item. Record complete formula inputs and each unknown contribution; verify no missing roll is treated as zero.
- [ ] 1.3 Review gear-score calculation separately against the accepted item facts and active equipment; verify both a fully supported build and a build lacking a roll or scoring rule before showing any number on Heroic Tier.

## 2. Publish gear and stat inputs

- [ ] 2.1 Query accepted catalog `076be02f1fcc7e88711645fa730cefde7fbbc5923d1abd7399ff7d2192f97779` for reachable items, slots, restrictions, class/level stats and modifiers. Capture missing facts in a focused scan and compare changed or equal candidate rows with the accepted baseline, preserving partial entries and provenance.
- [ ] 2.2 Extend the existing versioned, route-scoped planner document with typed slots, items, restriction predicates, stat source inputs and known partial effects. Verify a blocked weapon, an ordinary armor/jewelry item and a rolled item project the supported and unknown facts without fabricating totals. Measure planner payload and item-page navigation performance.

## 3. Equip gear, restore links and explain stats

- [ ] 3.1 Add a separate Gear tab/section with labeled slots and a contained picker. Check verified class/weapon, slot, hand and level restrictions, keep blocked and unverified items visible with distinct reasons, and preserve focus and scroll across selection. Verify non-weapons are not blocked by class alone.
- [ ] 3.2 Resolve the v1 link's `gear` pairs against current data, including a different-catalog link. Preserve unmatched gear in the migration report and warn before copying a link that drops it. Confirm an empty-gear Planner 1 link remains valid and a shared gear preview does not mutate the active character until explicit adoption.
- [ ] 3.3 Build per-stat source disclosures and a completeness check from verified formulas. Show class/level, item and modifier contributions that are known, mark affected totals Incomplete for unknown rolls or equip rules, and exclude verified blocked gear from complete totals. Exercise a Druid, a rolled item, and a known complete case.
- [ ] 3.4 Connect Heroic Tier gear score only to an explicitly active build with fully verified scoring inputs. Exercise a supported and incomplete build; the latter must say “Gear Score Not Available,” and a shared preview must leave the active result unchanged.

## 4. Stage and accept the gear phase

- [ ] 4.1 Stage a publication candidate against ri12 `dade9f2e75c50ffbdfdbf92daa5e7aa9e2f716da6bf9494dd69172c75326bd76`, review schema issues, graph/update parity and accepted catalog identity, then run affected package checks once after edits. Keep development and preview artifacts synchronized on acceptance.
- [ ] 4.2 Inspect the actual planner in Firefox and Chromium at 1440, 1100 and 390 CSS pixels, including slot selection, a blocked weapon, partial stat breakdown, a complete score, an old link with missing gear, explicit adoption, focus retention and no sideways scroll.
- [ ] 4.3 Write the update report, accept any catalog and publication candidate together, preserve the previous publication as rollback, and validate `plan-character-gear` strictly.
