## Context

See `proposal.md` for motivation and the two delta specifications for externally observable requirements.

The audit found these concrete ownership boundaries:

| Area | Current implementation | Consequence |
| --- | --- | --- |
| Publication | `packages/publication/src/selection.ts` and `apps/site/scripts/publication-graph.ts` each walk and validate resources | Deployment omits producer checks for geometry membership, travel agreement, and search/detail relationships |
| Parity | `apps/site/scripts/publication-parity.ts` reads candidate JSON after graph verification | Duplicate reads, parsing, and schema checks |
| Atlas | `MapExplorer.svelte::acceptSnapshot` copies controller fields and `syncUrl` reconstructs them | Two mutable representations must agree |
| Artifacts | `runs.ts`, `references.ts`, and `leases.ts` repeat path validation and temporary-file operations | Similar code hides different persistence guarantees |
| Renderer | `map-renderer.ts` mixes pure projection, layer creation, lifecycle, and interaction | Existing layer modules do not fully own layer construction |
| Deployment | Staging and deployment assertion repeat regular-file traversal, hashing, and JSON reading | File-safety policy can diverge |
| Capture | Capture and readiness repeat schema and finite-number validation | Numeric comparison tolerances differ and must remain explicit |

`extentOfTiles` and `planBox` also calculate the same tile bounds. Existing tests cover publication selection, parity, artifact references, runs, capture plans, readiness, atlas URLs, and renderer replacement.

The controller currently waits for all declared geometry before composing map data. Search remains independent. The current controller configuration deliberately disables inertia. Pending OpenSpec requirements still demand deferred geometry and inertial pan.

The main specification directory is empty. Three unarchived changes contain the existing capability definitions. The repository dependency rules allow the site to import only public contracts, not publication, catalog, or artifacts.

## Goals / Non-Goals

**Goals:**

- Give each semantic invariant and persistent state transition one owner.
- Preserve valid publication bytes, supported URLs, CLI behavior, rendering, artifact identities, and capture decisions.
- Tighten staged-publication acceptance to the existing producer semantics without weakening either boundary.
- Keep shared code within existing domain packages.
- Make differences in filesystem guarantees and numeric tolerances explicit.

**Non-Goals:**

- No generic utility workspace, plugin system, new state framework, or schema migration.
- No new game extraction, capture campaign, coverage claim, imagery migration, or artwork work.
- No production deployment, pushing, archival, or completion of unrelated pending tasks.
- No cross-package consolidation of tiny host helpers, guide adapters, raw schemas, or independent test fixtures.
- No automatic consolidation based on file size or repeated syntax alone.

## Decisions

### 1. Share pure graph semantics, not storage access

Add a focused graph-validation module under `packages/contracts/src/public/` and export it through the existing public entrypoint. It operates on a root and a read-only map of decoded resources keyed by declared path. Use the existing schema, edge, and identity helpers rather than introduce another registry.

The shared validator owns relationships among verified values: coverage, map and part identity, placement uniqueness, geometry membership, travel agreement, imagery defaults, and search/detail identity. Shared contract-level reference and budget checks remain pure. Define shared budget constants once without changing their values or accounting categories.

Storage readers retain their own graph traversal and byte verification because their inputs differ. They reuse `staticResourceEdges` and the same reference rules. The producer retains catalog-gate checks, candidate inventory checks, store verification, and reachability checks. The staged reader retains path allowlisting, containment, regular-file checks, hashing, WebP signatures, and file inventory checks. Both readers invoke the shared semantic validator before returning success.

The resulting verified graph contains the root, decoded resource map, and reached references. The staged wrapper adds its root hash and reached-file set. Parity consumes this result instead of reopening candidate resources. The baseline remains independently read and validated in its existing format. Do not add a legacy-format reader beyond the current baseline reader.

Keep artifact verification immediately before materialization and staged-file verification after the build. Reusing decoded resources within one validation operation must not remove checks across mutation boundaries. Do not cache verification across runs. Do not retain binary imagery buffers in the decoded graph.

**Alternative rejected:** Importing publication into site scripts violates current dependency direction and risks pulling catalog, artifact, and image-processing dependencies into the site. A generic reader framework would add machinery without eliminating host-specific checks.

