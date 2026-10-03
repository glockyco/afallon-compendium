## ADDED Requirements

### Requirement: Crafting and Gathering leads with its skills and groups its mechanics

The Crafting and Gathering page SHALL open with its overview and the skills where each activity starts: every published crafting skill with its recipe count and every published gathering skill with its node count, each linking its skill page, with links to the Recipes and Gathering Nodes lists. Its sections SHALL follow in titled parts: Crafting (recipes, crafting experience, enchanting), Gathering (node selection, attunement, node availability, node rewards), and Training skills (skill experience). A section that no part names SHALL follow the parts. The enchanting items SHALL appear in a relation table with the eight-row rule. The node selection examples SHALL appear as one tab per gathering skill, each with its own level control and attunements. The attunements SHALL appear as a table of item, attunement, nodes, weight bonus, and duration, with a duration that every row shares stated once. The weapon skills that auto-attacks train SHALL appear as a grid of links.

#### Scenario: Reader opens Crafting and Gathering
- **WHEN** a reader opens `/mechanics/crafting-and-gathering`
- **THEN** the page names Alchemy, Cooking, Metallurgy, Smithing, and Tailoring with their recipe counts and Fishing, Herbalism, and Mining with their node counts before the first part
- **AND** the Crafting, Gathering, and Training skills parts follow in that order

#### Scenario: Enchanting items
- **WHEN** the publication has 23 enchanting items
- **THEN** the Enchanting section shows eight rows and a Show 15 more control

#### Scenario: Node odds by skill
- **WHEN** a reader selects the Mining tab in Node selection
- **THEN** the Mining level control, the mining attunements, and the mining spawner odds show, and the other skills' examples stay hidden
