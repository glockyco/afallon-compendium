## Why

The talent planner can share a character without pretending that unevaluated equipment produces valid stats. Gear choices need distinct equip-rule and formula research, and a separate acceptance boundary, before their results can join the remembered character.

## What Changes

- Add an equipment phase to the existing `/planner` using published slots and reachable items, with visible equip restrictions and a clear distinction between planned gear and gear actually worn in the game.
- Show verified stat contributions and their sources. When a roll, modifier, restriction or formula is unknown, preserve the known contributions and mark the affected total Incomplete instead of treating the missing piece as zero.
- Activate the existing v1 build URL's `gear` pairs for selection, restore gear from shared previews, and update the active character only through the existing explicit adoption action.
- Show gear score on Heroic Tier only if it can be verified from the remembered build and published game rules. Defer comparison/ranking, account sync and save-file import.

## Capabilities

### New Capabilities

- `character-gear`: Equipment selection, evidence-backed restrictions and stat/gear-score calculations extending the existing talent planner.

### Modified Capabilities

None. The existing `character-planner` link contract already reserves `gear` pairs for this phase.

## Impact

- Research: equip checks, slots and hand interactions, class stat-list precedence, level growth, stat stacking/caps, item effects and gear-score computation on build 25653798.
- Contracts/catalog/publication: typed gear and stat inputs from accepted catalog `076be02f1fcc7e88711645fa730cefde7fbbc5923d1abd7399ff7d2192f97779`, with any missing capture compared against that baseline.
- Site: gear section/tab, slot picker, contribution disclosure and Heroic Tier context driven by the same remembered character.
- Publication: staged against accepted ri12 `dade9f2e75c50ffbdfdbf92daa5e7aa9e2f716da6bf9494dd69172c75326bd76`, jointly accepted with catalog updates; Planner 1 remains useful without this phase.
