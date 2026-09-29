## Context

See proposal.md for the motivation. The accepted catalog has 132 recipe facts and 132 recipe ranks. `recipe_ranks` already stores `unlock_cost` and `experience` (`packages/catalog/src/database.ts:420-430`). `projectRecipe` currently uses only the first rank's rank number, product, and materials (`packages/publication/src/documents.ts:963-974`). The accepted catalog has 17,344 `resource_yields`, no `resource_ranks`, and no resource entities. None of those yields has a resource or rank link (read-only catalog queries on accepted artifact `33/3d602d72…`).

The canonical collector captures resource ranks with unlock cost, required skill level, experience, loot table, gather time, and respawn time (`packages/scan/src/probes/collectors/canonical.csx:966-993`). The world-source collector captures spawner options, weights, skill caps, timing, and player range (`world-sources.csx:1279-1291,1321-1345`). It also records candidate outputs without rolling them. `EXPLORATION.md:35-36,69` warns that the authored source can be useful without a live node.

Native analysis records crafting experience bands, node-use experience, spawner weights, and one decoded attunement entry (`local://progression-ux-findings.md:25-48`; `research/ghidra/25434619/progression-functions-20260928.json`; `ore-attunement-corruption-functions-20260928.json`). This brief reports one unnamed skill-experience call site and does not verify all attunement slots. A captured `PlayerRange` field is not proof of its runtime check.

## Goals / Non-Goals

**Goals:**
- Preserve every captured resource record even without a world placement. Link only yields with proven node and rank identity.
- Publish source-aware crafting and gathering explanations with the values of the accepted build.
- Reuse the existing page, reference, list, and relation patterns.

**Non-Goals:**
- No corruption content or recipe ranking.
- No effective per-spawn or per-gather probability from authored weights or loot rates.
- No new player-state simulation or live resource tracking.

## Decisions

### Derive bands once from a recorded rule and catalog operands

For a verified recipe rank, the gate and band anchor are `max(unlockCost, 1)`. Relative to that anchor, the recorded rule has two full-experience ranges, then a half-experience range, then no base experience. Native research reports thresholds at 10, 20, and 35 skill levels and `floor(baseExperience × multiplier)` before skill modifiers (`local://progression-ux-findings.md:31-33`). Store the rule with its build identity and native evidence in the catalog or publication. Compute each rank's displayed skill ranges from its captured unlock cost and base experience there. A site-only threshold or a hard-coded recipe value would drift on update. Preserve separate full ranges if the display names them Orange and Yellow. Never label base experience as a guaranteed final award. Check the skill maximum and zero-experience ranks before generating ranges. If rule evidence does not match the build, fail candidate publication rather than silently use the old rule.

### Promote canonical resource records and join yields conservatively

Decode `canonical.csx` resource gameplay into resource facts keyed by native resource identity, with ordered rank rows and provenance. Connect `skillRequiredID` to the existing skill facts. Connect each rank's `lootTableID` to its captured loot relations. Where a world source and the captured resource identity prove a rank, link yields to that rank without merging unrelated source rows. Keep an ore candidate's chest loot or an ambiguous `possibleOutput` as a source-only yield until it identifies a rank. Report unresolved links, null ranks, and missing loot tables as coverage issues. A missing `CurrentNode` must not remove the authored candidate (`EXPLORATION.md:69`). This is safer than matching yields by item name, source label, or guessed rank index. Compare source and rank linkage against the accepted catalog's 17,344 yields so new links do not silently lose item sources.

Expose resource documents through the existing kind registry, reference resolver, lists, search, and document dispatch. Link known yields from the resource page to item pages and back from item Gathered from rows. Connect matching skill pages to all resource nodes, including those without placements. A resource list is the fallback path for a node that has no known yield or skill link. Do not change the top-navigation groups owned by `build-compendium-hub`.

### Capture item game actions as the game reads them

