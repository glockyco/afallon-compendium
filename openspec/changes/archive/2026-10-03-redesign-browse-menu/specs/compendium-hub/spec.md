## MODIFIED Requirements

### Requirement: Home is a searchable compendium hub

The route `/` SHALL show compendium search at the top of its main content. It SHALL give direct entries to the map, places by published level range, classes, crafting and gathering, and browse tiles for the reference lists. Mechanics pages SHALL NOT appear among the browse tiles. A Mechanics section after crafting and gathering SHALL instead list the featured mechanics pages of the Browse menu, in alphabetical order, each with the published sentence that says what it explains, and SHALL link the list of all mechanics pages. No hub or navigation text SHALL call the mechanics pages guides. It SHALL NOT load the interactive map as its main content. It SHALL NOT rank routes, places, classes, recipes, or items as best. It SHALL NOT show an arbitrary sample of individual recipes.

#### Scenario: Reader opens home
- **WHEN** a reader opens `/`
- **THEN** the reader sees search before the entry groups
- **AND** the reader can follow a map entry to `/map`
- **AND** the reader can reach each published reference list from the browse tiles, and every mechanics page from the Mechanics list

#### Scenario: Reader looks for crafting and gathering
- **WHEN** a reader follows the crafting and gathering entry
- **THEN** the entry leads to the Recipes list, the skills, and map resource categories
- **AND** the entry names no individual recipe

#### Scenario: Guides on the home page
- **WHEN** a reader opens the home page of a publication with ten mechanics pages
- **THEN** the Mechanics section lists Adventurers, Character Progression, Corruption, Crafting and Gathering, Factions and Reputation, and Loot, each linking its page with a sentence on what it explains
- **AND** an "All 10 mechanics" link beside the heading opens the mechanics list
