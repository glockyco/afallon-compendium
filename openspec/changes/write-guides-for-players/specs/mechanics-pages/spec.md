## MODIFIED Requirements

### Requirement: Character Progression shows a level curve

The Character Progression page SHALL show the character level cap from the class level template. It SHALL plot experience to advance from each playable level below that cap on a labeled logarithmic experience axis. It SHALL offer a level control from the first level through the cap. For its selected level, the page SHALL show experience to the next level, experience earned before that level, and experience left to reach the cap. The earned and remaining amounts SHALL sum the template's level-to-next-level values. At the cap, the next and remaining amounts SHALL be zero. The labels SHALL name these amounts as totals from the first level, so that they read as a fresh character's totals and need no note. Chart labels and the level control SHALL remain usable without color or hover.

#### Scenario: Selected level
- **WHEN** a reader selects level 2 in a template whose first row is 20 and second row is 40
- **THEN** the control shows 40 experience to the next level and 20 experience earned before level 2
- **AND** experience left to the cap sums the rows from level 2 up to the level before the cap

#### Scenario: Level cap
- **WHEN** a reader selects the template's cap
- **THEN** the control shows zero experience to the next level and zero left to the cap
- **AND** the chart does not plot a nonexistent next level

### Requirement: Mechanics guides are organized by topic

Each mechanics page SHALL start with an overview of no more than three sentences. Titled topic sections SHALL follow the overview. Each section SHALL cover one mechanic or one context of its topic, such as one source of loot, and SHALL NOT be numbered or presented as a step of a sequence. Each section SHALL read as prose: a short lead, its computed values, and then the verified rules of its topic section as sentences of one paragraph. Each unknown rule SHALL follow as a note with the label "Unknown:" before its claim. A section that its lead explains in full MAY have no rules, and a rule that only repeats a lead or adds nothing a player can use SHALL be folded into the lead or left out. Guide text SHALL speak to the player in the plain sentences of a game wiki: it SHALL say what the player gets or must do, and SHALL leave out paraphrases of game code, descriptions of the data source, and notes that only qualify other text. The key values, tables, and worked examples of a mechanic SHALL appear in its section. Character Progression SHALL show its level curve first, because readers come to that page for the experience that each level needs. Each section SHALL have a stable anchor, and an entity's How it works link SHALL target the section that explains its value. Reader text SHALL NOT name game methods, decompilations, evidence records, rule numbers, or the pages where a rule also appears; the rules record and the catalog keep that evidence. Example entities SHALL link their published page or section, and the guide SHALL distinguish computed examples from universal game rules. A section lead SHALL NOT repeat the overview or a phrase of its rules. A rule phrase SHALL name its links where they read naturally: inside the sentence, or as a closing list that the phrase leads into and that reads as a list. A closing list of more than ten links SHALL show eight of them and offer the rest on request.

#### Scenario: Entity links a crafting section
- **WHEN** a crafted item shows the level where its base experience falls to half
- **THEN** How it works opens the guide at its Crafting experience section
- **AND** that section states the experience band rules and shows the worked craft

#### Scenario: Loot sources are separate sections
- **WHEN** a reader opens `/mechanics/loot`
- **THEN** it shows one section each for items that open a chest, supply packs, cloth from kills, world objects, quest items, and the Dungeon Finder
- **AND** no section is numbered or titled as a step

#### Scenario: Guide on a phone
- **WHEN** a reader opens any mechanics guide at 390 px
- **THEN** its sections stack in reading order and its tables remain readable without sideways page scroll

#### Scenario: Reader opens Crafting and Gathering
- **WHEN** a reader opens `/mechanics/crafting-and-gathering`
- **THEN** it shows sections for crafting, crafting experience, node selection, node availability, node rewards, attunement, and skill experience
- **AND** Runeweave Regalia appears in Crafting experience, the spawner examples in Node selection, and Small Iron Vein in Node rewards

#### Scenario: Rule section without a guide section
- **WHEN** a rule names a section that its guide does not define
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
- **WHEN** a reader opens any mechanics guide
- **THEN** it shows no game method names, evidence descriptions, rule numbers, or lists of the pages where a rule also appears

#### Scenario: Kill experience reads like a wiki
- **WHEN** a reader opens the Kill experience section of `/mechanics/character-progression`
- **THEN** it says that a kill gives a random amount within the creature's experience range
- **AND** its creature counts read as one sentence without a note that qualifies them