`ItemTooltip.GetRecipeRankUpID` reads the actions of the item's template when `UseGameActionsTemplate` is set and the template exists. Otherwise it reads the item's own `GameActions`. It returns the `RecipeID` of the first action whose type is Recipe and whose node action is RankUp (`research/ghidra/25434619/item-recipe-functions-20260928.json`). The game's item tooltip then shows the product of that recipe.

The items collector in `canonical.csx` reads the same list in the same way. It records each action's type, chance, node action, amount, and target identifiers, and the template identity when a template supplies the list. The catalog keeps every action. This change publishes Recipe RankUp actions only. A recipe item links its recipe and shows the product, and the recipe links back to each item that teaches it. Other action types stay in the catalog for later changes.

Dialogue nodes, interactable objects, effects, regions, and combat triggers can also hold Recipe actions. The scan does not read them for recipes. A recipe that is not learned by default and has no teaching item therefore keeps its page, and the coverage page counts it. The page does not claim that nothing teaches it.

### Publish one mechanics document from captured facts

Depend on the `mechanics` document kind and `/mechanics/<topic>` route introduced by `explain-character-progression`. Add `/mechanics/crafting-and-gathering` to its Mechanics group without introducing a second route system. Project a document containing rule evidence, representative captured spawner options, and current-build values. Follow the existing document graph and size budgets rather than shipping raw scans to the browser. The page explains that `SpawnRoll` selects a weighted option from `ComputeWeights`. The native analysis derives interpolation between low- and high-skill weights, a teaser floor, an attunement bonus, and a nonnegative floor (`local://progression-ux-findings.md:39-46`). It does not convert weights into independent chance percentages. Link the page from recipes and gathering skills.

Before publication, run a read-only HotRepl probe of all seven attunement slots. Record each non-null effect, boost weight, and node-name set with build identity and field paths. A decoded entry for Prospecting is evidence for that entry only. Verify the timer, jitter, and player-range check through bounded Ghidra analysis of their actual callers, with a read-only observation when a branch is ambiguous. Follow `.agent/skills/native-analysis/SKILL.md`, including binary hash, method ranges, output diagnostics, and assembly review. If a detail remains unverified, label the captured field without claiming an effect. Avoid explaining `RandomActivator` as a spawner because its content control is unverified (`local://progression-ux-findings.md:48-49`).

### Attribute skill experience only to demonstrated paths

Use the brief's verified auto-attack mapping for weapon skills and its verified crafting and node-use paths for relevant skills. Investigate the concrete targets of enchanting, game actions, and quest-action call sites before attributing them to particular skills. Keep an unresolved call site as an explicit limit on completeness, not a claim that there are no other sources (`local://progression-ux-findings.md:25-35`). Publish the evidenced amount only when captured rule data supplies it. Recipe and resource links supply examples, not recommendations. The skill page keeps the Character progression link from `explain-character-progression` and does not restore level-by-level experience tables.

## Risks / Trade-offs

- A spawner option may expose candidate chest loot without one node rank. → Keep its yield attached to the source and expose the unresolved relation.
- Runtime attunement slots may contain additional boosts. → Probe the complete table before projecting effect names or amounts.
- Respawn fields and player range may not have the meanings implied by their names. → Verify their callers before describing behavior. Label unresolved values as recorded fields.
- New resource pages may increase document and search sizes. → Check graph limits and keep spawner examples bounded to captured evidence.
- Source-specific skill experience mapping may remain incomplete. → Distinguish demonstrated paths from unresolved paths on the mechanics page.
- Dialogue nodes, objects, and effects can teach recipes that the scan does not read. → The coverage page counts recipes without a known teaching source.

## Migration Plan

Complete build-matched evidence checks before projecting rules. Build a catalog candidate from the existing accepted scan when canonical resource evidence is complete. Run a targeted canonical scan that records item game actions, and add any absent resource, attunement, or spawner field to the same scan. Compare all changed tables and yield links with the accepted catalog. Publish a candidate against that catalog, stage it against the accepted publication, and inspect recipe, skill, resource, item, and mechanics pages at 1440 px and 390 px. Accept catalog and publication together with an update report. Keep the former accepted publication as rollback. No redirects, aliases, or old resource paths are added.
