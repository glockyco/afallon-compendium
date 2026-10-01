## Why

The owner wants the Browse menu to show only the main Mechanics topics. Heroic Tier, Crafting and Gathering, and Loot are detailed guides that readers reach from the pages whose rules they explain, so they need not be one click away on every page.

## What Changes

- The Mechanics column of the Browse menu links Character Progression and Corruption only.
- Heroic Tier, Crafting and Gathering, and Loot keep their pages under `/mechanics/<topic>` and stay reachable through the How it works links of the pages that use their rules.
- The mechanics page requirement names all five published topics, including Loot, which the 0.16.3 update added.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mechanics-pages`: every topic has a page, and the Browse menu links only the main topics.
- `reference-layout`: the Mechanics column of the Browse panel lists Character Progression and Corruption.

## Impact

`apps/site/src/lib/site-navigation.ts` and its test. No publication or data change.
