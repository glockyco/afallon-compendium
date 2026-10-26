# item-property-presentation Specification

## Purpose

Define what item and property pages show: the in-game tooltip, gear sets, sources, and the purchase facts that the for-sale signs supply.

## Requirements

### Requirement: Item pages embed gear sets

An item that belongs to a gear set SHALL include a reference to the set, the set's member references, and its tiers in `facts.gearSet`. Each tier SHALL name its equipped-member count and stat bonuses. The item tooltip SHALL show the full set, and the page SHALL link the set and its resolvable members.

#### Scenario: A member of a gear set
- **WHEN** an item belongs to a set with three members and two bonus tiers
- **THEN** its page shows the set name, all members, and both tiers
- **AND** the set name links the set's page and each resolvable member links to its item page

### Requirement: An item page shows its tooltip and sources

An item page SHALL show its name and applicable map action in the title, and its in-game tooltip once in the side column (after its answer on narrow screens).

#### Scenario: Item has several sources
- **WHEN** an item drops from seven creatures and is sold by two vendors
- **THEN** How to get it has separate Loot and Buy routes with linked examples and the known lowest price
- **AND** the full source sections retain all nine relations

#### Scenario: Hover tooltip of an item link
- **WHEN** a reader focuses, taps, or hovers an item link
- **THEN** its preview shows the game's tooltip and at most one context line without a source table

#### Scenario: No source is published
- **WHEN** no source relation is published for an item whose description states its effect
- **THEN** What it does leads with that effect and quietly says "No known way to get this item."

#### Scenario: Starting gear of three classes
- **WHEN** Wizard, Necromancer, and Druid start with Novice Staff
- **THEN** Starting gear is an acquisition route linked to the three class pages and their Starting gear sections

#### Scenario: Starting gear of a class without a page
- **WHEN** only unpublished Berserker starts with Rune Shield
- **THEN** the page shows no starting-gear route to Berserker

#### Scenario: Crafted item
- **WHEN** Tailoring level 150 crafts Runeweave Regalia
- **THEN** its Craft route links its Crafting section and shows materials, the requirement, base experience, and an optional level-by-level experience control

#### Scenario: Material of a recipe
- **WHEN** Runeweave Regalia uses Bolt of Runeweave
- **THEN** the material's Used for equation links the product's Crafting anchor

#### Scenario: Item comes from a supply pack
- **WHEN** the Druid level 6–11 table of Adventurer's Supply Pack gives Druid Staff
- **THEN** the page of Druid Staff shows a From items route and section that name Adventurer's Supply Pack
- **AND** the row names the Druid class and the level band of the table

#### Scenario: Item comes from a used bag
- **WHEN** the chest that Slime covered sack spawns gives Poison Sword
- **THEN** the page of Poison Sword shows a From items row for Slime covered sack with the recorded row chance

#### Scenario: Item comes from a tomb
- **WHEN** the chest that a tomb's visual effect spawns gives Human Skull
- **THEN** the page of Human Skull shows a Search route and a Found in objects row for Tomb with the recorded 30% row chance and its map spots

#### Scenario: Item comes from a sacrificial altar
- **WHEN** the sacrifice of 15 Corrupted emeralds at a sacrificial altar loads one of six item sets, and one set holds Frost Shard Necklace
- **THEN** the page of Frost Shard Necklace shows a Collected from route and section that name the sacrificial altar
- **AND** the row names the cost of 15 Corrupted emeralds and the six item sets

#### Scenario: Timed dungeon reward
- **WHEN** the reward bag of a dungeon timer gives Corruption Token
- **THEN** the page of Corruption Token shows a Dungeon rewards route with each dungeon

#### Scenario: Creature quest pickup
- **WHEN** an Infected boar dies while the task "Collect 6 Boar Haunches" is open
- **THEN** the page of Boar Haunch shows a Quest pickup route and a Quest pickups row where Infected Boar dies that names the quest Bait for a Beast

#### Scenario: Placed quest pickup
- **WHEN** pickups of Fallen Crusader's Signet lie in the world for the quest Rest for the Fallen
- **THEN** the page of Fallen Crusader's Signet shows a Quest pickups row that names the quest, the amount of one pickup, and the map spots

#### Scenario: Dungeon Finder reward
- **WHEN** a successful Random run of the Dungeon Finder gives Adventurer's Supply Pack
- **THEN** the page of Adventurer's Supply Pack shows a Dungeon Finder route and section that list the dungeons that the finder can queue

#### Scenario: Cloth drop
- **WHEN** Linen Cloth is a tier of the supplemental cloth drops
- **THEN** its page shows a Cloth loot section for Humanoid and Undead creatures with the roll chance, the count, and the chance per kill for each range of creature levels

#### Scenario: World Loot route
- **WHEN** creatures of levels 21 to 29 can give Bloodtrack Gloves as World Loot
- **THEN** How to get it has a World Loot route that names those levels and the range of the item's chances per kill
- **AND** the route links the World Loot section

#### Scenario: An item page shows its tooltip and sources
- **WHEN** An item with an applicable map action is viewed on a narrow screen.
- **THEN** The title shows its name and map action, and the in-game tooltip appears once after its answer.

### Requirement: Acquisition answers cover each available source kind

An item's How to get it answer SHALL show one linked route per available source kind: craft, mine, loot, search, buy, quest reward, starting gear, another item, a world object that spawns a chest, a dungeon reward, a Dungeon Finder run, a quest pickup, World Loot, or a cloth drop.

#### Scenario: Acquisition answers cover each available source kind
- **WHEN** An item has available mining and quest reward sources.
- **THEN** Its How to get it answer shows one linked mine route and one linked quest reward route.

