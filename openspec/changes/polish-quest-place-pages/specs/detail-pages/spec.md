## MODIFIED Requirements

### Requirement: Quest pages follow the course of the quest

A quest's identity SHALL show its type, available quest level, and chain step without a lone stat strip. Its answer SHALL show objectives as a numbered checklist with target and required count, keeping time and item-retention hints visually distinct from the instruction and count. It SHALL identify who starts and ends the quest with their places and map links when known. The side SHALL show requirements and a vertical chain stepper identifying the current step. Sections SHALL follow: Rewards, Unlocks. Offer, objective, and completion text and world changes SHALL remain available in closed blocks at the end. A quest without a chain SHALL omit the stepper. It SHALL retain available experience, repeatability, world quest timing, minimum level, and dungeon context without inventing values. Full world quest timing SHALL sit behind disclosure, after the actionable objective and reward.

#### Scenario: Quest in a chain
- **WHEN** a quest is step 5 of 5
- **THEN** the side stepper links five steps and marks step 5 with a word as well as visual state

#### Scenario: Quest outside a chain
- **WHEN** a quest belongs to no chain
- **THEN** it shows no chain stepper

#### Scenario: World quest with one objective
- **WHEN** a world quest has one objective and completes automatically
- **THEN** its objective and start are readable before the full timing disclosure

### Requirement: Place pages show what a player finds there and how to get there

A place's identity SHALL show its type and available level range without a lone stat strip. Its answer SHALL lead with access and the most useful available inhabitants, quests, or places to enter. Artwork and description SHALL remain available after the actionable relations. Its sections SHALL follow: Bosses with portraits, Creatures excluding bosses, NPCs, Gathering and objects with category counts, Quests, Areas. Available properties and points of interest SHALL remain reachable in the appropriate section rather than disappear. The place SHALL not infer a level range where none was published. When no actionable content exists, the page SHALL not display an empty answer card.

The side SHALL show these cards when their facts exist:

- Getting there, on every place with its own map outside the overworld, and on every challenge stone. It SHALL name each place that a player enters this place from, with links to the entrance spots. Entrances from challenge stones SHALL NOT count. A challenge stone SHALL instead name the stone where it starts, the stone's region, and the number of Hearts that it uses up. A dungeon that the Dungeon Finder can send a player to SHALL say that a player can choose it in the Dungeon Finder or get it from a Random run, and that only a finished Random run gives the supply pack.
- Timed dungeon, on each timed dungeon. It SHALL show the timer, the time left that each threshold needs and the token levels that it adds, the most items that the reward bag holds besides the token, a link to the Altar of Corruption on the map, and a link to the Timed dungeons section of the Corruption mechanics page.
- Services, with a count and a map link for each of merchants, bankers, auctioneers, flight points, quest givers, and each kind of crafting station. Townsfolk, neutral creatures, and travel points SHALL NOT count as services.

The overworld page SHALL show a Places to enter section that groups the places a player can enter from it into dungeons, challenge stones, and other places. Each row SHALL link the place, show its level range when published, and link its entrance spots.

#### Scenario: Dungeon with bosses
- **WHEN** a dungeon has four bosses and two other creatures
- **THEN** Bosses shows four portrait rows and Creatures shows two other creatures

#### Scenario: Teleport into a dungeon
- **WHEN** a teleport in Afallon leads into Barrowdeep
- **THEN** the Barrowdeep Getting there card names Afallon and links the entrance spot

#### Scenario: Dungeon Finder dungeon
- **WHEN** the Dungeon Finder can send a player to Barrowdeep
- **THEN** the Getting there card says that a player can choose Barrowdeep or get it from a Random run, and that only a finished Random run gives the supply pack

#### Scenario: Cave with copies of its entrance in challenge stones
- **WHEN** Cave (Oakenvale) is entered from Afallon and from copies of the same teleport in three challenge stones
- **THEN** its Getting there card names only Afallon

#### Scenario: Timed dungeon
- **WHEN** Barrowdeep has a 860 s timer, thresholds at 500 s and 300 s left, and a reward bag of up to 3 items
- **THEN** its Timed dungeon card shows 14 min 20 s, 8 min 20 s left for +2 token levels, 5 min left for +1, up to 3 items, and a link to its altar

#### Scenario: Places to enter from the overworld
- **WHEN** a reader opens Afallon
- **THEN** a Places to enter section lists its dungeons, challenge stones, and other places in three groups with entrance links
- **AND** the side shows no connection list

#### Scenario: NPCs without services
- **WHEN** a place has merchants and bankers
- **THEN** the Services card counts them, and the NPC section lists the NPCs without a services list

#### Scenario: Descriptive zone without map space
- **WHEN** a zone has lore and published placements whose area exactly matches its name
- **THEN** the place shows creatures and quests from those placements before its lore, without inventing a place map pin

## ADDED Requirements

### Requirement: Content-free places are not published

A reviewed scene that has no map space, description, artwork, level, inhabitants, quest objective or placement SHALL have no place page. Its references SHALL degrade to plain text. The publication SHALL check that the recorded exclusion evidence still holds each time.

#### Scenario: An empty zone
- **WHEN** a scene has only a generic zone type and no usable place content
- **THEN** it has no search entry or place page, and a reference to it is not a broken link

### Requirement: Quest world-change items retain their entity link

An interactive-object source whose displayed name matches an item explicitly requested by that quest SHALL use that published item as a typed subject. Other sources SHALL retain their own label rather than linking an unrelated item with the same name.

#### Scenario: Egg collection source
- **WHEN** a quest objective requests Funnel Weaver Egg and its world-change interaction uses the same displayed name
- **THEN** that world-change source links the Funnel Weaver Egg item page
