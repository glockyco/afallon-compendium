## Why

Creature loot entry rates appear as per-kill odds, although the game uses them within a loot list and the effective probability is unknown. Dense combinations of list-roll and item-rate numbers make it hard to tell what happens on a kill.

## What Changes

- Name unverified creature and world-loot entry rates **Listed Rate** and explain the distinction in an accessible hint.
- Describe loot-list rolls, source levels and amounts in plain sentences without conflating the list roll with the item's selection.
- Add an optional verified per-kill probability to creature-drop rows, replacing the listed-rate display whenever available. Current publication leaves it absent.
- Label verified chest and gathering probabilities per open and per use in detail sections and item source summaries.
- Label supplemental cloth loot as a base rate before loot bonuses, not an effective chance per kill.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `detail-pages`: Clarify creature-drop headings, item and NPC rows, source summaries, and the distinct probabilities for containers and gathering.

## Impact

Public drop row schema, loot text helpers, NPC and item sections, source summary presentation, unit tests. No per-kill probability is calculated or published in this change.
