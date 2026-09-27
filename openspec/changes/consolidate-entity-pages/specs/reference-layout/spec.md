## ADDED Requirements

### Requirement: Entity pages share one header

Every entity page SHALL use one header style. The header SHALL show only available real artwork, the title, one facts line, and an optional description. Each fact SHALL support an optional label and an optional link. The header SHALL NOT insert a fallback glyph, badge, or pill.

#### Scenario: Entity has no artwork
- **WHEN** an entity has no artwork
- **THEN** the header shows its title without an empty image box or a substitute glyph

#### Scenario: A place has a map link
- **WHEN** a place has a published map label
- **THEN** its header may show a labeled Map fact linked to that location

### Requirement: Tooltips open beside their links

On desktop, an entity tooltip SHALL start at `right-start` relative to its link. It SHALL try `left-start`, `bottom-start`, and `top-start` when needed, then shift inside the viewport. Its position and available height SHALL update when its document loads, the page scrolls, or the viewport resizes. On narrow screens, it SHALL use a fixed bottom overlay.

#### Scenario: Nearby table rows
- **WHEN** a reader opens a tooltip from a desktop relation-table row with room on the right
- **THEN** the tooltip opens to the right of the link instead of covering the next rows

#### Scenario: Content loads after opening
- **WHEN** a tooltip's document loads after the tooltip opens
- **THEN** the tooltip recomputes its position and height

### Requirement: Quest previews keep completion text short

A quest tooltip SHALL limit its completion text to four visible lines.

#### Scenario: Long completion text
- **WHEN** a quest has completion text longer than four visible lines
- **THEN** the tooltip clips the completion text after four lines

### Requirement: Quest pages use a coherent layout

Start, Turn-in, and Requirements SHALL use the same card style. The quest chain SHALL appear as a labeled header fact with its step when available. Objective completion columns SHALL appear only when a completion exists. Plain rewards SHALL not show a role column. Offer, objective, and completion prose SHALL appear together in the Quest text card.

#### Scenario: A quest belongs to a chain
- **WHEN** a quest has a chain name and a known step
- **THEN** its header shows a Chain fact with the step and total number of quests

#### Scenario: No objective has a completion location
- **WHEN** no objective has a completion location
- **THEN** the objectives table omits the completion column

### Requirement: Search and map navigation stay in place

Search SHALL show a spinner inside its input while loading, without changing page height. The site navigation SHALL name its map “Map”.

#### Scenario: Search data is loading
- **WHEN** a reader starts a search before its data loads
- **THEN** the input displays a loading spinner
- **AND** the navigation link to the atlas reads “Map”
