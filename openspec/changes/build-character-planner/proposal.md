## Why

Reference pages explain individual game facts but cannot hold several named characters, preserve a planned talent order, or share a complete character and party. The planner needs one browser-local character model that supplies context throughout the compendium while keeping incoming builds separate until deliberately saved.

## What Changes

- Add a prerendered workspace at `/planner/` with Character and Talents views, a persistent summary and inspector, and editing at desktop and phone widths. Gear and Party views appear through their own changes.
- Keep several reader-named characters with one active character selected in the header; provide short race/class/level setup, Duplicate, rename, delete with Undo, and reversible build editing.
- Separate shared and save-derived previews from saved characters. Offer “Save as New Character” and “Replace (name)'s Build”; opening a link never writes storage.
- Store Talent Point purchases in reader order, show an allocation list beside the talent web, and provide an “Earliest With Base Talent Points” level view. Keep Heroic Essence as final ranks without assigning purchase levels; save-imported final ranks have unknown order.
- Own the complete compressed fragment-link contract, including identity, entered point totals, ordered purchases, final Heroic ranks, modified gear and party fields, plus all-character export and previewed import.
- Use one revisioned character store with serialized cross-tab writes and a tab-only/export fallback. Migrate the remembered character level once while preserving skill levels; guard both existing storage readers. Report “Saved in this browser” only after successful writes.
- Hydrate character context after mount without changing prerendered reference pages, focus, or eager data cost. Class pages offer “Plan a (Class)”. Preserve evidence-backed point balances, evaluation states and dependency explanations.

## Capabilities

### New Capabilities

- `character-planner`: The planner foundation, character collection and active context, previews, talent planning, persistence, export/import and shared build contract.

### Modified Capabilities

- `shared-level-control`: Character level follows the active character or classless setup draft; skill values retain their independent remembered behavior.

## Impact

- Baseline: Afallon 0.16.3, Steam build 25653798, accepted catalog `d5b0b4b3e2161010e0de6fff10a2be305063990eb7c139080a9eb844edee0e15`. Published race offers determine playable classes; captured Berserker is not offered.
- Contracts/publication: a route-scoped planner payload must expose per-rank costs and full purchase inputs omitted by class documents. Official data changes require provenance, verification, risks and rollback in a JSON audit record before acceptance.
- Site: header character menu, `/planner/`, character-level consumers, class entry points, and storage readers at `apps/site/src/lib/reader-levels.ts:31` and `reader-gear-score.ts:13`.
- Related changes reference this foundation by `build-character-planner` / `character-planner`: `plan-party` owns `party-planner`, `plan-character-gear` owns `character-gear`, and `show-save-progress` owns `save-progress`. They do not redefine the collection or link contract.
- Delivery order: foundation and talents, then party, then gear; save research proceeds alongside. No equipment evaluator, party checker, save parser, ranking, recommendation or simulation is implemented by this change.
