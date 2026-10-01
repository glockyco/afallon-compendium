## ADDED Requirements

### Requirement: Creature pages disclose Hunter tameability

A creature page SHALL identify a creature as tameable by a Hunter only when its creature type is Beast, its tamable flag is set, and its rank is a normal mob. The page SHALL state the known conditions in one short fact: a Hunter of the creature's level or higher, with no pet, within 30 m. The level condition SHALL refer to the creature's published level, so a creature whose level scales with the player shows that through its level line. A shared page SHALL attribute tameability to the qualifying variants only. The Hunter class name SHALL link to its class page when that page is published.

#### Scenario: A fixed-level beast
- **WHEN** a level 12 Beast is a normal mob with its tamable flag set
- **THEN** its title facts say that a Hunter can tame it
- **AND** its taming fact names a Hunter of its level or higher, with no pet, within 30 m

#### Scenario: A beast whose level scales
- **WHEN** a qualifying Beast is published at level 20–30, scaling with the player
- **THEN** its taming fact uses the same level rule
- **AND** its level line says that its level scales with the player

#### Scenario: A flagged Elite
- **WHEN** an Elite Beast has its tamable flag set
- **THEN** its page does not say that a Hunter can tame it

#### Scenario: Mixed variants
- **WHEN** records on the same creature page differ in whether they qualify
- **THEN** the variants table says "Can be tamed" only for the qualifying variants
