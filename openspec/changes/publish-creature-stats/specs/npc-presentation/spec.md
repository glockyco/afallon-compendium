## MODIFIED Requirements

### Requirement: Creature variants compare side by side

The Variants section of a creature page SHALL show one column per version, headed by the version's label, and one row per fact in which the versions differ. Each differing stat SHALL be its own row. For a stat with a supported effective value at a known encounter level, the page SHALL display the level-specific effective value rather than treating the authored addition as a finished total; where a variant has several possible levels without a selected encounter, it SHALL not claim a single effective total. When a stat's effective value cannot be calculated, the page SHALL distinguish its known authored addition from an effective value. The versions SHALL share the width of the section evenly. When they do not fit beside each other, they SHALL wrap into blocks whose sizes differ by at most one, and each block SHALL repeat the fact names. The section SHALL NOT scroll sideways. A block SHALL leave out a fact that none of its versions has. When every listed level scales with the player, the section line SHALL say so once and the level cells SHALL show only the range.

#### Scenario: Two versions with different stats and abilities
- **WHEN** two versions of Apprentice Lira differ in respawn, experience, health, armor, and abilities
- **THEN** the section shows one column for each version and one row for each of those facts
- **AND** each ability of a version is a link in its column

#### Scenario: Seven versions on a medium screen
- **WHEN** seven versions fit three to a block
- **THEN** the section shows blocks of three, two, and two versions
- **AND** no block holds a single version while another holds three

#### Scenario: A phone
- **WHEN** the section is too narrow for two versions beside the fact names
- **THEN** each block holds one version and reads as a list of its facts

#### Scenario: Every level scales
- **WHEN** every listed level of the versions scales with the player
- **THEN** the section line says "Every level scales with the player."
- **AND** each level cell shows only its range

#### Scenario: Shared name, different encounter levels
- **WHEN** two variants share a Health rule but spawn at different fixed levels
- **THEN** each variant's Health displays the effective value at its own level
- **AND** the comparison does not collapse the differing values into a single page-wide number

## ADDED Requirements

### Requirement: Creature summary names its stat basis

A creature page SHALL show supported effective Health and combat stats at a specific known level, with that level identified in context. For a creature spanning several possible levels, it SHALL present the stat variation honestly rather than show an authored addition as a finished Health or Damage total. If the rule cannot produce an effective stat, it SHALL label any shown number as an authored addition and preserve otherwise available creature information.

#### Scenario: Scaling Fangchill
- **WHEN** Fangchill can appear from level 20 to 30
- **THEN** its summary does not label 187.2, the authored Health addition, as its complete Health
- **AND** a level-20 encounter shows 1,972 Health while a level-30 encounter shows 2,814.4 Health

#### Scenario: Unknown effective stat
- **WHEN** an NPC stat lacks a required level operand or has an unsupported override
- **THEN** its page does not display an invented effective Health or Damage total
- **AND** a known authored addition, if displayed, is clearly identified as an addition
