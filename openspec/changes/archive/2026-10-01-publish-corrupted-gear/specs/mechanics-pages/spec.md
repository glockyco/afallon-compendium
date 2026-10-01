## MODIFIED Requirements

### Requirement: Mechanics pages are guides

Each mechanics page SHALL start with an overview of no more than three sentences. An ordered flow of titled steps SHALL follow, each summarizing verified rules of its topic in plain language and providing a stable step anchor for entity-page links. Across Character Progression, Heroic Tier, Crafting and Gathering, and Corruption, steps SHALL occupy two columns on wide screens and stack in reading order on narrow screens. A worked example SHALL span the full width below all steps on wide screens and follow them on narrow screens. Key values and tables SHALL remain available. A final closed disclosure SHALL retain the full topic rule list, evidence, source boundaries, and unknowns. Example entities SHALL link their published page or section. An entity's How it works link SHALL target the applicable guide step, not the rule-list disclosure; the guide SHALL distinguish computed examples from universal game rules.

#### Scenario: Entity links a craft step
- **WHEN** a crafted item shows the level where its base experience falls to half
- **THEN** How it works opens the guide at the matching crafting step
- **AND** a reader can open the final disclosure for the underlying verified rule and evidence

#### Scenario: Guide on a phone
- **WHEN** a reader opens any of the four mechanics guides at 390 px
- **THEN** its steps stack in reading order, its example follows the steps, and its tables remain readable without sideways page scroll

#### Scenario: Guide on a wide screen
- **WHEN** a reader opens any of the four mechanics guides on a wide screen
- **THEN** its steps appear in two columns and its worked example spans the full width beneath them

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
