# progression-overviews Specification

## Purpose
Offer a level-aware way to choose destinations and other progression entries while preserving the complete catalog view and entries with incomplete level facts.

## Requirements

### Requirement: Shared Level Progression View
The site SHALL support a progression overview that orders entries by known level range, places their ranges proportionally on a common labeled level axis, and groups entries by a published category where useful. Overlapping ranges SHALL remain distinct entries. Entries without a known range SHALL appear in a separate visible unknown-range group, not at the first level.

#### Scenario: Overlapping and unknown ranges
- **WHEN** entries have overlapping ranges and one entry has no published range
- **THEN** each known entry shows its own bar at its published start and end, and the unknown entry appears outside the level axis under an unknown-range heading

#### Scenario: Labeled axis landmarks
- **WHEN** several known ranges appear within a place-type group
- **THEN** the group starts with an axis directly above its bars, with round-level labels above unobstructed ticks and matching grid lines showing where bars fall
- **AND** the reader's chosen level appears as a labeled marker above the first group's tick labels, not as a separate result label

### Requirement: Places By Level

The Places overview SHALL default to the level progression view.

#### Scenario: Reader chooses a level
- **WHEN** a reader sets Your Level to a positive level
- **THEN** the level marker and matching known ranges update, while other places and unknown-range places remain visible

#### Scenario: Reader chooses a level that no place covers
- **WHEN** a reader steps Your Level from 31 to 45 in a version whose places reach level 31
- **THEN** the marker moves to 45, no range is marked, and the page says that no place covers level 45 and that places go up to level 31

#### Scenario: Place type groups
- **WHEN** published Zones and Dungeons have known level ranges
- **THEN** they appear under plural headings with each group's count, and entries without a known range remain under Level Range Unknown

#### Scenario: Compact phone range rows
- **WHEN** a reader views Places on a narrow screen
- **THEN** a range bar, its numeric label, and a compact map link share one line, while boss facts remain available below it

#### Scenario: Place without a map space
- **WHEN** a place has no published map space
- **THEN** its place link remains visible without an invented map destination

#### Scenario: Published place artwork
- **WHEN** a place has published artwork
- **THEN** its row uses that artwork as its only identity image
- **AND** a place without artwork shows one kind glyph instead of an empty image

#### Scenario: Places By Level
- **WHEN** A reader opens the Places overview without choosing a view.
- **THEN** The level progression view is shown.

### Requirement: Place types and boss counts

The Places overview SHALL show place types and available boss counts.

#### Scenario: Place types and boss counts
- **WHEN** The Places overview displays a place with an available boss count.
- **THEN** The overview shows the place's type and boss count.

### Requirement: Published place map links

The Places overview SHALL link each place with a published map space to its map.

#### Scenario: Published place map links
- **WHEN** The Places overview displays a place with a published map space.
- **THEN** The place links to its map.

### Requirement: Remembered character level control

A visible Your Level control SHALL read and update the remembered character level.

#### Scenario: Remembered character level control
- **WHEN** A reader opens Places with a remembered character level of 12 and changes Your Level to 15.
- **THEN** The visible Your Level control reads 12 initially and updates the remembered character level to 15.

### Requirement: Matching ranges without filtering

The Your Level control SHALL mark ranges containing the remembered character level without filtering or removing other entries.

#### Scenario: Matching ranges without filtering
- **WHEN** A reader chooses level 20 and some displayed ranges contain that level while others do not.
- **THEN** The ranges containing level 20 are marked and other entries remain unfiltered and present.

### Requirement: Character level cap reachability

The Your Level control SHALL reach the character level cap even beyond the highest recorded range.

#### Scenario: Character level cap reachability
- **WHEN** The character level cap exceeds the highest recorded place range and a reader sets Your Level to the cap.
- **THEN** The control reaches the character level cap.

### Requirement: Uncovered level explanation

When no range contains the chosen level, the page SHALL say so and name the highest level that places reach.

#### Scenario: Uncovered level explanation
- **WHEN** A reader chooses level 50 and no place range contains it, with places reaching level 40.
- **THEN** The page says no range contains level 50 and that places reach level 40.

### Requirement: Matching range highlight explanation

The page SHALL explain the matching-range highlight.

#### Scenario: Matching range highlight explanation
- **WHEN** A reader views Places with a matching range highlighted.
- **THEN** The page explains the matching-range highlight.
### Requirement: Complete Table Alternative
The Places overview SHALL retain its searchable, facet-filterable, sortable full table as a URL-addressable alternate view, with a visible way to switch between views.

#### Scenario: Reader opens the table
- **WHEN** a reader opens the table view, including via a direct URL
- **THEN** all existing table filtering and sorting controls remain available, and a visible link returns to the level view
