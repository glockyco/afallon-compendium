## Context

See `proposal.md` for motivation and scope. This is completion of an architectural cutover, not replacement of the stack or a new product direction.

### Observed implementation and measured evidence

- `apps/compendium-cli/src/catalog.ts:134-168` admits only extract/traverse manifests and reconstructs legacy artifact paths. `scan.ts:69-83` emits the current artifact-run contract with `operation: scan`.
- The 1,098-line catalog command imports run and spatial helpers from capture and writes its database directly. It does not invoke `packages/catalog/src/assembly.ts`.
- `packages/catalog/src/database.ts:451-455` registers placement identities before the main population transaction.
- `apps/compendium-cli/src/publish.ts:51-85` inserts imagery into a writable input catalog before evaluating its gate.
- A read-only review probe of the real gate returned `accepted: true, complete: true` for an empty in-memory catalog. The publication builder separately rejects an empty map set. This is a gate-contract defect, not evidence that an empty deployment succeeded.
- A scan-state probe using `/dev/null` as the output directory produced an initial directory error and then an erroneous already-processing error. Preparation occurs after the active flag is set but before its cleanup scope.
- The retained `local/publish-smoke-publication` has 19 maps. Startup JSON totals 6,799,479 bytes: map shards 3,278,333, imagery metadata 1,249,463, entity search 518,802, item search 1,752,579, plus coverage. These are uncompressed bytes, not measured wire transfer. The total excludes root, images, and application code.
- The retained `local/static-parity.sqlite` has 2,057 canonical entities, 7,172 placements, 21 map spaces, 11,935 unresolved issues, and 15,338 issue occurrences. These are local observations, not production completeness claims.
- Dependency analysis passed across 197 modules and 612 dependencies. It does not prevent domain logic from accumulating in the CLI.
- Runtime owner tokens, native callbacks, frame restoration, cancellation, and cleanup receipt checks already exist. They remain safety invariants.

### Specification precedence

The main specification tree is empty. Capability definitions remain in `build-screenshot-first-map` and `rebuild-project-architecture`. This change adds uniquely named requirements at their existing capability paths and introduces `coverage-accounting`.

Preserve the user's confirmed current behavior: game imagery is default, captured terrain is opt-in and overworld-only, all maps share one world, and detail/authoring panels remain development-only. Coverage diagnostics remain in operator artifacts. This supersedes the old config's capture-primary statement and the static-publication scenario that demands a visible incomplete-preview notice. Older vendor-detail scenarios apply to development inspection, not a new production detail panel. World coordinates remain shared across imagery changes, not separate illustration coordinate spaces.

Structural plan validation occurs before runtime acquisition. Discovery-dependent validation occurs under the owner before target mutation. This clarifies the older scan requirement that places all target validation before ownership, even when target discovery itself requires the runtime.

During closeout, reconcile the conflicting pending text and config without erasing still-open product work. Before sync or archive, resolve the then-current main tree and preserve unrelated requirements. Do not archive either older change merely to satisfy this change's dependency bookkeeping.

## Goals / Non-Goals

**Goals:**

- Give each stage one production input contract and one implementation owner.
- Make evidence and catalog identity independent of local directories.
- Make invalid data, incomplete cleanup, and missing coverage unable to become successful selected output.
- Preserve stable authored identities and verified Afallon semantics through a clean cutover.
- Reduce essential reader startup data without an active-map model or omitted records.
- Prove the fresh scan-to-browser path, not only isolated package fixtures.

**Non-Goals:**

- No server, queue, plugin registry, generic game framework, or replacement of Bun, SQLite, TypeBox, HotRepl, SvelteKit, or deck.gl.
- No permanent game mod, new runtime protocol, floor model, automatic clipping, inferred probability, or new gameplay research claim.
- No production evidence panels, coverage banners, new public detail panel, or unrelated guide redesign.
- No automatic deployment to production. Verification uses local/static preview and a deployment dry run unless deployment is separately requested.
- No claim to resolve every retained research issue. This change builds enforceable coverage accounting and proves it on bounded evidence. Unresolved real-world obligations remain visible to operators and block complete release.
- No generic garbage-collection deletion service. Extend verified reachability reporting and retain the existing conservative deletion boundary.

## Decisions

### 1. Keep package boundaries, but enforce semantic ownership

Keep the seven packages and two apps. The CLI owns parsing, config resolution, and invocation only. Catalog ingestion, normalization, assembly, queries, and gates belong in `packages/catalog`.

