## MODIFIED Requirements

### Requirement: Top navigation groups published destinations

The shared top navigation SHALL show direct links to Map, Items, Recipes, Quests, Classes, and Skills, in that order, and one Browse menu. The Browse menu SHALL open one panel that lists the published destinations in labeled columns: World (Map, Places, NPCs, Quests, Properties), Items (Items, Recipes, Gathering Nodes), Character (Classes, Skills, Abilities), and Mechanics (Character Progression, Corruption). A published page kind that no column names SHALL appear in an Other column. The navigation SHALL NOT show an empty column, a column with one catch-all destination, or one menu for each column. It SHALL show only destinations that exist in the current publication. The Browse menu SHALL close on Escape, on an outside click, when focus leaves it, and on navigation. Its links SHALL remain accessible by keyboard at 1440 px and 390 px without horizontal page overflow.

#### Scenario: Desktop navigation
- **WHEN** a reader opens a page at a 1440 px viewport
- **THEN** Map, Items, Recipes, Quests, Classes, and Skills are links in the bar
- **AND** one Browse button opens all columns in one panel, with Gathering Nodes in the Items column

#### Scenario: Narrow navigation
- **WHEN** a reader opens a page at a 390 px viewport
- **THEN** the bar shows the brand and Browse, and the panel lists the same columns as at 1440 px
- **AND** the navigation causes no horizontal page scroll

#### Scenario: Mechanics topics
- **WHEN** a reader opens the Browse panel of a publication with the five mechanics topics
- **THEN** a column labeled Mechanics links Character Progression and Corruption
- **AND** it does not link Heroic Tier, Crafting and Gathering, or Loot
- **AND** no column is labeled Guides
