## ADDED Requirements

### Requirement: Random spawn choices are alternatives

The catalog SHALL model an active `RandomActivator` whose targets contain NPC spawners as a placement rule. The rule SHALL state how many targets the game enables and the weight of each distinct target, counted from repeated entries. The map and pages SHALL present its placements as alternatives, not as simultaneous spawns.

#### Scenario: Three daytime poses
- **WHEN** an activator enables one of three Fenric Doryn spawners
- **THEN** Fenric Doryn's page says he appears at one of three spots by day
- **AND** each of the three map markers says it is one of three alternatives

#### Scenario: Weighted targets
- **WHEN** an activator lists the Zombie spawner twice among six entries
- **THEN** the rule gives that spawner a weight of two in six

### Requirement: NPC levels come from confirmed rules

An NPC level SHALL come from a rule that native code or runtime observation confirms. A spawner that scales with the player SHALL give "scales with the player" and the zone range that `ZoneLevelRules.TryGetZoneRangeFor` returns, which is the spawner's zone range or else its scene's range. A record level of 100 SHALL NOT be shown as a level. When no confirmed rule applies, the NPC SHALL show no level. The map, pages, lists, and name qualifiers SHALL use the same level.

#### Scenario: A zone-scaled spawner
- **WHEN** a spawner has fixed levels 1–2, scales with the player, and has zone range 15–30
- **THEN** its NPC shows "15–30, scales with the player"
- **AND** the map marker shows the same range

#### Scenario: A level rule is not confirmed
- **WHEN** an NPC appears only through a producer whose level rule is not confirmed
- **THEN** its page shows no level

### Requirement: Hostility comes from faction standing

The published hostility of an NPC SHALL come from its faction standing toward the player, as map markers already use. The ability to fight SHALL NOT make an NPC an enemy.

#### Scenario: A friendly quest giver can fight
- **WHEN** Fenric Doryn is friendly and combat is enabled
- **THEN** his page and list row do not show the enemy role

### Requirement: Pages say where and when a character appears

An NPC page SHALL list each place where the character appears with its conditions: time of day, quest progress, and random alternatives. When the character's variants follow quest progress, the page SHALL order them by that progress.

#### Scenario: Story stages
- **WHEN** Thalgrim Wayfinder has five records gated by quest progress
- **THEN** his page lists the five places in quest order with the quests of each stage
