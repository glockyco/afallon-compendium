# item-property-presentation Specification

## Purpose

Define what item and property pages show: the in-game tooltip, gear sets, sources, and the purchase facts that the for-sale signs supply.

## Requirements

### Requirement: Item pages embed gear sets

Gear sets SHALL have no separate page or list. An item that belongs to a gear set SHALL include the set's key, formatted name, member references, and tiers in `facts.gearSet`. Each tier SHALL name its equipped-member count and stat bonuses. The item tooltip SHALL show the full set, and the page SHALL link resolvable members.

#### Scenario: A member of a gear set
- **WHEN** an item belongs to a set with three members and two bonus tiers
- **THEN** its page shows the set name, all members, and both tiers
- **AND** each resolvable member links to its item page

### Requirement: An item page shows its tooltip and sources

An item page SHALL show its name and applicable map action in the title, and its in-game tooltip once with description in the side column (after its answer on narrow screens). Its How to get it answer SHALL show one linked route per available source kind—craft, mine, loot, search, buy, quest reward, or starting gear—ordered by guaranteed yield then known spot count, without treating a chance as guaranteed. Each route SHALL identify a useful example, relevant quantity or chance, and its full anchored source section; an unknown source SHALL be stated plainly. A crafted route SHALL show the materials, known teacher, skill and level, and a computed experience sentence with guide-step link. Its sections SHALL follow Teaches, Used for, then applicable Crafting, Mined from, Dropped by, Sold by, Found in objects, Found in containers, and Quest rewards. Recipe relations SHALL use equations; full relations SHALL remain accessible. Price and stack size SHALL remain available once as secondary facts. A starting-gear route SHALL name only published classes and link their Starting gear sections.

#### Scenario: Item has several sources
- **WHEN** an item drops from seven creatures and is sold by two vendors
- **THEN** How to get it has separate Loot and Buy routes with linked examples and the known lowest price
- **AND** the full source sections retain all nine relations

#### Scenario: Hover tooltip of an item link
- **WHEN** a reader focuses, taps, or hovers an item link
- **THEN** its preview shows the game's tooltip and at most one context line without a source table

#### Scenario: No source is published
- **WHEN** no source relation is published for an item
- **THEN** How to get it says "No known way to get this item."

#### Scenario: Starting gear of three classes
- **WHEN** Wizard, Necromancer, and Druid start with Novice Staff
- **THEN** Starting gear is an acquisition route linked to the three class pages and their Starting gear sections

#### Scenario: Starting gear of a class without a page
- **WHEN** only unpublished Berserker starts with Rune Shield
- **THEN** the page shows no starting-gear route to Berserker

#### Scenario: Crafted item
- **WHEN** Tailoring level 150 crafts Runeweave Regalia
- **THEN** its Craft route links its Crafting section and shows the materials and supported experience breakpoint

#### Scenario: Material of a recipe
- **WHEN** Runeweave Regalia uses Bolt of Runeweave
- **THEN** the material's Used for equation links the product's Crafting anchor

### Requirement: Property facts come from authored for-sale signs

For-sale signs SHALL supply the authored `RPGProperty` type, currency, purchase price, sell price, and income to the catalog. Signs of one property SHALL agree on these fields. A conflicting canonical value SHALL fail normalization. Sign markers SHALL link to the property page. The property page SHALL show available picture, type, purchase price, income per payment, sell price, and where to buy it. It SHALL not name an income interval or income currency without confirmed facts.

#### Scenario: Two signs sell the same property
- **WHEN** two scanned for-sale signs refer to one property with matching facts
- **THEN** both markers link to the property page
- **AND** the page shows its prices, type, income, and sign locations

#### Scenario: For-sale signs disagree
- **WHEN** two signs of one property contain different authored prices
- **THEN** catalog normalization fails instead of choosing one price

### Requirement: Crafted items show their recipe on the item page

The product of a published recipe SHALL retain a Crafting section anchored at `crafting`. It SHALL present its materials and quantities as an equation with product yield only when greater than one, the station, required skill level, base experience, computed full/half/no-experience breakpoints, known teaching items, and a guide-step link. The computed full-experience band SHALL distinguish the game's first and second full-experience ranges. The product's own tooltip SHALL NOT be duplicated in the equation. The recipe name SHALL be visible if it differs from its product. A missing teacher SHALL remain unknown, and an unresolved skill SHALL not lead to invented bands. Base experience SHALL not be called the final award after modifiers. No rule prose SHALL appear in this section.

