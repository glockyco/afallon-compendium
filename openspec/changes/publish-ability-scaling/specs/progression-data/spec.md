## ADDED Requirements

### Requirement: Effect ranks derive supported caster-stat contributions

The catalog SHALL associate every damage/healing effect rank with each applicable stat's recorded identity, coefficient in percent, and contribution source.

#### Scenario: Magical Slicing damage
- **WHEN** Assassin effects 394 and 536 have Magical main damage type, custom Slicing Damage labels, no explicit damage-stat ID, flat damage 25, and weapon modifiers 200% and 250%
- **THEN** the catalog assigns the applicable Magical base-damage stat (Intellect) contribution to both, not Strength or a second contribution from the custom label; it retains both distinct weapon percentages and their selected-weapon flags

#### Scenario: Same stat from separate rules
- **WHEN** the same stat applies once through a matching damage-type bonus and again through an explicit damage-stat modifier
- **THEN** both supported contributions remain identifiable and their coefficients are additive rather than de-duplicated

#### Scenario: Incomplete scan
- **WHEN** one referenced bonus or stat cannot be resolved but the rank's base amount or another modifier is known
- **THEN** the catalog preserves every known fact and reports unresolved references without replacing an unknown coefficient with zero or discarding the rank

#### Scenario: Effect ranks derive supported caster-stat contributions
- **WHEN** The catalog presents a damage or healing effect rank with applicable caster-stat contributions.
- **THEN** The catalog associates the rank with each applicable stat's recorded identity, coefficient in percent, and contribution source.

### Requirement: Effect ranks retain distinct authored facts

The catalog SHALL retain authored flat amount, damage or healing type, explicit modifier, weapon percentage, and weapon-selection flags as distinct damage/healing effect rank facts.

#### Scenario: Effect ranks retain distinct authored facts
- **WHEN** The catalog presents a damage or healing effect rank with an authored flat amount, type, explicit modifier, weapon percentage, and weapon-selection flags.
- **THEN** The catalog retains the authored flat amount, damage or healing type, explicit modifier, weapon percentage, and weapon-selection flags as distinct rank facts.

### Requirement: Implicit damage matches main damage type

Implicit damage contributions SHALL match the rank's main damage type to a stat's base-damage-type bonus, not its custom damage label.

#### Scenario: Implicit damage matches main damage type
- **WHEN** A damage rank's main damage type matches a stat's base-damage-type bonus and the rank has a different custom damage label.
- **THEN** The implicit damage contribution matches the main damage type to the stat's base-damage-type bonus, not the custom damage label.

### Requirement: Implicit healing matches the altered stat

Implicit healing contributions SHALL match the rank's altered stat ID to the HEALING bonus target ID (recorded in the bonus's main damage type field), independently of the effect's custom healing label.

#### Scenario: Implicit healing matches the altered stat
- **WHEN** A healing rank's altered stat ID matches a HEALING bonus target ID recorded in the bonus's main damage type field and the effect has a custom healing label.
- **THEN** The implicit healing contribution matches the altered stat ID to that HEALING bonus target ID independently of the custom healing label.

### Requirement: Health healing includes Global Healing

Implicit healing contributions SHALL include a GLOBAL_HEALING bonus when the altered stat is the configured Health stat.

#### Scenario: Health healing includes Global Healing
- **WHEN** A healing rank alters the configured Health stat and a GLOBAL_HEALING bonus applies.
- **THEN** The implicit healing contributions include the GLOBAL_HEALING bonus.

### Requirement: Explicit damage-stat modifiers contribute independently

An explicit damage-stat modifier SHALL contribute the selected stat multiplied by its modifier divided by 100 independently of implicit entries.

#### Scenario: Explicit damage-stat modifiers contribute independently
- **WHEN** A rank has an explicit damage-stat modifier as well as implicit entries.
- **THEN** The explicit modifier contributes the selected stat multiplied by its modifier divided by 100 independently of the implicit entries.

### Requirement: Flat-calculation ranks preserve explicit modifiers

A flat-calculation rank SHALL omit implicit bonuses but not its configured explicit modifier.

#### Scenario: Flat-calculation ranks preserve explicit modifiers
- **WHEN** A flat-calculation rank has implicit bonuses and a configured explicit modifier.
- **THEN** The rank omits implicit bonuses and retains its configured explicit modifier.

### Requirement: Skill modifiers reference skills

A skill modifier SHALL refer to a skill, not a stat.

#### Scenario: Skill modifiers reference skills
- **WHEN** The catalog presents a rank with a skill modifier.
- **THEN** The skill modifier refers to a skill, not a stat.
