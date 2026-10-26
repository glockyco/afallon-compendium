## ADDED Requirements

### Requirement: Ability versions describe their applied effect scaling

For each ability version, the page SHALL link each applied effect's selected rank and summarize its supported caster-stat scaling, authored flat damage or healing, and selected-weapon percentage in the same version context as target and application chance.

#### Scenario: Distinct Assassin effect ranks
- **WHEN** a reader compares Brutal Slice and Vital Rend and opens their linked effect ranks
- **THEN** each ability shows Intellect-scaled Magical damage, a flat 25, and its own 200% or 250% selected-weapon contribution, rather than Strength scaling inferred from the Slicing Damage label

#### Scenario: Applied effect chance remains separate
- **WHEN** an ability version has a non-guaranteed application percentage for a scaling effect
- **THEN** the version shows the percentage as the effect's attempt to apply and presents scaling separately, without calling it a hit chance or a damage multiplier

#### Scenario: Ability versions describe their applied effect scaling
- **WHEN** A reader views an ability version with an applied effect.
- **THEN** The page links the effect's selected rank and summarizes its supported caster-stat scaling, authored flat damage or healing, and selected-weapon percentage in the same version context as target and application chance.

### Requirement: Ability versions use their selected rank's scaling

Ability versions SHALL not borrow a different rank's scaling.

#### Scenario: Ability versions use their selected rank's scaling
- **WHEN** A reader views an ability version whose selected effect rank has different scaling from another rank.
- **THEN** The version does not borrow the other rank's scaling.

### Requirement: Ability versions keep application chance distinct from hit chance

Ability versions SHALL not treat an effect-application percentage as chance to hit.

#### Scenario: Ability versions keep application chance distinct from hit chance
- **WHEN** A reader views an ability version with an effect-application percentage.
- **THEN** The version does not present that percentage as chance to hit.

### Requirement: Ability versions avoid fixed live outcome promises

Ability versions SHALL not promise a fixed live combat outcome.

#### Scenario: Ability versions avoid fixed live outcome promises
- **WHEN** A reader views an ability version's damage or healing scaling.
- **THEN** The version does not promise a fixed live combat outcome.

### Requirement: Ability pages organize damage and healing parts

An ability page SHALL show the parts of each applied effect's damage or healing in a Damage or Healing section of the main column, in the shared table style with one row per part and one column per rank when ranks differ, and state the damage type once.

#### Scenario: Ability pages organize damage and healing parts
- **WHEN** A reader views an ability page with applied effect damage or healing whose ranks differ.
- **THEN** The main column's Damage or Healing section shows each applied effect's parts in the shared table style, with one row per part and one column per rank, and states the damage type once.

### Requirement: Ability pages preserve game tooltip text

The game's tooltip text SHALL stay verbatim on the ability page.

#### Scenario: Ability pages preserve game tooltip text
- **WHEN** An ability page displays the game's tooltip text.
- **THEN** The displayed tooltip text is verbatim.

### Requirement: Ability tooltips name contributing caster stats

Beside the game's tooltip text, one line SHALL name the caster stats that add to the amount when exactly one damage or one healing calculation applies to the rank.

#### Scenario: Ability tooltips name contributing caster stats
- **WHEN** An ability page displays a rank's tooltip and exactly one damage calculation applies to the rank.
- **THEN** One line beside the tooltip names the caster stats that add to the amount.

### Requirement: Primary ability tooltip and effects

The primary answer SHALL give the selected tooltip version's game tooltip text and its named applied effects.

#### Scenario: Primary ability tooltip and effects
- **WHEN** An ability's selected tooltip version has game tooltip text and named applied effects.
- **THEN** The primary answer gives that version's game tooltip text and named applied effects.

### Requirement: Verified ability scaling stats

The primary answer SHALL give a line naming the caster stats that add to the selected tooltip version's damage or healing when one verified calculation applies to the rank.

#### Scenario: Verified ability scaling stats
- **WHEN** One verified calculation applies to an ability rank and identifies caster stats that add to the selected tooltip version's healing.
- **THEN** The primary answer includes a line naming those caster stats.

### Requirement: Ability use requirements placement

Use requirements SHALL appear in the side column.

#### Scenario: Ability use requirements placement
- **WHEN** An ability has use requirements.
- **THEN** The side column shows the use requirements.

### Requirement: Conditional per-hit chance explanation

The per-hit explanation of chance SHALL appear only when an effect has a chance.

#### Scenario: Conditional per-hit chance explanation
- **WHEN** An applied effect has no chance.
- **THEN** No per-hit explanation of chance appears for that effect.

### Requirement: Single-version users expand in place

With a single version, a Show all control in the Who learns and uses it section SHALL reveal the remaining users in place rather than repeating them in a second section.

