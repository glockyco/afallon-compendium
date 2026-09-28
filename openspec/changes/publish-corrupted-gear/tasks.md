## 1. Rule evidence

- [ ] 1.1 Verify build identity, method RVAs, and bounded unwind ranges for `DungeonTimerManager.StartDungeonTimer`, `CompleteChallenge`, `DungeonCorruptionManager.IncreaseCorruption`, `CorruptionAffixes.RollForToken`, and item creation callers. Follow `.agent/skills/native-analysis/SKILL.md`. Verify the research output has the expected SHA, RVAs, exclusive ends, nonempty bodies, and no unresolved diagnostics.
- [ ] 1.2 Trace the writer of saved `corruptionLevel` from dungeon start through reward generation. Identify which gear can receive the level, how it is bounded, and whether a token's level or affixes are related. Verify each conclusion against decompilation and relevant assembly. If a branch remains unclear, use a bounded read-only HotRepl probe and record the unresolved branch before publication depends on it.
- [ ] 1.3 Trace keystone and heart references to concrete game records and callers. Check timer start, success, failure, time thresholds, boss completion, token awards, and `RollForToken` before writing a reader rule. Verify each rule with build-matched decompilation or a bounded read-only probe. Record unsupported relations as unverified rather than inferring them from field names.
- [ ] 1.4 Check `CorruptionGearBonus.Extra` and `WeaponDamageMultiplier` against their equipment, tooltip, and combat callers. Verify stat matching, flat and percent bonuses, rounding, damage display, heroic separation, and the treatment of random stats, gems, percent stats, and item power. Record the exact supported preview fields and compare a calculated case against a read-only observed tooltip when possible.

## 2. Capture and catalog

- [ ] 2.1 Extend a suitable scan collector to capture `RPGBuilderCombatSettings.MaxCorruptionLevel`, `CorruptionGearAllStatsPercentPerLevel`, and every `CorruptionGearStatBonuses` entry with source paths and unavailable states. Capture timer and token settings only where task 1 verifies their use. Verify the new scan evidence shows the fields and preserves null entries without fabricated numbers.
- [ ] 2.2 Extend the scan, catalog, and query contracts to normalize the settings and resolve stat names as build-specific facts. Reject invalid duplicate or malformed settings rather than silently replacing them. Verify a focused catalog test preserves two matching bonuses, distinguishes flat from percent values, and reports an unavailable setting.
- [ ] 2.3 Run the scan needed for the new collector and build a catalog candidate. Compare rows, counts, and provenance against the accepted catalog at `artifacts/objects/sha256/33/3d602d72deaba6489e02b00babda425718cc5f5694090e1975e6465fe1e1f4`. Verify that each change is a reviewed corruption fact or a separately explained rescan difference, and that no reachable item disappears without reachability evidence.

## 3. Publication

- [ ] 3.1 Extend the versioned public item document with the confirmed eligibility and the captured values needed for calculated stats. Implement the verified formula in publication code and preserve original template stats. Verify a focused projection test covers level zero, the captured cap, multiple matching flat and percent bonuses, and a heroic flag that does not enter ordinary previews.
- [ ] 3.2 Publish the corruption mechanics document through the `mechanics` page kind introduced by `explain-character-progression`. Include verified gear rules and the supported keystone, timer, heart, and token facts. Mark unresolved behavior as unverified and link the Corruption Token item. Verify the document schema and reference graph accept the page without raw IDs, unsupported game values, or guide recommendations.
- [ ] 3.3 Add the Corruption link to the Mechanics group owned by `build-compendium-hub`. Verify the published navigation has one Corruption link and the route resolves without redirects or a legacy alias.

## 4. Site

- [ ] 4.1 Add the corruption-level control to eligible item pages. Show base and calculated values side by side, keep the ordinary tooltip and source sections, label variable rolls, and link the mechanics page. Verify in a running browser that an eligible weapon changes at a supported level and returns to base values at level zero. Verify that an ineligible item has no control.
- [ ] 4.2 Render `/mechanics/corruption` with reader labels and the verified or unverified status of each topic. Use the shared "On this page" component from `add-page-navigation` when the page has four or more sections. Verify in the browser that the token link opens its item page and that no record IDs, enum words, or unsupported reward claims appear.

## 5. Publication and acceptance

- [ ] 5.1 Author a publish plan for the catalog candidate. Publish a candidate and stage it against the accepted publication. Verify no publication issues, graph integrity, update parity, and the expected corruption document and item changes.
- [ ] 5.2 Inspect the staged site in a browser at 1440 px and 390 px. Check a corrupted gear preview, a noneligible item, the mechanics page, Corruption Token link, Mechanics navigation, and a random-stat template. Verify each page keeps readable values and has no sideways scroll at 390 px.
- [ ] 5.3 Author the update report and accept the catalog and publication candidates together. Verify the accepted build names both candidates and retains the former publication for rollback.

## 6. Final checks

- [ ] 6.1 Run the relevant contract, catalog, publication, and site checks once after implementation, then run `openspec validate publish-corrupted-gear --strict`. Verify each command passes and record the results in the task checklist.
