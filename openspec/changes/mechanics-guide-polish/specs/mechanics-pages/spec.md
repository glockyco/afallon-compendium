## MODIFIED Requirements

### Requirement: Heroic Tier explains its rewards and effects

The Heroic Tier page SHALL open with its overview and three short answers: what it gives, how to turn the tier on, and what changes, each with its values from the rules and a link to its detailed section. The opening SHALL leave console locations and the recommended level to Getting started rather than repeating them. Its sections SHALL follow in three parts: Getting started, What changes, and Rewards.

Getting started SHALL name the places that hold a Heroic Console as links, how to confirm entry, the recommended level as advice rather than a requirement, both ways to leave, that the choice belongs to the character and survives death, and the places and dungeon states in which the tier pauses. What changes SHALL state which creatures become empowered, their health and damage multipliers, how the reader's gear score raises them up to a cap, and a table of creature strength at three gear scores. It SHALL state the affix chances, the guaranteed affixes of Rare and Boss creatures, the affix limit, what each affix does, and the affix loot multiplier. A text SHALL NOT show the record id of a status effect.

Rewards SHALL show the Heroic kill experience multiplier and SHALL distinguish kill experience from quest experience. It SHALL express Heroic Essence as `(base + per-affix amount × affix count) × rank multiplier × bounded health factor`, with fractional carry between kills, and SHALL name the talent trees where Essence is spent. It SHALL show the base, per-affix amount, rank multipliers, health baseline and bounds. It SHALL state the Boss and World Quest currency multipliers and that World Quest experience does not change, and the Heroic gear stat bonus. The page SHALL qualify any setting whose behavior has not been verified. It SHALL not rank Heroic gear or character builds.

#### Scenario: Essence calculation
- **WHEN** the catalog records Heroic Essence settings and the calculation has been verified
- **THEN** the page shows the product of the base-plus-affixes amount, the rank multiplier, and the bounded health factor
- **AND** it renders numbers from the published facts

#### Scenario: Heroic kill experience
- **WHEN** Heroic Tier is active and its kill multiplier is published
- **THEN** the page identifies the multiplier as a kill experience rule
- **AND** it does not say that quest experience receives that multiplier

#### Scenario: Turning the tier on
- **WHEN** a reader opens the Heroic Tier page
- **THEN** the opening leads with the rewards before a short invitation to turn it on
- **AND** Getting started names Coalway Woods, Coalway Swamp, and Chillwind Heights as console places and links them
- **AND** Getting started states the recommended level 25 as advice and says that a console or a right-click on the Heroic World Tier buff turns the tier off
- **AND** the detailed opening explains confirmation only once and keeps the console choice distinct from the buff's behavior after death

#### Scenario: Where the tier pauses
- **WHEN** the rules name five excluded places and the dungeon timer and corruption states
- **THEN** Getting started links the five places and says that the tier resumes when the reader leaves them

#### Scenario: Affixes without record ids
- **WHEN** the rules describe Beacon of Chaos, Engorged, Fel Raiser, and Imperious
- **THEN** each affix reads as one plain sentence about its effect, and no sentence shows a status effect id

### Requirement: Mechanics guides are organized by topic

Each mechanics page SHALL start with an overview of no more than three sentences. Titled topic sections SHALL follow the overview. Each section SHALL cover one mechanic or one context of its topic, such as one source of loot, and SHALL NOT be numbered or presented as a step of a sequence. Each section SHALL lead with a concise answer and SHALL group longer rules into short titled subsections, linked examples, or details disclosed on request. A section that its lead explains in full MAY have no rules, and a rule that only repeats a lead or adds nothing a player can use SHALL be folded into the lead or left out. Mechanics text SHALL speak to the player in plain sentences: it SHALL say what the player gets or must do, and SHALL leave out paraphrases of game code, descriptions of the data source, and notes that only qualify other text. The key values, tables, and worked examples of a mechanic SHALL appear in its section. Character Progression SHALL show its level curve first, because readers come to that page for the experience that each level needs. Each section SHALL have a stable anchor, and an entity's How it works link SHALL target the section that explains its value. Reader text SHALL NOT name game methods, decompilations, evidence records, rule numbers, or the pages where a rule also appears; the rules record and the catalog keep that evidence. Example entities SHALL link their published page or section, and the mechanics page SHALL distinguish computed examples from universal game rules. A section lead SHALL NOT repeat the overview or a phrase of its rules. A rule phrase SHALL name its links where they read naturally: inside the sentence, or as a closing list that the phrase leads into and that reads as a list. A closing list of more than ten links SHALL show eight of them and offer the rest on request. Travel, Adventurers, Factions, and World Quests SHALL give orientation in their introduction without immediately repeating their first section's answer. Creature Drops SHALL surface its drop-table answer before disclosing the remaining rules in distinct titled groups.

#### Scenario: Entity links a crafting section
- **WHEN** a crafted item shows the level where its base experience falls to half
- **THEN** How it works opens Crafting and Gathering at its Crafting experience section
- **AND** that section states the experience band rules and shows the worked craft

#### Scenario: Loot sources are separate sections
- **WHEN** a reader opens `/mechanics/loot`
- **THEN** it shows one section each for items that open a chest, supply packs, cloth from kills, world objects, quest items, and the Dungeon Finder
- **AND** no section is numbered or titled as a step
- **AND** Items that open a chest gives the specific bags and their item amounts without repeating the lead's instruction to open a bag

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

#### Scenario: Creature drops on a phone
- **WHEN** a reader opens the Loot guide at 390 px
- **THEN** Creature Drops shows a concise answer before its detailed rules
- **AND** those rules remain readable under distinct headings when expanded

#### Scenario: Guide introductions
- **WHEN** a reader opens the Travel, Adventurers, Factions, or World Quests guide
- **THEN** the introduction offers orientation and the first section supplies a distinct answer
