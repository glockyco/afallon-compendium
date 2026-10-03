## MODIFIED Requirements

### Requirement: Abilities list identifies what an ability does and where it comes from

The Abilities list SHALL show each ability's published icon and name alongside a Source column, one line per row, without descriptions. Source SHALL prefer a learning class and talent tree, otherwise show one or two creature names or a creature count, otherwise show item names. If no learner or user is known, the Source cell SHALL remain empty and the Source filter SHALL not offer a missing-use value. Source and Class SHALL be filters for abilities with a known source. Abilities without a known use SHALL remain published and reachable on their detail pages but SHALL be hidden in default list results; the Availability filter SHALL reveal them with their count visible. The list SHALL fit a 390 px viewport without horizontal page scrolling.

#### Scenario: Learned ability
- **WHEN** a reader opens the Abilities list and finds Ambush
- **THEN** its row shows Assassin · Shadowcraft

#### Scenario: Creature and item abilities
- **WHEN** a reader finds Basic Strike and Brown Horse Mount
- **THEN** Basic Strike reports the number of creature users rather than a long name list, and Brown Horse Mount names its item source
- **AND** the Healing Potion ability page links the items that cast it under Used by items

#### Scenario: Unattributed abilities
- **WHEN** a reader opens the list without filters
- **THEN** the count excludes abilities nobody uses and offers a counted action to reveal them
- **AND** selecting "Nobody Uses It" in Availability reveals those abilities without removing their detail pages
- **AND** the Source cell is empty and the Source filter contains no "Nobody Uses It" option

#### Scenario: Filter by class
- **WHEN** a reader selects Assassin in Class
- **THEN** only abilities learned by Assassin remain, and resetting the filter restores the default list