#### Scenario: Single-version users expand in place
- **WHEN** A reader chooses Show all for a single-version ability with more than eight users.
- **THEN** The remaining users appear in place in Who learns and uses it rather than being repeated in a second section.

## MODIFIED Requirements

### Requirement: Ability pages compare versions

An ability without an effect, description, learner, creature user, item use, or applied effect SHALL be withheld by a reviewed exclusion with catalog evidence checked at publication.

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

#### Scenario: Ability pages compare versions
- **WHEN** An ability has no effect, description, learner, creature user, item use, or applied effect at publication.
- **THEN** A reviewed exclusion with catalog evidence checked at publication withholds the ability.

### Requirement: Withheld ability references remain readable

References to an ability withheld by a reviewed exclusion SHALL remain readable as plain text.

#### Scenario: Withheld ability references remain readable
- **WHEN** A page references an ability withheld by a reviewed exclusion.
- **THEN** The reference remains readable as plain text.

### Requirement: Ability tooltip version selection

Other ability pages SHALL choose the tooltip version with most users and the first in a tie.

#### Scenario: Ability tooltip version selection
- **WHEN** A non-withheld ability has two versions tied for most users.
- **THEN** The page chooses the first tied version for its tooltip.

### Requirement: Known ability learners and users

Learners, creature users and item users SHALL appear once, in a Who learns and uses it section. Users SHALL show their first eight links.

#### Scenario: Known ability learners and users
- **WHEN** An ability has learners, creature users and item users, with more than eight users.
- **THEN** Learners, creature users and item users appear once in Who learns and uses it, with users showing their first eight links.

### Requirement: Ability answer without known users

An ability without a known learner or user SHALL add one short missing-source line to the answer.

#### Scenario: Ability answer without known users
- **WHEN** A published ability has no known learner or user.
- **THEN** The answer includes one short missing-source line.

### Requirement: Ability tooltip costs and activation

Costs and activation requirements SHALL remain in the tooltip text.

#### Scenario: Ability tooltip costs and activation
- **WHEN** An ability has costs and activation requirements.
- **THEN** The tooltip text retains both.

### Requirement: Linked applied-effect outcomes

Applied effects SHALL appear as linked outcomes in the answer, with their rank when the ability applies effects at more than one rank, chance, target in player words, and duration in human units when published.

#### Scenario: Linked applied-effect outcomes
- **WHEN** An ability applies effects at multiple ranks with published chances, targets and durations.
- **THEN** The answer links the outcomes with their ranks and chances, targets in player words, and durations in human units.

### Requirement: Applied-effect evidence consistency

Applied-effect rows SHALL use the same application evidence as each effect page's Applied by list and omit withheld effects.

#### Scenario: Applied-effect evidence consistency
- **WHEN** Application evidence includes a published effect and a withheld effect.
- **THEN** The ability's rows use the published effect's Applied by application evidence and omit the withheld effect.

### Requirement: Side-by-side ability versions

When multiple versions exist, a Versions section SHALL compare them side by side in the layout of creature versions: one column per version and one row per fact.

#### Scenario: Side-by-side ability versions
- **WHEN** An ability has multiple versions.
- **THEN** Versions compares them side by side using the creature-version layout, one column per version and one row per fact.

### Requirement: Ability version comparison facts

The Versions rows SHALL be the version's text, the effects it applies when any version applies named effects that differ, its use requirements and its learning classes when the versions differ in them, and its users when any version has users.

#### Scenario: Ability version comparison facts
- **WHEN** Ability versions have differing named applied effects, use requirements and learning classes, and at least one version has users.
- **THEN** Versions has rows for each version's text, applied effects, use requirements, learning classes and users.

### Requirement: Empty ability version values

A version without a value in a Versions row SHALL read None.

#### Scenario: Empty ability version values
- **WHEN** A version has no value for a displayed comparison row.
- **THEN** Its cell reads None.

### Requirement: Version user previews

Each version's users SHALL show their first eight links and a Show N more control.

#### Scenario: Version user previews
- **WHEN** A version has more than eight users.
- **THEN** Its users show their first eight links and a Show N more control.

### Requirement: All-version user expansion

The Who learns and uses it section's Show all link SHALL open every version's users.

#### Scenario: All-version user expansion
- **WHEN** A reader follows the Who learns and uses it section's Show all link for an ability with multiple versions.
- **THEN** Every version's users open.

### Requirement: Teaching items and usable ranks

Teaching items and all usable rank links SHALL remain available without repeating the tooltip.

#### Scenario: Teaching items and usable ranks
- **WHEN** An ability has teaching items and usable ranks.
- **THEN** The teaching items and all usable rank links remain available without a repeated tooltip.