### Requirement: Acquisition routes prioritize guaranteed yield and known spots

An item's How to get it routes SHALL be ordered by guaranteed yield then known spot count, without treating a chance as guaranteed.

#### Scenario: Acquisition routes prioritize guaranteed yield and known spots
- **WHEN** Two routes have the same guaranteed yield but different known spot counts, and another route offers only a chance.
- **THEN** Known spot count orders the tied routes, and the chance is not treated as guaranteed yield.

### Requirement: Acquisition routes identify examples and anchored sources

Each acquisition route SHALL identify a useful example, relevant quantity or chance, and its full anchored source section.

#### Scenario: Acquisition routes identify examples and anchored sources
- **WHEN** An item has a loot route with a recorded chance.
- **THEN** The route identifies a useful loot example, the relevant chance, and its full anchored source section.

### Requirement: Useful descriptions lead when sources are unknown

An item with no known source but a useful description SHALL lead with what it does and state the unknown source quietly rather than creating two empty cards.

#### Scenario: Useful descriptions lead when sources are unknown
- **WHEN** An item has no known source but a description explaining its effect.
- **THEN** The page leads with what the item does and quietly states the unknown source instead of creating two empty cards.

### Requirement: Crafted routes show requirements and base experience

A crafted route SHALL show the materials, known teacher, skill and level, and base experience before modifiers, with level-by-level experience and its mechanics link behind disclosure.

#### Scenario: Crafted routes show requirements and base experience
- **WHEN** A crafted item has materials, a known teacher, a skill and level requirement, and experience data.
- **THEN** The route shows those materials, teacher, skill and level, and base experience before modifiers, with level-by-level experience and its mechanics link behind disclosure.

### Requirement: Item sections follow the prescribed order

An item page's sections SHALL follow Teaches, Used for, then applicable Crafting, Mined from, Dropped by, World Loot, Cloth Loot, Sold by, Found in objects, Found in containers, and Quest rewards.

#### Scenario: Item sections follow the prescribed order
- **WHEN** An item has Teaches, Used for, Crafting, Dropped by, and Sold by sections.
- **THEN** Those sections appear in the order Teaches, Used for, Crafting, Dropped by, Sold by.

### Requirement: Recipe relations use equations

Recipe relations SHALL use equations.

#### Scenario: Recipe relations use equations
- **WHEN** An item page displays a recipe relation.
- **THEN** The relation is presented as an equation.

### Requirement: Full item relations remain accessible

Full item relations SHALL remain accessible.

#### Scenario: Full item relations remain accessible
- **WHEN** An item's acquisition answer summarizes several source relations.
- **THEN** The full relations remain accessible.

### Requirement: Price and stack size remain secondary without repetition

Price and stack size SHALL remain available as secondary facts without repetition.

#### Scenario: Price and stack size remain secondary without repetition
- **WHEN** An item has a known price and stack size.
- **THEN** Both remain available as secondary facts without being repeated.

### Requirement: Starting gear routes use published classes and anchors

A starting-gear route SHALL name only published classes and link their Starting gear sections.

#### Scenario: Starting gear routes use published classes and anchors
- **WHEN** An item is starting gear for a published class and an unpublished class.
- **THEN** The route names only the published class and links that class's Starting gear section.

### Requirement: Self-removal does not create grant or use sections

A self-removal action SHALL NOT appear as an item granted or a standalone When used section.

#### Scenario: Self-removal does not create grant or use sections
- **WHEN** An item's action removes the item itself.
- **THEN** The self-removal action appears neither as an item granted nor as a standalone When used section.
### Requirement: Property facts come from authored for-sale signs

For-sale signs SHALL supply the authored `RPGProperty` type, currency, purchase price, sell price, and income to the catalog.

#### Scenario: Two signs sell the same property
- **WHEN** two scanned for-sale signs refer to one property with matching facts
- **THEN** both markers link to the property page
- **AND** the page shows its prices, type, income, and sign locations without repeating prices

#### Scenario: For-sale signs disagree
- **WHEN** two signs of one property contain different authored prices
- **THEN** catalog normalization fails instead of choosing one price

#### Scenario: Property facts come from authored for-sale signs
- **WHEN** A for-sale sign contains an authored `RPGProperty` type, currency, purchase price, sell price, and income.
- **THEN** The catalog receives those authored facts from the sign.

### Requirement: Property signs agree on canonical facts

Signs of one property SHALL agree on the authored `RPGProperty` type, currency, purchase price, sell price, and income. A conflicting canonical value SHALL fail normalization.

#### Scenario: Property signs agree on canonical facts
- **WHEN** Two signs of one property have conflicting authored income values.
- **THEN** Normalization fails.

### Requirement: Sign markers link to property pages

Sign markers SHALL link to the property page.

#### Scenario: Sign markers link to property pages
- **WHEN** A property's for-sale sign marker is displayed.
- **THEN** The marker links to that property's page.

### Requirement: Property pages show available purchase and income facts

The property page SHALL show available picture, type, purchase price, income per payment, sell price, and where to buy it.

#### Scenario: Property pages show available purchase and income facts
- **WHEN** A property has a picture, type, purchase price, income per payment, sell price, and purchase location.
- **THEN** The property page shows all of those facts.

### Requirement: Property answers show prices once in a full-width layout

The property's three prices SHALL appear once, beside the picture in the page's answer, which uses the full width without a side column, followed by where to buy it.

#### Scenario: Property answers show prices once in a full-width layout
- **WHEN** A property page has a picture and all three prices.
- **THEN** The three prices appear once beside the picture in a full-width answer without a side column, followed by where to buy it.

