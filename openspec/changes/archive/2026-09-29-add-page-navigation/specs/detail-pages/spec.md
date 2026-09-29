## MODIFIED Requirements

### Requirement: Detail pages share one structure

Every entity detail page SHALL show the breadcrumb, the title block, an optional hero, and its sections. A page with at least four rendered sections SHALL also show "On this page" navigation beside the section column on a wide screen and above the sections on a narrow screen. The title block, the hero, and each section SHALL use the full width of the page content column. A page SHALL NOT place two cards side by side.

#### Scenario: Item page on a wide screen
- **WHEN** a reader opens an item page in a window that is 1440 px wide
- **THEN** the title block, the hero, and each source section use the full width of the page content column
- **AND** no two cards share a row
- **AND** an "On this page" list appears beside the sections if at least four sections render

#### Scenario: Page with one short section
- **WHEN** a page has one section with one row
- **THEN** that section uses the full width of the page content column without a card beside it
- **AND** the page has no "On this page" list

#### Scenario: Detail page on a phone
- **WHEN** a class page with at least four sections opens at 390 px
- **THEN** the "On this page" control precedes the sections without placing cards side by side

## ADDED Requirements

### Requirement: Existing long detail pages use section navigation

Class, NPC, place, and item pages SHALL apply the section-list rule to their actual rendered sections. Conditional sections SHALL enter or leave the list with their content. Existing section IDs and row anchors SHALL remain the targets of links. A class page SHALL list its individual talent tree sections until another change gives them tabbed views. Its list SHALL adapt when a later change removes Experience.

#### Scenario: Class talent sections
- **WHEN** Shieldmaster shows its talent tree sections, Starting gear, and Experience
- **THEN** the list names each rendered section in the same order as the page
- **AND** selecting a tree name reaches that tree's existing section anchor

#### Scenario: NPC without stock
- **WHEN** an NPC has no vendor stock but at least four other sections render
- **THEN** the list contains no Sells link
- **AND** it links to each rendered section, including Where to find

#### Scenario: Place and item source sections
- **WHEN** a place or item page has at least four rendered sections
- **THEN** its list names only the sections that appear on that page
- **AND** a link to a rendered section reaches its existing anchor
