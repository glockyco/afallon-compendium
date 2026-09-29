## Why

Many item pages do not say what the item does or where it comes from. 18 consumables have no structured use data. Eight of them have descriptions that promise a result: four renown reward boxes, two gold sacks, a companion contract, and "Quest renown". After `correct-published-records`, 106 items still have no known source. 145 of the 210 captured loot tables have no captured loot binding, and 24 items appear only in those tables. The scan does not read the game actions of items, dialogue nodes, effects, scene regions, or stats, which can give items and name loot tables.

## What Changes

- The scan reads the game actions of dialogue text nodes, effects, scene regions, and stats, including their templates. The recovered types confirm these owners. Other owners join only after a field-level check. `publish-crafting-and-gathering` already reads item game actions.
- The catalog binds each loot table that a LootTable action names to the owner of that action. It keeps every action with its owner, and reports an unresolved target as a coverage issue.
- An item page shows what using the item gives: the contents of its loot table, a currency amount, a companion, a recipe, or another verified result. The contents keep their recorded quantity and chance without a claim of an effective chance.
- An item that a box or a dialogue gives gets a "From items" or "From dialogue" source. A recipe page also names dialogue teachers. Other teachers need a readable identity first.
- The change reviews each item that still has no known source after the capture. The review adds an item to the exclusion list of `correct-published-records` only with the evidence that list requires. Other items keep their pages and appear on the coverage page.
- This includes the 16 records that `correct-published-records` leaves published, and the Task board giver without a name.
- Out of scope: dialogue text and dialogue trees as reader pages, and any ranking of rewards.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `item-property-presentation`: Item pages show what using an item gives and the new sources "From items" and "From dialogue".
- `progression-data`: The catalog retains the game actions of dialogue nodes, effects, scene regions, and stats, and binds loot tables to action owners.
- `detail-pages`: A recipe page names dialogue teachers.
- `reader-coverage`: Items from boxes and dialogue count as items with a known source.

## Impact

- Depends on `publish-crafting-and-gathering` for the capture of item game actions, and on `correct-published-records` for the exclusion list.
- Scan: new owners in `packages/scan/src/probes/collectors/canonical.csx` and `world-sources.csx`, or a new dialogue collector.
- Contracts and catalog: action facts by owner and loot table bindings in `packages/contracts/src/catalog` and `packages/catalog/src`.
- Publication and site: item use rows, item sources, recipe teachers, and coverage in `packages/publication/src` and `apps/site/src`.
- Evidence: bounded native analysis of the game action handlers for each published action type.
- Artifacts: a targeted scan, a compared catalog candidate, a publication candidate staged against the accepted publication, an update report, and joint acceptance.
