## Why

Creature pages currently present an NPC's authored stat addition as its finished Health or another combat stat, even when its starting value and per-level growth make the in-game value different. The same incomplete data leaves Heroic creature health as a multiplier without a reliable normal-health baseline.

## What Changes

- Carry each NPC stat's authored addition, starting value, level growth, and optional overrides from scan through catalog into a dedicated public NPC stat row; keep item and other stat-row contracts unchanged.
- Calculate a creature's level-specific stat only when its complete supported rule and a specific known encounter level are available. Keep fixed-level creatures fixed and distinguish unknown or unsupported effective values from known authored additions.
- Show correct encounter-level Health and supported combat stats on creature pages and variants, and normal versus empowered maximum Health for eligible Heroic encounters where calculation is supported. Do not mislabel Strength as universal attack damage; preserve useful partial stat facts where an effective value is not supportable.
- Validate the public contract strictly and cover Fangchill at levels 20 and 30, a fixed-level Aquarius boss, Heroic health, and unsupported overrides.

## Capabilities

### New Capabilities

- `creature-stats`: Authored creature stat evidence, safe encounter-level calculations, and normal/Heroic player-facing values.

### Modified Capabilities

- `npc-presentation`: Creature summary and variant stat displays must distinguish effective stats from authored additions and use the encounter's level.

## Impact

NPC probe output, normalized NPC rows and catalog SQLite/read path, public NPC document schema and projection, creature page and Heroic comparison UI, targeted regression tests, and operator-facing data pipeline instructions. Published NPC documents gain optional stat-rule fields; the change is additive for clients but requires a republish for the corrected values.
