## Context

The accepted catalog `d3b56f3f` (build 25653798) has 31 `talentTrees` canonical entities, 558 `bonuses` progression facts, and `talent_nodes` rows with each node's tree, index, type, target, `tier`, `row`, and condition. Its `artwork_bindings` cover other entity kinds but no talent tree. Bonuses have no canonical entity rows. The catalog retains each node's authored requirement condition and each tree's tier count, but does not expose the global slots-per-tier setting or resolved prerequisite-line edges.

`packages/scan/src/probes/collectors/artwork.csx` exports the `entryIcon` of many database families through one sprite reader, but not of talent trees or bonuses. `RPGTalentTree` and `RPGBonus` inherit `RPGBuilderDatabaseEntry.entryIcon` (+0x38), but each also declares a separate `icon` (+0x60). `RPGTalentTree` declares `TiersAmount` (+0x68), `treePointAcceptedID` (+0x6C), and `nodeList` (+0x70); its `Node_DATA` has `nodeType`, target IDs, `Tier` (+0x30), `Row` (+0x34), and requirements. These recovered declarations identify fields, not the behavior of the game panel.

Build-matched native evidence is `research/ghidra/25653798/talent-panel-functions-20261002.json` (GameAssembly SHA-256 `3625dbe861e3a3d31a07378065f4d8862be07fa77e83f15592ebc080452a952c`), checked against `cpp2il-method-addresses-20261001.json` and recovered declarations. `TalentTreePanel.InitTree` (RVA `0x9f9640`) creates `tree.TiersAmount` tiers and, within each tier, `GameDatabase.ProgressionSettings.TalentTreeNodesPerTier` slots. That setting is `GameDatabase.ProgressionSettings` (+0x50) → `RPGBuilderProgressionSettings.TalentTreeNodesPerTier` (+0x48); `GameDatabase.GetProgressionSettings()` exposes it to the collector. The loop filters `nodeList` first by `Node_DATA.Tier == tier index + 1` (`<InitTree>b__0`, RVA `0xa074d0`), then by `Node_DATA.Row == slot index + 1` (`<InitTree>b__1`, RVA `0xa074f0`), so stored tier and row are one-based slot coordinates. The two small predicates were separately decompiled against the same binary.

`InitTalentTreeLines` (RVA `0x9f8890`) visits occupied node slots. `InitTalentTreeNodeLines` (RVA `0x9f8a90`) examines each tree node's selected requirements: inline `Node_DATA.Requirements` (+0x48), or `RequirementsTemplate.Requirements` (+0x48) when `UseRequirementsTemplate` (+0x38) selects the template (+0x40). A prerequisite line is considered when a `RequirementsData.Requirement` has `Knowledge == Known` (+0x7C == 0), its `RequirementType` (+0x10) is Ability (0), Bonus (1), Recipe (2), or Resource (3), and its corresponding `AbilityID` (+0x18), `BonusID` (+0x1C), `RecipeID` (+0x20), or `ResourceID` (+0x24) matches the occupied source slot's target ID. The panel then resolves the dependent node's holder before `GenerateLine` (RVA `0x9f8000`); learned/rank/other requirements affect line appearance rather than changing those prerequisite-ID matches. `getNodeTierSlotIndex` (RVAs `0x9fba30` and `0x9fbf10`) looks up each endpoint in the constructed tiers/slots to position the line; `HandleLine` (RVA `0x9f8430`) sets its rendered geometry.

The tree-selection UI's `CombatTreeSlot.InitSlot` (RVA `0x8f2090`) sets its image from `RPGTalentTree.entryIcon` (+0x38), not `RPGTalentTree.icon` (+0x60). The panel's `TreeNodeHolder.Init` (RVA `0x9135b0`) sets its bonus-node image from `RPGBonus.entryIcon` (+0x38), not `RPGBonus.icon` (+0x60); its other node types likewise use their `entryIcon`. `TalentTreePanel.InitTree` reads the tree display name (+0x30) but does not display a separate tree icon inside the panel. These two additional display methods were decompiled against the same binary to establish the sprite source. Native pseudocode is not recovered game source; the captured screenshots will still check presentation against the running game.

