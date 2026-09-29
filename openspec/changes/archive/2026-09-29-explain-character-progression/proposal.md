## Why

Class and skill pages show long Experience tables but do not explain how characters gain experience or talent points. Readers need one place to compare the level curve with verified experience sources and Heroic tier rules.

## What Changes

- Add a published `mechanics` page kind at `/mechanics/<topic>`. Add Character progression and Heroic tier to the Mechanics group in the navigation from `build-compendium-hub`.
- Show the character level cap from its template, a log-scale experience chart, and a level control. The control shows experience to the next level, earned so far, and left to the cap. Show the level ranges of authored creature and quest experience, experience sources, and talent points per level.
- Explain the verified Heroic kill experience multiplier, Heroic Essence calculation, and heroic creature and gear settings. Capture missing settings and level-difference modifiers before publishing their values.
- **BREAKING** Remove the Experience tables from class and skill pages. Link those pages to Character progression instead. Remove the unused experience arrays from their published documents.
- Verify uncertain experience rules before publishing them. Do not present a research inference as a confirmed game rule.
- Keep crafting and corruption pages in their separate changes.

## Capabilities

### New Capabilities

- `mechanics-pages`: Published mechanics documents, routes, navigation, progression chart, experience sources, and Heroic tier explanation.

### Modified Capabilities

- `detail-pages`: Class and skill pages replace their Experience sections with a link to Character progression.
- `progression-data`: The catalog captures missing modifiers and Heroic settings with evidence for their game values.

## Impact

- Contracts and catalog: `packages/contracts/src` and `packages/catalog/src` gain captured and published mechanics facts.
- Scan: `packages/scan/src/probes/collectors` gains evidence for modifiers and Heroic settings.
- Publication: `packages/publication/src` builds mechanics documents and removes per-class and per-skill experience arrays.
- Site: `apps/site/src` adds mechanics pages and the chart. It updates the class and skill pages and the Mechanics navigation group.
- Artifacts: the change compares a catalog candidate with the accepted catalog, stages a publication candidate against the accepted publication, and accepts both together.
