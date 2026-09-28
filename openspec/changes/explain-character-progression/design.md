## Context

See proposal.md for the motivation and `specs/mechanics-pages/spec.md` for the reader contract.

The accepted catalog stores four level templates in `progression_facts`. A read-only query of the accepted catalog returns 60 rows for the character template. Its first two rows require 20 and 40 experience. Its last row requires 939,124. The accepted `treePoints` fact for Talent Points records a starting amount of 1, a character-level-up gain of 3, and a maximum of 180. These are build facts, not site constants.

The same catalog query finds 185 fixed-level creatures with positive experience through authored level 30. It also finds 31 scaling creatures with positive experience, including two records whose authored maximum exceeds 30. A query of `quest_facts` finds 136 quests with positive experience and an authored maximum level of 31. These ranges describe authored source records. They do not prove a character-level experience cutoff.

`packages/scan/src/probes/collectors/canonical.csx` already reads `LowerLevelEXPModifier` and `HigherLevelEXPModifier`. `npc_facts` does not store either value. The accepted catalog does not hold `HeroicTierSettings` values. The recovered declaration `Blink/RPGBuilder/World/HeroicTierSettings.cs` names the relevant fields but does not establish their values or complete behavior. The build-matched `research/ghidra/25434619/progression-functions-20260928.json` records bounded decompilations of character experience, kill experience, quest actions, points, and Heroic Essence. The findings brief marks the modifier comparison direction, party split, and quest raw-amount callee as uncertain.

The existing public class and skill documents hold Experience arrays. `packages/publication/src/documents.ts` projects them through `experienceRows`. The generic site route gets page kinds from the publication registry and search corpus. `packages/publication/src/index-resources.ts` creates documents, lists, search entries, and coverage from that set. These paths need one clean cutover.

## Goals / Non-Goals

**Goals:**
- Keep one build-matched data path from captured settings to the catalog, publication, and mechanics pages.
- Preserve source provenance and separate verified calculations from unknown rules.
- Replace duplicate class and skill tables without losing access to the character level curve.

**Non-Goals:**
- Crafting and gathering rules, Corruption, or a build recommendation.
- A reader's current experience or saved character state. The chart shows fresh-character cumulative totals.
- A second level curve for weapon or profession skills. Their Experience tables leave class and skill pages.

## Decisions

### Verify rules before encoding them

First query the accepted catalog for source ranges and template linkage. Then compare the research character's level and experience limit with its template through a read-only HotRepl probe. The archived class-page change already recorded level 1 needing 20 experience. Use the existing bounded decompilations for character level-up, kill and quest awards, Heroic kill experience, Heroic Essence, and talent point gains. For the medium-confidence questions, inspect the exact native call site or run a bounded read-only probe before writing reader text: which side of the creature level comparison receives each modifier, how eligible party members split kill experience, and where the quest's raw experience amount comes from. Verify whether the experience stat and world modifiers apply to both kill and quest awards. Verify whether Heroic kill experience excludes quest rewards. Inspect `GetEssenceHealthFactor` if the existing decompilation does not establish its bounds or baseline. Follow the build hash, RVA, unwind-range, output, and diagnostic checks in `.agent/skills/native-analysis/SKILL.md` for any new decompilation. An unresolved branch stays explicitly unknown in the catalog and reader text. Do not infer a rule from a tooltip, declaration, or name.

### Capture settings before deriving pages

Use a read-only probe to locate the live `HeroicTierSettings` instance and record its build-matched fields. Add typed scan evidence for the setting values to `packages/scan/src/probes/collectors/support.csx`. Capture the creature level-difference fields already read by `canonical.csx`. Extend catalog decoding and contracts to persist those values with provenance. Keep the complete set needed for these pages: kill experience, Essence base, per-affix amount, rank multipliers, health baseline and bounds, health and damage multipliers, gear scaling and its cap, first and later affix chances, maximum and guaranteed affixes, affix loot multiplier, and Heroic gear stat bonus. Preserve unavailable fields without defaults. Record the proven calculation branches as provenance-backed mechanics facts rather than embedding game coefficients in Svelte. The alternative is to copy values from the findings brief into components. That alternative loses build identity and can become stale.

