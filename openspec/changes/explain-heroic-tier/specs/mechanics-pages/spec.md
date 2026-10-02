## MODIFIED Requirements

### Requirement: Heroic Tier explains its rewards and effects

The Heroic Tier page SHALL open with its overview and three short answers: how to turn the tier on, what changes, and what it gives, each with its values from the rules and a link to its detailed section. Its sections SHALL follow in three parts: Getting started, What changes, and Rewards.

Getting started SHALL name the places that hold a Heroic Console as links, how to confirm entry, the recommended level as advice rather than a requirement, both ways to leave, that the choice belongs to the character and survives death, and the places and dungeon states in which the tier pauses. What changes SHALL state which creatures become empowered, their health and damage multipliers, how the reader's gear score raises them up to a cap, and a table of creature strength at three gear scores. It SHALL state the affix chances, the guaranteed affixes of Rare and Boss creatures, the affix limit, what each affix does, and the affix loot multiplier. A text SHALL NOT show the record id of a status effect.

Rewards SHALL show the Heroic kill experience multiplier and SHALL distinguish kill experience from quest experience. It SHALL express Heroic Essence as `(base + per-affix amount × affix count) × rank multiplier × bounded health factor`, with fractional carry between kills, and SHALL name the talent trees where Essence is spent. It SHALL show the base, per-affix amount, rank multipliers, health baseline and bounds. It SHALL state the Boss and World Quest currency multipliers and that World Quest experience does not change, and the Heroic gear stat bonus. The page SHALL qualify any setting whose behavior has not been verified. It SHALL not rank Heroic gear or character builds.

#### Scenario: Essence calculation
- **WHEN** the catalog records Heroic Essence settings and the calculation has been verified
- **THEN** the page shows the product of the base-plus-affixes amount, the rank multiplier, and the bounded health factor
- **AND** it renders numbers from the published facts

#### Scenario: Heroic kill experience
- **WHEN** Heroic Tier is active and its kill multiplier is published
- **THEN** the page identifies the multiplier as a kill experience rule
- **AND** it does not say that quest experience receives that multiplier

#### Scenario: Turning the tier on
- **WHEN** a reader opens the Heroic Tier page
- **THEN** the opening names Coalway Woods, Coalway Swamp, and Chillwind Heights as console places and links them
- **AND** it states the recommended level 25 as advice
- **AND** Getting started states that a console or a right-click on the Heroic World Tier buff turns the tier off

#### Scenario: Where the tier pauses
- **WHEN** the rules name five excluded places and the dungeon timer and corruption states
- **THEN** Getting started links the five places and says that the tier resumes when the reader leaves them

#### Scenario: Affixes without record ids
- **WHEN** the rules describe Beacon of Chaos, Engorged, Fel Raiser, and Imperious
- **THEN** each affix reads as one plain sentence about its effect, and no sentence shows a status effect id
