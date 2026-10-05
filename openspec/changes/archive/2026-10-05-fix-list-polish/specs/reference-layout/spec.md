## MODIFIED Requirements

### Requirement: Search and map navigation stay in place

Search SHALL show a spinner inside its input while loading, without changing page height. Its placeholder SHALL name only kinds that are searchable in the current publication. The site navigation SHALL name its map "Map" and link to `/map`. All reader text SHALL call the interactive map "the map" and SHALL NOT call it "the atlas". A gathering-node search result with published map spots SHALL offer a map link to all its spots.

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

#### Scenario: Placed gathering node search hit
- **WHEN** a reader searches for Aetherium Vein
- **THEN** its result offers Show on Map and opens all of that node's published spots

### Requirement: Footer identifies the accepted data

The shared footer SHALL show the accepted game release version, the publication data date, and a link to the Steam patch notes for that same release. It SHALL NOT infer a version from the build number or use a generic patch-notes index as a matching article. The displayed version, date, and link SHALL belong to the selected publication. On a short page the footer SHALL sit at the bottom of the viewport.

#### Scenario: Reader checks the current release
- **WHEN** a reader opens the hub or a detail page for a selected publication
- **THEN** its footer shows the release version and data date of that publication
- **AND** the patch-notes link opens the verified Steam article for that release

#### Scenario: Candidate release evidence does not match
- **WHEN** a candidate's patch-notes article does not match its declared version or build
- **THEN** the candidate cannot replace the accepted publication

#### Scenario: Short 404 page
- **WHEN** a reader opens the 404 page on a tall phone viewport
- **THEN** the footer rests at the bottom rather than halfway down the screen
