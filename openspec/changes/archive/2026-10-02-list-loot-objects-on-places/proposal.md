## Why

Item pages list the objects that hold an item, such as a Wooden Treasure Chest (Locked) in Afallon, but the page of that place does not mention the object. A reader who explores a zone cannot see which of its objects give loot.

## What Changes

- **BREAKING** Place documents gain `lootObjects`: each object that gives items when used, with its cost or choice, its conditions, the items it can give, and its spots in the place. The static place schema gets a new id.
- Place pages show these objects in an "Objects with loot" section after Gathering and objects.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `detail-pages`: Place pages list their objects with loot.

## Impact

- Contracts: `PlaceLootObjectSchema` and the static place schema id.
- Publication: `documents/places.ts` and a place index of object interactions.
- Site: `PlaceLootObjectsSection.svelte` on the place page.
