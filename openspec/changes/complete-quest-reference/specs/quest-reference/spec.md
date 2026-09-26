## Purpose

The quest reference tells a player how each quest starts, what it asks, what it gives, what it unlocks, and what it changes in the world, and links each quest to the NPCs, items, and places that it involves.

## ADDED Requirements

### Requirement: Quest rewards follow the authored reward type

A quest page SHALL list each fixed reward and each reward choice with the entity that the authored reward type names: an item for an item reward, a currency for a currency reward, and a faction for a faction reward. Experience SHALL appear as the quest's experience fact. A reward SHALL NOT link an item that the authored reward does not give. An item page SHALL list a quest as a reward source only for an item reward of that item.

#### Scenario: A quest gives gold coins
- **WHEN** a quest gives 40 Gold Coin and has a stale authored item ID on the same reward
- **THEN** the quest page lists 40 Gold Coin as a reward
- **AND** neither the quest page nor the stale item's page links the quest to that item

### Requirement: Quest givers follow the native quest service flag

Quest pages, NPC pages, quest lists, quest tooltips, and place pages SHALL treat an NPC as a quest giver or turn-in only when the NPC's native quest service flag is set. The catalog SHALL keep the authored binding and SHALL record an inactive binding as a coverage issue.

#### Scenario: A disabled NPC has a quest binding
- **WHEN** an NPC with the quest service off lists a quest in its authored given or completed quests
- **THEN** the quest page does not show that NPC as a giver or turn-in
- **AND** the NPC page does not list the quest as given or completed

### Requirement: A quest page shows how the quest starts

A quest page SHALL show each way that the quest starts. An NPC start SHALL link the NPC, name the areas where the NPC stands, and link the NPC's placements on the atlas. A world quest start SHALL link each zone placement on the atlas, state that entering an active zone grants the quest, and show the zone's availability and the other quests in the zone's pool. An object start SHALL name the interactive object and link its placements on the atlas. A quest with no authored start SHALL show a missing-value placeholder.

#### Scenario: A reader opens a world quest
- **WHEN** a quest is in the pool of a world quest zone that is active only at night
- **THEN** the quest page links the zone's placement and shows the night requirement as the zone's availability
- **AND** it shows the active duration, the cooldown after completion, the cooldown after expiry, the cooldown jitter, and the zone delay before the next pick

#### Scenario: A quest starts from an object
- **WHEN** an interactive object has a quest action for the quest
- **THEN** the quest page names the object and links each of its placements

### Requirement: Objectives show their task text and where they complete

Each objective SHALL show the task text, with the target entity and count when the task names them. An objective that an interactive object completes SHALL name that object and link its placements on the atlas. An objective without a target or completion object SHALL show its text only. The NPC or item page of an objective's target SHALL list the quest with the objective.

#### Scenario: A reader views a region objective
- **WHEN** a task has no target and four interactive objects complete it
- **THEN** the objective shows the task text and links the four placements
- **AND** it does not show an unknown target

#### Scenario: A creature is a quest target
- **WHEN** a quest asks the player to defeat 12 Strawhaunts
- **THEN** the Strawhaunt page lists the quest under quest objectives with the objective text and the count

### Requirement: Quest text, chain, and level requirement are published

A quest page SHALL show the authored objective text and completion text when present. It SHALL show the authored chain name and the ordered quests of the chain with the current quest marked. It SHALL show the minimum level when the quest's mandatory requirements set one. It SHALL list the quests whose requirements name this quest.

#### Scenario: A quest belongs to a chain
- **WHEN** a quest is step 3 of a seven-quest chain
- **THEN** the page lists the seven quests in chain order once each and marks step 3

#### Scenario: A quest requires a level
- **WHEN** a quest requires level 16 or higher
- **THEN** the page header shows the level requirement and the quest list can sort and filter by it

### Requirement: Requirements link the entities they name

A requirement SHALL render as text in which each referenced entity links to its page, or renders with its icon when its kind has no page. A quest requirement SHALL name the quest state. A numeric requirement SHALL name its comparison.

#### Scenario: A quest requires another quest
- **WHEN** a quest requires that Wrath of the Matriarch is turned in
- **THEN** the requirement reads "Wrath of the Matriarch turned in" and links the quest

### Requirement: A quest page shows the world changes of the quest

A quest page SHALL list the world sources whose availability names the quest: creatures that appear or stop appearing, objects that become usable or unusable, crafting stations, and world quest zones. Each row SHALL name the subject, show its availability, and link its placements on the atlas.

#### Scenario: A quest removes a spawn after turn-in
- **WHEN** a requirement toggle removes a creature spawner when a quest is turned in
- **THEN** the quest page lists the creature with the availability "Not while <quest> turned in" and links the spawner placements

### Requirement: Places list their quests

A place page SHALL list the quests that start in the place and the quests that have objectives in the place.

#### Scenario: A dungeon holds quest targets
- **WHEN** a quest asks the player to defeat two creatures that stand in a dungeon
- **THEN** the dungeon page lists the quest under quest objectives

### Requirement: The quest list shows how to choose a quest

The quest list SHALL show level range, minimum level, chain, start type, area, giver, and experience columns. It SHALL offer start type, area, chain, and repeatable facets. The quest tooltip SHALL show the objectives with their text and counts, the fixed rewards, and the reward choices as a separate group.

#### Scenario: A reader filters world quests by area
- **WHEN** the reader selects the world quest type and one area
- **THEN** the list shows only world quests that start in that area

### Requirement: The game's quest level range is published

The catalog SHALL record the level range and the dungeon that the game computes for each quest. The quest page and the quest tooltip SHALL show both when the game returns them. The quest list and the search result SHALL show the range as the quest level.

#### Scenario: The game computes a level range
- **WHEN** the runtime probe returns a level range for a quest
- **THEN** the quest page and the quest list show that range
- **AND** a search result for the quest shows that range as its level

#### Scenario: The game assigns a dungeon
- **WHEN** the runtime probe returns a dungeon scene for a quest
- **THEN** the quest page and the quest tooltip link the dungeon's place page