`packages/contracts/spatial` owns pure coordinate frames, membership resolution, and reviewed layout types/functions shared by capture and catalog. File reads, hash verification, and profile loading belong at the artifact/application boundary, not in pure spatial code. Catalog must not import capture to obtain those facilities.

Expose narrow application operations and read-only queries. Keep candidate mutation helpers internal after callers migrate. Use package exports and dependency checks to reject cross-package internal paths. Verify exported-symbol callers through the language server during implementation.

Alternative rejected: another workspace-wide folder rename. Existing ownership units are sufficient. The defect is bypassing their boundaries.

### 2. Use one immutable object and run model

Retain the content-addressed object store and `ArtifactRunManifest` as the production lifecycle. Remove the separate copied-run lifecycle in `packages/capture/src/runs.ts` after all consumers migrate. Keep a bounded importer only during the migration and remove it from production exports at cutover.

A run has immutable identity and validated initial settings. Append-only revisions register planning evidence, outputs, outcomes, and final diagnostics. Initial fingerprints include declared plans, build, schemas, settings, and executable closure. Runtime-discovered inventory is retained as output evidence, not smuggled into an initial cache key after execution.

Fresh scans are observations and do not reuse an entire live scan solely because a plan matches. Explicit downstream reuse and capture checkpoint reuse require complete compatible inputs and verified cleanup. Probe and native-owner source dependencies participate in executable fingerprints through explicit imports, not hidden dynamic reads or manually maintained lists.

Create an admitted run before runtime evidence preparation. Argument/schema failures can occur before admission without touching the game. Acquire an active lease before newly written inputs can become collectible. All preparation and finalization paths release host flags and resources inside their cleanup scopes.

Separate terminal execution status from reference selection. A verified successful manifest can remain unselected when pointer replacement fails. Report that failure without calling fail on an already terminal run. Readers never treat a running revision as successful. Interrupted records remain inspectable and can be diagnosed without pretending their native cleanup succeeded.

Use object identities and logical names for persistent references. Scratch files are implementation details and may disappear after finalization. Hash verification streams bounded chunks. The target chunk budget is at most 1 MiB, excluding small metadata. Avoid repeated whole-file buffers when sealing large SQLite objects.

Retention traces input and output identities, referenced source manifests, selected catalog/publication roots, and active leases. Publications record their generated resource closure in their run outputs. Reporting fails on broken reachable references rather than classifying them as garbage.

Alternatives rejected: per-command manifests, database-backed blob storage, filesystem paths as durable identity, and whole-repository fingerprints. They either preserve the current incompatibility or invalidate unrelated work.

### 3. Make scan envelopes sufficient for catalog ingestion

Preserve the closed current-scene/build-scene/stream-source target union and game-specific state machine. Define each target envelope as the authoritative mapping from family to schema, immutable reference, observation context, and applicability disposition.

Register planning inventory and its validated character/scene context before traversal. Record the resolved target set against that inventory. Validate request structure before connection, then resolve discovery-dependent targets under ownership without scene or stream mutation. Reject unknown targets before traversal.

Ingestion resolves families from envelopes, not `target-N` directory spelling. It rejects duplicate or missing applicable families and build/context mismatches. Keep canonical evidence selection explicit in the catalog plan when several targets export global families. Do not silently choose whichever target is encountered first.

Successful observations can be bounded. A successful bounded scan is valid evidence for an incomplete preview catalog. A failed run remains audit evidence, not normal successful catalog input with its failures removed. Operator retry creates a new successful bounded run and preserves the original failure.

Preserve restoration behavior appropriate to each operation: scan restores its promised initial scene/pose, while capture preserves its explicitly configured known-good final scene policy. Do not impose a single restoration destination on both workflows.

Alternative rejected: allowing the new operation name in the old manifest reader. The old artifact families and path assumptions also differ, so that would only conceal the boundary mismatch.

### 4. Move capture completely onto registered evidence

Capture retains its existing game-specific readiness, lighting, suppression, camera registration, and stream-hold algorithms. Change evidence plumbing, not verified rendering semantics.

Checkpoint compatibility includes build, character, plan, spatial inputs, visual/readiness settings, executable fingerprint, raster identity, and cleanup references. Resolve sweep and native cleanup artifacts from verified store references. Never read `settings.sweepManifestPath` or an arbitrary host path as authoritative restoration evidence.

Move source-hold acquisition and every later readiness step under a cleanup scope. Register available cleanup evidence on early failure. A checkpoint becomes reusable only after both visual restoration and stream cleanup pass. Preserve unaffected per-tile reuse when unrelated tiles are added.

