## MODIFIED Requirements

### Requirement: Mechanics have published pages

The publication SHALL provide a `mechanics` page kind with versioned documents for named topics. Each topic of the rules record SHALL have one mechanics document. The site SHALL route these documents under `/mechanics/<topic>`. The Mechanics column of the Browse menu SHALL link each published topic: Character Progression, Heroic Tier, Crafting and Gathering, and Corruption. A missing topic SHALL return a not-found page. Each document SHALL use facts from the catalog and SHALL preserve its build identity. These pages SHALL use sentence case for headings and labels, title case for names and category values, and no internal record ids.

#### Scenario: Published topic
- **WHEN** a reader opens `/mechanics/character-progression`
- **THEN** the page loads the Character Progression document of the accepted publication
- **AND** the Mechanics column links to this page, `/mechanics/heroic-tier`, `/mechanics/crafting-and-gathering`, and `/mechanics/corruption`

#### Scenario: Unknown topic
- **WHEN** a reader opens `/mechanics/unknown-topic`
- **THEN** the site shows its not-found page
