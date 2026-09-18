## Purpose

The compendium reference gives every published game entity its own page, a list per kind, and links between entities, so a player can answer where an item comes from, what a creature drops, how a quest proceeds, and what a place contains without leaving the site.

## ADDED Requirements

### Requirement: Every published entity has a page

The site SHALL publish one prerendered page for each published entity of a registered kind at `/<kind>/<slug>/`. The page SHALL show the entity's fact card and its relation tables. The `kind` segment and the `slug` SHALL come from the publication, not from the page code. The initial kinds SHALL be items, NPCs, quests, places, properties, abilities, and recipes.

#### Scenario: A reader opens an item page
- **WHEN** a reader requests `/items/<slug>/` for a published item
- **THEN** the page shows the item's name, icon, rarity, slot, type, damage or armor values, stats, sockets, requirements, sell and buy prices with currency, and description
- **AND** the page shows where the item comes from and what it is used in

#### Scenario: A reader opens an NPC page
- **WHEN** a reader requests `/npcs/<slug>/` for a published NPC
- **THEN** the page shows the NPC's name, portrait, level or level range, role, faction, species, respawn range, experience range, and stats
- **AND** the page shows its drops, vendor stock, quests given and completed, abilities by phase, faction rewards, and locations

#### Scenario: A reader opens a quest page
- **WHEN** a reader requests `/quests/<slug>/` for a published quest
- **THEN** the page shows the quest's name, description, quest giver, turn-in NPC, requirements, objectives with their targets and counts, items given, fixed rewards, and rewards to choose from
- **AND** the page shows the quest chain with the previous and next quests

#### Scenario: A reader opens a place page
- **WHEN** a reader requests `/places/<slug>/` for a published scene or region
- **THEN** the page shows its name, artwork, description, level range, bosses, creatures with levels, NPCs and services, resources, containers, quests that start there, and connected places
- **AND** the page links to the same place on the world atlas

#### Scenario: A page URL is stale
- **WHEN** a reader requests a page path that the publication does not define
- **THEN** the site returns the not-found page
- **AND** the not-found page links to the kind list and to search

### Requirement: Fact cards show only established values

A fact card SHALL show a value only when the publication established it for the supported build. When an expected value is missing, the card SHALL show a placeholder in that value's position. The placeholder MAY name the missing fact. A page SHALL NOT add a row, section, or banner that only states a limitation.

#### Scenario: A drop chance is not measured
- **WHEN** a loot row has quantities but no measured chance
- **THEN** the chance cell shows a dash
- **AND** the dash carries a short explanation on hover or focus
- **AND** no additional row or note appears

#### Scenario: A creature has drops but no published location
- **WHEN** an NPC has loot rows and no published placement
- **THEN** the locations table shows one line that states that no location is published
- **AND** the drops table remains complete

### Requirement: Relations are typed per pair

Each relation table SHALL have the columns that its relation kind needs. Drop rows SHALL show the item or source, quantity range, and chance. Vendor rows SHALL show the item or vendor, price, currency, and unlock requirement. Gathering rows SHALL show the resource, skill, rank, and quantity. Quest rows SHALL show the role of the entity in the quest. A relation SHALL appear on both of its endpoint pages with the same values.

#### Scenario: A vendor sells an item behind a progression threshold
- **WHEN** a reader views the item page and the vendor page
- **THEN** both pages show the same price, currency, and unlock requirement for that row

#### Scenario: A boss drops an item
- **WHEN** a reader views the boss page and the item page
- **THEN** the boss page lists the item with its quantity range and chance
- **AND** the item page lists the boss with the same quantity range and chance

### Requirement: Every entity reference is a link or plain text

A reference to another entity SHALL render as a link with the target's published name and icon when the target has a page. When the target has no page, the reference SHALL render as plain text with the same name. The site SHALL NOT compose a link from a display name, and SHALL NOT build a link for a target that the publication did not resolve.

#### Scenario: Two NPCs share a display name
- **WHEN** a relation row references one of them
- **THEN** the link text is the disambiguated published name
- **AND** the link opens the intended NPC page

#### Scenario: A reference target is unresolved
- **WHEN** a relation row references a native id that the publication did not resolve
- **THEN** the row shows the reference as plain text
- **AND** no dead link appears

### Requirement: Entity links show a tooltip

Hovering or focusing an entity link SHALL show a tooltip with that entity's fact card. The tooltip SHALL load from the entity's published document. The tooltip SHALL be dismissible with the keyboard and SHALL NOT trap focus.

#### Scenario: A reader hovers an item link in a drop table
- **WHEN** the pointer rests on the link
- **THEN** a tooltip shows the item's icon, rarity, slot, stats, and requirements
- **AND** the tooltip closes when the pointer leaves or the reader presses Escape

### Requirement: Each kind has a filterable list

The site SHALL publish a list page at `/<kind>/` for each registered kind. The list SHALL support sorting by its declared columns, filtering by its declared facets, and text filtering by name. The list state SHALL be encoded in the URL so a filtered view is shareable. On narrow screens the list SHALL render as cards with the same data.

#### Scenario: A reader filters items by slot and level
- **WHEN** the reader selects a slot facet and a level range
- **THEN** the list shows only matching items sorted by the selected column
- **AND** reloading the URL restores the same filters and sort

#### Scenario: A reader filters NPCs by role
- **WHEN** the reader selects the boss role
- **THEN** the list shows only NPCs with that role, with level and place columns

### Requirement: Search covers pages and map in one corpus

Site search SHALL find items, NPCs, quests, places, properties, abilities, and recipes by displayed name from one corpus. A result SHALL open the entity page. When the entity has published placements, the result SHALL also offer the atlas location. The atlas search SHALL use the same corpus and SHALL NOT index a separate set of guide records.

#### Scenario: A reader searches for a dungeon boss
- **WHEN** the reader types part of the boss name
- **THEN** the results include the NPC with its level and place
- **AND** the reader can open the page or the map location

### Requirement: The atlas and the pages link both ways

Each entity page SHALL link to its placements on the world atlas. The atlas selection panel SHALL link to the selected entity's page. Following either link SHALL keep browser history so that back returns to the origin.

#### Scenario: A reader follows an NPC to the map and back
- **WHEN** the reader activates a location link on an NPC page
- **THEN** the atlas opens with that placement selected
- **AND** browser back returns to the NPC page

### Requirement: Each page carries build identity and machine-readable data

Every page SHALL show the supported game build identity in its footer. Every page SHALL be reachable as a JSON document at a published data path. The site SHALL emit Open Graph metadata with the entity's name, icon, and one-line summary.

#### Scenario: A reader shares an item page
- **WHEN** the link is expanded by a social or chat client
- **THEN** the preview shows the item's name and icon

### Requirement: The coverage page reports the publication's limits

The site SHALL publish one coverage page that renders the publication's coverage resource: build identity, mode, counts per kind, unresolved issue totals, and exclusion reasons. No other reader page SHALL restate those totals.

#### Scenario: A reader opens the coverage page
- **WHEN** the publication is in preview mode
- **THEN** the coverage page states the mode and the unresolved totals
- **AND** entity pages do not show them
