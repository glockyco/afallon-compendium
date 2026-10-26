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

The catalog SHALL publish nonempty requirements of a world source's selected spawn or interaction condition as availability rules.

#### Scenario: A chest depends on a class
- **WHEN** an activation toggle with a class requirement targets an ancestor of a chest
- **THEN** the chest's item-source row shows that class as required

#### Scenario: A spawner stops after a quest
- **WHEN** a deactivation toggle with a quest turn-in condition targets a spawner
- **THEN** its creature location shows that it is unavailable while the quest is turned in

#### Scenario: World source availability combines own and inherited conditions
- **WHEN** A world source's selected interaction condition has a nonempty requirement.
- **THEN** The catalog publishes that requirement as an availability rule.

### Requirement: World sources inherit same-scene condition toggles

The catalog SHALL also apply each condition toggle targeting that source or an ancestor of it in the same observed scene.

#### Scenario: World sources inherit same-scene condition toggles
- **WHEN** One condition toggle targets a world source and another targets its ancestor in the same observed scene.
- **THEN** The catalog applies both toggles to the world source.

### Requirement: Activation requires its condition

Activation SHALL require its condition.

#### Scenario: Activation requires its condition
- **WHEN** An activation toggle targets a world source.
- **THEN** Availability requires the activation condition.

### Requirement: Deactivation excludes while its condition holds

Deactivation SHALL exclude while its condition holds.

#### Scenario: Deactivation excludes while its condition holds
- **WHEN** A deactivation toggle's condition holds for a world source.
- **THEN** The world source is excluded while that condition holds.

### Requirement: Timed activation identifies active duration

Timed activation SHALL identify its active duration.

#### Scenario: Timed activation identifies active duration
- **WHEN** A world source has a timed activation.
- **THEN** The timed activation identifies its active duration.

### Requirement: Availability pages distinguish requirements from exclusions

Pages SHALL render the resulting requirements and duration without presenting excluded conditions as prerequisites.

#### Scenario: Availability pages distinguish requirements from exclusions
- **WHEN** A world source has resulting requirements, an active duration, and an excluded condition.
- **THEN** Its page renders the requirements and duration without presenting the excluded condition as a prerequisite.
### Requirement: Placements carry their named area

The catalog SHALL assign a mapped placement the smallest containing named region in the same map space, when one exists. A published placement's location label SHALL prefer that area to its place, and NPC name disambiguation SHALL use area names when place names cannot distinguish records.

#### Scenario: Same-name NPCs occupy different areas
- **WHEN** two NPC records with the same name stand in distinct named regions of one map space
- **THEN** their published names use their area names to distinguish them when those names suffice
