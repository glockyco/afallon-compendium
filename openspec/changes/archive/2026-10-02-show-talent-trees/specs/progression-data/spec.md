## ADDED Requirements

### Requirement: Talent artwork follows its source record

The catalog SHALL record an available icon for each talent tree and passive talent from its captured source sprite. The icon SHALL keep a link to its source record and scan evidence. A missing or unreadable sprite SHALL remain an explicit coverage issue and SHALL NOT remove the tree or the talent.

#### Scenario: Captured tree and passive talent
- **WHEN** a scan captures the icons of a talent tree and of a passive talent in it
- **THEN** the catalog links each icon to the correct tree or bonus record and its scan evidence

#### Scenario: Sprite cannot be read
- **WHEN** a talent sprite cannot be read
- **THEN** the catalog reports the artwork issue
- **AND** the talent and its tier and row remain in the catalog

### Requirement: Talent trees keep the layout facts the game draws

The catalog SHALL record, for each talent tree, the facts that the game's talent tree panel reads to place nodes and draw lines between them: at least the tree's tier count and each node's tier and row. A fact SHALL come from the captured tree record, not from its order in a list.

#### Scenario: Node position
- **WHEN** a passive talent sits in tier 3 and row 2 of its tree
- **THEN** the catalog records tier 3 and row 2 for that node
