## Context

See `proposal.md` for motivation and `specs/save-progress/spec.md` for behavior. The accepted baseline is Afallon 0.16.3, Steam build 25653798, catalog `d5b0b4b3e2161010e0de6fff10a2be305063990eb7c139080a9eb844edee0e15`. Reference pages are prerendered; private progress and character context must load after mount.

The October 11 [save structure report](../../../local/update-0-16-3/research/planner-save-structure-20261011.md) inspected three separate character files spanning levels 1–22 but only one class/race combination. They have no spent talents and no verified active-party entries. Each file contains its own character data; newer profiles include bank and adventurer-world state, and no shared state file was found in that folder. No whole-save game/build marker was established. Declarations describe fields, not population, absence or update semantics.

The `character-planner` foundation in `build-character-planner` owns characters, exactly one active character in a nonempty collection, preview adoption, Undo, persistence and build links. This change only owns the save-to-preview boundary. It also consumes routes from `build-compendium-hub`, zones from `publish-overworld-zones`, list controls from `add-list-filters` and tree/node identities from `show-talent-trees`. Gear and party hand-offs additionally depend on `plan-character-gear` / `character-gear` and `plan-party` / `party-planner`.

## Goals / Non-Goals

**Goals:**
- Interpret only independently verified save facts and preserve partial information.
- Keep private snapshots separate from static publication and browser characters.
- Make adoption a deliberate reader choice rather than infer ownership from a name or path.

**Non-Goals:**
- Accounts, uploads, automated file-system access, save editing or exporting a game save.
- Importing inventories, bank contents, adventurer journeys or whole simulation worlds into a plan.
- Best-in-slot, rankings, scores, recommended teams, simulations or outcome predictions.
- Reconstructing actual past talent purchases from final ranks.

## Decisions

### Use independent evidence gates, not one all-or-nothing importer

Class, race and level are explicit integer fields. Validate each against published playable offers and the level range, including a different class/race fixture before acceptance; never offer captured-but-unpublished classes. Talents, budgets, modified gear and active party each need their own consented paired-save evidence before transfer. This permits identity hand-off while retaining the unresolved facts instead of waiting for every feature or pretending empty research arrays prove absence.

Progress rules need at least four additional independent, consented saves covering quest transitions and repeats, positive kills, discovery and recipe learning. Record field paths, before/after deltas, structural profile and confirmed origin where known, without names or inventory contents. Use read-only runtime or bounded native evidence when observations leave a rule unresolved. No dependent rule ships before its evidence gate passes; unverified states remain unknown.

### Publish exact, build-bound identity mappings

A compact publication resource maps verified native IDs to canonical entities and published references, NPC variant anchors, quest zones, recipe refs, tree/node identities and all region-name candidates. Include reliable scene context only if save evidence proves it. Duplicate region names remain ambiguous; grouped NPC pages retain record identity. Reachable unpublished or unmatched records retain readable labels and coverage instead of disappearing. Bind this resource to the catalog and publication build and recompute a tab snapshot or mark it unknown when those identities change.

Alternative: match display names or ship another full catalog. Names are not unique and a full catalog or search index adds unnecessary cost. Existing page data and the small identity resource supply progress; party context and the item directory load only when a corresponding action is used, via their owning capabilities' published lookups.

### Keep one file's snapshot in tab memory

Use the browser File API and a bounded client parser. The observed files reach approximately 102 MiB, so choose and document parser byte/entry bounds from representative fixtures before implementation; provide a useful oversized-file error rather than freezing the tab. Reject invalid JSON without replacing the previous valid snapshot. Track structural compatibility per field; missing version remains unknown, not old. `HunterTalentVersion` is not a demonstrated whole-save marker, and the installed game does not establish a selected file's origin.

Keep the file metadata, parsed contents, character name and progress only in a tab-memory store. No local/session storage, IndexedDB, cookies, logs, analytics or requests contain those facts. Same-tab navigation retains progress; refresh requires reselecting the file. Clear Save removes the snapshot and progress marks, not an explicitly adopted browser character. No sibling character file or shared state file is read, and no worlds are merged.

Alternative: persist the snapshot for convenience. Rejected because it blurs privacy and lifetime. Beside the picker, show file/location help, one-file-per-character guidance, the exact sentence “Your save is read in this browser, not uploaded, and not changed.” and the refresh explanation. Provide an authored, non-personal sample with no real names, inventories or personal world history; it passes the same parser and is clearly marked as a sample.

### Preserve conditional progress views

Use verified quest transitions, not enum names alone; repeatable quests follow their current state. Group open quests by every published zone and retain an unassigned group and the full list. Positive matched kill counts establish only the specific NPC record's kill; absence is not a negative kill claim. Discovery needs verified rules and unique region identity, not entered scenes or missing strings. Recipe learning conflicts remain unknown. Keep the ordinary map, controls, directories and links available without a snapshot.

