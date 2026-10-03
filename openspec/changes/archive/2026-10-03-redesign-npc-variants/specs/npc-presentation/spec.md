## ADDED Requirements

### Requirement: Creature variants compare side by side

The Variants section of a creature page SHALL show one column per version, headed by the version's label, and one row per fact in which the versions differ. Each differing stat SHALL be its own row. The versions SHALL share the width of the section evenly. When they do not fit beside each other, they SHALL wrap into blocks whose sizes differ by at most one, and each block SHALL repeat the fact names. The section SHALL NOT scroll sideways. A block SHALL leave out a fact that none of its versions has. When every listed level scales with the player, the section line SHALL say so once and the level cells SHALL show only the range.

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
