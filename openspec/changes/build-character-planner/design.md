## Context

See proposal.md for motivation and scope. The baseline is Afallon 0.16.3, Steam build 25653798, accepted catalog `d5b0b4b3e2161010e0de6fff10a2be305063990eb7c139080a9eb844edee0e15`. Published race offers contain six playable classes; captured Berserker is not offered. The accepted playable scope has 28 trees and 730 nodes. Current class documents omit per-rank costs and intermediate bonus rank data; their text is not a talent evaluator input.

The approved plan is `local/mood-board/planner/notes.md`, Spec Plan. Evidence is in `local/update-0-16-3/research/planner-{link-encoding,talent-order,party-data,save-structure,gear-context,site-integration}-20261011.md` and `adventurer-generation-20261011.md`. The 115 roster adventurers are fixed authored identities; current levels, gear and journeys are per-character save state, not static roster facts.

## Goals / Non-Goals

**Goals:** One foundation contract for characters, previews and complete build transport; deterministic, evidence-qualified talent editing; safe browser persistence and lightweight prerendered-site integration.

**Non-Goals:** Account/cloud sync, variants inside a character, actual historical level reconstruction, simulated refunds, save parsing, equipment or party evaluation, best-in-slot advice, rankings, recommended teams or predicted outcomes. `plan-party` / `party-planner`, then `plan-character-gear` / `character-gear`, extend the workspace through their own capabilities. `show-save-progress` / `save-progress` performs independently gated save transfers alongside this work.

## Decisions

### Publish complete route-scoped planner facts

Use the existing contracts/publication graph and loader to publish offered races/classes, valid offers and level bounds, all linked trees and stable node indexes, positions/icons, complete per-rank costs/limits, default learned ranks, point types/base grants, raw node predicates and separately identified rank use/effect requirements. Do not parse class-page text or infer intermediate costs from endpoints. Compare directly with the accepted catalog and class documents; preserve missing facts as named gaps. The completed October 3 requirement/cost/grant investigations remain the behavior basis, rechecked for accepted-build parity.

The purchase evaluator distinguishes verified, blocked and unverified from preview/committed state. Mandatory and optional-count predicates use the confirmed native rules. Free starting ranks seed replay; external knowledge or future predicates without evidence remain unverified. Point types never share balances. Base Talent Points are `min(180, 1 + 3 * (level - 1))` for this build, not proof of full game-earned totals. Heroic Essence is activity-earned and `maxPoints: 0` is not a zero available balance. Unknown input stays Incomplete or Not Verified. Alternatives rejected: shipping a page-text parser, interpolating costs, or treating unknown modifiers as zero.

### Separate collection, workspace and context

Use one versioned browser collection envelope with local character IDs, reader names, complete canonical builds, source catalogs, collection and per-character revisions, one active ID for a nonempty collection, optional classless setup draft and a migration marker. The local identity/name is not public build identity. The header uses only a lightweight summary; evaluators and publication loaders are not dependencies of the storage module.

The planner normally edits the active character; a link or save handoff uses an isolated preview plus Undo history. Explicit Save as New Character creates a named entry without silently activating it. Explicit Replace (name)'s Build captures target ID/revision and can be undone. Duplicate creates a distinct identity; rename changes only local metadata. Deleting an active entry presents a surviving-character choice before deletion; deleting the last entry yields an empty collection. Undo restores the entry and prior active selection. Class-page entry carries a public class key into setup/preview, never implicit adoption. Alternative rejected: a singleton character, automatically adopting links, or storing multiple competing character levels.

### Serialize persistent mutations and preserve conflicts

Use a named Web Lock to serialize same-origin collection mutations. Inside the lock, reread and validate the latest envelope, check the expected character revision and captured target ID, then merge the intended mutation and increment revisions in one write. Different-character edits merge; same-character stale edits become explicit conflicts with a preserved local draft. Active selection changes use the latest collection without retargeting delayed actions. Foreign storage events apply read-only without subscription-write echo; key removal invalidates persisted state while retaining unsaved local work for export. Async page actions also capture document/publication identity and discard stale results.

Catch both the localStorage getter/getItem and setItem paths. The foundation implementation fixes the unguarded initial reads at `apps/site/src/lib/reader-levels.ts:31` and `apps/site/src/lib/reader-gear-score.ts:13`; these planning edits do not touch those files. A successful write acknowledges only its committed revision as “Saved in this browser”. Denial, quota failure, malformed stored state or unavailable Web Locks retains editable tab memory with “Not saved in this browser” and export. No supported atomic serialization means no persistent read-modify-write attempt: revision checks alone are not compare-and-swap. Cross-tab guarantees are not promised in this fallback. Alternative rejected: whole-envelope last-writer-wins and optimistic writes without a lock.

### Migrate level once, preserving skills

Guard all reads before initialization. When no new character/draft exists and migration has not completed, copy only `character` from `compendium.reader-levels.v1` into a classless draft. Commit the new envelope and migration marker before removing the legacy character property; retain every `skill:*` property. If either write fails, preserve the old data and make retry idempotent. A committed marker prevents repeated migration even if cleanup failed. All direct consumers and shared LevelControl character IDs use the same level adapter, including progression, loot, home, NPC and progression-answer controls. With an active character they edit that character; otherwise they edit the draft. Skill controls and calculator-local settings remain independent. Page clamps are display-only. Alternative rejected: copying the legacy value on every New Character or keeping a shadow saved level.

### Preserve order without claiming history

