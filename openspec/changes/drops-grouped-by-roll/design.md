## Context

`EconomyUtilities.GenerateDroppedLoot` (0.16.3) rolls, for one kill: each loot list that the creature binds, each with its own roll chance, item limit, and minimum picks; then the five World Loot lists in order, which give at most `maximumItemsPerNPC` (2) items between them; then `ClothDrops.Roll`, which gives Humanoid and Undead creatures 1 to 3 pieces of one cloth on 75% of kills. `MobCombatEntity.EntityDeath` calls it for every kill that `EconomyUtilities.ShouldRewardPlayer` accepts, and World Loot and cloth use `EconomyUtilities.GetLootReferenceLevel`, the creature's own level. The World Loot minimum rank of this build is the lowest rank, so World Loot depends only on the creature level. The publication already computes World Loot odds at one reference level for each item (`worldOdds` in `documents/loot-chances.ts`) and cloth chances at range endpoints (`projectClothDrop` in `documents/items.ts`). 115 of the 138 creature pages with a known level and a fightable role scale with the player, between levels 15 and 30 for most of them.

## Goals / Non-Goals

**Goals:**

- One calculation of World Loot and cloth by creature level, used by creature pages, item pages, and the Loot guide.
- Creature pages that follow the reader's creature level without copying World Loot into every NPC document.

**Non-Goals:**

- A guide link for cloth on creature pages. The rules record places the cloth rule on cloth items only, and this change leaves the rules record unchanged.
- Odds for creature loot lists with level-matched gear. No creature binds one in 0.16.3, so such a list keeps its listed rate.

## Decisions

- **One table per roll, and one World Loot table.** Rows in one table share the roll that the sentence above it states. World Loot is one table because its lists share the item cap and roll in order: a table per World Loot list would show chances that ignore the earlier lists. A creature loot list's row now shows that list's chance per kill. The combined chance of an item in two lists of one creature appeared in both tables, although each list rolls on its own.
- **World Loot and cloth live in the Loot guide document.** Guide documents already carry the data that their topic's calculators use, such as the experience curve in the character progression guide, which the Heroic comparison also loads. A new root resource would need a root schema version, graph edges, and loader methods for the same data. Copying World Loot into NPC documents would repeat about 100 rows for every level of every scaling creature, whose ranges span 16 to 60 levels. Each item document carries only its own World Loot levels, as it already carries its cloth levels.
- **Chances by creature level are runs.** A `LevelChance` holds a chance for a range of creature levels, merging only levels whose chances agree within float noise. Values are computed for each level up to one past the highest level at which a World Loot list's window, an entry's level band, or a cloth weight starts or stops changing; the last run then has no `maxLevel` and continues to every higher level. An item from the general World Loot list has one run, because no later list can take its place. The Loot guide holds exact runs for cloth too, so creature pages show the chance at their level. Cloth items on item pages keep their compact ranges, whose chance moves one way inside each range.
- **Prerendered creature pages show their lowest level.** The detail route computes the World Loot and cloth groups at the creature's lowest level from the Loot guide. In the browser, a creature level that the prerendered groups do not cover loads the Loot guide once through the shared client loader. Each group names the level that its rows are for, so a page never shows rows for a level that it does not name.
- **One rule for fightable NPCs.** `onlyFriendlyRoles` moves to `packages/contracts/src/public`. An NPC page names the rolls that its kills make in `sharedDrops`, for a creature with a known level whose roles are not all friendly services and that is not a roster adventurer: World Loot when its rank is the World Loot rank or higher, and cloth when its creature type drops cloth. The authored combat flag does not decide this, because creatures such as Neonate Vampire have it off yet give kill experience. The page names the versions that make a roll when not every version does. The creature drops rule stays on pages with own drops or shared rolls, and the site shows the groups that `sharedDrops` names.
- **The odds engine names its targets.** `lootItemProbability` takes the set of items to find, so the chance that a kill gives any World Loot is the same calculation as an item's chance, with every World Loot item as a target.
- **Placed rules stay as recorded.** The World Loot section of an item page uses the item's creature drops rule, which covers World Loot, and the creature drops rule of an NPC page covers its World Loot group.

## Risks / Trade-offs

- [The prerendered level differs from the reader's level] → The group names its level, and the browser replaces its rows after one cached load.
- [The Loot guide document grows by about 250 KB] → It stays under the 1 MiB document budget, and the client loader fetches it once per visit.
- [Exact runs could split a chance into many rows] → Only cloth changes at most levels, and its item tables keep their ranges. World Loot items have at most nine levels each.

## Migration Plan

Publish from the accepted catalog, then compare it with the accepted publication. Every World Loot row of `droppedBy` moves to its item's `worldLoot`, creature drop chances change only for items in several lists of one creature, and cloth chances lose their rounding. Restaging the previous publication rolls the site back.
