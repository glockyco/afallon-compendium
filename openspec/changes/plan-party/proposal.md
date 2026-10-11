# Proposal

## Why

Readers can look up named adventurers and Dungeon Finder rules but cannot keep an intended party with a character or check its members against a dungeon. The published roster and verified role and level-window rules support that planning without pretending to know a character's live availability or predicting a run's outcome.

## What Changes

- Add a Party view to the workspace defined by `build-character-planner` / `character-planner`, with the player's chosen Group Finder role and four places shared by adventurers and verified capacity-consuming companions.
- Pick named adventurers inside a place from the fixed published roster, filter by role, class, race, preferred tree, starting level and join time, and prevent duplicate identities.
- Keep starting level separate from an optional entered current level; show role counts against one tank, one healer and three damage, and named member-level checks against a dungeon's published window.
- Keep player role permission, presence, joining, reservation and undergeared-tank checks Not Verified unless their rules and required inputs are verified. Research invitation lifetime and correct invitation pages if the one-hour statement is wrong.
- Link member preferences, abilities learned first and authored gear kits to reference pages, without calling them current equipment or rotations.
- Store the party inside each character's build and the foundation's existing versioned link and export contracts; link opening remains a storage-free preview.
- Add contextual adventurer and dungeon actions, “Add to (name)'s Party” and “Check (name)'s Party”, using an action-loaded published party lookup while pages remain prerendered.
- Research the class/role matrix, Finder candidate predicates and all companion categories before dependent behavior ships. Provide no recommendations, party score, simulation or outcome predictions.

## Capabilities

### New Capabilities

- `party-planner`: Character-owned party selection, linked member facts, role coverage, evidence-bounded dungeon checks, companion research gates and contextual page actions.

### Modified Capabilities

None. This change consumes the foundation contract from `build-character-planner` / `character-planner`; it does not redefine character storage, previews, link encoding or save import. Correcting inaccurate invitation facts implements existing evidence obligations rather than changing another capability's contract.

## Impact

- Depends on `build-character-planner` / `character-planner`; implementation order is foundation and talents, then `plan-party`, then `plan-character-gear`, with `show-save-progress` research alongside. Save party transfer remains owned and gated by `show-save-progress` / `save-progress`.
- Adds party lookup contracts and projections to `packages/contracts` and `packages/publication`, using accepted Afallon 0.16.3, Steam build 25653798, catalog `d5b0b4b3e2161010e0de6fff10a2be305063990eb7c139080a9eb844edee0e15` as the evidence baseline.
- Adds Party view and action-loaded controls in `apps/site`, reusing the foundation character context and the existing validated publication loader rather than the full search index.
- Extends registered, build-specific evidence for role permission, Finder candidates, invitation lifetime and companion behavior; any official data correction requires a provenance/checks/risks/rollback JSON audit before acceptance.
- Updates planner, Adventurers and operator documentation with the implemented behavior and research boundaries; no new server, game integration or save upload is introduced.
