# reader-casing Specification

## Purpose
Keep the compendium's page titles and explanatory text consistent across gallery and table views without changing game-provided names.

## Requirements

### Requirement: Titles and sentence text use their own casing

The site and publication SHALL use Title Case for title-like noun labels: page and document titles, noun-like headings, card and section titles, noun-like disclosure summaries, tooltip titles, navigation items, tabs, table column headers, and short command buttons or links.

#### Scenario: Classes gallery view
- **WHEN** a reader opens the Classes gallery
- **THEN** its placeholder reads “Filter classes by name” and its unfiltered result count reads “6 classes” for a publication with six classes

#### Scenario: Classes table view
- **WHEN** the same reader switches to the Classes table
- **THEN** its placeholder reads “Filter classes by name” and its unfiltered result count reads “6 classes”

#### Scenario: Mechanics headings
- **WHEN** a reader opens the Heroic Tier mechanics page
- **THEN** a noun-like section heading such as “Heroic Gear” uses Title Case while a phrase-like heading such as “Getting started” uses sentence case

#### Scenario: Search placeholder
- **WHEN** a reader sees the home search input for searchable Items, NPCs, Quests, and additional kinds
- **THEN** its placeholder reads “Search items, NPCs, quests, and more”

#### Scenario: Hidden entries reveal
- **WHEN** an item list hides 91 entries without a known source
- **THEN** its reveal action reads “Show 91 items without a known source”

#### Scenario: Corruption drop lead-in
- **WHEN** a tooltip explains that an item can drop corrupted from a named dungeon and boss
- **THEN** the continuing phrase reads “Can drop corrupted from Duskfall Depths · Aquarius”

#### Scenario: Sentence-like disclosure summary
- **WHEN** a reader opens the details about how a kill award adds up
- **THEN** the disclosure summary reads “How the kill award adds up” rather than Title Case

#### Scenario: Mechanics explanation link and section pill
- **WHEN** a reader follows an item's explanation of its creature drop rules
- **THEN** the link reads “How creature drops work”
- **AND** the navigation pill for the section “Dropped by” also reads “Dropped by”, not “Dropped By”

#### Scenario: Kind line beneath a stat title
- **WHEN** a reader opens the Stamina stat page
- **THEN** the kind line reads “Defense Stat,” while an ordinary field label such as “Starting value” remains sentence case

#### Scenario: Minor word joins an identity fact to its source
- **WHEN** a boss page names the place it belongs to in the title block
- **THEN** the fact reads “Boss of Duskfall Depths”, retaining lowercase “of” inside the full line and the place's game-provided spelling

#### Scenario: Titles and sentence text use their own casing
- **WHEN** A page displays a noun-like card title, "heroic gear".
- **THEN** The card title reads "Heroic Gear".

### Requirement: Minor words inside titles remain lowercase

Inside a title, a, an, the, and, but, or, nor, for, of, on, in, at, to, by, per, from, with, as, and vs SHALL remain lowercase unless first or last.

#### Scenario: Minor words inside titles remain lowercase
- **WHEN** A title contains "of" between "Guide" and "Heroes".
- **THEN** The title reads "Guide of Heroes", with lowercase "of".

### Requirement: Sentence-like headings summaries and links use sentence case

Headings, disclosure summaries, and links phrased as sentences SHALL instead use sentence case.

#### Scenario: Sentence-like headings summaries and links use sentence case
- **WHEN** A disclosure summary is phrased "How rewards are calculated".
- **THEN** The summary reads "How rewards are calculated", not "How Rewards Are Calculated".

### Requirement: Section navigation pills match heading casing

A section navigation pill SHALL repeat its heading's casing.

#### Scenario: Section navigation pills match heading casing
- **WHEN** A section heading reads "Finding gear" and has a navigation pill.
- **THEN** The navigation pill reads "Finding gear".

### Requirement: Field and supporting text use sentence case

Field labels, counts and result lines, card facts, placeholders, hints, chips, published filter values authored by the compendium, units, lead-ins continuing into content, descriptions, empty states, and errors SHALL use sentence case.

#### Scenario: Field and supporting text use sentence case
- **WHEN** A field has the label "Maximum health".
- **THEN** The field label reads "Maximum health", not "Maximum Health".

### Requirement: Game names and abbreviations retain their spelling

Game-provided names and abbreviations such as NPCs, XP, and HP SHALL retain their spelling.

#### Scenario: Game names and abbreviations retain their spelling
- **WHEN** A sentence-case description includes the abbreviation HP.
- **THEN** The description retains "HP", not "Hp".

### Requirement: Counted hidden-entry commands use sentence case

The counted hidden-entries reveal command SHALL remain sentence case.

#### Scenario: Counted hidden-entry commands use sentence case
- **WHEN** An item list hides 12 entries without a known source.
- **THEN** The reveal command reads "Show 12 items without a known source".

### Requirement: Title-block kind and identity labels use Title Case

The kind line and identity facts immediately beneath a page title SHALL use Title Case for site-authored label words while retaining the game's spelling of linked or authored entity names.

#### Scenario: Title-block kind and identity labels use Title Case
- **WHEN** A kind line immediately beneath a page title contains the site-authored words "defense stat".
- **THEN** The kind line reads "Defense Stat".
