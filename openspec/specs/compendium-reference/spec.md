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

Entity pages SHALL render established publication facts and SHALL distinguish unknown values from known values.

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

#### Scenario: Unknown facts are not fabricated
- **WHEN** An entity has an established quantity and an unknown time.
- **THEN** Its page renders the established quantity and distinguishes the unknown time from known values.

### Requirement: Missing value labels and explanations

A missing value SHALL read Unknown, or words such as "an unknown time" inside a sentence, with its reason available on hover, focus, and tap.

#### Scenario: Missing value labels and explanations
- **WHEN** An entity's publication time is missing.
- **THEN** The time reads Unknown or "an unknown time" in a sentence, and its reason is available on hover, focus, and tap.

### Requirement: Missing values are not bare marks

A missing value SHALL NOT read as a bare mark beside or in place of a value.

#### Scenario: Missing values are not bare marks
- **WHEN** An entity has a missing duration.
- **THEN** The missing duration is not represented by a bare mark beside or in place of a value.

### Requirement: Absent drop chance placement

An absent drop chance SHALL be marked in its chance cell rather than guessed.

#### Scenario: Absent drop chance placement
- **WHEN** A published drop has no established chance.
- **THEN** The chance cell marks the absence rather than displaying a guessed chance.

### Requirement: Unpublished creature locations retain drops

A creature without a published location SHALL retain its drop information and identify the location gap in its location section.

#### Scenario: Unpublished creature locations retain drops
- **WHEN** A creature has published drops but no published location.
- **THEN** Its drop information remains available and its location section identifies the location gap.

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

Site search SHALL search the names and published aliases of searchable page kinds from the publication's search corpus, and SHALL link results to their entity pages.

#### Scenario: A reader searches for a dungeon boss
- **WHEN** the reader enters part of a published boss name
- **THEN** site results offer its NPC page, available level and place context, and a map link when it has spots

#### Scenario: A reader opens a result
- **WHEN** the reader follows a search result by click or by Enter on the highlighted result
- **THEN** the result's page opens with the search results closed and the field empty

#### Scenario: A reader leaves the search
- **WHEN** the reader clicks elsewhere on the page or presses Escape while results are open
- **THEN** the results close, and clicking the field reopens them for the same query

#### Scenario: Site and map search share published entities
- **WHEN** A reader searches using a published alias of a searchable item.
- **THEN** Site search finds the item from the publication's search corpus and links the result to its entity page.

### Requirement: Search results offer map destinations

Results for places and entities with published map spots SHALL offer a map link.

#### Scenario: Search results offer map destinations
- **WHEN** Search returns an entity with published map spots.
- **THEN** The result offers a map link.

### Requirement: Map search corpus alignment

The map SHALL use the same published entity corpus alongside its placement search data rather than indexing separate guide records.

#### Scenario: Map search corpus alignment
- **WHEN** The map searches for a published entity with placement data.
- **THEN** The map uses the shared published entity corpus alongside placement search data, not separate guide records.

### Requirement: Search results dismiss on departure

Site search results SHALL close when focus leaves the search, when the reader presses Escape, and after any navigation. Any navigation SHALL also clear the field.

#### Scenario: Search results dismiss on departure
- **WHEN** A reader navigates to the map while site search results are open.
- **THEN** The results close and the search field clears.

### Requirement: Search interaction reopens results

Clicking the field, typing, or an arrow key SHALL reopen the current results.

#### Scenario: Search interaction reopens results
- **WHEN** Results are closed and a reader types in the search field.
- **THEN** The current results reopen.

### Requirement: Keyboard search selection

Arrow keys SHALL move a visible highlight through the results and Enter SHALL open the highlighted page.

#### Scenario: Keyboard search selection
- **WHEN** A reader uses an arrow key to highlight an item result and presses Enter.
- **THEN** A visible highlight moves to that result and the item's page opens.
### Requirement: Entity pages expose release and document data

Entity pages SHALL show the selected publication's game release version in the footer and link to their published JSON document.

#### Scenario: A reader shares an illustrated item page
- **WHEN** a social client reads its Open Graph metadata
- **THEN** it receives the published item name, description summary, and item image

#### Scenario: An entity lacks artwork
- **WHEN** a reader shares a page for an entity with no published art
- **THEN** its Open Graph image points to the site's default image

#### Scenario: A creature has a usable portrait
- **WHEN** a social client requests the creature's initial HTML
- **THEN** the Open Graph image resolves to its portrait with the portrait's width, height, and name as alt text

