# compendium-hub Specification

## Purpose

The home page gives readers a clear start for finding the map and published reference facts. It keeps links tied to available pages and captured level data.

## Requirements

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
- **THEN** the Mechanics section lists Adventurers, Character Progression, Corruption, Crafting and Gathering, Heroic Tier, and Loot, each linking its page with a sentence on what it explains
- **AND** an "All 10 mechanics" link beside the heading opens the mechanics list

### Requirement: Level entry uses published place facts

The hub SHALL show a place's level range only when the publication records that range. Each place outside the dungeons that has a range SHALL appear as a tile with its artwork, its range, a link to its published page, and its counts of creatures and quests, ordered by range, with places that record no creature and no quest after the others; the first eight tiles SHALL show, with a Show N more control for the rest. A reader MAY enter a character level, saved with the level that the mechanics calculators use; the tiles SHALL follow each keystroke without moving focus, the places whose recorded range contains the level SHALL come first and carry a mark, and an empty field SHALL forget the level. A place without a recorded range SHALL remain reachable through the Places list. The hub SHALL distinguish an authored range from advice about where a character should go.

#### Scenario: Place has a published level range
- **WHEN** a published place has a level range
- **THEN** the hub shows the recorded range beside a link to that place
- **AND** it makes no claim that the place is best for that level

#### Scenario: Place has no level range
- **WHEN** a published place has no level range
- **THEN** its page remains reachable through the Places list
- **AND** the hub does not invent a range for it

#### Scenario: Reader enters a character level
- **WHEN** a reader enters level 25 on the hub
- **THEN** the places whose recorded range contains 25 come first, each marked, and the others follow in range order
- **AND** no place is described as the best place for that level

### Requirement: Featured entities share reference previews

A featured place, boss, zone, class, skill, or mechanics page on the hub SHALL use the site's entity link when that page is published. Its visual card or tile layout SHALL remain a navigable group without adding a second bespoke hover surface. A dungeon card, class tile, or skill tile SHALL open its page from a click anywhere on it, SHALL NOT open a hover card, and SHALL show that it links by its own highlight, without an underline on its name. The boss links inside a dungeon card SHALL open their own pages and keep their hover cards, and each boss name SHALL stay on one line, ending in an ellipsis when it is too long. Merchants SHALL NOT be among the earliest or most prominent hub sections.

#### Scenario: Hover a featured dungeon boss
- **WHEN** a desktop reader hovers the published boss name on the home page
- **THEN** the same hover card available in catalog rows opens beside the name

#### Scenario: Click the empty part of a card
- **WHEN** a reader clicks the artwork of a dungeon card, the empty space of a class tile, or the recipe count of a skill tile
- **THEN** the page of that dungeon, class, or skill opens
- **AND** a click on a boss name inside a dungeon card opens that boss's page, while a click beside it opens the dungeon

#### Scenario: Point at a card
- **WHEN** a desktop reader points at a dungeon card, class tile, or skill tile outside its boss names
- **THEN** the card is highlighted, no hover card opens, and its name gains no underline

#### Scenario: Long boss name
- **WHEN** a dungeon card names Vhorast the Grave-Caller in a narrow column
- **THEN** the name stays on one line beside its portrait and ends in an ellipsis
- **AND** its hover card shows the whole name
