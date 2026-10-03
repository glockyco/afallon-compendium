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

An item page SHALL show its name and applicable map action in the title, and its in-game tooltip once in the side column (after its answer on narrow screens). Its How to get it answer SHALL show one linked route per available source kind—craft, mine, loot, search, buy, quest reward, starting gear, another item, a world object that spawns a chest, a dungeon reward, a Dungeon Finder run, a quest pickup, or a cloth drop—ordered by guaranteed yield then known spot count, without treating a chance as guaranteed. Each route SHALL identify a useful example, relevant quantity or chance, and its full anchored source section. An item with no known source but a useful description SHALL lead with what it does and state the unknown source quietly rather than creating two empty cards. A crafted route SHALL show the materials, known teacher, skill and level, and base experience before modifiers, with level-by-level experience and its mechanics link behind disclosure. Its sections SHALL follow Teaches, Used for, then applicable Crafting, Mined from, Dropped by, Sold by, Found in objects, Found in containers, and Quest rewards. Recipe relations SHALL use equations; full relations SHALL remain accessible. Price and stack size SHALL remain available as secondary facts without repetition. A starting-gear route SHALL name only published classes and link their Starting gear sections. A self-removal action SHALL NOT appear as an item granted or a standalone When used section.

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

### Requirement: Property facts come from authored for-sale signs

For-sale signs SHALL supply the authored `RPGProperty` type, currency, purchase price, sell price, and income to the catalog. Signs of one property SHALL agree on these fields. A conflicting canonical value SHALL fail normalization. Sign markers SHALL link to the property page. The property page SHALL show available picture, type, purchase price, income per payment, sell price, and where to buy it. Its three prices SHALL appear once, beside the picture in the page's answer, which uses the full width without a side column, followed by where to buy it; its location SHALL link to the sign area when that exact area has a published place page. It SHALL not name an income interval or income currency without confirmed facts.

#### Scenario: Two signs sell the same property
- **WHEN** two scanned for-sale signs refer to one property with matching facts
- **THEN** both markers link to the property page
- **AND** the page shows its prices, type, income, and sign locations without repeating prices

#### Scenario: For-sale signs disagree
- **WHEN** two signs of one property contain different authored prices
- **THEN** catalog normalization fails instead of choosing one price

### Requirement: Crafted items show their recipe on the item page

The product of a published recipe SHALL retain a Crafting section anchored at `crafting`. It SHALL present its materials and quantities as an equation with product yield only when greater than one, the station, required skill level, base experience, computed full/half/no-experience breakpoints, known teaching items, and a guide-section link. The computed full-experience band SHALL distinguish the game's first and second full-experience ranges. The section SHALL show a level control for the recipe's skill that starts at the reader's remembered level, and SHALL state the base experience per craft at that level and the level where it next changes, or the level from which the reader can craft the recipe. The product's own tooltip SHALL NOT be duplicated in the equation. The recipe name SHALL be visible if it differs from its product. A missing teacher SHALL remain unknown, and an unresolved skill SHALL not lead to invented bands. Base experience SHALL not be called the final award after modifiers. No rule prose SHALL appear in this section.

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

### Requirement: Eligible item pages show corruption levels in the game tooltip

An item page SHALL offer a Corrupted version among the gear options directly below its single game tooltip in the side column only for equippable non-token templates present in the five timed dungeons' boss reward-bag loot tables with a captured cap and supported template-stat calculations. The gear options SHALL show one version at a time: Normal, and Heroic or Corrupted where the item has them. Choosing Corrupted SHALL show a corruption-level slider that ranges from one through the captured cap, starts at the cap, shows `+N`, and updates the tooltip itself, together with the reward bags that give the corrupted version. At positive levels the tooltip SHALL show calculated template Item power, weapon damage endpoints rounded to nearest integer with midpoint-to-even ties, damage per second derived from those displayed endpoints, and scaled fixed stats using the game's displayed number formatting. It SHALL show `Corruption +N` after the damage block and before fixed stat lines only at positive levels. Random rolls and gems SHALL remain unchanged; the comparison SHALL identify calculated templates rather than saved rolled loot. Eligible items SHALL expose `corruptedFrom` dungeon place and associated boss references, distinct from ordinary item sources.

