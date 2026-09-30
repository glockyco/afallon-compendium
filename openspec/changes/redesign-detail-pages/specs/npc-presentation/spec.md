## MODIFIED Requirements

### Requirement: Creature locations show conditions and story order

A creature page SHALL preview its locations grouped by published place with distinct spot counts, sorted by count for the lookup reader. The full expandable location information SHALL preserve each placement's availability, level, quest links, role, and random alternative when known, with each spot selectable on the map. Where conditions differ, rows SHALL not merge their conditions away. Within a place, placement details SHALL sort by the earliest chain order of their availability quests, then label and placement ID. A missing place SHALL remain visible as an unknown or unplaced location, not be counted under another place.

#### Scenario: Many creature spots
- **WHEN** a creature has many spots across several places
- **THEN** Where to find previews place names with deduplicated counts, rather than numbered links for every spot
- **AND** expanding a place reveals its actual conditions and map-linked spots

#### Scenario: Quest-gated placement
- **WHEN** two placements in a place have different quest availability
- **THEN** their details remain distinct, with quest links in story order

#### Scenario: A quest moves a character
- **WHEN** a character's places have availability quests at different chain steps
- **THEN** the earlier step appears first within the expanded placement details of its place

### Requirement: Quest people appear once per page

A quest document SHALL carry one NPC start entry and one turn-in entry per character page, with sorted area labels of participating records. `turnIns` SHALL retain entries of shape `{ npc, areas }`. Several variants SHALL reference their shared character page. The quest answer SHALL show each character once, naming whether they start, complete, or both start and complete the quest, with available area and map links. It SHALL not add a separate Start and turn-in section that repeats these people.

#### Scenario: Multiple records give a quest
- **WHEN** three Fenric Doryn records give one quest in two areas
- **THEN** the quest answer shows Fenric Doryn once with both areas

#### Scenario: Multiple records receive a quest
- **WHEN** two variants of one character receive a quest
- **THEN** the quest answer shows one character-page reference with both area labels

#### Scenario: The giver also completes the quest
- **WHEN** one character gives and completes a quest
- **THEN** the quest answer shows one entry for that character naming both roles
