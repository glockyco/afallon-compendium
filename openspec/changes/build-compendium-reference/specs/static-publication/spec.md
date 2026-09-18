## ADDED Requirements

### Requirement: Detail and authoring controls remain development-only

Production builds SHALL render the condensed public detail panel and SHALL NOT render authoring controls or evidence panels. Development builds SHALL retain authoring and evidence interfaces for inspection and authoring workflows. Refactoring the atlas SHALL NOT weaken the build-time boundary.

#### Scenario: A production reader selects a marker
- **WHEN** a marker is selected in a production build
- **THEN** the condensed public detail panel shows the entity's fact card and page link
- **AND** no authoring control or evidence panel becomes available

#### Scenario: A developer selects a marker
- **WHEN** a marker is selected in a development build
- **THEN** the development evidence panel can inspect its available facts and provenance
- **AND** development authoring controls remain available where defined

### Requirement: Publication emits one typed document per entity

Publication SHALL emit one independently addressable static document for each published entity of a registered kind. The document SHALL validate against that kind's schema. It SHALL carry the entity's typed facts, its relations as named row lists in both directions, its placement references, its artwork references, and its slug. It SHALL NOT carry generic label and value rows in place of typed facts.

#### Scenario: Publication emits an item document
- **WHEN** the catalog holds an item with loot, vendor, and recipe relations
- **THEN** the item document lists drop rows, vendor rows, and recipe rows with typed columns
- **AND** the document validates against the item schema

#### Scenario: A relation is present on both endpoints
- **WHEN** a loot entry links an NPC to an item
- **THEN** the NPC document lists a drop row for the item
- **AND** the item document lists a dropped-by row for the NPC with equal values

### Requirement: One entity reference contract is resolved at publication

Every reference to an entity in a published document SHALL use one reference shape: entity key, kind, published name, slug, and optional icon reference. Publication SHALL resolve each reference once. Published names SHALL be disambiguated when two entities of one kind share a display name. Publication SHALL audit every reference and SHALL fail selection when a reference names an entity that is neither published nor marked as unresolved.

#### Scenario: Two NPCs share a display name
- **WHEN** publication resolves references to them
- **THEN** each published name is distinct
- **AND** both slugs are distinct

#### Scenario: A reference cannot be resolved
- **WHEN** a relation row references a native id with no catalog entity
- **THEN** the row is marked unresolved with the raw label
- **AND** the audit records the occurrence without failing selection

#### Scenario: A reference names an unpublished entity
- **WHEN** a document references an entity key that the publication did not emit
- **THEN** candidate selection fails with the referencing document and key

### Requirement: One registry describes each published kind

The publication root SHALL carry a kind registry. Each entry SHALL declare the kind's label, plural label, route segment, icon, searchable flag, list columns, and list facets. Site routes, list pages, and search SHALL read that registry. A kind absent from the registry SHALL NOT be routed.

#### Scenario: A new kind is added to the registry
- **WHEN** publication emits documents for that kind and registers it
- **THEN** the site prerenders its list and pages without route code changes specific to the kind

### Requirement: Publication emits page entries and a shared search corpus

The publication root SHALL list every page path to prerender. Publication SHALL emit one search corpus that covers every searchable kind. Each corpus entry SHALL carry the reference shape, the kind, the level or level range when present, the primary place when present, and the placement references. The atlas and the pages SHALL consume the same corpus resources.

#### Scenario: The site prerenders from the publication
- **WHEN** the site builds against a selected publication
- **THEN** every listed page path renders
- **AND** a page path missing from the publication is not generated

### Requirement: Entity artwork is published as content-addressed resources

Publication SHALL emit item icons, ability icons, NPC portraits, and place artwork as content-addressed image resources registered in the resource graph. A document SHALL reference artwork by resource identity. Missing artwork SHALL remain an explicit absence in the document, not a placeholder image path.

#### Scenario: An item has an extracted icon
- **WHEN** the catalog registers the icon asset for that item
- **THEN** the item document references the icon resource
- **AND** deployment verifies the icon bytes against their identity

#### Scenario: An NPC has no extracted portrait
- **WHEN** the catalog has no portrait asset for that NPC
- **THEN** the NPC document has no portrait reference
- **AND** the page renders the kind icon in its place
