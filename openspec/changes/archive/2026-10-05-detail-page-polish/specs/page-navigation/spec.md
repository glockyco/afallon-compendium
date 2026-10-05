## MODIFIED Requirements

### Requirement: Long detail pages offer floating section navigation

A detail page SHALL offer section navigation only when at least four navigable relation sections render. A compact lower-right control SHALL name the section the reader is in and name the last section at the page end: in its visible label where the screen is at least 1800 px wide, and otherwise in the accessible name of a round button. It SHALL show Back to top and one numbered link per rendered, navigable section in page order, with its reader-facing heading; current state SHALL be marked with more than color. The control SHALL not list a side panel, an answer without a section anchor, or a hidden-only heading as a separate section. Its links SHALL reveal any owner tab or collapsed preview before scrolling, then close the control. Escape and a press outside SHALL close it; Escape SHALL restore focus. The control SHALL work with touch and keyboard without causing horizontal page scroll at 390 px, and SHALL keep clear of content as the detail-pages requirement on section controls describes.

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
