# page-navigation Specification

## Purpose

Give readers a reliable way to move among alternative views and sections of long pages. Keep links to a view or an anchored row usable when the reader opens them directly.

## Requirements

### Requirement: Tabs follow the address and browser history

A tab set SHALL store its selected tab in the `tab` query parameter after a tab change. An absent or unknown tab value SHALL select the first available tab. An unknown value SHALL be replaced with the selected key without adding history. Tab sets on the same page that share tab keys SHALL use one selection. Changing tabs SHALL add a browser history entry and preserve unrelated query parameters. A tab change SHALL clear an old fragment that belongs to a different view. Back and forward navigation SHALL restore the selected tab without moving keyboard focus unexpectedly.

#### Scenario: Direct tab link
- **WHEN** a reader opens a page with `?tab=grid` and Grid is an available tab
- **THEN** Grid is selected and its panel is visible on initial load

#### Scenario: Missing or unknown tab
- **WHEN** a reader opens a tab set without `tab` or with an unknown tab value
- **THEN** the first available tab is selected
- **AND** an unknown tab value is replaced in the current history entry

#### Scenario: Back and forward
- **WHEN** a reader selects Grid after List and uses Back and then Forward
- **THEN** List and then Grid become selected without another selection by the reader
- **AND** other query parameters retain their values

#### Scenario: Several trees share view tabs
- **WHEN** a class page has a List and Grid tab set for each talent tree and a reader selects Grid
- **THEN** each tree shows Grid and the address has one `tab=grid` value

### Requirement: Tabs work with a keyboard and screen reader

The control SHALL expose a named tab list, tabs with selected state, and a named panel for each tab. Only the selected panel SHALL be available to keyboard and screen-reader navigation. Left and Right arrow keys SHALL move focus and selection among tabs, wrapping at either end. Home and End SHALL select the first and last tab. Tab SHALL move from the selected tab into its visible panel or the next focusable control. Pointer and keyboard selection SHALL yield the same URL state and panel.

#### Scenario: Keyboard movement
- **WHEN** focus is on the last tab and the reader presses Right
- **THEN** focus and selection move to the first tab
- **AND** its panel is available to the screen reader

#### Scenario: Hidden panel
- **WHEN** a reader selects a different tab
- **THEN** the former panel is unavailable to keyboard and screen-reader navigation

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
