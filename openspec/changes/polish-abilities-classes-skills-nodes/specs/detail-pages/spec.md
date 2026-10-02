## MODIFIED Requirements

### Requirement: The hero shows the entity as the game shows it

The primary answer SHALL be a distinct card in the main column. An item tooltip SHALL appear once in the side column at wide widths and after the answer on narrow screens. An ability with a known learner or user SHALL show its tooltip once in the side column. An ability without a known learner or user SHALL put its effect tooltip in the primary answer instead. A place's artwork and description SHALL be part of its answer. NPC portraits, class and skill icons SHALL identify their title or relation row; descriptions and secondary stats SHALL appear once in the answer or side facts. A missing image SHALL not create an empty image frame. No side panel SHALL stretch just to match another panel's height.

#### Scenario: NPC without a portrait
- **WHEN** an NPC has stats but no portrait
- **THEN** its title uses a readable identity without a blank image and its available stats remain visible

#### Scenario: Place with artwork
- **WHEN** a place has artwork and a description
- **THEN** its answer presents both

#### Scenario: Class with an icon
- **WHEN** a reader opens Shieldmaster
- **THEN** its icon identifies its title and its playstyle description occupies the answer

### Requirement: Ability pages compare versions

An ability without an effect, description, learner, creature user, item use, or applied effect SHALL be withheld by a reviewed exclusion with catalog evidence checked at publication, and references to it SHALL remain readable as plain text. Other ability pages SHALL choose the tooltip version with most users and the first in a tie. An ability with known learners or users SHALL identify them in its answer and put the game tooltip in the side column. An ability without a known learner or user SHALL lead with its effect in the primary answer and give one short missing-source line. Costs and activation requirements SHALL remain in the tooltip. Applied effects SHALL appear as linked outcomes beside or below the game tooltip, with their ability rank, chance, target, and duration when published. These rows SHALL use the same application evidence as each effect page's Applied by list and omit withheld effects. When multiple versions exist, a Versions section SHALL compare their distinct text, use requirements, users, and applied effects. Teaching items and all usable rank links SHALL remain available without repeating the tooltip.

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
- **THEN** its combat effect appears in the primary answer and no empty users card appears

#### Scenario: Reciprocal applied effects
- **WHEN** Beacon of Dawn applies Beacon of Dawn Hot to a target for 10 seconds
- **THEN** Beacon of Dawn links the effect beside its tooltip and the effect links back to Beacon of Dawn under Applied by with the same rank and target

#### Scenario: Multiple effects from one ability
- **WHEN** an ability applies two effects with different ranks, chances, targets, or durations
- **THEN** each linked outcome retains its own published context, including its version where several ability versions exist

### Requirement: Class pages show how a class progresses

Only classes offered by a published race SHALL have pages. A side facts card SHALL show races, highest level, and talent tree count when known. A separate gear card SHALL show weapon types. Its answer SHALL present playstyle and auto attack. Its side SHALL stay in view beside the trees and SHALL present how the class gains talent points, each talent tree with the points that learning every rank of every node takes and a link to its tab, the weapon types, and the gear link. A tree whose points differ from the most common points of the class SHALL name them with its cost. Where a mechanics page explains how those points are earned, such as Heroic Essence in the Heroic Tier mechanics page, the tree and the side SHALL link that mechanics page section. A class whose starting gear is all equipped SHALL state that once above the table and omit its Equipped column. A class with mixed equipped and unequipped gear SHALL keep the column. The Web SHALL initially focus one arm with talent links at least 24 px wide at 390 px and offer a tree focus navigator while preserving pan, zoom, and List. A rank costs its own unlock cost, and the first rank of an ability that the class knows from the start SHALL cost nothing. Starting gear SHALL come before the talent trees, which SHALL remain in authored order with row anchors. The talent trees SHALL have two views, switchable with tabs: Web, the default, which lays out every tree of the class as the game's talent screen does, with the game's positions and requirement lines, and List, which shows each tree as a table in its own tab. Both views SHALL render every tree and talent anchor, so a link to a talent or a tree selects it in the reader's current view. Every talent SHALL show its icon. The web SHALL let a reader move it, zoom it, and select a talent to see its ranks, effect, requirements, and the talents that it unlocks. Selecting a talent SHALL highlight every talent that it needs, back to the first tier of its tree, with the lines between them, and the talents that it unlocks. Selecting a talent in the web SHALL move neither the page nor the web, except that the web SHALL glide to a selected talent outside its view at the same zoom. A link to a talent or a tree from elsewhere on the page SHALL scroll the page only as far as needed to show the whole web. The page SHALL link to Character Progression for the character level curve rather than remove access to it, and SHALL not display an Experience table.

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
- **AND** Heroic Essence links the Essence section of the Heroic Tier mechanics page

