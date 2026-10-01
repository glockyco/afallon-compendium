## ADDED Requirements

### Requirement: Item pages show the gear that adventurers carry

An item page SHALL list each adventurer world setting that hands out the item: a kit upgrade with the adventurer that receives it, an equipment band with the content level from which adventurers carry the item, and a job reward with the published reward chance. The adventurer SHALL be a link when its page is published. When the item has no player source, How to get it SHALL say that only adventurers carry it and SHALL link the Adventurers section, instead of saying that no way to get the item is known.

#### Scenario: A tank kit piece
- **WHEN** the kit upgrade of Agra Emberhide holds an item that no creature, vendor, quest, recipe, container, or class start gives
- **THEN** How to get it says only adventurers carry the item
- **AND** the Adventurers section links Agra Emberhide as the adventurer that receives it

#### Scenario: An item that players can also get
- **WHEN** an item is in an adventurer equipment band and a vendor sells it
- **THEN** How to get it shows the vendor route
- **AND** the Adventurers section still lists the equipment band and its content level
