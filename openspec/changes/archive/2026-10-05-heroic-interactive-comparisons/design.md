## Context

The Heroic page already renders the verified factors and reference tables. Character Progression publishes place-specific eligible kill-calculator creature rows, while item pages publish their own Heroic eligibility and tooltip facts. The corruption comparator already presents two tooltips and a What Changes table. The publication excludes known dungeon and paused-area rules through links in Heroic Tier.

## Goals / Non-Goals

- Compare actual published place-specific encounters and eligible item variants without asserting empowerment or reward drops.
- Retain the existing three-score and Essence reference tables.
- Do not infer absolute combat health/damage from template stats when level scaling, modifiers or rank make actual values unknown.
- Do not add game rules or publish guessed combat baselines.

## Decisions

- Load the published progression mechanics document and published places list on demand. Progression groups sometimes name an outdoor place without carrying its reference, so resolve an exact published place-name match before excluding the verified paused places; omit groups without a published place match. Default to Fangchill in Chillwind Heights when present, otherwise the first eligible encounter. Use the existing kill-calculator rule for normal modeled experience at a selected character level and creature level, with no followers or bonuses, and apply the published Heroic kill multiplier for empowered experience.
- Calculate strength with the verified published operands and cap, in one pure helper with boundary tests. Store the score under its own versioned localStorage key beside reader levels' storage rather than changing reader-level parsing, which rejects zero. Character level continues to read the shared reader-level store.
- Fetch a small published set of demonstrably eligible item pages by reference on demand, validate each item's `facts.heroic` before showing it, and reuse the corruption tooltip comparison and delta table by extracting their shared presentation/calculation. This avoids a new persisted item catalog or claiming eligibility based on item type alone.
- Keep the site's existing more common "Show on map" action verb, but title-case the visible "Show on Map" label everywhere the exact map-location action appears. Distinct spot-count links retain their more specific labels. Update the reference-layout requirement, whose older wording names the less common action.

## Risks / Trade-offs

- The published creature document has template combat stats, but actual max health and attack damage are not safely derivable with all runtime modifiers. Show verified relative multipliers instead of invented absolute values.
- The eligible item selection is intentionally a small curated set of published creature-drop equipment, not a claim to list every Heroic item. Every option is verified against its loaded item facts.
