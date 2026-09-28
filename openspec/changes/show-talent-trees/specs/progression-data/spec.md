## ADDED Requirements

### Requirement: Talent artwork follows its source record

The catalog SHALL record an available icon for each talent tree and passive talent from its captured source sprite. The icon SHALL retain a link to its source record and scan evidence. A missing or unsupported sprite SHALL remain an explicit coverage issue. It SHALL NOT cause the tree or talent to disappear.

#### Scenario: Captured tree and passive talent
- **WHEN** a scan captures the icons of Bastion Breaker and Weighted Strikes
- **THEN** the catalog links each icon to the correct progression record and its scan evidence

#### Scenario: Sprite cannot be extracted
- **WHEN** a talent sprite cannot be extracted
- **THEN** the catalog reports the artwork issue
- **AND** the talent and its position remain in the catalog
