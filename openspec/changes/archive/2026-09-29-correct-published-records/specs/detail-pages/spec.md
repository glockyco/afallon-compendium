## MODIFIED Requirements

### Requirement: Skill pages show recipes and levels

The publication SHALL publish a page for each skill that the reviewed exclusion list does not name. The title block of a skill page SHALL show the kind. The hero SHALL show the skill icon and its highest level. When a character does not receive the skill automatically, the hero SHALL state it. The sections SHALL follow this order: Recipes, Experience. The Recipes section SHALL show each recipe that uses the skill with its product and its station. A skill with a highest level of zero SHALL NOT show an Experience section.

#### Scenario: Crafting skill
- **WHEN** a reader opens the Alchemy page
- **THEN** the Recipes section shows its 22 recipes with their products and stations

#### Scenario: Weapon skill
- **WHEN** a reader opens the Axes page
- **THEN** the page has no Recipes section
- **AND** the Experience section has 300 rows

#### Scenario: Skill without levels
- **WHEN** a published skill has a highest level of zero
- **THEN** its page has no Experience section
