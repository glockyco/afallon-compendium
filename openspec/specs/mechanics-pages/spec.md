# mechanics-pages Specification

## Purpose
Publish game mechanics as build-specific reference pages so readers can compare progression rules and Heroic Tier facts without treating advice as game data.

## Requirements

### Requirement: Mechanics have published pages

The publication SHALL provide a `mechanics` page kind with versioned documents for named topics.

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

#### Scenario: Mechanics have published pages
- **WHEN** A named mechanics topic is published.
- **THEN** The publication provides its versioned document with the `mechanics` page kind.

### Requirement: Rules topics each have a mechanics document

Each topic of the rules record SHALL have one mechanics document: Character Progression, Heroic Tier, Crafting and Gathering, Corruption, and Loot.

#### Scenario: Rules topics each have a mechanics document
- **WHEN** The rules record is published.
- **THEN** Character Progression, Heroic Tier, Crafting and Gathering, Corruption, and Loot each have one mechanics document.

### Requirement: Mechanics documents use topic routes

The site SHALL route these documents under `/mechanics/<topic>`.

#### Scenario: Mechanics documents use topic routes
- **WHEN** A reader opens `/mechanics/corruption`.
- **THEN** The site routes to the Corruption mechanics document.

### Requirement: Browse menu links every mechanics topic

The Mechanics column of the Browse menu SHALL link every topic.

#### Scenario: Browse menu links every mechanics topic
- **WHEN** A reader opens the Browse menu.
- **THEN** Its Mechanics column links Character Progression, Heroic Tier, Crafting and Gathering, Corruption, and Loot.

### Requirement: Missing mechanics topics return not-found pages

A missing topic SHALL return a not-found page.

#### Scenario: Missing mechanics topics return not-found pages
- **WHEN** A reader requests `/mechanics/nonexistent-topic` and that topic is missing.
- **THEN** The site returns a not-found page.

### Requirement: Mechanics documents use catalog facts

Each document SHALL use facts from the catalog.

#### Scenario: Mechanics documents use catalog facts
- **WHEN** A Corruption mechanics document is published.
- **THEN** The document uses facts from the catalog.

### Requirement: Mechanics documents preserve build identity

Each document SHALL preserve its build identity.

#### Scenario: Mechanics documents preserve build identity
- **WHEN** A mechanics document belongs to a particular publication build.
- **THEN** The document preserves that build identity.

### Requirement: Mechanics pages use sentence case for headings and labels

These pages SHALL use sentence case for headings and labels.

#### Scenario: Mechanics pages use sentence case for headings and labels
- **WHEN** A mechanics page displays headings and labels.
- **THEN** The headings and labels use sentence case.

### Requirement: Mechanics pages use title case for names and categories

These pages SHALL use title case for names and category values.

#### Scenario: Mechanics pages use title case for names and categories
- **WHEN** A mechanics page displays names and category values.
- **THEN** The names and category values use title case.

### Requirement: Mechanics pages exclude internal record ids

These pages SHALL use no internal record ids.

#### Scenario: Mechanics pages exclude internal record ids
- **WHEN** A mechanics page presents catalog-backed content.
- **THEN** The page contains no internal record ids.
### Requirement: Character Progression shows a level curve

The Character Progression page SHALL show the character level cap from the class level template.

#### Scenario: Selected level
- **WHEN** a reader selects level 2 in a template whose first row is 20 and second row is 40
- **THEN** the control shows 40 experience to the next level and 20 experience earned before level 2
- **AND** experience left to the cap sums the rows from level 2 up to the level before the cap

#### Scenario: Level cap
- **WHEN** a reader selects the template's cap
- **THEN** the control shows zero experience to the next level and zero left to the cap

#### Scenario: Character Progression shows a level curve
- **WHEN** The class level template sets the level cap to 50.
- **THEN** The page shows a level cap of 50.

### Requirement: Experience curve axes

The Character Progression page SHALL plot experience to advance from each playable level below the cap on a labeled logarithmic experience axis.

#### Scenario: Experience curve axes
- **WHEN** The template has playable levels 1 through 50.
- **THEN** The chart plots experience to advance for levels 1 through 49 on a labeled logarithmic experience axis.

### Requirement: Shared level controls

The Character Progression page SHALL offer the shared stepper and slider from the first level through the cap.

#### Scenario: Shared level controls
- **WHEN** The template starts at level 1 and caps at level 50.
- **THEN** The shared stepper and slider allow selection from level 1 through level 50.

### Requirement: Selected level experience amounts

For its selected level, the Character Progression page SHALL show experience to the next level, experience earned before that level, and experience left to reach the cap.

#### Scenario: Selected level experience amounts
- **WHEN** A reader selects a non-cap level of 10.
- **THEN** The page shows experience to level 11, experience earned before level 10, and experience left to the cap.

### Requirement: Cumulative experience calculations

The earned and remaining experience amounts SHALL sum the template's level-to-next-level values.

#### Scenario: Cumulative experience calculations
- **WHEN** A three-level template has level-to-next-level values of 10 and 30, and level 2 is selected.
- **THEN** Earned experience is 10 and remaining experience is 30.

### Requirement: Cap experience amounts

At the cap, the next and remaining experience amounts SHALL be zero.

#### Scenario: Cap experience amounts
- **WHEN** The template caps at level 50 and the reader selects level 50.
- **THEN** The next and remaining experience amounts are both zero.

### Requirement: Fresh character total labels

The experience amount labels SHALL name these amounts as totals from the first level, so that they read as a fresh character's totals and need no note.

#### Scenario: Fresh character total labels
- **WHEN** Experience amounts are displayed for level 10.
- **THEN** Their labels identify totals from the first level, readable as a fresh character's totals without a note.

### Requirement: Nonvisual interaction cues

Chart labels and the level control SHALL remain usable without color or hover.

#### Scenario: Nonvisual interaction cues
- **WHEN** A reader uses the chart and level control without color or hovering.
- **THEN** Chart labels and the level control remain usable.
### Requirement: Character Progression explains earned experience

The page SHALL count the creatures with experience by how they spawn: at a fixed level, with the lowest and highest such level, or near the character's level within a zone range.

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

#### Scenario: Character Progression explains earned experience
- **WHEN** Two creatures with experience spawn at fixed levels 4 and 8, and another follows the character's level within a zone range.
- **THEN** The page counts two fixed-level creatures with lowest level 4 and highest level 8, and one creature near the character's level.

### Requirement: Published spawn evidence

The page SHALL use the published spawn levels that the NPC pages and the map show, and it SHALL NOT count a creature without a published spawn.

#### Scenario: Published spawn evidence
- **WHEN** One creature has a published level 7 spawn shown by its NPC page and the map, and another has no published spawn.
- **THEN** The page uses level 7 for the first creature and excludes the second from the count.

### Requirement: Highest authored quest level

The page SHALL show the highest authored level of a quest with experience.

#### Scenario: Highest authored quest level
- **WHEN** The highest authored level among quests with experience is 40.
- **THEN** The page shows 40 as the highest authored level of a quest with experience.

### Requirement: Source range interpretation

These creature and quest source ranges SHALL NOT claim that experience cannot be gained at higher character levels.

#### Scenario: Source range interpretation
- **WHEN** The displayed creature and quest source ranges end at level 40.
- **THEN** The page does not claim that experience cannot be gained above character level 40.

### Requirement: Distinct experience categories

The page SHALL distinguish character experience from kills and quests, weapon-template experience from kills, and skill experience from weapon hits, crafting, gathering, enchanting, game actions, and quest actions where verified.

#### Scenario: Distinct experience categories
- **WHEN** Published evidence verifies all of the listed experience sources.
- **THEN** The page distinguishes character experience from kills and quests, weapon-template experience from kills, and skill experience from weapon hits, crafting, gathering, enchanting, game actions, and quest actions.

### Requirement: Verified kill experience rules

The page SHALL describe verified kill base rolls, creature level-difference modifiers, Heroic kill multiplier, party split, experience stat, and world modifiers.

