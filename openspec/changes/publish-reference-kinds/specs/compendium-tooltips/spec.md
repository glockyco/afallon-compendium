## MODIFIED Requirements

### Requirement: Item tooltips present embedded gear sets

An item tooltip SHALL show its published gear-set name, members, and tiers in authored order. On a page, the set name SHALL link the set's page. It SHALL distinguish the viewed member from other members and show each tier's equipped-member threshold and signed stat bonuses without inventing an equipment inventory.

#### Scenario: Reader opens a set-item tooltip
- **WHEN** the reader opens the tooltip for a member of a multi-item gear set
- **THEN** it lists the current member distinctly from the other members and shows each tier's threshold and signed stat bonuses in authored order