Pyramid resources enter the store directly and finalize through the common lifecycle. An interrupted pyramid cannot replace selected imagery. Verified-empty cells remain distinct from failed or unexplored cells. Game-map availability is independent of optional overworld capture success.

Alternative rejected: retaining a compatibility wrapper whose return values promise scratch files that are deleted on finalization. Consumers must adopt immutable references at the boundary.

### 5. Establish typed domain decoders and one catalog assembly API

Use four representations deliberately:

1. Raw evidence, including retained opaque fields.
2. Decoded supported domain facts.
3. Canonical relational rows.
4. Small public projections.

Raw envelope validity is not proof that every `gameplay` field is usable. Define decoders for each field consumed by spawn, merchant, loot, quest, resource, transition, guide, and spatial rules. Report object identity, target/family, and record pointer on failure. Preserve unknown fields as evidence, not trusted facts. Keep unknown semantics explicit instead of defaulting to empty arrays or null relationships.

Use native IDs within build-scoped entity identity, serialized source hashes and path IDs for authored identity, and run/target context for observations. Preserve signed serialized path IDs as strings. Keep source scene, map space, and named region separate.

Use explicit domain tables for spawn candidates, stock, loot, quests, resources, and transitions. No universal relation table or EAV schema. Frequently queried fields and references become constrained columns. JSON remains for opaque evidence or explicitly rebuildable projections.

Move all normalization out of `apps/compendium-cli/src/catalog.ts`. Split it by domain inside catalog while sharing a typed ingestion context. Preindex joins once rather than scanning all relations per entity. Public projections may be materialized for measured speed but have no independent write path or input authority.

Evidence pointers use source record indices or keys, not native IDs as array offsets. Derived records carry a stable rule/version plus all input references. Coverage occurrence lineage retains actual source runs and source keys.

Alternative rejected: mechanical replacement of `any` with `unknown` plus casts. That preserves unchecked semantics under different types.

### 6. Seal all catalog inputs in one candidate transaction

The catalog plan references successful scan manifests and selected target/family identities, reviewed spatial/profile objects, imagery registrations, and a coverage policy/review object. Store those inputs before assembly and hash their canonical identity map.

The assembler performs input verification and decoding before database mutation. One transaction owns identity registration, facts, relations, imagery metadata, coverage, and catalog metadata. Run foreign-key and domain checks before commit. Close and checkpoint the candidate so no required WAL state remains outside its registered object.

The logical identity hashes build, catalog schema, validated input identities, reviewed settings, and assembler fingerprint. It excludes local paths, run timestamps, and incidental SQLite page layout. Register the closed database as an immutable content object, then select its successful run reference. Record its independent byte hash and size.

Public APIs do not expose a second direct-population route. Consumers open the catalog read-only. Adding imagery or reviewed decisions means assembling a new catalog, even if other evidence is unchanged.

Alternative rejected: making publication's imagery inserts transactional. That would reduce partial writes but still mutate a supposedly identified input and omit imagery from catalog identity.

### 7. Model positive coverage obligations

Add the following catalog concepts alongside existing issues and occurrences:

- `coverage_reviews`: build, inventory identities, hashed policy, reviewed scope, reviewer/review identity, and closure evidence.
- `coverage_obligations`: stable identity from build, stable subject, artifact family, and policy-relevant discriminator.
- `coverage_dispositions`: obligation, state, evidence references, originating run/target, and review reference when required.

An obligation has one effective evaluated disposition and retained attributable history. Policies enumerate accepted states rather than providing an unrestricted ignore list. Required reachable gameplay sources cannot be waived merely to clear a gate.

`verified` and evidence-backed `not-applicable` satisfy applicable obligations. A reviewed exclusion is acceptable only when evidence places the source outside the declared required universe. Unsupported, unreachable, failed, and not-attempted required obligations block completeness. Optional captures have their own obligations and summaries without blocking the game-map policy.

Discovery closure binds to exact inventory identities and a complete accounting of discovered sources. New required sources or changed inventory invalidate closure until reviewed. A bounded observation never automatically asserts closure. The complete gate requires closure, valid identities, reference integrity, spatial registration, and all required obligations satisfied.

Remove the unconditional incomplete sentinel after positive accounting exists. Preserve actual unresolved issues. Compute final counts from sealed tables, not mutable intermediate arrays. Keep issue identity separate from observation count and obligation count.

Use synthetic complete fixtures only to prove the positive gate. Real retained or fresh bounded evidence remains preview until its actual obligations pass. No task is permitted to edit away research blockers or declare a build complete from fixture results.

