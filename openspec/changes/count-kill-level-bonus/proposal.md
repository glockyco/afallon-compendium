## Why

Kills in the game gave more experience than the site showed. A level 1 Bat gave 2 experience three times, where its page said 1. A level 23 Brinecrest gave up to 133, where its page and the kill calculator allowed at most 119. `LevelingManager.GenerateMobEXP` adds the killed creature's level times the record's `EXPBonusPerLevel` to the roll, before the game modifiers and the level difference. The scan records this field, but the catalog dropped it, and the reviewed rule for the kill roll leaves it out. Most creatures have a bonus of 1 or more, so the error grows with the creature's level.

## What Changes

- The catalog keeps the experience bonus per level of each NPC record.
- A new reviewed rules record states the bonus in the kill roll rule, with the disassembly of the method and the measured kills as evidence.
- NPC pages and their variant tables show the experience per kill at the creature's levels: the roll plus the level times the bonus. Without a published level, they show the roll and the bonus per level. The NPC document schema changes from v6 to v7.
- The experience sources count a creature with a level bonus as a source even when its roll is zero.
- The kill calculator adds the level bonus as its own step after the base roll.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `detail-pages`: a combat creature's experience per kill includes its level bonus.

## Impact

- Catalog: one NPC facts column, a new catalog candidate.
- Evidence: `research/progression/25434619/kill-level-bonus-disassembly-20261001.json`, `research/progression/25434619/kill-experience-20261001.json`, and `local/mechanics-rules-25434619-kill-level-bonus.json`.
- Publication: NPC document v7, the experience sources, the kill calculator entries, and the kill step text.
- Site: the NPC strip, the variant table, and the kill calculator.
- The kill calculator requirement lives in `add-kill-calculator`, which is not archived yet, so that change carries the calculator part.
