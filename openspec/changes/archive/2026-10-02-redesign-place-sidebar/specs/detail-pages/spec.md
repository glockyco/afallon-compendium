## REMOVED Requirements

### Requirement: Place pages list what a player finds there

**Reason**: The side list of connections by direction does not tell a reader how to reach a place, and it is very long on the overworld.

**Migration**: Place pages show how to get there, services, timed dungeon facts, and places to enter.

## ADDED Requirements

### Requirement: Place pages show what a player finds there and how to get there

A place's strip SHALL show available type, level range, and boss count. Its answer SHALL contain artwork, description, and map action. Its sections SHALL follow: Bosses with portraits, Creatures excluding bosses, NPCs, Gathering and objects with category counts, Quests, Areas; available properties and points of interest SHALL remain reachable in the appropriate section rather than disappear. The place SHALL not infer a level range where none was published.

The side SHALL show these cards when their facts exist:

- Getting there, on every place with its own map outside the overworld, and on every challenge stone. It SHALL name each place that a player enters this place from, with links to the entrance spots. Entrances from challenge stones SHALL NOT count. A challenge stone SHALL instead name the stone where it starts, the stone's region, and the number of Hearts that it uses up. A dungeon that the Dungeon Finder can send a player to SHALL say that a player can choose it in the Dungeon Finder or get it from a Random run, and that only a finished Random run gives the supply pack.
- Timed dungeon, on each timed dungeon. It SHALL show the timer, the time left that each threshold needs and the token levels that it adds, the most items that the reward bag holds besides the token, a link to the Altar of Corruption on the map, and a link to the Timed dungeons section of the Corruption guide.
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
