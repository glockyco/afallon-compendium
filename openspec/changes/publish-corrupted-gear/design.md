## Context

The accepted build 25434619 uses catalog `05538f40b402bbcedaedbb6d9acd870125430c698a706572810d771eacbaf83a` and publication `e6ad42ed7532b319351edf9db2cc8280d1914622d53e95b22c43d64e76add88d` (`artifacts/accepted-build.json` in the main checkout). Its item pages contain base templates, not saved rolled items. Evidence includes `local/corruption/native-findings-20261001.md`, `runtime-findings-20261001.md`, and the controlled in-game tooltip, equipment, combat-component, random-roll, and gem experiments in `live-findings-20261001.md` (with captured JSON and game-frame PNGs). The live test established the precise corruption label, tooltip calculation and rounding, real equipped stat changes, and unrounded combat weapon component. It did not measure a full mitigated hit against a target.

The active contracts are `openspec/specs/mechanics-pages`, `reference-layout`, `item-property-presentation`, and `detail-pages`. `explain-character-progression`, `add-page-navigation`, and `build-compendium-hub` are archived changes, not owners of future navigation or page structure.

## Goals / Non-Goals

**Goals:**
- Carry build-specific authored settings and verified rules through capture, catalog, and publication.
- Compare unchanged item template values with explicitly calculated corruption-level values, without portraying them as an acquired roll.
- Publish a step-based Corruption+ guide, including token progression, timed dungeons, and the distinct Heart of Corruption fact, with clear evidence boundaries.

**Non-Goals:**
- Dungeon routes, completion tactics, gear rankings, simulated random rolls, or a claim every eligible template drops in each dungeon.
- A second mechanics page framework, invented tooltip text, or a claim about final mitigated hit damage unsupported by the component test.

## Decisions

### Publish only established rules

Native `IncreaseCorruption`, altar activation, timer start, completion, token roll, reward creation, and tooltip callers have been examined against build-matched bodies and assembly. An unused altar adds one level; a valid token is consumed and adds its saved value, with the resulting dungeon start level capped at the loaded `MaxCorruptionLevel=30`. The altar activates the token's saved affixes. A new token rolls up to three distinct eligible affixes; four affixes requiring NPC IDs currently have IDs of `-1` and cannot enter new rolls. The authored mob-stat list adds 10% Strength, 10% Intellect, and 20% Health per level, subject to the native per-stat calculation; affix effects are separate. State these as build-specific rules, not universal constants.

Timer completion awards a token with value start +2 at or above the first remaining-time threshold, start +1 at or above the second, otherwise start; timeout uses max(start -1, 1) and omits normal loot. The reward token value is not clamped to the dungeon start-level cap. Normal reward-table generation gives eligible equippable non-token items the current dungeon corruption level when positive, and independently gives rolled tokens current level +1 and fresh affixes. Do not infer all equipment is available from these loot tables. Capture the five dungeons' authored timer thresholds as **seconds remaining**, boss/loot-table associations and maximum loot-item counts: Duskfall Depths 800 total, 500/300 thresholds, 3 items; Felheart Crucible 300, 160/100, 3; Tidefallen Grotto 860, 500/300, 3; The Underglow 860, 500/300, 2; Barrowdeep 860, 500/300, 3. All five use token item 564 and 120-second reward bags (`runtime-dungeons-20261001.json`).

Heart of Corruption (item 162, loot table 136) is **not** a Corruption Token (item 564). Three Coalway challenge stones each require and consume one Heart; it is also a crafting material, including three for Aetherium Breastplate. Do not infer a Heart changes token rewards, dungeon levels, or timer outcomes. Describe unknown keystone terminology and any unproven relationship separately.

### Capture settings and authored facts as build data

Capture `MaxCorruptionLevel`, `CorruptionGearAllStatsPercentPerLevel`, both combat-stat bonus lists with stat ID, amount, percent flag and resolved name, affix token count/availability, five timer configurations, and Heart requirements with source provenance and explicit unavailable values. Loaded gear settings are 5% all template stats per level, an additional 15% of template Health per level, and +5 flat Item power per level: a template Item power stat also receives the 5% general bonus. No equippable template in this build has an authored Health stat, so the Health bonus is a verified conditional rule, not a present-day example item. Preserve absent/null records; do not hardcode observed values in the site. Reject conflicting or malformed normalized settings. Settings are authored inputs; a derived item value is marked calculated.

