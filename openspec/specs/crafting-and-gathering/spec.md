# crafting-and-gathering Specification

## Purpose
Give readers linked gathering node facts and a clear explanation of the captured crafting and gathering rules. Keep unknown game behavior distinct from verified rules.

## Requirements

### Requirement: Gathering nodes have reachable reference pages

Every gathering node SHALL remain reachable from its list, search, skills, and item yields.

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

#### Scenario: Gathering nodes have reachable reference pages
- **WHEN** A reader views an item yield associated with a gathering node.
- **THEN** The reader can reach the gathering node from that item yield.

### Requirement: Link the Gathering Node List from the Guide

The Crafting and Gathering guide SHALL link the gathering node list.

#### Scenario: Link the Gathering Node List from the Guide
- **WHEN** A reader opens the Crafting and Gathering guide.
- **THEN** The guide provides a link to the gathering node list.

### Requirement: Identify Node Skill Gate and Tool

A node's title SHALL name its skill, gate, and tool.

#### Scenario: Identify Node Skill Gate and Tool
- **WHEN** A reader opens a gathering node page with a known skill, gate, and tool.
- **THEN** The title names the node's skill, gate, and tool.

### Requirement: Show Supported Node Summary Values

A node's strip SHALL show supported skill experience, character experience, respawn, and spot count.

#### Scenario: Show Supported Node Summary Values
- **WHEN** A node has supported skill experience, character experience, respawn, and spot count.
- **THEN** The node's strip shows all four supported values.

### Requirement: Link Node Yields and Conditional Chances

A node's Gives answer SHALL list linked yields with conditional chance.

#### Scenario: Link Node Yields and Conditional Chances
- **WHEN** A reader opens a node page with verified yields and conditional chances.
- **THEN** The Gives answer lists the linked yields with their conditional chances.

### Requirement: Summarize Verified Yield Bonuses

A node's Gives answer SHALL include one sentence with verified computed yield bonuses and a guide-section link.

#### Scenario: Summarize Verified Yield Bonuses
- **WHEN** A node has verified computed yield bonuses.
- **THEN** The Gives answer includes one sentence with those bonuses and a guide-section link.

### Requirement: Show Spawner Share at Supported Skill Extremes

A node's side SHALL show spawner share at the lowest and highest supported skill level without assuming an attunement.

#### Scenario: Show Spawner Share at Supported Skill Extremes
- **WHEN** A node has supported spawner shares at its lowest and highest supported skill levels.
- **THEN** The side shows those shares without assuming an attunement.

### Requirement: Group and Rank Node Locations

Where to find SHALL group distinct spots by place and show counts and proportional bars sorted by count.

#### Scenario: Group and Rank Node Locations
- **WHEN** A node has distinct spots in several places.
- **THEN** Where to find groups the spots by place and shows counts and proportional bars sorted by count.

### Requirement: Map All Known Node Spots

Where to find SHALL offer a map action for all known spots.

#### Scenario: Map All Known Node Spots
- **WHEN** A reader views Where to find for a node with known spots.
- **THEN** A map action is available for all known spots.

### Requirement: Retain Node Evidence in Closed Details

A closed final disclosure SHALL retain spawn odds, source distinctions, timers, and ranges.

#### Scenario: Retain Node Evidence in Closed Details
- **WHEN** A node has spawn odds, distinct sources, timers, and ranges.
- **THEN** The final disclosure is closed and retains the spawn odds, source distinctions, timers, and ranges.

### Requirement: Avoid Copied Rules and Misleading Weights

The node page SHALL not copy rule prose or suggest an authored weight is a drop chance.

#### Scenario: Avoid Copied Rules and Misleading Weights
- **WHEN** A node page presents an authored weight supported by rule evidence.
- **THEN** The page neither copies the rule prose nor suggests that the authored weight is a drop chance.

### Requirement: Mark Missing Placements Unknown

Missing placements SHALL remain explicitly unknown.

#### Scenario: Mark Missing Placements Unknown
- **WHEN** A gathering node has no known placement.
- **THEN** Its placement is explicitly identified as unknown.
### Requirement: Crafting rules name their evidence and boundaries

A crafted item's Crafting section SHALL show its verified skill gate, base experience, computed full and half experience breakpoints, and level where base experience stops, with a link to the applicable section of `/mechanics/crafting-and-gathering`.

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

#### Scenario: Crafting rules name their evidence and boundaries
- **WHEN** A reader opens a crafted item's Crafting section with verified experience rules.
- **THEN** The section shows the verified skill gate, base experience, computed full and half experience breakpoints, and level where base experience stops, with a link to the applicable guide section.

### Requirement: Keep Rule Prose Out of Item Crafting Sections

A crafted item's Crafting section SHALL NOT include the rule prose.

#### Scenario: Keep Rule Prose Out of Item Crafting Sections
- **WHEN** A reader opens a crafted item's Crafting section.
- **THEN** The section does not include rule prose.

### Requirement: Explain Crafting Rules in the Guide

