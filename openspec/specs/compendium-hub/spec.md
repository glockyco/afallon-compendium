# compendium-hub Specification

## Purpose

The home page gives readers a clear start for finding the map and published reference facts. It keeps links tied to available pages and captured level data.

## Requirements

### Requirement: Home is a searchable compendium hub

The route `/` SHALL show compendium search at the top of its main content.

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

#### Scenario: Home is a searchable compendium hub
- **WHEN** A reader loads `/` and inspects the start of its main content.
- **THEN** Compendium search is at the top.

### Requirement: Home provides direct reference entries

The route `/` SHALL give direct entries to the map, places by published level range, classes, crafting and gathering, and browse tiles for the reference lists.

#### Scenario: Home provides direct reference entries
- **WHEN** A reader examines the home entry groups.
- **THEN** Direct entries are available for the map, places by published level range, classes, crafting and gathering, and reference-list browse tiles.

### Requirement: Browse tiles exclude mechanics

Mechanics pages SHALL NOT appear among the browse tiles.

#### Scenario: Browse tiles exclude mechanics
- **WHEN** A publication includes mechanics pages and reference lists.
- **THEN** The home browse tiles do not include mechanics pages.

### Requirement: Featured mechanics section

A Mechanics section after crafting and gathering SHALL instead list the featured mechanics pages of the Browse menu, in alphabetical order, each with the published sentence that says what it explains, and SHALL link the list of all mechanics pages.

#### Scenario: Featured mechanics section
- **WHEN** The Browse menu features Loot and Crafting and Gathering mechanics pages.
- **THEN** A Mechanics section after crafting and gathering lists Crafting and Gathering before Loot, includes each published explanatory sentence, and links the list of all mechanics pages.

### Requirement: Mechanics are not called guides

No hub or navigation text SHALL call the mechanics pages guides.

#### Scenario: Mechanics are not called guides
- **WHEN** A reader encounters mechanics-page links in the hub and navigation.
- **THEN** The text does not call those pages guides.

### Requirement: Home does not embed the map as main content

The route `/` SHALL NOT load the interactive map as its main content.

#### Scenario: Home does not embed the map as main content
- **WHEN** A reader loads the home route.
- **THEN** The interactive map is not loaded as the main content.

### Requirement: Home does not rank options as best

The route `/` SHALL NOT rank routes, places, classes, recipes, or items as best.

#### Scenario: Home does not rank options as best
- **WHEN** A reader views home entries for places, classes, and crafting.
- **THEN** Home does not rank routes, places, classes, recipes, or items as best.

### Requirement: Home excludes arbitrary recipe samples

The route `/` SHALL NOT show an arbitrary sample of individual recipes.

#### Scenario: Home excludes arbitrary recipe samples
- **WHEN** A reader views the home crafting and gathering content.
- **THEN** It contains no arbitrary sample of individual recipes.
### Requirement: Level entry uses published place facts

The hub SHALL show a place's level range only when the publication records that range.

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

#### Scenario: Reader enters a level that no place covers
- **WHEN** a reader steps the hub's level from 31 to 45 in a version whose places reach level 31
- **THEN** the control accepts 45, no tile is marked, and the hub says that no place covers level 45 and that places go up to level 31

#### Scenario: Level entry uses published place facts
- **WHEN** A published place has no recorded level range.
- **THEN** The hub does not show a level range for that place.

### Requirement: Ranged places appear as informative tiles

Each place outside the dungeons that has a range SHALL appear as a tile with its artwork, its range, a link to its published page, and its counts of creatures and quests.

#### Scenario: Ranged places appear as informative tiles
- **WHEN** A place outside the dungeons has a published range.
- **THEN** Its tile shows its artwork, range, published page link, and counts of creatures and quests.

### Requirement: Place tiles follow range order

Place tiles SHALL be ordered by range, with places that record no creature and no quest after the others.

#### Scenario: Place tiles follow range order
- **WHEN** Place tiles include places with recorded creatures or quests and places recording neither.
- **THEN** The tiles are ordered by range, with places recording neither creatures nor quests after the others.

### Requirement: Place tiles reveal the remainder on demand

The first eight place tiles SHALL show, with a Show N more control for the rest.

#### Scenario: Place tiles reveal the remainder on demand
- **WHEN** There are twelve place tiles.
- **THEN** The first eight tiles show, with a Show 4 more control for the remaining tiles.

### Requirement: Character level entry shares calculator state

