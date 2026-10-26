## MODIFIED Requirements

### Requirement: Place pages show what a player finds there and how to get there

A place page SHALL show its place type, its level range, its parent place, and its Adventure Guide listing in the title block.

#### Scenario: Dungeon with bosses
- **WHEN** a dungeon has four bosses and two other creatures
- **THEN** the Bosses section lists the four bosses
- **AND** the Creatures section lists only the two other creatures

#### Scenario: Several teleports to one place
- **WHEN** a place has four teleports to Afallon
- **THEN** its Connections section has one "To Afallon" row with four spots

#### Scenario: Teleport into the place
- **WHEN** a teleport in Afallon leads into Duskfall Depths
- **THEN** the Connections section of Duskfall Depths has a "From Afallon" row with the spot of that teleport

#### Scenario: Leftover copy of a teleporter
- **WHEN** Cave (Coalway Woods 1) holds a copy of the Duskfall Depths entrance teleporter outside the game map of the cave
- **AND** Challenge Stone Blood holds a copy at the same world position on its game map
- **THEN** neither the cave page nor the Duskfall Depths page lists the teleport of the cave
- **AND** both the Challenge Stone Blood page and the Duskfall Depths page list the teleport of Challenge Stone Blood

#### Scenario: Teleport outside its map without a copy
- **WHEN** the exit teleporter of Sanctum of the Veilpiercer starts outside the game map of the sanctum
- **AND** no other place holds a teleporter at that position
- **THEN** the sanctum page lists a "To Afallon" row

#### Scenario: Afallon zone tab
- **WHEN** a reader opens a major zone tab on the Afallon page
- **THEN** the page shows that zone's captured level range, lore, areas, and assigned content
- **AND** the page keeps other major zones in separate tabs

#### Scenario: Scene without a map
- **WHEN** a scene has no published map or placements but has a captured level range and guide lore
- **THEN** its place page remains reachable from Places and search
- **AND** it shows the level range and lore with the missing-map and missing-content labels
- **AND** it has no map action

#### Scenario: Place pages show what a player finds there and how to get there
- **WHEN** A place has published values for its type, level range, parent place, and Adventure Guide listing.
- **THEN** The place page shows all four values in its title block.

#### Scenario: Teleport into a dungeon
- **WHEN** a teleport in Afallon leads into Barrowdeep
- **THEN** the Barrowdeep Getting there card names Afallon and links the entrance spot

#### Scenario: Dungeon Finder dungeon
- **WHEN** the Dungeon Finder can send a player to Barrowdeep
- **THEN** the Getting there card says that a player can choose Barrowdeep or get it from a Random run, and that only a finished Random run gives the supply pack

#### Scenario: Cave with copies of its entrance in challenge stones
- **WHEN** Cave (Oakenvale) is entered from Afallon and from copies of the same teleport in three challenge stones
- **THEN** its Getting there card names only Afallon

#### Scenario: Timed dungeon
- **WHEN** Barrowdeep has a 860 s timer, thresholds at 500 s and 300 s left, and a reward bag of up to 3 items
- **THEN** its Timed dungeon card shows 14 min 20 s, 8 min 20 s left for +2 token levels, 5 min left for +1, up to 3 items, and a link to its altar

#### Scenario: Places to enter from the overworld
- **WHEN** a reader opens Afallon
- **THEN** a Places to enter section lists its dungeons, challenge stones, and other places in three groups with entrance links
- **AND** the side shows no connection list

#### Scenario: NPCs without services
- **WHEN** a place has merchants and bankers
- **THEN** the Services card counts them, and the NPC section lists the NPCs without a services list

#### Scenario: Descriptive zone without map space
- **WHEN** a zone has lore and published placements whose area exactly matches its name
- **THEN** its answer shows its artwork, its lore, and the count of creatures and quests from those placements, and its sections list them, without inventing a place map pin

#### Scenario: A shared creature level rule
- **WHEN** every creature in a place scales with the player's level
- **THEN** the Creatures section states the scaling rule once and each row shows its level range without repeating the rule


### Requirement: Place answers lead with artwork and useful content

A place page's hero SHALL show its artwork and description.

#### Scenario: Place answers lead with artwork and useful content
- **WHEN** A place has published artwork and a description.
- **THEN** The place page's hero shows the artwork and description.

### Requirement: Place sections follow the prescribed order

A place page's sections SHALL follow this order: Bosses, Creatures, NPCs, Points of interest, Quests, Properties, Connections, Areas.

#### Scenario: Place sections follow the prescribed order
- **WHEN** A place page displays all eight sections.
- **THEN** The sections appear in the order Bosses, Creatures, NPCs, Points of interest, Quests, Properties, Connections, Areas.

### Requirement: Place properties and points of interest remain reachable

Points of interest SHALL list the map categories of the place that no creature or NPC row shows, with their spot counts.

#### Scenario: Place properties and points of interest remain reachable
- **WHEN** A place has a published map category with three spots that no creature or NPC row shows.
- **THEN** Points of interest lists that map category with a spot count of three.

### Requirement: Place levels require published evidence

Each place-page fact specified by these requirements SHALL appear only when the publication has a value for that fact.

#### Scenario: Place levels require published evidence
- **WHEN** A place has no published level range or artwork.
- **THEN** The place page does not show a level range or artwork.

## ADDED Requirements

### Requirement: Creatures appear in a single place section

Each creature SHALL appear in one section only.

#### Scenario: Creatures appear in a single place section
- **WHEN** A creature is listed in the Bosses section of a place page.
- **THEN** That creature does not also appear in another section.

### Requirement: Place quests include starts and objectives

