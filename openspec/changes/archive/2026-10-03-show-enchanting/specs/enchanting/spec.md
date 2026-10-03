## Purpose

Players can compare enchanting items and understand their requirements, effects, timing, costs, success, and known acquisition sources without guessing from item names.

## ADDED Requirements

### Requirement: Enchanting Item Details

Every published enchanting item SHALL show an Enchants section containing every captured gear requirement, each tier's named linked stat bonuses, time, success chance, and recorded additional costs. It SHALL explain that use spends the enchanting item and a successful different enchantment replaces the previous one.

#### Scenario: Kit Has Multiple Bonuses
- **WHEN** a player opens Bolstering Kit III
- **THEN** Enchants lists Armor as the fit and both Armor and Strength bonuses with the captured success chance and time

#### Scenario: Unrecorded Additional Cost
- **WHEN** an enchantment tier contains no additional cost entries
- **THEN** the page does not imply acquiring its enchanting item is free

### Requirement: Enchantment Reference and Search

Every enchantment reference that has a published enchanting item SHALL link to that item's Enchants section while retaining its own name. Search SHALL find the item by either its item name or its enchantment name.

#### Scenario: Distinct Names
- **WHEN** a player searches Health Enchantment or follows that enchantment reference
- **THEN** Enchant Health's Enchants section is reachable

### Requirement: Matching Gear Discovery

Equipment of an item type eligible for a captured enchantment SHALL link to the enchanting guide without implying every enchantment fits it.

#### Scenario: Armor Item
- **WHEN** a player opens an armor item
- **THEN** the item page links to the guide's enchanting section


### Requirement: Enchanting Guide

The Crafting and Gathering guide SHALL explain native-verified enchanting rules and list all published enchanting items with gear fit, stat bonuses, and recorded acquisition sources.

#### Scenario: No Recorded Source
- **WHEN** no source is recorded for an enchanting item
- **THEN** the guide says no known source rather than claiming the item is unobtainable
