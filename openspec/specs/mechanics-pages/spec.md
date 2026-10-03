# mechanics-pages Specification

## Purpose
Publish game mechanics as build-specific reference pages so readers can compare progression rules and Heroic Tier facts without treating advice as game data.

## Requirements

### Requirement: Mechanics have published pages

The publication SHALL provide a `mechanics` page kind with versioned documents for named topics. Each topic of the rules record SHALL have one mechanics document: Character Progression, Heroic Tier, Crafting and Gathering, Corruption, and Loot. The site SHALL route these documents under `/mechanics/<topic>`. The Mechanics column of the Browse menu SHALL link every topic. A missing topic SHALL return a not-found page. Each document SHALL use facts from the catalog and SHALL preserve its build identity. These pages SHALL use sentence case for headings and labels, title case for names and category values, and no internal record ids.

#### Scenario: Published topic
- **WHEN** a reader opens `/mechanics/character-progression`
- **THEN** the page loads the Character Progression document of the accepted publication
- **AND** the Mechanics column links all five topics

#### Scenario: Topic outside the menu
- **WHEN** a reader follows the How it works link of the When used section of the Soaked Bag
- **THEN** the Loot page opens at its section on items that open a chest
- **AND** the Mechanics column of the Browse menu also links the Loot page

#### Scenario: Unknown topic
- **WHEN** a reader opens `/mechanics/unknown-topic`
- **THEN** the site shows its not-found page

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

### Requirement: Heroic Tier explains its rewards and effects

The Heroic Tier page SHALL open with its overview and three short answers: how to turn the tier on, what changes, and what it gives, each with its values from the rules and a link to its detailed section. Its sections SHALL follow in three parts: Getting started, What changes, and Rewards.

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
- **THEN** the opening names Coalway Woods, Coalway Swamp, and Chillwind Heights as console places and links them
- **AND** it states the recommended level 25 as advice
- **AND** Getting started states that a console or a right-click on the Heroic World Tier buff turns the tier off

#### Scenario: Where the tier pauses
- **WHEN** the rules name five excluded places and the dungeon timer and corruption states
- **THEN** Getting started links the five places and says that the tier resumes when the reader leaves them

#### Scenario: Affixes without record ids
- **WHEN** the rules describe Beacon of Chaos, Engorged, Fel Raiser, and Imperious
- **THEN** each affix reads as one plain sentence about its effect, and no sentence shows a status effect id

### Requirement: Character Progression publishes selectable kill sources

The Character Progression document SHALL include each published creature whose kill roll can give experience, with both known level-difference modifiers and at least one published spawn level. The kill roll runs from the authored minimum experience through the authored maximum minus one, or is the minimum when both are equal. It SHALL list such a creature under each published place where it spawns, with the levels at which it spawns there: a fixed range, or a zone range in which its level follows the character's level. These SHALL be the levels that the creature's NPC page shows for that place. Each entry SHALL retain the published creature reference, its levels at that place, the lowest and highest roll, its experience per level, and its own lower- and higher-level percentage modifiers. These rolls SHALL equal the experience that the creature's NPC page shows. A creature without a published spawn SHALL NOT be offered. The document SHALL provide a default creature from its entries: the first by name with a fixed spawn level, level modifiers that are not both zero, and more than one possible roll; otherwise the first by name with level modifiers; otherwise the first by name. It SHALL expose the published Heroic kill multiplier when available, without substituting a hard-coded value.

#### Scenario: Choosing a creature at a place
- **WHEN** a creature spawns at levels 5 to 6 in one place and near the character's level within 15 to 30 in another place
- **THEN** it appears under both places, each with its levels there
- **AND** selecting either entry uses that creature's own experience bounds and level modifiers

#### Scenario: Ineligible creature
- **WHEN** a creature's authored experience bounds or level modifiers are missing, it has no published spawn, or its page is not published
- **THEN** it is not offered as a calculator input

### Requirement: Character Progression calculates evidence-bounded kill experience

The page SHALL provide keyboard-accessible controls for character level, creature, creature level, Heroic status when the multiplier is available, living followers from zero through ten, and a nonnegative Experience Bonus percentage. The creature level SHALL offer each level at which the creature spawns at the selected place, through the level cap when the zone range has no maximum. It SHALL default to the character level, limited to those levels, whenever the reader selects another creature or character level. The selected character level SHALL remain synchronized with the level curve, and selecting a creature SHALL NOT change it. The page SHALL calculate the lowest and highest *possible modeled* experience for one kill, applying these stages in game order for each possible integer base roll: authored minimum through maximum minus one, or the minimum when the bounds are equal; plus the selected creature level times the creature's experience per level; an explicitly unmodeled game-modifier stage; the selected creature's higher-level percentage if the selected creature level is above the character level, its lower-level percentage if below, or no level adjustment if equal; Heroic multiplication and nearest-integer rounding with halfway ties to even, when selected; division by one plus the number of living followers with the integer result rounded down for nonnegative experience; then the positive Experience Bonus percentage. The level adjustment SHALL truncate each percentage contribution toward zero before addition, rather than rounding the adjusted total. The bonus-stage estimate SHALL remain unrounded: the game applies a world multiplier afterward and can convert the final award to an integer. It SHALL not present the model as the exact in-game award when game modifiers or world modifiers are unaccounted for.

