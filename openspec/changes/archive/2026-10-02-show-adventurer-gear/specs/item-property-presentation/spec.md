## MODIFIED Requirements

### Requirement: Item pages show the gear that adventurers carry

An item page SHALL describe how adventurers get the item in an Adventurers section. An item on the reward gear list SHALL say, with the published chance that each finished job tries an upgrade, that the item is on that list for adventurers of its level or higher, or for every adventurer when its level is 1. An item in a gear kit SHALL name and link the adventurer whose kit holds it. The section SHALL link the gear upgrades section of the Adventurers guide. When the item has no player source, How to get it SHALL say that only adventurers can get the item and SHALL link the Adventurers section, instead of saying that no way to get the item is known.

#### Scenario: A tank kit piece
- **WHEN** the kit upgrade of Agra Emberhide holds an item that no creature, vendor, quest, recipe, container, or class start gives
- **THEN** How to get it says only adventurers can get the item
- **AND** the Adventurers section links Agra Emberhide as the adventurer whose kit holds it

#### Scenario: An item that players can also get
- **WHEN** an item is on the reward gear list from level 17 and a vendor sells it
- **THEN** How to get it shows the vendor route
- **AND** the Adventurers section says that the item is on the reward gear list for adventurers of level 17 or higher
