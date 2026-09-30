## MODIFIED Requirements

### Requirement: Rules name where they appear

Each reviewed rule SHALL have a mechanics guide topic. The catalog SHALL retain its text, status, operands, links, and evidence, and MAY retain validated placements that identify a page kind, defined fact or section target, and supported `all`, `linked`, or conditional scope. An entity placement SHALL select a computed fact and an anchor of a guide step, not copy the rule prose to an entity page, column hint, or hover card. A `linked` placement SHALL apply only to its linked entities. Catalog creation SHALL reject a missing topic and an unknown page kind, target, scope, or guide step; a placement SHALL NOT alter rule evidence or operands.

#### Scenario: Rule without a topic
- **WHEN** a reviewed rule has a placement on the Crafting section of item pages but no guide topic
- **THEN** catalog creation rejects it until it has an appropriate guide topic and step

#### Scenario: Unknown target
- **WHEN** a placement names a section not defined for its page kind
- **THEN** catalog creation fails and names the rule

#### Scenario: Placements added to accepted rules
- **WHEN** a rules record adds placements to previously accepted rules
- **THEN** each rule keeps its accepted text, status, operands, links, and evidence and its entity placement resolves to a guide-step link

## ADDED Requirements

### Requirement: Publication derives place counts and endpoint spawn shares

The publication SHALL provide distinct known map-spot counts grouped by published place for gathering nodes and creature locations and total known spots for applicable item source routes. A spot shared by equivalent merged rows SHALL count once; different conditional placements SHALL preserve their conditions in the expanded list. A gathering node with verified weighted spawner options SHALL provide effective option share at the lowest and highest supported skill levels, computed from eligible captured options and their verified weighting rules, with the skill levels and denominator identified. It SHALL distinguish a choice by one spawner from an aggregate over multiple spawners. If no meaningful aggregate is supported, it SHALL present separately supported shares or state that an overall share is unknown; it SHALL NOT imply an attunement bonus or call a weight a drop chance. Missing place or weight evidence SHALL not produce an invented count or probability.

#### Scenario: Repeated placement under one place
- **WHEN** two equivalent relations refer to the same known map spot
- **THEN** the publication counts that spot once for its place and route

#### Scenario: Skill changes node selection
- **WHEN** one spawner has verified eligible option weights at its lowest and highest skill levels
- **THEN** the node's published share at each level uses its effective weight divided by the sum of eligible effective weights at that level
- **AND** the page labels the levels and that these shares describe the spawner's selection, not yield chance

#### Scenario: Incomparable spawners
- **WHEN** several spawners offer a node but lack a verified common weighting denominator
- **THEN** the publication does not invent one overall percentage
