## MODIFIED Requirements

### Requirement: Unknown facts are not fabricated

Entity pages SHALL render established publication facts and SHALL distinguish unknown values from known values. A missing value SHALL read Unknown, or words such as "an unknown time" inside a sentence, with its reason available on hover, focus, and tap. It SHALL NOT read as a bare mark beside or in place of a value. An absent drop chance SHALL be marked in its chance cell rather than guessed, and a creature without a published location SHALL retain its drop information and identify the location gap in its location section.

#### Scenario: A drop chance is unknown
- **WHEN** a published drop has a quantity but no established chance
- **THEN** its chance cell shows Unknown with an explanation available on hover or focus

#### Scenario: A creature has no published location
- **WHEN** an NPC has drops but no published location
- **THEN** its Where to find section says no known location
- **AND** the drops remain visible

#### Scenario: An unknown gold amount
- **WHEN** a creature drops Gold without a valid quantity
- **THEN** its quantity cell reads Unknown with the reason on hover, and no dash follows it
