## Why

The live quest pages show wrong data and omit most of the quest data that the catalog already holds. 58 Gold Coin rewards are missing, and two quests show an unrelated item as the reward. NPCs whose quest service is off appear as givers. 37 objectives show "Unknown target". All quest chains, quest texts, and level requirements are empty. World quests, the quest that starts from an object, and the world changes that quests cause are not published at all.

## What Changes

- Quest rewards come from the typed reward facts. Currency rewards appear, and a reward never links an item that the reward does not give.
- NPC quest bindings follow the native `isQuestGiver` flag on quest pages, NPC pages, and lists.
- Quest chains, objective text, and completion text come from the canonical localization record. The minimum level comes from the quest's own level requirement.
- Each quest publishes how it starts: from an NPC, from a world quest zone, or from an interactive object. World quests also publish their zone pool and timing.
- Each objective publishes its task text and the interactive objects that complete it. The NPC and item pages of an objective's target list the quest, which no page did before.
- Requirements publish text spans that link the referenced entities. A quest requirement names the quest state. A numeric requirement names its comparison.
- Quest pages publish the quests that they unlock and the world changes that their states cause.
- The catalog models loot from interactive objects with a `Chest` action as an item source.
- The catalog computes the availability of each world source from its own requirements and from the requirement toggles above it. Item sources from world objects, NPC spawns, quest starts, and world changes use this availability.
- The catalog assigns each placement to its smallest named region. Location labels, name disambiguation, and the quest list use this area.
- Place pages list the quests that start in the place and the quests that have objectives in it.
- The quest list shows the level range, the minimum level, the chain, the start type, the area, the giver, and the experience, with type, area, and chain facets. Lists publish start types as IDs, and the site labels each value of a list cell, so an NPC with several roles shows one badge for each role.
- The game's own quest level range and dungeon come from a runtime probe of `QuestLevelRange`.
- **BREAKING**: the item, NPC, quest, and place document schemas change. `ContainerRow.requirements` becomes `availability`. `PublicQuest.givers`, `previous`, and `next` are replaced by `starts` and an ordered chain. A public requirement carries its type, rule, label, and spans; the raw predicate fields stay in the catalog, and items publish `levelRequirement`. The `world-quest-zone` and `world-quest-zone-candidate` associations are replaced by `world-quest-offer`.

## Capabilities

### New Capabilities
- `quest-reference`: quest pages, the quest list, quest tooltips, and quest relations on NPC, item, and place pages.
- `world-availability`: interactive-object item sources, world source availability, and placement areas in the catalog and on pages.

### Modified Capabilities

## Impact

- Scan: a new `quest-levels` collector in the canonical family writes the quest level range and dungeon. A complete scan of the installed build is necessary before the ranges appear in a publication.
- Catalog: `packages/catalog/src/{evidence,assembly,relations,world,normalize,decoders,database,queries}.ts` and new availability and area modules. New tables for source gates, placement areas, and world quest facts.
- Contracts: `packages/contracts/src/catalog/{facts,query}.ts`, `packages/contracts/src/public/{documents,resources}.ts`, and the `compendium.quest-levels.v1` raw schema. Document schema IDs for items, NPCs, quests, and places increase.
- Publication: `packages/publication/src/{documents,lists,kind-registry,index-resources,references,text}.ts` and the graph placement check in `packages/contracts/src/public/graph.ts`.
- Site: quest, item, NPC, and place fact cards, `QuestTable`, `QuestTooltip`, `ItemTooltip`, `Requirements`, `TooltipRequirements`, `Availability`, `ContainerTable`, `DropTable`, `VendorTable`, `ListTable`, `map-search.ts`, and `format.ts`.
- Operations: a catalog rebuild, a new publication, and a staged site. The coverage review does not change unless the new scan changes the discovered subjects.
