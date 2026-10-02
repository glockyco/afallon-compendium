## MODIFIED Requirements

### Requirement: Mechanics have published pages

The publication SHALL provide a `mechanics` page kind with versioned documents for named topics. Each topic of the rules record SHALL have one mechanics document: Character Progression, Heroic Tier, Crafting and Gathering, Corruption, and Loot. The site SHALL route these documents under `/mechanics/<topic>`. The Mechanics column of the Browse menu SHALL link only the main topics, Character Progression and Corruption. The other topics SHALL stay reachable through the How it works links of the pages that use their rules. A missing topic SHALL return a not-found page. Each document SHALL use facts from the catalog and SHALL preserve its build identity. These pages SHALL use sentence case for headings and labels, title case for names and category values, and no internal record ids.

#### Scenario: Published topic
- **WHEN** a reader opens `/mechanics/character-progression`
- **THEN** the page loads the Character Progression document of the accepted publication
- **AND** the Mechanics column links to this page and to `/mechanics/corruption`

#### Scenario: Topic outside the menu
- **WHEN** a reader follows the How it works link of the When used section of the Soaked Bag
- **THEN** the Loot page opens at its section on items that open a chest
- **AND** the Mechanics column of the Browse menu does not link the Loot page

#### Scenario: Unknown topic
- **WHEN** a reader opens `/mechanics/unknown-topic`
- **THEN** the site shows its not-found page

### Requirement: Character Progression orders sections by reader need

The Character Progression page SHALL show its sections in this order: the overview, the level curve, kill experience, the kill calculator, quest experience, experience bonuses, skill experience, and talent points. The kill experience section SHALL show the counts of creatures with experience as a list of facts, and the level difference table. The quest experience section SHALL show the counts of quests with experience as a list of facts. The level difference table SHALL name its columns by the creature's position relative to the character, and SHALL include a row for the creatures with experience that have no level modifier.

#### Scenario: Reader scrolls the page
- **WHEN** a reader opens `/mechanics/character-progression` at 1440 px
- **THEN** the level curve chart is visible without scrolling
- **AND** the kill calculator follows the kill experience section and precedes the quest experience section

#### Scenario: Level difference table
- **WHEN** 200 creatures with experience have a published spawn and 80 of them have a level modifier
- **THEN** the table lists each modifier pair with its creature count, and a row of 120 creatures without a modifier

## ADDED Requirements

### Requirement: Mechanics guides are organized by topic

Each mechanics page SHALL start with an overview of no more than three sentences. Titled topic sections SHALL follow the overview. Each section SHALL cover one mechanic or one context of its topic, such as one source of loot, and SHALL NOT be numbered or presented as a step of a sequence. Each section SHALL start with a short lead that says where its mechanic applies, and SHALL state every rule of its topic section in plain language, with the label "Unknown:" before the claim of each unknown rule. The key values, tables, and worked examples of a mechanic SHALL appear in its section. Character Progression SHALL show its level curve first, because readers come to that page for the experience that each level needs. Each section SHALL have a stable anchor, and an entity's How it works link SHALL target the section that explains its value. Reader text SHALL NOT name game methods, decompilations, evidence records, rule numbers, or the pages where a rule also appears; the rules record and the catalog keep that evidence. Example entities SHALL link their published page or section, and the guide SHALL distinguish computed examples from universal game rules. A section lead SHALL NOT repeat the overview or a phrase of its rules. A rule phrase that links names SHALL lead into those names. A rule with more than ten links SHALL show eight of them and offer the rest on request.

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
- **WHEN** a rule names a section that its guide does not define, or a guide section has no rule
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
- **THEN** its phrase ends with words that lead into the linked name, such as "The total is your Experience Bonus"

#### Scenario: Rule links many items
- **WHEN** the sacrificial altar rule links 47 items
- **THEN** the World objects section shows 8 of them and a control that shows the other 39

#### Scenario: No evidence text
- **WHEN** a reader opens any mechanics guide
- **THEN** it shows no game method names, evidence descriptions, rule numbers, or lists of the pages where a rule also appears

## REMOVED Requirements

### Requirement: Mechanics pages are guides

**Reason**: Its numbered steps present separate mechanics as a sequence, and its closed rule list shows evidence text to readers.

**Migration**: Mechanics guides are organized by topic replaces it. How it works links target guide sections in place of steps.
