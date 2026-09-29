## Why

Many item pages do not say what the item does or where it comes from. 18 consumables show no effect, although their descriptions promise one. These are four renown reward boxes, two gold sacks, a companion contract, "Quest renown", and food and drink. After `correct-published-records`, 106 items still have no known source. 145 of the 210 captured loot tables have no known owner, and 24 items appear only in those tables. The game gives these through game actions of items, dialogue, effects, regions, and stats, and the scan does not read those owners.

## What Changes

- The scan reads the game actions of dialogue text nodes, effects, regions, stats, and NPC combat and AI data, including their templates. `publish-crafting-and-gathering` already reads item game actions.
- The catalog binds each loot table that a LootTable action names to the owner of that action. It keeps every action with its owner, and reports an unresolved target as a coverage issue.
- An item page shows what using the item gives: the contents of its loot table, a currency amount, a companion, a recipe, or another verified result. The contents keep their recorded quantity and chance without a claim of an effective chance.
- An item that a box or a dialogue gives gets a "From items" or "From dialogue" source. A recipe page names every captured teacher, not only items.
- The change reviews each item that still has no known source after the capture. The review adds an item to the exclusion list of `correct-published-records` only with the evidence that list requires. Other items keep their pages and appear on the coverage page.
- This includes the 10 records that `correct-published-records` leaves published: Giant Mace, Giant Sword, Great Crystal Sword, Life Eater, four Starter armor pieces, Rune Shield, and Forest Demon Quest.
- Out of scope: dialogue text and dialogue trees as reader pages, and any ranking of rewards.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `item-property-presentation`: Item pages show what using an item gives and the new sources "From items" and "From dialogue".
- `progression-data`: The catalog retains the game actions of dialogue nodes, effects, regions, stats, and NPC combat and AI data, and binds loot tables to action owners.
- `detail-pages`: A recipe page names every captured teacher.
- `reader-coverage`: Items from boxes and dialogue count as items with a known source.

## Impact

- Depends on `publish-crafting-and-gathering` for the capture of item game actions, and on `correct-published-records` for the exclusion list.
- Scan: new owners in `packages/scan/src/probes/collectors/canonical.csx` and `world-sources.csx`, or a new dialogue collector.
- Contracts and catalog: action facts by owner and loot table bindings in `packages/contracts/src/catalog` and `packages/catalog/src`.
- Publication and site: item use rows, item sources, recipe teachers, and coverage in `packages/publication/src` and `apps/site/src`.
- Evidence: bounded native analysis of the game action handlers for each published action type.
- Artifacts: a targeted scan, a compared catalog candidate, a publication candidate staged against the accepted publication, an update report, and joint acceptance.
