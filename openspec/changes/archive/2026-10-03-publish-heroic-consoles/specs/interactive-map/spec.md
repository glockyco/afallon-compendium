## ADDED Requirements

### Requirement: Heroic Console markers come from scanned placements

The map SHALL publish one Heroic Console marker for each distinct typed Heroic Console source placement admitted by the catalog. Its scene, map space, area, position, and source evidence SHALL come from the scan and existing placement pipeline rather than a manually authored location. The Heroic Console category SHALL be visible by default like other service markers, with its own glyph and the label “Heroic Console”. Selecting a console SHALL show a card that explains what it does in plain language and links to the Heroic Tier Getting started section.

#### Scenario: Three consoles in Coalway outdoors
- **WHEN** the accepted scene scan contains consoles in Coalway Woods, Coalway Swamp, and Chillwind Heights
- **THEN** the map shows three distinct Heroic Console markers at their scanned positions
- **AND** selecting any one shows its Heroic Tier explanation and section link

### Requirement: Console locations link back to their map markers

The Heroic Tier opening and Getting started section SHALL link each published console place to its specific selected map spot. The corresponding place pages SHALL list their console with a link selecting that same spot in the existing objects or services section. Place-to-console associations SHALL come from the scanned source hierarchy and published placements, not hard-coded placement identifiers.

#### Scenario: Reader navigates to one console
- **WHEN** a reader follows a Heroic Console map link from the Heroic Tier page or its place page
- **THEN** the map selects the matching published Heroic Console placement
- **AND** the other two console spots remain independently selectable
