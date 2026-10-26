# corruption-mechanics Specification

## Purpose
Give readers a build-specific guide to Corruption+ and corrupted gear, limited to captured game data and verified behavior.

## Requirements

### Requirement: The corruption guide states supported rules

The publication SHALL provide a `mechanics` guide at `/mechanics/corruption`, with a brief overview and topic sections for altars, Corruption Tokens, corrupted enemies, timed dungeons, and corrupted gear, each with a stable anchor.

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

#### Scenario: The corruption guide states supported rules
- **WHEN** A reader opens `/mechanics/corruption`.
- **THEN** The mechanics guide provides a brief overview and stable anchored sections for altars, Corruption Tokens, corrupted enemies, timed dungeons, and corrupted gear.

### Requirement: Corruption sections cover progression and supported mechanics

The guide's topic sections SHALL cover altar and token progression, the closed disclosure of affix names and in-game descriptions, dungeon enemies, timed-dungeon rewards, eligible gear and scaling with a worked calculated example from an authored item, and the gear tooltip in plain player-facing language.

#### Scenario: Corruption sections cover progression and supported mechanics
- **WHEN** The Corruption guide's topic sections are published.
- **THEN** The sections cover altar and token progression, closed disclosure of affix names and in-game descriptions, dungeon enemies, timed-dungeon rewards, eligible gear and scaling with a worked calculated example from an authored item, and the gear tooltip in plain player-facing language.

### Requirement: Gear tooltip presentation follows corruption level

The guide SHALL identify the positive-level gear tooltip line as `Corruption +N` (green in-game), absent at zero.

#### Scenario: Gear tooltip presentation follows corruption level
- **WHEN** The guide explains gear tooltips at corruption levels zero and two.
- **THEN** The guide identifies `Corruption +2` as green in-game and states that the corruption line is absent at zero.

### Requirement: Weapon component claims remain distinct from full hits

The guide SHALL distinguish a measured weapon component from an unmeasured full hit.

#### Scenario: Weapon component claims remain distinct from full hits
- **WHEN** The guide describes a measured weapon component while the full hit is unmeasured.
- **THEN** The guide distinguishes the measured component from the unmeasured full hit.

### Requirement: Heart references remain generic linked items

Heart of Corruption SHALL appear only as a generic linked `seeAlso` item sentence, not in a guide challenge-stones section or Heart-specific rule.

#### Scenario: Heart references remain generic linked items
- **WHEN** The guide includes a Heart of Corruption reference.
- **THEN** The reference appears only as a generic linked `seeAlso` item sentence, with no guide challenge-stones section or Heart-specific rule.

### Requirement: Research evidence remains outside the guide

Research evidence SHALL stay in the evidence records and SHALL NOT appear in the guide document or on the page.

#### Scenario: Research evidence remains outside the guide
- **WHEN** Research evidence supports a rule included in the guide.
- **THEN** The research evidence remains in the evidence records and is absent from both the guide document and the rendered page.
### Requirement: Corruption facts follow the accepted build

The catalog SHALL preserve the captured maximum dungeon start level, per-level gear settings and bonuses, mob-stat settings, affix token count and availability, and five timed dungeons' authored total timers, remaining-time thresholds, boss references, reward-table references and maximum loot-item counts, with provenance and unavailable states.

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

#### Scenario: Corruption facts follow the accepted build
- **WHEN** An accepted build supplies captured corruption settings and timed-dungeon facts, including an unavailable value.
- **THEN** The catalog preserves the captured settings, bonuses, token facts, and all five dungeons' timers, thresholds, references and loot limits, together with provenance and the unavailable state.

### Requirement: Guide shows bosses without internal loot-table names

The published guide SHALL show the bosses without exposing internal loot-table names.

#### Scenario: Guide shows bosses without internal loot-table names
- **WHEN** The guide publishes a timed dungeon's boss information.
- **THEN** The bosses are shown and internal loot-table names are not exposed.

### Requirement: Guide reports reward-table membership for each dungeon

For each dungeon the published guide SHALL report whether every reward table belongs to one of that dungeon's bosses' drop tables, using that build's loot bindings.

#### Scenario: Guide reports reward-table membership for each dungeon
- **WHEN** One timed dungeon has a reward table outside its bosses' drop tables and another has all reward tables bound to its bosses.
- **THEN** The guide reports the membership result separately for each dungeon using the published build's loot bindings.

### Requirement: Boss-drop explanation requires universal reward-table agreement

Only when every reward table for every dungeon belongs to one of that dungeon's bosses' drop tables SHALL the guide explain that the reward bag's extra loot comes from the bosses' own drop tables.

#### Scenario: Boss-drop explanation requires universal reward-table agreement
- **WHEN** Four timed dungeons have matching boss reward tables but the fifth has an unmatched reward table.
- **THEN** The guide does not explain that the reward bag's extra loot comes from the bosses' own drop tables.

### Requirement: Heart challenge-stone requirements stay on item and place pages

The Heart's challenge-stone requirements SHALL be presented on its item page and the challenge places, not in the guide.