Alternative rejected: `requiredSourceKeys: []`, zero issues, or zero exclusions as a proxy for discovery closure. Those conditions cannot prove that anything was inspected.

### 8. Compile publications without mutating facts

The publication application accepts a sealed catalog reference, mode, and immutable reviewed presentation settings. Imagery metadata is already cataloged. Open the catalog read-only and verify its byte identity before use.

Use batched ordered catalog queries for public projections. Keep runtime/extraction semantics in catalog, while labels, marker presentation, and resource grouping belong to publication. All geometry uses explicit coordinate types: source world XYZ, map XY, and atlas XY. The pure spatial boundary performs transforms once. Optional authoring deltas are applied consistently by frontend selectors and renderer.

Replace recursive filename-pattern discovery with schema-specific resource-reference traversal. The declared graph checks expected resource kind, hash, size, build, catalog, and path safety at every edge. Validate nested entity/item/guide references, map parts, optional geometry, and imagery. Resource reachability is independent of object string formatting.

Generate a candidate, verify all references and the applicable gate, then atomically select it. Candidate materialization supports publication roots on another filesystem through bounded verified copies rather than assuming hard links always work. Identical selected content can be reused only after verification. Preserve the previous selector on any failure.

Public resource identity excludes operational timestamps. Operational run manifests retain timing separately. Repeat compilation after store relocation must produce equal resource and root hashes.

Alternative rejected: reader-side catalog queries or a hosted API. The data set remains suited to static files, and a server would add an unnecessary runtime dependency.

### 9. Define concrete reader resource budgets

Freeze the retained preview by root hash before implementation measurements. Preserve its complete public semantic content while changing transport shape.

Adopt these initial budgets for that representative publication:

| Resource | Uncompressed JSON budget |
| --- | ---: |
| Root manifest | 64 KiB |
| Each essential atlas, search, or optional geometry part | 512 KiB |
| Essential atlas startup total, including root and imagery metadata | 3,300,000 bytes |

The essential-resource target is below half the observed 6,799,479-byte combined dependency. This accounting group excludes search, selected details, geometry, images, and application code. Map-data readiness also requires geometry, even when its display is disabled. Report actual map-ready transfer separately from the essential-resource budget. Moving bytes does not reduce total publication size.

If one map exceeds a part budget, publish multiple deterministic parts under its manifest entry. Compose all maps and all essential parts. Keep compact placement IDs, positions, marker categories, names, and required relation indexes in essential data. Store movement and connection geometry in separate resources, but load them before map-data readiness. Load shared-world imagery registration without selected-detail bodies. Split large search resources into bounded parts and load them as a separate feature.

Root readiness does not promise all markers are loaded. Show map-data loading until all map parts and declared geometry settle. Do not create an active-map selector. Renderer startup does not wait for search or selected details.

Budget failure triggers schema/projection optimization, not missing records or relaxed acceptance. Report raw bytes, actual compressed transfer, request counts, and first usable map/search timings independently in the same browser setup. No fixed wall-clock threshold is asserted across different machines.

Serve `/data/resources/*` and `/data/assets/*` with immutable caching. Give `/data/publication.json` and deployment selector metadata revalidation policy. Verify actual response headers on the preview/deployment surface, not only source configuration.

Alternatives rejected: a new search worker, custom binary format, or viewport-only publication as the initial solution. Compact projections and correct loading boundaries are the first step. Any further mechanism needs measured evidence and a separately justified scope.

### 10. Give URL state and resource effects one owner

Keep the existing canonical URL vocabulary. Separate:

- serializable URL state: query, categories, layers, selected identities, view snapshots.
- resource state: idle/loading/loaded/failed, per resource key.
- transient UI state: hover, panels, focus, authoring drag.

One atlas controller applies initial navigation, direct actions, popstate, and programmatic navigation through the same transition/effect path. Resource requests deduplicate by immutable reference. Rejected requests leave a retryable failure state rather than a permanently cached rejected promise. Selection generations prevent stale completion/error handlers from changing active loading indicators. Keep useful verified results cached even if their initiating selection changes.

Build immutable identity and search indexes once per loaded publication resource set. The renderer receives prepared immutable geometry and style/selection inputs. Use stable data references and update triggers rather than recomputing whole-geometry signatures for hover or selection. The renderer owns its live camera. URL persistence consumes snapshots and does not feed every pointer update back into the renderer.

Retain Svelte components, focused pure layer constructors, and the renderer controller. No additional frontend state framework is needed. Move orchestration and index construction out of `MapExplorer.svelte` so it composes state and components rather than owning parallel event-specific workflows.

