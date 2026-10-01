## ADDED Requirements

### Requirement: Character Progression publishes selectable kill sources

The Character Progression document SHALL include fixed-level, published creatures with nonnegative authored minimum experience, positive authored maximum experience not less than the minimum, a known creature level, and both known level-difference modifiers. Each entry SHALL retain the published creature reference, creature level, authored minimum and maximum experience, and its own lower- and higher-level percentage modifiers. The entries SHALL be grouped under their published place when known; a creature found at more than one place MAY appear under each applicable place. A distinct unplaced group SHALL retain eligible published creatures without a published place. The document SHALL provide a default creature from its eligible entries: the first by name whose level modifiers are not both zero, or the first by name when none has a modifier. It SHALL expose the published Heroic kill multiplier when available, without substituting a hard-coded value.

#### Scenario: Choosing a creature at a place
- **WHEN** two eligible published creatures have different level modifiers and only one has a published place
- **THEN** the placed creature appears under its linked place and the other appears under the unplaced group
- **AND** selecting either creature uses that creature's own experience bounds and level modifiers

#### Scenario: Ineligible creature
- **WHEN** a creature's authored experience bounds, fixed level, or level modifiers are missing, or its page is not published
- **THEN** it is not offered as a calculator input

### Requirement: Character Progression calculates evidence-bounded kill experience

The page SHALL provide keyboard-accessible controls for player level, creature, Heroic status when the multiplier is available, living followers from zero through ten, and a nonnegative Experience Bonus percentage. The selected player level SHALL remain synchronized with the level curve. The page SHALL calculate the lowest and highest *possible modeled* experience for one kill, applying these stages in game order for each possible integer base roll: authored minimum through maximum minus one, or the minimum when the bounds are equal; an explicitly unmodeled game-modifier stage; the selected creature's higher-level percentage if the creature is above the player, its lower-level percentage if below, or no level adjustment if equal; Heroic multiplication and nearest-integer rounding with halfway ties to even, when selected; division by one plus the number of living followers with the integer result rounded down for nonnegative experience; then the positive Experience Bonus percentage. The level adjustment SHALL truncate each percentage contribution toward zero before addition, rather than rounding the adjusted total. The bonus-stage estimate SHALL remain unrounded: the game applies a world multiplier afterward and can convert the final award to an integer. It SHALL not present the model as the exact in-game award when game modifiers or world modifiers are unaccounted for.

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

For the selected player level, the page SHALL show the template's experience needed to advance from zero current experience at that level and the range of whole kills needed using the calculator's modeled minimum and maximum, with the shortest count based on the maximum and longest on the minimum. These counts SHALL round the quotient upward. An estimated kill amount of zero SHALL NOT produce a finite kill count. At the level cap, the page SHALL show no next-level requirement or misleading finite kill count. Its calculator controls SHALL occupy their own full-width area, followed by the computed result and linked creature facts side by side on wide screens and stacked on narrow screens; the guide's level curve, quest and skill guidance, and talent progression SHALL remain available.

#### Scenario: Kill count range
- **WHEN** the next level needs 20 experience and the modeled possible award is 6 to 9
- **THEN** the page shows 3 to 4 modeled kills, using ceiling of 20 ÷ 9 and 20 ÷ 6 respectively

#### Scenario: Zero award or level cap
- **WHEN** the model's minimum award is zero, or the player selects the level cap
- **THEN** the page does not show a finite upper kill count for a zero minimum or a next-level kill count at the cap

#### Scenario: Calculator layout
- **WHEN** a reader opens the Character Progression guide on a narrow phone
- **THEN** every calculator control, result, and linked creature fact remains readable without horizontal page overflow
- **AND** the curve and progression guidance remain accessible
