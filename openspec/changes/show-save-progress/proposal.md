## Why

A local character save can connect the compendium's published facts to a reader's progress without uploading private data. Its independently verified identity can also start a plan, while uncertain progress, talents, equipment and party state remain explicit rather than becoming invented facts.

## What Changes

- Read one character's JSON save in this browser, without uploading or changing it. Keep the snapshot in the current tab only; no shared state file is required.
- Put file and location help beside the picker, explain the tab-only lifetime, and provide a non-personal sample save using the same import path.
- Show verified open quests by zone, confirmed boss kills, undiscovered map areas and unlearned recipes. Preserve unknown, ambiguous and unmatched records instead of converting them to zero or incomplete progress.
- Offer **Start a Plan From This Save**: validated class, race and level open an isolated planner preview. The reader can explicitly save it as a new character or replace the build of a character they pick; file identity never chooses an overwrite target.
- Gate talent snapshots, entered point totals, modified gear and party transfer independently on consented save verification and their owning planner capabilities. Imported talent ranks retain unknown purchase order.
- Publish a compact, build-bound progress identity resource. Missing version evidence is unknown, not proof of an old version.

## Capabilities

### New Capabilities

- `save-progress`: Local, tab-only save import, compatibility and identity matching, progress views and explicit hand-off to a planner preview.

### Modified Capabilities

None. This capability consumes the `character-planner` foundation owned by `build-character-planner`; it does not redefine character storage, previews or link encoding. Gear and party transfer additionally consume `character-gear` from `plan-character-gear` and `party-planner` from `plan-party` when those capabilities and the respective save evidence gates are ready.

## Impact

- The site adds a save picker and conditional progress views on the hub, map, quest and recipe lists and linked detail pages. Reference pages remain prerendered; private context loads only after mount.
- Contracts and publication gain a static progress identity resource, not a second catalog or the full search index. Save-derived context is never a server input.
- The evidence baseline is Afallon 0.16.3, Steam build 25653798, accepted catalog `d5b0b4b3e2161010e0de6fff10a2be305063990eb7c139080a9eb844edee0e15`. Candidate catalog and publication updates require a provenance, checks, risks and rollback audit before joint acceptance.
- Progress views depend on `build-compendium-hub`, `publish-overworld-zones` and `add-list-filters`; talent resolution depends on `show-talent-trees`. Planner adoption depends on `build-character-planner` / `character-planner`, with party and gear integration after `plan-party` / `party-planner` and `plan-character-gear` / `character-gear` respectively. Foundation and talents come first, then party, then gear; save research proceeds alongside.
