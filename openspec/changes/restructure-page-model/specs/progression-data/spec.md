## ADDED Requirements

### Requirement: Rules name where they appear

Each rule of the reviewed rules record SHALL have a topic, one or more placements, or both. A placement SHALL name a page kind, a target, and a scope. The target SHALL be a section, a fact, or a column that the contract defines for that page kind. The scope SHALL be `all`, `linked`, or a condition that the contract defines for that page kind. The catalog SHALL keep the placements of each rule with its text, status, operands, links, and evidence. Catalog creation SHALL reject a rule without a topic and without a placement, and a placement with an unknown page kind, target, or scope. Placements SHALL NOT change the text, status, operands, links, or evidence of a rule.

#### Scenario: Rule without a topic
- **WHEN** a reviewed rule has no topic and one placement on the Crafting section of item pages
- **THEN** the catalog keeps the rule with its placement
- **AND** no guide shows the rule

#### Scenario: Unknown target
- **WHEN** a placement names a section that the contract does not define for its page kind
- **THEN** catalog creation fails and names the rule

#### Scenario: Placements added to accepted rules
- **WHEN** a new rules record adds placements to the rules of the accepted record
- **THEN** each rule keeps its accepted text, status, operands, links, and evidence