#### Scenario: Verified kill experience rules
- **WHEN** Published evidence verifies the kill base roll, level-difference modifiers, Heroic multiplier, party split, experience stat, and world modifiers.
- **THEN** The page describes each of those verified kill experience rules.

### Requirement: Verified quest experience rules

The page SHALL describe verified quest amounts and their applicable modifiers.

#### Scenario: Verified quest experience rules
- **WHEN** A quest amount of 100 and an applicable modifier are verified.
- **THEN** The page describes the 100 experience amount and its applicable modifier.

### Requirement: Skill and weapon award evidence

The page SHALL describe skill and weapon-template award rules only where their inputs and conditions are verified.

#### Scenario: Skill and weapon award evidence
- **WHEN** A weapon-template award rule has verified inputs and conditions, but a gathering skill rule does not.
- **THEN** The page describes the verified weapon-template award rule and does not describe the unverified gathering rule as an award rule.

### Requirement: Build-specific modifiers

Captured modifiers and multipliers SHALL be facts of the published build, not site constants.

#### Scenario: Build-specific modifiers
- **WHEN** The published build supplies a Heroic kill multiplier of 3.
- **THEN** The captured multiplier is the published build's value of 3, not a site constant.

### Requirement: Unknown experience branches

An unverified branch SHALL be labeled unknown rather than stated as fact.

#### Scenario: Unknown experience branches
- **WHEN** A branch of a quest modifier calculation has not been verified.
- **THEN** The page labels that branch unknown rather than stating it as fact.
### Requirement: Character Progression shows talent point gains

The page SHALL show the starting talent points, the points gained per character level-up, and the maximum points from the catalog.

#### Scenario: Starting points and level-ups
- **WHEN** the catalog records a start amount of 1, a gain of 3 for each character level-up, a maximum of 180, and a level cap of 60
- **THEN** the page states that a character starts with 1 point and gains 3 at each level-up
- **AND** it states that level-ups give 178 points by level 60 and that 180 is the limit

#### Scenario: Character Progression shows talent point gains
- **WHEN** The catalog specifies 2 starting points, 1 point per character level-up, and a maximum of 80.
- **THEN** The page shows 2 starting points, 1 point per level-up, and a maximum of 80.

### Requirement: Starting points versus level-up gains

The page SHALL distinguish a level-up gain from a starting amount.

#### Scenario: Starting points versus level-up gains
- **WHEN** A point type has 2 starting points and a level-up gain of 1.
- **THEN** The page identifies 2 as the starting amount and 1 as the level-up gain.

### Requirement: Talent points at the level cap

When a point type has one level-up gain, the page SHALL show the points that the start amount and the level-ups give at the level cap.

#### Scenario: Talent points at the level cap
- **WHEN** A point type starts with 2 points, gains 1 per level-up, and the character level cap is 10 starting from level 1.
- **THEN** The page shows that the starting amount and level-ups give 11 points at the cap.

### Requirement: Verified talent point modifiers

The page SHALL show any verified modifiers that change gains or the maximum.

#### Scenario: Verified talent point modifiers
- **WHEN** A verified modifier increases the maximum talent points by 5.
- **THEN** The page shows the modifier that increases the maximum by 5.

### Requirement: Talent point maximum as a limit

The page SHALL present the maximum as a limit, not as points that every character has earned.

#### Scenario: Talent point maximum as a limit
- **WHEN** The catalog maximum is 80 points.
- **THEN** The page presents 80 as a limit, not as points every character has earned.

### Requirement: Single point type naming

The page SHALL NOT repeat the section heading as the name of a single point type.

#### Scenario: Single point type naming
- **WHEN** A section titled "Talent points" contains a single point type.
- **THEN** The page does not repeat "Talent points" as that point type's name.
### Requirement: Heroic Tier explains its rewards and effects

The Heroic Tier page SHALL open with its overview and three short answers: what it gives, how to turn the tier on, and what changes, each with its values from the rules and a link to its detailed section.

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

#### Scenario: Heroic Tier explains its rewards and effects
- **WHEN** A reader opens the page with published Heroic Tier rules available.
- **THEN** The opening includes the overview and short answers about rewards, activation, and changes, each with rule values and a link to its detailed section.

### Requirement: Opening information boundaries

The opening SHALL leave console locations and the recommended level to Getting started rather than repeating them.

#### Scenario: Opening information boundaries
- **WHEN** Getting started contains console locations and a recommended level.
- **THEN** The opening does not repeat those locations or the recommended level.

### Requirement: Heroic section order

The Heroic Tier page's sections SHALL follow in three parts: Getting started, What changes, and Rewards.

#### Scenario: Heroic section order
- **WHEN** The Heroic Tier page renders its detailed sections.
- **THEN** The sections appear in the order Getting started, What changes, and Rewards.

### Requirement: Console locations and entry confirmation

Getting started SHALL name the places that hold a Heroic Console as links and explain how to confirm entry.

#### Scenario: Console locations and entry confirmation
- **WHEN** The rules identify a place with a Heroic Console and an entry confirmation procedure.
- **THEN** Getting started names that place as a link and explains the confirmation procedure.

### Requirement: Recommended level advice

Getting started SHALL state the recommended level as advice rather than a requirement.

#### Scenario: Recommended level advice
- **WHEN** The rules recommend level 30.
- **THEN** Getting started presents level 30 as advice, not an entry requirement.

### Requirement: Leaving Heroic Tier

Getting started SHALL state both ways to leave the tier.

#### Scenario: Leaving Heroic Tier
- **WHEN** The rules provide two ways to leave Heroic Tier.
- **THEN** Getting started states both ways to leave.

### Requirement: Character-specific persistent tier choice

Getting started SHALL state that the tier choice belongs to the character and survives death.

#### Scenario: Character-specific persistent tier choice
- **WHEN** A reader checks how the Heroic Tier choice persists.
- **THEN** Getting started states that the choice belongs to the character and survives death.

### Requirement: Getting started Heroic Tier pause conditions

Getting started SHALL state the places and dungeon states in which the tier pauses.

#### Scenario: Getting started Heroic Tier pause conditions
- **WHEN** The rules specify excluded places and dungeon states that pause the tier.
- **THEN** Getting started states those places and dungeon states.

### Requirement: Empowered creatures and base strength

What changes SHALL state which creatures become empowered and their health and damage multipliers.

#### Scenario: Empowered creatures and base strength
- **WHEN** The rules specify eligible creatures and their health and damage multipliers.
- **THEN** What changes identifies those creatures and states both multipliers.

### Requirement: Gear score scaling and strength table

What changes SHALL state how the reader's gear score raises empowered creatures' health and damage multipliers up to a cap, and provide a table of creature strength at three gear scores.

#### Scenario: Gear score scaling and strength table
- **WHEN** The rules define gear-score scaling of creature strength with a cap.
- **THEN** What changes explains the scaling and cap and provides a creature-strength table at three gear scores.

### Requirement: Affix assignment rules

What changes SHALL state the affix chances, the guaranteed affixes of Rare and Boss creatures, and the affix limit.

#### Scenario: Affix assignment rules
- **WHEN** The rules specify affix chances, guaranteed affixes for Rare and Boss creatures, and an affix limit.
- **THEN** What changes states those chances, both creature ranks' guaranteed affixes, and the limit.

### Requirement: Affix effects and loot

What changes SHALL state what each affix does and the affix loot multiplier.

#### Scenario: Affix effects and loot
- **WHEN** The rules publish several affixes and an affix loot multiplier.
- **THEN** What changes describes every affix's effect and states the affix loot multiplier.

### Requirement: Status effect identifier exclusion

A text SHALL NOT show the record id of a status effect.

#### Scenario: Status effect identifier exclusion
- **WHEN** An affix description uses a status effect whose record has an id.
- **THEN** The text does not show that status effect's record id.

### Requirement: Heroic kill experience rewards

Rewards SHALL show the Heroic kill experience multiplier and SHALL distinguish kill experience from quest experience.

