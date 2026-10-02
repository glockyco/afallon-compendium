## Why

Adventurer pages showed the respawn time of the adventurer's NPC record, such as 1–2 minutes. Native code shows that a world adventurer that dies returns through its scene's spawn pool after that scene's own delay, and only when the pool spawns it again, so the record's respawn time does not apply. The same research found that adventurers are allies of the player that normal attacks cannot hit, with no kill experience and no loot.

## What Changes

- An adventurer page shows no respawn time.
- The Experience per kill card needs a kill that gives experience, as the Experience fact already does.

## Capabilities

### New Capabilities

### Modified Capabilities
- `detail-pages`: adventurer pages show no respawn time.

## Impact

`NpcPage.svelte`. No publication change. Evidence: `local/research/adventurer-hostility-20261002.md` in the main checkout (`AdventurerPopulationManager.OnAdventurerDied`, `ProcessPendingReturns`).
