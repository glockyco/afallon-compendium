## Purpose

Defines complete, native-derived compendium tooltips that preserve game facts, apply deterministic synthetic character state, and remain usable by pointer, keyboard, touch, and downstream data consumers.

## ADDED Requirements

### Requirement: Tooltip source data is complete
The scan and publication SHALL retain every native fact needed to reproduce supported item and ability tooltips. Each ability SHALL publish every authored rank in source order with its generated mechanic text. Each item with non-empty native use or buff text SHALL publish that text. A complete publication SHALL reject a required tooltip block that was silently lost; an unavailable native block SHALL instead produce explicit coverage evidence.

#### Scenario: Ability rank has generated mechanics
- **WHEN** an ability rank generates activation, range, cooldown, description, damage, healing, effect, movement, or other mechanic lines
- **THEN** the published ability rank contains those lines in their native order and with their semantic emphasis preserved

#### Scenario: Item has native use text
- **WHEN** an item's native tooltip generator returns one or more use or buff lines
- **THEN** the published item contains every non-empty line in source order

#### Scenario: Native tooltip generation fails
- **WHEN** a required native item or ability tooltip block cannot be generated or decoded
- **THEN** complete publication fails with coverage evidence that identifies the entity and source path instead of publishing an apparently complete empty block

### Requirement: Native rich text is safe and faithful
Published tooltip text SHALL preserve supported native line breaks, emphasis, and semantic colour roles without exposing executable markup. Unsupported native tags SHALL become coverage evidence and SHALL NOT be inserted into the site as raw HTML.

#### Scenario: Native ability text contains style tags
- **WHEN** generated ability text contains supported colour or italic tags
- **THEN** the public document represents those styles as typed text spans and the site renders equivalent emphasis without interpreting arbitrary HTML

#### Scenario: Native tooltip text contains an unsupported tag
- **WHEN** generated tooltip text contains a tag outside the supported native-text grammar
- **THEN** the tag is reported and cannot create markup or script content in the rendered tooltip

### Requirement: Percentage formatting follows the game
A stat row SHALL render as a percentage when either the authored row or the referenced canonical stat marks it as percentage-valued. The rule SHALL apply consistently to item stats, random item stats, gem stats, and gear-set tier stats.

#### Scenario: Canonical stat supplies percentage semantics
- **WHEN** an item row has `isPercent=false` and its referenced stat has `isPercentStat=true`
- **THEN** the item tooltip renders the signed value with a percent sign

#### Scenario: Item row supplies percentage semantics
- **WHEN** an item row has `isPercent=true` and its referenced stat has `isPercentStat=false`
- **THEN** the item tooltip still renders the signed value with a percent sign

### Requirement: Item tooltips follow the native fact order
An item tooltip SHALL present supported facts in this order: icon and rarity-coloured name; slot and type; item power; damage, speed, and damage per second; sign-first stats; native use or buff lines; sockets or gem effects; gear-set members and tiers; equipment requirements; and sell price last. It SHALL omit page-only facts such as source relations, buy price, and stack limit unless the native tooltip presents them. Full item pages SHALL retain their broader compendium facts and relations.

#### Scenario: Reader opens a weapon tooltip
- **WHEN** a reader hovers or focuses a weapon link
- **THEN** the tooltip shows damage, speed, damage per second, sign-first stats, requirements, and sell price in native order without repeating a requirement

#### Scenario: Reader opens a usable-item tooltip
- **WHEN** a reader opens the tooltip for an item with native use or buff text
- **THEN** the use or buff lines appear after the item's core stats and before its requirements and sell price

#### Scenario: Reader opens a full item page
- **WHEN** a reader navigates from an item tooltip to the item's page
- **THEN** the page can show stack limits, buy prices, sources, crafting relations, and typed use conditions without adding those page-only facts to the tooltip

### Requirement: Character-dependent requirements use deterministic fulfilled state
The compendium SHALL assume that every character-dependent equipment requirement is fulfilled. Each such requirement SHALL appear once in the tooltip and use the game's fulfilled green treatment. Requirement wording SHALL retain the complete typed predicate, including target, state, comparison, ownership, item condition, subtype, threshold, and group cardinality when those fields are authored.

Use conditions such as an inactive effect, an equipped weapon subtype, a region, or combat state SHALL NOT be presented as equipment requirements in the native-style item tooltip. A full page MAY show them in a separately named use-condition section.

#### Scenario: Item requires a level
- **WHEN** an item has a positive level requirement
- **THEN** the tooltip shows one green level requirement in the native requirement position and does not repeat it in the header

#### Scenario: Item has a class requirement group
- **WHEN** an item can be equipped by one of several authored classes
- **THEN** the tooltip names each class, preserves the authored alternative or count rule, and renders the fulfilled group in green

#### Scenario: Potion requires an inactive effect
- **WHEN** a potion can be used only while an effect is inactive
- **THEN** the tooltip does not mislabel the effect as an equipment requirement and the full page, if it shows the condition, states that the effect must be inactive

