## ADDED Requirements

### Requirement: Search engines find every published page

The deployment SHALL include `/sitemap.xml`, which lists the address of the hub, every published list page, every published entity page, and the map, and `/robots.txt`, which allows every page and names the sitemap. The sitemap SHALL be generated from the same publication as the pages, so it names no page that the deployment lacks.

#### Scenario: Page linked only from a hidden row
- **WHEN** an entity page is linked only from rows that a list or relation preview has not built
- **THEN** `/sitemap.xml` still lists its address

#### Scenario: Withheld record
- **WHEN** the publication withholds a record
- **THEN** the sitemap names no page for it