### Requirement: Property locations link to published exact sign areas

The property page's location SHALL link to the sign area when that exact area has a published place page.

#### Scenario: Property locations link to published exact sign areas
- **WHEN** A property's sign area has a published place page for that exact area.
- **THEN** The property's location links to that sign area page.

### Requirement: Property income units require confirmed facts

The property page SHALL not name an income interval or income currency without confirmed facts.

#### Scenario: Property income units require confirmed facts
- **WHEN** Neither an income interval nor an income currency is confirmed.
- **THEN** The property page names neither an income interval nor an income currency.
### Requirement: Crafted items show their recipe on the item page

The product of a published recipe SHALL retain a Crafting section anchored at `crafting`.

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

#### Scenario: Experience at the reader's level
- **WHEN** a reader whose Tailoring level is 160 opens Runeweave Regalia, which needs level 150
- **THEN** its Crafting section shows 1,200 Tailoring experience per craft at that level and the half experience from level 170

#### Scenario: Reader below the required level
- **WHEN** a reader whose Tailoring level is 100 opens Runeweave Regalia
- **THEN** its Crafting section says that the reader can craft it from Tailoring level 150

#### Scenario: Crafted items show their recipe on the item page
- **WHEN** A reader opens the item page for the product of a published recipe.
- **THEN** The item page has a Crafting section anchored at `crafting`.

### Requirement: Crafting equations show materials and yield

The Crafting section SHALL present the recipe's materials and quantities as an equation with product yield only when greater than one. The product's own tooltip SHALL NOT be duplicated in the equation.

#### Scenario: Crafting equations show materials and yield
- **WHEN** A reader opens a published recipe's product page and the recipe yields two products.
- **THEN** The Crafting equation shows the materials, quantities, and yield of two without duplicating the product's tooltip.

### Requirement: Crafting shows recipe details and links

The Crafting section SHALL present the station, required skill level, base experience, known teaching items, and a guide-section link.

#### Scenario: Crafting shows recipe details and links
- **WHEN** A reader opens a published recipe's product page with a known teaching item.
- **THEN** Crafting shows the station, required skill level, base experience, known teaching item, and guide-section link.

### Requirement: Crafting shows computed experience breakpoints

The Crafting section SHALL present computed full/half/no-experience breakpoints. The computed full-experience band SHALL distinguish the game's first and second full-experience ranges.

#### Scenario: Crafting shows computed experience breakpoints
- **WHEN** A reader opens a recipe whose skill resolves and whose experience breakpoints can be computed.
- **THEN** Crafting shows full, half, and no-experience breakpoints and distinguishes the first and second full-experience ranges.

### Requirement: Crafting initializes the skill level control

The Crafting section SHALL show a level control for the recipe's skill that starts at the reader's remembered level.

#### Scenario: Crafting initializes the skill level control
- **WHEN** A reader with a remembered Tailoring level of 160 opens a Tailoring recipe's product page.
- **THEN** The Crafting level control is for Tailoring and starts at 160.

### Requirement: Crafting explains experience at the selected level

The Crafting section SHALL state the base experience per craft at the level shown by the recipe's skill level control and the level where it next changes, or the level from which the reader can craft the recipe.

#### Scenario: Crafting explains experience at the selected level
- **WHEN** A reader views a recipe at a craftable level where its base experience per craft is 1,200 and next changes at level 170.
- **THEN** Crafting states 1,200 base experience per craft at the displayed level and that it next changes at level 170.

### Requirement: Crafting identifies differing recipe names

The recipe name SHALL be visible in the Crafting section if it differs from its product.

#### Scenario: Crafting identifies differing recipe names
- **WHEN** A reader opens Bloodthrall Signet, made by the recipe Ring of Bleed Damage.
- **THEN** The Crafting section visibly names Ring of Bleed Damage.

### Requirement: Missing recipe teachers remain unknown

A missing teacher SHALL remain unknown in the Crafting section.

#### Scenario: Missing recipe teachers remain unknown
- **WHEN** A reader opens a recipe product whose teacher is missing.
- **THEN** Crafting leaves the teacher unknown rather than claiming no teacher exists.

### Requirement: Unresolved skills do not produce invented bands

An unresolved skill SHALL not lead to invented bands in the Crafting section.

#### Scenario: Unresolved skills do not produce invented bands
- **WHEN** A reader opens a recipe product whose skill cannot be resolved.
- **THEN** Crafting does not invent experience bands.

### Requirement: Base experience is not a modified final award

Base experience SHALL not be called the final award after modifiers in the Crafting section.

#### Scenario: Base experience is not a modified final award
- **WHEN** Crafting displays a recipe's base experience.
- **THEN** The displayed base experience is not described as the final award after modifiers.

### Requirement: Crafting excludes rule prose

No rule prose SHALL appear in the Crafting section.

#### Scenario: Crafting excludes rule prose
- **WHEN** A reader views a published recipe's Crafting section.
- **THEN** The section contains no rule prose.
### Requirement: Eligible item pages show corruption levels in the game tooltip

An item page SHALL offer a Corrupted version among the gear options directly below its single game tooltip in the side column only for equippable non-token templates present in the five timed dungeons' boss reward-bag loot tables with a captured cap and supported template-stat calculations.

#### Scenario: Reader selects a supported level
- **WHEN** a reader selects a supported level on an eligible weapon
- **THEN** the tooltip shows calculated damage endpoints, each rounded to nearest integer with midpoint-to-even ties as observed, and DPS derived from the rounded endpoints and attack speed
- **AND** the control shows `+N` while the tooltip shows `Corruption +N` after the damage block and before fixed stats

