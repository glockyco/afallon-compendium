## MODIFIED Requirements

### Requirement: Spawner explanation separates selection and availability

The crafting and gathering page SHALL explain verified weighted node selection by gathering skill. It SHALL distinguish authored option weights from effective probabilities. It SHALL show recorded respawn time, jitter, player range, and boosting effects only with their verified meaning. If an effect or timing rule remains unresolved, the page SHALL label that part unknown rather than invent a rule. Spawner examples SHALL come from catalog evidence and retain their source references. Each example SHALL show every node's weight and, when its odds are verified, its chance at a skill level that the reader chooses, with a checkbox for each attunement that favours one of its nodes. Each attunement SHALL name the item that gives it, its bonus, and how long it lasts.

#### Scenario: Skill changes option weights
- **WHEN** a captured spawner has options whose weights vary with gathering skill
- **THEN** its explanation shows how skill affects the weighted pick without calling the authored weights drop chances

#### Scenario: Attunement entry is not verified
- **WHEN** a table slot has no confirmed effect and node names
- **THEN** the page does not name that slot as an active boost
- **AND** it states that the remaining boosts are not confirmed

#### Scenario: Reader changes the skill level
- **WHEN** a reader moves the Fishing example from level 1 to level 150
- **THEN** Fishing Hole (Coalway) falls from the most likely node and Teeming Fishing Hole becomes the most likely, with chances that add up to 100%

#### Scenario: Attunement from an item
- **WHEN** a reader checks Prospector's Silver Tonic in the Mining example
- **THEN** Silver Vein's weight rises by 10 and every chance in the example changes with it