#### Scenario: Creature level follows the character
- **WHEN** the character level is 12 and the selected creature spawns near the character's level within 15 to 30
- **THEN** the creature level is 15, and the creature is above the character
- **AND** after the reader selects creature level 12, the creature is at the character's level

#### Scenario: Higher and equal levels
- **WHEN** an authored roll is 9, the creature has no experience per level, and it is above the player with a +25% higher-level modifier, with no Heroic status, followers, or Experience Bonus
- **THEN** the level-adjusted modeled result is 11, because the +2.25 contribution truncates to +2 before addition
- **AND** selecting an equal player level leaves the same roll at 9

#### Scenario: Level bonus
- **WHEN** Brinecrest at creature level 23 rolls 70 through 119 with 1 experience per level and the character is level 23
- **THEN** the modeled range is 93 to 142, as measured kills of 107 to 133 agree
- **AND** with the character at level 22 the -30% higher-level modifier gives 66 to 100

#### Scenario: Lower level with negative contribution
- **WHEN** an authored roll is 11, the creature is below the player and has a −30% lower-level modifier
- **THEN** the level-adjusted modeled result is 8, because the −3.3 contribution truncates toward zero to −3

#### Scenario: Heroic and followers
- **WHEN** a level-adjusted roll produces a Heroic-multiplied value halfway between two integers
- **THEN** the Heroic stage rounds to the even integer before splitting the award
- **AND** the player receives the integer quotient of that stage divided by one plus the selected number of living followers; companions do not receive a share of that award

#### Scenario: Experience Bonus is not prematurely rounded
- **WHEN** a split result of 5 is modeled with a +15% Experience Bonus
- **THEN** the displayed modeled amount is 5.75, not 5 or 6
- **AND** the page explains that world modifiers and some game modifiers are not included and that the game may convert the eventual award to an integer

### Requirement: Character Progression relates kills to the level curve

For the selected player level, the page SHALL show the template's experience needed to advance from zero current experience at that level and the range of whole kills needed using the calculator's modeled minimum and maximum, with the shortest count based on the maximum and longest on the minimum. These counts SHALL round the quotient upward. An estimated kill amount of zero SHALL NOT produce a finite kill count. At the level cap, the page SHALL show no next-level requirement or misleading finite kill count. The creature picker SHALL lead the calculator, with the selected creature's page link, levels, base roll, and both level modifiers beneath it. The settings and the result SHALL sit side by side on wide screens and stack on narrow screens. One box SHALL hold the experience per kill, the kills to the next level with the experience that this level needs, the stages that produced the range, and the caveat about world and game modifiers. The level curve, the quest and skill guidance, and the talent progression SHALL remain available.

#### Scenario: Kill count range
- **WHEN** the next level needs 20 experience and the modeled possible award is 6 to 9
- **THEN** the page shows 3 to 4 modeled kills, using ceiling of 20 ÷ 9 and 20 ÷ 6 respectively

#### Scenario: Zero award or level cap
- **WHEN** the model's minimum award is zero, or the player selects the level cap
- **THEN** the page does not show a finite upper kill count for a zero minimum or a next-level kill count at the cap

#### Scenario: Calculator layout
- **WHEN** a reader opens the Character Progression page at 390 px
- **THEN** every calculator control, result, and linked creature fact remains readable without horizontal page overflow
- **AND** the curve and progression guidance remain accessible

#### Scenario: Wide calculator
- **WHEN** a reader opens the Character Progression page at 1440 px
- **THEN** the settings and the result box sit side by side below the creature picker and its facts
- **AND** the result box contains the stages and the caveat

### Requirement: Character Progression orders sections by reader need

The Character Progression page SHALL show its sections in this order: the overview, the level curve, kill experience, the kill calculator, quest experience, experience bonuses, skill experience, and talent points. The kill experience section SHALL show the counts of creatures with experience as a list of facts, and the level difference table. The quest experience section SHALL show the counts of quests with experience as a list of facts. The level difference table SHALL name its columns by the creature's position relative to the character, and SHALL include a row for the creatures with experience that have no level modifier.

#### Scenario: Reader scrolls the page
- **WHEN** a reader opens `/mechanics/character-progression` at 1440 px
- **THEN** the level curve chart is visible without scrolling
- **AND** the kill calculator follows the kill experience section and precedes the quest experience section

