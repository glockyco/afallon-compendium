## MODIFIED Requirements

### Requirement: Search and map navigation stay in place

Search SHALL show a spinner inside its input while loading, without changing page height. Its placeholder SHALL name only kinds that are searchable in the current publication. The site navigation SHALL name its map "Map" and link to `/map`. All reader text SHALL call the interactive map "the map" and SHALL NOT call it "the atlas".

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
- **THEN** the search placeholder reflects the current searchable kinds
- **AND** it does not claim to search an unpublished kind

## ADDED Requirements

### Requirement: Map has its own route

The interactive map SHALL load at `/map`. All internal map links and map share controls SHALL use `/map` with the existing selection and filter query parameters. The route `/` SHALL NOT interpret old map query parameters as map state or redirect them to `/map`.

#### Scenario: Reader opens a selected map location
- **WHEN** a reader follows a map location link from a published page or search result
- **THEN** `/map` opens with that location selected
- **AND** the browser address keeps the selection in the map query

#### Scenario: Reader opens an old home query
- **WHEN** a reader opens `/?selected=...`
- **THEN** the hub stays at `/` without a map selection or redirect

### Requirement: Top navigation groups published destinations

The shared top navigation SHALL group World (Map, Places, NPCs, Quests, Properties), Items (Items, Recipes), and Character (Classes, Skills, Abilities) in that order. It SHALL reserve Reference and Mechanics for future destinations and SHALL not show empty groups. It SHALL show only destinations that exist in the current publication. Group labels and links SHALL remain accessible by keyboard at 1440 px and 390 px without horizontal page overflow.

#### Scenario: Desktop navigation
- **WHEN** a reader opens a page at a 1440 px viewport
- **THEN** World, Items, and Character expose their published destinations in order
- **AND** Reference and Mechanics do not show empty links

#### Scenario: Narrow navigation
- **WHEN** a reader opens a page at a 390 px viewport
- **THEN** the reader can reach every published destination with keyboard and pointer
- **AND** the navigation causes no horizontal page scroll

### Requirement: Footer identifies the accepted data

The shared footer SHALL show the accepted game release version, the publication data date, and a link to the Steam patch notes for that same release. It SHALL NOT infer a version from the build number or use a generic patch-notes index as a matching article. The displayed version, date, and link SHALL belong to the selected publication.

#### Scenario: Reader checks the current release
- **WHEN** a reader opens the hub or a detail page for a selected publication
- **THEN** its footer shows the release version and data date of that publication
- **AND** the patch-notes link opens the verified Steam article for that release

#### Scenario: Candidate release evidence does not match
- **WHEN** a candidate's patch-notes article does not match its declared version or build
- **THEN** the candidate cannot replace the accepted publication

### Requirement: Development map cards show useful facts

Map selection cards SHALL remain development-only. A selected published page SHALL show its page link, a plain kind label, and concise facts supported by that kind's document. A selection without a page SHALL show available placement facts without inventing a page link. Raw document and placement JSON SHALL stay behind labeled disclosures. Production SHALL show no development card or raw JSON.

#### Scenario: Published page selected in development
- **WHEN** a developer selects a map placement linked to a published page
- **THEN** its card shows a working page link and relevant published facts
- **AND** the raw JSON is hidden until a disclosure opens

#### Scenario: Placement lacks a page
- **WHEN** a developer selects a placement without a published page
- **THEN** its card shows the available placement label and facts
- **AND** it does not offer a broken page link

#### Scenario: Production map selection
- **WHEN** a reader selects a map placement in production
- **THEN** no development selection card or raw JSON appears
