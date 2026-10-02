## MODIFIED Requirements

### Requirement: Ability pages compare versions

An ability page SHALL show the game tooltip once in the side column, choosing the version with most users and the first in a tie. Its answer SHALL identify who learns it (published classes and talent nodes) and who uses it, with costs and activation requirements retained in the tooltip. When multiple versions exist, a Versions section SHALL compare them side by side in the layout of creature versions: one column per version and one row per fact. The rows SHALL be the version's text, the effects it applies when any version applies effects, its use requirements and its learning classes when the versions differ in them, and its users when any version has users. A version without a value in a row SHALL read None. Each version's users SHALL show their first eight links and a Show N more control, and the answer's Show all link SHALL open every version's users. Teaching items and all usable rank links SHALL remain available without repeating the tooltip.

#### Scenario: Ability with five versions
- **WHEN** an ability has five versions
- **THEN** Versions compares five and Used by groups users under the correct version

#### Scenario: Ability from a talent tree
- **WHEN** a reader opens Maul
- **THEN** the answer links Druid's Primal Feral tier 2 talent and its tooltip identifies the Ursine Aspect condition

#### Scenario: Ability of a class that no race offers
- **WHEN** only an unpublished Hunter class learns Barbed Quarrel
- **THEN** Learned by has no Hunter page link and the tooltip still shows Costs 9 Mana

#### Scenario: Nine versions on a wide screen
- **WHEN** a reader opens Weapon Strike, whose nine versions have no users
- **THEN** Versions shows three blocks of three versions
- **AND** no Used by row appears

#### Scenario: Versions learned by different classes
- **WHEN** only the second of four Frostbolt versions is learned by the Wizard
- **THEN** the Learned by row links Wizard under Version 2 and reads None under the others
