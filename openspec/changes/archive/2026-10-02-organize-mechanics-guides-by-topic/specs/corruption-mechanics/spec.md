## MODIFIED Requirements

### Requirement: The corruption guide states supported rules

The publication SHALL provide a `mechanics` guide at `/mechanics/corruption`, with a brief overview and topic sections for altars, Corruption Tokens, corrupted enemies, timed dungeons, and corrupted gear, each with a stable anchor. These sections SHALL cover altar and token progression, the closed disclosure of affix names and in-game descriptions, dungeon enemies, timed-dungeon rewards, eligible gear and scaling with a worked calculated example from an authored item, and the gear tooltip in plain player-facing language. It SHALL identify the positive-level gear tooltip line as `Corruption +N` (green in-game), absent at zero; distinguish a measured weapon component from an unmeasured full hit. Heart of Corruption SHALL appear only as a generic linked `seeAlso` item sentence, not in a guide challenge-stones section or Heart-specific rule. Research evidence stays in the evidence records and does not appear in the guide document or on the page.

#### Scenario: Reader follows a verified rule
- **WHEN** a reader opens the guide from an eligible gear page
- **THEN** the link reaches the Corrupted gear section and the guide distinguishes a calculated template example from a saved rolled item

#### Scenario: Reader follows the Heart reference
- **WHEN** the reader reaches the line below the guide overview
- **THEN** it says that the Heart of Corruption starts challenge stones and links the Heart item page
- **AND** the guide does not imply a Heart is a token or changes timed-dungeon rewards

#### Scenario: Token tooltip explains its effect
- **WHEN** a token has saved value N and affixes
- **THEN** the guide explains that its tooltip says “Use at a Corruption Altar to increase dungeon corruption by +N.”, lists “NPC Stat Bonuses:” at +10% × N Strength and Intellect and +20% × N Health, and lists its saved affix names and descriptions under “Dungeon Affixes:”
- **AND** it does not confuse the token's saved value with an equippable item's corruption level

#### Scenario: A combat outcome remains unresolved
- **WHEN** the evidence establishes an unrounded weapon-damage component but not a full mitigated hit
- **THEN** the guide limits its claim to the measured component
