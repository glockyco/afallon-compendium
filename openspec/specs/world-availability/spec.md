# world-availability Specification

## Purpose

Describe how placed world sources yield items, inherit conditions from the surrounding world, and receive named map areas.

## Requirements

### Requirement: Interactive objects that open loot are item sources

The catalog SHALL model placed interactive objects whose Chest actions name available loot tables as interaction item sources. Each source SHALL retain the object's name, loot-table quantities and authored rate, placements, and availability. Item pages SHALL distinguish these sources from containers, and search SHALL include interaction among the item's source kinds.

#### Scenario: Item comes from an interactive object
- **WHEN** an item's only authored source is an interactive object's Chest action with an available loot table
- **THEN** the item page lists the named object with its place, quantity, availability, and placement count
- **AND** its searchable source kinds include interaction

### Requirement: World source availability combines own and inherited conditions

The catalog SHALL publish nonempty requirements of a world source's selected spawn or interaction condition as availability rules. It SHALL also apply each condition toggle targeting that source or an ancestor of it in the same observed scene. Activation SHALL require its condition, deactivation SHALL exclude while its condition holds, and timed activation SHALL identify its active duration. Pages SHALL render the resulting requirements and duration without presenting excluded conditions as prerequisites.

#### Scenario: A chest depends on a class
- **WHEN** an activation toggle with a class requirement targets an ancestor of a chest
- **THEN** the chest's item-source row shows that class as required

#### Scenario: A spawner stops after a quest
- **WHEN** a deactivation toggle with a quest turn-in condition targets a spawner
- **THEN** its creature location shows that it is unavailable while the quest is turned in

### Requirement: Placements carry their named area

The catalog SHALL assign a mapped placement the smallest containing named region in the same map space, when one exists. A published placement's location label SHALL prefer that area to its place, and NPC name disambiguation SHALL use area names when place names cannot distinguish records.

#### Scenario: Same-name NPCs occupy different areas
- **WHEN** two NPC records with the same name stand in distinct named regions of one map space
- **THEN** their published names use their area names to distinguish them when those names suffice
