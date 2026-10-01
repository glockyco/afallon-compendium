# reader-coverage Specification

## Purpose

Define the coverage page that tells readers what the site publishes for the current build and which pages have known gaps.

## Requirements

### Requirement: Coverage explains published content and gaps

The reader-facing coverage page SHALL show the number of published pages per kind, maps, and map locations. It SHALL list affected page links for each nonempty gap: `itemWithoutSource`, `npcWithoutLocation`, `npcWithoutLevel`, `placeWithoutMap`, `unresolvedReference`, `recipeWithoutTeacher`, and `recipeWithoutProduct`. An item that only adventurers carry SHALL not count as an item without a source; coverage SHALL list it under adventurer-only items. A recipe gap SHALL link to the Crafting section of the product, or to the recipe row on its skill page when the recipe has no published product. A creature without a location SHALL not also count as a creature without a level. The map SHALL not load coverage to render markers.

#### Scenario: An item has no published source
- **WHEN** an item page has no drop, vendor, gather, container, interaction, quest, recipe, starting-gear, or adventurer source
- **THEN** its page appears under Items without a known source

#### Scenario: Only adventurers carry an item
- **WHEN** the only relation of an item is an adventurer kit upgrade
- **THEN** its page appears under adventurer-only items
- **AND** it does not appear under Items without a known source

#### Scenario: Starting gear is a known source
- **WHEN** the only source of an item is the starting gear of a published class
- **THEN** its page does not appear under Items without a known source

#### Scenario: A creature has a location but no level
- **WHEN** a creature page has locations and no confirmed level
- **THEN** its page appears under Creatures without a level

#### Scenario: A recipe has no product
- **WHEN** the Smithing recipe Demonic Bulwark Looted has no published product
- **THEN** it appears under Recipes without a product
- **AND** its link leads to its row on the Smithing page

#### Scenario: A recipe has no teaching item
- **WHEN** the recipe Ring of Bleed Damage is not learned by default and no captured item action teaches it
- **THEN** it appears under Recipes without a teaching item
- **AND** its link leads to the Crafting section of Bloodthrall Signet

### Requirement: The publication graph verifies coverage

The coverage resource SHALL use `compendium.static-coverage.v2`. The graph SHALL check that its map and placement counts match the root. It SHALL check that page counts match published documents and each gap reference points to a published page. Operator gate counts and publication issues SHALL remain in publish command output rather than reader coverage.

#### Scenario: A gap names an unpublished page
- **WHEN** a coverage gap references a page absent from the publication
- **THEN** publication graph verification fails

#### Scenario: Map count differs
- **WHEN** coverage reports a different map count from the root manifest
- **THEN** publication graph verification fails