#### Scenario: Entity pages expose release and document data
- **WHEN** A reader opens an entity page in a selected publication.
- **THEN** The footer shows that publication's game release version and the page links to its published JSON document.

### Requirement: Document-based sharing metadata

Entity pages SHALL provide Open Graph title, summary, and image metadata from the document, using the entity's own artwork, portrait, or icon when both image dimensions are at least 200 pixels, and a default image otherwise.

#### Scenario: Document-based sharing metadata
- **WHEN** An entity document supplies an icon measuring 200 by 199 pixels.
- **THEN** Open Graph title and summary come from the document, and the image metadata uses a default image.

### Requirement: Sharing image address and description

The Open Graph image address SHALL be absolute and its declared dimensions and alt text SHALL describe the image served.

#### Scenario: Sharing image address and description
- **WHEN** An entity page serves a default image in its Open Graph metadata.
- **THEN** The image address is absolute and its declared dimensions and alt text describe that default image.

### Requirement: Entity sharing titles match browser titles

Open Graph and Twitter titles SHALL match the browser title.

#### Scenario: Entity sharing titles match browser titles
- **WHEN** A client reads an entity page's browser, Open Graph, and Twitter titles.
- **THEN** The Open Graph and Twitter titles match the browser title.

### Requirement: Stat links read as part of their amount

A link to a stat SHALL show no icon or kind glyph and SHALL take the colour of the text around it, marked as a link by a dotted underline, in every table, sentence, and tooltip. Links to other kinds SHALL keep their icons.

#### Scenario: Enchantment amounts
- **WHEN** a reader views the enchanting table on the Crafting and Gathering page
- **THEN** each amount reads as "+15 Armor" with Armor underlined and no framed glyph before it

#### Scenario: Item linked beside a stat
- **WHEN** a row names an item and a stat
- **THEN** the item keeps its icon and the stat shows none

### Requirement: Search engines find every published page

The deployment SHALL include `/sitemap.xml`, which lists the address of the hub, every published list page, every indexable published entity page, and the map.

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

#### Scenario: Search client requests page titles
- **WHEN** a client requests home, a list, an entity, the map, a mechanics page, or About
- **THEN** the initial HTML gives that route its specified browser title and matching Open Graph and Twitter titles
- **AND** the site name remains Afallon Compendium

#### Scenario: Search client reads site identity
- **WHEN** a client reads the home page's WebSite JSON-LD
- **THEN** the name is `Afallon Compendium` and alternateName includes `Afallon Wiki`

#### Scenario: Search engines find every published page
- **WHEN** A deployment includes a hub, published lists, indexable published entities, and a map.
- **THEN** `/sitemap.xml` lists the addresses of the hub, every published list, every indexable published entity, and the map.

### Requirement: Robots file allows crawling

The deployment SHALL include `/robots.txt`, which allows every page and names the sitemap.

#### Scenario: Robots file allows crawling
- **WHEN** A crawler requests `/robots.txt` from the deployment.
- **THEN** The file allows every page and names the sitemap.

### Requirement: Sitemap publication consistency

The sitemap SHALL be generated from the same publication as the pages, so it names no page that the deployment lacks.

#### Scenario: Sitemap publication consistency
- **WHEN** A deployment generates its pages and sitemap.
- **THEN** Both use the same publication, and every page named by the sitemap exists in the deployment.

### Requirement: Teleport effect indexing exclusion

Teleport effects SHALL keep their published pages and internal links, but SHALL expose a `noindex` robots meta tag and SHALL NOT appear in the sitemap. This decision SHALL use the published effect type rather than its name or slug.

#### Scenario: Teleport effect indexing exclusion
- **WHEN** An effect has a non-Teleport published type but has "teleport" in its slug.
- **THEN** The slug does not cause the effect to receive the Teleport indexing exclusion.

### Requirement: Indexable page canonical addresses

Every indexable page SHALL have a nonempty absolute canonical in its initial HTML.

#### Scenario: Indexable page canonical addresses
- **WHEN** A client requests the initial HTML of an indexable item page.
- **THEN** The HTML includes a nonempty absolute canonical.

### Requirement: Indexable page title uniqueness and alignment

Every indexable page SHALL have a unique browser title with matching Open Graph and Twitter titles in its initial HTML.

#### Scenario: Indexable page title uniqueness and alignment
- **WHEN** A client reads the initial HTML of two indexable pages.
- **THEN** Each has a unique browser title and matching Open Graph and Twitter titles.

### Requirement: Indexable page factual descriptions

Every indexable page SHALL have a unique, factual description in its initial HTML.

