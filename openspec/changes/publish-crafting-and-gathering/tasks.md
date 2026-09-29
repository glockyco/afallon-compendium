## 1. Verify game rules before using them

- [x] 1.1 Check the crafting rule against `research/ghidra/25434619/progression-functions-20260928.json` and its matching binary. Record the gate, bands, floor operation, and skill modifiers with evidence. Verify that the record distinguishes base experience from the final award.
  - Evidence: `progression-functions-20260928.json` (`CraftingDifficulty_*`), `crafting-functions-20260930.json`, and `gathering-functions-20260930.json` (the `GenerateCraftedItem` closures), all decompiled from `GameAssembly.dll` `f6e78dbd…` with no diagnostics. Field names come from the live offsets in `research/progression/25434619/crafting-gathering-state-20260930.json`.
  - Anchor: `A = max(rank.unlockCost, 1)`. Gate: `CraftingPanelWoW.StartCrafting` does not start a craft when `getSkillLevel(recipe.craftingSkillID) < A`, and it names the required level. `CraftingDifficulty.IsLocked` holds the same comparison but has no direct caller.
  - Bands for skill level `L`: `L < A + 10` gives band 0, `A + 10 ≤ L < A + 20` band 1, `A + 20 ≤ L < A + 35` band 2, and `L ≥ A + 35` band 3. `GetXpMultiplier` gives 1.0 for bands 0 and 1, 0.5 for band 2, and 0 for band 3.
  - Base award: `CraftingDifficulty.GetScaledExperience` returns `Mathf.RoundToInt(rank.Experience × multiplier)`. The disassembly shows that `0x180477d40` splits off the fraction with `modf` and rounds a half to the even whole number. This is not a floor.
  - The craft rolls each product on its own and keeps it when `Random.Range(0, 100) ≤ product.chance`. `GenerateCraftedItem` calls `GenerateSkillEXP(recipe.craftingSkillID, base award)` only when at least one product was given and the base award is above 0. Before that it requires every material and enough empty slots.
  - Final award: `GenerateSkillEXP` stops at the skill maximum, then applies a positive Experience Bonus total, `SkillXPBuffs.Apply`, and the world multiplier. The recipe rank's `Experience` is therefore base experience, not the final award.
- [x] 1.2 Run a read-only HotRepl probe of all seven `NodeAttunement` table slots. Record each non-null effect, boost weight, and node-name set with the build identity. Verify slot count and values against the decoded constructor. Do not infer six entries from one decoded entry.
  - Probe `research/progression/25434619/crafting-gathering-state-20260930.json` (application 0.14.4.1, build 25434619) reads `NodeAttunement.Attunements` with length 7 and no null slot:
    - Effect 98, +10: Small iron vein and Large iron vein.
    - Effect 642, +10: Silver vein. Effect 643, +10: Gold vein. Effect 644, +20: Duskmetal vein.
    - Effect 645, +10: Dawnpetal. Effect 646, +10: Stormleaf. Effect 647, +20: Ghostbloom.
  - The decompiled class constructor stops after slot 0 (effect 98, weight 10). That slot agrees with the probe, and the other six come only from the probe.
  - `NodeAttunement.GetBonusWeight` adds the weight of each slot that names the node (`String.op_Inequality`, identified by live method address) while `IsActive` finds the effect active. `OreSpawner.SpawnRoll` also shows a marker when `IsAttunedActive` holds.
