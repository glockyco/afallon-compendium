## ADDED Requirements

### Requirement: Combat explains supported ability scaling without promising combat outcomes

The Combat mechanics page SHALL explain that applicable base-damage-type, healing-type, Global Healing, and explicitly configured stat contributions add to an effect rank's authored flat amount.

#### Scenario: Assassin runtime cross-check
- **WHEN** a reader compares the verified Assassin tooltip probe at level 22 with Brutal Slice effect 394 and Vital Rend effect 536
- **THEN** the guide explains why adding 20 Intellect raises each displayed tooltip total by 20 (124→144 and 146→166) while adding 20 Strength leaves those totals unchanged; the numeric tooltip examples are not described as guaranteed hits

#### Scenario: Periodic effect changes with caster stats
- **WHEN** a reader consults the guide for a damage-over-time or healing-over-time effect after a caster stat changes
- **THEN** it says each later pulse recalculates against the caster's current values and explains that the tooltip's current number does not fix future pulses

#### Scenario: Combat explains supported ability scaling without promising combat outcomes
- **WHEN** A reader consults the Combat mechanics page for an effect rank with applicable caster-stat contributions and an authored flat amount.
- **THEN** The page explains that applicable base-damage-type, healing-type, Global Healing, and explicitly configured stat contributions add to the authored flat amount.

### Requirement: Combat explains independent selected-weapon contributions

The Combat mechanics page SHALL explain that a selected weapon contributes its recorded percentage of the relevant weapon roll independently.

#### Scenario: Combat explains independent selected-weapon contributions
- **WHEN** A reader consults the Combat mechanics page for an effect that includes a selected-weapon contribution.
- **THEN** The page explains that the selected weapon contributes its recorded percentage of the relevant weapon roll independently.

### Requirement: Combat distinguishes main and displayed damage types

The Combat mechanics page SHALL distinguish main damage type from a custom displayed damage category.

#### Scenario: Combat distinguishes main and displayed damage types
- **WHEN** A reader consults the Combat mechanics page about an effect with a main damage type and a custom displayed damage category.
- **THEN** The page distinguishes the main damage type from the custom displayed damage category.

### Requirement: Combat explains flat-calculation suppression

The Combat mechanics page SHALL explain flat-calculation suppression of implicit bonuses.

#### Scenario: Combat explains flat-calculation suppression
- **WHEN** A reader consults the Combat mechanics page about a flat-calculation effect rank.
- **THEN** The page explains that flat calculation suppresses implicit bonuses.

### Requirement: Combat explains current-stat periodic scaling

The Combat mechanics page SHALL show that damage-over-time and healing-over-time pulses consult the caster's current applicable stats for each pulse rather than snapshotting application stats.

#### Scenario: Combat explains current-stat periodic scaling
- **WHEN** A reader consults the Combat mechanics page about how damage-over-time and healing-over-time pulses use caster stats.
- **THEN** The page shows that each pulse consults the caster's current applicable stats rather than snapshotting application stats.

### Requirement: Combat examples link scaling references

Combat mechanics page examples SHALL link the relevant stats, abilities, and effects.

#### Scenario: Combat examples link scaling references
- **WHEN** A reader views a scaling example on the Combat mechanics page.
- **THEN** The example links the relevant stats, abilities, and effects.

### Requirement: Combat examples avoid guaranteed outcome claims

No Combat mechanics page example SHALL assert a guaranteed hit, heal, or pulse total based only on the applicable stat contributions, authored flat amount, and selected weapon's recorded percentage of the relevant weapon roll.

#### Scenario: Combat examples avoid guaranteed outcome claims
- **WHEN** A reader views a Combat mechanics page example using stat contributions, an authored flat amount, and a selected-weapon contribution.
- **THEN** The example does not assert a guaranteed hit, heal, or pulse total based only on those operands.
