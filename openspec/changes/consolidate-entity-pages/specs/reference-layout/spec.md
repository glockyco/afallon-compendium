## ADDED Requirements

### Requirement: Tooltips fit their content and the viewport

An entity tooltip SHALL be positioned from its measured size. It SHALL open on the side of its anchor with more room, stay inside the viewport, and reposition when its content loads, the page scrolls, or the viewport resizes. Its height SHALL be limited only by the available space, and it SHALL scroll only when the content does not fit on either side.

#### Scenario: Link near the bottom of the window
- **WHEN** a player hovers a link near the bottom of the window
- **THEN** the tooltip opens above the link with the height of its content
- **AND** it does not stretch to the top of the window

#### Scenario: Content loads after opening
- **WHEN** a tooltip's document loads after the tooltip opens
- **THEN** the tooltip repositions to fit the loaded content

### Requirement: Quest previews stay short

A quest tooltip SHALL shorten the completion text to the same length as the description.

#### Scenario: Long completion text
- **WHEN** a quest has a completion text of several sentences
- **THEN** the tooltip shows a shortened completion text

### Requirement: Quest pages show no empty or constant columns

A quest page table SHALL NOT show a column that is empty in every row or has the same value in every row. The offer text and the completion text SHALL appear in one section. The header and the sections SHALL share one content width.

#### Scenario: Rewards without choices
- **WHEN** every reward of a quest is a plain reward
- **THEN** the rewards table has no role column

#### Scenario: No objective has a completion place
- **WHEN** no objective of a quest names where it completes
- **THEN** the objectives table has no "Completed at" column
