# effect-display-names Specification

## Purpose
Allow reviewed, evidence-backed names to replace opaque game effect names consistently across published references, including effects that do not have public pages.

## Requirements

### Requirement: Reviewed names identify real effects without ambiguity

A publication presentation MAY include effect display names, each with an effect identity and evidence. Publication SHALL reject repeated or unknown identities and names colliding with other public effect names. Presentations without this field SHALL remain valid.

#### Scenario: Unknown effect identity
- **WHEN** a reviewed display name targets an identity absent from the accepted effect catalog
- **THEN** the publication rejects the presentation

#### Scenario: Name collision
- **WHEN** the reviewed name matches another public effect name ignoring case or whitespace differences
- **THEN** the publication rejects the presentation

#### Scenario: Presentation without display names
- **WHEN** an existing publication presentation omits display names
- **THEN** the effect names and page addresses remain unchanged

### Requirement: Reviewed effect names appear consistently without changing page coverage

An overridden effect SHALL use its reviewed name in its public references and resolved requirement labels even when it has no page. If the effect has a page, its title and search entry SHALL use the reviewed name and its existing address SHALL remain unchanged. Requirement comparisons and amounts SHALL continue to reflect the catalog source.

#### Scenario: Challenge reward availability
- **WHEN** the reward backpack for Apprentice Necromancer Mask requires 60 or more stacks of the excluded effects:280
- **THEN** its requirement reads “Effect: Challenge Progress is active with 60 or more stacks” as plain text without a link

#### Scenario: Excluded effect reference
- **WHEN** a presentation names the excluded effects:280 “Challenge Progress”
- **THEN** its references use “Challenge Progress” rather than the internal effect name, without publishing an effect page or search entry

#### Scenario: Published effect reference and search
- **WHEN** a presentation names an effect with an existing public page
- **THEN** its page title, linked references, and search result use the reviewed name and keep the page address
