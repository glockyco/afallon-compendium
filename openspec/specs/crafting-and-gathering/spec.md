# crafting-and-gathering Specification

## Purpose
Give readers linked gathering node facts and a clear explanation of the captured crafting and gathering rules. Keep unknown game behavior distinct from verified rules.

## Requirements

### Requirement: Gathering nodes have reachable reference pages

Every gathering node SHALL remain reachable from its list, search, skills, and item yields, and the Crafting and Gathering guide SHALL link the list. A node's title SHALL name its skill, gate, and tool; its strip SHALL show supported skill experience, character experience, respawn, and spot count. Its Gives answer SHALL list linked yields with conditional chance and one sentence with verified computed yield bonuses and a guide-section link. Its side SHALL show spawner share at the lowest and highest supported skill level without assuming an attunement. Where to find SHALL group distinct spots by place, show counts and proportional bars sorted by count, and offer a map action for all known spots. A closed final disclosure SHALL retain spawn odds, source distinctions, timers, and ranges. It SHALL not copy rule prose or suggest an authored weight is a drop chance. Missing placements SHALL remain explicitly unknown.

#### Scenario: Node is spawned and placed
- **WHEN** spawners and a scene directly place Small Iron Vein
- **THEN** its places include both kinds of source with counts, and its closed details distinguish their respawn rules
- **AND** each linked yield's item page can reach the node

#### Scenario: Node has no known location
- **WHEN** a node has captured evidence but no known placement
- **THEN** its page and list remain reachable and say its location is unknown

#### Scenario: Yield source has no node record
- **WHEN** a yield cannot be tied to a node through its own spawner option or scene object
- **THEN** the item retains its verified source and does not link an unrelated node

#### Scenario: Attunement names two nodes
- **WHEN** a verified Prospecting attunement names Small Iron Vein and Large Iron Vein
- **THEN** their pages may show its verified computed effect and guide-section link, but Silver Vein does not

### Requirement: Crafting rules name their evidence and boundaries

A crafted item's Crafting section SHALL show its verified skill gate, base experience, computed full and half experience breakpoints, and level where base experience stops, with a link to the applicable section of `/mechanics/crafting-and-gathering`. It SHALL NOT include the rule prose. The guide SHALL state these rules in its Crafting and Crafting experience sections, and the rules record and the catalog SHALL keep their evidence. Both SHALL distinguish base experience from the award after modifiers and use captured values rather than site constants. Neither SHALL rank a recipe as best.

#### Scenario: Recipe sits at the half-experience band
- **WHEN** a recipe has a recorded amount and the skill is in its verified half-experience band
- **THEN** the guide explains nearest-integer ties-to-even rounding before modifiers
- **AND** Crafting describes the computed band as base experience, not a guaranteed final award

#### Scenario: Guide names a recipe
- **WHEN** the guide uses Runeweave Regalia as a worked craft
- **THEN** it links that product's Crafting section

#### Scenario: Worked craft shows its experience bands
- **WHEN** the worked craft's rank gives full base experience until 20 levels above its required level
- **THEN** its band table shows one Full row, then a Half row and a None row

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