#### Scenario: Heroic kill experience rewards
- **WHEN** The published Heroic kill experience multiplier is 3.
- **THEN** Rewards shows 3 as the kill experience multiplier and distinguishes kill experience from quest experience.

### Requirement: Essence formula and fractional carry

Rewards SHALL express Heroic Essence as `(base + per-affix amount × affix count) × rank multiplier × bounded health factor`, with fractional carry between kills.

#### Scenario: Essence formula and fractional carry
- **WHEN** The verified Essence calculation produces fractional awards across consecutive kills.
- **THEN** Rewards shows the specified formula and states that fractional Essence carries between kills.

### Requirement: Essence spending destinations

Rewards SHALL name the talent trees where Essence is spent.

#### Scenario: Essence spending destinations
- **WHEN** The rules identify talent trees where Heroic Essence is spent.
- **THEN** Rewards names those talent trees.

### Requirement: Essence calculation parameters

Rewards SHALL show the base, per-affix amount, rank multipliers, health baseline and bounds for Heroic Essence.

#### Scenario: Essence calculation parameters
- **WHEN** Published facts provide all Heroic Essence calculation parameters.
- **THEN** Rewards shows the base, per-affix amount, rank multipliers, health baseline, and bounds.

### Requirement: Boss and World Quest currency rewards

Rewards SHALL state the Boss and World Quest currency multipliers.

#### Scenario: Boss and World Quest currency rewards
- **WHEN** The rules publish Boss and World Quest currency multipliers.
- **THEN** Rewards states both currency multipliers.

### Requirement: Unchanged World Quest experience

Rewards SHALL state that World Quest experience does not change.

#### Scenario: Unchanged World Quest experience
- **WHEN** A reader views the Heroic World Quest rewards.
- **THEN** Rewards states that World Quest experience does not change.

### Requirement: Heroic gear stat bonus

Rewards SHALL state the Heroic gear stat bonus.

#### Scenario: Heroic gear stat bonus
- **WHEN** The rules publish a Heroic gear stat bonus.
- **THEN** Rewards states that bonus.

### Requirement: Unverified Heroic settings

The page SHALL qualify any setting whose behavior has not been verified.

#### Scenario: Unverified Heroic settings
- **WHEN** A published Heroic setting has unverified behavior.
- **THEN** The page qualifies that setting rather than presenting its behavior without qualification.

### Requirement: No gear or build rankings

The page SHALL not rank Heroic gear or character builds.

#### Scenario: No gear or build rankings
- **WHEN** The page presents Heroic rewards and effects.
- **THEN** It provides no ranking of Heroic gear or character builds.
### Requirement: Character Progression publishes selectable kill sources

The Character Progression document SHALL include each published creature whose kill roll can give experience, with both known level-difference modifiers and at least one published spawn level. The kill roll runs from the authored minimum experience through the authored maximum minus one, or is the minimum when both are equal.

#### Scenario: Choosing a creature at a place
- **WHEN** a creature spawns at levels 5 to 6 in one place and near the character's level within 15 to 30 in another place
- **THEN** it appears under both places, each with its levels there
- **AND** selecting either entry uses that creature's own experience bounds and level modifiers

#### Scenario: Ineligible creature
- **WHEN** a creature's authored experience bounds or level modifiers are missing, it has no published spawn, or its page is not published
- **THEN** it is not offered as a calculator input

#### Scenario: Character Progression publishes selectable kill sources
- **WHEN** A published creature has experience bounds of 10 and 13, both known level-difference modifiers, and a published spawn level.
- **THEN** The document includes that creature with a kill roll from 10 through 12.

### Requirement: Kill sources grouped by spawn place

The document SHALL list each eligible creature under each published place where it spawns, with the levels at which it spawns there: a fixed range, or a zone range in which its level follows the character's level.

#### Scenario: Kill sources grouped by spawn place
- **WHEN** An eligible creature has published spawns in a fixed range at one place and a character-following zone range at another.
- **THEN** The document lists the creature under both places with the respective fixed range and character-following zone range.

### Requirement: Spawn level parity with NPC pages

The listed spawn levels SHALL be the levels that the creature's NPC page shows for that place.

#### Scenario: Spawn level parity with NPC pages
- **WHEN** A creature's NPC page shows levels 12 to 14 at a published place.
- **THEN** The document lists levels 12 to 14 for that creature at that place.

### Requirement: Kill source entry facts

Each entry SHALL retain the published creature reference, its levels at that place, the lowest and highest roll, its experience per level, and its own lower- and higher-level percentage modifiers.

#### Scenario: Kill source entry facts
- **WHEN** An eligible creature entry is published for a place.
- **THEN** The entry retains its published creature reference, levels at that place, lowest and highest roll, experience per level, and that creature's lower- and higher-level percentage modifiers.

### Requirement: Kill roll parity with NPC pages

The listed rolls SHALL equal the experience that the creature's NPC page shows.

#### Scenario: Kill roll parity with NPC pages
- **WHEN** A creature's NPC page shows experience rolls from 15 through 19.
- **THEN** The document lists rolls from 15 through 19 for that creature.

### Requirement: Unpublished spawn exclusion

A creature without a published spawn SHALL NOT be offered.

#### Scenario: Unpublished spawn exclusion
- **WHEN** A published creature has experience values but no published spawn.
- **THEN** The document does not offer that creature.

### Requirement: Default kill source selection

The document SHALL provide a default creature from its entries: the first by name with a fixed spawn level, level modifiers that are not both zero, and more than one possible roll, otherwise the first by name with level modifiers, otherwise the first by name.

#### Scenario: Default kill source selection
- **WHEN** Two entries named Ash and Birch both have fixed spawn levels, modifiers that are not both zero, and multiple possible rolls.
- **THEN** The document selects Ash as the default creature.

### Requirement: Published Heroic kill multiplier

The document SHALL expose the published Heroic kill multiplier when available, without substituting a hard-coded value.

#### Scenario: Published Heroic kill multiplier
- **WHEN** The published build provides a Heroic kill multiplier of 4.
- **THEN** The document exposes the published value of 4 without substituting a hard-coded value.
### Requirement: Character Progression calculates evidence-bounded kill experience

The page SHALL provide keyboard-accessible controls for character level, creature, creature level, Heroic status when the multiplier is available, living followers from zero through ten, and a nonnegative Experience Bonus percentage.

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

#### Scenario: Character Progression calculates evidence-bounded kill experience
- **WHEN** The reader uses the keyboard to configure a kill and the Heroic multiplier is available.
- **THEN** The reader can operate controls for character level, creature, creature level, Heroic status, zero through ten living followers, and a nonnegative Experience Bonus percentage.

### Requirement: Numeric calculator controls use shared steppers

Numeric settings SHALL use the shared stepper, with a slider where the range is finite.

#### Scenario: Numeric calculator controls use shared steppers
- **WHEN** The reader edits the number of living followers.
- **THEN** The control uses the shared stepper and offers a slider for the finite range.

### Requirement: Creature level options follow published spawn levels

The creature level SHALL offer each level at which the creature spawns at the selected place, through the level cap when the zone range has no maximum.

#### Scenario: Creature level options follow published spawn levels
- **WHEN** The selected creature spawns at levels 15 and above at a place whose zone range has no maximum.
- **THEN** The creature level offers every spawn level from 15 through the level cap.

### Requirement: Creature level defaults follow character and creature changes

The creature level SHALL default to the character level, limited to the offered creature levels, whenever the reader selects another creature or character level.

#### Scenario: Creature level defaults follow character and creature changes
- **WHEN** The reader changes the character level to 12 while the selected creature's offered levels are 15 through 30.
- **THEN** The creature level defaults to 15.

### Requirement: Character level stays synchronized with the curve

The selected character level SHALL remain synchronized with the level curve, and selecting a creature SHALL NOT change the selected character level.