#### Scenario: Heart challenge-stone requirements stay on item and place pages
- **WHEN** Heart challenge-stone requirements are published.
- **THEN** The requirements appear on the Heart item page and the challenge places and are absent from the guide.

### Requirement: Guide and item calculations use published build facts

The guide and item calculations SHALL use published build facts rather than site constants.

#### Scenario: Guide and item calculations use published build facts
- **WHEN** A published build's gear bonus setting differs from a site constant.
- **THEN** The guide and item calculations use the published build's setting.

### Requirement: Absent calculation inputs cannot produce invented values

Absent inputs SHALL NOT produce invented values in the guide or item calculations.

#### Scenario: Absent calculation inputs cannot produce invented values
- **WHEN** An item calculation lacks a required published build input.
- **THEN** The item calculation does not produce an invented value.
### Requirement: Heart uses belong to the item and challenge places

The published Heart of Corruption item SHALL list seven scanned challenge stones that consume it, each stone's map spot and area, its count, and the challenges it starts.

#### Scenario: Reader follows a Heart use
- **WHEN** a reader opens the Heart of Corruption item
- **THEN** its uses list seven stones beside crafting uses, link their stone spots and published challenge places, and leave Frost destinations as plain text
- **AND** each of the eight published challenge places identifies the consumed Heart requirement and links its stone spot

#### Scenario: Heart uses belong to the item and challenge places
- **WHEN** The Heart of Corruption item is published with its scanned challenge-stone uses.
- **THEN** The item lists all seven consuming stones with each stone's map spot, area, count, and started challenges.

### Requirement: Challenge destinations link only to published places

Published challenge places SHALL be linked and destinations without a place page SHALL remain plain text.

#### Scenario: Challenge destinations link only to published places
- **WHEN** A Heart item's challenge destinations include one published place and one destination without a place page.
- **THEN** The published place is linked and the destination without a place page remains plain text.

### Requirement: Challenge entry explanations identify Heart requirements

Each published challenge place reached by a Heart-consuming stone SHALL identify the Heart item, stone area, count, and map spot in its entry explanation.

#### Scenario: Challenge entry explanations identify Heart requirements
- **WHEN** A challenge place reached by a Heart-consuming stone is published.
- **THEN** Its entry explanation identifies the Heart item, stone area, count, and map spot.

### Requirement: Reverse Heart requirements use place schema version eight

Place documents SHALL use schema version 8 for this reverse requirement identifying the Heart item, stone area, count, and map spot.

#### Scenario: Reverse Heart requirements use place schema version eight
- **WHEN** A place document records the reverse requirement for entry through a Heart-consuming stone.
- **THEN** The place document uses schema version 8.

### Requirement: Guide rule placements exclude Heart-specific challenge-stone rules

Guide rule placements SHALL NOT encode a Heart-specific challenge-stone rule.

#### Scenario: Guide rule placements exclude Heart-specific challenge-stone rules
- **WHEN** Guide rule placements are prepared for publication.
- **THEN** No guide rule placement encodes a Heart-specific challenge-stone rule.
### Requirement: Corruption comparison uses timed-dungeon reward gear

The published Corruption guide SHALL provide `tryIt` with `groups: {place: EntityRef; items: {item: EntityRef; bosses: EntityRef[]}[]}[]` and `defaultItem: EntityRef`, replacing a static worked `example`.

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

#### Scenario: Corruption comparison uses timed-dungeon reward gear
- **WHEN** The Corruption guide's interactive comparison data is published.
- **THEN** The guide provides `tryIt` with the specified groups and defaultItem structure instead of a static worked `example`.

### Requirement: Comparison groups restrict dungeon and reward eligibility

Groups SHALL contain only the five scanned timed dungeons, with each listed item drawn from an associated boss reward-bag loot table and each boss reference identifying the matching boss for that item and dungeon.

#### Scenario: Comparison groups restrict dungeon and reward eligibility
- **WHEN** An item from an associated boss reward-bag loot table is listed in a comparison group.
- **THEN** The group is one of the five scanned timed dungeons and each boss reference identifies the matching boss for that item and dungeon.

### Requirement: Default comparison item belongs to a group

The default item SHALL be a member of those groups.

#### Scenario: Default comparison item belongs to a group
- **WHEN** A default item is selected for the published Try It comparison.
- **THEN** The default item is a member of the comparison groups.

### Requirement: Try It compares base and calculated corrupted templates

The Try It example SHALL compare the chosen item's unchanged base template against the calculated corrupted template at a selectable supported level.

#### Scenario: Try It compares base and calculated corrupted templates
- **WHEN** A reader chooses an eligible item and a supported corruption level.
- **THEN** Try It compares the item's unchanged base template against its calculated corrupted template at that level.

### Requirement: Try It avoids saved-roll and universal-eligibility claims

The Try It example SHALL NOT suggest a saved roll or that all dungeon drops are eligible.

#### Scenario: Try It avoids saved-roll and universal-eligibility claims
- **WHEN** Try It displays a calculated corrupted template for an eligible reward item.
- **THEN** The example does not suggest that the template is a saved roll or that all dungeon drops are eligible.
