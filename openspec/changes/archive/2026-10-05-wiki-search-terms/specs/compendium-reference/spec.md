## MODIFIED Requirements

### Requirement: Search engines find every published page

The deployment SHALL include `/sitemap.xml`, which lists the address of the hub, every published list page, every published entity page, and the map, and `/robots.txt`, which allows every page and names the sitemap. The sitemap SHALL be generated from the same publication as the pages, so it names no page that the deployment lacks. Every published reference page SHALL have a descriptive browser title and matching Open Graph and Twitter titles: `<Name> · Afallon Wiki` for entities, `<Plural> · Afallon Wiki` for lists, and `<Page> · Afallon Wiki` for map, mechanics, About, Coverage, and other named pages. Home SHALL use `Afallon Wiki and Interactive Map · Afallon Compendium`. Descriptions SHALL retain useful facts about the page and refer naturally to the wiki where appropriate. The WebSite structured data SHALL keep `Afallon Compendium` as its name and list `Afallon Wiki` as an alternate name, while Open Graph site name SHALL remain `Afallon Compendium`. Home and About SHALL explain that the reference works like a wiki but its pages are generated from game files, not edited by hand.

#### Scenario: Page linked only from a hidden row
- **WHEN** an entity page is linked only from rows that a list or relation preview has not built
- **THEN** `/sitemap.xml` still lists its address

#### Scenario: Withheld record
- **WHEN** the publication withholds a record
- **THEN** the sitemap names no page for it

#### Scenario: Search client requests page titles
- **WHEN** a client requests home, a list, an entity, the map, a mechanics page, or About
- **THEN** the initial HTML gives that route its specified browser title and matching Open Graph and Twitter titles
- **AND** the site name remains Afallon Compendium

#### Scenario: Search client reads site identity
- **WHEN** a client reads the home page's WebSite JSON-LD
- **THEN** the name is `Afallon Compendium` and alternateName includes `Afallon Wiki`
