## Why

Effect pages currently expose a flat authored damage or healing amount and an isolated weapon modifier without showing the caster stats that actually scale the outcome. This can mislead players comparing abilities and make a stat page omit the abilities, effects, and creature attacks affected by that stat; verified same-build native behavior and runtime tooltip probes now make those relationships publishable without pretending to know a guaranteed hit value.

## What Changes

- Derive additive stat contributions per damage/healing effect rank from the recorded stat-bonus definitions, damage/healing type, and explicit stat modifier; retain authored flat amount, weapon percent, and selected weapon context as distinct operands. A flat-calculation rank skips implicit type bonuses but not an explicit stat modifier.
- Publish linked scaling on effect ranks and on their applying ability ranks, with the affected player and creature sources discoverable in the reverse direction from a stat page. Explain meaningful per-rank scaling in effect/ability detail, previews/tooltips, relevant lists, and Combat mechanics without merging different damage families or inventing an equipment-based damage total.
- Explain that damage/healing-over-time pulses calculate with the caster's stats on each pulse rather than freezing the stat contribution at application; distinguish tooltip examples from live hit outcomes and chance-to-apply from chance-to-hit.
- Preserve partial rank/source information when a type, stat, weapon selection, or evidence is missing, and validate the published contract and browser examples against verified Assassin and periodic probes.

## Capabilities

### New Capabilities

- `ability-scaling`: Player-facing rank scaling, source navigation, mechanic explanations, evidence boundaries, and representative browser scenarios.

### Modified Capabilities

- `progression-data`: Derived per-rank scaling with source stat and coefficient alongside existing authored rank operands.
- `stat-effect-pages`: Stat reverse links and effect-rank outcomes show the scaling relationships separately from base damage and weapon context.
- `detail-pages`: Ability version comparison exposes the effects' rank-specific scaling and application conditions.
- `stats-and-effects`: Combat guide states verified additive scaling and per-pulse recalculation without guaranteeing dealt damage or healing.

## Impact

Catalog progression derivation and contract, public effect/ability/stat document projection and validation, affected site detail/list/tooltip and Combat presentation, verified mechanics-rule registration, generated publication snapshots, focused regression/browser proof, and operator pipeline notes. Rank scaling is additive to the public document shape; previously published snapshots remain readable while fresh scan → catalog → publication data is required for the new relationships. The ignored native outputs and runtime probes are evidence inputs, not tracked assets.
