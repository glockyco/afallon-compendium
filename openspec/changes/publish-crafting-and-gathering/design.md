## Context

See proposal.md for the motivation. The accepted catalog has 132 recipe facts and 132 recipe ranks. `recipe_ranks` already stores `unlock_cost` and `experience` (`packages/catalog/src/database.ts:420-430`). `projectRecipe` currently uses only the first rank's rank number, product, and materials (`packages/publication/src/documents.ts:963-974`). The accepted catalog has 17,344 `resource_yields`, no `resource_ranks`, and no resource entities. None of those yields has a resource or rank link (read-only catalog queries on accepted artifact `33/3d602d72…` and candidate `98/259e1180…`).

Build 25434619 has no resource node records. The canonical scan records `sourceTotals.resources = 0`, because `GameDatabase.GetResources()` returns no entry. Every accepted yield comes from one of 1,058 `OreSpawner` sources for Herbalism, Mining, or Fishing. The world-source collector records each spawner option with its weights, skill cap, timing, and player range, and the `InteractableObject` of its prefab with actions, requirements template, and cooldown (`world-sources.csx`). The option prefabs have 53 distinct authored names, which give 51 names without tags and hints. 94 scene objects with gathering-skill experience add 5 names, 3 of which match spawner prefabs. The result is 53 node names. Two Fishing hole objects differ in requirements and experience, so the build has 54 nodes. Each node object holds a `Chest` action with its loot table, a `GiveSkillExperience` action, a `GiveCharacterExperience` action, and a requirements template such as `Pickaxe mining Mining 25`. Its `Resource` field is null. `EXPLORATION.md:35-36,69` warns that the authored source can be useful without a live node.

The results of tasks 1.1 to 1.5 in `tasks.md` record the verified rules with their evidence. They cover the crafting gate, bands, and rounding, the product chance roll, the spawner timing and player range, all seven attunement slots, and each skill experience source. No gather path reads a skill-level field of a resource rank. The requirements template of the node object carries the gathering skill gate.

## Goals / Non-Goals

**Goals:**
- Give every gathering node a page, even without a known placement. Link a yield to a node only through its own spawner option or object.
- Publish source-aware crafting and gathering explanations with the values of the accepted build.
- Reuse the existing page, reference, list, and relation patterns.

**Non-Goals:**
- No corruption content or recipe ranking.
- No effective per-spawn or per-gather probability from authored weights or loot rates.
- No new player-state simulation or live resource tracking.

## Decisions

### Derive bands once from a recorded rule and catalog operands

For a verified recipe rank, the gate and band anchor are `max(unlockCost, 1)`. Relative to that anchor, the recorded rule has two full-experience ranges, then a half-experience range, then no base experience. The thresholds are 10, 20, and 35 skill levels above the anchor. The base award is `baseExperience × multiplier`, rounded to a whole number with a half going to the even number, before skill modifiers (task 1.1). Store the rule with its build identity and native evidence in the catalog or publication. Compute each rank's displayed skill ranges from its captured unlock cost and base experience there. A site-only threshold or a hard-coded recipe value would drift on update. Preserve separate full ranges if the display names them Orange and Yellow. Never label base experience as a guaranteed final award. Check the skill maximum and zero-experience ranks before generating ranges. If rule evidence does not match the build, fail candidate publication rather than silently use the old rule.

### Build gathering nodes from world objects

Derive gathering nodes in the catalog from the spawner options and scene objects that the world-source evidence already holds. The key of a node is its authored name without rich-text tags and without the tool and level hints, for example `gatheringNodes:small-iron-vein`. A node keeps its gathering skill, `GiveSkillExperience` amount, `GiveCharacterExperience` amount, `Chest` loot table, requirements template, and every source with its placement when known. Sources that share a name must agree on skill, loot table, experience, and requirements template. A disagreement becomes a coverage issue and a separate variant, not a silent merge. A yield links to a node only through its own spawner option or object record. This is safer than matching yields by item name or source label. The catalog keeps all 17,344 existing yields, and a yield without a node link keeps its source, its provenance, and a coverage issue. The build has no resource ranks, so the catalog records none.

