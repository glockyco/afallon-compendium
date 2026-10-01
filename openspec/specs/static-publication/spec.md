# static-publication Specification

## Purpose

Publish a verified static Afallon map and linked compendium from a sealed catalog. Readers receive bounded, content-addressed resources without a request-time application service.

## Requirements

### Requirement: Publication emits bounded static resources

Publication SHALL emit a root manifest and independently addressable map parts, movement and connection geometry, search parts, entity documents, kind lists, coverage, and image resources. The map SHALL compose the published map parts at their reviewed world offsets without selecting one active map. Each JSON resource SHALL carry its schema, build, and catalog identity.

#### Scenario: A reader opens the map
- **WHEN** the map loads from a fresh session
- **THEN** it composes every published map part in the shared world view at its reviewed offset
- **AND** it loads declared geometry without downloading all entity documents

#### Scenario: A reader opens one entity detail
- **WHEN** a selected entity has a published document that is not loaded
- **THEN** the map fetches that independently addressable document
- **AND** it does not fetch every entity document

### Requirement: The deployed map is static

The built site SHALL serve its prerendered pages and publication from static files and image tiles. Map search, filtering, layer selection, selection state, and navigation SHALL operate in the browser without a request-time API, worker handler, database, account, or game installation.

#### Scenario: Static hosting serves a publication
- **WHEN** the verified site and publication are deployed as static assets
- **THEN** a reader can navigate the shared world, search published entries, filter markers, and select imagery layers
- **AND** those interactions require no dynamic server response

### Requirement: Detail and authoring controls remain development-only

The map SHALL render its development selection-inspection panel and authoring controls only in development builds. Production SHALL retain map selection and links to prerendered entity detail pages without exposing the development panel or authoring controls.

#### Scenario: A production reader selects a marker
- **WHEN** a marker is selected in a production build
- **THEN** the map retains its selection and can link to the entity's published page
- **AND** the development inspection panel and authoring controls are unavailable

#### Scenario: A developer selects a marker
- **WHEN** a marker is selected in a development build
- **THEN** the development panel can inspect the published placement and document
- **AND** the development authoring control remains available

### Requirement: URL state uses one canonical form

The map SHALL serialize shareable layer selection, marker or entity selection, filters, search terms, view position, and zoom in canonical URL parameters. Unknown or removed parameter names SHALL NOT be emitted on subsequent map URL updates.

#### Scenario: A canonical shared URL is opened
- **WHEN** a URL contains valid map state
- **THEN** the map restores that state
- **AND** its next URL update writes only canonical parameter names

#### Scenario: A URL contains an obsolete parameter
- **WHEN** a URL includes an unrecognized map-state alias
- **THEN** the map does not interpret it as map state
- **AND** the next map URL update omits that alias

### Requirement: Publication is validated before selection

Publication SHALL check an accepted catalog gate, build and catalog identity, typed reference closure, resource integrity, imagery registration, spatial bounds, coverage, and resource budgets before changing its selected publication. A preview MAY retain identified coverage gaps; a release SHALL require complete coverage. A failed candidate SHALL leave the preceding selection in place.

#### Scenario: A resource differs from its reference
- **WHEN** verification finds a missing or mismatched referenced resource
- **THEN** selection rejects the candidate
- **AND** the preceding selected publication remains available

#### Scenario: A preview retains coverage gaps
- **WHEN** a preview passes integrity checks with incomplete coverage
- **THEN** its manifest declares incomplete coverage and its coverage page identifies the gaps
- **AND** the preview does not satisfy the complete-release gate

### Requirement: Publication is a read-only deterministic compilation

Publication SHALL consume a verified sealed catalog and immutable presentation inputs without mutating the catalog. Equivalent inputs and implementation SHALL yield the same canonical public resource bytes and root identity; operational run timestamps SHALL remain outside public resource identities.

#### Scenario: Compilation succeeds or fails
- **WHEN** publication reads its sealed catalog database
- **THEN** the source database retains its verified content identity on success or failure
- **AND** database mutations are prohibited

#### Scenario: Compilation runs at another storage root
- **WHEN** the same catalog and presentation inputs are compiled with the same implementation elsewhere
- **THEN** public resource identities do not depend on filesystem paths or operational timestamps

### Requirement: Publication selection verifies typed dependency closure

Every reachable public resource SHALL have a declared compatible schema, content identity, and build and catalog identity where applicable. Verification SHALL traverse typed reference edges and reject missing, conflicting, unsafe, mismatched, or unreachable candidate resources before selection.

#### Scenario: A search entry has a missing document
- **WHEN** its declared document resource is absent
- **THEN** candidate verification identifies the referencing resource and missing target
- **AND** the candidate is not selected

#### Scenario: A reference names the wrong schema
- **WHEN** a declared map resource resolves to a resource of another kind
- **THEN** verification rejects the candidate despite matching content bytes

### Requirement: Shared-world startup has explicit resource budgets

Publication SHALL separate root, map placement parts and imagery metadata from search, entity documents, and movement and connection geometry for budget accounting. It SHALL enforce root, part, document, and essential-startup byte budgets without omitting published records; an oversized collection SHALL be split into bounded parts or rejected. Geometry SHALL be loaded for the shared-world map view, but SHALL NOT count in the essential-placement byte group.

#### Scenario: A map needs several parts
- **WHEN** its placement records exceed one map-part budget
- **THEN** publication declares bounded parts for that map
- **AND** the reader composes each part at its reviewed world coordinates

#### Scenario: The publication is measured
- **WHEN** a representative publication is generated
- **THEN** its root, individual resources, and essential-resource group satisfy the enforced byte budgets
- **AND** its measurements distinguish JSON bytes, compressed JSON, imagery, and application code

