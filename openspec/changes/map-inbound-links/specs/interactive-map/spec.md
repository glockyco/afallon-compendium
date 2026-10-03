## ADDED Requirements

### Requirement: Inbound map links frame their destinations

A map link naming a published placement without an explicit camera view SHALL frame that placement at a useful scale. A map link naming a published entity without an explicit camera view SHALL frame all of that entity's published spots and list those spots, including when the entity's category is not selected. An explicit camera view SHALL remain authoritative. Changing selections after arrival SHALL NOT reposition the live camera.

#### Scenario: A reader follows a placement link
- **WHEN** a reader opens a map link to one published spot with no camera coordinates
- **THEN** that spot is visible near the center at a useful scale
- **AND** selecting another spot later does not move the camera

#### Scenario: A reader follows an entity link
- **WHEN** a reader opens a map link to an entity with several published spots and no camera coordinates
- **THEN** the camera frames all of its published spots
- **AND** the result list names only those spots, even if their category is normally hidden

#### Scenario: A reader opens a saved camera view
- **WHEN** a map link contains a placement or entity and an explicit camera view
- **THEN** the explicit camera position and zoom remain unchanged

### Requirement: Map selection and hover remain legible

Selected and hovered markers SHALL draw above ordinary marker icons. A hover preview SHALL clear when a camera change leaves no marker under the pointer. Movement paths and roaming ranges SHALL NOT capture marker selection. Map status SHALL describe matching spots and spots in view in plain player-facing language.

#### Scenario: A selected marker neighbors another marker
- **WHEN** a linked placement is selected next to a different marker
- **THEN** the selected marker icon remains visible above the neighboring icon

#### Scenario: The reader zooms away from a hovered marker
- **WHEN** a hovered marker moves away from a stationary pointer during zoom
- **THEN** its hover preview no longer persists without a marker under the pointer

#### Scenario: The reader points inside a roaming range
- **WHEN** a movement range is visible and no marker is under the pointer
- **THEN** that range does not select its creature

## MODIFIED Requirements

### Requirement: Categories use the game's own vocabulary

Marker categories SHALL use the terms the game shows its players. The source of that vocabulary is the game's interaction and nameplate model: merchant, quest giver, interactive object, crafting station, and enemy entity, with enemy, neutral, and friendly alignment. Resources, containers, and travel points SHALL use the words the game uses for them in its own interface.

Each category SHALL add information. A category that every character carries, or that a service category already implies, SHALL NOT exist. Bosses, enemies, and neutral creatures form one section. Merchants, quest givers, and townsfolk form one section, where townsfolk are the friendly characters with no service. Sections SHALL carry a short single-line name and no glyph, and each row and section SHALL show its marker count.

Extraction vocabulary SHALL NOT appear on the player surface. The interface SHALL NOT show placement roles, source families, source identities, map spaces, authored flags, component names, or coverage counts.

Overlapping categories SHALL NOT create duplicate physical markers. Only markers at the exact same world position SHALL form one counted marker group. Nearby markers at different positions SHALL remain independently visible. Every group member SHALL be reachable by pointer and keyboard.

#### Scenario: A vendor also gives quests
- **WHEN** a reader enables both the merchant and quest-giver categories
- **THEN** that NPC has one physical marker carrying both
- **AND** the published NPC page remains the source for stock and quest details

#### Scenario: A reader hides one role of an overlapping marker
- **WHEN** a placement's highest-precedence category is disabled while another category remains enabled
- **THEN** the placement resolves its glyph from the enabled category
- **AND** it does not continue to appear as the disabled category

#### Scenario: A friendly character sells items
- **WHEN** the publication builds that character's categories
- **THEN** the character is a merchant and not also townsfolk
- **AND** a friendly character with no service is townsfolk

#### Scenario: A category has no player-facing name
- **WHEN** extracted content cannot be described in the game's vocabulary
- **THEN** it does not become a marker category
- **AND** it remains in the generated artifacts

#### Scenario: A low-zoom view contains many resources
- **WHEN** two or more markers have precisely the same world position at any zoom
- **THEN** one marker shows a count of the coincident spots
- **AND** each member can be selected by pointer or keyboard without grouping nearby spots
