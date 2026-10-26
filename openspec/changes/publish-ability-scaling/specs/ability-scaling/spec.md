## Purpose

Give players evidence-bounded, linked explanations of how each applicable caster stat and selected weapon contributes to ability and effect outcomes, without turning authored operands into guaranteed hit or healing totals.

## ADDED Requirements

### Requirement: Scaling relationships remain rank-specific and additive

Each published damage or healing effect rank SHALL expose every supported caster-stat contribution as a linked stat, a percentage coefficient, and its source (damage type, healing type, global healing, or explicit modifier).

#### Scenario: Additive damage category and explicit modifier
- **WHEN** a damage rank matches a stat's damage-type bonus at 100% and explicitly names another stat at 50%
- **THEN** it exposes both linked contributions and keeps its authored flat damage separate, without treating the explicit stat as a replacement for the damage-type match

#### Scenario: Health-target healing and global healing
- **WHEN** a healing rank alters Health and the caster has an applicable HEALING bonus matched to that altered stat and a GLOBAL_HEALING bonus for the configured Health stat
- **THEN** both contributions are available with their own coefficients and source descriptions regardless of the rank's custom healing label, including Potion; a HEALING bonus matched to a different altered stat is not attributed to this rank

#### Scenario: Flat calculation keeps an explicit stat
- **WHEN** a flat-calculation rank has both a matching type bonus and a nonzero explicit stat modifier
- **THEN** only the explicit stat modifier appears among its applicable caster-stat contributions

#### Scenario: Selected weapon is not an invented total
- **WHEN** a rank specifies 250% weapon damage with a selected hand or ranged weapon
- **THEN** the rank names that percentage and selected weapon context separately from flat damage and caster-stat scaling, without publishing a fixed weapon-roll amount or a guaranteed final hit

#### Scenario: Scaling relationships remain rank-specific and additive
- **WHEN** A damage or healing effect rank with supported caster-stat contributions is published.
- **THEN** The rank exposes every supported contribution as a linked stat, a percentage coefficient, and its source as damage type, healing type, global healing, or explicit modifier.

### Requirement: Percentage coefficients express per-point contributions

A coefficient of 100% SHALL mean one point of contribution per point of the stat.

#### Scenario: Percentage coefficients express per-point contributions
- **WHEN** A published damage or healing effect rank shows a caster-stat contribution with a coefficient of 100%.
- **THEN** The coefficient means one point of contribution per point of that stat.

### Requirement: Applicable scaling entries add without replacement

Several applicable entries SHALL add rather than replace one another, including an explicit modifier that names the same stat as an implicit entry.

#### Scenario: Applicable scaling entries add without replacement
- **WHEN** A rank has an implicit entry and an explicit modifier that names the same stat.
- **THEN** Both applicable entries add rather than replace one another.

### Requirement: Flat amounts and weapon selection remain separate from stats

A rank's authored flat amount, selected-weapon damage percentage and main-hand, off-hand, or ranged selection SHALL remain separate from these stat contributions.

#### Scenario: Flat amounts and weapon selection remain separate from stats
- **WHEN** A rank has caster-stat contributions, an authored flat amount, a selected-weapon damage percentage, and a ranged weapon selection.
- **THEN** The rank keeps its authored flat amount, selected-weapon damage percentage, and ranged selection separate from its stat contributions.

### Requirement: Flat-calculation scaling retains only configured explicit contributions

A flat-calculation rank SHALL not claim an implicit damage/healing contribution but SHALL retain its explicit stat contribution when configured.

#### Scenario: Flat-calculation scaling retains only configured explicit contributions
- **WHEN** A flat-calculation rank has a matching implicit damage or healing bonus and a configured explicit stat contribution.
- **THEN** The rank does not claim the implicit contribution and retains the configured explicit stat contribution.
### Requirement: Scaling surfaces preserve real application context

The public effect outcome and each applying ability's selected version SHALL expose the same effect-rank scaling facts, including source stat links, coefficients, weapon selection, and authored base amount when present.

#### Scenario: Assassin slicing abilities in the browser
- **WHEN** a reader opens Assassin's Brutal Slice and Vital Rend abilities and their applied effects 394 and 536
- **THEN** each relevant effect rank shows Magical damage scaling with Intellect, its authored 25 flat damage, and respectively 200% or 250% selected weapon damage; its custom Slicing Damage label does not reclassify it as physical Strength scaling, and the ability's matching version links the same rank-specific outcome

#### Scenario: Reverse player and creature sources
- **WHEN** a reader follows Intellect from a published player ability or a published creature's ability to the stat page
- **THEN** the page links the applicable effect and its player or creature application context, and a reader can return to the corresponding rank without confusing the creature's own stat value with the player's stat

#### Scenario: Chance is not accuracy
- **WHEN** an ability applies a scaling effect at a recorded 50% chance
- **THEN** its outcome describes the effect's scaling and the 50% application attempt separately, and does not call either a 50% chance to land a hit

