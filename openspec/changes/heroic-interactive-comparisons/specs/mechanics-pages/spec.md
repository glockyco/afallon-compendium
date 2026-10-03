## ADDED Requirements

### Requirement: Heroic Tier compares eligible creatures and gear

The Heroic Tier page SHALL let readers choose a published creature at a place where the tier can be active and compare its Normal and conditional Empowered outcomes side by side. It SHALL remember an entered equipped gear score in browser storage and constrain it from zero through the verified cap. Creature strength SHALL use verified health and damage factors at that score and show absolute combat numbers only when a published baseline and all required modifiers make those numbers valid. Kill experience SHALL use the published roll and rule under clearly identified player level, creature level, and modifier assumptions. It SHALL distinguish possible affixes from the guaranteed first affix on empowered Rare and Boss creatures. It SHALL identify Heroic Essence eligibility and Heroic gear drops as conditional, not guaranteed per kill. It SHALL explain that the tier pauses in excluded places and dungeons with a timer or corruption.

The page SHALL also compare a published eligible item in its Normal and Heroic versions with tooltips and a What Changes table. It SHALL derive the fixed-stat bonus and weapon damage from that item's published facts and the verified rules, leaving random rolls, gems, and enchantments unchanged. It SHALL not suggest that a selected creature necessarily drops the compared item.

#### Scenario: Gear score boundaries
- **WHEN** the verified base factors are three for health and two for damage, the per-point bonus is 0.08%, and the cap is at 1,250 score
- **THEN** gear score zero yields 3× health and 2× damage, score 625 yields 4.5× and 3×, and score 1,250 or greater yields 6× and 4×

#### Scenario: Outdoor creature and paused dungeon
- **WHEN** a reader chooses a published creature encounter
- **THEN** the selectable encounters omit places where Heroic Tier pauses, while the page names the pause conditions
- **AND** the Empowered results are explicitly conditional on empowerment and the identified experience assumptions

#### Scenario: Normal and Heroic equipment
- **WHEN** a reader chooses eligible creature-drop gear with fixed stats or weapon damage
- **THEN** its Normal and Heroic tooltips and What Changes table use that item's published values
- **AND** possible Heroic gear is never described as a guaranteed drop

#### Scenario: Saved score
- **WHEN** the reader adjusts the gear score, leaves the page and returns
- **THEN** the score and derived creature factors remain consistent across visits without an account or network request
