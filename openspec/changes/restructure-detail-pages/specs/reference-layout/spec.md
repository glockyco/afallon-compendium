## MODIFIED Requirements

### Requirement: Search and map navigation stay in place

Search SHALL show a spinner inside its input while loading, without changing page height. The site navigation SHALL name its map "Map". All reader text SHALL call the interactive map "the map" and SHALL NOT call it "the atlas".

#### Scenario: Search data is loading
- **WHEN** a reader starts a search before its data loads
- **THEN** the input displays a loading spinner
- **AND** the navigation link to the map reads "Map"

#### Scenario: Link to a map location
- **WHEN** a page links a character's location on the map
- **THEN** the link reads "View on map"

## REMOVED Requirements

### Requirement: Entity pages share one header

**Reason**: The title block and the hero of `detail-pages` replace the page header. Artwork and descriptions move from the header into the hero.

**Migration**: Entity pages use the title block and hero of `detail-pages`. Tooltips keep their compact header.

### Requirement: Quest pages use a coherent layout

**Reason**: The quest page requirement of `detail-pages` replaces the card layout with ordered sections, and its column rule replaces the objective column rule.

**Migration**: Quest pages follow "Quest pages follow the course of the quest" in `detail-pages`.
