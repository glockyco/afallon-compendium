## ADDED Requirements

### Requirement: The catalog records the adventurer world settings

The catalog SHALL record the adventurer world settings that the game's adventurer rules read: the job region names in order, the shortest and longest job duration, the experience and gold that a job gives, and the most adventurers present in the world. It SHALL record the Dungeon Finder tank settings and, for each roster adventurer, the pet facts of its invite effect. Each value SHALL keep its source field path. A setting that the scan cannot read SHALL stay an explicit issue and SHALL NOT take a default value.

#### Scenario: Job duration bounds
- **WHEN** the scan reads the adventurer world settings asset
- **THEN** the catalog records its shortest and longest job duration with their source paths

#### Scenario: Missing settings asset
- **WHEN** the scan finds no adventurer world settings asset
- **THEN** the catalog records the issue and no job durations
