## Purpose

Present dungeons, bosses, regions, and properties the way the game's own Adventure Guide presents them, so a reader finds the same information in the same shape.

## ADDED Requirements

### Requirement: The guide mirrors the game's own structure

The compendium SHALL organize world content into dungeons, regions, and properties, matching the game's Adventure Guide. A dungeon SHALL show its artwork, label, description, and level range, then its bosses. A boss SHALL show its portrait, label, and level, with its abilities, its stats, and its loot. A region SHALL show its artwork, label, description, and level range. A property SHALL show its artwork, label, description, and income.

Structure SHALL come from the extracted native records: scene guide metadata and boss references, and region guide metadata and level ranges. The compendium SHALL NOT invent tabs, groupings, or categories that the game does not present.

Content the game excludes from its guide SHALL NOT appear as guide content. It remains available through the atlas and search.

#### Scenario: A reader opens a dungeon
- **WHEN** that scene is included in the game's guide
- **THEN** the page shows its artwork, description, and level range
- **AND** it lists the bosses the scene references, each with its level

#### Scenario: A reader opens a boss
- **WHEN** the boss has abilities, stats, and loot
- **THEN** the page presents those three groups
- **AND** ability phases retain their phase names and requirements

#### Scenario: A scene is not in the game's guide
- **WHEN** the scene has no guide metadata
- **THEN** it does not appear as a dungeon entry
- **AND** its places remain reachable through the atlas and search

### Requirement: Guide loot states only measured chance semantics

Boss loot SHALL list its items with their authored quantity ranges. It SHALL show a drop chance only when the displayed value has been established against the game's own guide for the supported build.

Until that measurement exists, entries SHALL show the item and its quantities without a chance value and without an explanatory disclaimer. The compendium SHALL NOT publish a computed percentage that the game does not show.

#### Scenario: The displayed chance is established
- **WHEN** the guide's displayed value is measured for the supported build
- **THEN** boss loot entries show that chance
- **AND** a test asserts the published value against the measurement

#### Scenario: The displayed chance is not established
- **WHEN** no measurement exists for the supported build
- **THEN** entries show the item and quantity range only
- **AND** no invented percentage and no disclaimer row appear

### Requirement: The guide links to places and items

A boss, a region, a dungeon, and a property SHALL link to their locations on the world map where a location is published. Loot items SHALL link to their item pages and to their other known sources. Following a link SHALL preserve the guide context so a reader can return.

#### Scenario: A reader follows a boss to the map
- **WHEN** the boss has a published location
- **THEN** the atlas opens that location
- **AND** browser back returns to the boss entry

#### Scenario: A boss location is not published
- **WHEN** no published placement exists for that boss
- **THEN** the entry omits the map link
- **AND** the remaining boss information stays available
