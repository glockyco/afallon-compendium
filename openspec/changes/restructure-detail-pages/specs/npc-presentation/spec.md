## MODIFIED Requirements

### Requirement: Quest people appear once per page

A quest document SHALL carry one NPC start entry and one turn-in entry per character page. Each entry SHALL carry the sorted area labels of the participating records. `turnIns` SHALL have entries of the shape `{ npc, areas }`. When several variants participate, the NPC reference SHALL point to their page. The Start and turn-in section of the quest page SHALL show one row for each character page and SHALL name whether the character starts the quest, completes it, or both.

#### Scenario: Multiple records give a quest
- **WHEN** three Fenric Doryn records give one quest in two areas
- **THEN** the Start and turn-in section shows one Fenric Doryn row with both areas

#### Scenario: Multiple records receive a quest
- **WHEN** two variants of one character receive a quest
- **THEN** the Start and turn-in section shows one page reference with their area labels

#### Scenario: The giver also completes the quest
- **WHEN** one character gives and completes a quest
- **THEN** the Start and turn-in section shows one row for that character that names both roles
