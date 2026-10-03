# world-quests Specification

## Purpose
Explain World Quests: where and when they appear, how a reader takes part, and what they reward, including their Heroic Tier currency.

## Requirements

### Requirement: World quest pages show authored timing and zones

A world quest page SHALL identify the zone locations at which it can start and display its captured active duration, cooldown after completion, cooldown after expiry, cooldown jitter, and first-roll window in a readable card. It SHALL link an explanation of the zone cycle and SHALL not describe an authored duration as an exact wall-clock guarantee when the game imposes other conditions.

#### Scenario: Quest has several eligible zones
- **WHEN** a world quest is offered by multiple published zone placements
- **THEN** the page links the published zones and keeps the per-quest timing visible without forcing the reader into the Mechanics guide
- **AND** its explanation link opens the World Quests guide

### Requirement: Quest browsing identifies world quests from captured facts

The quest list SHALL offer a quest-type facet that selects world quests from the presence of authored world quest facts, independently of the quest's other start types. Its non-world value SHALL omit world quests.

#### Scenario: Find a world quest
- **WHEN** a reader chooses World Quest in the Quest type facet
- **THEN** only quests with captured world quest facts remain in the list
- **AND** an area filter can further narrow the result

### Requirement: World Quest mechanics explain the verified cycle and rewards

The World Quests guide SHALL distinguish simultaneous active quests from one quest selected for a zone, describe entry and leaving, automatic completion, first roll, expiry and completion cooldowns with jitter, and the zone's delay before choosing another quest. It SHALL explain the verified Heroic Cache multiplier on world quest currency only while the Heroic tier is live, without applying that multiplier to quest experience or assuming an uncaptured numeric multiplier. A rule SHALL cite bounded native evidence and SHALL not claim an unverified numeric limit.

#### Scenario: World quest expires while a player is in its zone
- **WHEN** the active timer ends while the player is in the zone
- **THEN** the guide explains that unfinished quest progress is abandoned and the zone can choose another quest after its delay

#### Scenario: Heroic tier changes a currency reward
- **WHEN** a world quest awards currency while the Heroic tier is live
- **THEN** the guide distinguishes the Heroic Cache currency multiplier from the quest experience reward
