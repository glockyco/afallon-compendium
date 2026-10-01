## ADDED Requirements

### Requirement: Creature experience per kill includes the level bonus

A combat creature's experience per kill SHALL be the whole roll from its authored minimum experience through its authored maximum minus one, or the minimum when both are equal, plus the creature's level times its experience per level. The page and its variant table SHALL show this amount at the lowest and highest level at which the creature spawns. When the creature can spawn without a highest level, the page SHALL show the lowest amount with a plus sign. When no spawn level is published, the page SHALL show the roll and the experience per level. When the experience per level is unknown, the page SHALL NOT show experience per kill.

#### Scenario: Fixed level
- **WHEN** Brinecrest spawns at level 23, rolls 70 through 119, and has 1 experience per level
- **THEN** its page shows 93–142 experience per kill

#### Scenario: Scaling level
- **WHEN** Bat spawns near the player's level within 15–30, rolls 1, and has 1 experience per level
- **THEN** its page shows 16–31 experience per kill

#### Scenario: No published spawn
- **WHEN** a creature has no published spawn, rolls 70 through 119, and has 1 experience per level
- **THEN** its page shows 70–119, plus 1 per level
