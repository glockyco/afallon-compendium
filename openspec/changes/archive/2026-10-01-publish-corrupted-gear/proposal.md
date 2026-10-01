## Why

Item pages show template stats but cannot compare a calculated corrupted template with its base values. The accepted build 25434619 catalog `05538f40` and publication `e6ad42ed` have no published corruption settings or guide. Build-matched native analysis and live in-game tooltip, equipment and combat-component experiments now establish the corruption level display, scaling, and token description. A full mitigated hit was not measured.

## What Changes

- Capture build-specific corruption settings, eligible timed-dungeon reward-bag gear, token/affix behavior, the five timed dungeons' authored thresholds and loot counts, and their provenance. Distinguish Heart of Corruption, a challenge-stone requirement and crafting material, from a Corruption Token; present its challenge-stone uses on the Heart item page and the reverse requirement on challenge-place pages.
- Offer a corruption-level selector only for equippable item templates present in the five timed dungeons' boss reward loot tables, in a secondary section. Show calculated values beside base values with game-tooltip-matching formatting and rounding, explicitly not a specific rolled item, and link the relevant guide step. Keep the in-game tooltip and acquisition answer intact.
- Publish `/mechanics/corruption` as a five-step guide under the existing `mechanics` page kind. State verified Corruption+ rules, worked examples, source boundaries, and unresolved behavior without inventing gameplay facts. Keep a generic Heart item link in `seeAlso`, without a challenge-stones section or Heart-specific rule. Its Try It comparison selects a published eligible item and shows the base template beside its calculated corrupted template, grouped by timed dungeon and associated bosses.
- Present all four mechanics guides with steps in two columns on wide screens and their worked example across the full width below the steps; stack steps on narrow screens.
- Keep every reachable item in existing list and detail pages. Do not rank gear or add dungeon routes.

## Capabilities

### New Capabilities

- `corruption-mechanics`: A build-specific Corruption+ guide grounded in captured rules and authored facts.

### Modified Capabilities

- `item-property-presentation`: Only timed-dungeon reward-bag equippable item pages compare calculated corruption-level values with unchanged base template values.
- `mechanics-pages`: All four guides share two-column steps and a full-width example below; the Corruption guide's Try It comparison uses eligible dungeon reward gear.

## Impact

- Research: build-matched native, read-only runtime, and controlled live in-game evidence in `local/corruption/native-findings-20261001.md`, `runtime-findings-20261001.md`, and `live-findings-20261001.md`; the full mitigated-hit outcome remains outside the measured weapon component.
- Scan, catalog, and publication: build-specific settings, dungeon and token facts, calculated item projections, Heart/challenge-place relationships, and a versioned mechanics guide using place schema v8.
- Site: secondary item comparison and `/mechanics/corruption`, linked from the Browse panel's Guides column and applicable entity guide-step links.
- Publication cycle: compare against accepted catalog `05538f40` and publication `e6ad42ed`, stage candidates and browser-check; do not accept catalog or publication in this run.
- Existing contracts: `mechanics-pages` owns the guide kind, step anchors and rule placements; `reference-layout` owns Browse navigation; `item-property-presentation` and `detail-pages` own item layout and progressive disclosure. The earlier `explain-character-progression` and `add-page-navigation` changes are archived, not active dependencies.
