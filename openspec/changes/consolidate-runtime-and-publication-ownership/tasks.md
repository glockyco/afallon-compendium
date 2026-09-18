## 1. Publication semantics and verified resources

- [ ] 1.1 Move shared semantic checks and contract-level budget constants into `packages/contracts/src/public/`. Export through its existing entrypoint. Verify a check-by-check mapping from both current validators, including coverage, map parts, geometry, travel, imagery, and search/detail identity.
- [ ] 1.2 Integrate the shared validator into producer selection and staged-file verification. Preserve catalog gates, candidate inventories, byte verification, containment, WebP checks, and post-build verification. Verify current selected and retained rollback publications without changing their serialized resources or selectors.
- [ ] 1.3 Return verified decoded resources from the staged reader and consume them in parity verification. Remove duplicate candidate reads and schema checks. Verify that existing parity failures still reject staging and that candidate JSON is read once per verification operation.
- [ ] 1.4 Exercise a valid graph and rehashed semantic corruptions through both boundaries. Cover foreign geometry placement, travel-state disagreement, incorrect detail identity, and coverage disagreement. Retain regression cases where one boundary previously accepted invalid data, and verify previous selectors and staged files remain unchanged on failure.
- [ ] 1.5 Run publication selection and site parity suites, then stage a valid publication into isolated output. Verify file identities, reference counts, and parity acceptance. Commit the coherent publication unit without deploying it.

## 2. Canonical atlas state

- [ ] 2.1 Replace writable persistent-state mirrors in `MapExplorer.svelte` with one accepted snapshot and derived values. Verify all template controls and resource states still reflect controller updates without a reverse full-state serializer.
- [ ] 2.2 Migrate user handlers to focused actions in `atlas-state.ts` and `atlas-controller.ts`. Use atomic transitions for related selection fields. Verify placement, entity, item-to-source, detail-close, filter, and query behavior through the existing state suite and targeted behavioral cases.
- [ ] 2.3 Make pending query and camera persistence field-specific and invalidate it during history restoration. Preserve push-versus-replace behavior and Deck ownership of the live camera. Verify Back and Forward during pending timers, selection during pan persistence, and camera-neutral selection in the browser.
- [ ] 2.4 Verify desktop and narrow-screen item search, source selection, detail focus restoration, URL reload, stale links, retries, and disposal in the actual site. Confirm no extra history entries or stale detail responses. Commit the state unit after these checks.

## 3. Loading and gesture guidance

- [ ] 3.1 Exercise delayed geometry, failed geometry with retry, empty geometry lists, and independently delayed search in the browser. Verify map-data readiness waits for declared geometry and toggles cause no new data requests. Record actual map-ready bytes and requests separately from the unchanged essential-resource accounting group.
- [ ] 3.2 Verify mouse and touch pan release, pinch bounds, wheel zoom, and authoring drag transitions in the browser. Confirm that all controller construction uses `createMapView` and that no transition enables inertia.
- [ ] 3.3 Reconcile the conflicting interactive-atlas deltas, designs, and tasks in `complete-evidence-pipeline-architecture` and `build-screenshot-first-map`. Align related publication accounting text and `openspec/config.yaml` with the measured behavior. Verify no clause requires lazy geometry, inertial pan, or captured-terrain defaults. Preserve unrelated incomplete tasks and validate every changed planning artifact.

## 4. Artifact filesystem invariants

- [ ] 4.1 Consolidate safe-segment and errno checks in a private artifacts module. Migrate equivalent callers in runs, references, leases, store, and garbage collection. Verify empty segments, traversal, separators, control characters, and legitimate identifiers through affected public operations.
- [ ] 4.2 Consolidate named immutable-create and atomic-replace primitives without changing caller serialization. Preserve permissions, exclusive installation, replacement, synchronization, and primary failure reporting. Verify temporary-directory creation, duplicate creation, replacement failure, lease update, and selector retention with real filesystem operations.
- [ ] 4.3 Run artifact store, run, reference, garbage-collection, and reuse suites. Compare representative persisted bytes and identities before and after the refactor. Verify no temporary-file cleanup failure hides an installation failure, and commit the filesystem unit.

## 5. Renderer projection and layer ownership

- [ ] 5.1 Move pure marker, area, movement, region, and coincident-marker projection into focused map-domain modules. Move record types with their owner and remove the test-only projection wrapper. Verify marker category resolution, stack selection order, and effective world offsets through existing marker tests and a representative projection smoke check.
- [ ] 5.2 Move remaining Deck layer constructors into the existing layer-module organization. Keep lifecycle, pointer coordination, camera, and adapter replacement in `map-renderer.ts`. Verify stable layer IDs and data references across selection, hover, visibility toggles, and camera updates.
- [ ] 5.3 Exercise actual stacked-marker picking, hover highlights, travel connections, movement paths, authoring offsets, fit/zoom, and repeated renderer replacement in the browser. Run the existing renderer lifecycle suite, verify disposal and stable imagery, and commit the renderer unit.

## 6. Deployment file operations

- [ ] 6.1 Share regular-file enumeration, hashing, and directly related file helpers between staging and deployment assertion. Preserve containment, symlink rejection, deterministic inventories, file limits, and validation-before-copy behavior. Verify temporary fixtures containing regular files, symlinks, nested directories, and unreferenced files.
- [ ] 6.2 Run the actual stage/build/assert workflow with isolated deployment paths. Verify metadata hashes and file inventory against the verified graph. Leave subprocess wrappers local unless substantive policy duplication remains, and commit the deployment-helper unit.

## 7. Capture validation and geometry helpers

- [x] 7.1 Consolidate capture-local schema and recursive finite-scalar checks. Preserve context and cyclic/non-finite rejection. Keep capture tolerance `1e-6` and readiness tolerance `1e-5` explicit. Verify a boundary value accepted only by readiness, plus nested non-finite and cyclic inputs.
- [x] 7.2 Share tile bounds between planner and position selection using a single-pass calculation. Preserve standing-box precedence, empty-input behavior at existing callers, and nearest-walkable-point selection. Verify asymmetric tiles, negative coordinates, and a declared standing box that differs from tile extent.
- [ ] 7.3 Run capture-plan, readiness, map-space, content-run, and cache suites. Smoke-test the real planner and position helper with retained local inputs without launching a new game capture. Verify equivalent bounds and selected positions, then commit the capture unit.

## 8. Integrated acceptance

- [ ] 8.1 Run `bun run check`, `bun run check:dependencies`, `bun test ./packages ./apps`, and the site checks and build declared in its package scripts. Verify production source and changed deployment scripts obey the public-contract dependency boundary. Resolve failures without weakening checks.
- [ ] 8.2 Exercise the built site with the selected valid publication and rehearse the retained rollback publication in isolated output. Verify navigation, details, eager geometry, non-inertial gestures, stable imagery, graph acceptance, and unchanged valid resource identities. Record evidence and any host limitations without claiming production deployment.
- [ ] 8.3 Update affected operator documentation and the existing release-note surface after successful smoke checks. Remove obsolete implementations and throwaway scripts. Verify all seven areas have one intended owner, no compatibility aliases remain, and unrelated extraction and coverage tasks remain open. Inspect staged changes and commit the final coherent unit without pushing or archiving.
