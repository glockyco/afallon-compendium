## MODIFIED Requirements

### Requirement: Top navigation groups published destinations

The shared top navigation SHALL show the brand, direct links to Map, Items, Quests, Classes, and Mechanics, in that order, one Browse menu, the search field, and the Support link. The link of the current page, or Browse when only the panel names the current page, SHALL carry a gold rule on the bar's lower edge. The Browse menu SHALL open one panel that lists the published destinations in labeled columns: World (Map, Places, NPCs, Quests, Properties, Factions), Items (Items, Recipes, Gathering Nodes, Gear Sets, Currencies, Crafting Stations), Character (Classes, Races, Skills, Abilities), and Mechanics (each published guide topic). A published page kind that no column names SHALL appear in an Other column. The navigation SHALL NOT show an empty column, a column with one catch-all destination, or one menu for each column. It SHALL show only destinations that exist in the current publication. The Browse menu SHALL close on Escape, on an outside click, when focus leaves it, and on navigation. Its links SHALL remain accessible by keyboard at 1440 px and 390 px without horizontal page overflow. Each entry SHALL show its name and one line that says what it holds, and a kind's entry SHALL also show the kind's glyph. A long name SHALL wrap inside the entry's own highlight. Below 640 px the columns SHALL become full-width sections that open one at a time, starting with the section of the current page. The bar SHALL end with a Support link to Ko-fi that keeps only the Ko-fi cup where the bar lacks room for its label, and the page footer SHALL link Ko-fi. The bar's search field SHALL keep room for a query; where the bar cannot give it that room, the field SHALL take a row of its own. Search results SHALL never be narrower than one result line.

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
- **WHEN** a reader opens the Browse panel of a publication with mechanics guides
- **THEN** a column labeled Mechanics links each published guide, including Factions and Reputation
- **AND** no column is labeled Guides

#### Scenario: Long guide name
- **WHEN** a reader points at Factions and Reputation in the Browse panel at 1100 px
- **THEN** the name and its line stay inside the entry's highlight
