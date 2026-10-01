## Purpose

World availability records when a world source exists or can be used, where it is, and what it yields, so that pages can say which objects give an item, which spawns depend on a condition, and in which named area a placement stands.

## ADDED Requirements

### Requirement: Interactive objects that open loot are item sources

The catalog SHALL model each interactive object action of type `Chest` that names an available loot table as an item source of kind `interaction`, with the object name, the loot table quantities and authored rate, the object's placement, and the object's availability. An item page SHALL list these sources separately from containers, and the search corpus SHALL report the `interaction` source kind.

#### Scenario: An item comes only from an interactive object
- **WHEN** the only authored source of Funnel weaver egg is an interactive object whose `Chest` action names a loot table that contains it
- **THEN** the item page lists the object with its place, quantity, availability, and placement count
- **AND** the catalog does not report an unmodeled item source for that item

### Requirement: World source availability combines own and inherited requirements

The catalog SHALL compute the availability of each world source as a set of rules. The source's own spawn, interaction, activation, or deactivation requirements SHALL contribute rules. Each requirement toggle whose target is the source's game object or an ancestor of it in the same observed scene SHALL contribute a rule. An activation toggle SHALL contribute a `requires` rule, a deactivation toggle SHALL contribute an `excludes` rule, and a timed toggle SHALL contribute a `temporary` rule with its duration. A page SHALL render `requires` rules as requirements, `excludes` rules as "Not while" requirements, and `temporary` rules with their duration.

#### Scenario: A chest reward depends on the class
- **WHEN** an activation toggle with a class requirement targets the ancestor of a chest
- **THEN** the chest's item rows show the class as a requirement

#### Scenario: A spawner stops after a quest
- **WHEN** a deactivation toggle with a turned-in quest requirement targets a spawner
- **THEN** the creature's page lists those spawner placements with the rule "Not while <quest> turned in"

### Requirement: NPC pages show conditional spawns

An NPC page SHALL group the placements of its conditional spawners by availability and show each group's rules and placements.

#### Scenario: A creature appears only during a quest
- **WHEN** a spawner of a creature requires that a quest is in progress
- **THEN** the creature's page lists that spawner's placements under the rule "<quest> in progress"

### Requirement: Placements carry their named area

The catalog SHALL assign each placement to the smallest named region that contains its map position in the same map space. A location label SHALL use the area name when one exists and the place name otherwise. Name disambiguation SHALL prefer area names to place names.

#### Scenario: Two NPCs share a name in one scene
- **WHEN** two NPC records named Thalgrim Wayfinder stand in different named regions of the world surface
- **THEN** their published names differ by the region names instead of by native IDs
