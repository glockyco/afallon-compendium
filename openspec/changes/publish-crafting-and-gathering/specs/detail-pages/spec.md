## MODIFIED Requirements

### Requirement: Recipe pages show the product and its materials

A recipe page SHALL show its station, its skill, and a rank above zero in the title block. Its hero SHALL show the tooltip of the product and the product quantity when it is more than one. A Materials section SHALL show each material with its quantity. The page SHALL show each published rank's required skill level and base experience per craft. It SHALL show the skill levels where the rank gives full, half, or no base experience. The full band SHALL distinguish the game's first and second full-experience ranges. The page SHALL link to the crafting and gathering rules. It SHALL not call any recipe best or claim the base value is the final award after modifiers.

#### Scenario: Recipe with rank zero
- **WHEN** a recipe has rank 0
- **THEN** its title block shows the station and the skill without a rank

#### Scenario: Recipe reaches the next experience band
- **WHEN** a recipe rank has a captured unlock cost and base experience
- **THEN** its page shows the skill gate and each experience band from the verified rule
- **AND** the page names the base experience separately from modifier-adjusted experience

#### Scenario: Recipe rank has no resolved skill
- **WHEN** the recipe's skill reference cannot be resolved
- **THEN** its product and materials remain visible
- **AND** its page does not invent a skill level or experience band

### Requirement: Skill pages show recipes and levels

The publication SHALL publish a page for each skill. The title block of a skill page SHALL show the kind. The hero SHALL show the skill icon and its highest level. When a character does not receive the skill automatically, the hero SHALL state it. The page SHALL link to Character progression instead of showing an Experience table. The sections SHALL follow this order when they have content: Recipes, Resource nodes, How to gain experience. The Recipes section SHALL show each recipe that uses the skill with its product and station. The Resource nodes section SHALL link every captured node that uses the skill and SHALL keep nodes with unknown locations. The How to gain experience section SHALL list each evidenced source relevant to the skill, with links to specific recipes and nodes when possible. It SHALL distinguish verified experience rules from known call sites whose amounts or skill mappings remain unresolved. It SHALL not claim that the known call sites are exhaustive.

#### Scenario: Crafting skill
- **WHEN** a reader opens the Alchemy page
- **THEN** the Recipes section shows its 22 recipes with their products and stations
- **AND** the page links to Character progression and explains its verified crafting source

#### Scenario: Gathering skill
- **WHEN** a reader opens Mining and captured resource nodes name its skill
- **THEN** the Resource nodes section links those nodes and their known yields
- **AND** the How to gain experience section explains the verified node-use experience source

#### Scenario: Weapon skill
- **WHEN** a reader opens the Axes page
- **THEN** the page has no Recipes section
- **AND** it names auto-attack hits as a verified experience source without an Experience table

#### Scenario: Skill without levels
- **WHEN** a published skill has a highest level of zero
- **THEN** its hero shows no highest level and its page has no Experience section
- **AND** it retains the Character progression link

#### Scenario: Known call site without a verified skill mapping
- **WHEN** a skill experience call site has no verified mapping to one skill
- **THEN** the page does not assign that source to an unrelated skill
- **AND** the mechanics document names the source as unresolved if it is relevant to crafting and gathering

## ADDED Requirements

### Requirement: Recipe items and recipes link each other

A recipe item page SHALL name the recipe that the item teaches when a captured Recipe RankUp game action names that recipe. It SHALL show the product of the recipe with its tooltip. A recipe page SHALL name each published item that teaches it. A recipe without a known teaching item SHALL NOT claim that no item or other source teaches it.

#### Scenario: Recipe item teaches a recipe
- **WHEN** a reader opens a recipe item whose captured game action ranks up a recipe
- **THEN** the page names that recipe and shows its product
- **AND** the recipe page links back to the item

#### Scenario: Recipe has no known teaching item
- **WHEN** a recipe is not learned by default and no captured item action teaches it
- **THEN** its page names no teaching item and makes no claim that nothing teaches it
- **AND** the coverage page counts the recipe