The panel that players see is a different one. In the running game, `TalentTreePanel.Show` leaves its object inactive in the hierarchy, and the talent screen titled "Shieldmaster Talents" is `TalentWebPanel`, a radial web. `TalentWebPanel.BuildWeb` (RVA `0xa781d0`, `research/ghidra/25653798/talent-web-functions-20261002.json`) takes the class's trees in order and keeps those with `TiersAmount > 0`, `treePointAcceptedID >= 0`, and nodes. It gives each one a wedge of 360/n degrees, starting at 90 degrees (up) and going clockwise; the constants 90 and 360 were read from the binary. `BuildBranch` (RVA `0xa77ba0`) narrows each wedge by `wedgeGapDegrees` (20) and calls `TalentWebLayout.Build` (RVA `0xa75210`) with `ringStart` 300, `ringStep` 185, `nodeArc` 145, and `nodeSize` 100. `Build` links a node to the nodes named by its Known requirements, with the same type mapping as the grid panel, places the nodes in layers, and orders each layer to reduce line crossings. How it uses tier and row was not decoded. Inspecting an adventurer (`ShowForEntity`, RVA `0xa7bd40`) shows the trees in the order of the adventurer's build, so the same class can face a different way.

A read-only HotRepl call of `TalentWebLayout.Build` for every class, with the panel's own values, returned each node's position and each line's points (`local/research/runtime-20261002/talent-web-layout.data.json` in the main checkout). Every wedge has zero crossings. Screenshots of the Shieldmaster web, the Wizard web of an inspected adventurer, and a closer view of a Heroic Ascension wedge are in `local/research/talent-screenshots-20261002/`.

## Goals / Non-Goals

**Goals:**
- Record every tree and passive talent icon that the game has, and an explicit issue for each one it cannot read.
- Record the facts the game's panel uses to place nodes and draw lines, verified from its native code.
- Produce screenshots of the in-game panel and a preview of the captured data for the layout decision.

**Non-Goals:**
- Class page layout, class document fields, talent links, and anchors. A later change designs them.
- A planner, point allocation, or build advice.

## Decisions

### Read the panel code before deciding what to capture

The only panel layout value absent from the captured facts is `GameDatabase.ProgressionSettings.TalentTreeNodesPerTier`. Capture it with its source field path on each tree record and normalize it as `slotsPerTier`. Existing tree tier counts, one-based node tier and row values, node types and targets, and selected requirement conditions already retain the source facts needed to derive prerequisite lines: match the Known requirements' typed IDs to another occupied node's typed target within the tree. A resolved line-edge table is not an additional authored fact. Keep spacing constants of the panel out of the catalog unless the layout decision needs them.

### Export tree and bonus icons through the artwork collector

Extend `artwork.csx` with the `talentTrees` and `bonuses` families. Export inherited `entryIcon` for each, because the displayed tree-selection icon and bonus-node icon both read that field rather than the separate `icon` field. Keep `extracted`, `missing`, and `unsupported` statuses with source paths, as the other families do.

### Bind bonus icons to progression facts

Trees bind through the existing `artwork_bindings` table, because they are canonical entities. Bonuses need a binding table keyed to `progression_facts`, with an asset reference, a role, and provenance, and with a foreign key to the fact. Inserting fake canonical bonus entities to reuse `artwork_bindings` was rejected. Both kinds reuse the content-hashed `artwork_assets` table.

### Keep talent changes out of published pages

Talent icon and layout capture alone does not add a talent page or change class documents. This scan also implements `show-new-character-start`, which deliberately changes place documents and their Getting there cards where captured playable races start. Compare the candidate publication against the accepted one and explain those expected place changes and every other difference before acceptance.

### Screenshots for the layout decision

With the game running, open the talent web of two classes, including one tree with lines between nodes and one Heroic tree, and save screenshots under ignored `local/research/`. Render the same trees in a throwaway preview from the catalog candidate's icons, tiers, rows, and requirement lines, and from the game's own web layout. Both sets go to the owner for the layout decision. If the owner chooses the game's web, a later change decides whether to capture its positions or compute them.

## Risks / Trade-offs

- Some sprites cannot be read. → The catalog records the issue and keeps the tree and node.
- A new scan can change unrelated rows. → Compare the catalog candidate with `d3b56f3f` table by table and explain each difference before acceptance.
- Opening the panel changes game UI state. → Close the panel and confirm a clean runtime receipt before the next operation.

## Migration Plan

Decompile the panel code. Extend the collectors and the catalog. Scan build 25653798 with a clean runtime receipt. Build a catalog candidate, compare it with `d3b56f3f`, publish from it, and account for the planned race-start place changes and any other page differences. Accept the catalog and publication together. Take the screenshots and the preview for the layout decision.