#### Scenario: Reader returns to the unmodified item
- **WHEN** a reader chooses the Normal version
- **THEN** the tooltip shows the original item values without a corruption bonus or corruption-level label, and no slider shows

#### Scenario: Item is not in a timed dungeon reward bag
- **WHEN** an equippable item does not occur in any of the five timed dungeons' boss reward-bag loot tables, even if another boss table drops it
- **THEN** its page retains the ordinary tooltip and has no corruption-level control

#### Scenario: Item power and fractional stats
- **WHEN** an eligible template has a fixed Stamina stat of 2 and Item power 15 and the reader selects level one under the captured 5% general and +5 flat Item power settings
- **THEN** its calculated tooltip shows `+2.1 Stamina` and `Item power 20` using game-matching integer display

#### Scenario: Gear has random properties or gems
- **WHEN** a gear template has random stats, gems, or other item-specific rolls
- **THEN** the tooltip keeps random and gem values unchanged, does not fabricate unobserved item-specific rolls, and the page explains that random stats and gems do not change

#### Scenario: Eligible item pages show corruption levels in the game tooltip
- **WHEN** A reader opens an equippable non-token template in a timed dungeon boss reward-bag loot table with a captured cap and supported template-stat calculations.
- **THEN** The page offers Corrupted among the gear options directly below its single game tooltip in the side column.

### Requirement: Gear options show one version at a time

The gear options SHALL show one version at a time: Normal, and Heroic or Corrupted where the item has them.

#### Scenario: Gear options show one version at a time
- **WHEN** A reader chooses Corrupted on an item that has Normal and Corrupted versions.
- **THEN** The gear options display the Corrupted version alone rather than showing both versions at once.

### Requirement: Corrupted selection exposes shared level controls

Choosing Corrupted SHALL show the shared corruption-level stepper and slider that range from one through the captured cap, start at the cap, and show `+N`. The stepper and slider SHALL update the tooltip itself.

#### Scenario: Corrupted selection exposes shared level controls
- **WHEN** A reader chooses Corrupted on an eligible item with a captured cap of 10 and then selects level 3.
- **THEN** The shared stepper and slider range from 1 to 10, initially show `+10`, and then show `+3` while updating the tooltip itself.

### Requirement: Corrupted selection shows reward bags

Choosing Corrupted SHALL show the reward bags that give the corrupted version together with the corruption-level controls.

#### Scenario: Corrupted selection shows reward bags
- **WHEN** A reader chooses Corrupted on an eligible item.
- **THEN** The reward bags that give the corrupted version appear together with the corruption-level controls.

### Requirement: Positive corruption calculates template stats

At positive corruption levels the tooltip SHALL show calculated template Item power and scaled fixed stats using the game's displayed number formatting.

#### Scenario: Positive corruption calculates template stats
- **WHEN** An eligible template has fixed Stamina 2 and Item power 15, and a reader selects level one under the captured 5% general and +5 flat Item power settings.
- **THEN** The tooltip shows `+2.1 Stamina` and `Item power 20` using the game's displayed number formatting.

### Requirement: Corrupted damage uses rounded endpoints

At positive corruption levels the tooltip SHALL show weapon damage endpoints rounded to nearest integer with midpoint-to-even ties and damage per second derived from those displayed endpoints.

#### Scenario: Corrupted damage uses rounded endpoints
- **WHEN** A reader selects a positive corruption level on an eligible weapon whose calculated damage endpoints include midpoint ties.
- **THEN** The tooltip rounds the endpoints to nearest integers with midpoint-to-even ties and derives damage per second from the displayed endpoints.

### Requirement: Corruption labels appear only at positive levels

The tooltip SHALL show `Corruption +N` after the damage block and before fixed stat lines only at positive corruption levels.

#### Scenario: Corruption labels appear only at positive levels
- **WHEN** A reader selects corruption level 2 on an eligible weapon.
- **THEN** The tooltip shows `Corruption +2` after the damage block and before the fixed stat lines.

### Requirement: Corruption preserves random rolls and gems

Random rolls and gems SHALL remain unchanged by corruption.

#### Scenario: Corruption preserves random rolls and gems
- **WHEN** A reader selects a positive corruption level on gear with random rolls and gems.
- **THEN** The random roll and gem values remain unchanged.

### Requirement: Corruption comparisons identify calculated templates

The corruption comparison SHALL identify calculated templates rather than saved rolled loot.

#### Scenario: Corruption comparisons identify calculated templates
- **WHEN** A reader views a corruption comparison for an eligible item.
- **THEN** The comparison identifies its values as calculated templates rather than saved rolled loot.

### Requirement: Corrupted origins remain distinct from ordinary sources

Eligible items SHALL expose `corruptedFrom` dungeon place and associated boss references, distinct from ordinary item sources.

#### Scenario: Corrupted origins remain distinct from ordinary sources
- **WHEN** A reader opens an eligible item that also has an ordinary item source.
- **THEN** The item exposes `corruptedFrom` dungeon place and associated boss references separately from its ordinary source.
### Requirement: Timed dungeon reward bags appear as an item source

Each published item that a timed dungeon reward bag can grant SHALL have a typed dungeon reward source with the linked place, associated timer bosses, and whether the item is guaranteed.

#### Scenario: Reader opens the Corruption Token page
- **WHEN** a reader opens the token's item page
- **THEN** its first acquisition route says every timed dungeon run ends with a reward bag containing one token and lists all five linked dungeons
- **AND** the route links to the timer step, while the hover card describes the guaranteed source

