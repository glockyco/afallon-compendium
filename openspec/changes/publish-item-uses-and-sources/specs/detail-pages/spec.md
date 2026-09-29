## ADDED Requirements

### Requirement: Recipe pages name teachers beyond items

A recipe page SHALL name each captured dialogue, object, effect, region, or stat whose Recipe RankUp action teaches the recipe. A dialogue teacher SHALL name its NPC and link the NPC page when the page exists. A recipe without a captured teacher SHALL NOT claim that nothing teaches it.

#### Scenario: Dialogue teaches a recipe
- **WHEN** a captured dialogue node of an NPC has a Recipe RankUp action for a recipe
- **THEN** the recipe page names that NPC as a teacher and links the NPC page

#### Scenario: No captured teacher
- **WHEN** a recipe is not learned by default and no captured action teaches it
- **THEN** its page names no teacher and makes no claim that nothing teaches it
