## Why

An item's use tooltip does not explain the rewards that its actions produce. Supply packs and bags have different rolls, so treating both as a single grant misleads readers.

## What Changes

- Capture the actual item action mode and the chest prefabs reached by visual-effect actions in the canonical scan.
- Publish the gated loot-table choices of Adventurer's Supply Pack and chest contents of used bags, with the distinct rules that govern each.
- Show a When used section on affected item pages.

## Capabilities

### Modified Capabilities

- `item-property-presentation`: explain item action rewards and their roll rules.

## Impact

Canonical probe, raw decoding, catalog persistence and queries, item documents, and item detail pages. The canonical target must be rescanned live after the collector changes.