#### Scenario: Reader opens reward equipment
- **WHEN** a reader opens an eligible reward equipment page
- **THEN** its acquisition route lists the timed dungeons and the bosses whose reward tables contain that item as a chance, without claiming a guaranteed drop
- **AND** the corruption control keeps its linked reward-bag dungeon context

#### Scenario: Timed dungeon reward bags appear as an item source
- **WHEN** A timed dungeon reward bag can grant a published item.
- **THEN** The item has a typed dungeon reward source containing the linked place, associated timer bosses, and whether the item is guaranteed.

### Requirement: Timed dungeons guarantee their Corruption Token

Each of the five timed dungeons SHALL be a guaranteed source of its Corruption Token.

#### Scenario: Timed dungeons guarantee their Corruption Token
- **WHEN** A reader views the sources of the Corruption Token.
- **THEN** All five timed dungeons are identified as guaranteed sources of their Corruption Token.

### Requirement: Reward equipment chance sources are dungeon-limited

Equipment in a timer boss's reward table SHALL have a chance source limited to that boss's dungeon.

#### Scenario: Reward equipment chance sources are dungeon-limited
- **WHEN** Equipment appears in one timer boss's reward table.
- **THEN** Its reward-table source is a chance source limited to that boss's dungeon.

### Requirement: Acquisition routes link dungeon rewards and timer guidance

The item page SHALL show the dungeon reward route in "How to get it", link its places and applicable bosses, and link the guide's timer step.

#### Scenario: Acquisition routes link dungeon rewards and timer guidance
- **WHEN** A reader opens an item page for a timed dungeon reward-bag item.
- **THEN** "How to get it" shows the dungeon reward route with linked places, applicable bosses, and the guide's timer step.

### Requirement: Hover cards share dungeon reward source answers

The hover card SHALL share the dungeon reward source answer with the item page.

#### Scenario: Hover cards share dungeon reward source answers
- **WHEN** A reader views both the item page and hover card for a timed dungeon reward-bag item.
- **THEN** The hover card gives the same dungeon reward source answer as the page.
### Requirement: Weapon tooltips show the game's damage line

A weapon tooltip SHALL show the 0.16.3 game's damage line, with a rounded range, resolved damage school or physical label, and melee or ranged mode.

#### Scenario: A one-handed sword
- **WHEN** a sword deals 13 to 22 physical damage with the Slashing label in melee
- **THEN** its tooltip reads "13 - 22 Slashing Damage (Melee)" with its speed and damage per second below

#### Scenario: A fire staff
- **WHEN** a staff deals 42 to 70 Fire damage at range
- **THEN** its tooltip reads "42 - 70 Fire Damage (Ranged)"

#### Scenario: A bow
- **WHEN** a bow occupies the Ranged slot
- **THEN** its tooltip names the Ranged slot and shows its damage line as ranged

#### Scenario: Weapon tooltips show the game's damage line
- **WHEN** A sword deals 13 to 22 physical damage with the Slashing label in melee.
- **THEN** The tooltip shows "13 - 22 Slashing Damage (Melee)" as the 0.16.3 game's damage line.

### Requirement: Positive attack speed adds speed and damage per second

A positive attack speed SHALL appear beneath the damage line as `Speed 0.00`, followed by damage per second calculated from the rounded endpoints and displayed to one decimal.

#### Scenario: Positive attack speed adds speed and damage per second
- **WHEN** A weapon's rounded damage endpoints are 10 and 20 and its positive attack speed is 2.
- **THEN** Beneath the damage line the tooltip shows `Speed 2.00`, followed by damage per second of 7.5.

### Requirement: Explicit weapon damage metadata takes precedence

Explicit attack mode, damage type, and physical label SHALL take precedence over inferred values.

#### Scenario: Explicit weapon damage metadata takes precedence
- **WHEN** A weapon has explicit attack mode, damage type, and physical label values that conflict with inferred values.
- **THEN** The tooltip uses the explicit attack mode, damage type, and physical label.

### Requirement: Auto attack mode uses weapon slot and type

Auto mode SHALL derive the mode from the weapon slot and type.

#### Scenario: Auto attack mode uses weapon slot and type
- **WHEN** A bow in the Ranged slot uses Auto mode.
- **THEN** The tooltip derives ranged mode from the bow's slot and type.

### Requirement: Untyped damage follows game school rules

Damage without an explicit type SHALL use the game's physical or elemental school rules.

#### Scenario: Untyped damage follows game school rules
- **WHEN** A weapon has damage without an explicit type.
- **THEN** Its damage school is resolved using the game's physical or elemental school rules.

### Requirement: Unresolved damage modes use a plain line

An unresolved or invalid mode SHALL use the plain `{minimum} - {maximum} Damage` line.

#### Scenario: Unresolved damage modes use a plain line
- **WHEN** A weapon with rounded damage endpoints 10 and 20 has an invalid mode.
- **THEN** Its damage line reads "10 - 20 Damage".

### Requirement: Nonweapons and nonpositive damage omit the damage block

A nonweapon or a weapon without positive maximum damage SHALL show no damage block.

#### Scenario: Nonweapons and nonpositive damage omit the damage block
- **WHEN** An item is a weapon with maximum damage of zero.
- **THEN** Its tooltip shows no damage block.
### Requirement: Item pages show the gear that adventurers carry

An item page SHALL describe how adventurers get the item in an Adventurers section.

#### Scenario: A tank kit piece
- **WHEN** the kit upgrade of Agra Emberhide holds an item that no creature, vendor, quest, recipe, container, or class start gives
- **THEN** How to get it says only adventurers can get the item
- **AND** the Adventurers section links Agra Emberhide as the adventurer whose kit holds it

