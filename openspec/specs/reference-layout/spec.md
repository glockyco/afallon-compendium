# reference-layout Specification

## Purpose

Define the shared layout rules of tooltips, quest previews, search feedback, and navigation.

## Requirements

### Requirement: Tooltips open beside their links

On desktop, an entity tooltip SHALL start at `right-start` relative to its link. When the right side lacks room, it SHALL use `left-start`. It SHALL NOT open above or below its link, and it SHALL shift only vertically to stay inside the viewport. Its position and available height SHALL update when its document loads, the page scrolls, or the viewport resizes. Only one tooltip SHALL be open at a time, and a tooltip SHALL close when the pointer leaves both its link and the tooltip, even if the link has focus. On narrow screens, it SHALL use a fixed bottom overlay.

#### Scenario: Nearby table rows
- **WHEN** a reader opens a tooltip from a desktop relation-table row with room on the right
- **THEN** the tooltip opens to the right of the link instead of covering the next rows

#### Scenario: A link near the right edge
- **WHEN** a reader opens a tooltip from a link with no room on its right
- **THEN** the tooltip opens to the left of the link

#### Scenario: Pointer moves to the next link
- **WHEN** a reader clicks a link and then moves the pointer to another link
- **THEN** the first tooltip closes and only the second tooltip stays open

#### Scenario: Content loads after opening
- **WHEN** a tooltip's document loads after the tooltip opens
- **THEN** the tooltip recomputes its position and height

### Requirement: Quest previews keep completion text short

A quest tooltip SHALL limit its completion text to four visible lines.

#### Scenario: Long completion text
- **WHEN** a quest has completion text longer than four visible lines
- **THEN** the tooltip clips the completion text after four lines

### Requirement: Search and map navigation stay in place

Search SHALL show a spinner inside its input while loading, without changing page height. The site navigation SHALL name its map "Map". All reader text SHALL call the interactive map "the map" and SHALL NOT call it "the atlas".

#### Scenario: Search data is loading
- **WHEN** a reader starts a search before its data loads
- **THEN** the input displays a loading spinner
- **AND** the navigation link to the map reads "Map"

#### Scenario: Link to a map location
- **WHEN** a page links a character's location on the map
- **THEN** the link reads "View on map"
