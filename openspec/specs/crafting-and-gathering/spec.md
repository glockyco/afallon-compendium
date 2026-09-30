# crafting-and-gathering Specification

## Purpose
Give readers linked gathering node facts and a clear explanation of the captured crafting and gathering rules. Keep unknown game behavior distinct from verified rules.

## Requirements

### Requirement: Gathering nodes have reachable reference pages

The publication SHALL make every gathering node reachable through a gathering node list, search, and links from related skills and item yields. The Crafting and Gathering guide SHALL link to the gathering node list. Each gathering node page SHALL show its name, gathering skill, skill gate and tool from its requirements template, skill experience, character experience, and linked yields. It SHALL show where the node appears, and it SHALL distinguish spawner options from objects that a scene places. Its How it works section SHALL show the rules that the rules record places on gathering node pages: the selection and availability rules of the kinds of source that the node has, its reward rules, and each verified attunement rule that links the node. The section SHALL show the gathering yield bonus at the node's required skill level, or at level 1 when the node has no level gate, and at the highest level of its skill. A yield SHALL show its recorded quantity and chance semantics without claiming an effective chance when other rolls affect it. A node without a known location SHALL remain on the list with a visible location gap. A missing link SHALL not cause the node to disappear.

#### Scenario: Node is spawned and placed
- **WHEN** spawners place Small Iron Vein and a scene also places it directly
- **THEN** its page shows both kinds of location with their own respawn rules
- **AND** an item page links back to the node for each yield of its loot table

#### Scenario: Node has no known location
- **WHEN** a gathering node has captured evidence but no known placement
- **THEN** its page and list entry remain reachable and state that its location is unknown

#### Scenario: Yield source has no node record
- **WHEN** a yield cannot be tied to one gathering node through its own spawner option or object
- **THEN** the item retains its source label and any verified location
- **AND** the publication does not assign the yield to an unrelated gathering node

#### Scenario: Attunement names two nodes
- **WHEN** the verified Prospecting attunement rule links Small Iron Vein and Large Iron Vein
- **THEN** the How it works sections of both nodes show the rule
- **AND** the page of Silver Vein does not show it

### Requirement: Crafting rules name their evidence and boundaries

The Crafting section of a crafted item SHALL show the verified skill gate of its recipe, the full and half experience bands, and the level where experience stops, with the rules that the rules record places on that section. The published `/mechanics/crafting-and-gathering` guide SHALL explain the same rules as steps of a craft, and its disclosure SHALL show each rule with its evidence. Both SHALL distinguish a recipe's base experience from the amount after skill modifiers. They SHALL use recorded game values from the catalog and publication, not site constants. The guide SHALL link to the Crafting sections and skills that it names. Neither SHALL rank recipes or label one best.

#### Scenario: Recipe sits at the half-experience band
- **WHEN** a recipe has a recorded experience amount and the skill is in the verified half-experience band
- **THEN** the guide explains that the base amount is halved and rounded to the nearest whole number, with a half rounded to the even number, before skill modifiers
- **AND** the Crafting section labels that amount as base experience, not a guaranteed award

#### Scenario: Guide names a recipe
- **WHEN** the guide uses Runeweave Regalia as its worked craft
- **THEN** the example links to the Crafting section of Runeweave Regalia

### Requirement: Spawner explanation separates selection and availability

The crafting and gathering page SHALL explain verified weighted node selection by gathering skill. It SHALL distinguish authored option weights from effective probabilities. It SHALL show recorded respawn time, jitter, player range, and boosting effects only with their verified meaning. If an effect or timing rule remains unresolved, the page SHALL label that part unknown rather than invent a rule. Spawner examples SHALL come from catalog evidence and retain their source references.

#### Scenario: Skill changes option weights
- **WHEN** a captured spawner has options whose weights vary with gathering skill
- **THEN** its explanation shows how skill affects the weighted pick without calling the authored weights drop chances

#### Scenario: Attunement entry is not verified
- **WHEN** a table slot has no confirmed effect and node names
- **THEN** the page does not name that slot as an active boost
- **AND** it states that the remaining boosts are not confirmed

### Requirement: Reader wording stays independent of internal records

The gathering node and mechanics pages SHALL use sentence case for headings, columns, and sentences. Category values and names SHALL use title case. They SHALL not show native record ids, enum words, or rich-text tags. Text SHALL use straight quotes.

#### Scenario: Node name has rich-text tags
- **WHEN** a node's authored name holds color tags, such as `Small iron vein <color=red>Pickaxe</color>`
- **THEN** its visible label is the node name in title case without the tags or the tool and level hints