#### Scenario: An item that players can also get
- **WHEN** an item is on the reward gear list from level 17 and a vendor sells it
- **THEN** How to get it shows the vendor route
- **AND** the Adventurers section says that the item is on the reward gear list for adventurers of level 17 or higher

#### Scenario: Item pages show the gear that adventurers carry
- **WHEN** A reader opens an item page for gear that adventurers get.
- **THEN** An Adventurers section describes how adventurers get the item.

### Requirement: Reward gear describes eligibility and upgrade chance

An item on the reward gear list SHALL say, with the published chance that each finished job tries an upgrade, that the item is on that list for adventurers of its level or higher, or for every adventurer when its level is 1.

#### Scenario: Reward gear describes eligibility and upgrade chance
- **WHEN** A reader opens an item on the reward gear list at level 1.
- **THEN** The page says the item is on the reward gear list for every adventurer and gives the published chance that each finished job tries an upgrade.

### Requirement: Gear kit items identify their adventurers

An item in a gear kit SHALL name and link the adventurer whose kit holds it.

#### Scenario: Gear kit items identify their adventurers
- **WHEN** A reader opens an item held in Agra Emberhide's gear kit.
- **THEN** The page names and links Agra Emberhide as the adventurer whose kit holds the item.

### Requirement: Adventurers sections link gear upgrade guidance

The Adventurers section SHALL link the gear upgrades section of the Adventurers guide.

#### Scenario: Adventurers sections link gear upgrade guidance
- **WHEN** A reader views an item's Adventurers section.
- **THEN** The section links the gear upgrades section of the Adventurers guide.

### Requirement: Adventurer-only acquisition replaces unknown-source messaging

When the item has no player source, How to get it SHALL say that only adventurers can get the item and SHALL link the Adventurers section, instead of saying that no way to get the item is known.

#### Scenario: Adventurer-only acquisition replaces unknown-source messaging
- **WHEN** A reader opens an adventurer gear item with no player source.
- **THEN** How to get it says only adventurers can get the item and links the Adventurers section rather than saying no way to get the item is known.
### Requirement: Item pages explain rewards from use actions

An item page SHALL show a When used section when captured item actions spawn prefab chests or open loot tables.

#### Scenario: A soaked bag spawns a chest
- **WHEN** an item has a TriggerVisualEffect action whose effect template contains a chest prefab
- **THEN** its When used section lists every chest row including currency rows and the maximum-drop cap
- **AND** its own Item action is described by the captured AlterAction, not inferred from its item ID

#### Scenario: Capped chest contents
- **WHEN** a chest limits the number of items it gives
- **THEN** its page explains that each row rolls when the chest opens but successful rolls beyond the item limit are not received

#### Scenario: Item pages explain rewards from use actions
- **WHEN** Captured item actions open a loot table.
- **THEN** The item page shows a When used section.

### Requirement: Chest contents relation table

Chest contents SHALL appear in a relation table sorted by row chance, with item or currency, inclusive quantity range, and chance per row clear on the page.

#### Scenario: Chest contents relation table
- **WHEN** A chest contains item and currency rows with different chances and quantity ranges.
- **THEN** The relation table is sorted by row chance and clearly shows each row's item or currency, inclusive quantity range, and chance.

### Requirement: Independent chest row rolls

Each chest row's chance SHALL be identified as rolled independently per open.

#### Scenario: Independent chest row rolls
- **WHEN** An item page lists chest rows with chances.
- **THEN** Each row's chance is identified as rolled independently per open.

### Requirement: Chest maximum-drop cap explanation

A positive maximum-drop cap SHALL explain that some successful rows can be lost when the limit is reached.

#### Scenario: Chest maximum-drop cap explanation
- **WHEN** A chest has a positive maximum-drop cap.
- **THEN** The page explains that some successful rows can be lost when the limit is reached.

### Requirement: Published chest action data sentences

Only the published nonzero action chance when below 100% and positive maximum-drop cap SHALL appear as short data sentences.

#### Scenario: Published chest action data sentences
- **WHEN** An action has a published chance of 50% and a positive maximum-drop cap.
- **THEN** Short data sentences show only the published action chance and positive maximum-drop cap.

### Requirement: Item action gain and consumption wording

The page SHALL distinguish an Item action that gains an item from one that consumes it in plain sentences.

#### Scenario: Item action gain and consumption wording
- **WHEN** An item has an Item action that consumes it.
- **THEN** A plain sentence describes consumption rather than gaining the item.

### Requirement: Chest rule guide link

A placed When used rule SHALL link to the section of the Loot guide on items that open a chest, without repeating rule prose on the item page.

#### Scenario: Chest rule guide link
- **WHEN** A When used rule is placed on a chest-opening item's page.
- **THEN** The rule links to the Loot guide section on items that open a chest without repeating its rule prose.

### Requirement: Internal reward names remain unpublished

No internal effect, prefab, chest, or loot table name SHALL be published.

#### Scenario: Internal reward names remain unpublished
- **WHEN** Captured reward actions contain internal effect, prefab, chest, and loot table names.
- **THEN** None of those internal names is published.
### Requirement: Supply packs show eligible rewards and roll rules

For each class and level band gated LootTable action of Adventurer's Supply Pack, When used SHALL show that band's authored entries in a relation table.

#### Scenario: A supply pack belongs to different classes
- **WHEN** class and level requirements select distinct tables
- **THEN** the page lists each class/level band with only the entries of its selected table
- **AND** it does not suggest that the pack grants every table at once

