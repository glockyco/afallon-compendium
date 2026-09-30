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

An item page SHALL show the item name in its title block, with a map action when the map can show the resources, containers, or objects that give the item. Its hero SHALL show the in-game tooltip with linked references beside the description, a How to get it list, a Used for list, the authored buy price, and the stack size. Each How to get it line SHALL name a source section, up to two counterparts in the default order of that section, and the number of other counterparts, and SHALL link to that section. A Sold by line SHALL also name the lowest price. World loot SHALL have its own line with the creature levels. A Crafted line SHALL name the skill and the required level and SHALL link to the Crafting section. Each Used for line SHALL name a use section with its row count and SHALL link to that section. Full-width sections SHALL follow in this order: Teaches, Dropped by, Sold by, Found in containers, Gathered from, Collected from, From quests, Crafting, Used in recipes, Needed for quests. Each row of Used in recipes SHALL link to the Crafting section of the product. A Starting gear of line SHALL name the published classes that start with the item and SHALL link the Starting gear section of the first class page. A class without a page SHALL NOT appear as a source. The hover tooltip of an item link SHALL show a How to get it summary with only the source kinds that have rows. A missing source SHALL be stated as unknown, not invented.

#### Scenario: Item has several sources
- **WHEN** an item is dropped by seven creatures and sold by two vendors
- **THEN** its hero shows a Dropped by line with two creatures and "5 more"
- **AND** its hero shows a Sold by line with both vendors and the lowest price
- **AND** each line links to its section below the hero

#### Scenario: Hover tooltip of an item link
- **WHEN** a reader points at a link to an item that creatures drop and vendors sell
- **THEN** the tooltip shows the in-game tooltip and a How to get it summary with a drop line and a vendor line

#### Scenario: No source is published
- **WHEN** no source relation is published for an item
- **THEN** its hero says that no way to get the item is known for this build

#### Scenario: Starting gear of three classes
- **WHEN** Wizard, Necromancer, and Druid start with Novice Staff
- **THEN** its hero shows a Starting gear of line with two classes and "1 more"
- **AND** each class name links the Starting gear section of its class page

#### Scenario: Starting gear of a class without a page
- **WHEN** only Berserker, which no race offers, starts with Rune Shield
- **THEN** the page of Rune Shield shows no Starting gear of line

#### Scenario: Crafted item
- **WHEN** a reader opens Runeweave Regalia, which Tailoring level 150 crafts
- **THEN** its hero shows a Crafted line that names Tailoring and level 150
- **AND** the line links to the Crafting section of the page

#### Scenario: Material of a recipe
- **WHEN** a reader opens Bolt of Runeweave, which the recipe Runeweave Regalia uses
- **THEN** its Used in recipes row links to the Crafting section of Runeweave Regalia

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

The page of an item that a published recipe makes SHALL show a Crafting section with the anchor `crafting`. The section SHALL show the station, the skill, the required skill level, each material with its quantity, the product quantity when it is more than one, the base experience per craft, and the skill levels where the recipe gives full, half, or no base experience. The full band SHALL distinguish the game's first and second full-experience ranges. The section SHALL name each published item that teaches the recipe. When the recipe name differs from the item name, the section SHALL name the recipe. The section SHALL show the rules that the rules record places on it. It SHALL NOT call a recipe best or claim that the base value is the final award after modifiers. The item tooltip SHALL appear once on the page, in the hero.

#### Scenario: Crafted item with a teaching item
- **WHEN** a reader opens Runeweave Regalia, which the Tailoring recipe Runeweave Regalia makes
- **THEN** its Crafting section shows the Tailoring station, the required level 150, 5 Bolt of Runeweave, 1 Heart of Corruption, and the experience bands
- **AND** the section links Recipe: Runeweave Regalia as the item that teaches the recipe

#### Scenario: Recipe name differs from the product
- **WHEN** a reader opens Bloodthrall Signet, which the Smithing recipe Ring of Bleed Damage makes
- **THEN** its Crafting section names the recipe Ring of Bleed Damage
- **AND** the section names no teaching item and makes no claim that nothing teaches the recipe

#### Scenario: Recipe skill does not resolve
- **WHEN** the skill reference of a recipe cannot be resolved
- **THEN** the Crafting section still shows the materials
- **AND** it does not invent a skill level or an experience band
