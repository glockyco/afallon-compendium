## Purpose

Let visitors resize atlas markers for their screen and map density while keeping placement selection and shared views consistent.

## ADDED Requirements

### Requirement: One map option changes marker size

The atlas SHALL provide a labeled Marker Size slider under Map Options. Its range SHALL be 50% through 200%, with a 100% default, a visible percentage, and a reset action. The displayed 100% SHALL render at the former 140% size; 50% SHALL render at the former 70% size, and 200% at the former 280% size. Changing it SHALL resize all map placement icons and their selection and hover outlines without changing marker categories, result counts, or selection targets.

#### Scenario: Visitor enlarges markers
- **WHEN** a visitor moves the slider from 100% to 200%
- **THEN** map placement icons and their selection or hover outlines become larger together
- **AND** the visible placement count and selected placement do not change

#### Scenario: Visitor reduces marker clutter
- **WHEN** a visitor moves the slider from 100% to 50%
- **THEN** map placement icons and their selection or hover outlines become smaller together
- **AND** the marker glyphs remain legible and selectable

### Requirement: Marker size follows the atlas URL

The atlas SHALL include nondefault marker size in its URL and restore it when that URL opens or reloads. At 100%, the URL SHALL omit the size parameter. An invalid or out-of-range URL value SHALL use 100% instead of breaking the map. Adjusting the slider SHALL not add an individual browser history entry for every intermediate value.

#### Scenario: Shared size survives reload
- **WHEN** a visitor selects 125% and reloads or shares the resulting URL
- **THEN** the atlas opens with the slider and map markers at 125%

#### Scenario: Default size keeps a short URL
- **WHEN** a visitor returns the slider to 100%
- **THEN** the atlas removes the size parameter from its URL

#### Scenario: Size in URL is invalid
- **WHEN** an atlas URL contains a malformed or out-of-range marker size
- **THEN** the atlas uses the 100% size and remains interactive