### Requirement: Deployment caching matches generated identities

Staging and deployment SHALL verify selected publication resources before upload. Content-addressed JSON, tiles, and artwork SHALL receive immutable caching; the publication root and deployment metadata SHALL remain revalidatable. Production output SHALL exclude raw evidence, the catalog database, runtime probes, and development authoring controls.

#### Scenario: A browser requests static assets
- **WHEN** the static host serves a hashed resource or image at its generated path
- **THEN** its response has an immutable cache policy
- **AND** the publication root has a revalidatable policy instead

#### Scenario: Staging finds damaged bytes
- **WHEN** staged resource bytes do not match their selected references
- **THEN** staging rejects the candidate before upload

### Requirement: Consistent publication graph acceptance

Producer selection and staged-file verification SHALL apply the same typed resource-graph semantics: root and coverage agreement, map and part identities, unique placements, geometry membership, travel-state agreement, game-map imagery defaults, search-to-document identities, and resource budgets. Producer selection SHALL also require an accepted catalog gate; staged-file verification SHALL require contained regular files with matching content identities.

#### Scenario: Rehashed but inconsistent graph
- **WHEN** a geometry part names a placement outside its map even though its hashes and schemas are valid
- **THEN** producer and staging verification both reject the graph

#### Scenario: A valid graph crosses storage boundaries
- **WHEN** a verified candidate is materialized with unchanged resources
- **THEN** producer and staged-file graph verification accept the same resource identities

#### Scenario: A staged file is unsafe
- **WHEN** a reachable staged resource is a symlink, escapes its publication directory, or differs from its content identity
- **THEN** staged-file verification rejects it

### Requirement: Parity checks use the verified candidate

Staging SHALL compare the already verified candidate graph with an independently loaded deployed baseline before replacing its stage. Strict parity SHALL protect deployed maps, offsets, placements, categories, regions, searchable entities, imagery, and artwork, allowing reviewed entity exclusions. Verified-update parity SHALL apply its build-sensitive update or spatial-correction rules instead. Graph validity alone SHALL NOT imply parity with a deployed publication.

#### Scenario: A valid graph removes a deployed placement
- **WHEN** strict staging receives a graph that passes verification but omits a deployed placement
- **THEN** parity rejects staging before replacing the staged publication

#### Scenario: Candidate resources were verified
- **WHEN** staging performs parity after graph verification
- **THEN** it reads the verified candidate resource set without reopening its JSON files
- **AND** it independently loads the deployed baseline for comparison

### Requirement: Publication emits one typed document per entity

Publication SHALL emit one independently addressable, schema-validated document per published page, grouping records that share a published NPC or ability page. Each document SHALL contain kind-specific typed facts, named relation rows, its applicable placement references and artwork references, and a slugged page reference. It SHALL NOT replace typed facts with generic label-value rows. Kinds without pages SHALL NOT receive standalone detail documents.

#### Scenario: Publication emits an item document
- **WHEN** an item has loot, merchant, and recipe relations
- **THEN** its typed document names its dropped-by, sold-by, and crafting relations
- **AND** that document validates against its item document schema

#### Scenario: A relation connects two published pages
- **WHEN** a loot row connects a published NPC and item
- **THEN** the NPC document contains a drop relation for the item
- **AND** the item document contains a dropped-by relation for the NPC

### Requirement: One entity reference contract is resolved at publication

Published entity references SHALL carry a key, kind, published name, optional page slug, and optional artwork references. Missing catalog endpoints SHALL remain explicit unresolved references with a label. Graph verification SHALL reject document references to unregistered kinds or absent published pages, while page-less kinds SHALL remain without slugs.

#### Scenario: A catalog endpoint is unknown
- **WHEN** a published document relates to an endpoint without a resolvable catalog reference
- **THEN** the row contains an unresolved label rather than a fabricated entity link
- **AND** reader coverage identifies that document as having an unresolved reference

#### Scenario: A reference names an absent page
- **WHEN** a document references a paged entity without a published search entry and document
- **THEN** candidate verification rejects it and identifies the containing document and key

### Requirement: One registry describes each published kind

The publication root SHALL carry a registry that declares each kind's label, plural label, route, icon, page, list and search eligibility, list columns, and facets. Routes and lists SHALL use its declarations; unregistered kinds SHALL NOT be routed as compendium pages.

#### Scenario: A registered page kind has published documents
- **WHEN** the selected publication has search entries for a kind with pages enabled
- **THEN** the site prerenders their detail routes using the registry's route segment
- **AND** an unregistered route is not generated

### Requirement: Publication emits page entries and a shared search corpus

Publication SHALL list search parts in its root and include a document reference and slug for every searchable published page. The same search parts SHALL serve map and page indexing. Search entries SHALL include their published entity reference, optional level and place, whether they have published placements, and their document reference. Site prerendering SHALL derive detail paths from entries whose registered kinds permit pages.

#### Scenario: The site prerenders from the publication
- **WHEN** the site builds against a selected publication
- **THEN** each registered page with a published search entry receives a detail route
- **AND** an unpublished slug does not receive one

### Requirement: Entity artwork is published as content-addressed resources

Publication SHALL transform registered entity icons, portraits, and artwork into content-addressed image resources referenced from published documents and included in the verified resource graph. A missing image SHALL remain absent from the document rather than become a fabricated image path.

#### Scenario: An item has registered artwork
- **WHEN** the catalog registers an icon for a published item
- **THEN** its document references the generated icon resource
- **AND** deployment verifies that image against its content identity

#### Scenario: An NPC has no portrait
- **WHEN** a published NPC has no registered portrait
- **THEN** its document has no portrait reference
- **AND** its detail title displays no portrait image
