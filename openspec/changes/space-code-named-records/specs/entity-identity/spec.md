## ADDED Requirements

### Requirement: Code-named abilities and effects read as words

An ability or effect name word that joins capitalized words, optionally followed by a number, such as BoarAttack1 or HealingPotion, SHALL read as separate words: Boar Attack 1 and Healing Potion. Its slug SHALL follow the spaced name. A word whose capital ends it, such as AoE or DoT, SHALL stay one word. Names of other kinds SHALL keep the spelling that the game shows.

#### Scenario: Code-named creature attack
- **WHEN** an effect is named BoarAttack1
- **THEN** its page and every link to it read Boar Attack 1, and its slug is boar-attack-1

#### Scenario: Abbreviation in a name
- **WHEN** an ability is named AoE Cursed
- **THEN** it keeps the name AoE Cursed

#### Scenario: Item name
- **WHEN** an item is named Large FirePlace
- **THEN** it keeps the name Large FirePlace
