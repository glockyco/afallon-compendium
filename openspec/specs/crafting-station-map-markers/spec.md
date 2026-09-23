# Crafting Station Map Markers Specification

## Purpose

Let players find the right crafting service on the atlas without inspecting every station. Station markers reflect verified game records and remain useful when a reference is unresolved.

## Requirements

### Requirement: Station types have distinct map categories

The atlas SHALL offer separate marker categories and filters for Alchemy, Cooking, Smithing, Furnace (Metallurgy), and Tailoring. Each category SHALL have a distinct glyph and a text label. A placed station SHALL receive its category from its verified game station reference, not from a scene object name or a display label.

#### Scenario: Cooking and smithing are both present
- **WHEN** a map contains verified Cooking and Smithing stations
- **THEN** the map and results distinguish them by glyph and label
- **AND** each filter selects only its station type

#### Scenario: Furnace is not a smithing station
- **WHEN** a placed station references the Furnace record with the Metallurgy skill
- **THEN** it appears as Furnace, not Smithing

### Requirement: Rare stations are visible initially

The atlas SHALL show Alchemy, Smithing, Furnace, and Tailoring markers by default. Cooking and generic Crafting Station markers SHALL remain available but disabled by default.

#### Scenario: Atlas opens without a category filter
- **WHEN** a player opens the atlas without category selections
- **THEN** Alchemy, Smithing, Furnace, and Tailoring filters are enabled
- **AND** Cooking and generic Crafting Station filters are disabled

### Requirement: Unknown stations remain discoverable

A crafting service with no verified station reference or no supported station category SHALL retain a generic Crafting Station marker and filter. The atlas SHALL NOT infer a type from the station name, object name, or craft skill rows. A station type without a verified placement SHALL NOT add an empty type-specific filter.

#### Scenario: Station reference cannot be resolved
- **WHEN** a crafting service has an unresolved station reference
- **THEN** the placement remains discoverable under Crafting Station
- **AND** it does not appear under a named station filter

#### Scenario: An unplaced type exists in the catalog
- **WHEN** the catalog contains Savers but no verified Savers placement
- **THEN** the map does not expose a Savers filter

### Requirement: Station placements remain single markers

Each station placement SHALL have one station category. A placement with another service role SHALL still draw at most one physical marker. Counts, results, search, and URL-backed filters SHALL use the published station categories consistently.

#### Scenario: Station has an additional role
- **WHEN** a station placement also carries another enabled category
- **THEN** it draws one marker using the normal category precedence
- **AND** disabling the visible category can reveal the other enabled category

#### Scenario: Search finds a station by type
- **WHEN** a player searches for Cooking and enables the Cooking filter
- **THEN** verified Cooking placements appear in the results
- **AND** reloading the filtered URL preserves that selection