### 2. Keep one accepted atlas snapshot and one live camera

`AtlasController` owns accepted persistent state. `MapExplorer.svelte` stores one snapshot and derives template values from it. Remove writable mirrors and the inverse full-state serializer. Readonly local aliases are acceptable for Svelte reactivity, but they must not become additional state owners.

Use existing focused actions where their semantics are complete. Add atomic domain actions only where one user operation changes related fields together. Preserve item-to-source context, placement selection, entity selection, detail close behavior, and query-clearing rules. Reserve full-state replacement for initial URLs and history restoration.

Timers dispatch only their intended field updates against current state. Navigation cancels or invalidates pending input and camera persistence. Preserve the current push-versus-replace policy. Do not create intermediate history entries while clearing related fields.

The component keeps transient hover, panel collapse, focus origin, authoring state, renderer status, and necessary input drafts. Deck owns the live camera. Camera callbacks update a view snapshot for debounced persistence, not a second continuously controlled camera. History restoration and explicit fit/zoom commands remain the only external camera-setting paths.

Resource data remains owned by the controller and loader. Preserve stale-response suppression, retries, disposal, layer normalization, and independent search/detail readiness. Do not refactor unrelated loader caching.

**Alternative rejected:** A new Svelte store or global state library would wrap the same duplication. Keeping component-owned full state would leave the controller as a second authority.

### 3. Reconcile pending specifications without completing unrelated work

During implementation, reconcile these exact sources:

- `complete-evidence-pipeline-architecture/specs/interactive-atlas/spec.md`: replace the deferred-geometry clauses and toggle-fetch scenario with eager readiness.
- Its `design.md`: distinguish the existing essential-resource accounting group from actual map-ready transfer, which now includes geometry.
- Its relevant tasks and `static-publication` delta: remove statements that equate accounting categories with deferred network loading.
- `build-screenshot-first-map/specs/interactive-atlas/spec.md`: replace the inertial-pan scenario with non-inertial behavior.
- Its design and task 6.9: align gesture acceptance without marking unrelated tasks complete.
- `openspec/config.yaml`: align the stale capture-first context with the existing game-map default and optional captured terrain described in `EXPLORATION.md`.

The new delta requirements are additions because no main specification exists. Existing pending requirement titles remain intact when their conflicting clauses are reconciled. This change is authoritative for those specific conflicts. Synchronization or archival remains a separate workflow after reconciliation. Do not duplicate complete predecessor specifications or archive predecessors merely to make this change fit.

Preserve the existing 3,300,000-byte essential-resource budget definition. Report actual map-ready bytes separately, including geometry. Record current geometry bytes and request counts during browser verification rather than turn the observed 19-map inventory into a permanent constant.

**Alternative rejected:** Leaving contradictions in older changes would permit future work to restore the regressions. Archiving every pending change would imply unrelated acceptance work is complete.

### 4. Centralize artifact filesystem invariants locally

Introduce a private artifact-filesystem module for path-segment validation, errno checks, and focused persistence primitives. Migrate callers in runs, references, leases, store, and garbage collection only where they enforce the same invariant.

Provide named immutable-create and atomic-replace operations. Immutable creation uses exclusive temporary creation, canonical run serialization, file synchronization, final permissions, and no-replace installation. Replacement uses exclusive temporary creation, file synchronization, atomic rename, and the required directory synchronization. Lease creation retains no-replace behavior, while updates use replacement. Keep serialization at the caller boundary where current bytes differ.

Do not collapse these guarantees behind a boolean-heavy `writeJson` function. Preserve existing output bytes, modes, no-clobber behavior, selector scope, and error propagation. Cleanup must not hide the primary failure. Directory durability operations must describe what was actually synchronized, especially after installation. Verify supported-host behavior through temporary-directory operations. Do not claim power-loss durability from a process-level smoke test.

**Alternative rejected:** Copying only `isErrno` into another file saves little. Combining the related filesystem invariants creates a useful package boundary without a global utility package.

### 5. Complete the renderer boundary without changing rendering

