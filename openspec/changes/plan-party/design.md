# Design

## Context

See [proposal.md — Why](proposal.md#why) for motivation and [party-planner](specs/party-planner/spec.md) for the behavior contract. This change depends on `build-character-planner` / `character-planner`; that foundation owns the shared character lifecycle, browser store, active-character context, previews, link format and export/import.

The evidence baseline is Afallon 0.16.3, Steam build 25653798, accepted catalog `d5b0b4b3e2161010e0de6fff10a2be305063990eb7c139080a9eb844edee0e15`. Published race offers identify six playable classes; captured Berserker is not offered. Use the published offers, not a hard-coded class count.

The approved [Spec Plan](../../../local/mood-board/planner/notes.md#spec-plan) is supported by these research reports:

- [Party data](../../../local/update-0-16-3/research/planner-party-data-20261011.md): 115 named roster identities; roles, starting levels, join delays and Finder rules; precise runtime gaps.
- [Adventurer generation](../../../local/update-0-16-3/research/adventurer-generation-20261011.md): the roster is fixed authored data, while current levels, gear and journeys belong to a character's save.
- [Site integration](../../../local/update-0-16-3/research/planner-site-integration-20261011.md): reference pages are prerendered; current document resolution pulls a roughly 1.7 MB search index; an experimental compact party projection is 41,554 raw bytes, not an existing shipped schema.
- [Link encoding](../../../local/update-0-16-3/research/planner-link-encoding-20261011.md): complete links with party measured 516–569 characters at level 30 and 818–866 at level 60. This is fixture evidence, not a universal upper bound.
- [Save structure](../../../local/update-0-16-3/research/planner-save-structure-20261011.md): inspected saves do not contain a populated active-party case. Joined world members are not an active party.

Existing paths establish reusable boundaries: `packages/publication/src/adventurers.ts` projects class-matched specializations and the Damage fallback; `packages/contracts/src/public/documents.ts` separates compact roster rows from NPC preference/kit details. Preferred trees are class-page references with tree anchors. `apps/site/src/routes/+layout.ts` enables prerendering and trailing slashes. `packages/publication/src/documents/npcs.ts` currently publishes invitation duration from `firstRank.petDuration || duration`, which misses the recruiter override identified by native evidence.

## Goals / Non-Goals

**Goals:**

- Extend the existing character build with party behavior, not a second store or planner shell.
- Evaluate only published static facts and verified, explicitly sourced reader inputs; preserve partial selections and missing facts.
- Keep party lookup and controls out of ordinary reference-page loading and the shared header.
- Set research gates that produce recorded rules and build-bound public inputs before corresponding checks or companion behavior ship.

**Non-Goals:**

- No live game connection, automatic world-state synchronization, invitation, queue or gameplay control.
- No gear editor for adventurers, invented talent rotation, damage model, team optimization or outcome prediction.
- No raw-save persistence or independent save-party importer; transfer is owned by `show-save-progress` / `save-progress` after its populated-save gate.
- No duplication of the foundation link codec, character storage, export/import or talent level-view semantics.

## Decisions

### 1. Party is a build component, not global reader state

Use the foundation build's party fields for the player's selected role and an ordered set of up to four member places with native identities and optional entered levels. Edits use the foundation's character ID, revision and Undo mechanisms. Switching characters, checking a dungeon and opening a shared preview are reads, not writes. A reader-chosen browser name labels contextual actions; the game's saved character name is never copied automatically.

Links use the foundation's `/planner/#build=v1.<payload>` contract. Party validation integrates with its bounded, unknown-field-rejecting codec before the Party view ships. Do not introduce a separate party link, query parameter, compressor or export format. Foundation preview actions and export/import carry the party as part of the full build.

**Alternative rejected:** a browser-global party or separately saved party list would make switching characters reuse another character's inputs and split persistence, sharing and Undo across independent authorities.

### 2. Fixed identities, mutable character-specific facts

Project the actual world roster rather than all `ADVENTURER` records. Resolve member identities using `npcs:<native ID>` scoped by the build catalog, never roster positions or names. Companion selections retain an actual native variant even if the reference page groups variants. Preserve unresolved members on a catalog change; do not automatically remap them by name.

Roster role, class, race, preferred tree, starting level and configured join delay are authored facts. Entered current levels belong only to the character containing the party. Joined state, current gear, journeys and reservations are neither generated roster fields nor inferred from those static facts. A future verified save transfer must identify the source of current values through the existing `save-progress` handoff, not extend this change into a save parser.

**Alternative rejected:** generating per-character adventurer identities or treating current progression as global would contradict the fixed-roster and character-owned persistence evidence. Category-only filtering would admit the nonroster adventurer records.

### 3. Publish one bounded party lookup through existing integrity checks

Add a typed, versioned publication resource descriptor to the existing static root/layout data. It carries catalog/build identity, compact roster rows, page/document references for lazy details, verified shared-capacity/role/level-window rules, Finder destination ranges, and any researched role-permission or companion records. Reuse existing reference types, including preferred-tree anchors. Put priority abilities, kit entries and full preferences in lazily loaded detail documents rather than duplicating every NPC page in the compact lookup.

The existing validated publication loader checks bytes, hash, schema and build/catalog before exposure. Add reference-based loading using descriptors already supplied by the page or lookup, avoiding the full search corpus. Reuse cached verified resources and existing failure/retry handling. The 41,554-byte experiment guides scope, not a fixed byte-budget requirement; measure the actual schema after researched facts are added.

The shared header reads only foundation character context after mount. Loading the Party view or invoking a party page action loads the lookup. Member details load on inspection. A dungeon or adventurer page uses its own already-delivered document and fetches party context only after action invocation.

**Alternatives rejected:** embedding the complete party resource in every page burdens unrelated readers; using the search index for identity resolution repeats the known 1.7 MB cost; unchecked direct JSON fetch bypasses established integrity rules.

### 4. Counts and individual checks remain separate from eligibility

Role coverage includes the player once, compares raw counts with Tank 1, Healer 1 and Damage 3, and exposes deficits and excesses. An unknown companion role is an explicit unknown, not Damage. Preserve a retained planning role even when a later verified matrix identifies a queue restriction; explain the restriction rather than rewrite the build.

For a selected member, choose verified transferred current level where supported or reader-entered current level, otherwise the explicitly labelled published starting level. The check records the value and source beside its inclusive window `max(1, minimum - 2)` through `max(minimum, maximum) + 4`. It is a comparison of the supplied level, not proof of current availability. The adventurer window is not silently a player rule: native evidence distinguishes selected and random player queue checks.

Render role permission, presence, joining, reservations and the tank gear check separately with their missing rules or inputs. Even after a predicate is researched, a static plan usually lacks its runtime input and retains Not Verified. No aggregate “Finder eligible” status, survival result or score is derived from passing role/level checks.

**Alternative rejected:** one green readiness badge would hide candidate and character-state gaps; using starting levels as current values or an authored kit as equipped gear would give a fabricated check.

### 5. Explicit slot-local editing and contextual handoffs

Member browsing is inside the chosen place; filtering and detail inspection do not modify a build. An explicit pick fills or replaces only that place. Shared identity/capacity checks run for picker and page actions alike. A full party opens an explicit replacement choice instead of dropping an existing member.

Adventurer “Add to (name)'s Party” carries the current page's native roster member; dungeon “Check (name)'s Party” carries the current place. Capture target character ID/revision at invocation through the foundation safeguards. An active-character switch during lookup cannot redirect a pending edit. A check names its captured character and never writes the build. Without an active character, preserve page context through the foundation's short setup before completing the handoff.

Reuse the workspace inspector and shared cards, reference links, tooltips and tables. Preserve keyboard access and focus, with readable stacked places on phones and no horizontal page overflow.

**Alternative rejected:** automatic addition on link navigation or candidate highlight would blur browse and commit, violate preview isolation and make asynchronous context changes unsafe.

### 6. Research gates publish only what they establish

The initial useful check is bounded by published role counts and member levels; unresolved Finder predicates remain named Not Verified. The following research gates precede their dependent implementations, with artifacts named in [tasks.md](tasks.md):

| Gate | Settling evidence | Dependent behavior |
| --- | --- | --- |
| Invitation lifetime | Operator invites a research member; read-only observations of summoned `stateMaxDuration`, `stateCurDuration` and matching actor at invitation, past one hour of game play, scene change and reload. Native `RecruitAdventurer` writes infinity to the maximum, not a “remaining time” field. | Effective invitation facts and any correction of NPC/guide/effect surfaces; never a guessed countdown or permanence claim. |
| Class/role permission | Read loaded Damage-only class configuration; probe the pure role predicate for every published playable class and all three roles; compare Group Finder controls. | Published permission matrix and explanatory warnings, not an inferred policy from one tooltip. |
| Finder candidates | Probe known party/dungeon transitions for presence, joined status, reservations and manual invitation, separating auto-selection from manual invitation; boundary-test the undergeared-tank calculation and its inputs. Captured share 0.9 and piece count 10 are not a complete published evaluator. | Individually supported predicates and verified rule operands, with unknown current inputs still Not Verified. |
| Companions | Review all six Companion and four Quest Companion native records; obtain at least one actual actor of each category through its real route; verify identity, linked variant, capacity, role, equipment access and movement/combat UI. | Only verified party companion selection and supported descriptions; no merging with generic pets or assuming all quest companions share the four-place count. |

Runtime probes are read-only; the operator performs invitations, travel, queueing or gameplay transitions normally. Do not call mutating party-generation or invitation functions from a purported probe. Record unresolved cases explicitly. Official data changes follow scan/capture/catalog/publish/accept-update, including a JSON acceptance audit with provenance, verification checks, risks and rollback; any invitation correction must cover every affected published surface, not just planner text.

**Alternative rejected:** treating captured settings, declarations or successful role counts as a complete rule would turn intent or partial evidence into behavior. Removing a research gate merely because static planning works would leave misleading reference information in place.

## Risks / Trade-offs

- **Catalog identity stability across future Steam builds is unproven** → retain catalog provenance and unresolved selections; require an evidenced mapping before remapping native identities.
- **Static plans cannot know live presence, joining, reservation or current gear** → name each check and its missing input; never aggregate partial checks into eligibility.
- **The infinity override does not prove indefinite membership across every death/load path** → verify elapsed-play, scene and reload behavior before replacing the one-hour fact, and state only observed effective semantics.
- **Grouped NPC documents can hide category or linked-actor differences** → use native variants and verify actual summoned identities, especially quest companions, before exposing selection or capacity.
- **Async actions can outlive a character switch or deployment** → bind edits to captured ID/revision and validate lookup provenance; failed actions leave page content and saved characters unchanged.
- **Full details would inflate the measured compact lookup** → store descriptor references and disclose details on demand, measuring actual requests in a cold browser.
- **Research may verify a rule but not reader-specific inputs** → ship only the explicit Not Verified state for that input, retain the research result, and do not simulate missing state.

## Migration Plan

1. Land the foundation and talents first, including complete party-field validation and preview/storage safeguards. No separate party storage migration or legacy party-link alias is needed.
2. Finish each research gate before publishing its dependent facts or controls. For data corrections, register evidence, write the acceptance audit and rebuild through the existing pipeline so development and preview stage the same accepted publication.
3. Publish the party resource and its descriptor with contract tests, then expose the Party view and page actions against that same publication. Do not expose a numerical check when its rule or operands are absent.
4. Validate a complete browser character, shared preview, export/import and contextual page round trip. Keep foundation character context usable if party lookup loading fails.
5. Roll back a data correction through its audited accepted descriptor; roll back Party UI/publication together to a compatible foundation. Preserve character records and party payloads rather than deleting them or rewriting valid saved input during rollback.
