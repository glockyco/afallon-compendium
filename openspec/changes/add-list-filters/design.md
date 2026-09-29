## Context

See proposal.md for the problem. `packages/publication/src/kind-registry.ts` defines list columns and facets. `packages/publication/src/lists.ts` builds rows from public documents. `apps/site/src/lib/ListTable.svelte` restores facets, numeric ranges, search, and sorting from URL parameters. It already accepts `/items?slot=BOOTS`, but its row values cannot carry several amounts for one stat.

Read-only catalog audit of the accepted build 25434619 (`artifacts/objects/sha256/33/3d602d72deaba6489e02b00babda425718cc5f5694090e1975e6465fe1e1f4`): `item_facts` has 1,153 rows. Of those, 148 have a weapon type and 581 have an armor slot. `item_stats` has 3,064 rows across 694 items. `item_random_stats` has two rows. `recipe_materials` has 203 rows for 98 distinct linked items. `quest_rewards` has 396 rows across 136 quests. The `given` and `pick` sets contain 394 rewards: Experience (136), item (198), and currency (60). The `itemGiven` set contains two items supplied to quests, not quest rewards. These counts describe source data, not guaranteed publication coverage.

The catalog already captures class weapon names in `entity_details.detail_json` under `publicData.gameplay.allowedWeaponTypes`. `packages/publication/src/index-resources.ts:81-87` projects those names onto class documents. The recovered `RPGClass.cs:48-49` tooltip says these types constrain weapons in valid hands and that armor and item level requirements stay on the item. This tooltip is intent, not the executable equip rule. `InventoryManager.cs:83-91,106` declares `CanEquipWeaponFromBag`, `EquipItem`, and `GetRequirementFailedMessage`, but recovered method bodies are empty. Their RVAs appear in `research/ghidra/25434619/property-currency-callees-20260927.json`. No native equip branch has been verified for this change.

`PublicItem.facts.stats` and `randomStats` already carry typed amounts and percentage flags (`packages/contracts/src/public/documents.ts:91-99,281-304`). `PublicItem.usedInRecipes` names recipe materials (`packages/publication/src/documents.ts:400-443`). The ability document has `versions[].learnedBy` for published classes (`documents.ts:863-885`). By contrast, `lists.ts:51-60` has no quest reward facet. `queryQuestRows` skips reward rows without a counterpart (`packages/catalog/src/queries.ts:584-585`), so it cannot supply all reward types, notably an experience-only row. The same table also holds `itemGiven` rows, which are not rewards.

## Goals / Non-Goals

**Goals:**
- Reuse the generic kind list and URL filter flow. Publish only facts required for precise matching.
- Keep the unfiltered item, quest, and ability lists complete. Unknown compatibility is not a match.
- Use source amounts and names from the catalog through publication. Do not put game numbers in the site.

**Non-Goals:**
- A character planner, recommendations, gear scoring, or character-specific eligibility after level and other requirements.
- A new recipe page, new scan field, or a change to the game's equip rules.

## Decisions

### Verify the native equip path before projecting class matches

First use `.agent/skills/native-analysis/SKILL.md` from the main checkout. Check the build-matched binary hash and method RVAs. Decompile bounded unwind ranges for `CanEquipWeaponFromBag`, `GetRequirementFailedMessage`, and the equip paths they call. Check the relevant branches against assembly. Record whether a class's allowed weapon type controls each hand and whether armor has any class gate. If decompilation leaves a branch ambiguous, use a bounded read-only HotRepl probe to compare one allowed and one disallowed weapon and an armor item. Do not launch the game for planning. Use no class match until this check decides the rule. If it contradicts the tooltip, update the planned projection to follow observed behavior, not the tooltip.

The alternative is to match a class by item requirements or by starting gear. Neither is an equip check. The evidence brief notes that a class link on Flesh Rend comes from class-gated container availability, not an item class requirement. Do not treat a source gate as an equipment gate.

### Publish class matches from captured weapon types

Use the list of offered classes that already has pages. Match a weapon's captured type against each class's captured allowed types under the verified rule. Do not match by the item's source or by an NPC loot specialization. Apply the verified armor branch to slotted armor. Exclude non-equipment and unknown weapon types from class-filtered matches, but retain their unfiltered rows. Publish class names as filter values and reader labels, and use the existing class page name in a URL-encoded class parameter. The class detail page constructs the same URL. No fixed class list belongs in site code.

