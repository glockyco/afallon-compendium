## MODIFIED Requirements

### Requirement: Search and map navigation stay in place

Search SHALL show a spinner inside its input while loading, without changing page height. Its placeholder SHALL name only kinds that are searchable in the current publication. The site navigation SHALL name its map "Map" and link to `/map`. All reader text SHALL call the interactive map "the map" and SHALL NOT call it "the atlas". Map location actions across search results and detail pages SHALL use the shared title-case label "Show on Map".

#### Scenario: Search data is loading
- **WHEN** a reader starts a search before its data loads
- **THEN** the input displays a loading spinner
- **AND** the navigation link to `/map` reads "Map"

#### Scenario: Link to a map location
- **WHEN** a page links a character's location on the map
- **THEN** the link reads "Show on Map"
- **AND** it opens the matching location at `/map` with its map query state

#### Scenario: Publication changes searchable kinds
- **WHEN** a searchable kind is added to or removed from the publication
- **THEN** the search placeholder names only kinds that are searchable in the current publication
- **AND** it does not claim to search an unpublished kind
