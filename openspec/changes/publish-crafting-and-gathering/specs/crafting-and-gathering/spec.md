## Purpose

Give readers linked resource node facts and a clear explanation of the captured crafting and gathering rules. Keep unknown game behavior distinct from verified rules.

## ADDED Requirements

### Requirement: Resource nodes have reachable reference pages

The publication SHALL make every captured resource node reachable through a resource list, search, and links from related skills and item yields. The mechanics page SHALL link to the resource list. Each resource page SHALL show its name, available description, known gathering skill, and authored ranks in order. Each rank SHALL show captured skill-level, experience, gather-time, respawn-time, and linked yield facts when available. A yield SHALL show its recorded quantity and chance semantics without claiming an effective chance when other rolls affect it. An unplaced node SHALL remain on the list with a visible location gap. A missing link SHALL not cause the node or its rank to disappear.

#### Scenario: Node has two ranks and linked yields
- **WHEN** a resource node has two captured ranks with different loot tables
- **THEN** its page shows each rank with only the yields linked to that rank
- **AND** an item page links back to the resource node for each known yield

#### Scenario: Node has no verified placement
- **WHEN** a captured node has ranks but no known placement
- **THEN** its page and list entry remain reachable and state that its location is unknown

#### Scenario: Yield source has no resolved node
- **WHEN** a yield cannot be tied to one resource node and rank
- **THEN** the item retains its source label and any verified location
- **AND** the publication does not assign the yield to an unrelated resource node

### Requirement: Crafting rules name their evidence and boundaries

The published `/mechanics/crafting-and-gathering` document SHALL explain the verified skill gate for a recipe rank, the full and half experience bands, and when experience stops. It SHALL distinguish a rank's base experience from the amount after skill modifiers. The page SHALL use recorded game values from the catalog and publication, not site constants. It SHALL link to recipes and skills when it names them. It SHALL not rank recipes or label one best.

#### Scenario: Recipe sits at the half-experience band
- **WHEN** a recipe rank has a recorded experience amount and the skill is in the verified half-experience band
- **THEN** the page explains that the base amount is halved and rounded down before skill modifiers
- **AND** the recipe page labels that amount as base experience, not a guaranteed award

### Requirement: Spawner explanation separates selection and availability

The crafting and gathering page SHALL explain verified weighted resource selection by gathering skill. It SHALL distinguish authored option weights from effective probabilities. It SHALL show recorded respawn time, jitter, player range, and boosting effects only with their verified meaning. If an effect or timing rule remains unresolved, the page SHALL label that part unknown rather than invent a rule. Spawner examples SHALL come from catalog evidence and retain their source references.

#### Scenario: Skill changes option weights
- **WHEN** a captured spawner has options whose weights vary with gathering skill
- **THEN** its explanation shows how skill affects the weighted pick without calling the authored weights drop chances

#### Scenario: Attunement entry is not verified
- **WHEN** a table slot has no confirmed effect and node names
- **THEN** the page does not name that slot as an active boost
- **AND** it states that the remaining boosts are not confirmed

### Requirement: Progress flags stay out of reader surfaces

The publication SHALL NOT publish a record that the reviewed publication presentation excludes. It SHALL omit an excluded record from pages, lists, search, and counts. It SHALL render a reference to an excluded record as plain text without a link. Each exclusion SHALL name a reason and its evidence. Staging SHALL reject a candidate that removes a published record that no exclusion names.

#### Scenario: Savers progress flags
- **WHEN** the presentation excludes the Savers skill, its 13 recipes, and its crafting station
- **THEN** the skill list, the recipe list, search, and the hub omit them
- **AND** the catalog still retains their records and the conditions that name them

#### Scenario: Unlisted removal
- **WHEN** a candidate drops a published record that no exclusion names
- **THEN** staging rejects the candidate

### Requirement: Reader wording stays independent of internal records

The resource and mechanics pages SHALL use sentence case for headings, columns, and sentences. Category values and names SHALL use title case. They SHALL not show native record ids or enum words. Text SHALL use straight quotes.

#### Scenario: Resource link has an internal identifier
- **WHEN** a resource link resolves from a native record identifier
- **THEN** its visible label uses the formatted resource name without that identifier