#### Scenario: Scaling surfaces preserve real application context
- **WHEN** A reader opens an effect rank and an applying ability's selected version with authored scaling facts.
- **THEN** Both expose the same source stat links, coefficients, weapon selection, and authored base amount when present.

### Requirement: Stat pages link reverse application context

Stat pages SHALL link reverse uses of their stat in effects, the abilities applying those effects, and creature abilities where known.

#### Scenario: Stat pages link reverse application context
- **WHEN** A reader opens a stat page whose stat is used by an effect with known player and creature applying abilities.
- **THEN** The stat page links the effect and the player and creature abilities applying it.

### Requirement: Source groupings distinguish effects and users

Source groupings SHALL keep an effect and its users distinguishable without counting the same application repeatedly.

#### Scenario: Source groupings distinguish effects and users
- **WHEN** A source grouping presents an effect and its applying users.
- **THEN** The effect and its users remain distinguishable, and the same application is not counted repeatedly.

### Requirement: Compact surfaces lead to complete scaling explanations

List rows and tooltips SHALL provide a short meaningful scaling signal where supported and link or lead to the complete explanation.

#### Scenario: Compact surfaces lead to complete scaling explanations
- **WHEN** A reader views a list row or tooltip for an effect with supported scaling information.
- **THEN** The row or tooltip provides a short meaningful scaling signal and links or leads to the complete explanation.

### Requirement: Application chance remains distinct from hit chance

Application chance SHALL remain distinct from a hit chance.

#### Scenario: Application chance remains distinct from hit chance
- **WHEN** A reader views an effect with a recorded 50% application chance.
- **THEN** The application chance is presented distinctly from a hit chance.

### Requirement: Scaling operands do not promise final live values

No preview, list, tooltip, or page SHALL promise a final live damage/healing value based on these operands alone.

#### Scenario: Scaling operands do not promise final live values
- **WHEN** A reader views scaling operands in a preview, list, tooltip, or page.
- **THEN** The surface does not promise a final live damage/healing value based on those operands alone.
### Requirement: Partial evidence stays useful and honest

If an effect rank or applying source has an unresolved stat, damage/healing category, weapon choice, or rule, the publication SHALL retain supported base amount, type, known contributions, source reference, and weapon percentage.

#### Scenario: Missing bonus definition
- **WHEN** an effect has authored damage and a weapon percentage but lacks the evidence needed to resolve its matching stat bonus
- **THEN** readers still see the authored damage and weapon percentage, while the missing stat relationship is not presented as verified zero scaling

#### Scenario: Unresolved linked stat
- **WHEN** a configured modifier points to a stat record unavailable in the scan
- **THEN** its coefficient and recorded stat identity remain available as a non-dead reference and a missing-reference issue is reported, without inventing a linked stat page

#### Scenario: Partial evidence stays useful and honest
- **WHEN** An effect rank has an unresolved stat but supported base amount, type, contributions, source reference, and weapon percentage.
- **THEN** The publication retains all of those supported facts.

### Requirement: Unavailable relationships remain explicit

If an effect rank or applying source has an unresolved stat, damage/healing category, weapon choice, or rule, the publication SHALL identify unavailable relationships instead of assigning a zero coefficient, guessing a stat from a custom category, fabricating a weapon choice, or hiding the entire effect or ability.

#### Scenario: Unavailable relationships remain explicit
- **WHEN** An applying source has an unresolved stat relationship and weapon choice.
- **THEN** The publication identifies the unavailable relationships without assigning a zero coefficient, guessing a stat from a custom category, fabricating a weapon choice, or hiding the effect or ability.

### Requirement: Publications without derived scaling remain readable

Existing publications without derived scaling SHALL remain readable, without a claim that no caster stat can affect them.

#### Scenario: Publications without derived scaling remain readable
- **WHEN** A reader opens an existing publication without derived scaling.
- **THEN** The publication remains readable and does not claim that no caster stat can affect it.

### Requirement: Periodic scaling uses current caster stats at each pulse

Combat explanations SHALL distinguish damage-over-time and healing-over-time effects from a single snapshotted application amount: supported caster-stat and weapon calculations are performed for each pulse using the caster's then-current applicable values. A tooltip value for the present character is an example, not a promise that all future pulses or applied hits have that amount.

#### Scenario: Stat changes between periodic pulses
- **WHEN** the caster's applicable stat changes after a damage-over-time or healing-over-time effect is applied but before a later pulse
- **THEN** the explanation says that the later pulse uses the then-current stat rather than the value at application; a static tooltip amount is not labeled the guaranteed amount of every pulse

#### Scenario: Periodic category differs by action
- **WHEN** Fireball damage-over-time, Bleeding damage-over-time, and Renewal healing-over-time have distinct matched stat families
- **THEN** each effect displays only its applicable stat contributions, and the guide explains why neither every periodic effect nor every healing action shares one universal scaling stat
