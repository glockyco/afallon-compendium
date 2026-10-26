# page-navigation Specification

## Purpose

Give readers a reliable way to move among alternative views and sections of long pages. Keep links to a view or an anchored row usable when the reader opens them directly.

## Requirements

### Requirement: Tabs follow the address and browser history

A tab set SHALL store its selected tab in the `tab` query parameter after a tab change.

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

#### Scenario: Tabs follow the address and browser history
- **WHEN** A reader changes the selected tab to Grid.
- **THEN** The `tab` query parameter stores Grid's tab key.

### Requirement: First available tab fallback

An absent or unknown tab value SHALL select the first available tab.

#### Scenario: First available tab fallback
- **WHEN** A reader opens a tab set with an unknown `tab` value and List is the first available tab.
- **THEN** List is selected.

### Requirement: Unknown tab address correction

An unknown tab value SHALL be replaced with the selected key without adding history.

#### Scenario: Unknown tab address correction
- **WHEN** A reader opens a tab set with an unknown `tab` value.
- **THEN** The unknown value is replaced with the selected tab key without adding a history entry.

### Requirement: Shared tab selection

Tab sets on the same page that share tab keys SHALL use one selection.

#### Scenario: Shared tab selection
- **WHEN** Two tab sets on a page share List and Grid keys and a reader selects Grid in one.
- **THEN** Both tab sets use the Grid selection.

### Requirement: Tab change history entry

Changing tabs SHALL add a browser history entry.

#### Scenario: Tab change history entry
- **WHEN** A reader changes from List to Grid.
- **THEN** The change adds a browser history entry.

### Requirement: Unrelated query parameter preservation

Changing tabs SHALL preserve unrelated query parameters.

#### Scenario: Unrelated query parameter preservation
- **WHEN** A reader changes tabs on a page whose address includes an unrelated query parameter.
- **THEN** The unrelated query parameter retains its value.

### Requirement: Stale view fragment clearing

A tab change SHALL clear an old fragment that belongs to a different view.

#### Scenario: Stale view fragment clearing
- **WHEN** A reader changes tabs while the address contains a fragment belonging to the previous view.
- **THEN** The old fragment is cleared.

### Requirement: History restores tabs without unexpected focus movement

Back and forward navigation SHALL restore the selected tab without moving keyboard focus unexpectedly.

#### Scenario: History restores tabs without unexpected focus movement
- **WHEN** A reader changes from List to Grid, then navigates Back and Forward.
- **THEN** List and then Grid are restored without unexpected keyboard focus movement.

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

A detail page SHALL offer section navigation only when at least four navigable relation sections render.

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

#### Scenario: Long detail pages offer floating section navigation
- **WHEN** A detail page renders only two navigable relation sections.
- **THEN** The page does not offer section navigation.

### Requirement: Responsive current section naming

A compact lower-right control SHALL name the section the reader is in and name the last section at the page end: in its visible label where the screen is at least 1800 px wide, and otherwise in the accessible name of a round button.

#### Scenario: Responsive current section naming
- **WHEN** A reader reaches the page end on a screen 1800 px wide.
- **THEN** The compact lower-right control names the last section in its visible label.

### Requirement: Rendered section navigation links

The section navigation control SHALL show Back to top and one numbered link per rendered, navigable section in page order, with its reader-facing heading.

#### Scenario: Rendered section navigation links
- **WHEN** A reader opens section navigation on a page with five rendered, navigable sections.
- **THEN** The control shows Back to top and five numbered links in page order, each using its section's reader-facing heading.

### Requirement: Non-color current section indication

The section navigation control SHALL mark current state with more than color.

#### Scenario: Non-color current section indication
- **WHEN** A reader opens section navigation while within a rendered section.
- **THEN** The current section is marked with more than color.

### Requirement: Excluded section navigation entries

The section navigation control SHALL not list a side panel, an answer without a section anchor, or a hidden-only heading as a separate section.

#### Scenario: Excluded section navigation entries
- **WHEN** A detail page includes a side panel, an answer without a section anchor, and a hidden-only heading.
- **THEN** None of those items is listed as a separate section in section navigation.

### Requirement: Reveal section destinations before scrolling

The section navigation control's links SHALL reveal any owner tab or collapsed preview before scrolling, then close the control.

#### Scenario: Reveal section destinations before scrolling
- **WHEN** A reader selects a section link whose target is in a collapsed preview within an inactive owner tab.
- **THEN** The owner tab and collapsed preview are revealed before scrolling to the section, then the control closes.

### Requirement: Section navigation dismissal

Escape and a press outside SHALL close the section navigation control.

#### Scenario: Section navigation dismissal
- **WHEN** A reader presses outside the open section navigation control.
- **THEN** The control closes.

### Requirement: Escape restores navigation focus

Escape SHALL restore focus when closing the section navigation control.

#### Scenario: Escape restores navigation focus
- **WHEN** A reader closes the open section navigation control with Escape.
- **THEN** Focus is restored.

### Requirement: Touch and keyboard section navigation

The section navigation control SHALL work with touch and keyboard without causing horizontal page scroll at 390 px.

#### Scenario: Touch and keyboard section navigation
- **WHEN** A reader operates section navigation using touch and then keyboard on a 390 px wide page.
- **THEN** The control works with both input methods without causing horizontal page scroll.

### Requirement: Section controls keep clear of content

The section navigation control SHALL keep clear of content as the detail-pages requirement on section controls describes.

#### Scenario: Section controls keep clear of content
- **WHEN** A detail page displays its section navigation control.
- **THEN** The control keeps clear of content as the detail-pages requirement on section controls describes.
