## ADDED Requirements

### Requirement: Item pages explain rewards from use actions

An item page SHALL show a When used section when captured item actions spawn prefab chests or open loot tables. Each chest SHALL show its effect and contents, including item or currency, inclusive count range, row chance, and positive maximum-drop cap. The page SHALL distinguish an Item action that gains an item from one that removes it. Chest rows SHALL be described as independently checked against their drop chance, then capped and rolled uniformly for quantity.

#### Scenario: A soaked bag spawns a chest
- **WHEN** an item has a TriggerVisualEffect action whose effect template contains a chest prefab
- **THEN** its When used section lists every chest row including currency rows and the maximum-drop cap
- **AND** its own Item action is described by the captured AlterAction, not inferred from its item ID

### Requirement: Supply packs show eligible rewards and roll rules

For each class and level band gated LootTable action of Adventurer's Supply Pack, When used SHALL list that table's authored entries. It SHALL explain that the pack gives at least one distinct pick, offers a bonus pick at the published chance, and chooses the world pool at the published share when both pools exist. It SHALL describe world candidates as eligible world-loot rows matching the table's armor and stat filters and the player's class, normally within four levels below to two above the player. It SHALL NOT enumerate a world pool at a fixed player level. It SHALL state that the source is consumed only after all loot is taken.

#### Scenario: A supply pack belongs to different classes
- **WHEN** class and level requirements select distinct tables
- **THEN** the page lists each class/level band with only the entries of its selected table
- **AND** it does not suggest the pack grants all 25 tables at once