A spawner and a placed object follow different availability rules (task 1.3). A spawner shows a vein only while the player is in range, and it spawns the next vein after its respawn time plus or minus its jitter, with a floor of 5 seconds. A placed object returns to ready after its own cooldown. The page names the rule for each kind of source.

Expose gathering node documents through the existing kind registry, reference resolver, lists, search, and document dispatch, at `/gathering-nodes/<slug>`. Link known yields from the node page to item pages and back from item Gathered from rows. Connect each gathering skill page to all of its nodes, including those without placements. A gathering node list is the fallback path for a node that has no known yield or skill link. Do not change the top-navigation groups owned by `build-compendium-hub`.

### Capture item game actions as the game reads them

`ItemTooltip.GetRecipeRankUpID` reads the actions of the item's template when `UseGameActionsTemplate` is set and the template exists. Otherwise it reads the item's own `GameActions`. It returns the `RecipeID` of the first action whose type is Recipe and whose node action is RankUp (`research/ghidra/25434619/item-recipe-functions-20260928.json`). The game's item tooltip then shows the product of that recipe.

The items collector in `canonical.csx` reads the same list in the same way. It records each action's type, chance, node action, amount, and target identifiers, and the template identity when a template supplies the list. The catalog keeps every action. This change publishes Recipe RankUp actions only. A recipe item links its recipe and shows the product, and the recipe links back to each item that teaches it. Other action types stay in the catalog for later changes.

Dialogue nodes, interactable objects, effects, regions, and combat triggers can also hold Recipe actions. This change does not read them for recipes, and `publish-item-uses-and-sources` adds them later. A recipe that is not learned by default and has no teaching item therefore keeps its page, and the coverage page counts it. The page does not claim that nothing teaches it.

### Publish one mechanics document from captured facts

Depend on the `mechanics` document kind and `/mechanics/<topic>` route introduced by `explain-character-progression`. Add `/mechanics/crafting-and-gathering` to its Mechanics group without introducing a second route system. Project a document containing rule evidence, representative captured spawner options, and current-build values from the catalog. Follow the existing document graph and size budgets rather than shipping raw scans to the browser. The page explains that `SpawnRoll` selects a weighted option from `ComputeWeights`. Task 1.3 verifies interpolation between low- and high-skill weights, a teaser floor, an attunement bonus, and a nonnegative floor. The page does not convert weights into independent chance percentages. Link the page from recipes, gathering skills, and the gathering node list.

Task 1.2 records all seven attunement slots from a read-only probe, and task 1.3 records the timer, jitter, and player-range behavior from bounded decompilation checked against the unwind ranges. Store these rules in the reviewed mechanics rules record with their evidence objects, as `explain-character-progression` does. Avoid explaining `RandomActivator` as a spawner because its content control is unverified.

### Attribute skill experience only to demonstrated paths

Task 1.5 maps every direct `AddSkillEXP` caller to its skill and amount fields: auto-attack hits, crafting, gathering node actions, enchanting tiers, Skill game actions with `GainExperience`, and the skill quest action. Publish an amount only when captured data supplies it. Calls through delegates or virtual slots are outside the direct-call scan, so the pages do not call the list complete. Recipe and node links supply examples, not recommendations. The skill page keeps the Character Progression link and the Levels section from `explain-character-progression`.

## Risks / Trade-offs

- Sources that share a node name may differ in loot or experience. → Record a coverage issue and keep separate variants.
- A yield row may not trace to one option or object. → Keep it on its source with a coverage issue.
- New gathering node pages increase document and search sizes. → Check graph limits and keep spawner examples bounded to captured evidence.
- Calls through delegates or virtual slots can award skill experience outside the direct-call scan. → The pages do not call the source list complete.
- Dialogue nodes, objects, and effects can teach recipes that the scan does not read. → The coverage page counts recipes without a known teaching source.

## Migration Plan

Complete build-matched evidence checks before projecting rules. Run a targeted canonical scan that records item game actions. Build a catalog candidate from it and the accepted world scans, and derive the gathering nodes there. Compare all changed tables and yield links with the accepted catalog. Publish a candidate against that catalog, stage it against the accepted publication, and inspect recipe, skill, gathering node, item, and mechanics pages at 1440 px and 390 px. Accept catalog and publication together with an update report. Keep the former accepted publication as rollback. No redirects, aliases, or resource paths are added.