#### Scenario: Character level stays synchronized with the curve
- **WHEN** The selected character level is 23 and the reader selects another creature.
- **THEN** The character level remains 23 and the level curve remains synchronized with level 23.

### Requirement: Modeled range covers every possible base roll

The page SHALL calculate the lowest and highest *possible modeled* experience for one kill, applying the modeled stages in game order for each possible integer base roll: authored minimum through maximum minus one, or the minimum when the bounds are equal.

#### Scenario: Modeled range covers every possible base roll
- **WHEN** The authored base bounds are both 10.
- **THEN** The page applies the modeled stages to the sole base roll of 10 to calculate the lowest and highest possible modeled experience.

### Requirement: Creature experience per level precedes game modifiers

For each possible integer base roll, the page SHALL add the selected creature level times the creature's experience per level, then include an explicitly unmodeled game-modifier stage before the level adjustment.

#### Scenario: Creature experience per level precedes game modifiers
- **WHEN** A base roll is 70, the creature level is 23, and the creature has 1 experience per level.
- **THEN** The modeled value becomes 93 before an explicitly unmodeled game-modifier stage and the level adjustment.

### Requirement: Level adjustment uses the creature's relative-level percentage

After the explicitly unmodeled game-modifier stage, the page SHALL apply the selected creature's higher-level percentage if the selected creature level is above the character level, its lower-level percentage if below, or no level adjustment if equal.

#### Scenario: Level adjustment uses the creature's relative-level percentage
- **WHEN** The selected creature and character are both level 23.
- **THEN** The model applies no level adjustment after the explicitly unmodeled game-modifier stage.

### Requirement: Level percentage contributions truncate toward zero

The level adjustment SHALL truncate each percentage contribution toward zero before addition, rather than rounding the adjusted total.

#### Scenario: Level percentage contributions truncate toward zero
- **WHEN** The value before level adjustment is 11 and the applicable lower-level modifier is -30%.
- **THEN** The contribution truncates from -3.3 to -3 before addition, producing 8.

### Requirement: Heroic multiplication rounds halfway ties to even

After the level adjustment, the page SHALL apply Heroic multiplication and nearest-integer rounding with halfway ties to even, when Heroic status is selected.

#### Scenario: Heroic multiplication rounds halfway ties to even
- **WHEN** Heroic status is selected and the level-adjusted value multiplied by the Heroic multiplier is 12.5.
- **THEN** The Heroic stage rounds to 12.

### Requirement: Living followers divide the post-Heroic award

After the Heroic stage, the page SHALL divide by one plus the number of living followers, with the integer result rounded down for nonnegative experience.

#### Scenario: Living followers divide the post-Heroic award
- **WHEN** The post-Heroic value is 11 and there is one living follower.
- **THEN** The follower division stage produces 5.

### Requirement: Positive Experience Bonus follows follower division

After division by one plus the number of living followers, the page SHALL apply the positive Experience Bonus percentage.

#### Scenario: Positive Experience Bonus follows follower division
- **WHEN** The follower division result is 5 and the selected Experience Bonus is +15%.
- **THEN** The bonus stage produces 5.75.

### Requirement: Bonus estimates remain unrounded before world multiplication

The bonus-stage estimate SHALL remain unrounded: the game applies a world multiplier afterward and can convert the final award to an integer.

#### Scenario: Bonus estimates remain unrounded before world multiplication
- **WHEN** The bonus-stage estimate is 5.75.
- **THEN** The modeled estimate remains 5.75 rather than being converted to an integer before the game's later world multiplier and possible final integer conversion.

### Requirement: Modeled experience does not claim an exact in-game award

The page SHALL NOT present the model as the exact in-game award when game modifiers or world modifiers are unaccounted for.

#### Scenario: Modeled experience does not claim an exact in-game award
- **WHEN** The model leaves game modifiers or world modifiers unaccounted for.
- **THEN** The page does not present the modeled result as the exact in-game award.
### Requirement: Character Progression relates kills to the level curve

For the selected player level, the page SHALL show the template's experience needed to advance from zero current experience at that level and the range of whole kills needed using the calculator's modeled minimum and maximum, with the shortest count based on the maximum and longest on the minimum. These counts SHALL round the quotient upward.

#### Scenario: Kill count range
- **WHEN** the next level needs 20 experience and the modeled possible award is 6 to 9
- **THEN** the page shows 3 to 4 modeled kills, using ceiling of 20 ÷ 9 and 20 ÷ 6 respectively

#### Scenario: Zero award or level cap
- **WHEN** the model's minimum award is zero, or the player selects the level cap
- **THEN** the page does not show a finite upper kill count for a zero minimum or a next-level kill count at the cap

#### Scenario: Calculator layout
- **WHEN** a reader opens the Character Progression page at 390 px
- **THEN** the result appears before the settings card, and every calculator control, result, and linked creature fact remains readable without horizontal page overflow
- **AND** the curve and progression guidance remain accessible

#### Scenario: Wide calculator
- **WHEN** a reader opens the Character Progression page at 1440 px
- **THEN** the open settings and result cards sit side by side at equal height, with the creature picker first inside the settings card
- **AND** the result card contains disclosed stages and a visible caveat

#### Scenario: Character Progression relates kills to the level curve
- **WHEN** The selected level needs 20 experience from zero current experience and the modeled award is 6 to 9.
- **THEN** The page shows the 20-experience requirement and a range of 3 to 4 whole kills.

### Requirement: Zero modeled experience has no finite kill count

An estimated kill amount of zero SHALL NOT produce a finite kill count.

#### Scenario: Zero modeled experience has no finite kill count
- **WHEN** The modeled minimum award is zero.
- **THEN** The page does not show a finite longest kill count.

### Requirement: Level cap suppresses next-level requirements

At the level cap, the page SHALL show no next-level requirement or misleading finite kill count.

#### Scenario: Level cap suppresses next-level requirements
- **WHEN** The reader selects the level cap.
- **THEN** The page shows neither a next-level requirement nor a misleading finite kill count.

### Requirement: Settings card leads with the creature picker

The settings card SHALL lead with the creature picker and SHALL offer the selected creature level when several published spawn levels are possible, living followers, nonnegative Experience Bonus and conditional Heroic empowerment.

#### Scenario: Settings card leads with the creature picker
- **WHEN** The selected creature has several published spawn levels and Heroic empowerment is available.
- **THEN** The settings card starts with the creature picker and offers creature level, living followers, nonnegative Experience Bonus, and Heroic empowerment.

### Requirement: Creature source facts accompany the result

The selected creature's page link and place SHALL accompany the result, and the selected creature's levels, base roll, and level modifiers SHALL remain accessible in a named disclosure.

#### Scenario: Creature source facts accompany the result
- **WHEN** The reader views a selected creature's result and opens its named source-facts disclosure.
- **THEN** The result is accompanied by the creature's page link and place, and the disclosure exposes the creature's levels, base roll, and level modifiers.

### Requirement: Wide calculator cards align side by side

The settings and the result SHALL sit side by side with aligned tops and equal heights on wide screens.

#### Scenario: Wide calculator cards align side by side
- **WHEN** The reader opens the calculator on a wide screen.
- **THEN** The settings and result sit side by side with aligned tops and equal heights.

### Requirement: Narrow calculator puts the answer before controls

On narrow screens the result SHALL precede the settings card so the answer is visible before the controls, with the source facts following both.

#### Scenario: Narrow calculator puts the answer before controls
- **WHEN** The reader opens the calculator on a narrow screen.
- **THEN** The result appears before the settings card, and the source facts follow both.

### Requirement: Result box identifies modeled outcomes and caveats

The result box SHALL identify the experience per kill, the kills to the next level with the experience that this level needs, a disclosure of the stages that produced the range, and the caveat about world and game modifiers.

#### Scenario: Result box identifies modeled outcomes and caveats
- **WHEN** The reader views a result below the level cap.
- **THEN** The result box identifies experience per kill, kills to the next level and its experience requirement, the stages disclosure, and the world and game modifier caveat.

### Requirement: Progression guidance remains available alongside the calculator

