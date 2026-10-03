## ADDED Requirements

### Requirement: Range filters match values shown as ranges

A numeric list column whose cell shows a range as text, such as an NPC's level range, SHALL publish the numbers behind it. A minimum or maximum for that column SHALL keep a row whose range overlaps the bounds. A range without an upper end SHALL match any minimum at or above its lowest value. A row without published numbers for the column SHALL NOT match a bound.

#### Scenario: Level range overlaps the bounds
- **WHEN** a reader sets a minimum level of 20 on the NPC list
- **THEN** an NPC of level 15–30 stays in the list and an NPC of level 8 does not

#### Scenario: Level without an upper end
- **WHEN** a reader sets a minimum level of 100 on the NPC list
- **THEN** an NPC whose level reads 40+ stays in the list