#### Scenario: Sharpening stone requires an equipped weapon type
- **WHEN** a use condition accepts one of several equipped weapon types
- **THEN** the full page names those weapon types and ownership state instead of rendering generic `Item` labels

### Requirement: Item gear sets use a one-item synthetic context
An item tooltip for a gear-set member SHALL load the referenced set's authored member and tier data without duplicating that data into the item document. The current item SHALL be the only active member, every other member SHALL be inactive, and the synthetic equipped count SHALL be one. A tier SHALL be active exactly when its equipped threshold is satisfied by that count.

#### Scenario: Reader opens a set-item tooltip
- **WHEN** the reader opens the tooltip for one member of a multi-item set
- **THEN** the tooltip lists members in authored order with the current item active and every other member inactive
- **AND** it lists tiers in authored order with each threshold, stat line, and active or inactive state derived from an equipped count of one

#### Scenario: Referenced set data cannot be loaded
- **WHEN** an item names a published gear set but its set document cannot be verified or loaded
- **THEN** the tooltip reports unavailable details and does not synthesize an empty set

### Requirement: Ability tooltips expose every applicable rank
Ability documents SHALL preserve ranks in authored order. A contextual ability reference SHALL retain its authored rank when the source provides one. A contextual tooltip SHALL show that rank; a context-free tooltip or page SHALL expose every rank and clearly label a multi-rank ability.

#### Scenario: Single-rank ability is opened
- **WHEN** a reader opens a tooltip for an ability with one rank
- **THEN** the tooltip shows that rank's complete native-generated mechanic block without an empty facts section

#### Scenario: Multi-rank ability is opened without context
- **WHEN** a reader opens a context-free tooltip or page for an ability with multiple ranks
- **THEN** every rank is available in authored order and each rank is explicitly labelled

#### Scenario: NPC ability reference supplies a rank
- **WHEN** an NPC ability phase identifies a specific ability rank
- **THEN** the NPC relation retains that rank and its tooltip opens the corresponding rank content

### Requirement: Each entity kind has an explicit compact presentation
Each paged entity kind SHALL define which facts form its compact tooltip. A fact SHALL NOT disappear from the compact presentation solely because it is stored as a relation. Compact presentations SHALL avoid unrelated exhaustive tables while retaining the facts needed to identify the entity and decide whether to open its page.

#### Scenario: Reader opens a recipe tooltip
- **WHEN** a recipe has a product and materials
- **THEN** its tooltip shows station, skill, rank, product, and material requirements rather than only its header

#### Scenario: Reader opens a quest tooltip
- **WHEN** a quest has structured objectives or rewards
- **THEN** its tooltip includes an objective and reward summary in addition to giver, turn-in, level, and quest text

#### Scenario: Reader opens an NPC or place tooltip
- **WHEN** an NPC or place has large relation tables
- **THEN** its tooltip shows the kind's declared identity facts and relation summaries without copying every page table into the tooltip

### Requirement: Tooltip interaction is usable and accessible
A pointer-opened tooltip SHALL remain open while the pointer is over either its owner or the tooltip, and SHALL close after the pointer leaves both. Overflow content SHALL be scrollable. Keyboard focus SHALL open the tooltip, associate it with its owner for assistive technology, close it with Escape, and never trap focus. A tooltip using the ARIA tooltip role SHALL contain no focusable controls. Touch activation SHALL continue to navigate to the entity page without requiring a hover-only step.

#### Scenario: Reader scrolls a long tooltip
- **WHEN** a pointer user moves from an entity link into an overflowing tooltip
- **THEN** the tooltip remains open and the reader can scroll its complete content

#### Scenario: Keyboard reader inspects a tooltip
- **WHEN** keyboard focus reaches an entity link
- **THEN** its associated tooltip becomes available to assistive technology
- **AND** pressing Escape closes it while focus remains on the link

#### Scenario: Touch reader activates an entity link
- **WHEN** a reader activates an entity link on a touch-only device
- **THEN** the link navigates normally to the entity page without depending on hover behavior

### Requirement: Duplicate display names stay concise and stable
Entity links SHALL use concise deterministic disambiguation. A displayed name SHALL NOT include an unbounded list of related entities. Full relation lists SHALL remain available on the entity page.

#### Scenario: Several abilities share a name
- **WHEN** several abilities have the same displayed name and a short unique contextual suffix is unavailable
- **THEN** each link uses the native identifier as a stable suffix, such as `Cleave (#72)`, rather than appending every user of the ability

### Requirement: Tooltip document schemas cut over atomically
The publication SHALL expose one current schema shape for each affected static document kind. All document references, graph hashes, loaders, pages, and tooltips in a publication SHALL agree on that version. The change SHALL NOT publish compatibility aliases or both old and new tooltip shapes.

#### Scenario: New tooltip publication is selected
- **WHEN** a publication containing the new item, ability, requirement, or ability-reference shape is staged
- **THEN** every referenced affected document validates against the matching new schema and the deployment graph verifies as one unit

#### Scenario: Document version does not match its reference
- **WHEN** a loader receives an affected document whose schema version does not match its resource reference
- **THEN** loading fails with an identity or schema error instead of interpreting the document as another version
