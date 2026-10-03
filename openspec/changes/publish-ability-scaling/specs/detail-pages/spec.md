## ADDED Requirements

### Requirement: Ability versions describe their applied effect scaling

For each ability version, the page SHALL link each applied effect's selected rank and summarize its supported caster-stat scaling, authored flat damage or healing, and selected-weapon percentage in the same version context as target and application chance. Versions SHALL not borrow a different rank's scaling, treat an effect-application percentage as chance to hit, or promise a fixed live combat outcome. An ability page SHALL show the parts of each applied effect's damage or healing in a Damage or Healing section of the main column, in the shared table style with one row per part and one column per rank when ranks differ, and state the damage type once. The game's tooltip text SHALL stay verbatim; beside it, one line SHALL name the caster stats that add to the amount when exactly one damage or one healing calculation applies to the rank.

#### Scenario: Distinct Assassin effect ranks
- **WHEN** a reader compares Brutal Slice and Vital Rend and opens their linked effect ranks
- **THEN** each ability shows Intellect-scaled Magical damage, a flat 25, and its own 200% or 250% selected-weapon contribution, rather than Strength scaling inferred from the Slicing Damage label

#### Scenario: Applied effect chance remains separate
- **WHEN** an ability version has a non-guaranteed application percentage for a scaling effect
- **THEN** the version shows the percentage as the effect's attempt to apply and presents scaling separately, without calling it a hit chance or a damage multiplier

## MODIFIED Requirements

### Requirement: Ability pages compare versions

An ability without an effect, description, learner, creature user, item use, or applied effect SHALL be withheld by a reviewed exclusion with catalog evidence checked at publication, and references to it SHALL remain readable as plain text. Other ability pages SHALL choose the tooltip version with most users and the first in a tie. The primary answer SHALL give that version's game tooltip text, a line naming the caster stats that add to its damage or healing when one verified calculation applies to the rank, and its named applied effects. An ability without a known learner or user SHALL add one short missing-source line to the answer. Use requirements SHALL appear in the side column. Costs and activation requirements SHALL remain in the tooltip text. Applied effects SHALL appear as linked outcomes in the answer, with their rank when the ability applies effects at more than one rank, chance, target in player words, and duration in human units when published; the per-hit explanation of chance SHALL appear only when an effect has a chance. These rows SHALL use the same application evidence as each effect page's Applied by list and omit withheld effects. Learners, creature users and item users SHALL appear once, in a Who learns and uses it section: users show their first eight links, and with a single version a Show all control SHALL reveal the rest in place rather than repeating them in a second section. When multiple versions exist, a Versions section SHALL compare them side by side in the layout of creature versions: one column per version and one row per fact. The rows SHALL be the version's text, the effects it applies when any version applies named effects that differ, its use requirements and its learning classes when the versions differ in them, and its users when any version has users. A version without a value in a row SHALL read None. Each version's users SHALL show their first eight links and a Show N more control, and the Who learns and uses it section's Show all link SHALL open every version's users. Teaching items and all usable rank links SHALL remain available without repeating the tooltip.

#### Scenario: Ability with five versions
- **WHEN** an ability has five versions
- **THEN** Versions compares five and Used by groups users under the correct version

#### Scenario: Ability from a talent tree
- **WHEN** a reader opens Maul
- **THEN** the answer links Druid's Primal Feral tier 2 talent and its tooltip identifies the Ursine Aspect condition

#### Scenario: Ability of a class that no race offers
- **WHEN** only a class without a page learns an ability
- **THEN** Learned by names that class as plain text and the tooltip still shows its costs

#### Scenario: Internal timer-only ability
- **WHEN** AoE Rock Attack has only cast timing and no known learner or user
- **THEN** it has no page, and its name remains readable wherever referenced

#### Scenario: Effectful ability without a known user
- **WHEN** a reader opens AoE Cursed
- **THEN** its tooltip text and linked combat effects appear in the primary answer, with one missing-source line and no empty users section

#### Scenario: Reciprocal applied effects
- **WHEN** Beacon of Dawn applies Beacon of Dawn Hot to a target for 10 seconds
- **THEN** Beacon of Dawn links the effect below its tooltip text and the effect links back to Beacon of Dawn under Applied by with the same rank and target

#### Scenario: Multiple effects from one ability
- **WHEN** an ability applies two effects with different ranks, chances, targets, or durations
- **THEN** each linked outcome retains its own published context, including its version where several ability versions exist

#### Scenario: Long applied-effect duration
- **WHEN** an ability applies an effect for 120 seconds
- **THEN** the effect outcome reads 2 minutes instead of 120 seconds

#### Scenario: Nine versions on a wide screen
- **WHEN** a reader opens Weapon Strike, whose nine versions have no users
- **THEN** Versions shows three blocks of three versions
- **AND** no Used by row appears

#### Scenario: Versions learned by different classes
- **WHEN** only the second of four Frostbolt versions is learned by the Wizard
- **THEN** the Learned by row links Wizard under Version 2 and reads None under the others

#### Scenario: Users of a single-version ability
- **WHEN** a reader opens Shadowbolt, which 19 creatures use, and chooses Show all
- **THEN** all 19 users appear in the Who learns and uses it section and no second Used by section repeats them
