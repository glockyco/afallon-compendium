## Purpose

Give readers a build-specific guide to Corruption+ and corrupted gear, limited to captured game data and verified behavior.

## ADDED Requirements

### Requirement: The corruption guide states supported rules

The publication SHALL provide a `mechanics` guide at `/mechanics/corruption`, with a brief overview, ordered steps anchored at `#step-<id>`, a worked calculated example from an authored item, and a final closed disclosure of complete rules, evidence, source boundaries, and unknowns. The guide SHALL explain verified altar increments, dungeon start-level cap, token and affix behavior, mob scaling, eligible gear rewards, actual equipped template-stat scaling, the unrounded combat weapon component, game-tooltip-matching calculated gear values, timed completion rewards, and authored dungeon thresholds. It SHALL identify the actual positive-level gear tooltip line as `Corruption +N` (green in-game), absent at zero; distinguish a component calculation from an unmeasured full mitigated hit; and state that rolled random stats and gem stats do not scale. It SHALL explain the conditional Health template bonus without claiming an authored equippable item currently has Health. It SHALL link published Corruption Token and Heart of Corruption items when named, and SHALL NOT rank gear, assert unsupported drop chances, or provide dungeon routes. Applicable entity explanations SHALL link their guide step through rule placements rather than the final rule-list disclosure.

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

The catalog SHALL preserve the captured maximum dungeon start level, per-level gear settings and bonuses, mob-stat settings, affix token count and availability, and five timed dungeons' authored total timers, remaining-time thresholds, boss loot associations and maximum loot-item counts, with provenance and unavailable states. It SHALL distinguish token item facts from the Heart's challenge-stone requirement and crafting-material relation. The guide and item calculations SHALL use published build facts rather than site constants; absent inputs SHALL NOT produce invented values.

#### Scenario: Timer facts have remaining-time semantics
- **WHEN** the accepted build records Duskfall Depths at 800 seconds total with 500/300 seconds remaining thresholds and three maximum loot items; Felheart Crucible at 300 with 160/100 and three; Tidefallen Grotto at 860 with 500/300 and three; The Underglow at 860 with 500/300 and two; and Barrowdeep at 860 with 500/300 and three
- **THEN** the guide presents the thresholds as time remaining, not elapsed time, with the build's corresponding maximum loot counts

#### Scenario: Settings differ between builds
- **WHEN** a future accepted build has different captured bonus settings
- **THEN** its guide and item calculation use that build's settings

#### Scenario: A setting cannot be captured
- **WHEN** the maximum level or a needed bonus setting is unavailable
- **THEN** the guide does not publish an invented number or calculated variant dependent on it
