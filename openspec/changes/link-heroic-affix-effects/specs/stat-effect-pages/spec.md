## ADDED Requirements

### Requirement: Verified mechanics links explain effect pages

A verified mechanics rule that links an effect SHALL make the effect reachable for publication unless a reviewed, self-invalidating exclusion withholds it. The effect page SHALL show the verified explanation and link back to the mechanics page section that contains it. A rule whose status is unknown SHALL NOT make its effect reachable.

#### Scenario: The tier runtime applies an effect without a catalog applier
- **WHEN** a verified Heroic affix rule links a described status effect and no catalog applier applies it
- **THEN** the status effect has a page with the verified explanation and a link to the Heroic Tier section

#### Scenario: A content-free linked effect is withheld
- **WHEN** a linked effect has no description, meaningful outcome, or usable relation and its reviewed exclusion evidence remains true
- **THEN** its rule link retains its name and icon without publishing a thin effect page

#### Scenario: An effect rule names its own page
- **WHEN** an effect page displays a verified rule that names that effect
- **THEN** its own name and icon remain visible without a link back to itself
- **AND** links to other effects in the same rule remain navigable

#### Scenario: A Heroic effect points to its explanation
- **WHEN** an effect page displays a rule from the Heroic Tier Affixes or Turning it on and off section
- **THEN** its section link uses a player-facing “How … works” label instead of a section slug

#### Scenario: Two rules share one explanation section
- **WHEN** two rules on an effect page both belong to the same Heroic Tier section
- **THEN** both verified rules appear, with only one link to that section
