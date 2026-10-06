## ADDED Requirements

### Requirement: Creature drop chances follow the item's own loot lists

A creature drop's Chance per Kill SHALL depend only on the creature's loot lists that contain the item. An item that shares a loot list with a quest item SHALL show its Chance per Kill when the chance is the same whether or not a quest needs the quest item, and SHALL otherwise keep its Listed Rate with the reason. A quest item's Chance per Kill SHALL apply while one of the reader's quests needs the item, and every view of that value SHALL say so.

#### Scenario: Gear beside a quest item's loot list
- **WHEN** Fangbloom drops gear from one loot list, Heart of Corruption from a second and Fangbloom's Venom Sac from a third
- **THEN** its gear and Heart of Corruption show Chance per Kill instead of Listed Rate

#### Scenario: Quest item
- **WHEN** a reader opens Fangbloom's Venom Sac
- **THEN** its Fangbloom source shows a 100% chance per kill while one of the reader's quests needs the item

#### Scenario: Item sharing a loot list with a quest item
- **WHEN** Bear Hide shares a loot list without an item limit or a minimum with the quest item Unmarred Bear Hide
- **THEN** Bear Hide shows its Chance per Kill, because the quest state cannot change it

#### Scenario: Quest state changes a chance
- **WHEN** a quest item rolls before another item in a loot list whose item limit it can fill
- **THEN** the later item keeps its Listed Rate and names the quest state as the reason
