## ADDED Requirements

### Requirement: Rule phrases place their links

A rule phrase MAY name a link inside the sentence with `{#n}`, where `n` is the index of the link in the rule. A phrase that names one link this way SHALL name each of its links exactly once. A phrase without link tokens SHALL end with words that lead into the closing list of its links. Catalog creation SHALL reject a link token without a link, a link that a phrase with link tokens does not name, and a link that a phrase names twice.

#### Scenario: Links inside the sentence
- **WHEN** a chest rule links Soaked Bag and Slime Covered Sack and its phrase reads "Using a {#1} or a {#0} opens a chest."
- **THEN** the guide shows "Using a Soaked Bag or a Slime Covered Sack opens a chest." with both names linked

#### Scenario: A token without a link
- **WHEN** a phrase names `{#2}` and its rule has two links
- **THEN** catalog creation fails and names the rule

#### Scenario: Some links named inline
- **WHEN** a rule has two links and its phrase names only `{#0}`
- **THEN** catalog creation fails and names the rule
