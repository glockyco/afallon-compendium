# Show World Quests

## Why

The catalog already knows which quests are offered by world quest zones and their authored timers, but the quest page buries the timing in a narrow side column and the quest list offers no explicit quest-type filter. Readers cannot easily distinguish when a world quest starts, how it cycles, or how its rewards work.

## What Changes

- Give each world quest a concise timing card alongside its objective and zone locations, with a link to a World Quests Mechanics guide.
- Add a quest-type facet driven by the captured world quest facts, independent of whether an NPC or object also starts a quest.
- Publish a World Quests guide explaining the native-verified zone rotation, acceptance, completion, reward types, and Heroic Cache currency effect. Keep per-quest durations and cooldowns in the quest documents rather than hardcoding them in guide copy.
- Publish a candidate rules record and staged publication from build 25653798.

## Capabilities

### New Capabilities
- `world-quests`: Players can find world quests and learn their timing, zone and reward behavior.

## Impact

The Mechanics document schema adds a new topic. The existing Quest document schema already carries the captured world quest timings and starts, so its shape does not change. The list uses a new facet without changing the list resource schema.