### Separate calculated equipment previews from loot rolls

For each supported base stat, calculate `extra = base × level × allStatsPercentPerLevel / 100 + Σ matching bonuses [level × amountPerLevel × (isPercent ? base / 100 : 1)]`. For example, the authored Novice Plate Chest has Stamina 2, which the actual level-one tooltip shows as `+2.1 Stamina`; its Item power 15 becomes 20.75 before the game's integer display, shown as `Item Power 20` (the observed positive examples truncate the fractional Item power). A synthetic +100 Health template stat tested under controlled runtime cleanup verifies the conditional Health bonus, but no current equippable template has that stat: never present synthetic Health as an obtainable item's example. For weapons, multiply base min/max by `1 + level × allStatsPercentPerLevel / 100`; the tooltip rounds each endpoint to the nearest integer with midpoint-to-even at observed ties, then derives displayed DPS from rounded endpoints and attack speed. Match the game's display formatting for supported stats, Item power, damage and DPS, including fractional stat values (e.g. `+2.1 Stamina`); do not round underlying real combat weapon components, which scale unrounded. Heroic effects remain distinct from ordinary corruption previews. Live equipment transitions establish corresponding real character stat changes; a controlled `CombatCalculations.AddWeaponBonus` test establishes the unrounded weapon component, not the entire mitigated hit. The same saved random roll and gem retain identical tooltip and equipped values across levels 0, 5, and 30; exclude them from scaling and preserve them only when independently captured for a specific saved item. The actual level label is `<color=green>Corruption +N</color>` when N > 0, absent at level zero.

Project eligibility from proven equippable reward behavior and captured settings into a versioned item document. Show a selector from level zero through the captured cap only for eligible equippable items with verified calculation fields. Place it closed by default or in a secondary section per `item-property-presentation` and `detail-pages`. Show base and calculated values side by side, matching the game's tooltip values and display rounding exactly while labeling them calculated template values (not rolled loot); retain the single in-game tooltip beside the acquisition answer and preserve all sources. If an indispensable rule or cap is unavailable, omit the misleading selector. A per-level item document would duplicate calculations across many rows.

The observed token tooltip starts `Use at a Corruption Altar to increase dungeon corruption by +N.`, then `NPC Stat Bonuses:` (+10% × N Strength and Intellect, +20% × N Health) and `Dungeon Affixes:` with saved affix names and localized descriptions. It has no equippable corruption-level line. Use the verified text and formulas while preserving build-specific settings, rather than inventing a keystone or Heart effect.

### Extend the existing guide and navigation

Publish `/mechanics/corruption` using the `mechanics` guide structure in `openspec/specs/mechanics-pages`: brief overview, ordered steps with stable `#step-<id>` anchors, worked example, and final closed evidence/unknowns disclosure. Use rule placements `{target, guide, stepId, levelChances?}` to connect applicable entity pages to the corresponding guide step; do not link to the raw rule list as the explanation. Link published Corruption Token and Heart item pages by readable names and the relevant dungeon pages where referenced. The Browse panel's Guides column (`openspec/specs/reference-layout`) lists the new guide; there is no Mechanics navigation group. `detail-pages` owns section navigation for detail pages. Use sentence case for headings, title case for names/category values, no raw IDs in reader text, and no unverified drop chances.

## Risks / Trade-offs

- The component test does not measure a complete mitigated hit. → State equipped stat and weapon component effects, but make no final-hit claim.
- A calculated template may resemble a saved random roll; no authored gear template currently has Health. → Preserve unscaled random/gem values and use actual authored item examples, not the synthetic Health probe, in reader-facing comparisons.
- Authored timer thresholds are remaining time, not elapsed time. → Preserve their semantics in capture, explanation and tests.
- A rescan may change unrelated world rows. → Compare candidate rows and provenance against catalog `05538f40`.

## Migration Plan

The bounded live evidence has resolved tooltip text, actual equipped stats, weapon display rounding, and random/gem behavior. Capture settings and five dungeon facts, normalize them, and compare the candidate against accepted catalog `05538f40`. Extend publication, site, and Browse guide link. Stage against accepted publication `e6ad42ed`; verify guide step links, item comparison against observed tooltip values, graph integrity, update parity, and browser layout at 1440 px and 390 px. Accept catalog and publication together with an update report, retaining the previous publication for rollback. No redirects or legacy routes.
