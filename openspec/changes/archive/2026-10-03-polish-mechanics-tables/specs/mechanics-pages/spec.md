## MODIFIED Requirements

### Requirement: Mechanics guides are organized by topic

Each mechanics page SHALL start with an overview of no more than three sentences. Titled topic sections SHALL follow the overview. Each section SHALL cover one mechanic or one context of its topic, such as one source of loot, and SHALL NOT be numbered or presented as a step of a sequence. Each section SHALL lead with a concise answer and SHALL group longer rules into short titled subsections, linked examples, or details disclosed on request. A section that its lead explains in full MAY have no rules, and a rule that only repeats a lead or adds nothing a player can use SHALL be folded into the lead or left out. Mechanics text SHALL speak to the player in plain sentences: it SHALL say what the player gets or must do, and SHALL leave out paraphrases of game code, descriptions of the data source, and notes that only qualify other text. The key values, tables, and worked examples of a mechanic SHALL appear in its section. Character Progression SHALL show its level curve first, because readers come to that page for the experience that each level needs. Each section SHALL have a stable anchor, and an entity's How it works link SHALL target the section that explains its value. Reader text SHALL NOT name game methods, decompilations, evidence records, rule numbers, or the pages where a rule also appears; the rules record and the catalog keep that evidence. Example entities SHALL link their published page or section, and the mechanics page SHALL distinguish computed examples from universal game rules. A section lead SHALL NOT repeat the overview or a phrase of its rules. A rule phrase SHALL name its links where they read naturally: inside the sentence, or as a closing list that the phrase leads into and that reads as a list. A closing list of more than ten links SHALL show eight of them and offer the rest on request.

#### Scenario: Entity links a crafting section
- **WHEN** a crafted item shows the level where its base experience falls to half
- **THEN** How it works opens Crafting and Gathering at its Crafting experience section
- **AND** that section states the experience band rules and shows the worked craft

#### Scenario: Loot sources are separate sections
- **WHEN** a reader opens `/mechanics/loot`
- **THEN** it shows one section each for items that open a chest, supply packs, cloth from kills, world objects, quest items, and the Dungeon Finder
- **AND** no section is numbered or titled as a step

#### Scenario: Guide on a phone
- **WHEN** a reader opens any mechanics page at 390 px
- **THEN** its sections stack in reading order and its tables remain readable without sideways page scroll

#### Scenario: Reader opens Crafting and Gathering
- **WHEN** a reader opens `/mechanics/crafting-and-gathering`
- **THEN** it shows sections for crafting, crafting experience, node selection, node availability, node rewards, attunement, and skill experience
- **AND** Runeweave Regalia appears in Crafting experience, the spawner examples in Node selection, and Small Iron Vein in Node rewards

#### Scenario: Rule section without a guide section
- **WHEN** a rule names a section that its mechanics page does not define
- **THEN** publication fails rather than publish a rule that no section shows

#### Scenario: Heroic Essence example
- **WHEN** Heroic Essence rules and settings are verified
- **THEN** the Heroic Essence section shows Essence per kill by creature rank and affix count at the health baseline
- **AND** this example names no creature

#### Scenario: Character Progression leads with its level curve
- **WHEN** a reader opens `/mechanics/character-progression`
- **THEN** the level curve section follows the overview

#### Scenario: Rule links a stat
- **WHEN** a Character Progression rule links Experience Bonus
- **THEN** the linked name sits inside the sentence, such as "Your Experience Bonus raises every gain of character experience by its percentage"

#### Scenario: Rule links many items
- **WHEN** the sacrificial altar rule links 47 items
- **THEN** the World objects section shows 8 of them in its closing list and a control that shows the other 39

#### Scenario: No evidence text
- **WHEN** a reader opens any mechanics page
- **THEN** it shows no game method names, evidence descriptions, rule numbers, or lists of the pages where a rule also appears

#### Scenario: Kill experience reads like a wiki
- **WHEN** a reader opens the Kill experience section of `/mechanics/character-progression`
- **THEN** it says that a kill gives a random amount within the creature's experience range
- **AND** its creature counts read as one sentence without a note that qualifies them

## ADDED Requirements

### Requirement: Mechanics reference tables share one presentation

Entity rows SHALL use the shared relation table with sortable relevant headings, readable phone rows, and an eight-row initial view when more than ten rows exist. Numeric reference matrices and calculator breakdowns SHALL use the global reference table style. Mechanics pages SHALL not maintain their own table markup styles. Skill experience breakpoints and the character level curve SHALL remain available.

#### Scenario: Mining odds have a long node list
- **WHEN** a spawner offers 14 linked gathering nodes
- **THEN** eight rows show chance bars and Show 6 more reveals the remaining nodes

#### Scenario: Numeric comparison
- **WHEN** the player changes levels in a corruption or experience calculator
- **THEN** its result table updates inside the result frame using the same shared compact numeric table style