#### Scenario: Reader selects a supported level
- **WHEN** a reader selects a supported level on an eligible weapon
- **THEN** the tooltip shows calculated damage endpoints, each rounded to nearest integer with midpoint-to-even ties as observed, and DPS derived from the rounded endpoints and attack speed
- **AND** the slider shows `+N` while the tooltip shows `Corruption +N` after the damage block and before fixed stats

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

### Requirement: Weapon tooltips show the game's damage line

A weapon tooltip SHALL show the 0.16.3 game's damage line, with a rounded range, resolved damage school or physical label, and melee or ranged mode. A positive attack speed SHALL appear beneath it as `Speed 0.00`, followed by damage per second calculated from the rounded endpoints and displayed to one decimal. Explicit attack mode, damage type, and physical label SHALL take precedence over inferred values. Auto mode SHALL derive the mode from the weapon slot and type, and damage without an explicit type SHALL use the game's physical or elemental school rules. An unresolved or invalid mode SHALL use the plain `{minimum} - {maximum} Damage` line. A nonweapon or a weapon without positive maximum damage SHALL show no damage block.

#### Scenario: A one-handed sword
- **WHEN** a sword deals 13 to 22 physical damage with the Slashing label in melee
- **THEN** its tooltip reads "13 - 22 Slashing Damage (Melee)" with its speed and damage per second below

#### Scenario: A fire staff
- **WHEN** a staff deals 42 to 70 Fire damage at range
- **THEN** its tooltip reads "42 - 70 Fire Damage (Ranged)"

#### Scenario: A bow
- **WHEN** a bow occupies the Ranged slot
- **THEN** its tooltip names the Ranged slot and shows its damage line as ranged

### Requirement: Item pages show the gear that adventurers carry

An item page SHALL describe how adventurers get the item in an Adventurers section. An item on the reward gear list SHALL say, with the published chance that each finished job tries an upgrade, that the item is on that list for adventurers of its level or higher, or for every adventurer when its level is 1. An item in a gear kit SHALL name and link the adventurer whose kit holds it. The section SHALL link the gear upgrades section of the Adventurers guide. When the item has no player source, How to get it SHALL say that only adventurers can get the item and SHALL link the Adventurers section, instead of saying that no way to get the item is known.

#### Scenario: A tank kit piece
- **WHEN** the kit upgrade of Agra Emberhide holds an item that no creature, vendor, quest, recipe, container, or class start gives
- **THEN** How to get it says only adventurers can get the item
- **AND** the Adventurers section links Agra Emberhide as the adventurer whose kit holds it

#### Scenario: An item that players can also get
- **WHEN** an item is on the reward gear list from level 17 and a vendor sells it
- **THEN** How to get it shows the vendor route
- **AND** the Adventurers section says that the item is on the reward gear list for adventurers of level 17 or higher

### Requirement: Item pages explain rewards from use actions

An item page SHALL show a When used section when captured item actions spawn prefab chests or open loot tables. Chest contents SHALL appear in a relation table sorted by row chance, with item or currency, inclusive quantity range, and chance per row clear on the page. Only the published action chance when below 100% and positive maximum-drop cap SHALL appear as short data sentences. The page SHALL distinguish an Item action that gains an item from one that consumes it in plain sentences. A placed When used rule SHALL link to the section of the Loot guide on items that open a chest, without repeating rule prose on the item page. No internal effect, prefab, chest, or loot table name SHALL be published.

#### Scenario: A soaked bag spawns a chest
- **WHEN** an item has a TriggerVisualEffect action whose effect template contains a chest prefab
- **THEN** its When used section lists every chest row including currency rows and the maximum-drop cap
- **AND** its own Item action is described by the captured AlterAction, not inferred from its item ID

