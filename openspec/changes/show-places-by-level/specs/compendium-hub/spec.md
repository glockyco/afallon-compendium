## MODIFIED Requirements

### Requirement: Level entry uses published place facts

The hub SHALL show a place's level range only when the publication records that range. Each place outside the dungeons that has a range SHALL appear as a tile with its artwork, its range, a link to its published page, and its counts of creatures and quests, ordered by range, with places that record no creature and no quest after the others; the first eight tiles SHALL show, with a Show N more control for the rest. A reader MAY enter a character level, saved with the level that the mechanics calculators use; the tiles SHALL follow each keystroke without moving focus, the places whose recorded range contains the level SHALL come first and carry a mark, and an empty field SHALL forget the level. A place without a recorded range SHALL remain reachable through the Places list. The hub SHALL distinguish an authored range from advice about where a character should go.

#### Scenario: Place has a published level range
- **WHEN** a published place has a level range
- **THEN** the hub shows the recorded range beside a link to that place
- **AND** it makes no claim that the place is best for that level

#### Scenario: Place has no level range
- **WHEN** a published place has no level range
- **THEN** its page remains reachable through the Places list
- **AND** the hub does not invent a range for it

#### Scenario: Reader enters a character level
- **WHEN** a reader enters level 25 on the hub
- **THEN** the places whose recorded range contains 25 come first, each marked, and the others follow in range order
- **AND** no place is described as the best place for that level
