## Purpose

Give readers a build-specific guide to Corruption+ and corrupted gear, limited to captured game data and verified behavior.

## ADDED Requirements

### Requirement: The corruption guide states supported rules

The publication SHALL provide a `mechanics` guide at `/mechanics/corruption`, with a brief overview, ordered steps anchored at `#step-<id>`, a worked calculated example from an authored item, and a closed disclosure of affix names and in-game descriptions. The guide SHALL explain altar increments, dungeon start-level cap, token and affix behavior, mob scaling, eligible gear rewards and scaling, gear tooltip, timed completion rewards, and authored dungeon thresholds in plain player-facing language. It SHALL identify the positive-level gear tooltip line as `Corruption +N` (green in-game), absent at zero; distinguish a measured weapon component from an unmeasured full hit; and keep the Heart of Corruption distinct from a token. Research evidence and remaining technical unknowns stay in the guide document, not the reader-facing page.

#### Scenario: Reader follows a verified rule
- **WHEN** a reader opens the guide from an eligible gear page
- **THEN** the link reaches the gear calculation step and the guide distinguishes a calculated template example from a saved rolled item

#### Scenario: Reader follows distinct item references
- **WHEN** the guide names Corruption Token and Heart of Corruption
- **THEN** each name links its own published item page without a raw record ID
- **AND** the guide does not imply a Heart is a token or changes a token reward

#### Scenario: Token tooltip explains its effect
- **WHEN** a token has saved value N and affixes
- **THEN** the guide explains that its tooltip says “Use at a Corruption Altar to increase dungeon corruption by +N.”, lists “NPC Stat Bonuses:” at +10% × N Strength and Intellect and +20% × N Health, and lists its saved affix names and descriptions under “Dungeon Affixes:”
- **AND** it does not confuse the token's saved value with an equippable item's corruption level

#### Scenario: A combat outcome remains unresolved
- **WHEN** the evidence establishes an unrounded weapon-damage component but not a full mitigated hit
- **THEN** the guide limits its claim to the measured component

### Requirement: Corruption facts follow the accepted build

The catalog SHALL preserve the captured maximum dungeon start level, per-level gear settings and bonuses, mob-stat settings, affix token count and availability, and five timed dungeons' authored total timers, remaining-time thresholds, boss references, reward-table references and maximum loot-item counts, with provenance and unavailable states. The published guide SHALL show the bosses without exposing internal loot-table names. For each dungeon it SHALL report whether every reward table belongs to one of its bosses' drop tables, using that build's loot bindings. Only when this holds for every dungeon SHALL the guide explain that the reward bag's extra loot comes from the bosses' own drop tables. It SHALL distinguish token item facts from the Heart's challenge-stone requirement and crafting-material relation. The guide and item calculations SHALL use published build facts rather than site constants; absent inputs SHALL NOT produce invented values.

#### Scenario: Timer facts have remaining-time semantics
- **WHEN** the accepted build records Duskfall Depths at 800 seconds total with 500/300 seconds remaining thresholds and three maximum loot items; Felheart Crucible at 300 with 160/100 and three; Tidefallen Grotto at 860 with 500/300 and three; The Underglow at 860 with 500/300 and two; and Barrowdeep at 860 with 500/300 and three
- **THEN** the guide presents the thresholds as time remaining, not elapsed time, with the build's corresponding maximum loot counts

#### Scenario: Reward tables match boss drops
- **WHEN** every reward table for each timed dungeon belongs to a listed boss's drop tables
- **THEN** the guide links the dungeon's bosses and explains that the reward bag's extra loot comes from the same tables as their drops
- **AND** the guide does not show internal loot-table names

#### Scenario: Reward tables do not match boss drops
- **WHEN** a dungeon has a reward table not bound to any of its listed bosses
- **THEN** the guide does not claim the reward bag's extra loot comes from the bosses' drops

#### Scenario: Settings differ between builds
- **WHEN** a future accepted build has different captured bonus settings
- **THEN** its guide and item calculation use that build's settings

#### Scenario: A setting cannot be captured
- **WHEN** the maximum level or a needed bonus setting is unavailable
- **THEN** the guide does not publish an invented number or calculated variant dependent on it