### Requirement: Supply packs show eligible rewards and roll rules

For each class and level band gated LootTable action of Adventurer's Supply Pack, When used SHALL show that band's authored entries in a relation table. A tab for each class SHALL select the bands of that class, and a tab for each level band of that class SHALL select one band. A band that names several classes SHALL appear under each of them. The selected level band SHALL stay selected when the reader changes the class and the new class has the same band. A band SHALL name only the classes that a race offers, and a band whose class condition names no such class SHALL be left out, because no player can open it. A short data sentence SHALL show the published minimum picks, the bonus chance, the maximum when it lowers the total, and the world share when present, with the world share described as the chance that an item is world loot for the character's class and level. The band's published armor and stat filters SHALL remain visible. For each band and class, When used SHALL list the world loot items that the band can give that class, each with the character levels at which it can appear, as the game's world loot rules decide them from the world loot tables, the item's level requirement, the class's weapon types, and the band's armor and stat filters. The list SHALL NOT claim a chance for a world loot item. A placed When used rule SHALL link to the supply pack section of the Loot guide, which states the pack roll, world eligibility, and lifecycle rules, instead of repeating those mechanics as item-page prose.

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

### Requirement: Reviewed content-free items are not published

A reviewed item whose only description is flavor, whose action has no identified target beyond self-removal, and which has no source, use, or inbound reference SHALL have no page. Each reviewed exclusion SHALL fail publication when the item gains a gameplay description, an identified action or fact, an inbound relation or fact reference, or a bound loot-table source. A self-named loot table with no owner or binding is not a source. A reference to an excluded item SHALL degrade to plain text.

#### Scenario: Item later gains a source
- **WHEN** a quest gives a reviewed item previously excluded as content-free
- **THEN** publication fails its exclusion evidence check until its page is restored

#### Scenario: A useful unsourced item
- **WHEN** Quest Renown has no source but its description states a quest-renown increase
- **THEN** its page remains published and leads with that use

### Requirement: Enchanting and equipment controls share the side-card system

An enchanting item's effect, applicable gear, success chance, time, and additional costs SHALL be grouped in one side card next to the game tooltip. When a description already explains the effect, exceptionally long stat names SHALL remain linked behind stat-details disclosure rather than dominating the card. Heroic, corruption, and enchantment options of equipment SHALL occupy a shared card rather than loose controls below the tooltip. The game tooltip SHALL not link an enchantment item back to itself.

#### Scenario: Enchanting kit
- **WHEN** a reader opens Bolstering Kit I
- **THEN** its crafting answer names the skill, station, materials, and base experience, while the adjacent card explains its armor effect and application

#### Scenario: Heroic armor
- **WHEN** an armor item can drop Heroic and be enchanted
- **THEN** its Heroic toggle and enchanting option appear together as gear options beside its tooltip

#### Scenario: A long enchantment stat repeats the description
- **WHEN** Enchant Fiery Weapon describes its on-hit effect and the corresponding stat has a long name
- **THEN** the effect remains visible with the linked stat available under Stat details

### Requirement: Item pages identify effects from use and on-hit procs

Item pages SHALL expose the effects applied by direct item actions, by abilities activated from the item, and by fixed or enchanted on-hit stats using the same application records as effect pages. Each row SHALL link to a published effect, or render an unpublished effect as plain text, and show its chance when below certainty and its supported duration. Direct-use effects SHALL appear under When used; on-hit effects SHALL identify their trigger separately.

#### Scenario: Consumable applies a timed effect
- **WHEN** a potion's item action applies a published effect for ten minutes
- **THEN** the potion's When used section links the effect and shows its ten-minute duration

#### Scenario: Equipment stat applies an effect on hit
- **WHEN** a weapon's fixed stat has an effect proc with a published chance
- **THEN** the item links the effect under On-hit effects with that chance and the effect duration when known