The guide SHALL state these rules in its Crafting and Crafting experience sections: verified skill gates, base experience, computed full and half experience breakpoints, and the level where base experience stops.

#### Scenario: Explain Crafting Rules in the Guide
- **WHEN** A reader consults the guide's Crafting and Crafting experience sections.
- **THEN** Those sections state the skill gate and base experience rules, including computed full and half experience breakpoints and the level where base experience stops.

### Requirement: Retain Crafting Rule Evidence

The rules record and the catalog SHALL keep their evidence.

#### Scenario: Retain Crafting Rule Evidence
- **WHEN** Crafting rules are recorded in the rules record and catalog.
- **THEN** Both retain their evidence.

### Requirement: Distinguish Base Experience from Modified Awards

The rules record and the catalog SHALL distinguish base experience from the award after modifiers.

#### Scenario: Distinguish Base Experience from Modified Awards
- **WHEN** The rules record and catalog describe crafting experience and modified awards.
- **THEN** Both distinguish base experience from the award after modifiers.

### Requirement: Use Captured Crafting Values

The rules record and the catalog SHALL use captured values rather than site constants.

#### Scenario: Use Captured Crafting Values
- **WHEN** Crafting values are included in the rules record and catalog.
- **THEN** Both use captured values rather than site constants.

### Requirement: Avoid Best Recipe Rankings

Neither the rules record nor the catalog SHALL rank a recipe as best.

#### Scenario: Avoid Best Recipe Rankings
- **WHEN** A recipe appears in the rules record and catalog.
- **THEN** Neither ranks the recipe as best.
### Requirement: Spawner explanation separates selection and availability

The crafting and gathering page SHALL explain verified weighted node selection by gathering skill.

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

#### Scenario: Spawner explanation separates selection and availability
- **WHEN** Verified evidence shows that gathering skill affects weighted node selection.
- **THEN** The crafting and gathering page explains that weighted selection by gathering skill.

### Requirement: Distinguish Weights from Probabilities

The crafting and gathering page SHALL distinguish authored option weights from effective probabilities.

#### Scenario: Distinguish Weights from Probabilities
- **WHEN** The crafting and gathering page presents authored option weights and effective probabilities.
- **THEN** It distinguishes the weights from the probabilities.

### Requirement: Respect Verified Availability Meanings

The crafting and gathering page SHALL show recorded respawn time, jitter, player range, and boosting effects only with their verified meaning.

#### Scenario: Respect Verified Availability Meanings
- **WHEN** Recorded respawn time, jitter, player range, and boosting effects have verified meanings.
- **THEN** The page shows those recorded details only with their verified meanings.

### Requirement: Label Unresolved Effects and Timing Unknown

If an effect or timing rule remains unresolved, the crafting and gathering page SHALL label that part unknown rather than invent a rule.

#### Scenario: Label Unresolved Effects and Timing Unknown
- **WHEN** A spawner timing rule remains unresolved.
- **THEN** The page labels that timing rule unknown rather than inventing a rule.

### Requirement: Ground Spawner Examples in Catalog Evidence

Spawner examples SHALL come from catalog evidence and retain their source references.

#### Scenario: Ground Spawner Examples in Catalog Evidence
- **WHEN** The page includes a spawner example.
- **THEN** The example comes from catalog evidence and retains its source references.

### Requirement: Show Every Example Node Weight

Each spawner example SHALL show every node's weight.

#### Scenario: Show Every Example Node Weight
- **WHEN** A spawner example contains several nodes.
- **THEN** The example shows the weight of every node.

### Requirement: Show Verified Chances at Reader Selected Skill

Each spawner example SHALL show every node's chance, when its odds are verified, at a skill level that the reader chooses.

#### Scenario: Show Verified Chances at Reader Selected Skill
- **WHEN** A reader chooses a skill level for a spawner example with verified node odds.
- **THEN** The example shows every node's verified chance at the chosen skill level.

### Requirement: Offer Relevant Attunement Checkboxes

Each spawner example SHALL have a checkbox for each attunement that favours one of its nodes.

#### Scenario: Offer Relevant Attunement Checkboxes
- **WHEN** An attunement favours a node in a spawner example.
- **THEN** The example has a checkbox for that attunement.

### Requirement: Identify Attunement Source Bonus and Duration

Each attunement SHALL name the item that gives it, its bonus, and how long it lasts.

#### Scenario: Identify Attunement Source Bonus and Duration
- **WHEN** An attunement is shown in a spawner example.
- **THEN** The attunement names the item that gives it, its bonus, and how long it lasts.
### Requirement: Reader wording stays independent of internal records

The gathering node and mechanics pages SHALL use Title Case for title-like noun headings and table columns and sentence case for headings phrased as sentences or questions, facts, filter values, and prose. Game-provided category values and names SHALL preserve their spelling. They SHALL not show native record ids, enum words, or rich-text tags. Text SHALL use straight quotes.

#### Scenario: Node name has rich-text tags
- **WHEN** a node's authored name holds color tags, such as `Small iron vein <color=red>Pickaxe</color>`
- **THEN** its visible label is the node name in title case without the tags or the tool and level hints
