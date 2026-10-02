# corruption-mechanics Specification

## Purpose
Give readers a build-specific guide to Corruption+ and corrupted gear, limited to captured game data and verified behavior.

## Requirements

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

### Requirement: Corruption facts follow the accepted build

The catalog SHALL preserve the captured maximum dungeon start level, per-level gear settings and bonuses, mob-stat settings, affix token count and availability, and five timed dungeons' authored total timers, remaining-time thresholds, boss references, reward-table references and maximum loot-item counts, with provenance and unavailable states. The published guide SHALL show the bosses without exposing internal loot-table names. For each dungeon it SHALL report whether every reward table belongs to one of its bosses' drop tables, using that build's loot bindings. Only when this holds for every dungeon SHALL the guide explain that the reward bag's extra loot comes from the bosses' own drop tables. The Heart's challenge-stone requirements SHALL be presented on its item page and the challenge places, not in the guide. The guide and item calculations SHALL use published build facts rather than site constants; absent inputs SHALL NOT produce invented values.

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

### Requirement: Heart uses belong to the item and challenge places

The published Heart of Corruption item SHALL list seven scanned challenge stones that consume it, each stone's map spot and area, its count, and the challenges it starts. Published challenge places SHALL be linked and destinations without a place page SHALL remain plain text. Each published challenge place reached by a Heart-consuming stone SHALL identify the Heart item, stone area, count, and map spot in its entry explanation. Place documents SHALL use schema version 8 for this reverse requirement; guide rule placements SHALL NOT encode a Heart-specific challenge-stone rule.

#### Scenario: Reader follows a Heart use
- **WHEN** a reader opens the Heart of Corruption item
- **THEN** its uses list seven stones beside crafting uses, link their stone spots and published challenge places, and leave Frost destinations as plain text
- **AND** each of the eight published challenge places identifies the consumed Heart requirement and links its stone spot

### Requirement: Corruption comparison uses timed-dungeon reward gear

The published Corruption guide SHALL provide `tryIt` with `groups: {place: EntityRef; items: {item: EntityRef; bosses: EntityRef[]}[]}[]` and `defaultItem: EntityRef`, replacing a static worked `example`. Groups SHALL contain only the five scanned timed dungeons, with each listed item drawn from an associated boss reward-bag loot table and each boss reference identifying the matching boss for that item and dungeon. The default item SHALL be a member of those groups. The Try It example SHALL compare the chosen item's unchanged base template against the calculated corrupted template at a selectable supported level and SHALL NOT suggest a saved roll or that all dungeon drops are eligible.

#### Scenario: Reader changes the example item
- **WHEN** a reader selects a different eligible item from a dungeon group
- **THEN** the Try It comparison shows that item's linked name, base template and calculated corrupted template
- **AND** the group identifies the timed dungeon and matching boss references

#### Scenario: Reward eligibility is absent
- **WHEN** an equippable item occurs only outside the five timed dungeons' boss reward-bag loot tables
- **THEN** the item is absent from Try It choices, even if a boss drops it elsewhere

#### Scenario: Published comparison references are inconsistent
- **WHEN** the default item is not listed in a group or an item or boss reference is not published
- **THEN** publication fails instead of publishing a broken comparison
