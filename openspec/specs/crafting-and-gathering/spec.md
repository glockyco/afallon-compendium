# crafting-and-gathering Specification

## Purpose
Give readers linked gathering node facts and a clear explanation of the captured crafting and gathering rules. Keep unknown game behavior distinct from verified rules.

## Requirements

### Requirement: Gathering nodes have reachable reference pages

The publication SHALL make every gathering node reachable through a gathering node list, search, and links from related skills and item yields. The mechanics page SHALL link to the gathering node list. Each gathering node page SHALL show its name, gathering skill, skill gate and tool from its requirements template, skill experience, character experience, and linked yields. It SHALL show where the node appears, and it SHALL distinguish spawner options from objects that a scene places. It SHALL show the respawn or cooldown rule that applies to each kind of source, and the attunement boost when a verified attunement names the node. A yield SHALL show its recorded quantity and chance semantics without claiming an effective chance when other rolls affect it. A node without a known location SHALL remain on the list with a visible location gap. A missing link SHALL not cause the node to disappear.

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

### Requirement: Crafting rules name their evidence and boundaries

The published `/mechanics/crafting-and-gathering` document SHALL explain the verified skill gate for a recipe rank, the full and half experience bands, and when experience stops. It SHALL distinguish a rank's base experience from the amount after skill modifiers. The page SHALL use recorded game values from the catalog and publication, not site constants. It SHALL link to recipes and skills when it names them. It SHALL not rank recipes or label one best.

#### Scenario: Recipe sits at the half-experience band
- **WHEN** a recipe rank has a recorded experience amount and the skill is in the verified half-experience band
- **THEN** the page explains that the base amount is halved and rounded to the nearest whole number, with a half rounded to the even number, before skill modifiers
- **AND** the recipe page labels that amount as base experience, not a guaranteed award

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
