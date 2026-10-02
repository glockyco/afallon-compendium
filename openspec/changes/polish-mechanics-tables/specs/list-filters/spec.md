## ADDED Requirements

### Requirement: Catalog relationships link published entities

A catalog relation column SHALL preserve the identity of its referenced entity when it has a published page. Its value SHALL use the site's entity link and hover preview rather than a plain name. A relation without a published destination SHALL remain readable as plain text. Links SHALL retain compact cells and readable phone rows.

#### Scenario: Quest giver in a catalog row
- **WHEN** a quest row names an NPC giver with a published page
- **THEN** the giver cell links to that NPC and offers its standard preview

#### Scenario: Unpublished relation
- **WHEN** a row names an entity without a published page
- **THEN** the name remains visible without a dead link