The level curve, the quest and skill guidance, and the talent progression SHALL remain available.

#### Scenario: Progression guidance remains available alongside the calculator
- **WHEN** The reader uses the kill calculator.
- **THEN** The level curve, quest guidance, skill guidance, and talent progression remain available.
### Requirement: Character Progression orders sections by reader need

The Character Progression page SHALL show its sections in this order: the overview, the level curve, kill experience, the kill calculator, quest experience, experience bonuses, skill experience, and talent points.

#### Scenario: Reader scrolls the page
- **WHEN** a reader opens `/mechanics/character-progression` at 1440 px
- **THEN** the level curve chart is visible without scrolling
- **AND** the kill calculator follows the kill experience section and precedes the quest experience section

#### Scenario: Level difference table
- **WHEN** 200 creatures with experience have a published spawn and 80 of them have a level modifier
- **THEN** the table lists each modifier pair with its creature count, and a row of 120 creatures without a modifier

#### Scenario: Character Progression orders sections by reader need
- **WHEN** The reader opens Character Progression.
- **THEN** The sections appear in order as overview, level curve, kill experience, kill calculator, quest experience, experience bonuses, skill experience, and talent points.

### Requirement: Kill experience shows creature counts and level differences

The kill experience section SHALL show the counts of creatures with experience as a list of facts, and the level difference table.

#### Scenario: Kill experience shows creature counts and level differences
- **WHEN** The reader opens the kill experience section.
- **THEN** The section shows a list of facts containing the counts of creatures with experience and the level difference table.

### Requirement: Quest experience shows quest counts as facts

The quest experience section SHALL show the counts of quests with experience as a list of facts.

#### Scenario: Quest experience shows quest counts as facts
- **WHEN** The reader opens the quest experience section.
- **THEN** The counts of quests with experience appear as a list of facts.

### Requirement: Level difference table labels relative positions and unmodified creatures

The level difference table SHALL name its columns by the creature's position relative to the character, and SHALL include a row for the creatures with experience that have no level modifier.

#### Scenario: Level difference table labels relative positions and unmodified creatures
- **WHEN** The reader views the level difference table for data containing creatures with experience but no level modifier.
- **THEN** The columns are named by the creature's position relative to the character, and a row includes those creatures without a level modifier.
### Requirement: Mechanics guides are organized by topic

Each mechanics page SHALL start with an overview of no more than three sentences. Titled topic sections SHALL follow the overview.

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

#### Scenario: Mechanics guides are organized by topic
- **WHEN** The reader opens a mechanics page.
- **THEN** The page starts with an overview of at most three sentences, followed by titled topic sections.

### Requirement: Topic sections cover one mechanic without sequence numbering

Each section SHALL cover one mechanic or one context of its topic, such as one source of loot, and SHALL NOT be numbered or presented as a step of a sequence.

#### Scenario: Topic sections cover one mechanic without sequence numbering
- **WHEN** The reader views a section about one source of loot.
- **THEN** The section covers that one context and is neither numbered nor presented as a sequence step.

### Requirement: Sections lead with concise answers and group longer rules

Each section SHALL lead with a concise answer and SHALL group longer rules into short titled subsections, linked examples, or details disclosed on request.

#### Scenario: Sections lead with concise answers and group longer rules
- **WHEN** The reader opens a mechanics section containing longer rules.
- **THEN** The section starts with a concise answer and groups the longer rules into short titled subsections, linked examples, or details disclosed on request.

### Requirement: Redundant rules are folded into leads or omitted

A section that its lead explains in full MAY have no rules, and a rule that only repeats a lead or adds nothing a player can use SHALL be folded into the lead or left out.

#### Scenario: Redundant rules are folded into leads or omitted
- **WHEN** A proposed rule only repeats the section lead.
- **THEN** The rule is folded into the lead or left out.

### Requirement: Mechanics prose speaks plainly to the player

Mechanics text SHALL speak to the player in plain sentences: it SHALL say what the player gets or must do, and SHALL leave out paraphrases of game code, descriptions of the data source, and notes that only qualify other text.

#### Scenario: Mechanics prose speaks plainly to the player
- **WHEN** The reader reads a mechanic's explanation.
- **THEN** The text plainly says what the player gets or must do, without game-code paraphrases, data-source descriptions, or notes that only qualify other text.

### Requirement: Mechanic values and examples stay in their topic section

The key values, tables, and worked examples of a mechanic SHALL appear in its section.

#### Scenario: Mechanic values and examples stay in their topic section
- **WHEN** The reader opens a mechanic's section.
- **THEN** The section contains that mechanic's key values, tables, and worked examples.

### Requirement: Character Progression leads with the level curve

Character Progression SHALL show its level curve first, because readers come to that page for the experience that each level needs.

#### Scenario: Character Progression leads with the level curve
- **WHEN** The reader opens Character Progression.
- **THEN** The level curve is the first topic section, giving the experience each level needs.

### Requirement: Stable section anchors receive How it works links

Each section SHALL have a stable anchor, and an entity's How it works link SHALL target the section that explains its value.

#### Scenario: Stable section anchors receive How it works links
- **WHEN** The reader follows an entity's How it works link for a value.
- **THEN** The link targets the stable anchor of the section explaining that value.

### Requirement: Reader text keeps evidence identifiers in evidence records

Reader text SHALL NOT name game methods, decompilations, evidence records, rule numbers, or the pages where a rule also appears. The rules record and the catalog keep that evidence.

#### Scenario: Reader text keeps evidence identifiers in evidence records
- **WHEN** The reader opens a mechanics page.
- **THEN** Reader text names no game methods, decompilations, evidence records, rule numbers, or pages where a rule also appears, with that evidence kept in the rules record and catalog.

### Requirement: Example entities link to published destinations

Example entities SHALL link their published page or section.

#### Scenario: Example entities link to published destinations
- **WHEN** A mechanics section uses a published item as an example entity.
- **THEN** The item links to its published page or section.

### Requirement: Computed examples are distinct from universal rules

The mechanics page SHALL distinguish computed examples from universal game rules.

#### Scenario: Computed examples are distinct from universal rules
- **WHEN** The reader views a computed example beside a universal game rule.
- **THEN** The page distinguishes the computed example from the universal game rule.

### Requirement: Section leads do not repeat overview or rule phrases

A section lead SHALL NOT repeat the overview or a phrase of its rules.

#### Scenario: Section leads do not repeat overview or rule phrases
- **WHEN** The reader reads a section lead after the overview.
- **THEN** The lead repeats neither the overview nor a phrase of the section's rules.

### Requirement: Rule links read naturally in sentences or closing lists

A rule phrase SHALL name its links where they read naturally: inside the sentence, or as a closing list that the phrase leads into and that reads as a list.

#### Scenario: Rule links read naturally in sentences or closing lists
- **WHEN** A rule phrase links Experience Bonus within a sentence.
- **THEN** The linked name reads naturally inside that sentence.

### Requirement: Long closing link lists disclose links beyond eight

A closing list of more than ten links SHALL show eight of them and offer the rest on request.

#### Scenario: Long closing link lists disclose links beyond eight
- **WHEN** A rule has a closing list of 47 links.
- **THEN** The list shows eight links and offers the remaining 39 on request.

### Requirement: Named guide introductions orient without repeating first answers

Travel, Adventurers, Factions, and World Quests SHALL give orientation in their introduction without immediately repeating their first section's answer.

#### Scenario: Named guide introductions orient without repeating first answers
- **WHEN** The reader opens the Travel guide.
- **THEN** The introduction gives orientation without immediately repeating the first section's answer.

### Requirement: Creature Drops surfaces its answer before grouped details

Creature Drops SHALL surface its drop-table answer before disclosing the remaining rules in distinct titled groups.

#### Scenario: Creature Drops surfaces its answer before grouped details
- **WHEN** The reader opens Creature Drops and requests the remaining rules.
- **THEN** The drop-table answer appears before the remaining rules, which are disclosed in distinct titled groups.
### Requirement: An Adventurers guide explains adventurers