The alternative is a site-side join of every item document to every class document. Publishing matches once avoids client document fetches and centralizes the verified rule. A class match does not promise the character meets the item's level or other requirements.

### Extend list rows for typed item stat ranges

A `ListRow` has primitive `values` and string `facets`. Neither represents several fixed and random amounts with units. Add typed stat entries to item rows: stat name, flat or percentage unit, fixed amount or captured random minimum and maximum, and a possible-value marker. Keep item power in its existing numeric column and range control. Use item `facts.stats` and `facts.randomStats`, not gem socket bonuses or inferred enchantments. Bump the static kind-list schema and migrate its manifest references, graph checks, resource edges, list loader, fixtures, and consumers in one cutover. Keep rows for other kinds unchanged except for the required new field shape.

The UI builds stat options from published entries. A stat selection without an amount checks presence. An inclusive amount filter checks a fixed amount or overlap with a captured random range. Compare only values with the selected unit. Show the matched amount and whether it is possible rather than hiding the uncertainty. Names and amounts come from list data. This is not a computed total for equipped gear. One numeric column per stat was rejected because it would create a wide, sparse table and lose random ranges.

### Reuse existing relations where they have the right meaning

Set the Crafting material facet from nonempty `PublicItem.usedInRecipes`. This relation reflects the material role, not a recipe product. Query typed `quest_rewards` rows from the `given` and `pick` sets, including rows with no target. Exclude `itemGiven` because it supplies items to quests rather than rewards. Expose the reward type summary through the catalog query used by publication. Do not infer a reward type from a linked entity or from `quest_facts.experience`. Build the quest facet from this summary and render readable type labels. The accepted catalog already stores the source rows, so a new scan is not expected. The Class column gathers distinct `versions[].learnedBy[].class` names. Keep `usedBy` as NPC users. Existing unpublished class references do not turn into fabricated class pages.

The alternative is to infer quest types from `PublicQuest.rewards` and `rewardChoices`. Those arrays omit experience because its row has no counterpart. The alternative would silently miss captured reward facts.

### Preserve URL composition and coverage

Register `class`, `stat`, `craftingMaterial`, and `rewardType` with the existing facet flow, with separate minimum and maximum for the selected stat. Restore and write them with the current `pushState`, `replaceState`, and `popstate` behavior. Keep `slot`, `q`, and `sort` untouched when another filter changes. Match facets with AND across kinds of filter and OR within a repeated facet, as the current list does. Show human labels, not raw enum spellings or keys. A plain list URL still shows every published row. A class link uses the same URL format as a manual selection. No old route or alias is needed.

### Name the gear type in its own column

The Type column shows the broad item type, so every weapon row reads Weapon. The game's item tooltip names the weapon type or armor type instead, such as Shield or One Handed Sword. A separate Gear column and filter carry that value from the published item facts. Replacing the value of the Type column would make the Type column and the Type filter disagree, and the hub's item groups link through the Type filter.

## Risks / Trade-offs

- The tooltip could differ from the equip branch. → Native review precedes class projection. An unresolved branch needs a bounded read-only probe before publication.
- A random stat range describes a possibility, not a guaranteed roll. → The UI labels it possible and uses interval overlap.
- The accepted list schema is version 2 across several consumers. → Migrate references together and validate publication graph and resource edges.
- Additional list facts can increase shard size. → Measure each list shard against the existing publication size budget before staging.
- A future catalog may add reward types or classes. → Build filter options from published data instead of fixed site enumerations.
- A list's class filter does not establish all item requirements. → The class page link names compatible gear, while item pages retain their full requirements.

## Migration Plan

Review the equip branch and record the decision. Extend the catalog query if needed, then build a catalog candidate from the accepted scan inputs and compare its rows against the accepted catalog. Expect unchanged source rows unless the verified rule reveals a capture gap. Project the new list facts and cut over the list schema, publication references, and site consumer together. Publish a candidate from that catalog and stage it against the accepted publication. Check the staged lists and class link in a browser at 1440 px and 390 px. Accept the catalog and publication together with one update report. Keep the previous accepted publication as rollback. No redirect or legacy list schema remains.
