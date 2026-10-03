## ADDED Requirements

### Requirement: Effect ranks derive supported caster-stat contributions

The catalog SHALL associate every damage/healing effect rank with each applicable stat's recorded identity, coefficient in percent, and contribution source, while retaining authored flat amount, damage or healing type, explicit modifier, weapon percentage, and weapon-selection flags as distinct rank facts. Implicit damage contributions SHALL match the rank's main damage type to a stat's base-damage-type bonus, not its custom damage label. Implicit healing contributions SHALL match the rank's altered stat ID to the HEALING bonus target ID (recorded in the bonus's main damage type field), independently of the effect's custom healing label, and SHALL include a GLOBAL_HEALING bonus when the altered stat is the configured Health stat. An explicit damage-stat modifier SHALL contribute the selected stat multiplied by its modifier divided by 100 independently of implicit entries. A flat-calculation rank SHALL omit implicit bonuses but not its configured explicit modifier. A skill modifier SHALL refer to a skill, not a stat.

#### Scenario: Magical Slicing damage
- **WHEN** Assassin effects 394 and 536 have Magical main damage type, custom Slicing Damage labels, no explicit damage-stat ID, flat damage 25, and weapon modifiers 200% and 250%
- **THEN** the catalog assigns the applicable Magical base-damage stat (Intellect) contribution to both, not Strength or a second contribution from the custom label; it retains both distinct weapon percentages and their selected-weapon flags

#### Scenario: Same stat from separate rules
- **WHEN** the same stat applies once through a matching damage-type bonus and again through an explicit damage-stat modifier
- **THEN** both supported contributions remain identifiable and their coefficients are additive rather than de-duplicated

#### Scenario: Incomplete scan
- **WHEN** one referenced bonus or stat cannot be resolved but the rank's base amount or another modifier is known
- **THEN** the catalog preserves every known fact and reports unresolved references without replacing an unknown coefficient with zero or discarding the rank