Reader-facing title-like labels follow README's Reader text conventions (for example Clear Save); sentences, status explanations and field labels retain natural sentence casing. Show readable uncertainty labels, never IDs or enum words. Unknown inputs are never numeric zero.

### Hand off a preview, not an automatic character update

Start a Plan From This Save initially copies only independently validated class, race and level. It invokes the foundation's isolated preview contract, leaving storage and the active character unchanged. Show copied and unverified fields before adoption. Save as New Character requires a reader-chosen name; replacing a build requires the reader to pick a browser character and confirm Replace (name)'s Build. Use foundation Undo and persistence feedback, including Saved in this browser only after a successful write. Never copy the game name automatically or use it as an overwrite key.

Alternative: overwrite the active character or identify a browser character by save name. Rejected because a file is neither stable global identity nor consent to replacement. The preview may explicitly become a new character or update the selected character; switching characters alone edits nothing. Foundation export/import moves browser characters, not the raw game snapshot.

### Import final ranks and item instances only after their own gates

Talents require paid ability and bonus purchases, successive ranks, rank-down/reset, defaults and externally learned abilities, including Heroic Essence. Resolve tree/node identity with `show-talent-trees`; do not treat authored `nodes[].nodeData` as allocation ranks or assume shared ability IDs uniquely identify nodes. Copy verified final ranks with order unknown. Do not sort nodes into a history. Earliest With Base Talent Points becomes available only for an explicitly reader-authored order and is not an actual past build; Heroic Essence purchases have no level.

`Points[].amount` may be a balance, not an earned total. Verify spend/refund/modifier semantics before transferring it as an entered total; never infer Essence from level or count shared spending twice.

Gear requires actual placement/order and legacy unnamed-slot evidence, equipped-to-instance joins, sentinel meanings, random-stat units, gems by socket, enchantment tier and separate Heroic/corruption state. Preserve known items when an instance or modification is unresolved; dependent totals remain Incomplete. Do not equate missing instance data with an unmodified item. Coordinate save verification with `character-gear`'s physical-slot and modifier gates, rather than infer slots from row count.

Party requires populated, paired save/reload cases for invited adventurers, companions, Finder-added members, challenge waits and hunter pets, plus removal and role changes. World HasJoined, friends and stored equipment do not establish active membership. The [adventurer origin report](../../../local/update-0-16-3/research/adventurer-generation-20261011.md) establishes the roster as fixed authored identities; current levels, gear and journeys are per-character save state, not roster defaults. Resolve only deliberately importable members and preserve their level source through `party-planner`.

### Reuse the foundation's versioned fragment codec

The sole link contract is `build-character-planner` / `character-planner`: `/planner/#build=v1.<payload>`, unpadded base64url of raw-deflate-compressed compact JSON. Use its catalog provenance, identity, entered point totals, ordered Talent Point purchases (adjacent runs collapsed), Heroic final ranks, gear-instance and party fields, including the explicit final-rank/order-unknown representation for save imports. Canonical JSON matters; compressed bytes may differ by browser. Use its unknown-field rejection, size bounds and raw-deflate feature detection rather than a second codec. All fields validate before their owning transfer ships.

The [link spike](../../../local/update-0-16-3/research/planner-link-encoding-20261011.md) measured complete links at 516–569 characters for level 30 and 818–866 for level 60 with four members; these are fixtures, not universal limits. A fragment avoids sending the build to the host request path but recipients, history and clipboard can retain it. Explain that boundary; compression is not encryption. Include no names, inventories, bank data, journeys or raw save contents.

## Risks / Trade-offs

- Structural compatibility can outlive or precede a particular game version. → Field-specific evidence and explicit version-unknown warnings, not inferred age.
- Research saves contain no positive talent-spend or active-party case. → Separate gates remain mandatory despite identity hand-off being possible.
- A large registry or missing gear join can exceed safe parsing or leave partial data. → Evidence-based bounds, clear errors and preservation of known facts.
- A new publication can change identifiers or grouping. → Exact build binding, ambiguity retention and recomputation before claims.
- Explicit adoption persists selected build facts even though progress remains tab-only. → Explain the boundary before adoption and sharing; clearing progress is not deleting a browser character.

## Migration Plan

Research proceeds alongside foundation and talents, then party, then gear. Implement verified progress parsing and identity-only preview hand-off first; dependent transfers ship only after their capability and evidence gates pass. No previous save-progress storage or legacy planner-link format needs migration.

Build and compare a catalog candidate against the accepted catalog ID above, then publish and stage its matching publication. Review graph/update parity and browser flows at 1440 px and 390 px. Before joint acceptance, record provenance, checks, risks and rollback in an audit JSON and review the update report. Keep prior accepted catalog/publication artifacts and roll the pair back together on mismatched identity or incorrect claims. Document the research profiles, picker help, privacy/adoption boundary and reproducible operator scan, capture, catalog, publish and accept-update workflow in existing project guidance.