- [x] 1.3 Use bounded build-matched Ghidra decompilation under `.agent/skills/native-analysis/SKILL.md` to inspect respawn, jitter, and player-range callers. Check binary hashes, method ranges, diagnostics, and ambiguous assembly branches. Verify the recorded behavior with a read-only observation when needed. Label any unresolved behavior instead of asserting it.
  - Evidence: `gathering-functions-20260930.json` and `interactable-functions-20260930.json`. Each range was checked against `llvm-readobj --unwind`. The address table gives 888 bytes for `InteractableObject.TriggerActions`, but its unwind entry runs from `0x8b3e30` to `0x8b55c0`. The method-length end falls in its switch dispatch, and its jump table sits at `0x8b5590`.
  - `OreSpawner`: `Run` waits in 0.5 s steps until the character data exists or 30 s pass, then calls `Tick` every 2 s. `Tick` measures the distance from the player to the spawner.
    - With no vein, the spawner rolls a vein only when the distance is at most `PlayerRange` and the time has reached `cooldownUntil`.
    - When the vein's `InteractableObject.State` is `OnCooldown`, the vein is destroyed after `DespawnDelay`. The next spawn time becomes `now + max(RespawnTime + Random.Range(-RespawnJitter, RespawnJitter), 5)`. The disassembly confirms both float arguments.
    - A vein that is not used is destroyed when the player moves beyond `PlayerRange`, and `cooldownUntil` does not change.
  - `SpawnRoll`: `t = clamp((L − 1) / (SkillCap − 1), 0, 1)` for mining skill level `L`, or 1 when `SkillCap ≤ 1`. The weight of an option is `max(lerp(weightAtLowSkill, weightAtHighSkill, t), teaserWeight)` plus the attunement bonus, with a floor of 0. The roll is `Random.Range(0, total)` over the options in order. `OreOption.requiredSkill` is not read.
  - `InteractiveNode.UseNode`: a resource node locks for its rank's `respawnTime` and returns to `Ready` through `resetNode`, with no jitter. Other node types use their own `cooldown`.
  - `InteractableObject`: using the object sets `CooldownLeft = Cooldown`, and `FixedUpdate` counts it down to `Ready`, with no jitter. None of the ten decompiled methods reads `UseResourceValues` or `Resource` to replace `Cooldown`, so any override remains unknown.
  - Skill gate of gathering: no gather path reads `RPGResourceNodeRankData.skillLevelRequired` or calls a skill-level getter. The object's requirements template carries the skill gate, as in `Pickaxe mining Mining 25_REQUIREMENTS`.
  - Gathering experience: `InteractableObject` action `Resource` needs a known resource node. It rolls the rank's loot table (`Random.Range(0, 100) ≤ chance × world multiplier`, count `Random.Range(min, max + 1)`), then calls `GenerateSkillEXP(resource.skillRequiredID, rank.Experience)`. `UseNode` calls the same method with the same fields. Gathering has no difficulty band.
- [x] 1.4 Check the item game action rule against the binary. Record which action list the game reads and which action teaches a recipe. Result: `ItemTooltip.GetRecipeRankUpID` reads the template's actions when `UseGameActionsTemplate` (0x1B8) is set and the template exists, otherwise the item's `GameActions` (0x1B0). It returns the `RecipeID` (0x20) of the first action with type Recipe (0x10 = 2) and node action RankUp (0x5C = 0), or -1 (`research/ghidra/25434619/item-recipe-functions-20260928.json`). `ItemTooltip.Show` then reads the product of that recipe's first rank.
- [x] 1.5 Inspect the remaining `AddSkillEXP` call sites for enchanting, game actions, quest actions, and the unnamed call. Verify which skill each one affects and when. Record any unresolved mapping so the page does not call its source list complete.
  - Evidence: `skill-source-functions-20260930.json`, the call-site disassembly, and the live offsets in `research/progression/25434619/skill-source-offsets-20260930.json`.
  - `EnchantingManager.EnchantItem`: when the tier's `skillID` is not -1, it gives `skillXPAmount` to that skill.
  - `GameActionsManager.TriggerGameActions`: a `Skill` game action with `ProgressionType.GainExperience` gives `Amount` to `SkillID`, and `GainLevel` calls `AddSkillLevel` instead. Every game action is skipped when its `chance` is not 0 and is below `Random.Range(0, 100)`.
  - `RPGBAddSkillExperienceQuestAction.Execute`: it gives the quest number `amount` to `skill`.
  - The formerly unnamed call is `InteractableObject.TriggerActions`, action `GiveSkillExperience`. It gives `amount` to `Skill`.
  - The auto-attack hit gives 2. The developer panel is the only other direct caller. Calls through delegates or virtual slots are outside the direct-call scan, so the page must not call the list complete.
  - Corrections to the accepted rules of explain-character-progression:
    - `FUN_18234aa30` is `UnityEngine.Random.Range(int, int)`, identified by live method address. It excludes its maximum, so the kill base roll never returns `MaxEXP` when `MaxEXP` is above `MinEXP`.
    - `ApplyKillExperience` inlines the same round-half-to-even code as `Mathf.RoundToInt`. The two rules that were marked unknown become verified in this change's rules record.

## 2. Catalog facts and links

