## 1. Baseline and Boundaries

- [x] 1.1 Record a parity manifest for one frozen successful build, including run hashes, public counts, sampled identities, gate outcomes, and known expected differences; verify every referenced artifact exists and matches its recorded hash.
- [x] 1.2 Create the `apps/` and `packages/` Bun workspace manifests, TypeScript project references, and package export maps; verify the empty dependency graph type-checks without changing the selected CLI or site.
- [x] 1.3 Add dependency-cruiser rules for the design's allowed import graph, package exports, cross-package relative imports, and cycles; verify each rule rejects a temporary known-bad fixture and accepts the workspace graph.
- [x] 1.4 Move the SvelteKit application from `site/` to `apps/site/` without changing its imports or behavior; verify its existing check, build, and static preview smoke scenario pass from the new workspace path.

## 2. Contracts and Trust Boundaries

- [x] 2.1 Implement canonical JSON serialization and the central schema registry in `packages/contracts`; verify key-order independence, unsupported-value rejection, and stable schema identity with focused tests.
- [x] 2.2 Move configuration, artifact lifecycle, and run manifest schemas with their derived types into `packages/contracts`; migrate callers and verify the affected CLI configuration and run lifecycle tests pass before deleting old declarations.
- [x] 2.3 Move raw runtime evidence schemas by artifact family into `packages/contracts`; migrate each producer and consumer to the same schema export and verify all representative frozen artifacts decode.
- [x] 2.4 Move reviewed spatial, capture-plan, and tile evidence schemas into `packages/contracts`; migrate callers and verify existing calibration, capture-plan, and tile-contract tests pass before deleting old declarations.
- [x] 2.5 Move canonical query and public static-resource contracts into exported contract subpaths; migrate the site to the public-only subpath and verify dependency rules reject imports from non-public contract subpaths.
- [x] 2.6 Replace `any`-based normalization inputs with `unknown` decoding and validated derived types; verify malformed representative records fail with artifact identity and JSON path while valid frozen inputs assemble.
- [x] 2.7 Remove duplicate schema constants, interfaces, and re-exports after all callers migrate; verify workspace references and a repository search show one owner for every schema identity.

## 3. Artifact Lifecycle

- [x] 3.1 Implement streaming writes to `objects/sha256/` with temporary files, flush, atomic rename, existing-object verification, and collision rejection; verify identical bytes deduplicate and corrupted objects fail integrity tests.
- [x] 3.2 Implement immutable running, succeeded, and failed manifests with logical artifact references; verify completed manifests reject mutation and partial failure retains diagnostics.
- [x] 3.3 Implement atomic build-and-operation latest-success references; verify a failed run and an unverified output cannot replace the prior successful reference.
- [x] 3.4 Implement active-operation leases and reference-tracing garbage-collection reporting; verify retained, shared, latest-success, and active objects survive a dry run while unreachable objects are reported once.
- [x] 3.5 Implement step fingerprints from stable Bun bundle output, transitive imports, probe imports, schemas, settings, and input identities; verify relevant code changes invalidate reuse, unrelated changes do not, and clean-directory runs produce the same fingerprint.
- [x] 3.6 Implement verified step-result reuse and record its source run in the consuming workflow; verify a valid cache hit reuses object identities and any settings, input, implementation, schema, or object-integrity change forces execution.
- [x] 3.7 Implement the one-time legacy artifact importer; verify it registers frozen current artifacts without changing their bytes and rejects a manifest/hash mismatch.

## 4. Runtime and Unified Scan

