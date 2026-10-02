## MODIFIED Requirements

### Requirement: Every published page kind has entity pages

The site SHALL prerender a detail page at `/<kind>/<slug>/` for each published document whose registered kind has pages. The route and slug SHALL come from the publication. A kind registered for lists but not pages SHALL remain available through its list and related entity pages.

#### Scenario: A reader opens an item page
- **WHEN** a reader requests the page of a published item
- **THEN** it shows the item's published game tooltip, description when present, acquisition sources, and uses
- **AND** its available rarity, type, slot, damage, stats, sockets, requirements, and prices appear in the appropriate tooltip or side facts

#### Scenario: A reader opens an NPC page
- **WHEN** a reader requests the page of a published NPC
- **THEN** it shows the available level, role, portrait, combat and identity facts
- **AND** it gives access to drops, stock, quest roles, abilities, and locations when published

#### Scenario: A reader opens a quest or place page
- **WHEN** a reader requests a published quest page
- **THEN** it shows its objectives, start, rewards, and available chain, requirements, and quest text
- **AND** a published place page shows its available artwork, description, creatures, bosses, quest roles, how to get there, and grouped services and resources

#### Scenario: A reader follows an obsolete page URL
- **WHEN** an entity route has no published document for its kind and slug
- **THEN** it responds with not found rather than showing a different entity
- **AND** the site's not-found page offers links to the compendium home and map
