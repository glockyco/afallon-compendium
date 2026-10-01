## MODIFIED Requirements

### Requirement: Class pages show how a class progresses

Only classes offered by a published race SHALL have pages. A class strip SHALL show races, weapon types, highest level, and talent tree count when known. Its answer SHALL present playstyle and auto attack. Its side SHALL present talent point gains. Starting gear SHALL come before the talent trees, which SHALL remain in authored order with the established tabbed List/Grid views and row anchors. The page SHALL link to Character Progression for the character level curve rather than remove access to it, and SHALL not display an Experience table.

A passive talent rank SHALL show its changes to pets after its own changes. A change to pets SHALL name the pets as the game does: "Your beast" for the Hunter's beast, the NPC whose summons change, or "Summons" for every pet. The changes to the same pets SHALL share one line.

#### Scenario: Offered class
- **WHEN** a reader opens Shieldmaster
- **THEN** Starting gear, then Bastion Breaker, Guardian, Templar, Aegis Mastery, and Heroic Ascension remain reachable in order
- **AND** the page links Character Progression

#### Scenario: Class that no race offers
- **WHEN** no race offers Hunter
- **THEN** it has no page and an authored Hunter requirement remains readable without a broken link

#### Scenario: Passive talent with five ranks
- **WHEN** Aegis Discipline gives 2 Block chance at rank 1 and 10 at rank 5
- **THEN** its row shows both ranked effects

#### Scenario: Talent tree with its own talent points
- **WHEN** Heroic Ascension uses Heroic Essence
- **THEN** its tree identifies that point type

#### Scenario: Talent that changes the Hunter's beast
- **WHEN** Bonded Fury gives the Hunter's beast 2 Damage Dealt at rank 1 and 10 at rank 5, and Damage Dealt is a percentage stat
- **THEN** its row shows "Your beast: +2% Damage Dealt" at rank 1 and "Your beast: +10% Damage Dealt" at rank 5

#### Scenario: Talent that changes the summons of one NPC
- **WHEN** Bone Bulwark gives Skeleton Warrior summons 2% Health at rank 1
- **THEN** its row names Skeleton Warrior and shows +2% Health

#### Scenario: Talent that changes the character and the beast
- **WHEN** Pathfinding gives the character and the Hunter's beast 1% Movement Speed at rank 1
- **THEN** its row shows the character's change on one line and the beast's change on the next line
