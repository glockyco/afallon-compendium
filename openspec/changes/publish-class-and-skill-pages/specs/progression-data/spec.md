## ADDED Requirements

### Requirement: Races record the classes that they offer

The catalog SHALL record for each race the classes that the race offers, in authored order. A class ID without a class record SHALL become a missing-reference issue, and SHALL NOT count as an offered class. The catalog SHALL derive the set of classes that at least one race offers.

#### Scenario: Offered classes of build 25434619
- **WHEN** the catalog is built from a scan of build 25434619
- **THEN** Dwarf, Human, and Orc each offer Shieldmaster, Wizard, Necromancer, Assassin, and Druid
- **AND** no race offers Hunter or Berserker
