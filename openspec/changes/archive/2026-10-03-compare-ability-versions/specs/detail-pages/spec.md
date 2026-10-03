## MODIFIED Requirements

### Requirement: Ability pages compare versions

An ability without an effect, description, learner, creature user, item use, or applied effect SHALL be withheld by a reviewed exclusion with catalog evidence checked at publication, and references to it SHALL remain readable as plain text. Other ability pages SHALL choose the tooltip version with most users and the first in a tie. An ability with known learners or users SHALL identify them in its answer and put the game tooltip in the side column. An ability without a known learner or user SHALL give the applied effects or described outcome in the primary answer, keep the game tooltip narrow in the side column, and give one short missing-source line. Costs and activation requirements SHALL remain in the tooltip. Applied effects SHALL appear as linked outcomes beside or below the game tooltip, with their ability rank, chance, target in player words, and duration in human units when published. These rows SHALL use the same application evidence as each effect page's Applied by list and omit withheld effects. When multiple versions exist, a Versions section SHALL compare them side by side in the layout of creature versions: one column per version and one row per fact. The rows SHALL be the version's text, the effects it applies when any version applies effects, its use requirements and its learning classes when the versions differ in them, and its users when any version has users. A version without a value in a row SHALL read None. Each version's users SHALL show their first eight links and a Show N more control, and the answer's Show all link SHALL open every version's users. Teaching items and all usable rank links SHALL remain available without repeating the tooltip.

#### Scenario: Ability with five versions
- **WHEN** an ability has five versions
- **THEN** Versions compares five and Used by groups users under the correct version

#### Scenario: Ability from a talent tree
- **WHEN** a reader opens Maul
- **THEN** the answer links Druid's Primal Feral tier 2 talent and its tooltip identifies the Ursine Aspect condition

#### Scenario: Ability of a class that no race offers
- **WHEN** only an unpublished Hunter class learns Barbed Quarrel
- **THEN** Learned by has no Hunter page link and the tooltip still shows Costs 9 Mana

#### Scenario: Internal timer-only ability
- **WHEN** AoE Rock Attack has only cast timing and no known learner or user
- **THEN** it has no page, and its name remains readable wherever referenced

#### Scenario: Effectful ability without a known user
- **WHEN** a reader opens AoE Cursed
- **THEN** its linked combat effects appear in the primary answer, the narrow game tooltip sits in the side column, and no empty users card appears

#### Scenario: Reciprocal applied effects
- **WHEN** Beacon of Dawn applies Beacon of Dawn Hot to a target for 10 seconds
- **THEN** Beacon of Dawn links the effect beside its tooltip and the effect links back to Beacon of Dawn under Applied by with the same rank and target

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
