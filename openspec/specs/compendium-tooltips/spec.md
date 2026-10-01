# compendium-tooltips Specification

## Purpose

Define the native-derived facts and safe, compact presentation of compendium entity tooltips, including their deterministic character context and accessible link previews.

## Requirements

### Requirement: Tooltip source data is complete

The scan and publication SHALL preserve generated mechanic lines for each authored ability rank, non-empty native use or buff lines for items in source order, and every stat change of a talent rank that the game's talent tooltip shows. Complete publication SHALL report missing or changed tooltip blocks, talent ranks that leave out a shown stat change, and invalid contextual ability ranks rather than silently treating them as complete.

#### Scenario: Ability rank has generated mechanics
- **WHEN** an authored ability rank generates mechanic lines
- **THEN** its published rank retains those lines in source order with their typed emphasis

#### Scenario: Item has native use text
- **WHEN** an item's native tooltip supplies non-empty use or buff text
- **THEN** the published item retains that text in source order

#### Scenario: Published block is lost
- **WHEN** an ability's native rank block or an item's native use block is absent or changed in a complete publication
- **THEN** tooltip coverage reports the affected entity and complete publication fails

#### Scenario: Talent rank leaves out a stat change
- **WHEN** a talent rank changes the stats of a species, and the publication cannot name the species
- **THEN** tooltip coverage reports the talent and its rank
- **AND** complete publication fails

### Requirement: Native rich text is safe and faithful

Published tooltip text SHALL represent supported native line breaks, colour roles, and italic emphasis as typed text spans. Unsupported or malformed markup SHALL fail parsing rather than enter a rendered tooltip as HTML.

#### Scenario: Native ability text contains style tags
- **WHEN** generated ability text contains supported colour or italic tags
- **THEN** the published lines retain the style as typed spans and the site renders escaped text with equivalent emphasis

#### Scenario: Native tooltip text contains an unsupported tag
- **WHEN** generated text contains a tag outside the supported native-text grammar
- **THEN** parsing rejects the text rather than rendering the tag as markup

### Requirement: Percentage formatting follows the game

A stat row SHALL render as a percentage when either its authored row or its referenced canonical stat marks it as percentage-valued. This rule SHALL apply to fixed item stats, random item stats, gem stats, gear-set tier stats, talent stat changes, and talent stat changes to pets.

#### Scenario: Canonical stat supplies percentage semantics
- **WHEN** an item stat row has `isPercent=false` and its canonical stat has `isPercentStat=true`
- **THEN** the published row has percentage semantics and the tooltip displays a percent sign

#### Scenario: Row supplies percentage semantics
- **WHEN** an item stat row has `isPercent=true` and its canonical stat has `isPercentStat=false`
- **THEN** the tooltip still displays a percent sign

#### Scenario: Flat talent change to a percentage stat
- **WHEN** Heroic Power gives 1 Damage Dealt without its own percentage flag, and Damage Dealt is a percentage stat
- **THEN** its talent row shows +1% Damage Dealt, as the game's talent tooltip does

### Requirement: Item tooltips present item facts in readable order

An item tooltip SHALL put its icon, rarity-coloured name, type and slot before item power, weapon facts, signed stats, native use lines, socket and gem facts, gear-set details, requirements, and sell price. It SHALL keep acquisition relations, buy price, and stack limits on the item page rather than in the native item fact block; a link preview MAY append one acquisition context line.

#### Scenario: Reader opens a usable item tooltip
- **WHEN** an item's published use or buff lines are present
- **THEN** they appear after the core stats and before sockets, requirements, and sell price

#### Scenario: Reader follows an item link
- **WHEN** an item link has a known acquisition route
- **THEN** the preview may append that route after the native item facts without copying a source table
- **AND** the full page retains its broader facts and source relations

### Requirement: Character-dependent requirements use deterministic fulfilled state

Equipment requirements in an item tooltip SHALL appear in their requirements block as fulfilled green predicates, with authored comparison, state, references, and group cardinality preserved in their wording. Use conditions SHALL be identified separately rather than passed off as equipment requirements.

#### Scenario: Item requires a level
- **WHEN** an item has a positive level requirement in its equipment predicates
- **THEN** the tooltip displays the requirement once in its fulfilled requirements block rather than repeating it in the header

