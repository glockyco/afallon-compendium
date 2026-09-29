## MODIFIED Requirements

### Requirement: Place pages list what a player finds there

Each fact below SHALL appear only when the publication has a value for it. A place page SHALL show its place type, its level range, its parent place, and its Adventure Guide listing in the title block. Its hero SHALL show its artwork and description. Its sections SHALL follow this order: Bosses, Creatures, NPCs, Points of interest, Quests, Properties, Connections, Areas. Each creature SHALL appear in one section only. Points of interest SHALL list the map categories of the place that no creature or NPC row shows, with their spot counts. The Quests section SHALL show one row for each quest that starts in the place or has an objective in it, and SHALL name both roles when both apply. The Connections section SHALL show one row for each direction and connected place: a teleport to that place, a teleport from that place, or a teleport within the place. Each row SHALL show the map spots where its teleports start. A row whose teleports start at no map spot SHALL say that the map shows no start for it. The Connections section SHALL NOT list a dungeon entrance trigger, because it loads nothing. It SHALL NOT list a teleport whose start lies outside the game map of its place when a teleport in another place starts at the same world position and has the same destination.

The Afallon place page SHALL present one tab for each captured major zone. Each tab SHALL show the major zone's level range and lore when captured. Its sections SHALL show the owned areas, bosses, creatures, NPCs, points of interest, quests, and properties of placements assigned to that zone. A placement SHALL appear in only its selected zone. The selected tab SHALL use the shared URL-backed tab set from `add-page-navigation`. A page with four or more visible sections SHALL use its shared section navigation. Other place kinds SHALL keep the page structure above.

Each observed scene SHALL remain reachable from the Places list and search unless evidence proves that the game cannot reach it. A scene without a published map SHALL show a clear "No map is published" label and no map action. A scene with no published placements or content SHALL show a clear "No content is published" label. Its captured level range and lore SHALL remain visible.

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
