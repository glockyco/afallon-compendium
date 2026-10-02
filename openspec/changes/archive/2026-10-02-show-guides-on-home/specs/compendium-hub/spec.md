## MODIFIED Requirements

### Requirement: Home is a searchable compendium hub

The route `/` SHALL show compendium search at the top of its main content. It SHALL give direct entries to the map, places by published level range, classes, crafting and gathering, and browse tiles for the reference lists. Guides SHALL NOT appear among the browse tiles. A Mechanics section after crafting and gathering SHALL instead list every guide of the Browse menu, in its order, with the published sentence that says what the guide explains. It SHALL NOT load the interactive map as its main content. It SHALL NOT rank routes, places, classes, recipes, or items as best. It SHALL NOT show an arbitrary sample of individual recipes.

#### Scenario: Reader opens home
- **WHEN** a reader opens `/`
- **THEN** the reader sees search before the entry groups
- **AND** the reader can follow a map entry to `/map`
- **AND** the reader can reach each published reference list from the browse tiles, and each guide from the Browse menu

#### Scenario: Reader looks for crafting and gathering
- **WHEN** a reader follows the crafting and gathering entry
- **THEN** the entry leads to the Recipes list, the skills, and map resource categories
- **AND** the entry names no individual recipe

#### Scenario: Guides on the home page
- **WHEN** a reader opens the home page
- **THEN** the Mechanics section lists Adventurers, Character Progression, Crafting and Gathering, Corruption, Heroic Tier, and Loot, each linking its guide with a sentence on what it explains
