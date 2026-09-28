## ADDED Requirements

### Requirement: Progression requirements name what a character learns or pays

A requirement for a passive talent SHALL read "<talent> rank N or higher" when it needs rank N or a higher rank, "<talent> rank N" when it needs exactly rank N, and "<talent> learned" when it needs any rank. A requirement for an ability SHALL read "<ability> learned" or "<ability> rank N" by the same rules. A cost SHALL read "Costs N <stat>". A requirement SHALL name a talent by its name, and SHALL NOT show the record id of a talent.

#### Scenario: Talent rank
- **WHEN** the Aegis Discipline node requires rank 4 or a higher rank of Weighted Strikes
- **THEN** its requirement reads "Weighted Strikes rank 4 or higher"

#### Scenario: Learned ability
- **WHEN** a talent tree node requires that the character knows Cleave
- **THEN** its requirement reads "Cleave learned" with a link to the Cleave page

#### Scenario: Cost
- **WHEN** an ability costs 9 Mana to use
- **THEN** its use requirement reads "Costs 9 Mana"
