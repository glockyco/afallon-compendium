# compendium-hub Specification

## Purpose

The home page gives readers a clear start for finding the map and published reference facts. It keeps links tied to available pages and captured level data.

## Requirements

### Requirement: Home is a searchable compendium hub

The route `/` SHALL show compendium search at the top of its main content. It SHALL give direct entries to the map, places by published level range, classes, crafting and gathering, and browse lists. It SHALL NOT load the interactive map as its main content. It SHALL NOT rank routes, places, classes, recipes, or items as best.

#### Scenario: Reader opens home
- **WHEN** a reader opens `/`
- **THEN** the reader sees search before the entry groups
- **AND** the reader can follow a map entry to `/map`
- **AND** the reader can reach each published list kind from the hub

#### Scenario: Reader looks for crafting and gathering
- **WHEN** a reader follows the crafting and gathering entry
- **THEN** the entry leads to the Recipes list, the skills, the Crafting and Gathering guide, and map resource categories
- **AND** a recipe link on the hub leads to the Crafting section of its product

### Requirement: Level entry uses published place facts

The hub SHALL show a place's level range only when the publication records that range. It SHALL link each shown place to its published page. A place without a recorded range SHALL remain reachable through the Places list. The hub SHALL distinguish an authored range from advice about where a character should go.

#### Scenario: Place has a published level range
- **WHEN** a published place has a level range
- **THEN** the hub shows the recorded range beside a link to that place
- **AND** it makes no claim that the place is best for that level

#### Scenario: Place has no level range
- **WHEN** a published place has no level range
- **THEN** its page remains reachable through the Places list
- **AND** the hub does not invent a range for it
