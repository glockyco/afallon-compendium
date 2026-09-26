## Context

See proposal.md for the defects. The pipeline is scan → catalog → publication → site. The catalog already holds the data for most fixes:

- `quest_rewards` has typed reward targets. `queryQuestRows` reads `quest_associations` instead, and the database takes the association's item endpoint from the raw `itemID` whatever the reward type is.
- `entity_details` holds `localization.questChainName`, `objectiveText`, and `completedDescription`. `normalize.ts` reads these fields from `gameplay`, where the collector does not write them.
- `source_details` holds interactive object actions (`Quest`, `CompleteTask`, `Chest`), world quest zone pools, and requirement toggles with their target hierarchy paths. `world.ts` uses only teleport actions.
- The `regions` table has named boxes in map coordinates. Nothing assigns placements to regions.

Native evidence (recovered declarations, current build):

- `RPGWorldQuest.quest`: "The underlying RPGQuest granted to the player when they enter an active zone." The timing fields have tooltips for active duration, both cooldowns, jitter, and the initial roll.
- `WorldQuestZone.worldQuest` is "Used only if Possible Quests is empty". In the current build every zone has a non-empty pool that contains its fixed quest.
- `questState`: `onGoing=0, completed=1, abandonned=2, failed=3, turnedIn=4, Tracked=5, TrackedOngoing=6, TrackedCompleted=7`.
- `InteractableObjectActionType` includes `Quest=1`, `CompleteTask=6`, and `Chest=11`. `QuestMapIndicatorSettings` describes "Quest interactables (InteractableObject with a CompleteTask action)".
- `ActiveRequirement`, `DisableRequirement`, and `TimedActiveRequirement` each have a `TargetObject` and an activation requirement. The timed variant keeps the target active for `ActivationDurationSeconds`. Authored names such as "Npc disable after turn in" agree with this polarity.
- `QuestLevelRange` has static `TryGetRange(RPGQuest, out int, out int)` and `GetDungeonScene(RPGQuest)` without a player parameter. Bodies are not recovered.

## Goals / Non-Goals

**Goals:**
- One typed source for each published quest fact, with no second derivation in publication.
- One availability model for every world source, used by item sources, spawns, quest starts, and world changes.
- Correct presentation of every published requirement, including links, quest states, and comparisons.

**Non-Goals:**
- Evaluating requirements for a character. Pages show authored rules.
- Map icons as locations. Quest map icons are runtime markers and are not published placements.
- Changing the coverage review. New blocker kinds remain coverage issues in preview mode.

## Decisions

### 1. Rewards come from `quest_rewards`

`queryQuestRows` builds reward, reward-choice, and item-given rows from `quest_rewards`, with the typed target and the reward type. Association rows of kinds `quest-reward` and `quest-item-given` stay as evidence. `relations.ts` sets their item endpoint only for item rewards and indexes an item source only for an item reward. Alternative: add a currency column to `quest_associations`. Rejected because the typed table already resolves every reward target.

### 2. Quest bindings follow `isQuestGiver`

`queryQuestRows` joins `npc_facts` and drops NPC bindings whose NPC has `is_quest_giver = 0`, as the vendor query does with `is_merchant`. `relations.ts` records `inactive-quest-binding` for each dropped binding, as it records `inactive-merchant-binding`.

### 3. Quest text and chain come from localization

A quest localization decoder reads `questChainName`, `objectiveText`, and `completedDescription` from the canonical `localization` record. The quest gameplay decoder no longer declares them. Chain names are trimmed before grouping. The chain is the authored grouping and order. Prerequisites stay in requirements, and "unlocks" is their reverse, because 8 adjacent chain steps have no requirement on the previous step and 2 requirements cross chains.

### 4. Minimum level comes from mandatory level requirements

A pure function reads the quest's inline requirement groups. It returns the largest threshold of every mandatory `Level` requirement in an all-mode group: `EqualOrAbove n` gives `n`, and `Above n` gives `n + 1`. Other comparisons give no minimum. The requirement still renders.

### 5. Starts, offers, and completions are associations

`world.ts` emits these associations:

- `world-quest-offer`: one per zone and effective quest. The effective quests are the pool when it is not empty, and otherwise the fixed quest. The payload keeps the world quest timing, the zone delay, and the pool.
- `interaction-quest`: one per interactive object `Quest` action.
- `interaction-task`: one per interactive object `CompleteTask` action.

