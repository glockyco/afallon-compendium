# quest-reference Specification

## Purpose

Describe the authored quest rewards, starts, objectives, progression, and world consequences linked across the compendium.

## Requirements

### Requirement: Quest rewards follow the authored reward type

A quest SHALL list fixed rewards and reward choices using the entity named by each authored reward type: an item, currency, or faction. It SHALL show authored experience separately. An item SHALL list a quest as its reward source only when that quest rewards that item.

#### Scenario: Currency reward has an unrelated item ID
- **WHEN** a quest rewards Gold Coin but the reward record also has a stale item ID
- **THEN** the quest links the currency, not the stale item
- **AND** the stale item's page does not list the quest as a reward source

### Requirement: Quest bindings respect the NPC quest service

Quest and NPC pages, quest lists, and place pages SHALL use NPC giver and turn-in bindings only for NPCs with the quest service enabled. The catalog SHALL retain an inactive authored binding as evidence and flag it as a coverage issue.

#### Scenario: A disabled NPC retains a quest binding
- **WHEN** an NPC with the quest service disabled has an authored quest giver or turn-in binding
- **THEN** neither quest nor NPC pages display that binding as an active quest service
- **AND** the catalog records an inactive quest binding issue

### Requirement: Quests expose their authored starts

A quest SHALL link its NPC starters with their area names and map view, world quest zone starts with their map placements and availability, and interactive-object starts with their names and placements. A world quest zone SHALL identify the other quests in its pool and its delay before the next quest pick when recorded.

#### Scenario: A quest starts in a gated world quest zone
- **WHEN** a world quest zone offers a quest and requires night
- **THEN** the quest page explains that entering an active zone starts the quest and links its placements
- **AND** it shows the zone's night availability and other quests offered there

#### Scenario: An interactive object starts a quest
- **WHEN** an object's Quest action offers the quest
- **THEN** the quest page names the object and links its published placements

### Requirement: Objectives identify tasks and completion objects

A quest objective SHALL show its task text and its authored target and count when available. An interactive object that completes the task SHALL appear by name with its map placements and availability. Target NPC and item pages SHALL link the quest and its objective.

#### Scenario: A targetless task is completed by objects
- **WHEN** a task has no target and its completion objects have published placements
- **THEN** the objective shows its task text and links the completion placements without inventing a target

#### Scenario: A creature is a quest target
- **WHEN** a quest task asks for a counted creature target
- **THEN** the creature page lists the quest with the objective text and count

### Requirement: Authored quest progression is published

A quest SHALL retain its authored objective and completion text, chain name and ordered chain members, minimum level derived from mandatory level requirements, and links to quests whose requirements name it. Its chain membership SHALL not imply a prerequisite that the game did not author.

#### Scenario: Quest belongs to a chain
- **WHEN** a quest has an authored chain name and order
- **THEN** its page links the chain quests in order and identifies the current step

#### Scenario: A mandatory minimum level applies
- **WHEN** a mandatory requirement sets a minimum level
- **THEN** the quest page identifies that minimum level while retaining the requirement itself

### Requirement: Quest-linked world sources are visible

A quest SHALL list placed world sources whose availability references it, including creature spawners, interactive objects, containers, resources, crafting stations, and world quest zones. Each world change SHALL identify its source, show its availability, and link its published placements.

#### Scenario: A quest turn-in disables a spawn
- **WHEN** a spawner is excluded by a turned-in quest requirement
- **THEN** the quest's world changes show the creature, its exclusion rule, and its map placements

### Requirement: Places expose their quests

A place SHALL link quests that start there and quests with objectives there, using the published placements and objective targets in that place.

#### Scenario: Dungeon contains quest targets
- **WHEN** quest targets have placements in a dungeon
- **THEN** the dungeon's quest rows identify the quests as objectives there

### Requirement: Quest lists support choosing by start and area

The quest list SHALL show available quest level range, chain, start area, and giver, and SHALL offer start type, area, chain, and repeatability filters. Its area filter SHALL use the areas of the quest's published starts.

#### Scenario: Reader filters world quests by area
- **WHEN** a reader selects the world-zone start type and an area
- **THEN** only quests with a world-zone start in that area match both filters

### Requirement: Runtime quest level and dungeon facts are published

The catalog SHALL retain the game's computed quest level range and dungeon when quest-level evidence supplies them. Quest pages SHALL show available level ranges and dungeon context; quest lists and search SHALL use the computed range as the quest level when available. Without quest-level evidence, the publication SHALL not invent a computed range or dungeon.

#### Scenario: Runtime evidence supplies a quest range
- **WHEN** a quest has a computed level range in admitted quest-level evidence
- **THEN** its page and list show the range and search uses it as the quest level

#### Scenario: Runtime evidence supplies a dungeon
- **WHEN** quest-level evidence names a dungeon scene
- **THEN** the quest page links the dungeon
