## Purpose

Show the game's overworld zones as distinct places so readers can compare their authored facts and find content in the correct part of Afallon.

## ADDED Requirements

### Requirement: Overworld zones follow captured region types

The publication SHALL use captured region types to identify major zones. It SHALL publish every reachable region template as a distinct place. A minor subregion with a captured parent SHALL belong to that major zone. A region without a resolved parent or mapped instance SHALL remain reachable with a clear missing-location label. The publication SHALL NOT infer a region's type or owner from its name or size.

#### Scenario: Major zone and owned area
- **WHEN** a captured major region owns a captured minor subregion
- **THEN** both regions have distinct place references
- **AND** the minor subregion appears in the owner's areas

#### Scenario: Region lacks a mapped instance
- **WHEN** a captured region template has no mapped instance
- **THEN** the region remains reachable without a map action
- **AND** its page explains that no mapped area is published

### Requirement: Each overworld placement has a game-selected zone

A mapped overworld placement SHALL belong to the smallest containing major region when major regions overlap. The publication SHALL follow the game's verified order for ties. A containing minor subregion SHALL provide a more specific area label without replacing its selected major zone. A placement without a containing major region SHALL keep its map location and an explicit unknown-zone label. The publication SHALL NOT assign that placement to a zone by name or proximity.

#### Scenario: A small major region overlaps a large one
- **WHEN** a placement lies inside two major regions of different sizes
- **THEN** its selected zone is the smaller major region
- **AND** its content appears in that zone only

#### Scenario: A minor subregion lies inside a major zone
- **WHEN** a placement lies inside a major region and one of its active minor subregions
- **THEN** the major region owns the placement's zone content
- **AND** the minor subregion remains available as its specific area

#### Scenario: No major region contains a placement
- **WHEN** a mapped overworld placement has no containing major region
- **THEN** the placement remains available on the map with an unknown-zone label
- **AND** it does not appear under an unrelated zone

### Requirement: Overworld area links open the correct zone

An NPC or quest location in Afallon SHALL link to its selected major zone tab on the Afallon place page. Its specific area and map location SHALL remain available. Links SHALL select the zone through the shared `tab` query parameter. A direct zone link SHALL restore the same selection after reload.

#### Scenario: NPC in an owned subregion
- **WHEN** an NPC stands in a minor subregion of a selected major zone
- **THEN** its area link opens the major zone tab
- **AND** its specific subregion name and map location remain accessible

#### Scenario: Quest at several zones
- **WHEN** a quest has start or objective locations in two major zones
- **THEN** each location links to its own major zone tab
- **AND** the quest does not collapse the locations into one unlinked name