The publication SHALL publish an Adventurers guide with topic sections in this order: meeting and inviting adventurers, Dungeon Finder parties, the roster, their jobs and progress, and their gear upgrades, so that the two sections on getting adventurers into a party come together.

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

#### Scenario: An Adventurers guide explains adventurers
- **WHEN** The reader opens the Adventurers guide.
- **THEN** Its sections appear in order as meeting and inviting adventurers, Dungeon Finder parties, the roster, jobs and progress, and gear upgrades, keeping the two party-entry sections together.

### Requirement: Roster lists all adventurers by party role

The roster section SHALL list every adventurer of the world roster with one tab for each party role, with each adventurer's class, race, preferred talent tree, starting level, and when they join.

#### Scenario: Roster lists all adventurers by party role
- **WHEN** The reader browses the roster's party-role tabs.
- **THEN** The tabs collectively list every world-roster adventurer with class, race, preferred talent tree, starting level, and when they join, with one tab for each party role.

### Requirement: Roster rules explain adventurer progression and attributes

The roster section's rules SHALL say how joining, levels, roles, talents, and stats work.

#### Scenario: Roster rules explain adventurer progression and attributes
- **WHEN** The reader reads the roster section's rules.
- **THEN** The rules explain joining, levels, roles, talents, and stats.

### Requirement: Adventurer statements require verified evidence

Each statement SHALL rest on verified native code, captured data, or a recorded runtime observation.

#### Scenario: Adventurer statements require verified evidence
- **WHEN** A statement about adventurer jobs is included in the guide.
- **THEN** The statement rests on verified native code, captured data, or a recorded runtime observation.

### Requirement: Adventurer values come from published data

A value SHALL come from published data.

#### Scenario: Adventurer values come from published data
- **WHEN** The guide displays an adventurer's starting level.
- **THEN** The starting-level value comes from published data.

### Requirement: Unsupported adventurer claims are prohibited

The guide SHALL NOT claim a hire price, a job failure, or a player reward that the evidence does not show.

#### Scenario: Unsupported adventurer claims are prohibited
- **WHEN** The evidence shows no hire price, job failure, or player reward.
- **THEN** The guide claims none of those unsupported outcomes.

### Requirement: Browse and adventurer pages link the guide

The Browse menu and adventurer NPC pages SHALL link the guide.

#### Scenario: Browse and adventurer pages link the guide
- **WHEN** The reader opens the Browse menu or an adventurer NPC page.
- **THEN** A link to the Adventurers guide is available.

### Requirement: Gear upgrades list reward gear by eligible adventurer level

The gear upgrades section SHALL list the reward gear with each item's type and the adventurer level from which it can be picked, sorted by that level.

#### Scenario: Gear upgrades list reward gear by eligible adventurer level
- **WHEN** The reader opens the gear upgrades section's reward gear list.
- **THEN** The list shows reward gear with each item's type and eligible adventurer level, sorted by that level.

### Requirement: Gear upgrades list each available adventurer kit

The gear upgrades section SHALL list the gear kit of each adventurer that has one.

#### Scenario: Gear upgrades list each available adventurer kit
- **WHEN** An adventurer has a gear kit and the reader opens gear upgrades.
- **THEN** The section lists that adventurer's gear kit.
### Requirement: Crafting and Gathering leads with its skills and groups its mechanics

The Crafting and Gathering page SHALL open with its overview and the skills where each activity starts: every published crafting skill with its recipe count and every published gathering skill with its node count, each linking its skill page, with links to the Recipes and Gathering Nodes lists.

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

#### Scenario: Crafting and Gathering leads with its skills and groups its mechanics
- **WHEN** A reader opens the Crafting and Gathering page with published crafting and gathering skills.
- **THEN** The opening shows the overview, every published skill with its recipe or node count and skill-page link, and links to Recipes and Gathering Nodes.

### Requirement: Crafting and Gathering titled parts

The Crafting and Gathering page's sections SHALL follow in titled parts: Crafting (recipes, crafting experience, enchanting), Gathering (node selection, attunement, node availability, node rewards), and Training skills (skill experience). A section that no part names SHALL follow the parts.

#### Scenario: Crafting and Gathering titled parts
- **WHEN** A reader views the page's sections, including a section not named by any part.
- **THEN** Crafting, Gathering, and Training skills appear in that order with their named sections, followed by the section not named by any part.

### Requirement: Enchanting items relation table

The enchanting items SHALL appear in a relation table with the eight-row rule.

#### Scenario: Enchanting items relation table
- **WHEN** A reader opens Enchanting with seven published enchanting items.
- **THEN** The enchanting items appear in a relation table showing all seven rows under the eight-row rule.

### Requirement: Gathering skill example tabs

The node selection examples SHALL appear as one tab per gathering skill, each with its own level control and attunements.

#### Scenario: Gathering skill example tabs
- **WHEN** A reader views Node selection for published gathering skills.
- **THEN** Each gathering skill has one example tab with its own level control and attunements.

### Requirement: Attunement table and shared duration

The attunements SHALL appear as a table of item, attunement, nodes, weight bonus, and duration, with a duration that every row shares stated once.

#### Scenario: Attunement table and shared duration
- **WHEN** A reader views attunements whose rows all share a duration.
- **THEN** The table presents item, attunement, nodes, weight bonus, and duration, stating the shared duration once.

### Requirement: Auto-attack weapon skill links

The weapon skills that auto-attacks train SHALL appear as a grid of links.

#### Scenario: Auto-attack weapon skill links
- **WHEN** A reader views the weapon skills trained by auto-attacks.
- **THEN** Those weapon skills appear as a grid of links.

### Requirement: Mechanics reference tables share one presentation

Entity rows SHALL use the shared relation table with sortable relevant headings, readable phone rows, and an eight-row initial view when more than ten rows exist. Numeric reference matrices and calculator breakdowns SHALL use the global reference table style. Mechanics pages SHALL not maintain their own table markup styles. Skill experience breakpoints and the character level curve SHALL remain available.

#### Scenario: Mining odds have a long node list
- **WHEN** a spawner offers 14 linked gathering nodes
- **THEN** eight rows show chance bars and Show 6 more reveals the remaining nodes

#### Scenario: Numeric comparison
- **WHEN** the player changes levels in a corruption or experience calculator
- **THEN** its result table updates inside the result frame using the same shared compact numeric table style

### Requirement: Heroic effects keep their game identities

The Heroic Tier rules SHALL use status-effect references for each named affix, the Engorged toxin, Imperiously Empowered, and the tier buff. Each referenced name SHALL show the effect's game icon. When the effect has a published page, the name SHALL link to it. A withheld effect SHALL retain its name and icon without a dead link.

#### Scenario: A reader identifies an affix in combat
- **WHEN** the reader views the Heroic Tier Affixes section
- **THEN** Beacon of Chaos, Engorged, Fel Raiser, and Imperious appear with their respective effect icons and names
- **AND** the Engorged toxin and Imperiously Empowered are linked where their roles are explained

### Requirement: Character Progression answers for one remembered level

The Character Progression page SHALL lead its curve section with the published experience from the selected character level to the next, and a conditional range of whole kills of a linked published creature at a published place and spawn level, based on the verified kill calculation without followers, Heroic empowerment, or Experience Bonus.

#### Scenario: Linked kill estimate
- **WHEN** a reader selects level 40 with Enraged Ent at its published Oakshade Logging Camp spawn, alongside level-matched challenge-stone variants and an elite
- **THEN** the opening estimate names Enraged Ent at creature level 40 and shows 24,496 experience to the next level with about 598 kills at 41 experience each
- **AND** it links the ordinary creature and place, without an internal parenthetical variant name, and states the absent followers, Heroic status and Experience Bonus and possible other effects

#### Scenario: Journey proportion
- **WHEN** a reader selects a level below the cap
- **THEN** earned and remaining percentages use cumulative published experience and sum to 100 percent before display rounding
- **AND** the share for levels 50 through 60 is calculated from the same published rows, rather than being a fixed label