- [ ] 2.1 Decode all canonical resource records and ordered ranks from the existing scan in `packages/catalog/src`. Preserve null and missing fields. Verify a fixture with two different rank loot tables, a null rank, and an unplaced resource entity.
- [ ] 2.2 Resolve rank loot tables, gathering skills, and resource source identities against world-source evidence. Link only yields with proven node and rank identity. Verify that a candidate chest yield stays source-only and that unresolved links produce coverage issues.
- [ ] 2.3 Add catalog queries for resource facts, rank yields, spawner options, and rule operands in `packages/contracts/src/catalog` and `packages/catalog/src`. Verify with a read-only query that every captured resource record and rank is accounted for, including unplaced nodes.
- [ ] 2.4 Read item game actions in `canonical.csx` as `GetRecipeRankUpID` does, including template actions. Decode each action's type, chance, node action, amount, and targets into catalog item facts. Report unresolved targets as coverage issues. Verify fixtures for an inline Recipe action, a template list, and an unresolved recipe.
- [ ] 2.5 Run a targeted canonical scan that records item game actions and any absent resource field. Build a catalog candidate from the accepted and targeted scan evidence. Compare table rows against accepted catalog `33/3d602d72…`. Verify that all 17,344 accepted yield sources remain and that new resource links and unrelated scan changes are explained.

## 3. Publication and public contracts

- [ ] 3.1 Extend public schemas for resource documents and the changed recipe and skill documents. Reuse the `mechanics` document kind from `explain-character-progression`. Verify schema fixtures for a multi-rank node, an unresolved yield, and a recipe with zero base experience.
- [ ] 3.2 Project each recipe rank's skill gate, base experience, and four verified ranges from catalog operands. Verify thresholds at the gate and at each band boundary. Verify that zero-experience or unverified ranks do not show a false positive award.
- [ ] 3.3 Project skill experience sources from verified mappings. Include weapon auto-attack hits, crafts, node use, and mapped enchanting, game-action, and quest-action sources when verified. Verify that an unmapped source is not attributed to the wrong skill and that each skill keeps its Character progression link.
- [ ] 3.4 Publish resource list rows, search entries, pages, and links from skills, item yields, and known placements. Keep unplaced nodes reachable. Verify both directions of a rank-linked item yield and the source-only fallback.
- [ ] 3.5 Project Teaches on recipe items and Taught by on recipes from Recipe RankUp actions. Count published recipes that are not learned by default and have no teaching item on the coverage page. Verify with a fixture that both directions link and that a recipe without a teaching item makes no claim.
- [ ] 3.6 Project `/mechanics/crafting-and-gathering` with recorded crafting bands, weighted spawner selection, verified respawn and player-range behavior, and confirmed attunement effects. Verify that the page never presents an option weight as an effective drop chance. Check its document size against the publication budget.

## 4. Reader surfaces

- [ ] 4.1 Update recipe pages to show required skill level, base experience, full, half, and no-experience ranges, and the mechanics link. Keep the product tooltip and materials. Verify an unlock-cost-zero recipe and each range boundary in the browser.
- [ ] 4.2 Update skill pages with relevant experience sources and resource links. Preserve the Character progression link and omit the removed Experience table. Verify Alchemy, Mining, and Axes in the browser.
- [ ] 4.3 Show Teaches with the product tooltip on recipe item pages and Taught by on recipe pages. Verify Recipe: Moonthread Helm and its recipe in the browser at 1440 px and 390 px.
- [ ] 4.4 Add resource list and detail views, item yield backlinks, and the mechanics page under the existing Mechanics navigation. Link the mechanics page to the resource list. Verify unplaced resources, rank-specific yields, unresolved sources, and plain reader labels in the browser. Do not alter the groups owned by `build-compendium-hub`.

## 5. Stage and accept the new build

- [ ] 5.1 Publish a candidate from the compared catalog candidate. Stage it against the accepted publication. Verify zero new publication issues, graph validity, update parity, and explained coverage changes.
- [ ] 5.2 Open the staged site at 1440 px and 390 px. Check recipe, recipe item, skill, resource, item, resource list, search, and mechanics pages. Verify links, the recorded values, source labels, section navigation on long pages, and no sideways scroll.
- [ ] 5.3 Author an update report and accept the catalog and publication candidates together. Verify the accepted build names both candidates and retains the prior accepted publication as rollback. Add no redirects or legacy routes.
- [ ] 5.4 Run targeted contract, catalog, and publication tests that defend rank boundaries and unresolved links. Run the repository checks once after integration. Verify that `openspec validate publish-crafting-and-gathering --strict` passes.
