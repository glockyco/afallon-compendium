## MODIFIED Requirements

### Requirement: An Adventurers guide explains adventurers

The publication SHALL publish an Adventurers guide with topic sections in this order: meeting and inviting adventurers, Dungeon Finder parties, their jobs and progress, and their gear upgrades, so that the two sections on getting adventurers into a party come together. Each statement SHALL rest on verified native code, captured data, or a recorded runtime observation. A value SHALL come from published data. The guide SHALL NOT claim a hire price, a job failure, or a player reward that the evidence does not show. The Browse menu and adventurer NPC pages SHALL link the guide. The gear upgrades section SHALL list the reward gear with each item's type and the adventurer level from which it can be picked, sorted by that level, and SHALL list the gear kit of each adventurer that has one.

#### Scenario: Jobs and payouts
- **WHEN** a reader opens the jobs section
- **THEN** it says that an adventurer takes jobs while away, gains its own experience and gold, and can upgrade its gear, with the published duration bounds and upgrade chance

#### Scenario: Dungeon Finder party
- **WHEN** a reader opens the Dungeon Finder section
- **THEN** it names the party roles that the finder fills and the level range in which an adventurer can join a dungeon

#### Scenario: Reward gear
- **WHEN** a reader opens the gear upgrades section
- **THEN** it lists every item on the reward gear list with its type and adventurer level, starting with the items of level 1
- **AND** an item without an equipment band shows level 1

#### Scenario: Gear kits
- **WHEN** a reader opens the gear upgrades section
- **THEN** it shows the kits of Agra Emberhide, Brielle Dawnfield, and Eldeth Goldvein with their items

#### Scenario: Party sections together
- **WHEN** a reader opens the Adventurers guide
- **THEN** Dungeon Finder parties follows Meeting and inviting, before Jobs and progress and Gear upgrades
