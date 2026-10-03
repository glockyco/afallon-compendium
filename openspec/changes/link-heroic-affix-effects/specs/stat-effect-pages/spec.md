## ADDED Requirements

### Requirement: Verified mechanics links explain effect pages

A verified mechanics rule that links an effect SHALL make the effect reachable for publication unless a reviewed, self-invalidating exclusion withholds it. The effect page SHALL show the verified explanation and link back to the mechanics page section that contains it. A rule whose status is unknown SHALL NOT make its effect reachable.

#### Scenario: The tier runtime applies an effect without a catalog applier
- **WHEN** a verified Heroic affix rule links a described status effect and no catalog applier applies it
- **THEN** the status effect has a page with the verified explanation and a link to the Heroic Tier section

#### Scenario: A content-free linked effect is withheld
- **WHEN** a linked effect has no description, meaningful outcome, or usable relation and its reviewed exclusion evidence remains true
- **THEN** its rule link retains its name and icon without publishing a thin effect page