#### Scenario: Indexable page factual descriptions
- **WHEN** A client reads the initial HTML of two indexable creature pages.
- **THEN** Each page contains a unique, factual description.

### Requirement: Home and list title formats

Home SHALL use `Afallon Wiki and Interactive Map | Afallon Compendium` as its browser title. Lists SHALL use `<Plural> | Afallon Wiki` as their browser title.

#### Scenario: Home and list title formats
- **WHEN** A client reads the browser titles of home and the Items list.
- **THEN** Home uses `Afallon Wiki and Interactive Map | Afallon Compendium` and the list uses `Items | Afallon Wiki`.

### Requirement: Map and About title formats

The map SHALL use `Afallon Interactive Map | Afallon Wiki` as its browser title. About SHALL use `About Afallon Compendium | Afallon Wiki` as its browser title.

#### Scenario: Map and About title formats
- **WHEN** A client reads the browser titles of the map and About.
- **THEN** The titles are `Afallon Interactive Map | Afallon Wiki` and `About Afallon Compendium | Afallon Wiki`, respectively.

### Requirement: Named page title format

Other named pages SHALL use `<Name> | Afallon Wiki` as their browser title.

#### Scenario: Named page title format
- **WHEN** A named page called Loot has no name collision.
- **THEN** Its browser title is `Loot | Afallon Wiki`.

### Requirement: Cross-kind entity title disambiguation

When an entity name appears on several published pages of different kinds, each affected title SHALL use `<Name> (<Kind>) | Afallon Wiki` with a reader-facing kind.

#### Scenario: Cross-kind entity title disambiguation
- **WHEN** An item and a creature both have the published name Ember.
- **THEN** Both titles include Ember followed by their respective reader-facing kind in parentheses and `| Afallon Wiki`.

### Requirement: Same-kind page distinguishing facts

Distinct pages of one kind with the same name SHALL show a truthful, visible distinguishing fact in both the title and the page.

#### Scenario: Same-kind page distinguishing facts
- **WHEN** Two distinct item pages share a name.
- **THEN** Each shows a truthful, visible distinguishing fact in both its title and its page.

### Requirement: Descriptions use useful player-facing facts

Descriptions SHALL identify the page's kind and useful facts actually shown there, in player language and complete sentences rather than repeating generic wiki text.

#### Scenario: Descriptions use useful player-facing facts
- **WHEN** A published creature page shows its level and location.
- **THEN** Its description identifies the creature kind and useful displayed facts in player language and complete sentences, not generic wiki text.

### Requirement: Deployment rejects invalid indexable metadata

The deployment SHALL reject duplicate titles or descriptions and missing descriptions or canonicals on indexable pages.

#### Scenario: Deployment rejects invalid indexable metadata
- **WHEN** Two indexable pages have duplicate descriptions.
- **THEN** The deployment rejects them.

### Requirement: Deployment checks teleport exclusions

The deployment SHALL reject teleport effect pages without `noindex` or with sitemap entries.

#### Scenario: Deployment checks teleport exclusions
- **WHEN** A teleport effect page has `noindex` but appears in the sitemap.
- **THEN** The deployment rejects the page's sitemap inclusion.

### Requirement: Equivalent effects share a published destination

Effects whose gameplay facts are equal SHALL share a single published page with combined sources, retargeted references, and a permanent redirect from a superseded address.

#### Scenario: Equivalent effects share a published destination
- **WHEN** Two effects have equal gameplay facts and separate sources and addresses.
- **THEN** They share one published page with combined sources, references target it, and the superseded address permanently redirects to it.

### Requirement: Structured data site names

The WebSite structured data SHALL keep `Afallon Compendium` as its name and list `Afallon Wiki` as an alternate name.

#### Scenario: Structured data site names
- **WHEN** A client reads WebSite structured data from the deployment.
- **THEN** Its name is `Afallon Compendium` and its alternate names include `Afallon Wiki`.

### Requirement: Open Graph site identity

Open Graph site name SHALL remain `Afallon Compendium`.

#### Scenario: Open Graph site identity
- **WHEN** A client reads the map page's Open Graph site name.
- **THEN** The site name is `Afallon Compendium`.

### Requirement: Home and About explain generated reference

Home and About SHALL explain that the reference works like a wiki but its pages are generated from game files, not edited by hand.

#### Scenario: Home and About explain generated reference
- **WHEN** A reader opens Home and About.
- **THEN** Both explain the wiki-like reference and that its pages are generated from game files rather than edited by hand.