#### Scenario: Remembered level
- **WHEN** a reader saved a character level on another page and opens Character Progression
- **THEN** the visible control, opening answer, kill calculator, and level-up talent point example all use that saved level
- **AND** changing it updates all those results and the saved value

#### Scenario: One visible curve with inspectable breakpoints
- **WHEN** a reader opens Character Progression at 1440, 1100, or 390 px
- **THEN** the answer card sits beside one visible full curve on wide screens and above it on phones, with a marked selected level and readable muted axis labels
- **AND** the full-width journey strip follows those two, and the table of every breakpoint stays in a disclosure without a second chart

#### Scenario: Aligned calculator and Heroic controls
- **WHEN** a reader compares a creature's kill experience at 1440 px
- **THEN** the open settings card contains the creature select as its first control, while that settings card and the result card align with equal heights and the award identifies experience
- **AND** the Heroic creature-and-place select and level controls fit their comparison columns without mismatched widths

#### Scenario: Heroic relative strength without empty baselines
- **WHEN** a reader compares a normal eligible creature with its conditional Heroic outcome
- **THEN** one card shows Normal and Heroic columns with kill experience in each and no 1× baseline rows
- **AND** Maximum health and Damage rows show dashes for Normal and verified relative factors for Heroic, with affix and Essence conditions beneath the table

#### Scenario: Level cap and small screen
- **WHEN** the selected level is the cap on a 390 px screen
- **THEN** the page shows completion instead of a next-level kill count, keeps a readable numerical journey share and selected curve marker state, and offers the full chart and breakpoints without horizontal page overflow
- **AND** the calculator's immediate answer precedes optional settings and detailed calculation stages in reading order

#### Scenario: Character Progression answers for one remembered level
- **WHEN** A reader selects a character level below the cap.
- **THEN** The curve section leads with published experience to the next level and a conditional whole-kill range for a linked published creature at a published place and spawn level, calculated without followers, Heroic empowerment, or Experience Bonus.

### Requirement: Kill estimate conditions

The Character Progression opening kill example SHALL name the absence of followers, Heroic empowerment, and Experience Bonus and explain that other game and world effects can change an actual award.

#### Scenario: Kill estimate conditions
- **WHEN** A reader views the opening kill example.
- **THEN** The example names the excluded followers, Heroic empowerment, and Experience Bonus and explains that other game and world effects can change the actual award.

### Requirement: Level cap answer limits

At the cap the Character Progression opening example SHALL not promise another level or a finite number of kills.

#### Scenario: Level cap answer limits
- **WHEN** A reader selects the character level cap.
- **THEN** The opening example promises neither another level nor a finite kill count.

### Requirement: Responsive selected-level answer and curve

The selected-level answer SHALL sit beside the one always-visible complete labeled logarithmic curve on wide screens and stack above it on phones.

#### Scenario: Responsive selected-level answer and curve
- **WHEN** A reader views the selected-level answer on a wide screen and then on a phone.
- **THEN** The answer sits beside the single always-visible complete labeled logarithmic curve on the wide screen and above it on the phone.

### Requirement: Legible curve labels

The Character Progression curve's axis and level tick labels SHALL remain legible at small text size across viewport widths.

#### Scenario: Legible curve labels
- **WHEN** A reader views the curve at small text size on wide and phone viewports.
- **THEN** The axis and level tick labels remain legible at both widths.

### Requirement: Remembered level curve point

The Character Progression curve's selected point SHALL follow the remembered level.

#### Scenario: Remembered level curve point
- **WHEN** The remembered character level changes.
- **THEN** The selected point on the curve follows that remembered level.

### Requirement: Experience journey strip placement

A full-width experience journey strip SHALL follow the Character Progression answer and chart.

#### Scenario: Experience journey strip placement
- **WHEN** A reader views the answer and chart.
- **THEN** The experience journey strip follows both and spans the full width.

### Requirement: Published level breakpoint disclosure

A named disclosure SHALL retain every published level breakpoint without repeating the Character Progression chart.

#### Scenario: Published level breakpoint disclosure
- **WHEN** A reader opens the named level breakpoint disclosure.
- **THEN** Every published level breakpoint is available without a repeated chart.

### Requirement: Numerical and visual experience share

The journey bar SHALL report the selected level's share of total published experience to the cap in numbers as well as visually.

#### Scenario: Numerical and visual experience share
- **WHEN** A reader selects a level below the cap.
- **THEN** The journey bar reports that level's share of total published experience to the cap both numerically and visually.

### Requirement: Last ten levels experience distribution

The journey bar SHALL identify the experience share in the last ten levels as experience distribution, not time or predicted effort.

#### Scenario: Last ten levels experience distribution
- **WHEN** A reader views the last ten levels' experience share on the journey bar.
- **THEN** The share is identified as experience distribution rather than time or predicted effort.

### Requirement: Single shared character-level control

The Character Progression page SHALL offer exactly one character-level control shared by its curve answer, kill calculator, and level-up talent point example.

#### Scenario: Single shared character-level control
- **WHEN** A reader changes the page's character-level control.
- **THEN** The single control supplies the selected level for the curve answer, kill calculator, and level-up talent point example.

### Requirement: Shared browser-local reader level

The character-level control's saved value SHALL use the same browser-local reader level used by the site's other character examples, with a visible fallback when no level has been saved and no silent change to a previously selected level when the creature changes.

#### Scenario: Shared browser-local reader level
- **WHEN** A reader opens the page without a saved level, selects a level, and then changes the creature.
- **THEN** A visible fallback is initially shown, the selection uses the site's shared browser-local reader level, and changing the creature does not silently change the selected level.

### Requirement: Ordinary opening creature preference

The opening example SHALL prefer a published ordinary open-world creature at the selected level over challenge variants, named elites, or internal names with parenthetical qualifiers when such a creature is available.

#### Scenario: Ordinary opening creature preference
- **WHEN** An ordinary published open-world creature at the selected level is available alongside challenge variants, named elites, and internal names with parenthetical qualifiers.
- **THEN** The opening example prefers the ordinary creature.

### Requirement: Aligned Heroic comparison controls

The Heroic creature comparison SHALL align its creature-and-place selector and character/gear level controls within their columns.

#### Scenario: Aligned Heroic comparison controls
- **WHEN** A reader views the Heroic creature comparison controls.
- **THEN** The creature-and-place selector and character/gear level controls align within their columns.

### Requirement: Normal and conditional Heroic experience card

One comparison card SHALL show Normal and conditional Heroic kill experience side by side, with Heroic health and damage factors relative to Normal in separate rows and dashes instead of invented absolute Normal values.

#### Scenario: Normal and conditional Heroic experience card
- **WHEN** A reader compares a creature's Normal and conditional Heroic outcomes.
- **THEN** One card shows kill experience side by side, separate relative Heroic health and damage factor rows, and dashes instead of invented absolute Normal values.

### Requirement: Heroic eligibility and comparison conditions

The Heroic comparison card SHALL explain that only some creatures become Heroic while the tier is active and retain its affix and Essence conditions below the table.

#### Scenario: Heroic eligibility and comparison conditions
- **WHEN** A reader views the Heroic comparison card.
- **THEN** The card explains that only some creatures become Heroic while the tier is active and retains the affix and Essence conditions below the table.

### Requirement: Verified absolute combat values only

Absolute combat values in the Heroic creature comparison SHALL remain absent until verified and published.

#### Scenario: Verified absolute combat values only
- **WHEN** Absolute combat values have not been verified and published.
- **THEN** The Heroic creature comparison omits absolute combat values.
### Requirement: Heroic Tier compares eligible creatures and gear

The Heroic Tier page SHALL let readers choose a published creature at a place where the tier can be active and compare its Normal and conditional Empowered outcomes side by side.