- [x] 4.1 Move the HotRepl connection, exclusive owner, cleanup callbacks, frame restoration, cancellation, and receipt handling unchanged into `packages/runtime`; verify current ownership, busy-owner, cancellation, disconnection, and unconfirmed-cleanup scenarios still pass.
- [x] 4.2 Implement deterministic probe bundles from explicit imported C# source modules and schema identities; verify bundle hashes include every imported probe and one collector compiles only once per runtime session.
- [x] 4.3 Split oversized probes along support, inspection, traversal, serialization, and cleanup boundaries without changing their raw envelopes; verify frozen or live probe comparisons match the parity manifest for representative scenes.
- [x] 4.4 Implement the closed `ScanTarget` union, ordered scan-plan schema, target validation, and collector applicability table; verify unknown targets fail before runtime ownership and inapplicable families emit evidence-backed dispositions.
- [x] 4.5 Implement the shared scan state machine and current-scene target; verify it emits the common envelope, records scene and character context, and preserves runtime state.
- [x] 4.6 Implement build-scene targets through the same state machine; verify scene transitions restore the original scene, position, and rotation on success, failure, and cancellation.
- [x] 4.7 Implement streamed-source targets through the same state machine; verify unreachable, unsupported, failed, succeeded, and not-attempted outcomes remain distinct with source evidence.
- [x] 4.8 Integrate all canonical, inventory, producer, placement, role, relationship, spatial, and coverage collectors into scan; verify current-scene and traversal plans produce the same artifact families and stable authored identities.
- [x] 4.9 Add the `compendium scan` composition command and verified run finalization; verify a multi-target failure preserves per-target diagnostics and does not replace the latest successful complete scan.
- [x] 4.10 Compare unified scan output with the frozen extraction and traversal baseline, declare justified differences, then remove the old commands and duplicate orchestration; verify no package imports the removed modules.

## 5. Capture Package

- [x] 5.1 Move capture planning, readiness, rendering, restoration, and tile evidence into `packages/capture` while retaining the runtime package as its only game-state owner; verify existing capture contract and cleanup scenarios pass.
- [x] 5.2 Replace copied capture inputs and manual revision lists with artifact references and automatic fingerprints; verify a changed plan, survey, geometry input, probe source, or capture policy invalidates reuse.
- [x] 5.3 Write capture chunks and pyramids directly to the content store and finalize them through immutable run manifests; verify interruption preserves the prior latest-success reference and leaves no published partial object.
- [x] 5.4 Run one representative capture smoke scenario against the instrumented game; verify tile registration, readiness evidence, visual restoration, and cleanup receipt match the declared capture contract.

## 6. Canonical Catalog

- [x] 6.1 Define the new catalog schema with typed queried columns, retained evidence JSON, strict constraints, and separate `coverage_issues` and `coverage_occurrences`; verify schema creation and foreign-key checks succeed on a temporary database.
- [x] 6.2 Implement stable issue and occurrence identities that exclude diagnostic wording; verify repeated evidence creates one issue with multiple occurrences and distinct semantic subjects remain separate.
- [x] 6.3 Implement transactional catalog assembly from validated artifact references in deterministic input and row order; verify malformed input, reference failure, and identity collision roll back the complete candidate.
- [x] 6.4 Implement logical catalog identity and independent SQLite object hashing; verify equivalent inputs produce the same logical identity and any build, schema, setting, input, or assembler change produces a different identity.
- [x] 6.5 Migrate canonical entities, sources, placements, observations, roles, conditions, relationships, spatial registration, exclusions, and provenance into the new schema; verify sampled rows and provenance chains match the parity manifest.
- [x] 6.6 Implement release and preview gates against distinct unresolved issues, occurrences, exclusions, build identity, references, and spatial bounds; verify repeated occurrences do not inflate blocker counts and preview cannot satisfy release.
- [x] 6.7 Implement deterministic read-only catalog queries for maps, search summaries, entity details, item sources, imagery metadata, and coverage; verify repeated queries return stable ordering and exact catalog identity.
- [x] 6.8 Assemble the frozen build with old and new paths, compare identities, relations, exclusions, issue semantics, and gate decisions, and record every justified difference; verify no unexplained parity difference remains.

## 7. Static Publication

