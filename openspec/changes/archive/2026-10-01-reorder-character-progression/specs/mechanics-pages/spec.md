## MODIFIED Requirements

### Requirement: Mechanics pages are guides

Each mechanics page SHALL start with an overview of no more than three sentences. An ordered flow of titled steps SHALL follow the overview, each summarizing verified rules of its topic in plain language and providing a stable step anchor for entity-page links. Across Character Progression, Heroic Tier, Crafting and Gathering, and Corruption, steps SHALL occupy two columns on wide screens and stack in reading order on narrow screens. A worked example SHALL span the full width below all steps on wide screens and follow them on narrow screens. Character Progression SHALL show its level curve between the overview and the steps, because readers come to that page for the experience that each level needs. Key values and tables SHALL remain available. A final closed disclosure SHALL retain the full topic rule list, evidence, source boundaries, and unknowns. Example entities SHALL link their published page or section. An entity's How it works link SHALL target the applicable guide step, not the rule-list disclosure; the guide SHALL distinguish computed examples from universal game rules.

#### Scenario: Entity links a craft step
- **WHEN** a crafted item shows the level where its base experience falls to half
- **THEN** How it works opens the guide at the matching crafting step
- **AND** a reader can open the final disclosure for the underlying verified rule and evidence

#### Scenario: Guide on a phone
- **WHEN** a reader opens any of the four mechanics guides at 390 px
- **THEN** its steps stack in reading order, its example follows the steps, and its tables remain readable without sideways page scroll

#### Scenario: Guide on a wide screen
- **WHEN** a reader opens any of the four mechanics guides on a wide screen
- **THEN** its steps appear in two columns and its worked example spans the full width beneath them

#### Scenario: Reader opens Crafting and Gathering
- **WHEN** a reader opens `/mechanics/crafting-and-gathering`
- **THEN** it shows the overview, craft and gather steps, spawner examples, and a worked example with Runeweave Regalia and Small Iron Vein
- **AND** the complete rule list and evidence remain in the final closed disclosure

#### Scenario: Step names a missing rule
- **WHEN** a guide step names a rule ID absent from its topic
- **THEN** publication fails rather than publish an unsupported explanation

#### Scenario: Heroic Essence example
- **WHEN** Heroic Essence rules and settings are verified
- **THEN** the Heroic Tier guide shows Essence per kill by creature rank and affix count at the health baseline
- **AND** this example names no creature

#### Scenario: Character Progression leads with its level curve
- **WHEN** a reader opens `/mechanics/character-progression`
- **THEN** the level curve follows the overview, and the steps follow the level curve

### Requirement: Character Progression explains earned experience

The page SHALL count the creatures with experience by how they spawn: at a fixed level, with the lowest and highest such level, or near the character's level within a zone range. It SHALL use the published spawn levels that the NPC pages and the map show, and it SHALL NOT count a creature without a published spawn. It SHALL show the highest authored level of a quest with experience. These source ranges SHALL NOT claim that experience cannot be gained at higher character levels. The page SHALL distinguish character experience from kills and quests, weapon-template experience from kills, and skill experience from weapon hits, crafting, gathering, enchanting, game actions, and quest actions where verified. It SHALL describe verified kill base rolls, creature level-difference modifiers, Heroic kill multiplier, party split, experience stat, and world modifiers. It SHALL describe verified quest amounts and their applicable modifiers. It SHALL describe skill and weapon-template award rules only where their inputs and conditions are verified. Captured modifiers and multipliers SHALL be facts of the published build, not site constants. An unverified branch SHALL be labeled unknown rather than stated as fact.

#### Scenario: Authored experience range
- **WHEN** creatures with experience spawn at fixed levels through level 32, and quests with experience reach level 31
- **THEN** the page labels these as the highest levels of those sources
- **AND** it does not say that the character must stop earning experience at level 32

#### Scenario: Record level and spawn level differ
- **WHEN** a creature's record does not scale but every spawner of the creature scales it into a zone range
- **THEN** the page counts the creature as a creature near the character's level, not as a fixed-level creature

#### Scenario: Unverified level comparison
- **WHEN** the direction of a creature level-difference modifier has not been verified
- **THEN** the page does not state which difference applies that modifier

#### Scenario: Distinct experience sources
- **WHEN** the published evidence confirms a weapon skill award for an auto-attack hit and a weapon-template award from a kill
- **THEN** the page names these as distinct sources and states only their verified award rules
- **AND** it does not present a crafting experience formula without verified evidence

### Requirement: Character Progression shows talent point gains

The page SHALL show the starting talent points, the points gained per character level-up, and the maximum points from the catalog. It SHALL distinguish a level-up gain from a starting amount. When a point type has one level-up gain, the page SHALL show the points that the start amount and the level-ups give at the level cap. It SHALL show any verified modifiers that change gains or the maximum. It SHALL present the maximum as a limit, not as points that every character has earned. It SHALL NOT repeat the section heading as the name of a single point type.

#### Scenario: Starting points and level-ups
- **WHEN** the catalog records a start amount of 1, a gain of 3 for each character level-up, a maximum of 180, and a level cap of 60
- **THEN** the page states that a character starts with 1 point and gains 3 at each level-up
- **AND** it states that level-ups give 178 points by level 60 and that 180 is the limit

## ADDED Requirements

### Requirement: Character Progression orders sections by reader need

The Character Progression page SHALL show its sections in this order: the overview, the level curve, the steps, the talent points, the experience sources, the level difference table, the kill calculator, and the rules reference. The level difference table SHALL name its columns by the creature's position relative to the character, and SHALL include a row for the creatures with experience that have no level modifier. The experience sources SHALL appear as a list of facts.

#### Scenario: Reader scrolls the page
- **WHEN** a reader opens `/mechanics/character-progression` at 1440 px
- **THEN** the level curve chart is visible without scrolling
- **AND** the kill calculator follows the level difference table and precedes the rules reference

#### Scenario: Level difference table
- **WHEN** 200 creatures with experience have a published spawn and 80 of them have a level modifier
- **THEN** the table lists each modifier pair with its creature count, and a row of 120 creatures without a modifier
