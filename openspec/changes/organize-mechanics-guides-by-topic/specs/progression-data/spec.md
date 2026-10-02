## MODIFIED Requirements

### Requirement: Rules name where they appear

Each reviewed rule SHALL have a mechanics guide topic. The catalog SHALL retain its text, status, operands, links, and evidence, and MAY retain validated placements that identify a page kind, defined fact or section target, and supported `all`, `linked`, or conditional scope. An entity placement SHALL select a computed fact and the anchor of the guide section of its rule, not copy the rule prose to an entity page, column hint, or hover card. A `linked` placement SHALL apply only to its linked entities. Catalog creation SHALL reject a missing topic and an unknown page kind, target, or scope, and publication SHALL reject a rule section that its guide does not define; a placement SHALL NOT alter rule evidence or operands.

#### Scenario: Rule without a topic
- **WHEN** a reviewed rule has a placement on the Crafting section of item pages but no guide topic
- **THEN** catalog creation rejects it until it has an appropriate guide topic and section

#### Scenario: Unknown target
- **WHEN** a placement names a section not defined for its page kind
- **THEN** catalog creation fails and names the rule

#### Scenario: Placements added to accepted rules
- **WHEN** a rules record adds placements to previously accepted rules
- **THEN** each rule keeps its accepted text, status, operands, links, and evidence and its entity placement resolves to a guide-section link
