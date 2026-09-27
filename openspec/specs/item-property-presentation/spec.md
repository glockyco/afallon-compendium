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

An item page SHALL show the in-game tooltip card with linked references, with stack size, buy price, and a map link below it. The source relation tables SHALL follow beside the tooltip. A tooltip preview SHALL show a How to get it summary with only the source kinds that have rows. A missing source SHALL be stated as unknown, not invented.

#### Scenario: Item has several sources
- **WHEN** an item is dropped by a creature and sold by a vendor
- **THEN** its page shows the Dropped by and Sold by tables beside the tooltip

#### Scenario: No source is published
- **WHEN** no source relation is published for an item
- **THEN** its acquisition summary says that no source is known for this build

### Requirement: Property facts come from authored for-sale signs

For-sale signs SHALL supply the authored `RPGProperty` type, currency, purchase price, sell price, and income to the catalog. Signs of one property SHALL agree on these fields. A conflicting canonical value SHALL fail normalization. Sign markers SHALL link to the property page. The property page SHALL show available picture, type, purchase price, income per payment, sell price, and where to buy it. It SHALL not name an income interval or income currency without confirmed facts.

#### Scenario: Two signs sell the same property
- **WHEN** two scanned for-sale signs refer to one property with matching facts
- **THEN** both markers link to the property page
- **AND** the page shows its prices, type, income, and sign locations

#### Scenario: For-sale signs disagree
- **WHEN** two signs of one property contain different authored prices
- **THEN** catalog normalization fails instead of choosing one price
