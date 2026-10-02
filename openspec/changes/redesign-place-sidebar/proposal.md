## Why

The side of a place page lists every teleport into and out of the place, by direction. On Afallon this list has 140 rows, and on a phone it pushes Creatures more than 4,000 px down the page. The rows do not tell a reader how to reach the place. A dungeon page does not say that the Dungeon Finder can send a player there, and it does not show its timer or its Altar of Corruption. Services are a short list at the end of the NPC table.

## What Changes

- **BREAKING** Place documents replace `connections` with `entrances`: the places that a player enters this place from, with their spots. The overworld place gets `placesToEnter`: the dungeons, challenge stones, and other places that a player can enter from it, with their entrance spots and level ranges.
- **BREAKING** Dungeon places get `dungeonFinder` when the Dungeon Finder can send a player there, and `timedDungeon` with the timer, the two thresholds, the token bonus of each threshold, the most items in the reward bag, and the Altar of Corruption spots.
- Place `services` hold only the services that a player uses: merchants, bankers, auctioneers, flight points, quest givers, and crafting stations.
- Challenge stone starts are part of place projection. The Heart keeps its list of stones.
- The place side shows a Getting there card, a Timed dungeon card, and a Services card. The overworld page shows a Places to enter section. The side no longer shows the raw connection list or a Part of card, and the NPC section no longer lists services.
- The Loot guide's Dungeon Finder lead says that the Dungeon Finder sends a player to a chosen or a random dungeon.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `detail-pages`: Place pages show how to get there, timed dungeon facts, services, and places to enter.
- `compendium-reference`: A place page shows how to get there instead of its connections.

## Impact

- Contracts: `PublicPlaceSchema` and the static place schema id.
- Publication: `documents/places.ts`, challenge stone starts in `index-resources.ts`, the overworld map space in the projection input, and the Loot guide lead.
- Site: `PlacePage.svelte`, new side cards and a Places to enter section, `PlaceCreaturesSection.svelte` without services, and the removal of `ConnectionsSection.svelte` and connection rows.
