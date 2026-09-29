## ADDED Requirements

### Requirement: The catalog records experience modifiers and Heroic settings

The catalog SHALL record the authored lower-level and higher-level experience modifiers of each creature that has them. It SHALL record the Heroic settings used to explain kill experience, Essence rewards, creature health and damage, gear scaling, affixes, affix loot, and Heroic gear stats. Each setting SHALL retain its source and build provenance. A missing setting SHALL remain unavailable rather than become a default or a number embedded in the site. Verified calculation rules SHALL carry recorded evidence through the catalog and publication.

#### Scenario: Creature experience modifiers
- **WHEN** a creature has lower-level and higher-level experience modifiers in captured evidence
- **THEN** the catalog records both values with the creature
- **AND** it does not infer which comparison uses either value from the field name alone

#### Scenario: Missing Heroic setting
- **WHEN** a Heroic setting is absent from the scan
- **THEN** the catalog marks that fact unavailable
- **AND** the publication does not invent a number for it

#### Scenario: Build-specific settings
- **WHEN** the accepted build publishes Heroic Essence and affix settings
- **THEN** each published setting comes from the accepted catalog or its recorded evidence
