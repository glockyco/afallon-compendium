## Context

See proposal.md for the need. The accepted catalog is `artifacts/objects/sha256/33/3d602d72deaba6489e02b00babda425718cc5f5694090e1975e6465fe1e1f4`. The counts below come from read-only SQLite queries of that file on 2026-09-28. `packages/catalog/src/progression.ts` already decodes these four kinds into `progression_facts`. `packages/publication/src/kind-registry.ts:35-39` lists them as non-page, non-searchable kinds. The shared publication projectors and site detail dispatcher have no documents for them.

### Coverage audit

Each row names the fact, its present table and count, or the needed capture. Counts of nested rows use `json_each` on `progression_facts.details_json`. A count of zero is not proof that the game has no such mechanic.

| Planned fact | Accepted catalog evidence | Capture or verification needed |
|---|---|---|
| Effect identities, names, icons, and rank behavior | `canonical_entities` has 843 effects, of which 597 have icon names. `progression_facts` has 843 effects and 886 nested ranks. `canonical_entities.description` is nonempty for 58 effects. | Verify how each captured rank field maps to reader language before explaining damage, healing, pulse, duration, and effect types. Show only supported fields. |
| Ability applications | `progression_facts` ability ranks have 442 `effectsApplied` rows and 68 `casterEffectsApplied` rows. `packages/catalog/src/queries.ts:716-721` already derives application links. | Verify target and chance semantics before labeling self and target. No new capture is needed for recorded ability links. |
| Item applications | `item_facts` has 87 nonempty `use_lines_json` arrays, but zero nonempty `action_abilities_json` arrays. These lines are text, not a structured effect link. | Inspect item-use data and the game's item-use dispatch with a read-only probe or bounded decompilation. Capture item-to-effect relations only if the game supplies them. Do not derive links from matching names or tooltip prose. |
| NPC ability applications | `npc_phase_abilities` has 990 rows. Join those rows to captured ability applications and preserve NPC phase and rank. | Verify NPC ability rank mapping against the ability rank indexes before deriving the reverse links. |
| Interaction applications | `source_details` contains typed `Effect` game actions for 701 distinct `oreSpawner` sources and 89 distinct `interactableObject` sources. These counts use `json_tree(data_json)` objects with `$.type.name = 'Effect'` and nonnegative `$.effectID` under `gameActions...actions`. | Verify the captured game action and source identity mapping before linking world interactions. Do not confuse requirements with actions. |
| Requirements testing effects | `conditions` has 2,728 nested requirement objects with `requirementType = 'Effect'` and nonnegative `effectID` across 2,434 distinct conditions. | Decode the exact test text and link each condition's owner to its published page or interaction. Do not present a test as an application. |
| Stat meanings | `canonical_entities` has 121 stats and 116 nonempty descriptions. `progression_facts` has 121 stat records and 109 `statBonuses` rows. | Preserve authored descriptions. Verify any proposed computed or derived rule in a bounded native read before publishing it. The five without descriptions stay unlabeled for meaning. |
| Item stat sources | `item_stats` has 3,064 rows, `item_random_stats` has 2, and `item_gem_stats` has 79. Amounts, ranges, and percent flags are structured. | No new capture for these rows. Keep random ranges separate from fixed amounts. |
| Gear-set and talent stat sources | `gear_set_tier_stats` has 153 rows in 64 `gear_set_tiers`. `progression_facts` bonus ranks hold 1,764 `statEffects` rows across 2,107 ranks. | Resolve a shared talent to its owning class row, following the archived class-page design. No new capture for these rows. |
| Effect stat sources | `progression_facts` effect ranks have 304 `statEffects` rows. The stat records also have 43 `onHitEffects` rows. | Reverse the verified effect-rank stat changes. Treat a stat's on-hit effect as an effect application, not a stat amount. |
| Enchantment result and eligibility | `progression_facts` has 23 enchantments, 23 tiers, 33 tier stat rows, and 23 `appliesTo` entries. | Read the game's eligibility check before expanding authored rules into a list of specific eligible items. Preserve type, slot, rarity, and rank conditions. |
| Enchantment costs | The 23 tiers hold `successRate`, `enchantTime`, and `skillExperience`, but zero nested `currencyCosts`, zero `itemCosts`, and zero linked skill values in this build. | Verify whether another cost path exists before interpreting zero rows. Show "No cost recorded" instead of "Free" when no captured cost exists. |
| Enchantment item and source | `item_facts.enchantment_entity_key` links 23 enchantment items. `item_sources` has 11 rows for these items. | Use those links for acquisition, and distinguish an item without a recorded source from an item that cannot be acquired. |
| Faction identities, relationships, members | `progression_facts` has 5 factions, 15 stances, and 25 relations. `npc_facts.faction_entity_key` links 474 NPC rows. All 5 faction records have `showInReputation = false`. | Do not filter factions by the game's reputation visibility flag. Keep variant member links intact. |
| Reputation changes from kills and quests | `npc_faction_rewards` has 0 rows. `quest_rewards` has 0 reward types named faction or reputation. | Audit native kill and quest reward logic and captured NPC/quest fields first. If records exist in the game, extend capture and catalog. If they do not, report only that no changes are recorded. |
| Reputation unlocks | `conditions` has 0 nested objects with `requirementType = 'Faction'`. A raw search finds 428 conditions with nonnegative `factionID`, but all 614 such nested requirement rows have `requirementType = 'Race'`. The ID alone is not a faction requirement. | Verify the faction requirement path and its owners before claiming unlocks. Capture if real linked requirements exist. Otherwise label unlocks as not recorded. |

