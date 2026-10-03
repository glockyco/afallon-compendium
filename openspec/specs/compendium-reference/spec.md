# compendium-reference Specification

## Purpose

Give published game entities navigable reference pages, browse lists, search results, and relationships grounded in the selected publication. Connect those pages to the map without assigning locations to entities that do not occupy space themselves.

## Requirements

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

### Requirement: Unknown facts are not fabricated

Entity pages SHALL render established publication facts and SHALL distinguish unknown values from known values. A missing value SHALL read Unknown, or words such as "an unknown time" inside a sentence, with its reason available on hover, focus, and tap. It SHALL NOT read as a bare mark beside or in place of a value. An absent drop chance SHALL be marked in its chance cell rather than guessed, and a creature without a published location SHALL retain its drop information and identify the location gap in its location section.

#### Scenario: A drop chance is unknown
- **WHEN** a published drop has a quantity but no established chance
- **THEN** its chance cell shows Unknown with an explanation available on hover or focus

#### Scenario: A creature has no published location
- **WHEN** an NPC has drops but no published location
- **THEN** its Where to find section says no known location
- **AND** the drops remain visible

#### Scenario: An unknown gold amount
- **WHEN** a creature drops Gold without a valid quantity
- **THEN** its quantity cell reads Unknown with the reason on hover, and no dash follows it

### Requirement: Space belongs to entities that occupy it

A creature and property SHALL publish their own placements. A place SHALL publish its map space and applicable region areas instead of a representative marker for the place. Items, quests, abilities, and recipes SHALL NOT claim locations of their own; their sources or participants carry locations. The map SHALL accept a place selection that shows its map space and region areas when published.

#### Scenario: A reader opens a zone
- **WHEN** a place has a published map space and region areas
- **THEN** its page offers a map link selecting that place and its region areas
- **AND** services, resources, and containers appear grouped rather than as one entry per placement

#### Scenario: A reader locates an item
- **WHEN** an item has creature drops, vendor stock, or gathering sources
- **THEN** its page links to those source entities or source spots without attributing a location to the item itself

### Requirement: Relations retain pair-specific facts

Reference relations SHALL present the facts appropriate to each kind: loot quantity and chance, vendor price and currency and applicable requirements, gathering skill and rank and quantity when known, and an entity's role in a quest. Published loot and vendor facts SHALL be available from the appropriate item and NPC pages without inventing missing values.

#### Scenario: A vendor offers an item with conditions
- **WHEN** a published item has a vendor price and unlock requirements
- **THEN** the item page names the vendor and the offer's price and requirements
- **AND** the vendor page names the item with its price and requirements

#### Scenario: A creature drops an item
- **WHEN** a published creature has a specific item in its loot list
- **THEN** the NPC page names the item and its known quantity and chance
- **AND** the item page names the creature with its known drop facts and any creature-level restriction

### Requirement: Entity references resolve to pages or plain text

A published entity reference SHALL use the target's published name, its icon when available, and a link to its registered page when it has one. A reference without a published page SHALL appear as text, not as a link inferred from its display name or native identifier.

#### Scenario: Two entities share a source name
- **WHEN** a relation references one of two distinct same-name published entities
- **THEN** its link uses the published disambiguated name and targets that entity's page

#### Scenario: A target is unresolved
- **WHEN** a relation refers to a target without a published page
- **THEN** its label remains visible as plain text without a dead link

### Requirement: Entity links preview published documents

A page link with previews enabled SHALL load the linked entity's published document to show a compact fact preview on pointer hover or keyboard focus. The preview SHALL close on pointer departure or Escape and SHALL NOT trap focus.

#### Scenario: A reader hovers a dropped item
- **WHEN** a reader hovers its link in a drop table
- **THEN** the item preview draws its available icon, rarity, type, stats, and requirements from its published document
- **AND** leaving the link closes the preview

### Requirement: Each registered list kind has a filterable list

The site SHALL publish `/<kind>/` for every registered list kind, including kinds without standalone detail pages. Lists SHALL offer name filtering, declared facets, and sorting by published columns. The current filter and sort SHALL live in the URL; narrow screens SHALL keep list row information available.

#### Scenario: A reader filters items
- **WHEN** a reader selects an item slot, a numeric level bound, and a sort column
- **THEN** matching items appear in the selected order
- **AND** reloading the URL restores the same choices

#### Scenario: A reader filters NPCs
- **WHEN** a reader selects the boss role
- **THEN** the list shows matching NPCs with their available level and place columns

### Requirement: Site and map search share published entities

Site search SHALL search the names and published aliases of searchable page kinds from the publication's search corpus, and SHALL link results to their entity pages. Results for places and entities with published map spots SHALL offer a map link. The map SHALL use the same published entity corpus alongside its placement search data rather than indexing separate guide records.

#### Scenario: A reader searches for a dungeon boss
- **WHEN** the reader enters part of a published boss name
- **THEN** site results offer its NPC page, available level and place context, and a map link when it has spots

### Requirement: Entity pages expose release and document data

Entity pages SHALL show the selected publication's game release version in the footer and link to their published JSON document. They SHALL provide Open Graph title, summary, and image metadata from the document, using a default image when the entity has no published art.

#### Scenario: A reader shares an illustrated item page
- **WHEN** a social client reads its Open Graph metadata
- **THEN** it receives the published item name, description summary, and item image

#### Scenario: An entity lacks artwork
- **WHEN** a reader shares a page for an entity with no published art
- **THEN** its Open Graph image points to the site's default image

### Requirement: Stat links read as part of their amount

A link to a stat SHALL show no icon or kind glyph and SHALL take the colour of the text around it, marked as a link by a dotted underline, in every table, sentence, and tooltip. Links to other kinds SHALL keep their icons.

#### Scenario: Enchantment amounts
- **WHEN** a reader views the enchanting table on the Crafting and Gathering page
- **THEN** each amount reads as "+15 Armor" with Armor underlined and no framed glyph before it

#### Scenario: Item linked beside a stat
- **WHEN** a row names an item and a stat
- **THEN** the item keeps its icon and the stat shows none

### Requirement: Search engines find every published page

The deployment SHALL include `/sitemap.xml`, which lists the address of the hub, every published list page, every published entity page, and the map, and `/robots.txt`, which allows every page and names the sitemap. The sitemap SHALL be generated from the same publication as the pages, so it names no page that the deployment lacks.

#### Scenario: Page linked only from a hidden row
- **WHEN** an entity page is linked only from rows that a list or relation preview has not built
- **THEN** `/sitemap.xml` still lists its address

#### Scenario: Withheld record
- **WHEN** the publication withholds a record
- **THEN** the sitemap names no page for it
