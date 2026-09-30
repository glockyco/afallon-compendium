## ADDED Requirements

### Requirement: Mechanics pages are guides

Each mechanics page SHALL start with an overview of at most three sentences. An ordered list of steps SHALL follow. Each step SHALL have a title and one sentence, and SHALL summarize named rules of its topic. The page SHALL then show its key values and one worked example. The publication SHALL compute the example from published facts with the verified rules of the topic. When the example names an entity, the entity SHALL be published and SHALL link to its page or section. The full rule list of the topic SHALL appear at the end of the page, in a closed disclosure named "All rules and evidence", grouped by guide section with the evidence of each rule. Each rule of the topic SHALL appear once in the disclosure. Outside the disclosure, the page SHALL NOT show a rule sentence as a list item. The disclosure SHALL name the pages and sections where the record also places a rule.

#### Scenario: Reader opens Crafting and Gathering
- **WHEN** a reader opens `/mechanics/crafting-and-gathering`
- **THEN** the page shows the overview, the steps of a craft and of a gather, the spawner examples, and a worked example with Runeweave Regalia and Small Iron Vein
- **AND** the rule list is in a closed disclosure at the end of the page

#### Scenario: Step names a missing rule
- **WHEN** a step of a guide names a rule id that the topic does not have
- **THEN** the publication fails

#### Scenario: Heroic Essence example
- **WHEN** the Heroic Essence rules and settings are verified
- **THEN** the Heroic Tier page shows the Essence per kill for each creature rank and affix count at the health baseline
- **AND** the example names no creature

## MODIFIED Requirements

### Requirement: Mechanics have published pages

The publication SHALL provide a `mechanics` page kind with versioned documents for named topics. Each topic of the rules record SHALL have one guide document. The site SHALL route these documents under `/mechanics/<topic>`. The Mechanics navigation group SHALL link each published guide: Character Progression, Heroic Tier, and Crafting and Gathering. A missing topic SHALL return a not-found page. Each document SHALL use facts from the catalog and SHALL preserve its build identity. These pages SHALL use sentence case for headings and labels, title case for names and category values, and no internal record ids.

#### Scenario: Published topic
- **WHEN** a reader opens `/mechanics/character-progression`
- **THEN** the page loads the Character Progression document of the accepted publication
- **AND** the Mechanics navigation group links to this page, `/mechanics/heroic-tier`, and `/mechanics/crafting-and-gathering`

#### Scenario: Unknown topic
- **WHEN** a reader opens `/mechanics/unknown-topic`
- **THEN** the site shows its not-found page
