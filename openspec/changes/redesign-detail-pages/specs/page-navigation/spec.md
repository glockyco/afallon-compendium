## MODIFIED Requirements

### Requirement: Anchors reveal their owner tab

A link to a section or row inside a hidden tab, collapsed relation preview, or closed details block SHALL reveal its owner before scrolling. A fragment SHALL take priority over a conflicting `tab` value, replacing the latter without adding a second history entry. Repeated clicks on the same fragment SHALL also reveal and reach the target. An unknown fragment SHALL NOT change the selected tab or expand unrelated content.

#### Scenario: Direct link to a talent row
- **WHEN** a class link names `#talent-21-5` inside a hidden talent tree tab
- **THEN** its owner tab becomes visible and the row scrolls into view

#### Scenario: Conflicting tab and anchor
- **WHEN** a link uses `?tab=grid#talent-21-5` but the row belongs to List
- **THEN** List is selected and `tab=list` replaces the conflicting value while retaining the fragment and other query parameters

#### Scenario: Row beyond the preview
- **WHEN** a fragment names row 20 inside a hidden tab or collapsed eight-row preview
- **THEN** its owner tab and full relation open, and the row scrolls into view

#### Scenario: Row beyond the table limit
- **WHEN** a fragment names a row beyond the first eight in a hidden tab
- **THEN** its owner tab opens, its relation reveals the row, and the row scrolls into view

#### Scenario: Unknown anchor
- **WHEN** a fragment names no target
- **THEN** the tab chosen by the query remains selected and unrelated disclosures remain closed

### Requirement: Long detail pages offer floating section navigation

A detail page SHALL offer section navigation only when at least four navigable relation sections render. A compact lower-right control SHALL name the section the reader is in and name the last section at the page end. It SHALL show Back to top and one numbered link per rendered, navigable section in page order, with its reader-facing heading; current state SHALL be marked with more than color. The control SHALL not list a side panel, an answer without a section anchor, or a hidden-only heading as a separate section. Its links SHALL reveal any owner tab or collapsed preview before scrolling, then close the control. Escape and a press outside SHALL close it; Escape SHALL restore focus. The control SHALL work with touch and keyboard without covering content or causing horizontal page scroll at 390 px.

#### Scenario: Four rendered sections on a desktop
- **WHEN** a detail page renders four navigable sections at 1440 px
- **THEN** the control lists those four and Back to top while the page retains its main and side columns

#### Scenario: Current section
- **WHEN** a reader scrolls past the upper quarter of Shieldmaster's Plaguebearer tree
- **THEN** the closed control names Plaguebearer and the open one marks it current

#### Scenario: Four rendered sections on a phone
- **WHEN** a page has four sections at 390 px and a reader selects one
- **THEN** it reaches the heading, closes navigation, and does not scroll sideways

#### Scenario: Fewer than four sections
- **WHEN** only three navigable sections render
- **THEN** section navigation does not appear