Move pure placement, area, movement, and region projection into a focused `map/render-data.ts` module or the closest existing domain module. Move remaining Deck constructors into the existing `map/layers/` organization. Keep Deck initialization, resize, pointer lifecycle, camera, hover orchestration, and adapter replacement in `map-renderer.ts`.

Move shared record types to the projection boundary so layer modules do not depend on the renderer implementation. Tests import the actual projection operation instead of a test-only wrapper. Keep `createMapView` as the only controller-configuration constructor.

Preserve stable layer IDs, data references, update triggers, picking behavior, coincident-marker grouping, hover isolation, authoring offsets, and resource disposal. Do not rebuild all data for style changes or add copying wrappers merely to move code.

**Alternative rejected:** One module per helper would fragment the rendering flow. Keeping all constructors in the adapter would leave the existing layer ownership incomplete.

### 6. Share deployment filesystem policy

Create a focused site-script module for recursive regular-file enumeration and related file integrity operations. Both staging and deployment assertion use it. Preserve symlink rejection, contained paths, deterministic inventories, existing limits, and the validation-before-copy order.

Keep deployment command orchestration in its scripts. Do not extract the two small process-launch wrappers unless the same module would otherwise duplicate substantive command policy. JSON parsing helpers must not imply schema validation where none occurs.

**Alternative rejected:** A broad `utils.ts` would combine unrelated deployment and subprocess responsibilities.

### 7. Share capture validation and tile bounds without changing policy

Use a private capture validation module for schema assertions and recursive finite-scalar checks. Keep error context at callers. Reuse existing contract decoding only where its registered-schema and artifact-context requirements actually match.

Keep the relative tolerances explicit: capture-frame validation uses `1e-6`, while readiness uses `1e-5`. Preserve the existing scale calculation. Name policies or pass the tolerance explicitly rather than select a new global epsilon.

Move tile-bound calculation to a shared capture-geometry operation consumed by planner and position selection. Calculate all four bounds in one pass without temporary coordinate arrays. Preserve declared standing-box precedence and the nearest-walkable-point selection. Validated plans remain nonempty, and callers retain their existing empty-input behavior.

**Alternative rejected:** A generic numerical library adds dependency weight and hides domain-specific tolerances.

## Risks / Trade-offs

- Stricter deployment validation can reject retained malformed publications → Exercise the selected candidate and retained rollback publication before switching readers. Do not add bypass flags.
- A shared validator can omit a former check → Map every producer and deployment invariant to its new owner and exercise representative corruptions at both boundaries.
- Decoded graph reuse can increase retention → Retain JSON only for the validation/parity operation and exclude image bytes.
- State consolidation can change history or input timing → Exercise pending-query and pending-camera races in the real browser, including Back and Forward.
- Renderer extraction can alter references or picking → Check stacked markers, hover, authoring, mobile gestures, and repeated mount/dispose in the browser.
- Filesystem operations can differ across hosts → Preserve no-replace and atomic-replace semantics with temporary-directory checks and record host limitations.
- Shared capture helpers can erase policy differences → Check a numeric value accepted at `1e-5` but rejected at `1e-6`, plus explicit standing-box precedence.
- Pending specifications can still conflict after synchronization → Reconcile all named clauses before any archive or synchronization workflow.

## Migration Plan

1. Implement publication semantics and reader integration as one verified unit. Preserve the selected publication and use isolated staging output.
2. Consolidate controller/component state, then verify browser navigation before renderer extraction.
3. Reconcile the named planning conflicts with measured loading and gesture behavior.
4. Consolidate artifact primitives, renderer boundaries, deployment helpers, and capture helpers as separate verified units.
5. Run targeted existing suites for each unit. Add permanent tests only for plausible semantic drift, state races, or boundary failures.
6. Run the repository type, dependency, test, and site-build checks after integration. Smoke-test publication staging and the actual browser interface.
7. Update affected documentation after behavior verification. Remove throwaway scripts and superseded implementations, then inspect and commit each coherent unit.

No data migration or publication schema change is required. Rollback reverts the corresponding code unit and uses the retained valid publication. Production deployment and specification archival require separate user requests.
