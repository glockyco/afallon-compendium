## Context

All 23 enchantments have captured progression facts and one-to-one item joins keyed by `enchantment_entity_key`. Native application and stat behavior has been decompiled for build 25653798.

## Decisions

- Project authored requirements, each tier, stats, rate, time, and additional costs from progression facts into the enchanting item's document.
- Route enchantment references to the owning item's `#enchants` while retaining the enchantment record name. Add its name as an item search alias when different.
- Build the guide table from the published item documents so acquisition rows agree with their item pages. Keep unknown sources unknown.
- Link stats through their reference so they become clickable when stat pages are published.

## Risks

- No captured enchantment uses more than one requirement or one tier, so the projection preserves arrays without inventing unobserved combinations.