These replace `world-quest-zone` and `world-quest-zone-candidate`. World quest timing is a typed fact in `world_quest_facts` because it belongs to the `RPGWorldQuest`, not to a zone.

### 6. Interaction loot is an item source

Each interactive object `Chest` action with a loot table expands through the same table-output path as containers, with source kind `interaction` and the object name. No interactive object with a `Chest` action shares a placement with a chest container in the current build, so the two kinds do not duplicate a source.

### 7. Availability is computed per observed scene

A new catalog module computes `source_gates` for each observation context. A source's own conditions contribute rules: spawner requirements, interaction requirement templates, and enhanced interaction activation and deactivation requirements. For each requirement toggle, every world source whose hierarchy path equals the target path, or starts with the target path and `/`, receives a rule from the toggle's conditions. `ActiveRequirement` gives `requires`, `DisableRequirement` gives `excludes`, and `TimedActiveRequirement` gives `temporary` with its duration. Nested toggles compose because each ancestor contributes its own rule. Gates are keyed by source ID, so repeated observations merge.

Item source rows from world objects publish `availability` instead of `requirements`. Existing source and loot table conditions become `requires` rules. Drop and vendor rows keep `requirements`, because toggles do not apply to them.

### 8. Requirements carry spans

`requirementLabel` becomes a span builder. A span is either text or a catalog endpoint. The label is the joined text. Quest requirements read "<quest> <state>", with states "in progress", "completed", "abandoned", "failed", "turned in", "tracked", "in progress and tracked", and "completed and tracked". Numeric requirements read "<subject> <amount>" followed by the comparison, for example "Level 16 or higher". Publication resolves endpoint spans to refs, and the site renders refs with `EntityLink`.

### 9. Areas are derived in the catalog

`placement_areas` stores, for each placement with a map position, the smallest named region box that contains the position in the same map space. Box containment uses the four map corners as a convex polygon. Area size is the polygon area. Ties sort by name. Publication uses the area as the `PlacementRef` label and as the first disambiguation suffix for NPC names.

### 10. Public documents

- `PublicQuest`: `starts` (npc, worldZone, or object rows), `turnIns`, objectives with `text` and `completions`, typed rewards, `chainQuests` in order, `unlocks`, `worldChanges`, and `facts.worldQuest`. `givers`, `previous`, and `next` are removed.
- `PublicItem`: `collectedFrom`. Container rows publish `availability`.
- `PublicNpc`: `spawnConditions`.
- `PublicPlace`: `quests` starting in the place and `questObjectives`.
- `RequirementRef`: `spans`.
- Document schema IDs for items, NPCs, quests, and places increase to v3. The graph check validates every `PlacementRef` in a document, not only `locations`.

A row keeps a `PlacementRef` list only when its subject has no page (world zones, objects, and gated spawners). An NPC start links the NPC and the atlas entity view instead.

### 11. Quest level range from the runtime

The canonical collector calls `QuestLevelRange.TryGetRange` and `GetDungeonScene` for each quest and writes the result to quest gameplay. A new scan of the canonical target adds it. The catalog decodes it into `quest_facts`, and publication adds `facts.levelRange` and `dungeon`. This decision needs Steam and the game. The rest of the change does not depend on it.

## Risks / Trade-offs

- [Polarity of `DisableRequirement` has no recovered body] → Use `excludes`, which the component name and the authored object names support, and phrase the rule as "Not while", which is correct whether or not the game restores the target later.
- [The effective pool rule has no runtime proof] → It follows the authored tooltip. In the current build the fixed quest is always in the pool, so both readings give the same offers.
- [`Tracked*` states have no recovered semantics] → Publish them as "tracked" states without further interpretation.
- [Area names from large regions, such as Coalway woods, are coarse] → The smallest containing region wins, so a named camp inside the woods takes precedence.
- [A new canonical scan changes admitted evidence] → Add the new scan manifest alongside the existing manifests. Do not replace the manifests that the coverage review cites.

## Migration Plan

1. Implement the catalog, publication, and site changes with the tests that defend them.
2. Rebuild the catalog from the current plan, publish, stage against the current publication as baseline, and verify pages in a browser.
3. Add the runtime level range with a new canonical scan when the game is available, then rebuild and publish again.

Rollback uses the previous publication root with `verify:deployment`.