A reader MAY enter or step to a character level with the compact shared control. The chosen level SHALL be saved with the level that the mechanics calculators use.

#### Scenario: Character level entry shares calculator state
- **WHEN** A reader steps to a character level with the compact shared control.
- **THEN** The chosen level is saved with the level used by the mechanics calculators.

### Requirement: Level filtering preserves focus

The tiles SHALL follow each keystroke in the character level control without moving focus.

#### Scenario: Level filtering preserves focus
- **WHEN** A reader types a keystroke in the character level control.
- **THEN** The tiles update for that keystroke without moving focus.

### Requirement: Matching place ranges receive priority and marks

The places whose recorded range contains the chosen character level SHALL come first and carry a mark.

#### Scenario: Matching place ranges receive priority and marks
- **WHEN** The chosen character level is contained in some places' recorded ranges.
- **THEN** Those places come first and carry a mark.

### Requirement: Clearing level entry forgets the level

An empty character level field SHALL forget the level.

#### Scenario: Clearing level entry forgets the level
- **WHEN** A reader clears the character level field.
- **THEN** The chosen level is forgotten.

### Requirement: Level control reaches the character cap

The character level control SHALL reach the character level cap.

#### Scenario: Level control reaches the character cap
- **WHEN** A reader enters the character level cap in the level control.
- **THEN** The control accepts the character level cap.

### Requirement: Uncovered levels report published reach

When no place or dungeon covers the chosen level, the hub SHALL say so and name the highest level that places reach.

#### Scenario: Uncovered levels report published reach
- **WHEN** A reader chooses a level covered by no place or dungeon, and places reach level 31.
- **THEN** The hub says that no place or dungeon covers the chosen level and that places reach level 31.

### Requirement: Unranged places remain reachable

A place without a recorded range SHALL remain reachable through the Places list.

#### Scenario: Unranged places remain reachable
- **WHEN** A place has no recorded range.
- **THEN** The place remains reachable through the Places list.

### Requirement: Authored ranges remain distinct from advice

The hub SHALL distinguish an authored range from advice about where a character should go.

#### Scenario: Authored ranges remain distinct from advice
- **WHEN** The hub displays an authored place range.
- **THEN** The hub distinguishes that range from advice about where a character should go.
### Requirement: Featured entities share reference previews

A featured place, boss, zone, class, skill, or mechanics page on the hub SHALL use the site's entity link when that page is published.

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

#### Scenario: Featured entities share reference previews
- **WHEN** The hub features a published mechanics page.
- **THEN** The featured page uses the site's entity link.

### Requirement: Featured layouts remain navigable groups

A featured page's visual card or tile layout SHALL remain a navigable group without adding a second bespoke hover surface.

#### Scenario: Featured layouts remain navigable groups
- **WHEN** A featured page appears in a visual card layout.
- **THEN** The layout remains a navigable group without a second bespoke hover surface.

### Requirement: Cards open their pages from anywhere

A dungeon card, class tile, or skill tile SHALL open its page from a click anywhere on it, except that boss links inside a dungeon card SHALL open their own pages.

#### Scenario: Cards open their pages from anywhere
- **WHEN** A reader clicks empty space in a class tile.
- **THEN** The class page opens.

### Requirement: Cards signal links without hover cards

A dungeon card, class tile, or skill tile SHALL NOT open a hover card and SHALL show that it links by its own highlight, without an underline on its name. Boss links inside a dungeon card SHALL keep their hover cards.

#### Scenario: Cards signal links without hover cards
- **WHEN** A reader points at a skill tile.
- **THEN** The tile shows its own link highlight without underlining its name or opening a hover card.

### Requirement: Boss links retain independent navigation and previews

The boss links inside a dungeon card SHALL open their own pages and keep their hover cards.

#### Scenario: Boss links retain independent navigation and previews
- **WHEN** A reader clicks a boss link inside a dungeon card.
- **THEN** The boss's own page opens.

### Requirement: Boss names truncate on one line

Each boss name inside a dungeon card SHALL stay on one line, ending in an ellipsis when it is too long.

#### Scenario: Boss names truncate on one line
- **WHEN** A boss name is too long for its space in a dungeon card.
- **THEN** The boss name stays on one line and ends in an ellipsis.

### Requirement: Merchants avoid primary hub prominence

Merchants SHALL NOT be among the earliest or most prominent hub sections.

#### Scenario: Merchants avoid primary hub prominence
- **WHEN** The hub displays its sections.
- **THEN** Merchants are not among the earliest or most prominent sections.