Internally retain individual Talent Point increments in exact reader order, including zero-cost purchases; serialize only adjacent equal tree/node increments as runs. Free defaults are initial facts. Heroic Essence stays as final ranks, deliberately not a purchase timeline. Minus, Reset Tree, Reset Build and Undo edit and replay the retained sequence; they do not imitate modifier-dependent game refunds. Later blocked dependencies remain visible.

The ordered ledger sits beside the web on wide screens. Earliest With Base Talent Points projects the ordered prefix using base grants, verified defaults, costs and gates. Stop the affected stream at blocked/unknown prerequisites; never reorder cheap picks around them. Zero costs still require gates; cap at published levels instead of inventing level 61. Entered current totals have no earlier grant schedule. Heroic allocations have no level. For verified save imports, carry a final rank map with explicit unknown order, separate from any later reader-authored hypothetical order. No sorted ranks are invented as history. Alternative rejected: “your build at level N”, sorting purchases, and overlaying final Heroic ranks onto every level.

### One complete fragment format and portable collection file

The foundation owns `/planner/#build=v1.<payload>`: canonical compact UTF-8 JSON, raw deflate, unpadded base64url. Use compact fields/native IDs, a stable tree table and frozen placement/member/role codes, not publication row offsets. The semantic field contract lives in `specs/character-planner/spec.md`; freeze the exact compact schema and unknown-order snapshot discriminator in the codec implementation and contract fixtures before consumers ship. Canonical unordered collections sort by stable identities; purchase runs retain order. Known-order and unknown-order states must be mutually exclusive, with a final snapshot for unknown order. Omitted random values and member levels preserve unknowns. Structural validation covers gear and party now; their capability gates supply semantic validation before their UI ships. Until then retained future fields are visible as unevaluated, not accepted equipment/party checks.

Set defensive transport limits of 16,384 encoded payload characters and 262,144 inflated UTF-8 bytes, enforced during streaming decompression, plus schema collection/run bounds derived from authored rank limits rather than base point count. A valid Hunter example has 184 purchase events: 178 is not a valid event-count bound. Game-semantic numeric bounds (especially corruption and duplicate physical slots) require the owning research gates, not arbitrary character-level limits. Reject unknown fields, unsafe integers, duplicates, malformed/trailing data, unknown versions and dual query/fragment transports. Emit only the fragment format; the unshipped old query encoding needs no migration. Query-only legacy forms explain the supported canonical format rather than decoding an incompatible shape.

Feature-detect both raw-deflate compression and decompression constructors; unsupported browsers get an explanation and usable local editing/export, not a different silently incompatible link. Decode on mount and navigation/hashchange/Back/Forward, clean up listeners, and ignore an unchanged navigation identity on unrelated state updates. Never decode in server load or disable prerendering. Canonical content, not compressed bytes, determines equality: measured browser output differs. The observed complete URLs are 516–569 characters at level 30 and 818–866 at level 60 including four members; these are fixtures, not worst-case guarantees. Copy Link reports clipboard success and contents. Fragments do not reach the host request but still exist in history, scripts, clipboard and recipients; deflate is not encryption/authenticity.

Use a distinct versioned export envelope holding every character, active selection and full builds. It is not an export of only the active link or a save file. Validate before rendering an import diff; explicit choices resolve local identity collisions, additions, replacements and active selection before one transactional application. Include tab-only edits in export and never import partial files. Alternatives rejected: uncompressed query builds, comparing compressed bytes, overwriting on import, and substituting names for unresolved native identities.

### Prerender first, enhance only after action

Keep static `/planner/` and reference pages under existing prerender/trailing-slash policy. Initial markup is neutral; mount reads local context. The header must not pull evaluator, roster, item-list/directory, talent payload or search-index dependencies. Update labels/results in reserved space without remounts or focus/scroll changes. Reuse existing visual components, tree web/list and EntityLink navigation, preserving the plan when following references.

Reuse the validated publication loader with current layout publication identity and typed context descriptors; do not trust paths/hashes in browser builds. Party and gear changes publish small action-loaded lookups. Reject mixed old/new publication resources with a data-changed/reload path; retain source catalog provenance and unresolved selections. Do not eagerly resolve every saved character on switching. Inspect actual route chunks and ResourceTiming rather than assume dynamic imports are sufficient. Alternative rejected: putting the full search index or all build evaluators in the header, request-time personalization, or a second unchecked fetch/cache.

## Risks / Trade-offs

- Web Locks are unavailable in some contexts: safe persistence gives way to visible tab-only editing and export rather than silent data races.
- Source-catalog defaults or references may disappear: preserve raw choices and provenance, explain unresolved replay, and warn before deliberate omission when copying.
- Full per-rank facts cost bytes: keep them route-scoped and measure final resource/chunk and hydration costs, not just gzip projections.
- Compressed input can inflate aggressively: bound before parse and while decompressing; compression has no authenticity guarantee.
- Unknown save history and external game inputs restrict verified statements: independent capability gates prevent partial evidence becoming a complete legality/readiness claim.

## Migration and Acceptance

Implement foundation and talents first, then party, then gear; save research runs alongside. Stage from the accepted catalog, create a candidate only for required new facts, and review provenance and unrelated variations separately. Before official data acceptance, record provenance, verification checks, risks and rollback in JSON; retain the prior publication and synchronize development/preview on acceptance. Browser acceptance covers denied reads, failed writes, no locks, simultaneous edits, migration, fragment navigation, focus and resource boundaries as listed in tasks.md. Runtime/browser results still need exercising during implementation; the spikes do not prove those outcomes.
