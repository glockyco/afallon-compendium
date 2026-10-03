## MODIFIED Requirements

### Requirement: Search and map navigation stay in place

Search SHALL show a spinner inside its input while loading, without changing page height. Its sentence-case placeholder SHALL name only kinds that are searchable in the current publication. The site navigation SHALL name its map "Map" and link to `/map`. All reader text SHALL call the interactive map "the map" and SHALL NOT call it "the atlas".

#### Scenario: Search data is loading
- **WHEN** a reader starts a search before its data loads
- **THEN** the input displays a loading spinner
- **AND** the navigation link to `/map` reads "Map"

#### Scenario: Link to a map location
- **WHEN** a page links a character's location on the map
- **THEN** the link reads "View on map"
- **AND** it opens the matching location at `/map` with its map query state

#### Scenario: Publication changes searchable kinds
- **WHEN** a searchable kind is added to or removed from the publication
- **THEN** the search placeholder names only kinds that are searchable in the current publication
- **AND** it does not claim to search an unpublished kind

### Requirement: Top navigation groups published destinations

The shared top navigation SHALL show the brand, direct links to Map, Items, Quests, Classes, and Mechanics, in that order, one Browse menu, the search field, and the Support link. The link of the current page, or Browse when only the panel names the current page, SHALL carry a gold rule on the bar's lower edge. The Browse menu SHALL open one panel that lists the published destinations in labeled columns: World (Map, Places, NPCs, Quests, Properties, Factions), Items (Items, Recipes, Gathering Nodes, Gear Sets, Currencies, Crafting Stations), Character (Classes, Races, Skills, Abilities), and Mechanics (the featured mechanics pages Adventurers, Character Progression, Corruption, Crafting and Gathering, Heroic Tier, and Loot in alphabetical order, then a link to the list of all mechanics pages). A published page kind that no column names SHALL appear in an Other column. The navigation SHALL NOT show an empty column, a column with one catch-all destination, or one menu for each column. It SHALL show only destinations that exist in the current publication. The Browse menu SHALL close on Escape, on an outside click, when focus leaves it, and on navigation. Its links SHALL remain accessible by keyboard at 1440 px and 390 px without horizontal page overflow. Each entry SHALL show its name and one line that says what it holds, and a kind's entry SHALL also show the kind's glyph. A long name SHALL wrap inside the entry's own highlight. Below 640 px the columns SHALL become full-width sections that open one at a time, starting with the section of the current page. The bar SHALL end with a Support link to Ko-fi that keeps only the Ko-fi cup where the bar lacks room for its label, and the Browse panel and the page footer SHALL each end with a plain Ko-fi link. The bar's search field SHALL keep room for a query; where the bar cannot give it that room, the field SHALL take a row of its own. Search results SHALL never be narrower than one result line.

#### Scenario: Desktop navigation
- **WHEN** a reader opens a page at a 1440 px viewport
- **THEN** Map, Items, Quests, Classes, and Mechanics are links in the bar
- **AND** one Browse button opens all columns in one panel, with Gathering Nodes, Gear Sets, Currencies, and Crafting Stations in the Items column

#### Scenario: Narrow navigation
- **WHEN** a reader opens a page at a 390 px viewport
- **THEN** the bar shows the brand, Browse, and the Ko-fi cup, and the panel lists the same columns as sections that open one at a time
- **AND** the navigation causes no horizontal page scroll

#### Scenario: Mid-width search
- **WHEN** a reader searches at a 960 px viewport
- **THEN** the search field spans its own row below the links and its results and empty message read on full lines
- **AND** at 1100 px the field stays in the bar beside the Ko-fi cup and its results open at least 24rem wide

#### Scenario: Mechanics topics
- **WHEN** a reader opens the Browse panel of a publication with ten mechanics pages
- **THEN** a column labeled Mechanics links Adventurers, Character Progression, Corruption, Crafting and Gathering, Heroic Tier, and Loot in that order
- **AND** the column ends with an "All 10 Mechanics" link to the mechanics list, and no Browse or hub text calls these pages guides

#### Scenario: Long mechanics name
- **WHEN** a reader points at Crafting and Gathering in the Browse panel at 1100 px
- **THEN** the name and its line stay inside the entry's highlight
