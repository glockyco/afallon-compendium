## Context

See proposal.md for the reason. The accepted catalog has 1,153 item facts, including 706 armor or weapon templates and one Corruption Token (`item_facts`, catalog 6bc13a4c, read-only query). It has no captured corruption settings. `canonical.csx:204-239` captures item templates and the token flag. `documents.ts:401-435` projects base item facts into the tooltip in `ItemTooltip.svelte:29-73` and the item page in `ItemPage.svelte:34-75`.

The recovered `CharacterEntries.cs:311-316` exposes an item's saved corruption level, value, affixes, and separate heroic flag. Build-matched decompilations in `skill-corruption-region-functions-exact-20260928.json` and `ore-attunement-corruption-functions-20260928.json` support the gear bonus summarized in the evidence brief. `RPGBuilderCombatSettings.cs:37-40` declares the cap and gear bonus settings. These settings have not been captured. `DungeonTimerManager.cs:7-25,37,144,213` declares timer thresholds, reward fields, and the level at start, but its recovered method bodies do not establish reward behavior. `CorruptionAffixes.cs:19` declares token rolling without a recovered body.

## Goals / Non-Goals

**Goals:**
- Carry build-specific settings and verified rule evidence from capture to catalog and publication.
- Compare a template's base values with a clearly labeled calculated value at a selected level.
- Explain the verified parts of Corruption+ without presenting an unverified reward rule as fact.

**Non-Goals:**
- Dungeon routes, completion tactics, or recommended gear.
- A fabricated rolled item, fixed random affixes, or a claim that each gear template drops at every level.
- A second mechanics page framework. `explain-character-progression` owns that page kind and route.

## Decisions

### Verify level origin before describing drops

First trace `DungeonTimerManager.StartDungeonTimer`, `CompleteChallenge`, `DungeonCorruptionManager.IncreaseCorruption`, and `CorruptionAffixes.RollForToken` with bounded, build-matched native analysis. Follow the callers that set saved `corruptionLevel`, including reward loot generation. Verify the level at start, success conditions, time thresholds, token changes, and item eligibility before adding a corresponding claim. Use `.agent/skills/native-analysis/SKILL.md` for target ranges, SHA checks, output checks, and branch review. Use a read-only HotRepl observation only if static control flow leaves an important branch unresolved. Do not infer a rule from a field tooltip or an enum name.

The keystone and heart questions may name different game objects. Find their concrete record and method references before connecting them to the timer or token. Record a bounded unresolved outcome for any branch that cannot be proved. Publish that topic as unverified, rather than inventing a rule or dropping the topic. A wide dungeon guide would add claims outside this evidence boundary.

### Capture settings as build facts

Read `MaxCorruptionLevel`, `CorruptionGearAllStatsPercentPerLevel`, and each `CorruptionGearStatBonuses` entry (`statID`, `amountPerLevel`, `isPercent`) from the build's combat settings. Preserve field paths and absent or null entries in scan evidence. Add a typed catalog fact and a catalog query for these settings. Resolve stat names through the existing stat references. Also capture timer and token settings only when the verified rule uses them. Static constants in site code are rejected because they cannot follow a changed build.

### Separate calculated equipment values from loot rolls

Use the native `CorruptionGearBonus.Extra` rule for each applicable base stat: `extra = level * allStatsPercentPerLevel / 100 * base + sum(level * matching amountPerLevel * (isPercent ? base / 100 : 1))`. Check decompiled argument and rounding behavior against the native tooltip and equipment callers before implementation. The native weapon multiplier is `1 + level * allStatsPercentPerLevel / 100`, with a distinct heroic contribution (`skill-corruption-region-functions-exact-20260928.json`, evidence brief lines 63-70). Verify its range and call site before applying it to displayed damage. Do not add the heroic bonus to ordinary corruption previews. Check whether item power, random stats, gems, and percent-valued stats participate before showing calculated amounts for them. If the trace does not support a field, keep its base value and label that limit. A selected level is a model of a template, not an owned item.

Project the captured settings and confirmed eligibility into a versioned item document. The item-page control shows base and supported levels up to the captured cap. Keep the original item tooltip, sources, and ordinary hover previews unchanged. Calculate only supported changed values from the published build facts. For a cap or rule that cannot be confirmed, show no misleading selector for that gear. A per-level document for each item was rejected because it duplicates the same formula across many rows and increases publication size.

### Extend the mechanics document and navigation

Add one published mechanics document for `/mechanics/corruption` through the `mechanics` kind and route introduced by `explain-character-progression`. Add its link in the Mechanics group owned by `build-compendium-hub`. Keep all references to published items resolvable. Use sentence-case headings and columns, title-case names, and no record IDs. Use the shared section navigation from `add-page-navigation` if there are four or more sections. The page covers gear, keystones, timers, hearts, and tokens, but marks unsupported behavior explicitly. It neither ranks items nor claims a drop chance without evidence.

## Risks / Trade-offs

- A decompiled branch can misidentify a reward or level source. → Check bounded assembly and a read-only probe when needed, and retain unresolved status for unsupported claims.
- A template calculation can imply an exact rolled item. → Keep base stats alongside the calculated result and mark random or item-specific properties as variable.
- An uncaptured setting can create a false game number. → Preserve its unavailable state and avoid a value or selector that needs it.
- A new scan can change unrelated world rows. → Compare the candidate catalog row by row against the accepted catalog before publication.

## Migration Plan

Run verified native research, capture the settings, and scan when the collector changes. Build a catalog candidate and compare its rows with accepted catalog 6bc13a4c. Extend contracts, publication, and site against that candidate. Publish a candidate, stage it against the accepted publication, and check item and mechanics pages at 1440 px and 390 px. Verify item links, navigation, graph integrity, update parity, and no sideways scroll. Accept the catalog and publication together with an update report. Keep the former accepted publication as the rollback. Do not add redirects or legacy routes.
