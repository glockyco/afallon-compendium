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

A link to a section or row inside a hidden tab SHALL select its owner before scrolling to the target. The fragment SHALL take priority if `tab` names another tab. In that case, the address SHALL show the owner tab without adding a second history entry. A repeated click on the same fragment SHALL also reveal its target. Existing long-table row links SHALL still expand a hidden row before scrolling. An unknown fragment SHALL NOT change the selected tab.

#### Scenario: Direct link to a talent row
- **WHEN** a reader opens a class link with `#talent-21-5` and its tree is inside a hidden tab
- **THEN** the owner tab becomes visible and the talent row scrolls into view

#### Scenario: Conflicting tab and anchor
- **WHEN** a reader opens `?tab=grid#talent-21-5` and the talent row belongs to List
- **THEN** List becomes selected and `tab=list` replaces the conflicting value
- **AND** the fragment and unrelated query parameters remain in the address

#### Scenario: Row beyond the table limit
- **WHEN** a fragment names a row beyond the first 15 rows in a hidden tab
- **THEN** its owner tab opens, the table reveals the row, and the row scrolls into view

#### Scenario: Unknown anchor
- **WHEN** a fragment does not name a target in any tab
- **THEN** the tab chosen by the `tab` parameter stays selected

### Requirement: Long detail pages offer floating section navigation

A detail page SHALL offer section navigation only when at least four sections render. A compact control SHALL float at the lower right corner of the viewport and SHALL name the section that the reader is in. At the end of the page it SHALL name the last section. Opening the control SHALL show "Back to top" and one numbered link per rendered section, in page order, with the section's reader-facing heading, and SHALL mark the current section with more than color. A section link SHALL scroll to its section and close the control. Escape and a pointer press outside the control SHALL close it, and Escape SHALL return focus to the control. The control SHALL work with touch and keyboard. The section column SHALL keep the full width of the page content, and the page SHALL keep room below its last line for the control. The page SHALL NOT scroll sideways at 1440 px or 390 px.

#### Scenario: Four rendered sections on a desktop
- **WHEN** a detail page renders four sections at 1440 px and the reader opens the control
- **THEN** the control lists four numbered section links and "Back to top"
- **AND** the section cards keep the full width of the content column

#### Scenario: Current section
- **WHEN** a reader scrolls the Plaguebearer tree of the Necromancer page past the upper quarter of the viewport
- **THEN** the closed control names Plaguebearer
- **AND** the open control marks Plaguebearer as the current section

#### Scenario: Four rendered sections on a phone
- **WHEN** a detail page renders four sections at 390 px and the reader selects a section link in the control
- **THEN** the page reaches that heading, the control closes, and the page does not scroll sideways

#### Scenario: Fewer than four sections
- **WHEN** a detail page renders three sections
- **THEN** it shows no section navigation
