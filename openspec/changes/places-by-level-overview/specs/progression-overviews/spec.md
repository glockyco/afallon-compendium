## Purpose

Offer a level-aware way to choose destinations and other progression entries while preserving the complete catalog view and entries with incomplete level facts.

## ADDED Requirements

### Requirement: Shared Level Progression View
The site SHALL support a progression overview that orders entries by known level range, places their ranges proportionally on a common labeled level axis, and groups entries by a published category where useful. Overlapping ranges SHALL remain distinct entries. Entries without a known range SHALL appear in a separate visible unknown-range group, not at the first level.

#### Scenario: Overlapping and unknown ranges
- **WHEN** entries have overlapping ranges and one entry has no published range
- **THEN** each known entry shows its own bar at its published start and end, and the unknown entry appears outside the level axis under an unknown-range heading

### Requirement: Places By Level
The Places overview SHALL default to the level progression view, show place types and available boss counts, and link each place with a published map space to its map. A visible Your Level control SHALL read and update the remembered character level and mark ranges containing that level without filtering or removing other entries.

#### Scenario: Reader chooses a level
- **WHEN** a reader sets Your Level to a positive level
- **THEN** the level marker and matching known ranges update, while other places and unknown-range places remain visible

#### Scenario: Place without a map space
- **WHEN** a place has no published map space
- **THEN** its place link remains visible without an invented map destination

### Requirement: Complete Table Alternative
The Places overview SHALL retain its searchable, facet-filterable, sortable full table as a URL-addressable alternate view, with a visible way to switch between views.

#### Scenario: Reader opens the table
- **WHEN** a reader opens the table view, including via a direct URL
- **THEN** all existing table filtering and sorting controls remain available, and a visible link returns to the level view
