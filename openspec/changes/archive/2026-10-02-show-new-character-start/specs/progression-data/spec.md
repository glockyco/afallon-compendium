## ADDED Requirements

### Requirement: Races record where new characters start

The catalog SHALL record, for each race, the scene and the world position where a new character of that race starts, as the game's race record sets them. A scene or position that does not resolve to a captured record SHALL stay as an explicit issue and SHALL NOT be guessed from a scene's default arrival.

#### Scenario: Race with a starting scene
- **WHEN** the Human race starts new characters in a captured scene
- **THEN** the catalog links the Human race to that scene and its starting position

#### Scenario: Unknown starting scene
- **WHEN** a race names a starting scene that the scan did not capture
- **THEN** the catalog records the issue and links no scene
