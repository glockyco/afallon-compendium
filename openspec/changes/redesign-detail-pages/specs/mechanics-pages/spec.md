## MODIFIED Requirements

### Requirement: Mechanics pages are guides

Each mechanics page SHALL start with an overview of no more than three sentences. An ordered vertical flow of titled steps SHALL follow, each summarizing verified rules of its topic in plain language and providing a stable step anchor for entity-page links. A worked example SHALL appear beside the steps on wide screens and below them on narrow screens. Key values and tables SHALL remain available. A final closed disclosure SHALL retain the full topic rule list, evidence, source boundaries, and unknowns. Example entities SHALL link their published page or section. An entity's How it works link SHALL target the applicable guide step, not the rule-list disclosure; the guide SHALL distinguish computed examples from universal game rules.

#### Scenario: Entity links a craft step
- **WHEN** a crafted item shows the level where its base experience falls to half
- **THEN** How it works opens the guide at the matching crafting step
- **AND** a reader can open the final disclosure for the underlying verified rule and evidence

#### Scenario: Guide on a phone
- **WHEN** a reader opens a mechanics guide at 390 px
- **THEN** its example follows the steps and its tables remain readable without sideways page scroll

#### Scenario: Reader opens Crafting and Gathering
- **WHEN** a reader opens `/mechanics/crafting-and-gathering`
- **THEN** it shows the overview, craft and gather steps, spawner examples, and a worked example with Runeweave Regalia and Small Iron Vein
- **AND** the complete rule list and evidence remain in the final closed disclosure

#### Scenario: Step names a missing rule
- **WHEN** a guide step names a rule ID absent from its topic
- **THEN** publication fails rather than publish an unsupported explanation

#### Scenario: Heroic Essence example
- **WHEN** Heroic Essence rules and settings are verified
- **THEN** the Heroic Tier guide shows Essence per kill by creature rank and affix count at the health baseline
- **AND** this example names no creature

### Requirement: Mechanics have published pages

The publication SHALL provide a `mechanics` page kind with versioned documents for named topics. Each topic of the rules record SHALL have one guide document. The site SHALL route these documents under `/mechanics/<topic>`. The Guides column of the Browse menu SHALL link each published guide: Character Progression, Heroic Tier, and Crafting and Gathering. A missing topic SHALL return a not-found page. Each document SHALL use facts from the catalog and SHALL preserve its build identity. These pages SHALL use sentence case for headings and labels, title case for names and category values, and no internal record ids.

#### Scenario: Published topic
- **WHEN** a reader opens `/mechanics/character-progression`
- **THEN** the page loads the Character Progression document of the accepted publication
- **AND** the Guides column links to this page, `/mechanics/heroic-tier`, and `/mechanics/crafting-and-gathering`

#### Scenario: Unknown topic
- **WHEN** a reader opens `/mechanics/unknown-topic`
- **THEN** the site shows its not-found page