## Goals / Non-Goals

**Goals:**
- Convert captured facts and verified new evidence into four complete reference kinds with consistent navigation and reciprocal links.
- Keep a visible distinction between recorded absence and an unverified mechanic.

**Non-Goals:**
- Mechanics pages, build advice, recommended gear, or rankings.
- Native formula explanations without verification.
- Redirects or compatibility aliases.

## Decisions

### Use existing identity and projection paths

Set the four registry entries to page and searchable. Add one public document schema per kind in `packages/contracts/src/public/documents.ts`. Project documents in `packages/publication/src/documents.ts` and list rows in `packages/publication/src/lists.ts`. Extend `packages/catalog/src/queries.ts` with reverse indexes keyed by existing entity keys. Reuse the generic routes, reference resolver, search index, tooltip placement, and coverage graph. A separate parallel indexing layer would duplicate ownership and drift from existing reference handling. Keep every reachable record, even when source evidence is missing. The page states the gap.

### Distinguish actions from conditions

Use ability-rank applications and typed game actions as direct evidence. Use `npc_phase_abilities` and verified item links to show an application path through another actor. Show `conditions` as tests, not sources. An arbitrary `effectID` in a raw JSON record is not proof that the effect is applied. Distinct source identities prevent repeated placements from inflating source counts. Before a game-rule-dependent projection, complete the bounded read-only checks in the task list. Do not write guessed game numbers into the site.

### Keep source and amount provenance together

The stat document groups fixed item, random item, gem, gear-set tier, talent rank, and effect rank rows by source. It keeps amount, unit, chance or range, and contextual tier or rank. For a stat without an authored description, omit a meaning rather than infer one from a name. Effect and enchantment ranks keep their captured ordering and amounts. The publication derives inverse relations once, rather than asking the browser to scan every document. An absent data row never becomes a statement that the game grants zero.

### Use the existing shared site structure

Add four detail views through `DetailPage.svelte` and four tooltips through `TooltipPresenter.svelte`, with the established hero and section pattern. Show concise lists with relevant columns: effects by type and rank count, stats by category and unit, enchantments by item type and outcome, factions by member count and recorded visibility. The list only exposes supported columns. `build-compendium-hub` owns the Reference group. This change inserts its four links there without replacing the grouped shell. The shared `add-page-navigation` "On this page" component handles any page with four or more sections.

## Risks / Trade-offs

- Raw `effectID` fields occur in requirements and actions. → Require a typed action or a typed condition and verify its owner before publishing a link.
- Quest or kill reputation tables are empty. → Inspect native paths and scan evidence before deciding whether to extend capture. Empty tables do not assert game behavior.
- An eligibility rule can be narrower than its text suggests. → Verify the game's check before listing eligible items. Otherwise publish only the authored rule and label item matches unverified.
- Four kinds add many pages and reciprocal links. → Measure the largest document against the publication size budget and run graph and update parity checks.
- All factions are hidden from the in-game reputation interface. → Keep all five as reference records. Do not treat the visibility flag as reachability evidence.

## Migration Plan

Finish the bounded verification checks and capture missing structured evidence only when the checks support it. If capture changes, rescan affected data with clean cleanup receipts. Build a catalog candidate and compare its tables and rows with the accepted catalog, including any incidental scene differences. Project and publish a candidate against the accepted publication. Stage it and check graph and update parity. Check lists, links, tooltips, search, and detail pages in a real browser at 1440 px and 390 px. Accept the catalog and publication together through one update report. Keep the previous accepted publication as rollback. Do not add legacy routes or redirects.
