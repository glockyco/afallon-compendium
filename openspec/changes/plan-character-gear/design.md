## Context

`build-character-planner` establishes `/planner`, a device-local active character, and the stable v1 build link. Its first phase publishes talents and emits `gear: []`, but preserves any incoming gear choices as unevaluated. The accepted catalog `076be02f1fcc7e88711645fa730cefde7fbbc5923d1abd7399ff7d2192f97779` and ri12 publication `dade9f2e75c50ffbdfdbf92daa5e7aa9e2f716da6bf9494dd69172c75326bd76` are the comparison baseline. Existing `item_facts`, `item_stats`, `item_random_stats`, progression stats, and item restrictions provide candidate inputs; page summaries are display projections, not complete equip/stat rules. Druid has both `stats` and `customStats`, so choosing one from a page label would be unsafe. Existing build-25653798 Ghidra outputs include `equip-rule-functions-20261002.json`, `equip-rule-requirements-functions-20261002.json`, `stats-mechanics-functions-20261002.json`, `stats-combat-functions-20261002.json`, `heroic-gear-score-assembly-values-20261003.json`, and `heroic-stats-functions-20261002.json`; each question still needs its own reviewed evidence before a calculator claims a total.

## Goals / Non-Goals

**Goals:** Add gear selection and source-attributed contributions to the existing planner and v1 links, verify supported equip/stat/score rules, and retain partial information where a total cannot be established.

**Non-Goals:** A save-file importer, actual-character equipment view, recommended builds, multi-build comparison, combat simulator, account sync, or an inferred stat/gear score from item names.

## Decisions

### Trace equip and numeric rules on the accepted build

Use the native-analysis workflow and installed build 25653798 binary SHA-256 `3625dbe861e3a3d31a07378065f4d8862be07fa77e83f15592ebc080452a952c`. Review bounded methods and assembly for item use/equip, slot/hand exclusions, weapon-only class restrictions, level requirements, stat-list precedence, level growth, item modifiers, stacking/caps and gear-score scoring. Compare against accepted catalog rows and focused, read-only runtime observations for Druid, a weapon-restricted class and a rolled/nonconstant item. Document supported and unsupported inputs before projecting or calculating them. A known item restriction must remain visible even when another effect is unknown.

### Extend the planner's typed route-scoped payload

Publish slots, reachable items, verified restriction inputs, partial item effects, class/level stat inputs and provenance in the existing planner document rather than introduce a second class-page representation. Keep stable equip-slot and item keys for the v1 link; use published names/icons in UI. Capture missing facts only for the relevant scope, compare any catalog candidate row-by-row to accepted baseline, and stage a new publication candidate. Resolver outcomes have separate verified, blocked and unverified cases, distinct from shared-preview state.

### Calculate only complete values and expose partial sources

Use a calculation module with per-stat source rows and an explicit completeness result, not a generic sum. Source rows identify class/level, item and modifier contributions. Apply only evidenced class stats, roll values, stacking and caps. A blocked item's effect does not become a verified contribution. An unverified equip check or unknown roll/formula keeps the known contributions visible but marks total Incomplete. Score the active build on Heroic Tier only if every relevant item/slot and the game's gear-score rule are verified; otherwise retain the existing “Gear Score Not Available.” No unrelated page context changes to match a shared preview until explicit adoption.

### Share gear without changing link or character identity

Resolve the existing `gear` pairs from the v1 payload, sorted by slot, after Planner 1's decoder has checked syntax and duplicates. Re-check choices under current publication; keep unmatched references and blocked gear in the same migration report. Incoming links remain separate previews, and copying or editing one never writes the active store. “Use as My Character” adopts gear together with class, level and talents. Existing links with an empty gear array round-trip unchanged.

### Keep secondary details secondary

Put labeled slots in a Gear tab or later section of the planner, with a compact mobile picker and stat-source disclosure. Reuse DetailFrame, TitleBlock, AnswerCard, SideCard, Section, RelationTable, CompareTable, LinkGrid, TabSet and EntityLink styling; no full-viewport paperdoll, floating hover lift, or horizontally scrolling mobile canvas. Test visual containment and focus transitions at 1440, 1100 and 390 CSS pixels in Firefox and Chromium.

## Risks / Trade-offs

- Rolled and corrupted item values can be absent from publication. Incomplete totals preserve useful known effects without fabricating their missing values.
- Some native modifiers depend on runtime game state. Only verified deterministic contributions enter complete calculations; describe missing state beside the affected stat.
- A changed catalog can remove a slot or item. Retain visible migration evidence and warn before copying a link that omits it.

## Migration Plan

Apply after the talent planner. Extend its typed publication data and evaluator, activate gear pairs in the existing v1 link, verify source disclosures and Heroic Tier behavior with complete and incomplete examples, then stage/accept catalog and publication together against the accepted ri12 baseline. Keep the previous publication as rollback.