#### Scenario: Web as in the game
- **WHEN** a reader opens Shieldmaster
- **THEN** the Web view shows its five trees as wedges around the centre, each talent at the position that the game's talent screen gives it, with lines from each talent to the talents that require it

#### Scenario: Link to a talent keeps the view
- **WHEN** a reader in the List view follows the requirement link to Weighted Strikes
- **THEN** the List view stays open and shows Weighted Strikes, and the same link from the Web view selects Weighted Strikes in the web

#### Scenario: Selecting does not move the page
- **WHEN** a reader scrolls the web to the middle of the window and selects Cleaving Might, then follows its Unlocks link to Momentum of War
- **THEN** the page and the web stay where they are, both talents being in view, and the card under the web describes each talent in turn

#### Scenario: Requirement chain
- **WHEN** a reader selects Hemorrhage Expert in the Assassin web
- **THEN** Opened Veins and Bleeding Strike, which it needs in turn, light up with their lines, as does Bloodsoaked, which it unlocks

#### Scenario: Class gear with mixed equipped states
- **WHEN** Hunter has equipped and unequipped starting gear
- **THEN** the Equipped column shows the distinction

#### Scenario: Touch navigation in a talent web
- **WHEN** a reader opens Druid on a 390 px screen
- **THEN** a focused arm has talent links at least 24 px wide and the reader can focus another tree without losing Web pan, zoom, or List

### Requirement: Skill pages show recipes and levels

Each non-excluded skill SHALL have a page. Its side facts card SHALL show available highest level, recipe count, gathering node count, and experience to highest level. The answer SHALL show each verified experience source—craft, gather, or auto-attack hits—with a linked example range; it SHALL not assign an unverified source. Its side SHALL offer the level curve chart and level control behind an openable progression detail when a level template and highest level above one exist, and link to Character Progression. A weapon skill SHALL link matching weapon categories in its primary answer. Its sections SHALL show Recipes grouped by required-level bands and Gathering nodes by gate. A shared recipe station SHALL appear once above the rows. A row with no station SHALL say so while mixed station names SHALL remain visible in their rows. A recipe without a published product SHALL retain its anchored row; a skill with no levels SHALL omit a fictitious curve.

#### Scenario: Crafting skill
- **WHEN** a reader opens Alchemy
- **THEN** its Recipes section retains all 22 published recipes with products, stations, and levels, linked to product Crafting anchors when available

#### Scenario: Recipe without a product
- **WHEN** Demonic Bulwark Looted has no published product
- **THEN** its skill page retains an anchored recipe row without a product link

#### Scenario: Gathering skill
- **WHEN** a reader opens Mining
- **THEN** its nodes link with skill gates and yields, and gathering is labeled as a verified experience source

#### Scenario: Weapon skill
- **WHEN** a reader opens Axes
- **THEN** its level curve and auto-attack experience source remain available without an Experience table

#### Scenario: Skill without levels
- **WHEN** a published skill has a highest level of zero
- **THEN** it has no level curve but retains its Character Progression link

#### Scenario: Known call site without a verified skill mapping
- **WHEN** an experience call site cannot be tied to a skill
- **THEN** the skill page does not assign it to that skill

#### Scenario: Smithing station exception
- **WHEN** Smithing recipes share a station except for one without a listed station
- **THEN** the common station is stated once, with the exception identified on its row

## ADDED Requirements

### Requirement: Gathering node timers remain readable

A gathering node SHALL state available experience, spots, and respawn in a side facts card. Respawn SHALL retain its published duration and express long durations in hours, minutes, and seconds. Technical timer and range detail SHALL remain available in its existing disclosure. Its tooltip SHALL distinguish needed items from items consumed per use.

#### Scenario: Long respawn
- **WHEN** Mireblossom has a 9,999-second respawn
- **THEN** the card shows 2 hours 46 minutes 39 seconds without changing the underlying duration

#### Scenario: Fishing consumable
- **WHEN** Fishing Hole (Coalway) requires Makeshift Angler and uses one Fish Bait
- **THEN** the tooltip separates the needed item from the bait consumed per use
