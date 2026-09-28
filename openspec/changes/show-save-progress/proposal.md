## Why

The compendium shows game facts but cannot show which of those facts apply to a reader's character. A save file can supply that context without sending private character data to a server. The evidence brief records three low-level test saves only, so the meaning of progress fields still needs verification.

## What Changes

- Let a reader choose a local character save at `%USERPROFILE%/AppData/LocalLow/Stargazing interactive/Afallon/<Name>_RPGBCharacter.txt`. Parse its JSON in the browser without an upload.
- Show the selected character's open quests by zone, killed bosses, undiscovered map areas, and unlearned recipes. Keep unknown or unmatched progress visible as an explanation instead of treating it as incomplete.
- Open the character's current talent build in the `/planner` URL format introduced by `build-character-planner`.
- Detect saves whose structure or game version is not known. Explain which progress can be shown safely and provide a way to clear the selected save.
- Add a published, build-bound identity resource for matching save identifiers to catalog entities and published pages. Verify field meanings against more than the three test saves before using them for completion claims.
- Keep save contents in browser memory only. Do not add accounts, server storage, uploads, or raw save contents to URLs or browser storage.

## Capabilities

### New Capabilities

- `save-progress`: Local import, version checks, identity matching, privacy, and character progress views.

### Modified Capabilities

None. Existing map, quest, recipe, and planner behavior stays available without a save.

## Impact

- The site adds a local save picker and progress views on the hub, map, quest and recipe lists, and linked detail pages. It opens a build in the planner.
- `packages/contracts/src/public` and `packages/publication/src` gain a static, catalog-derived identity resource. The catalog and scan change only if field verification finds missing evidence.
- The accepted catalog and publication move together through a candidate comparison, staged publication, browser review, and one acceptance report.
- This change depends on `build-compendium-hub`, `publish-overworld-zones`, `add-list-filters`, `show-talent-trees`, and `build-character-planner`. It consumes their routes, zone ownership, list controls, tree identifiers, and planner URL contract without redesigning them.
