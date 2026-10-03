## Why

Creature loot entry rates appeared as per-kill odds, although the game applies a table gate, ordered item rolls, item limits, and minimum picks. The build-matched native roll and a recorded runtime check now make conditional baseline odds computable for many creature and world-object drops; dense combinations of list-roll and item-rate numbers obscure that distinction.

## What Changes

- Name unverified creature and world-loot entry rates **Listed Rate** and explain the distinction in an accessible hint.
- Describe loot-list rolls, source levels and amounts in plain sentences without conflating the list roll with the item's selection.
- Calculate per-kill odds for creature and World Loot rows when the catalog supplies the full roll, and show the value at a stated creature level and zero Loot Chance when applicable. Keep Listed Rate with an explanation of the missing input otherwise.
- Label verified chest and gathering probabilities per open and per use in detail sections and item source summaries.
- Label supplemental cloth loot as a base rate before loot bonuses, not an effective chance per kill.
- Calculate per-open odds for captured world-object LootTable actions when their action, level eligibility, full loot list, and minimum behavior are known.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `detail-pages`: Clarify creature-drop headings, item and NPC rows, source summaries, and the distinct probabilities for containers and gathering.

## Impact

Public drop and container schemas, catalog loot inputs, exact roll model, publication projection, source summaries, NPC and item sections, guide section, and deterministic tests. All displayed odds are conditional on qualifying player rewards, neutral loot bonuses, and the stated level and Luck.
