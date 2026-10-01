## ADDED Requirements

### Requirement: Character Progression publishes selectable kill sources

The Character Progression document SHALL include each published creature whose kill roll can give experience, with both known level-difference modifiers and at least one published spawn level. The kill roll runs from the authored minimum experience through the authored maximum minus one, or is the minimum when both are equal. It SHALL list such a creature under each published place where it spawns, with the levels at which it spawns there: a fixed range, or a zone range in which its level follows the character's level. These SHALL be the levels that the creature's NPC page shows for that place. Each entry SHALL retain the published creature reference, its levels at that place, the lowest and highest roll, and its own lower- and higher-level percentage modifiers. These rolls SHALL equal the experience that the creature's NPC page shows. A creature without a published spawn SHALL NOT be offered. The document SHALL provide a default creature from its entries: the first by name with a fixed spawn level, level modifiers that are not both zero, and more than one possible roll; otherwise the first by name with level modifiers; otherwise the first by name. It SHALL expose the published Heroic kill multiplier when available, without substituting a hard-coded value.

#### Scenario: Choosing a creature at a place
- **WHEN** a creature spawns at levels 5 to 6 in one place and near the character's level within 15 to 30 in another place
- **THEN** it appears under both places, each with its levels there
- **AND** selecting either entry uses that creature's own experience bounds and level modifiers

#### Scenario: Ineligible creature
- **WHEN** a creature's authored experience bounds or level modifiers are missing, it has no published spawn, or its page is not published
- **THEN** it is not offered as a calculator input

### Requirement: Character Progression calculates evidence-bounded kill experience

The page SHALL provide keyboard-accessible controls for character level, creature, creature level, Heroic status when the multiplier is available, living followers from zero through ten, and a nonnegative Experience Bonus percentage. The creature level SHALL offer each level at which the creature spawns at the selected place, through the level cap when the zone range has no maximum. It SHALL default to the character level, limited to those levels, whenever the reader selects another creature or character level. The selected character level SHALL remain synchronized with the level curve, and selecting a creature SHALL NOT change it. The page SHALL calculate the lowest and highest *possible modeled* experience for one kill, applying these stages in game order for each possible integer base roll: authored minimum through maximum minus one, or the minimum when the bounds are equal; an explicitly unmodeled game-modifier stage; the selected creature's higher-level percentage if the selected creature level is above the character level, its lower-level percentage if below, or no level adjustment if equal; Heroic multiplication and nearest-integer rounding with halfway ties to even, when selected; division by one plus the number of living followers with the integer result rounded down for nonnegative experience; then the positive Experience Bonus percentage. The level adjustment SHALL truncate each percentage contribution toward zero before addition, rather than rounding the adjusted total. The bonus-stage estimate SHALL remain unrounded: the game applies a world multiplier afterward and can convert the final award to an integer. It SHALL not present the model as the exact in-game award when game modifiers or world modifiers are unaccounted for.

#### Scenario: Creature level follows the character
- **WHEN** the character level is 12 and the selected creature spawns near the character's level within 15 to 30
- **THEN** the creature level is 15, and the creature is above the character
- **AND** after the reader selects creature level 12, the creature is at the character's level

#### Scenario: Higher and equal levels
- **WHEN** an authored roll is 9, the creature is above the player and has a +25% higher-level modifier, with no Heroic status, followers, or Experience Bonus
- **THEN** the level-adjusted modeled result is 11, because the +2.25 contribution truncates to +2 before addition
- **AND** selecting an equal player level leaves the same roll at 9

#### Scenario: Lower level with negative contribution
- **WHEN** an authored roll is 11, the creature is below the player and has a −30% lower-level modifier
- **THEN** the level-adjusted modeled result is 8, because the −3.3 contribution truncates toward zero to −3

#### Scenario: Heroic and followers
- **WHEN** a level-adjusted roll produces a Heroic-multiplied value halfway between two integers
- **THEN** the Heroic stage rounds to the even integer before splitting the award
- **AND** the player receives the integer quotient of that stage divided by one plus the selected number of living followers; companions do not receive a share of that award

#### Scenario: Experience Bonus is not prematurely rounded
- **WHEN** a split result of 5 is modeled with a +15% Experience Bonus
- **THEN** the displayed modeled amount is 5.75, not 5 or 6
- **AND** the page explains that world modifiers and some game modifiers are not included and that the game may convert the eventual award to an integer

### Requirement: Character Progression relates kills to the level curve

For the selected player level, the page SHALL show the template's experience needed to advance from zero current experience at that level and the range of whole kills needed using the calculator's modeled minimum and maximum, with the shortest count based on the maximum and longest on the minimum. These counts SHALL round the quotient upward. An estimated kill amount of zero SHALL NOT produce a finite kill count. At the level cap, the page SHALL show no next-level requirement or misleading finite kill count. The creature picker SHALL lead the calculator, with the selected creature's page link, levels, base roll, and both level modifiers beneath it. The settings and the result SHALL sit side by side on wide screens and stack on narrow screens. One box SHALL hold the experience per kill, the kills to the next level with the experience that this level needs, the stages that produced the range, and the caveat about world and game modifiers. The level curve, the quest and skill guidance, and the talent progression SHALL remain available.

#### Scenario: Kill count range
- **WHEN** the next level needs 20 experience and the modeled possible award is 6 to 9
- **THEN** the page shows 3 to 4 modeled kills, using ceiling of 20 ÷ 9 and 20 ÷ 6 respectively

#### Scenario: Zero award or level cap
- **WHEN** the model's minimum award is zero, or the player selects the level cap
- **THEN** the page does not show a finite upper kill count for a zero minimum or a next-level kill count at the cap

#### Scenario: Calculator layout
- **WHEN** a reader opens the Character Progression page at 390 px
- **THEN** every calculator control, result, and linked creature fact remains readable without horizontal page overflow
- **AND** the curve and progression guidance remain accessible

#### Scenario: Wide calculator
- **WHEN** a reader opens the Character Progression page at 1440 px
- **THEN** the settings and the result box sit side by side below the creature picker and its facts
- **AND** the result box contains the stages and the caveat
