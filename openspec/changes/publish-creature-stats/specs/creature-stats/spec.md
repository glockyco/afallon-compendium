## Purpose

Publish truthful creature Health and other supported combat stats for known encounters while preserving their authored evidence and withholding unsupported calculated values.

## ADDED Requirements

### Requirement: Creature stats preserve authored operands

The published NPC facts and variant facts SHALL expose each available stat's linked identity, authored added amount, percentage flag, and available starting value, per-level increment, minimum, maximum, and starting-percentage override. These creature-specific fields SHALL NOT change the shape or interpretation of equipment stat rows. Missing evidence SHALL remain absent rather than being substituted with zero.

#### Scenario: Complete level-dependent stat
- **WHEN** a creature stat has a starting value, added amount, and per-level increment in the source
- **THEN** its published stat retains those operands independently and identifies whether the addition is percentage-based

#### Scenario: Partially available stat
- **WHEN** the source supplies an added amount but no starting value or per-level increment
- **THEN** the published row retains the known addition and omits the unknown operands
- **AND** no total is claimed from those partial operands

#### Scenario: Distinct item stat contract
- **WHEN** an item and a creature both grant a named stat
- **THEN** the item continues to publish its own added-stat row without creature-only calculation fields

### Requirement: Effective stats require a supported level rule

An effective creature stat SHALL be calculated only for a verified flat combat stat at a known, specific creature encounter level when the starting value and per-level increment are known, the addition is not percentage-based, and no minimum, maximum, or starting-percentage override applies. The value SHALL equal starting value + authored added amount + (encounter level × per-level increment). It SHALL NOT be presented as a known total for other stat identities or unsupported or ambiguous operands. An unsupported effective value SHALL NOT suppress the known authored addition.

#### Scenario: Fangchill at two encounter levels
- **WHEN** Fangchill's Health has starting value 100, added amount 187.2, and per-level increment 84.24 and it appears at level 20 and level 30
- **THEN** its effective Health is 1,972 at level 20 and 2,814.4 at level 30
- **AND** the level-30 value differs from the level-20 value by ten times the per-level increment

#### Scenario: Fixed Aquarius boss
- **WHEN** Aquarius has a fixed published level-20 spawn and Health has starting value 100, authored addition 56,605 and per-level increment 195
- **THEN** normal maximum Health is 60,605, matching the observed fixed encounter
- **AND** changing a reader-selected character level does not change Aquarius's fixed encounter Health

#### Scenario: Unsupported overrides
- **WHEN** a stat is percentage-based or has a minimum, maximum, or starting-percentage override
- **THEN** its added amount and any known rule fields remain available
- **AND** no effective value is inferred from the simple level formula

#### Scenario: Stat without a verified flat rule
- **WHEN** a creature has an authored Movement Speed addition and a shared starting value
- **THEN** the addition remains visible as a bonus
- **AND** no complete Movement Speed value is claimed from the flat combat formula

#### Scenario: No specific encounter level
- **WHEN** a creature has no confirmed encounter level or only a range with no selected level
- **THEN** no single effective value is claimed for that creature

#### Scenario: Strength is not universal attack damage
- **WHEN** a creature has a supported effective Strength value but no verified specific attack and damage rule
- **THEN** the display identifies the value as Strength and does not claim it as a guaranteed hit or universal Attack Damage

### Requirement: Heroic health comparisons use effective baseline

Where a supported effective maximum Health is available for a selected eligible creature encounter, the Heroic comparison SHALL show both its normal Health and its empowered Health at the chosen encounter level, applying the verified empowered-health multiplier to the effective normal value. It SHALL distinguish Health that cannot be calculated from an actual zero and SHALL NOT present a numeric empowered Health without a numeric normal baseline.

#### Scenario: Fangchill changes level
- **WHEN** a reader compares eligible Fangchill at level 20 and then level 30 with the same Heroic settings
- **THEN** normal Health changes from 1,972 to 2,814.4
- **AND** each empowered Health value equals that level's calculated normal Health multiplied by the applicable Heroic health factor

#### Scenario: Verified Heroic Goat sample
- **WHEN** an eligible level-20 Goat has normal Health 676 and the applicable Heroic health multiplier is 4.89384
- **THEN** empowered maximum Health is 3,308.23584 before display rounding

#### Scenario: Unsupported Health
- **WHEN** the selected encounter's Health has a percentage addition or an active override
- **THEN** neither normal nor empowered Health is represented as a calculated numeric value
- **AND** the existing Heroic health multiplier can still be explained without implying a known total
