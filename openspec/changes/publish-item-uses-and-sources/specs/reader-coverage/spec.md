## MODIFIED Requirements

### Requirement: Coverage explains published content and gaps

The reader-facing coverage page SHALL show the number of published pages per kind, maps, and map locations. It SHALL list affected page links for each nonempty gap: `itemWithoutSource`, `npcWithoutLocation`, `npcWithoutLevel`, `placeWithoutMap`, and `unresolvedReference`. A creature without a location SHALL not also count as a creature without a level. The map SHALL not load coverage to render markers.

#### Scenario: An item has no published source
- **WHEN** an item page has no drop, vendor, gather, container, interaction, quest, item, dialogue, recipe, or starting-gear source
- **THEN** its page appears under Items without a known source

#### Scenario: Starting gear is a known source
- **WHEN** the only source of an item is the starting gear of a published class
- **THEN** its page does not appear under Items without a known source

#### Scenario: A creature has a location but no level
- **WHEN** a creature page has locations and no confirmed level
- **THEN** its page appears under Creatures without a level

#### Scenario: A box is the only source
- **WHEN** the only source of an item is the captured loot table of another item
- **THEN** its page does not appear under Items without a known source
