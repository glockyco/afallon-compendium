## ADDED Requirements

### Requirement: Stat pages show outcomes that scale with the stat

Alongside sources that grant a stat, its page SHALL show separate navigable groups for effects and for player and creature abilities whose applied effect ranks scale with that stat. A relationship SHALL identify the applicable effect rank and coefficient rather than implying that obtaining the stat grants the ability. When several abilities apply the same effect, their ability identities SHALL remain discoverable without repeating identical effect-rank scaling lines as unrelated bonuses.

#### Scenario: Intellect has player and creature applications
- **WHEN** a published player ability and a creature ability each apply an effect whose rank uses Intellect
- **THEN** Intellect's page links both application contexts and their effect ranks while keeping item, talent, and class sources of Intellect distinct

### Requirement: Effect pages distinguish base and variable scaling

Each supported damage/healing effect rank SHALL present its authored flat amount, each linked caster-stat contribution and coefficient, and weapon percentage with its selected-weapon context as separate facts. The effect tooltip SHALL summarize the meaningful contributions and provide access to the full rank explanation. Ranks with equal flat amounts but different scaling SHALL remain distinguishable, and unresolvable contributions SHALL not make known operands disappear.

#### Scenario: Two effects have the same flat amount
- **WHEN** Brutal Slice and Vital Rend effects each have 25 authored damage but use respectively 200% and 250% selected weapon damage
- **THEN** their effect pages and previews preserve that distinction and show Magical/Intellect scaling independently of the custom Slicing Damage label
