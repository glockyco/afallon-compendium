# map-marker-sizing Specification

## Purpose

Let readers resize map placement markers for their screen and map density while preserving selection, filters, and shareable map state.

## Requirements

### Requirement: One map option changes marker size

The map SHALL provide a labeled Marker Size slider under Map Options, from 50% through 200%, with a 100% default, a visible percentage, and a reset action. The 100% setting SHALL scale placement icons to 140% of their unscaled base size; 50% SHALL scale them to 70%, and 200% SHALL scale them to 280%. Changing the slider SHALL resize placement icons and selection and hover outlines together without changing categories, result counts, or selection targets.

#### Scenario: Reader enlarges markers
- **WHEN** a reader moves the slider from 100% to 200%
- **THEN** map placement icons and selection and hover outlines grow together
- **AND** the result count and selected placement do not change

#### Scenario: Reader reduces marker clutter
- **WHEN** a reader moves the slider from 100% to 50%
- **THEN** placement icons and selection and hover outlines shrink together
- **AND** placement icons remain selectable

### Requirement: Marker size follows the map URL

The map SHALL include a nondefault marker size in its URL and restore that value when the URL opens or reloads. At 100%, it SHALL omit the marker-size parameter. A malformed or out-of-range parameter SHALL use 100%, and slider adjustments SHALL replace the current URL entry rather than pushing an entry for each intermediate value.

#### Scenario: Shared size survives reload
- **WHEN** a reader selects 125% and reloads or shares the resulting URL
- **THEN** the map opens with the slider and map markers at 125%

#### Scenario: Default size keeps a short URL
- **WHEN** a reader resets the slider to 100%
- **THEN** the map removes the marker-size parameter from its URL

#### Scenario: Size in URL is invalid
- **WHEN** a map URL contains a malformed or out-of-range marker size
- **THEN** the map uses 100% and remains interactive