Development authoring selectors and rendering use the same effective coordinate function. Keep production panels compile-time gated. Preserve guide resources, category vocabulary, selection highlights, accessibility, mobile behavior, and WebGL fallback.

Alternative rejected: adding another listener or fetch call only to popstate. A handler-specific patch would leave other navigation paths and stale asynchronous effects divergent.

### 11. Verify boundaries before selecting the cutover

Permanent regressions are justified for the reproduced preparation leak, empty-coverage acceptance, transactional rollback, input mutation, broken reference closure, stale asynchronous state, and navigation equivalence. Existing assertions that pin an incidental layout or wording must not be repinned to the new implementation.

Use throwaway executable smoke tooling for successful new behavior and remove it after evidence is recorded. Do not add tests that inspect source text, mock forwarding, or file organization as proof of semantics.

Freeze semantic parity for canonical identities, placements, roles, relations, provenance samples, spatial registrations, map bounds, category behavior, guide records, imagery defaults, and current incomplete coverage. Declare expected differences: manifest/plan formats, object layout, corrected lineage, obligation accounting, resource grouping, and resource bytes. Equal counts alone are insufficient.

Run a fresh bounded current-scene scan, a planned scene target, a streamed-source target where supported, and a representative overworld capture through the actual runtime. Verify restoration through native receipts. Feed fresh successful scan references into the catalog with explicitly registered reviewed inputs and imagery, then publish and stage the static site without local conversion scripts or manual SQL.

Exercise the actual browser for cold startup, delayed/failed search, canonical URL reload, back/forward, rapid selection, retry, full shared-world composition, layer changes, authoring viewport results, production gating, guides, keyboard/mobile use, and WebGL fallback. Record which host/scenarios were exercised. Do not claim runtime or browser proof from package tests.

## Risks / Trade-offs

- [Stricter decoders reveal previously tolerated evidence] -> Preserve raw bytes, report precise paths, and leave the candidate unselected. Do not add coercion to recover prior counts.
- [Legacy evidence lacks target declarations or cleanup proof] -> Import only provable fields and record unsupported evidence. Reacquire required evidence rather than fabricate a successful current envelope.
- [Retaining catalog lineage protects large historical objects] -> Make protection reasons inspectable and retain dry-run reporting. Safety takes precedence over reclaiming bytes.
- [Coverage obligations expose more incompleteness than existing totals] -> Keep previews available when integrity passes and label operator reports by count type. Never hide a required obligation.
- [Progressive loading complicates counts and selection] -> Use explicit per-feature resource states and do not render partial counts as complete results.
- [More resource parts increase requests] -> Enforce the stated byte budgets and measure request count and compressed transfer alongside time to interaction.
- [Runtime mutation remains hazardous] -> Preserve exclusive ownership, verified native restoration, and cancellation behavior before any refactor changes orchestration.
- [Pending specifications contain conflicting policy] -> Apply the precedence above and reconcile only the conflicting requirements before archive. Do not silently claim every older task is complete.
- [One coordinated cutover touches every layer] -> Build a complete thin vertical slice first, expand domain coverage behind the same contracts, then switch selected commands atomically.

## Migration Plan

1. Freeze current source revision, selected references, representative preview root, retained input hashes, and semantic samples as local read-only rollback evidence.
2. Define and version the run, scan-envelope, catalog-plan, coverage, and public resource contracts. Retain existing public URL keys.
3. Establish the common lifecycle and preparation-safe runtime boundary. Import retained evidence through one temporary verified importer with an import report.
4. Build one current-scan-to-sealed-catalog-to-publication vertical slice under unselected candidate references. Do not switch root commands yet.
5. Migrate every supported domain family and capture/pyramid consumer. Verify provenance and parity before removing alternate normalization paths.
6. Add positive coverage accounting, read-only publication, typed resource closure, and budgeted public projections. Keep real incomplete evidence in preview mode.
7. Migrate the site loader/controller/renderer together with the new manifest version. Verify its actual development and production surfaces.
8. Run the full fresh-evidence pipeline and failure scenarios, then the existing checks, dependency validation, applicable tests, and production static build once at integration.
9. Switch CLI plans and selected references only after the evidence passes. Remove legacy readers, duplicate run implementations, direct mutation exports, old schemas, temporary importer, and throwaway smoke scripts.
10. Update operator docs, existing evidence notes, and conflicting pending spec/config text. Verify documented commands against CLI help and record all intentional requirement precedence.

Rollback restores the source revision and prior selected references together. Old and new evidence remain immutable during the rollback window. No reverse database migration is required. Do not push or deploy production as part of implementation without explicit authorization.
