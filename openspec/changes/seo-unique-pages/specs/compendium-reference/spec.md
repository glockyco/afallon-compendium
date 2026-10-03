## MODIFIED Requirements

### Requirement: Entity pages expose release and document data

Entity pages SHALL show the selected publication's game release version in the footer and link to their published JSON document. They SHALL provide Open Graph title, summary, and image metadata from the document, using the entity's own artwork, portrait, or icon when both image dimensions are at least 200 pixels, and a default image otherwise. The image address SHALL be absolute and its declared dimensions and alt text SHALL describe the image served. Open Graph and Twitter titles SHALL match the browser title.

#### Scenario: A reader shares an illustrated item page
- **WHEN** a social client reads its Open Graph metadata
- **THEN** it receives the published item name, description summary, and item image

#### Scenario: An entity lacks artwork
- **WHEN** a reader shares a page for an entity with no published art
- **THEN** its Open Graph image points to the site's default image

#### Scenario: A creature has a usable portrait
- **WHEN** a social client requests the creature's initial HTML
- **THEN** the Open Graph image resolves to its portrait with the portrait's width, height, and name as alt text

### Requirement: Search engines find every published page

The deployment SHALL include `/sitemap.xml`, which lists the address of the hub, every published list page, every indexable published entity page, and the map, and `/robots.txt`, which allows every page and names the sitemap. The sitemap SHALL be generated from the same publication as the pages, so it names no page that the deployment lacks. Teleport effects SHALL keep their published pages and internal links, but SHALL expose a `noindex` robots meta tag and SHALL NOT appear in the sitemap. This decision SHALL use the published effect type rather than its name or slug. Every indexable page SHALL have a nonempty absolute canonical, a unique browser title, and a unique, factual description in its initial HTML. Home SHALL use `Afallon Wiki and Interactive Map | Afallon Compendium`, lists `<Plural> | Afallon Wiki`, map `Afallon Interactive Map | Afallon Wiki`, About `About Afallon Compendium | Afallon Wiki`, and other named pages `<Name> | Afallon Wiki`. When an entity name appears on several published pages of different kinds, each affected title SHALL use `<Name> (<Kind>) | Afallon Wiki` with a reader-facing kind. Distinct pages of one kind with the same name SHALL show a truthful, visible distinguishing fact in both the title and the page. Descriptions SHALL identify the page's kind and useful facts actually shown there, in player language and complete sentences rather than repeating generic wiki text. The deployment SHALL reject duplicate titles or descriptions and missing descriptions or canonicals on indexable pages, and SHALL reject teleport effect pages without `noindex` or with sitemap entries. Effects whose gameplay facts are equal SHALL share a single published page with combined sources, retargeted references, and a permanent redirect from a superseded address.

#### Scenario: Page linked only from a hidden row
- **WHEN** an entity page is linked only from rows that a list or relation preview has not built
- **THEN** `/sitemap.xml` still lists its address when the page is indexable

#### Scenario: Withheld record
- **WHEN** the publication withholds a record
- **THEN** the sitemap names no page for it

#### Scenario: Same-name ability and effect
- **WHEN** an ability and an effect share a name
- **THEN** their titles name the different kinds, their descriptions state their distinct facts, and each indexable page remains in the sitemap

#### Scenario: Equivalent effects share one destination
- **WHEN** two effects have the same name and gameplay outcome but separate applying sources
- **THEN** one published effect page lists both sources, all links point to it, and the other address redirects to it permanently

#### Scenario: A teleport effect remains linked but not indexed
- **WHEN** a published effect has type `Teleport`, regardless of its name
- **THEN** its page and internal links remain available, the initial HTML has `noindex`, and the sitemap omits its address
- **AND** deployment checks still require its descriptive head while exempting it from indexable-page uniqueness checks