#### Scenario: Crafted item with a teaching item
- **WHEN** Tailoring level 150 crafts Runeweave Regalia with 5 Bolt of Runeweave and 1 Heart of Corruption
- **THEN** its Crafting section shows those materials, the station, experience breakpoints, and a link to Recipe: Runeweave Regalia
- **AND** the equation does not repeat Runeweave Regalia's tooltip

#### Scenario: Recipe name differs from the product
- **WHEN** Ring of Bleed Damage makes Bloodthrall Signet
- **THEN** Crafting names the recipe without claiming that an unknown teacher does not exist

#### Scenario: Recipe skill does not resolve
- **WHEN** a recipe skill cannot be resolved
- **THEN** Crafting retains materials without an invented skill level or experience band

### Requirement: Eligible item pages show corruption levels in the game tooltip

An item page SHALL place a corruption-level slider directly below its single game tooltip in the side column only for equippable non-token templates present in the five timed dungeons' boss reward-bag loot tables with a captured cap and supported template-stat calculations. The slider SHALL range from zero through the captured cap, show `None` at zero and `+N` at positive levels, and update the tooltip itself. At positive levels the tooltip SHALL show calculated template Item power, weapon damage endpoints rounded to nearest integer with midpoint-to-even ties, damage per second derived from those displayed endpoints, and scaled fixed stats using the game's displayed number formatting. It SHALL show `Corruption +N` after the damage block and before fixed stat lines only at positive levels. Random rolls and gems SHALL remain unchanged; the comparison SHALL identify calculated templates rather than saved rolled loot. Eligible items SHALL expose `corruptedFrom` dungeon place and associated boss references, distinct from ordinary item sources.

#### Scenario: Reader selects a supported level
- **WHEN** a reader selects a supported level on an eligible weapon
- **THEN** the tooltip shows calculated damage endpoints, each rounded to nearest integer with midpoint-to-even ties as observed, and DPS derived from the rounded endpoints and attack speed
- **AND** the slider shows `+N` while the tooltip shows `Corruption +N` after the damage block and before fixed stats

#### Scenario: Reader returns to the unmodified item
- **WHEN** a reader selects level zero
- **THEN** the tooltip shows the original item values without a corruption bonus or corruption-level label, and the slider reads `None`

#### Scenario: Item is not in a timed dungeon reward bag
- **WHEN** an equippable item does not occur in any of the five timed dungeons' boss reward-bag loot tables, even if another boss table drops it
- **THEN** its page retains the ordinary tooltip and has no corruption-level control

#### Scenario: Item power and fractional stats
- **WHEN** an eligible template has a fixed Stamina stat of 2 and Item power 15 and the reader selects level one under the captured 5% general and +5 flat Item power settings
- **THEN** its calculated tooltip shows `+2.1 Stamina` and `Item power 20` using game-matching integer display

#### Scenario: Gear has random properties or gems
- **WHEN** a gear template has random stats, gems, or other item-specific rolls
- **THEN** the tooltip keeps random and gem values unchanged, does not fabricate unobserved item-specific rolls, and the page explains that random stats and gems do not change

### Requirement: Timed dungeon reward bags appear as an item source

Each published item that a timed dungeon reward bag can grant SHALL have a typed dungeon reward source with the linked place, associated timer bosses, and whether the item is guaranteed. Each of the five timed dungeons SHALL be a guaranteed source of its Corruption Token. Equipment in a timer boss's reward table SHALL have a chance source limited to that boss's dungeon. The item page SHALL show the dungeon reward route in “How to get it”, link its places and applicable bosses, and link the guide's timer step. The hover card SHALL share this source answer with the page.

#### Scenario: Reader opens the Corruption Token page
- **WHEN** a reader opens the token's item page
- **THEN** its first acquisition route says every timed dungeon run ends with a reward bag containing one token and lists all five linked dungeons
- **AND** the route links to the timer step, while the hover card describes the guaranteed source

#### Scenario: Reader opens reward equipment
- **WHEN** a reader opens an eligible reward equipment page
- **THEN** its acquisition route lists the timed dungeons and the bosses whose reward tables contain that item as a chance, without claiming a guaranteed drop
- **AND** the corruption control keeps its linked reward-bag dungeon context