#### Scenario: Item has a class requirement group
- **WHEN** several classes form an authored alternative or counted equipment requirement
- **THEN** the tooltip names the classes and preserves the alternative or count rule in green

#### Scenario: Item has a use condition
- **WHEN** an item requires a state or item type to be used
- **THEN** the tooltip labels the predicate as a use requirement separately from equipment requirements

### Requirement: Item tooltips present embedded gear sets

An item tooltip SHALL show its published gear-set members and tiers in authored order. It SHALL distinguish the viewed member from other members and show each tier's equipped-member threshold and signed stat bonuses without inventing an equipment inventory.

#### Scenario: Reader opens a set-item tooltip
- **WHEN** the reader opens the tooltip for a member of a multi-item gear set
- **THEN** it lists the current member distinctly from the other members and shows each tier's threshold and signed stat bonuses in authored order

### Requirement: Ability tooltips select a rank while pages preserve all ranks

Ability documents SHALL retain all published ranks of each version in authored order, and contextual ability references SHALL retain an authored rank when supplied. A tooltip SHALL present the contextual rank or the first rank of its selected version and label it when that version has multiple ranks. The ability page SHALL make the complete rank list available.

#### Scenario: Single-rank ability is opened
- **WHEN** a reader opens a tooltip for a single-rank ability
- **THEN** the tooltip shows its generated mechanic lines without a redundant rank heading

#### Scenario: Multi-rank ability is opened without rank context
- **WHEN** a reader opens a link to an ability version with several ranks but no selected rank
- **THEN** its tooltip labels and shows the first rank while its page exposes the other ranks

#### Scenario: NPC ability reference supplies a rank
- **WHEN** an NPC ability phase identifies a particular rank
- **THEN** its published relation retains the rank and the corresponding tooltip selects it

### Requirement: Supported entity links have compact presentations

An entity link tooltip SHALL use a presentation appropriate to its published kind instead of copying the full page's relation tables. Its compact facts SHALL identify the entity and summarize pertinent relations without displaying exhaustive tables.

#### Scenario: Reader opens an NPC tooltip
- **WHEN** an NPC has many page relations
- **THEN** its tooltip presents identity, type, level, location, and an applicable faction or health fact without copying those tables

#### Scenario: Reader opens a place tooltip
- **WHEN** a place has a parent and related quests
- **THEN** its tooltip presents place type, parent, and quest count rather than the complete relation tables

### Requirement: Tooltip interaction is usable and accessible

An entity tooltip SHALL associate its non-interactive content with the owner link for assistive technology, open on keyboard focus, and close with Escape without taking focus from the link. Its overflow SHALL stay bounded without intercepting pointer movement through nearby entries. A touch reader SHALL be able to open a preview and then follow the link.

#### Scenario: Keyboard reader inspects a tooltip
- **WHEN** keyboard focus reaches an entity link
- **THEN** its tooltip becomes available through the link's description association
- **AND** pressing Escape closes the tooltip without moving focus

#### Scenario: Reader traverses adjacent table entries
- **WHEN** a reader moves the pointer between nearby entity links
- **THEN** the tooltip sits beside its link where space permits and does not intercept movement to an adjacent entry

#### Scenario: Touch reader activates an entity link
- **WHEN** a touch reader taps a linked entity
- **THEN** the first tap opens its preview and a subsequent tap can navigate to the entity page

### Requirement: Duplicate display names stay concise and stable

Entity links SHALL disambiguate duplicate display names with bounded, deterministic qualifiers or positional suffixes. They SHALL NOT append an unbounded list of related entities to a link name; full relations belong on the page.

#### Scenario: Several abilities share a name
- **WHEN** distinct ability pages have the same name and no semantic qualifier is available
- **THEN** their link names receive stable positional suffixes ordered by native identifier instead of lists of ability users

### Requirement: Tooltip document schemas cut over atomically

The publication SHALL expose one registered schema for each affected static document kind. Its resource references, documents, and loaders SHALL agree on their schema identities, and graph verification SHALL reject incompatible references instead of interpreting an older shape as the current one.

#### Scenario: A tooltip publication is selected
- **WHEN** item, ability, requirement, or contextual ability-reference data is published
- **THEN** the affected documents validate against their registered schemas and the resource graph verifies together

#### Scenario: Document version does not match its reference
- **WHEN** a loader receives a document with a schema version that does not match its reference
- **THEN** it rejects the document rather than rendering a mismatched tooltip