- [x] 7.1 Define and validate the root manifest, map shard, compact search index, entity detail, item source, coverage, and imagery metadata contracts; verify every contract rejects mismatched build, catalog, schema, or resource identity.
- [x] 7.2 Generate map-specific placement, region, and connection shards directly from catalog queries; verify the browser composes every shard at the frozen reviewed world offset and deterministic inputs produce identical resource hashes.
- [x] 7.3 Generate compact global entity and item search indexes plus independently addressable detail resources; verify a selected detail loads without downloading unrelated detail bodies.
- [x] 7.4 Migrate game-map and captured imagery generation to content-addressed publication assets; verify registrations, tile hashes, marker sampling, and layer metadata remain valid.
- [x] 7.5 Implement candidate-directory validation and atomic publication selection; verify a missing resource, hash mismatch, gate failure, or build mismatch preserves the previous selected publication.
- [x] 7.6 Wire SvelteKit static builds and Cloudflare Static Assets input to the selected publication; verify a production-like static server displays every map in the shared world and supports search, filtering, selection, and layer changes without dynamic requests.
- [x] 7.7 Compare public semantics and initial shared-world transfer against the frozen publication, record expected sharding differences, and remove map projection, entity-detail, item-source, and coverage-summary intermediates after parity passes.

## 8. Atlas Refactor

- [x] 8.1 Implement `atlas-data` loading for the root, current map, compact indexes, selected details, and request deduplication; verify failed and repeated requests expose stable error/loading states without duplicate fetches.
- [x] 8.2 Implement immutable `atlas-state` transitions, selectors, and canonical URL serialization; verify all valid shareable fields round-trip and removed parameter aliases are ignored and never written.
- [x] 8.3 Split deck.gl lifecycle, view synchronization, hit testing, and WebGL fallback into `map-renderer`; verify renderer replacement and component teardown release every deck.gl resource.
- [x] 8.4 Split imagery, marker, region, connection, and movement layer construction into pure modules; verify representative public rows produce the existing coordinates, picking identities, visibility, and styles.
- [x] 8.5 Split sidebar, search results, layer controls, canvas shell, and development details into focused Svelte components with `MapExplorer.svelte` as composition only; verify site checks pass with no pipeline or non-public package imports.
- [x] 8.6 Implement the default-layer policy so game-provided imagery is selected for overworld and interiors while captured terrain remains disabled until explicitly selected; verify saved canonical choices restore and layer changes preserve world location.
- [x] 8.7 Preserve the compile-time development boundary around detail panels and authoring controls; verify production output does not render them and a development build retains both interfaces.
- [x] 8.8 Exercise the actual atlas in a browser across search, filtering, marker selection, map navigation, imagery switching, URL reload, WebGL fallback, and production/development modes; verify behavior against the static-publication scenarios and retain screenshots or logs as evidence.

## 9. Cutover and Cleanup

- [x] 9.1 Switch root scripts, operator commands, and deployment paths to `apps/compendium-cli` and `apps/site`; verify documented scan, capture, catalog, publish, preview, and deploy commands invoke only new packages.
- [x] 9.2 Remove the old `tools/`, `pipeline/`, copied run layout, deprecated commands, compatibility readers, duplicate schemas, projection formats, and URL alias parsing; verify repository references and dependency analysis find no remaining caller.
- [x] 9.3 Update operator documentation and the active `build-screenshot-first-map` planning text for new commands, artifact paths, catalog/publication flow, game-imagery defaults, captured-terrain opt-in, and development-only details; verify documentation examples match actual command help and behavior.
- [x] 9.4 Run focused runtime, artifact integrity, catalog parity, static publication, and browser smoke scenarios; verify all new capability scenarios have recorded evidence and no unexplained regression remains.
- [x] 9.5 Run workspace type checks, dependency-cycle checks, package tests, the complete existing test suite, the production static build, and OpenSpec validation; verify every command succeeds before selecting new latest-success and publication references.
- [x] 9.6 Exercise rollback by restoring prior source and selected references without reverse migration; verify the previous CLI inputs and static publication remain usable and all retained artifacts still pass integrity checks.
