## ADDED Requirements

### Requirement: Ability versions describe their applied effect scaling

For each ability version, the page SHALL link each applied effect's selected rank and summarize its supported caster-stat scaling, authored flat damage or healing, and selected-weapon percentage in the same version context as target and application chance. Versions SHALL not borrow a different rank's scaling, treat an effect-application percentage as chance to hit, or promise a fixed live combat outcome. The ability's tooltip and compact preview SHALL give a meaningful, linked scaling signal when supported without overwhelming the primary answer with secondary mechanics.

#### Scenario: Distinct Assassin effect ranks
- **WHEN** a reader compares Brutal Slice and Vital Rend and opens their linked effect ranks
- **THEN** each ability shows Intellect-scaled Magical damage, a flat 25, and its own 200% or 250% selected-weapon contribution, rather than Strength scaling inferred from the Slicing Damage label

#### Scenario: Applied effect chance remains separate
- **WHEN** an ability version has a non-guaranteed application percentage for a scaling effect
- **THEN** the version shows the percentage as the effect's attempt to apply and presents scaling separately, without calling it a hit chance or a damage multiplier
