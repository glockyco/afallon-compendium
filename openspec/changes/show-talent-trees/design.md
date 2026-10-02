## Context

The accepted catalog `d3b56f3f` (build 25653798) has 31 `talentTrees` canonical entities, 558 `bonuses` progression facts, and `talent_nodes` rows with each node's tree, index, type, target, `tier`, `row`, and condition. Its `artwork_bindings` cover other entity kinds but no talent tree. Bonuses have no canonical entity rows.

`packages/scan/src/probes/collectors/artwork.csx` exports the `entryIcon` of many database families through one sprite reader, but not of talent trees or bonuses. `RPGTalentTree` (recovered declaration `RPGTalentTree.cs`) is an `RPGBuilderDatabaseEntry`. It has its own `icon` sprite (+0x60), `TiersAmount` (+0x68), `treePointAcceptedID` (+0x6C), and `nodeList` (+0x70) of `Node_DATA` with `nodeType`, `abilityID`, `recipeID`, `resourceNodeID`, `bonusID`, `Tier`, `Row`, and requirements. `RPGBonus` is also an `RPGBuilderDatabaseEntry`.

The game draws a tree in `TalentTreePanel` (`Blink/RPGBuilder/Managers/TalentTreePanel.cs`): tier slots from `TierSlotPrefab`, separate prefabs for active and passive nodes, `GenerateLine` and `InitTalentTreeNodeLines` for lines between nodes, and spacing fields such as `nodeXStartOffset` and `nodeDistanceOffset`. Those fields and the line rule decide what the page should mirror.

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

Decompile `TalentTreePanel.InitTree`, `InitTalentTreeLines`, `InitTalentTreeNodeLines`, `GenerateLine`, `HandleLine`, and `getNodeTierSlotIndex`. Record how the panel turns `Tier` and `Row` into a slot, which requirement makes a line between two nodes, and whether the tree icon comes from `icon` or `entryIcon`. Capture only the fields that this code reads and the catalog lacks. Spacing constants of the panel are presentation values of one prefab and stay out of the catalog unless the layout decision needs them.

### Export tree and bonus icons through the artwork collector

Extend `artwork.csx` with the `talentTrees` and `bonuses` families. Use the sprite that the panel code shows for each. Keep `extracted`, `missing`, and `unsupported` statuses with source paths, as the other families do.

### Bind bonus icons to progression facts

Trees bind through the existing `artwork_bindings` table, because they are canonical entities. Bonuses need a binding table keyed to `progression_facts`, with an asset reference, a role, and provenance, and with a foreign key to the fact. Inserting fake canonical bonus entities to reuse `artwork_bindings` was rejected. Both kinds reuse the content-hashed `artwork_assets` table.

### Keep the published pages unchanged

The catalog candidate must publish the same pages as the accepted publication, apart from the catalog identity. The publication comparison shows any other difference, which needs an explanation before acceptance.

### Screenshots for the layout decision

With the game running, open the talent tree panel of two classes, including one tree with lines between nodes and one Heroic tree, and save screenshots under ignored `local/research/`. Render the same trees from the catalog candidate in a throwaway preview with the captured icons, tiers, rows, and lines. Both sets go to the owner for the layout decision.

## Risks / Trade-offs

- Some sprites cannot be read. → The catalog records the issue and keeps the tree and node.
- A new scan can change unrelated rows. → Compare the catalog candidate with `d3b56f3f` table by table and explain each difference before acceptance.
- Opening the panel changes game UI state. → Close the panel and confirm a clean runtime receipt before the next operation.

## Migration Plan

Decompile the panel code. Extend the collectors and the catalog. Scan build 25653798 with a clean runtime receipt. Build a catalog candidate, compare it with `d3b56f3f`, publish from it, and check that pages are unchanged. Accept the catalog and publication together. Take the screenshots and the preview for the layout decision.
