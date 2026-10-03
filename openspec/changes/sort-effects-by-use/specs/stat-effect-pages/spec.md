## MODIFIED Requirements

### Requirement: Stat browsing distinguishes prevalence and triggers

The stats list SHALL sort by number of distinct sources, most common first, according to its published kind entry, and distinguish on-hit trigger stats from other stats. The effects list SHALL sort by the number of sources that apply each effect, most applied first, according to its published kind entry, with ties in name order. List names SHALL show their entity identity icons. The Effects browse description SHALL include non-state impacts and summons rather than implying every effect is a buff or debuff.

#### Scenario: Browse stats
- **WHEN** the reader opens the stats list
- **THEN** the most frequent stats appear first with their source counts and an on-hit trigger facet

#### Scenario: Browse effects
- **WHEN** the reader opens the effects list
- **THEN** the effects applied by the most sources appear first with their Applied By counts