#### Scenario: A band names an unplayable class
- **WHEN** a band's class condition names a class that no race offers, alone or beside a playable class
- **THEN** the band names only the playable class, and a band with no playable class is not shown

#### Scenario: Reader picks a class and a level
- **WHEN** a reader selects the Wizard tab and the levels 6–11 tab in When used of Adventurer's Supply Pack
- **THEN** the section shows only the entries of the Wizard table for levels 6–11
- **AND** after the reader selects the Druid tab, the section shows the Druid table for levels 6–11

#### Scenario: World loot of a band
- **WHEN** a reader selects the Wizard tab and the levels 1–5 tab of Adventurer's Supply Pack
- **THEN** the band lists the world loot items that a level 1 to 5 Wizard can get, each with its character levels
- **AND** it lists no weapon that a Wizard cannot use and no armor of another armor type than the band names

#### Scenario: Item without a level requirement
- **WHEN** a world loot item has no level requirement and its world loot table has no upper level
- **THEN** the item shows as available from the band's lowest level, without an upper level

#### Scenario: Supply packs show eligible rewards and roll rules
- **WHEN** Adventurer's Supply Pack has a class and level band gated LootTable action.
- **THEN** When used shows that band's authored entries in a relation table.

### Requirement: Supply pack class tabs

A tab for each class SHALL select the bands of that class.

#### Scenario: Supply pack class tabs
- **WHEN** A reader selects a class tab for Adventurer's Supply Pack.
- **THEN** The tab selects the bands of that class.

### Requirement: Supply pack level band tabs

A tab for each level band of that class SHALL select one band.

#### Scenario: Supply pack level band tabs
- **WHEN** A reader selects a level band tab within a class.
- **THEN** The tab selects that one band.

### Requirement: Multi-class band placement

A band that names several classes SHALL appear under each of them.

#### Scenario: Multi-class band placement
- **WHEN** A band names two classes offered by races.
- **THEN** The band appears under both classes.

### Requirement: Preserve selected level band across classes

The selected level band SHALL stay selected when the reader changes the class and the new class has the same band.

#### Scenario: Preserve selected level band across classes
- **WHEN** A reader changes class while the new class has the selected level band.
- **THEN** The same level band stays selected.

### Requirement: Playable class names in bands

A band SHALL name only the classes that a race offers.

#### Scenario: Playable class names in bands
- **WHEN** A band condition names both a class offered by a race and a class offered by no race.
- **THEN** The band names only the class that a race offers.

### Requirement: Omit unplayable supply pack bands

A band whose class condition names no class that a race offers SHALL be left out, because no player can open it.

#### Scenario: Omit unplayable supply pack bands
- **WHEN** A band's class condition names no class offered by a race.
- **THEN** The band is left out because no player can open it.

### Requirement: Supply pack roll data sentence

A short data sentence SHALL show the published minimum picks, the bonus chance, the maximum when it lowers the total, and the world share when present, with the world share described as the chance that an item is world loot for the character's class and level.

#### Scenario: Supply pack roll data sentence
- **WHEN** A band publishes minimum picks, bonus chance, a maximum that lowers the total, and a world share.
- **THEN** A short data sentence shows those values and describes world share as the chance that an item is world loot for the character's class and level.

### Requirement: Supply pack filter visibility

The band's published armor and stat filters SHALL remain visible.

#### Scenario: Supply pack filter visibility
- **WHEN** A selected band has published armor and stat filters.
- **THEN** The band's armor and stat filters remain visible.

### Requirement: Eligible world loot by class and band

For each band and class, When used SHALL list the world loot items that the band can give that class, each with the character levels at which it can appear, as the game's world loot rules decide them from the world loot tables, the item's level requirement, the class's weapon types, and the band's armor and stat filters.

#### Scenario: Eligible world loot by class and band
- **WHEN** A band and class are selected with world loot candidates governed by world loot tables, item level requirements, class weapon types, and band armor and stat filters.
- **THEN** When used lists the world loot items eligible under those game rules, each with the character levels at which it can appear.

### Requirement: No world loot item chance claims

The world loot item list SHALL NOT claim a chance for a world loot item.

#### Scenario: No world loot item chance claims
- **WHEN** A band's world loot item list is displayed.
- **THEN** The list claims no chance for any world loot item.

### Requirement: Supply pack guide rule link

A placed When used rule SHALL link to the supply pack section of the Loot guide, which states the pack roll, world eligibility, and lifecycle rules, instead of repeating those mechanics as item-page prose.

#### Scenario: Supply pack guide rule link
- **WHEN** A When used rule is placed on the supply pack page.
- **THEN** The rule links to the Loot guide's supply pack section stating pack roll, world eligibility, and lifecycle rules, without repeating those mechanics as item-page prose.
### Requirement: Reviewed content-free items are not published

A reviewed item whose only description is flavor, whose action has no identified target beyond self-removal, and which has no source, use, or inbound reference SHALL have no page. Each reviewed exclusion SHALL fail publication when the item gains a gameplay description, an identified action or fact, an inbound relation or fact reference, or a bound loot-table source. A self-named loot table with no owner or binding is not a source. A reference to an excluded item SHALL degrade to plain text.

#### Scenario: Item later gains a source
- **WHEN** a quest gives a reviewed item previously excluded as content-free
- **THEN** publication fails its exclusion evidence check until its page is restored

#### Scenario: A useful unsourced item
- **WHEN** Quest Renown has no source but its description states a quest-renown increase
- **THEN** its page remains published and leads with that use

### Requirement: Enchanting and equipment controls share the side-card system

An enchanting item's effect, applicable gear, success chance, time, and additional costs SHALL be grouped in one side card next to the game tooltip.

