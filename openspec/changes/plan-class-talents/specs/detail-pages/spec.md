## MODIFIED Requirements

### Requirement: Class pages show how a class progresses

Only classes offered by a published race SHALL have pages. A class strip SHALL show races, weapon types, highest level, and talent tree count when known. Its answer SHALL present playstyle and auto attack. Its side SHALL stay in view beside the trees and SHALL present how the class gains talent points, each talent tree with the points that learning every rank of every node takes and a link to its tab, the weapon types, and the gear link. A tree whose points differ from the most common points of the class SHALL name them with its cost. Where a guide explains how those points are earned, such as Heroic Essence in the Heroic Tier guide, the tree and the side SHALL link that guide section. A rank costs its own unlock cost, and the first rank of an ability that the class knows from the start SHALL cost nothing. Starting gear SHALL come before the talent trees, which SHALL remain in authored order with the established tabbed List/Grid views and row anchors. The page SHALL link to Character Progression for the character level curve rather than remove access to it, and SHALL not display an Experience table.

A passive talent rank SHALL show its changes to pets after its own changes. A change to pets SHALL name the pets as the game does: "Your beast" for the Hunter's beast, the NPC whose summons change, or "Summons" for every pet. The changes to the same pets SHALL share one line.

#### Scenario: Offered class
- **WHEN** a reader opens Shieldmaster
- **THEN** Starting gear, then Bastion Breaker, Guardian, Templar, Aegis Mastery, and Heroic Ascension remain reachable in order
- **AND** the page links Character Progression

#### Scenario: Class that no race offers
- **WHEN** no race offers a class
- **THEN** the class has no page and an authored requirement that names the class remains readable without a broken link

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

#### Scenario: Tree costs beside the trees
- **WHEN** a reader scrolls through the talent trees of Shieldmaster
- **THEN** the side still shows each tree with the Talent Points that learning it in full takes
- **AND** Heroic Ascension shows its cost in Heroic Essence
- **AND** Heroic Essence links the Essence section of the Heroic Tier guide

### Requirement: Class pages link to the gear they can use

Each published class page SHALL link to the item list with that class selected in its Usable by filter and the Weapon and Armor item types selected in its Type filter, so that the list shows only gear. The link SHALL use the same URL as selecting those filters. The page SHALL NOT describe the linked items as ranked or recommended.

#### Scenario: Gear from a class page
- **WHEN** a reader follows the gear link on the Shieldmaster page
- **THEN** the item list opens with Shieldmaster selected in Usable by and Weapon and Armor selected in Type
- **AND** it lists no potion or material
- **AND** reloading the page keeps the selection
