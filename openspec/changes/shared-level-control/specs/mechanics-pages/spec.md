## MODIFIED Requirements


### Requirement: Character Progression shows a level curve

The Character Progression page SHALL show the character level cap from the class level template. It SHALL plot experience to advance from each playable level below that cap on a labeled logarithmic experience axis. It SHALL offer the shared stepper and slider from the first level through the cap. For its selected level, the page SHALL show experience to the next level, experience earned before that level, and experience left to reach the cap. The earned and remaining amounts SHALL sum the template's level-to-next-level values. At the cap, the next and remaining amounts SHALL be zero. The labels SHALL name these amounts as totals from the first level, so that they read as a fresh character's totals and need no note. Chart labels and the level control SHALL remain usable without color or hover.

#### Scenario: Selected level
- **WHEN** a reader selects level 2 in a template whose first row is 20 and second row is 40
- **THEN** the control shows 40 experience to the next level and 20 experience earned before level 2
- **AND** experience left to the cap sums the rows from level 2 up to the level before the cap

#### Scenario: Level cap
- **WHEN** a reader selects the template's cap
- **THEN** the control shows zero experience to the next level and zero left to the cap


### Requirement: Character Progression calculates evidence-bounded kill experience

The page SHALL provide keyboard-accessible controls for character level, creature, creature level, Heroic status when the multiplier is available, living followers from zero through ten, and a nonnegative Experience Bonus percentage. Numeric settings SHALL use the shared stepper, with a slider where the range is finite. The creature level SHALL offer each level at which the creature spawns at the selected place, through the level cap when the zone range has no maximum. It SHALL default to the character level, limited to those levels, whenever the reader selects another creature or character level. The selected character level SHALL remain synchronized with the level curve, and selecting a creature SHALL NOT change it. The page SHALL calculate the lowest and highest *possible modeled* experience for one kill, applying these stages in game order for each possible integer base roll: authored minimum through maximum minus one, or the minimum when the bounds are equal; plus the selected creature level times the creature's experience per level; an explicitly unmodeled game-modifier stage; the selected creature's higher-level percentage if the selected creature level is above the character level, its lower-level percentage if below, or no level adjustment if equal; Heroic multiplication and nearest-integer rounding with halfway ties to even, when selected; division by one plus the number of living followers with the integer result rounded down for nonnegative experience; then the positive Experience Bonus percentage. The level adjustment SHALL truncate each percentage contribution toward zero before addition, rather than rounding the adjusted total. The bonus-stage estimate SHALL remain unrounded: the game applies a world multiplier afterward and can convert the final award to an integer. It SHALL not present the model as the exact in-game award when game modifiers or world modifiers are unaccounted for.

#### Scenario: Creature level follows the character
- **WHEN** the character level is 12 and the selected creature spawns near the character's level within 15 to 30
- **THEN** the creature level is 15, and the creature is above the character
- **AND** after the reader selects creature level 12, the creature is at the character's level

#### Scenario: Higher and equal levels
- **WHEN** an authored roll is 9, the creature has no experience per level, and it is above the player with a +25% higher-level modifier, with no Heroic status, followers, or Experience Bonus
- **THEN** the level-adjusted modeled result is 11, because the +2.25 contribution truncates to +2 before addition
- **AND** selecting an equal player level leaves the same roll at 9

#### Scenario: Level bonus
- **WHEN** Brinecrest at creature level 23 rolls 70 through 119 with 1 experience per level and the character is level 23
- **THEN** the modeled range is 93 to 142, as measured kills of 107 to 133 agree
- **AND** with the character at level 22 the -30% higher-level modifier gives 66 to 100

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
