## ADDED Requirements

### Requirement: Combat explains supported ability scaling without promising combat outcomes

The Combat mechanics page SHALL explain that applicable base-damage-type, healing-type, Global Healing, and explicitly configured stat contributions add to an effect rank's authored flat amount, while a selected weapon contributes its recorded percentage of the relevant weapon roll independently. It SHALL distinguish main damage type from a custom displayed damage category, explain flat-calculation suppression of implicit bonuses, and show that damage-over-time and healing-over-time pulses consult the caster's current applicable stats for each pulse rather than snapshotting application stats. Examples SHALL link the relevant stats, abilities, and effects; no example SHALL assert a guaranteed hit, heal, or pulse total based only on these operands.

#### Scenario: Assassin runtime cross-check
- **WHEN** a reader compares the verified Assassin tooltip probe at level 22 with Brutal Slice effect 394 and Vital Rend effect 536
- **THEN** the guide explains why adding 20 Intellect raises each displayed tooltip total by 20 (124→144 and 146→166) while adding 20 Strength leaves those totals unchanged; the numeric tooltip examples are not described as guaranteed hits

#### Scenario: Periodic effect changes with caster stats
- **WHEN** a reader consults the guide for a damage-over-time or healing-over-time effect after a caster stat changes
- **THEN** it says each later pulse recalculates against the caster's current values and explains that the tooltip's current number does not fix future pulses
