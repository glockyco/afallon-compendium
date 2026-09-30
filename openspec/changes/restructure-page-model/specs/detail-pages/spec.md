## ADDED Requirements

### Requirement: Pages show the rules placed on them

A page SHALL show each reviewed rule that the rules record places on its page kind, target, and scope. A rule placed on a fact or a column SHALL be the explanation of that label on hover, on focus, and on tap. Rules placed on a section SHALL appear in a How it works section at the end of the page, grouped by their guide section, with a link to the guide of each topic. A rule with the `linked` scope SHALL appear only on the pages of the entities that it links. When the publication computes the values of a placed rule for the page, the page SHALL show these values beside the rule. A page SHALL NOT show a rule that the record does not place on it. How it works SHALL NOT show the evidence entries of a rule, because the guide shows them.

#### Scenario: Attunement rule of one node
- **WHEN** the verified Silver Attunement rule links only Silver Vein and has the `linked` scope
- **THEN** the How it works section of Silver Vein shows the rule
- **AND** no other gathering node page shows it

#### Scenario: Rule explains a fact
- **WHEN** a kill experience rule is placed on the experience range fact of NPC pages
- **THEN** the experience range label of a creature page shows the rule on hover, on focus, and on tap
- **AND** the creature page has no How it works row for that rule

#### Scenario: Computed yield bonus
- **WHEN** the gathering yield bonus rule is placed on gathering node pages, and Small Iron Vein has no Mining level gate
- **THEN** its How it works section shows the bonus chance at Mining level 1 and at the highest Mining level

## MODIFIED Requirements

### Requirement: The hero shows the entity as the game shows it

A hero SHALL be one panel with a view area and a facts area. The view area SHALL show the entity as the game shows it: the item tooltip, the NPC portrait, the place artwork, the property purchase panel, the ability tooltip, or the icon of a class or a skill. The facts area SHALL show the description and the key facts of the kind. The description SHALL appear once in the hero. When the entity has no view, the facts area SHALL use the whole panel. When the entity has no view and no hero facts, the page SHALL NOT show a hero. Neither area SHALL stretch to the height of the other area. On screens narrower than 640 px, the facts area SHALL follow the view area.

#### Scenario: NPC without a portrait
- **WHEN** an NPC has stats but no portrait
- **THEN** its hero shows the stats across the whole panel

#### Scenario: Place with artwork
- **WHEN** a place has artwork and a description
- **THEN** its hero shows the artwork beside the description

#### Scenario: Class with an icon
- **WHEN** a reader opens the Shieldmaster page
- **THEN** its hero shows the class icon beside the description

### Requirement: Skill pages show recipes and levels

The publication SHALL publish a page for each skill that the reviewed exclusion list does not name. The title block of a skill page SHALL show the kind. The hero SHALL show the skill icon and its highest level. When a character does not receive the skill automatically, the hero SHALL state it. Every skill page SHALL link to Character Progression for related experience rules. A skill page SHALL NOT show an Experience table. The sections SHALL follow this order when they have content: Levels, Recipes, Gathering nodes, How to gain experience. When the skill has a level template and a highest level above one, the Levels section SHALL show the skill's level curve with the chart and level control of Character Progression, from level 1 up to its highest level. The Recipes section SHALL show each recipe that uses the skill with its product, station, and required level. Each recipe row SHALL have an anchor. The product of a row SHALL link to the Crafting section of its item page. A recipe without a published product SHALL keep its row with its name as text. The Gathering nodes section SHALL link every gathering node that gives experience in the skill and SHALL keep nodes with unknown locations. The How to gain experience section SHALL show the rules that the rules record places on it, with links to specific recipes and nodes when possible. It SHALL distinguish verified experience rules from known call sites whose amounts or skill mappings remain unresolved. It SHALL not claim that the known call sites are exhaustive.

#### Scenario: Crafting skill
- **WHEN** a reader opens the Alchemy page
- **THEN** the Recipes section shows its 22 recipes with their products, stations, and required levels
- **AND** each product links to the Crafting section of its item page
- **AND** the page links to Character Progression and explains its verified crafting source

#### Scenario: Recipe without a product
- **WHEN** the Smithing recipe Demonic Bulwark Looted has no published product
- **THEN** the Recipes section of Smithing keeps its row with an anchor and without a product link

#### Scenario: Gathering skill
- **WHEN** a reader opens the Mining page
- **THEN** the Gathering nodes section links its veins with their skill gates and known yields
- **AND** the How to gain experience section explains the verified experience of a gathered node

#### Scenario: Weapon skill
- **WHEN** a reader opens the Axes page
- **THEN** the page has no Recipes section and no Experience table
- **AND** a Levels section shows the Axes level curve up to its highest level
- **AND** it names auto-attack hits as a verified experience source

#### Scenario: Skill without levels
- **WHEN** a published skill has a highest level of zero
- **THEN** its hero shows no highest level and its page has no Levels section
- **AND** it retains the Character Progression link

#### Scenario: Known call site without a verified skill mapping
- **WHEN** a skill experience call site has no verified mapping to one skill
- **THEN** the page does not assign that source to an unrelated skill
- **AND** the Crafting and Gathering guide names the source as unresolved if it is relevant to crafting and gathering

### Requirement: Recipe items and recipes link each other

A recipe item page SHALL show a Teaches section when a captured Recipe RankUp game action names a recipe. The section SHALL show the crafting block of that recipe: the product with its tooltip, the station, the skill, the required level, the materials with their quantities, and the experience bands. The Crafting section of a product SHALL name each published item that teaches its recipe. A recipe without a known teaching item SHALL NOT claim that no item or other source teaches it.

#### Scenario: Recipe item teaches a recipe
- **WHEN** a reader opens Recipe: Runeweave Regalia, whose captured game action ranks up the recipe Runeweave Regalia
- **THEN** its Teaches section shows the product Runeweave Regalia with its tooltip, the Tailoring station, the required level 150, the materials, and the experience bands
- **AND** the Crafting section of Runeweave Regalia links back to the recipe item

#### Scenario: Recipe has no known teaching item
- **WHEN** a recipe is not learned by default and no captured item action teaches it
- **THEN** the Crafting section of its product names no teaching item and makes no claim that nothing teaches it
- **AND** the coverage page counts the recipe

## REMOVED Requirements

### Requirement: Recipe pages show the product and its materials

**Reason**: Each recipe with a product is the only recipe of that product, and each recipe has one rank. A separate recipe page split one craft across three pages.

**Migration**: The Crafting section of the product item page shows the station, skill, required level, materials, product quantity, experience bands, and teaching items. A recipe reference links to that section. A recipe without a published product keeps its row on its skill page.
