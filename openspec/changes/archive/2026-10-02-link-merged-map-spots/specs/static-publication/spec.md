## ADDED Requirements

### Requirement: Page spots link the marker that shows them

When the map shows several objects with one marker, publication SHALL record the marker that shows each object. A page row that names such an object SHALL link that marker. A row SHALL count each marker once, even when it names several objects that the marker shows. An object whose marker the map does not publish SHALL have no spot.

#### Scenario: Teleport beside a dungeon entrance
- **WHEN** the Barrowdeep teleport in Afallon stands beside the Barrowdeep entrance, and the map shows both with the entrance marker
- **THEN** the Barrowdeep page lists its From Afallon connection with the entrance marker as its spot

#### Scenario: Two teleports at one spot
- **WHEN** two teleports at one spot lead to the same place, and the map shows them with one marker
- **THEN** a row that names both teleports counts one spot
