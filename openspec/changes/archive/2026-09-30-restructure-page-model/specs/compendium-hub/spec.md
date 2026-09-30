## MODIFIED Requirements

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
