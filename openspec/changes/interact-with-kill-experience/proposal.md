## Why

The experience of a kill depends on the reader's character level: a creature that scales spawns near the reader's level, and a creature above or below the reader changes the roll by its own percentages. NPC pages showed only the range over every level at which the creature spawns, and the reader had to open the kill calculator on another page to see their own number.

## What Changes

- An NPC page that you fight shows an Experience per kill card with a character level control, which starts at the reader's remembered level, the creature level at that character level, and the experience per kill, with a link to the kill calculator for followers, Heroic, and bonuses.
- An NPC's kill experience publishes its level-difference percentages and the character level cap, so the page uses the kill calculator's formula. The NPC schema stays at `compendium.static-npc.v10`, which is not yet accepted.
- The character level template moves into `experience.ts`, which the Character Progression guide and NPC pages share.

## Capabilities

### New Capabilities

### Modified Capabilities
- `detail-pages`: NPC pages give the experience per kill at the reader's character level.

## Impact

`packages/contracts` (kill experience), `packages/publication` (`experience.ts`, `documents/npcs.ts`, `mechanics.ts`), and `NpcPage.svelte`. Archive after `name-npcs-plainly`, whose version of the NPC page requirement this change extends.