### Publish two topic documents

Add `mechanics` to public page-kind contracts and register `compendium.static-mechanics.v1`. Give the two topics stable publication-owned keys and slugs, not invented game entities. Add a catalog-backed mechanics projector to the same document, list, search, resource-budget, and graph audit path as entity documents. Give the kind a compact list at `/mechanics`, while the C1 Mechanics group links the two topic documents directly. Preserve the accepted build and catalog identity. Do not give mechanics topics bogus map placements. The generic `[kind]/[slug]` route can resolve `/mechanics/<topic>` through the registry. Unknown slugs remain not found. Extend the C1 group without moving its other groups or the dev-only map cards. A standalone untracked page with hard-coded numbers was rejected because it would bypass publication validation.

The progression document contains the level template, authored source-range summaries, verified rule phrases and typed operands, and talent point facts. The Heroic document contains settings and the verified formula terms. Display numbers come from those documents. The publication derives totals, bounds, and source counts from the candidate catalog. Game parameters never live in site code. Do not duplicate creature and quest records in the mechanics documents when a summary and links to source pages suffice.

### Show a readable curve, not another table

Plot each row from the first level to the level before the cap as experience to the next level. A logarithmic vertical axis shows the full range without hiding early levels. Label the axis and ticks. The cap is a control endpoint with zero experience to the next level. It is not a zero on a logarithmic axis. Precompute cumulative totals once from the published template. At selected level `L`, earned experience is the sum of rows before `L`. Experience left to the cap is the sum from `L` through the level before the cap. The control reads its values without a hover or a chart pointer. At 390 px the chart scrolls within its panel or simplifies its ticks without page overflow. If the topic has four or more sections, use C2's shared "On this page" list. The alternative of all 60 table rows repeats the current weak presentation.

### Remove the old Experience payload

Delete `ExperienceRowSchema`, experience arrays from `PublicClassSchema` and `PublicSkillSchema`, and the class/skill projector path that produces them. Replace the site sections with links to `/mechanics/character-progression`. Migrate every consumer, fixture, schema union, and assertion to the new document contract. Version the changed class and skill document schemas. Keep their highest-level hero facts. Do not redirect or retain the removed sections as compatibility aliases. C6 may add skill-source sections after this change. It must preserve the Character progression link. C8 may later replace class tree rows with tabs without restoring Experience tables.

## Risks / Trade-offs

- A level template includes a row at the cap, but the game sets needed experience to zero at the cap. → Plot only actual transitions and use the cap as a control endpoint. Verify that reading with the saved character and native path.
- Scaling creatures exceed the fixed-level source boundary. → Label fixed-level and scaling sources separately. Do not call the catalog's quest maximum a player-level cutoff.
- A recovered field or native pseudocode can suggest the wrong branch. → Complete the bounded verification tasks before publication. Label unresolved rules as unknown.
- Heroic settings might not be reachable from the initial scan target. → Probe their live owner first, then capture them from a target that owns that instance. Do not substitute values from a prior build.
- New mechanics documents change list, search, and coverage counts. → Include them in the existing graph, budget, and parity checks.

## Migration Plan

Verify the uncertain rules and locate the settings source. Capture the settings in a build-matched scan. Build a catalog candidate and compare its rows with the accepted catalog. Change contracts, publication, and site together, including removal of the old Experience payload. Publish a candidate against the candidate catalog. Stage it against the accepted publication and inspect the graph and update parity. Check both mechanics pages, class and skill links, navigation, and chart at 1440 px and 390 px in the browser. Write the update report and accept the catalog and publication together. Keep the previous accepted publication as the rollback target. No old route or document alias remains.
