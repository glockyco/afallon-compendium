## Purpose

Keep the compendium's page titles and explanatory text consistent across gallery and table views without changing game-provided names.

## ADDED Requirements

### Requirement: Titles and sentence text use their own casing

The site and publication SHALL use Title Case for title-like noun labels: page and document titles, noun-like headings, card and section titles, noun-like disclosure summaries, tooltip titles, navigation items, tabs, table column headers, buttons, and action links. Inside a title, a, an, the, and, but, or, nor, for, of, on, in, at, to, by, per, from, with, as, and vs SHALL remain lowercase unless first or last. A heading or disclosure summary phrased as a sentence or question SHALL instead use sentence case. Field labels, counts and result lines, card facts, placeholders, hints, chips, published filter values authored by the compendium, units, lead-ins continuing into content, descriptions, empty states, and errors SHALL use sentence case. Game-provided names and abbreviations such as NPCs, XP, and HP SHALL retain their spelling. The counted hidden-entries reveal action SHALL remain sentence case.

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