#### Scenario: Level difference table
- **WHEN** 200 creatures with experience have a published spawn and 80 of them have a level modifier
- **THEN** the table lists each modifier pair with its creature count, and a row of 120 creatures without a modifier

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

### Requirement: An Adventurers guide explains adventurers

The publication SHALL publish an Adventurers guide with topic sections in this order: meeting and inviting adventurers, Dungeon Finder parties, the roster, their jobs and progress, and their gear upgrades, so that the two sections on getting adventurers into a party come together. The roster section SHALL list every adventurer of the world roster with one tab for each party role, with each adventurer's class, race, preferred talent tree, starting level, and when they join, and its rules SHALL say how joining, levels, roles, talents, and stats work. Each statement SHALL rest on verified native code, captured data, or a recorded runtime observation. A value SHALL come from published data. The guide SHALL NOT claim a hire price, a job failure, or a player reward that the evidence does not show. The Browse menu and adventurer NPC pages SHALL link the guide. The gear upgrades section SHALL list the reward gear with each item's type and the adventurer level from which it can be picked, sorted by that level, and SHALL list the gear kit of each adventurer that has one.

#### Scenario: Jobs and payouts
- **WHEN** a reader opens the jobs section
- **THEN** it says that an adventurer takes jobs while away, gains its own experience and gold, and can upgrade its gear, with the published duration bounds and upgrade chance

#### Scenario: Dungeon Finder party
- **WHEN** a reader opens the Dungeon Finder section
- **THEN** it names the party roles that the finder fills and the level range in which an adventurer can join a dungeon

#### Scenario: Reward gear
- **WHEN** a reader opens the gear upgrades section
- **THEN** it lists every item on the reward gear list with its type and adventurer level, starting with the items of level 1
- **AND** an item without an equipment band shows level 1

#### Scenario: Gear kits
- **WHEN** a reader opens the gear upgrades section
- **THEN** it shows the kits of Agra Emberhide, Brielle Dawnfield, and Eldeth Goldvein with their items

#### Scenario: Party sections together
- **WHEN** a reader opens the Adventurers guide
- **THEN** Dungeon Finder parties follows Meeting and inviting, before Jobs and progress and Gear upgrades

#### Scenario: Roster by party role
- **WHEN** a reader opens the roster section
- **THEN** it has Tank, Healer, and Damage tabs that together list all 115 adventurers of the world roster, and the Tank tab lists Eldeth Goldvein as a Dwarf Druid of the Primal Feral tree

### Requirement: Crafting and Gathering leads with its skills and groups its mechanics

The Crafting and Gathering page SHALL open with its overview and the skills where each activity starts: every published crafting skill with its recipe count and every published gathering skill with its node count, each linking its skill page, with links to the Recipes and Gathering Nodes lists. Its sections SHALL follow in titled parts: Crafting (recipes, crafting experience, enchanting), Gathering (node selection, attunement, node availability, node rewards), and Training skills (skill experience). A section that no part names SHALL follow the parts. The enchanting items SHALL appear in a relation table with the eight-row rule. The node selection examples SHALL appear as one tab per gathering skill, each with its own level control and attunements. The attunements SHALL appear as a table of item, attunement, nodes, weight bonus, and duration, with a duration that every row shares stated once. The weapon skills that auto-attacks train SHALL appear as a grid of links.

#### Scenario: Reader opens Crafting and Gathering
- **WHEN** a reader opens `/mechanics/crafting-and-gathering`
- **THEN** the page names Alchemy, Cooking, Metallurgy, Smithing, and Tailoring with their recipe counts and Fishing, Herbalism, and Mining with their node counts before the first part
- **AND** the Crafting, Gathering, and Training skills parts follow in that order

#### Scenario: Enchanting items
- **WHEN** the publication has 23 enchanting items
- **THEN** the Enchanting section shows eight rows and a Show 15 more control

#### Scenario: Node odds by skill
- **WHEN** a reader selects the Mining tab in Node selection
- **THEN** the Mining level control, the mining attunements, and the mining spawner odds show, and the other skills' examples stay hidden

### Requirement: Mechanics reference tables share one presentation

Entity rows SHALL use the shared relation table with sortable relevant headings, readable phone rows, and an eight-row initial view when more than ten rows exist. Numeric reference matrices and calculator breakdowns SHALL use the global reference table style. Mechanics pages SHALL not maintain their own table markup styles. Skill experience breakpoints and the character level curve SHALL remain available.

#### Scenario: Mining odds have a long node list
- **WHEN** a spawner offers 14 linked gathering nodes
- **THEN** eight rows show chance bars and Show 6 more reveals the remaining nodes

#### Scenario: Numeric comparison
- **WHEN** the player changes levels in a corruption or experience calculator
- **THEN** its result table updates inside the result frame using the same shared compact numeric table style
