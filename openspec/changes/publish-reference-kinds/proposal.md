## Why

Readers meet gear sets, currencies, crafting stations, races, and factions on many pages, but none of them has a page. A set name, a price in Honor, a station on the map, a class's races, and an NPC's faction read as plain text, so a reader cannot see what the set gives, what a currency buys, where a station stands, which classes a race offers, or how a faction treats them. The owner also asked for factions and reputation to be explained.

## What Changes

- Give gear sets, currencies, crafting stations, races, and factions regular entity pages, lists, search entries, and hover tooltips, in the same page model as other kinds. Their references across the site become links.
- A gear set page shows the set's bonuses with the verified rule for when they apply, and its pieces with what each piece is. An item's gear set names and links the set.
- A currency page shows how to get the currency, what merchants sell for it, the properties priced in it, and the quests that reward it.
- A crafting station page shows where the station stands, with map links, and the recipes made at it. Map spots of a station carry the station's key, and the internal Savers station is excluded with reviewed evidence.
- A race page shows where its characters start, the classes it offers, and its adventurers.
- A faction page shows a new character's standing with the faction, the faction's stances, its stance toward each faction, and a link to its NPCs. A new Factions and Reputation guide explains standing, factions in combat, changing standing, and the Reputation panel with native-verified rules.
- The Browse panel lists the new kinds in the World, Items, and Character columns, and the Mechanics column and the hub list the new guide.

## Capabilities

### New Capabilities

- `reference-kinds`: Pages, lists, search, and tooltips for gear sets, currencies, crafting stations, races, and factions, and the Factions and Reputation guide.

### Modified Capabilities

- `item-property-presentation`: An item's gear set links the set's page instead of standing in for a page.
- `compendium-tooltips`: An item tooltip links its gear set's name.
- `reference-layout`: The Browse panel columns name the new kinds and every guide topic.

## Impact

Public contracts gain five page kinds and their schemas, item documents move to `compendium.static-item.v22`, and mechanics documents move to `compendium.static-mechanics.v16` for the new topic. The publication projects the new documents, list rows, and the factions guide, and checks the Savers exclusion. The map shards add station keys to station spots. The rules record gains the factions topic. The site adds five pages, five tooltips, a shared purchases section, and the guide's standings table. Stats, effects, and enchantments are separate changes.
