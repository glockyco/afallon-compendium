## MODIFIED Requirements

### Requirement: Item pages embed gear sets

An item that belongs to a gear set SHALL include a reference to the set, the set's member references, and its tiers in `facts.gearSet`. Each tier SHALL name its equipped-member count and stat bonuses. The item tooltip SHALL show the full set, and the page SHALL link the set and its resolvable members.

#### Scenario: A member of a gear set
- **WHEN** an item belongs to a set with three members and two bonus tiers
- **THEN** its page shows the set name, all members, and both tiers
- **AND** the set name links the set's page and each resolvable member links to its item page