#### Scenario: Gear score boundaries
- **WHEN** the verified base factors are three for health and two for damage, the per-point bonus is 0.08%, and the cap is at 1,250 score
- **THEN** gear score zero yields 3× health and 2× damage, score 625 yields 4.5× and 3×, and score 1,250 or greater yields 6× and 4×

#### Scenario: Outdoor creature and paused dungeon
- **WHEN** a reader chooses a published creature encounter
- **THEN** the selectable encounters omit places where Heroic Tier pauses, while the page names the pause conditions
- **AND** the Empowered results are explicitly conditional on empowerment and the identified experience assumptions

#### Scenario: Normal and Heroic equipment
- **WHEN** a reader chooses eligible creature-drop gear with fixed stats or weapon damage
- **THEN** its Normal and Heroic tooltips and What Changes table use that item's published values
- **AND** possible Heroic gear is never described as a guaranteed drop

#### Scenario: Saved score
- **WHEN** the reader adjusts the gear score, leaves the page and returns
- **THEN** the score and derived creature factors remain consistent across visits without an account or network request

#### Scenario: Heroic Tier compares eligible creatures and gear
- **WHEN** A reader chooses a published creature at a place where Heroic Tier can be active.
- **THEN** The page compares the creature's Normal and conditional Empowered outcomes side by side.

### Requirement: Remembered bounded equipped gear score

The Heroic Tier page SHALL remember an entered equipped gear score in browser storage and constrain it from zero through the verified cap.

#### Scenario: Remembered bounded equipped gear score
- **WHEN** A reader enters an equipped gear score above the verified cap and returns to the page.
- **THEN** The score is constrained to the verified cap and remembered in browser storage.

### Requirement: Verified creature strength factors

Creature strength SHALL use verified health and damage factors at the entered equipped gear score and show absolute combat numbers only when a published baseline and all required modifiers make those numbers valid.

#### Scenario: Verified creature strength factors
- **WHEN** A reader selects a gear score for a creature without a published baseline.
- **THEN** Creature strength uses the verified health and damage factors at that score and does not show absolute combat numbers.

### Requirement: Published kill experience assumptions

Kill experience SHALL use the published roll and rule under clearly identified player level, creature level, and modifier assumptions.

#### Scenario: Published kill experience assumptions
- **WHEN** A reader views a Heroic Tier kill experience comparison.
- **THEN** Kill experience uses the published roll and rule and clearly identifies player level, creature level, and modifier assumptions.

### Requirement: Possible and guaranteed Heroic affixes

The Heroic Tier page SHALL distinguish possible affixes from the guaranteed first affix on empowered Rare and Boss creatures.

#### Scenario: Possible and guaranteed Heroic affixes
- **WHEN** A reader views affix information for empowered Rare and Boss creatures.
- **THEN** The page distinguishes their guaranteed first affix from possible affixes.

### Requirement: Conditional Essence and gear drops

The Heroic Tier page SHALL identify Heroic Essence eligibility and Heroic gear drops as conditional, not guaranteed per kill.

#### Scenario: Conditional Essence and gear drops
- **WHEN** A reader views Heroic Essence and gear drop information.
- **THEN** Essence eligibility and Heroic gear drops are identified as conditional rather than guaranteed per kill.

### Requirement: Heroic Tier pause conditions

The Heroic Tier page SHALL explain that the tier pauses in excluded places and dungeons with a timer or corruption.

#### Scenario: Heroic Tier pause conditions
- **WHEN** A reader views where Heroic Tier is active.
- **THEN** The page explains that the tier pauses in excluded places and dungeons with a timer or corruption.

### Requirement: Normal and Heroic item comparison

The Heroic Tier page SHALL also compare a published eligible item in its Normal and Heroic versions with tooltips and a What Changes table.

#### Scenario: Normal and Heroic item comparison
- **WHEN** A reader chooses a published eligible item.
- **THEN** The page compares its Normal and Heroic versions using tooltips and a What Changes table.

### Requirement: Published item transformation rules

The Heroic Tier page SHALL derive the fixed-stat bonus and weapon damage from the compared item's published facts and the verified rules, leaving random rolls, gems, and enchantments unchanged.

#### Scenario: Published item transformation rules
- **WHEN** A reader compares an eligible weapon with fixed stats, random rolls, gems, and enchantments.
- **THEN** The fixed-stat bonus and weapon damage derive from the item's published facts and verified rules, while random rolls, gems, and enchantments remain unchanged.

### Requirement: No implied creature-item drop relationship

The Heroic Tier page SHALL not suggest that a selected creature necessarily drops the compared item.

#### Scenario: No implied creature-item drop relationship
- **WHEN** A reader selects a creature and an item for comparison.
- **THEN** The page does not suggest that the selected creature necessarily drops the compared item.
### Requirement: Loot guide explains Loot Chance

Within Creature Drops, the Loot guide SHALL provide an anchored subsection titled Loot Chance and Luck.

#### Scenario: Reader understands item-page chances
- **WHEN** a reader opens `/mechanics/loot/#loot-chance`
- **THEN** the Loot Chance and Luck subsection is visible within Creature Drops
- **AND** it distinguishes item-page chances with no Loot Chance from the odds after a player gains Luck
- **AND** it links the Loot Chance and Luck stat pages

#### Scenario: Minimum pick still gives items
- **WHEN** a Creature Drops table has a minimum pick
- **THEN** the subsection explains that it can still give an item despite the Loot Chance effect
- **AND** the rule appears only once in the Creature Drops section

#### Scenario: Loot guide explains Loot Chance
- **WHEN** A reader navigates to the Loot Chance anchor in the Loot guide.
- **THEN** The Loot Chance and Luck subsection appears within Creature Drops.

### Requirement: Plain-language Loot Chance effect

The Loot Chance and Luck subsection SHALL explain in plain language that Loot Chance affects ordinary creature drops, Luck raises Loot Chance, and in this game version a higher Loot Chance makes ordinary creature drops rarer rather than more common.

#### Scenario: Plain-language Loot Chance effect
- **WHEN** A reader reads the Loot Chance and Luck explanation.
- **THEN** Plain language explains that Loot Chance affects ordinary creature drops, Luck raises Loot Chance, and higher Loot Chance makes those drops rarer in this game version.

### Requirement: Item-page chance baseline and minimum pick

The Loot Chance and Luck subsection SHALL state that chances shown on item pages use no Loot Chance bonus and that a table's minimum pick can still give an item.

#### Scenario: Item-page chance baseline and minimum pick
- **WHEN** A reader checks the explanation against an item-page chance and a table with a minimum pick.
- **THEN** The explanation states that item-page chances use no Loot Chance bonus and that the minimum pick can still give an item.

### Requirement: Loot Chance and Luck stat links

Loot Chance and Luck SHALL link their stat pages.

#### Scenario: Loot Chance and Luck stat links
- **WHEN** A reader follows the Loot Chance and Luck links in the explanation.
- **THEN** Each link leads to its corresponding stat page.

### Requirement: Verified nonduplicated Loot Chance rules

The Loot Chance and Luck explanation SHALL use only verified game rules and SHALL not repeat the same rule in the detailed disclosure.

#### Scenario: Verified nonduplicated Loot Chance rules
- **WHEN** A reader reads the explanation and opens the detailed disclosure.
- **THEN** Only verified game rules are used, and the detailed disclosure does not repeat the same rule.
### Requirement: Loot guide shows World Loot and cloth at a creature level

Creature Drops SHALL show World Loot for one creature level that the reader chooses, with the chance that a kill gives any World Loot and each item's chance per kill, and Cloth from Kills SHALL show each cloth's chance per kill at the same level. Both SHALL use the tables and wording of creature pages, and the chosen level SHALL start at the reader's character level.

#### Scenario: Reader picks a creature level
- **WHEN** a reader sets the creature level to 27 in the Loot guide
- **THEN** Creature Drops shows that 11.4% of kills give 1 or 2 of 111 World Loot items, with each item's chance per kill
- **AND** Cloth from Kills shows the chance per kill of each cloth at level 27