#### Scenario: Enchanting kit
- **WHEN** a reader opens Bolstering Kit I
- **THEN** its crafting answer names the skill, station, materials, and base experience, while the adjacent card explains its armor effect and application

#### Scenario: Heroic armor
- **WHEN** an armor item can drop Heroic and be enchanted
- **THEN** its Heroic toggle and enchanting option appear together as gear options beside its tooltip

#### Scenario: A long enchantment stat repeats the description
- **WHEN** Enchant Fiery Weapon describes its on-hit effect and the corresponding stat has a long name
- **THEN** the effect remains visible with the linked stat available under Stat details

#### Scenario: Enchanting and equipment controls share the side-card system
- **WHEN** An enchanting item has an effect, applicable gear, success chance, time, and additional costs.
- **THEN** Those details are grouped in one side card next to the game tooltip.

### Requirement: Long enchantment stat disclosure

When a description already explains the effect, exceptionally long stat names SHALL remain linked behind stat-details disclosure rather than dominating the card.

#### Scenario: Long enchantment stat disclosure
- **WHEN** An enchanting item's description already explains an effect with an exceptionally long stat name.
- **THEN** The stat name remains linked behind stat-details disclosure rather than dominating the card.

### Requirement: Shared equipment options card

Heroic, corruption, and enchantment options of equipment SHALL occupy a shared card rather than loose controls below the tooltip.

#### Scenario: Shared equipment options card
- **WHEN** Equipment offers Heroic, corruption, and enchantment options.
- **THEN** All three options occupy a shared card rather than loose controls below the tooltip.

### Requirement: Prevent enchantment tooltip self-links

The game tooltip SHALL not link an enchantment item back to itself.

#### Scenario: Prevent enchantment tooltip self-links
- **WHEN** The game tooltip is displayed for an enchantment item.
- **THEN** The tooltip does not link the enchantment item back to itself.
### Requirement: Item pages identify effects from use and on-hit procs

Item pages SHALL expose the effects applied by direct item actions, by abilities activated from the item, and by fixed or enchanted on-hit stats using the same application records as effect pages.

#### Scenario: Consumable applies a timed effect
- **WHEN** a potion's item action applies a published effect for ten minutes
- **THEN** the potion's When used section links the effect and shows its ten-minute duration

#### Scenario: Equipment stat applies an effect on hit
- **WHEN** a weapon's fixed stat has an effect proc with a published chance
- **THEN** the item links the effect under On-hit effects with that chance and the effect duration when known

#### Scenario: Item-use action at zero and one hundred
- **WHEN** direct item-use actions have chance settings of zero and 100
- **THEN** both actions are shown without a percentage because each applies on every eligible use

#### Scenario: Item pages identify effects from use and on-hit procs
- **WHEN** An item applies effects through direct actions, activated abilities, and fixed or enchanted on-hit stats.
- **THEN** The item page exposes those effects using the same application records as effect pages.

### Requirement: Published and unpublished effect row rendering

Each effect row SHALL link to a published effect, or render an unpublished effect as plain text.

#### Scenario: Published and unpublished effect row rendering
- **WHEN** An item page includes rows for a published effect and an unpublished effect.
- **THEN** The published effect is linked and the unpublished effect is plain text.

### Requirement: Effect row duration

Each effect row SHALL show its supported duration.

#### Scenario: Effect row duration
- **WHEN** An effect row has a supported duration.
- **THEN** The row shows that duration.

### Requirement: Direct-action chance roll wording

A positive direct-action chance below certainty SHALL be described as rolled once per use.

#### Scenario: Direct-action chance roll wording
- **WHEN** A direct item action has a positive chance below certainty.
- **THEN** The chance is described as rolled once per use.

### Requirement: Zero action-chance sentinel display

A zero action-chance sentinel SHALL not display as a zero percent chance.

#### Scenario: Zero action-chance sentinel display
- **WHEN** A direct item action uses a zero action-chance sentinel.
- **THEN** The page does not display it as a zero percent chance.

### Requirement: Activated ability application chance

Effects from activated abilities SHALL identify the chance per eligible application attempt.

#### Scenario: Activated ability application chance
- **WHEN** An item activates an ability that applies an effect.
- **THEN** The effect identifies its chance per eligible application attempt.

### Requirement: On-hit trigger roll distinction

On-hit effect chances SHALL identify the stat's trigger as a separate earlier roll.

#### Scenario: On-hit trigger roll distinction
- **WHEN** An on-hit stat can trigger an effect with a chance.
- **THEN** The effect chance identifies the stat's trigger as a separate earlier roll.

### Requirement: Direct-use effect placement

Direct-use effects SHALL appear under When used.

#### Scenario: Direct-use effect placement
- **WHEN** An item has a direct-use effect.
- **THEN** The effect appears under When used.

### Requirement: On-hit effect trigger identification

On-hit effects SHALL identify their trigger separately.

#### Scenario: On-hit effect trigger identification
- **WHEN** An item has an on-hit effect.
- **THEN** The on-hit effect identifies its trigger separately.
### Requirement: Random item stat chances identify their own roll

An item tooltip SHALL explain that random stats are rolled independently in order when the item is generated, and a positive item stat limit can prevent later entries from being reached. Each shown percentage SHALL refer to the entry's own selection roll when reached, not a guaranteed final inclusion chance. When selected, a stat's value SHALL be drawn within its displayed range.

#### Scenario: Limited random stats
- **WHEN** an item has multiple random stat entries and a positive maximum number of random stats
- **THEN** the tooltip shows the maximum and explains each entry's percentage applies when its selection roll is reached, with a value from its displayed range
