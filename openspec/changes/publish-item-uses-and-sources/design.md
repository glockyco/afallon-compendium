## Context

See `proposal.md` for the motivation. `publish-crafting-and-gathering` captures item game actions as `ItemTooltip.GetRecipeRankUpID` reads them. It publishes Recipe RankUp actions only and keeps the other action types in the catalog. `correct-published-records` adds the reviewed exclusion list.

The recovered types name more owners of game actions. `RPGDialogueTextNode`, `RPGEffect`, and `RPGStat` hold a `GameActionsTemplate`. `RPGGameScene` regions hold a `GameActionsList`. NPC combat and AI data also hold actions. `world-sources.csx` already reads the actions of interactable objects: it turns a LootTable action into a container output and an Effect or Teleport action into a door (`world-sources.csx:561-600`). No collector reads dialogue.

`GameActionType` has 29 values, from Ability to LootTable. In the accepted catalog, 145 of 210 loot tables have no binding, and 24 items appear only in those tables. Quest rewards give experience, currency, and items, but never a loot table. The names of the unbound tables include the renown boxes, gold coin ranges, supply packs, resource veins, and fishing holes. `publish-crafting-and-gathering` binds the resource and fishing tables to resource ranks.

## Goals / Non-Goals

**Goals:**
- Read every owner of game actions that the game database holds, as the game reads it.
- Publish only the action results whose meaning a native handler or a runtime check confirms.
- Give each remaining item without a source a recorded decision.

**Non-Goals:**
- No dialogue text, dialogue trees, or dialogue pages.
- No effective chance for a loot roll.
- No publication of an action type whose result stays unverified.

## Decisions

### Read each owner the way the game reads it

For items, `GetRecipeRankUpID` reads the actions of the template when the template flag is set and the template exists. The other owners may follow a different rule. A bounded native analysis of the action trigger of each owner type records the list that the game reads. The collectors then read the same list and record the owner identity, the template identity, and each action with its type, chance, node action, amount, and targets. A guessed rule could publish actions that the game never runs.

### Capture dialogue at the level of its actions

A dialogue collector records each text node that has actions, its dialogue, and the NPCs that start that dialogue. It records no dialogue text. A source row therefore names the NPC, which is the thing that a reader can find. A complete dialogue capture would add text, branching, and requirements that no page shows yet.

### Bind loot tables to action owners in the catalog

A LootTable action creates a loot binding from the owner to its table. The binding context names the owner kind, such as an item or a dialogue node. Items in the table then gain a source. An item owner gives a "From items" source, and a dialogue owner gives a "From dialogue" source. Effect, region, stat, and combat owners stay in the catalog and in coverage until a later change names their sources for readers. This is safer than a label for an owner kind that the reader cannot find.

### Publish verified action results only

A bounded native analysis of the action handler records the result of each action type that items use. The expected types are LootTable, Item, Currency, NPC, Point, Faction, and Effect. Where a branch stays ambiguous, a use on a research character confirms the result. The publication then shows a Contents section for a loot table, an amount for currency, and a link for a companion or recipe. An unverified type stays a catalog coverage issue and does not appear as an effect. The Contents rows reuse the loot row presentation of the Dropped by section, with the recorded quantity and chance semantics.

### Decide each remaining item without a source

After the catalog candidate exists, the publication lists the items that still have no source. Each item gets one recorded decision. It joins the exclusion list of `correct-published-records` with evidence of its kind, or it keeps its page and its coverage row. The 10 records that `correct-published-records` left published get the same review. A missing source alone is not evidence for an exclusion.

## Risks / Trade-offs

- An owner type can read its actions by a rule other than the item rule. → Native analysis of each owner trigger comes before the collector change.
- A dialogue node can require conditions that the publication does not show. → The source row names the NPC and keeps the captured availability rules when the catalog has them.
- One loot table can have several owners. → Each owner keeps its own binding, and the item page lists each owner once.
- New sources change coverage counts and document sizes. → The update report explains each changed count, and the graph checks the size budgets.

## Migration Plan

Apply this change after `publish-crafting-and-gathering` and `correct-published-records` are accepted. Run a targeted scan with the new owners and the dialogue collector. Build a catalog candidate, and compare it with the accepted catalog, including the new loot bindings. Publish a candidate, stage it against the accepted publication, and check the affected pages at 1440 px and 390 px. Write an update report, and accept the catalog and publication together. The former publication stays as the rollback.
