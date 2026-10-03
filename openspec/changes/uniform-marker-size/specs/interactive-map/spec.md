## MODIFIED Requirements

### Requirement: One registry owns marker presentation

Markers SHALL use recognizable glyph icons from the project's icon set, drawn as a glyph on a colored background, consistent with the sibling maps. One registry SHALL own each marker's icon, color, label, plural label, precedence, render order, and default visibility. Consumers SHALL read that registry. Every marker category SHALL draw at the same size, which only the reader's marker size setting changes, and its selection and hover highlights SHALL use that same size.

There SHALL NOT be a second registry, a compatibility mapping, or a per-consumer marker switch. Adding a category SHALL require one registry entry, and a test SHALL fail when a registered category has no rendered layer.

One row SHALL resolve to exactly one marker through a single resolution function, so overlapping categories cannot draw two markers for one place. Marker meaning SHALL NOT depend on color alone: each category SHALL be distinguishable by its glyph.

Render order SHALL be semantic, from terrain and areas, through paths and ranges, ordinary markers, important markers, to selection and hover highlights.

#### Scenario: A category is added
- **WHEN** a new category is registered with its icon and color
- **THEN** the map, result list, and category controls use that entry's icon and color
- **AND** no consumer carries its own icon or color mapping

#### Scenario: A registered category has no layer
- **WHEN** a category exists in the registry but no layer renders it
- **THEN** the registration test fails

#### Scenario: A reader cannot rely on color
- **WHEN** two categories are compared without color perception
- **THEN** their glyphs distinguish them
- **AND** the result list and details state the category in words

#### Scenario: A boss beside an enemy
- **WHEN** a boss marker and an enemy marker are visible at the same zoom and marker size setting
- **THEN** both markers draw at the same size
