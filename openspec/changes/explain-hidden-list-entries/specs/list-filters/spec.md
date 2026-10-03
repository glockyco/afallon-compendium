## MODIFIED Requirements

### Requirement: Hidden reveals respect the current search and filters

A list SHALL count hidden entries matching its current name search, selected facets, numeric ranges, and stat filters. The reveal SHALL be offered only when that count is positive, and activating it SHALL show the matching hidden entries. The count SHALL never present the total hidden across the kind as the matching count of a narrowed search. Its sentence-case button SHALL say what is missing for its kind: "Show 91 items without a known source", "Show 3 NPCs not found in the world", or "Show 49 abilities nobody uses", with singular forms for one entry. On hover, focus, and tap, the reveal SHALL offer the shared explanation "These are in the game's files, but we found no way to get, meet, or use them in this version." Availability facets and selected chips SHALL use readable kind-specific labels rather than "Known Way" or "No Known Way". An ability with no known use SHALL show "Nobody Uses It" only in the Availability filter and chip, not in the Source column or filter.

#### Scenario: Shout is hidden by default
- **WHEN** the reader searches the Abilities list for Shout before revealing entries with no known use
- **THEN** the reveal counts the matching hidden Shout and not every hidden ability
- **AND** activating the reveal shows Shout among matching results

#### Scenario: Other filters narrow the reveal
- **WHEN** the reader searches by name and selects a facet or an inclusive numeric range
- **THEN** the hidden reveal counts only entries satisfying those choices

#### Scenario: Hidden item is explained and revealed
- **WHEN** the reader sees an Items reveal button and hovers, focuses, or taps its explanation control
- **THEN** the reader sees the same plain explanation and the button names the number of items without a known source
- **AND** selecting the reveal retains search and shows an Availability chip reading "Without a Known Source"

#### Scenario: Hidden NPC and ability have distinct wording
- **WHEN** an NPC or ability list contains hidden entries
- **THEN** each reveal button names NPCs not found in the world or abilities nobody uses, with the singular form when exactly one matches
- **AND** an ability revealed through a name search has an empty Source cell and shows "Nobody Uses It" only in Availability

#### Scenario: Hidden entries stay out of the way
- **WHEN** a list offers a reveal for hidden entries
- **THEN** the reveal appears as a muted text link at the end of the result bar, without a border, fill, or accent color
- **AND** the count, active filter chips, and Clear All remain the most prominent controls in the bar