The Quests section SHALL show one row for each quest that starts in the place or has an objective in it, and SHALL name both roles when both apply.

#### Scenario: Place quests include starts and objectives
- **WHEN** One quest starts in the place, another has an objective there, and a third both starts there and has an objective there.
- **THEN** The Quests section shows one row for each of the three quests and names both roles for the third quest.

### Requirement: Place connections group teleports by direction and place

The Connections section SHALL show one row for each direction and connected place: a teleport to that place, a teleport from that place, or a teleport within the place.

#### Scenario: Place connections group teleports by direction and place
- **WHEN** A place has multiple teleports to another place, a teleport from that other place, and a teleport within itself.
- **THEN** Connections shows one row for the teleports to the other place, one for the teleport from it, and one for the teleport within the place.

### Requirement: Connection rows show teleport start spots

Each Connections row SHALL show the map spots where its teleports start.

#### Scenario: Connection rows show teleport start spots
- **WHEN** A Connections row groups teleports starting at two published map spots.
- **THEN** The row shows both start spots.

### Requirement: Connections disclose missing map starts

A Connections row whose teleports start at no map spot SHALL say that the map shows no start for it.

#### Scenario: Connections disclose missing map starts
- **WHEN** A Connections row has teleports but none starts at a map spot.
- **THEN** The row says that the map shows no start for it.

### Requirement: Connections exclude dungeon entrance triggers

The Connections section SHALL NOT list a dungeon entrance trigger, because it loads nothing.

#### Scenario: Connections exclude dungeon entrance triggers
- **WHEN** A place has a dungeon entrance trigger that loads nothing.
- **THEN** Connections does not list that trigger.

### Requirement: Connections exclude duplicated off-map teleports

The Connections section SHALL NOT list a teleport whose start lies outside the game map of its place when a teleport in another place starts at the same world position and has the same destination.

#### Scenario: Connections exclude duplicated off-map teleports
- **WHEN** A teleport starts outside its place's game map and another place has a teleport starting at the same world position with the same destination.
- **THEN** The Connections section does not list the first teleport.

### Requirement: Afallon tabs cover captured major zones

The Afallon place page SHALL present one tab for each captured major zone.

#### Scenario: Afallon tabs cover captured major zones
- **WHEN** Afallon has three captured major zones.
- **THEN** The Afallon place page presents one tab for each of the three zones.

### Requirement: Afallon zone tabs show captured level range and lore

Each Afallon major zone tab SHALL show the major zone's level range and lore when captured.

#### Scenario: Afallon zone tabs show captured level range and lore
- **WHEN** An Afallon major zone has a captured level range and lore.
- **THEN** Its tab shows that level range and lore.

### Requirement: Afallon zone sections show assigned content

Each Afallon major zone tab's sections SHALL show the owned areas, bosses, creatures, NPCs, points of interest, quests, and properties of placements assigned to that zone.

#### Scenario: Afallon zone sections show assigned content
- **WHEN** Placements assigned to an Afallon major zone have published owned areas, bosses, creatures, NPCs, points of interest, quests, and properties.
- **THEN** The zone tab's sections show those owned areas, bosses, creatures, NPCs, points of interest, quests, and properties.

### Requirement: Afallon placements appear only in their selected zone

A placement SHALL appear in only its selected Afallon zone.

#### Scenario: Afallon placements appear only in their selected zone
- **WHEN** A placement is assigned to one selected Afallon zone.
- **THEN** The placement appears only in that zone.

### Requirement: Afallon selected tabs use shared URL state

The selected Afallon zone tab SHALL use the shared URL-backed tab set from `add-page-navigation`.

#### Scenario: Afallon selected tabs use shared URL state
- **WHEN** A reader selects an Afallon major zone tab.
- **THEN** The selected tab uses the shared URL-backed tab set from `add-page-navigation`.

### Requirement: Place pages use shared section navigation

A page with four or more visible sections SHALL use the shared section navigation from `add-page-navigation`.

#### Scenario: Place pages use shared section navigation
- **WHEN** A place page has four visible sections.
- **THEN** The page uses the shared section navigation.

### Requirement: Other place kinds retain the standard structure

Place kinds other than Afallon SHALL keep the place page structure specified above rather than the Afallon major zone tab structure.

#### Scenario: Other place kinds retain the standard structure
- **WHEN** A reader opens a place page of a kind other than Afallon.
- **THEN** The page keeps the specified title block, hero, and ordered sections rather than the Afallon major zone tab structure.

### Requirement: Observed scenes remain discoverable unless proven unreachable

Each observed scene SHALL remain reachable from the Places list and search unless evidence proves that the game cannot reach it.

#### Scenario: Observed scenes remain discoverable unless proven unreachable
- **WHEN** A scene has been observed and no evidence proves that the game cannot reach it.
- **THEN** The scene remains reachable from both the Places list and search.

### Requirement: Scenes disclose missing published maps

A scene without a published map SHALL show a clear "No map is published" label and no map action.

#### Scenario: Scenes disclose missing published maps
- **WHEN** A scene has no published map.
- **THEN** Its page shows a clear "No map is published" label and no map action.

### Requirement: Scenes disclose missing published content

A scene with no published placements or content SHALL show a clear "No content is published" label.

#### Scenario: Scenes disclose missing published content
- **WHEN** A scene has no published placements or content.
- **THEN** Its page shows a clear "No content is published" label.

### Requirement: Scenes retain captured level range and lore

A scene's captured level range and lore SHALL remain visible.

#### Scenario: Scenes retain captured level range and lore
- **WHEN** A scene has a captured level range and lore but no published placements or content.
- **THEN** The scene's captured level range and lore remain visible.

