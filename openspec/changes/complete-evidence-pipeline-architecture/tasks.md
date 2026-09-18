## 1. Freeze evidence and acceptance boundaries

- [x] 1.1 Record the current source revision, selected scan/catalog/publication references, retained preview root hash, and input hashes in local rollback evidence. Verify every recorded reference resolves without modifying its source.
- [x] 1.2 Freeze semantic samples for entity/source/placement identities, relations, provenance, map registrations, guides, marker behavior, and current coverage. Verify samples include sparse native IDs, repeated observations, conditional stock, and unresolved probabilities rather than counts alone.
- [x] 1.3 Measure the representative preview's resource groups and browser startup in a fixed browser setup. Verify raw JSON bytes, compressed transfer, request count, map readiness, and search readiness are recorded separately.

### Approved baseline recovery

The user approved separate reader and canonical baselines for task 1.1. The selected catalog run `415bab9c-3a6e-4118-891c-119d93f18b2e` records SHA-256 `be3f1f8ab448eac7d83af375b18d2410b1efb960b334cb3640b8f83a8f047e06` and 294,510,592 bytes. Its current database has SHA-256 `94efa6931941e57254b3efab4483dfc6ad85b648a9eaeeedddd2cf49eefb06f7` and 295,780,352 bytes. The historical manifest and database remain unchanged by this audit.

The audit verified 4,635 other references, including the selected scan evidence and all 4,588 dependencies of the selected publication. `local/evidence-pipeline-baseline/integrity-audit.json` records every check and its limitations. The verified alternate catalog run `27005002-d304-41e7-89e3-e3f11fd8a105` uses the same normalization-plan hash but has a different catalog identity and no imagery registrations. Matching sampled table counts do not establish semantic parity.

The verified current publication is the reader baseline. The intact alternate catalog is the canonical baseline; it did not produce the current publication. The mismatched pair remains diagnostic evidence only. `local/evidence-pipeline-baseline/accepted-baseline.json` records source revision `e8933dd04ddf494689266789f51f7b7c302bad27`, both baseline identities, the alternate manifest snapshot and hash, verified reference checks, and input identities. The alternate catalog's evidence input hashes match the original selection's; its implementation input hashes differ. A second pass verified 3,133 nested entity-detail and item-source resources whose legacy references encode hashes in their filenames. The complete retained publication closure contains 7,721 dependencies; all passed hash verification. Implementation may continue without changing historical artifacts or selectors.

Semantic evidence is in `local/evidence-pipeline-baseline/semantic-baseline.json` (SHA-256 `64ccdafa77416ff68dceea63b2c17a8f8ace7e8dd2787daafd70fdf43330a926`). It includes 37 ordered table fingerprints, 103 recorded queries, raw record pointers, and the known merchant, spatial-pointer, and issue-lineage defects that must not become parity targets. Reader policy checks used the frozen source worktree at `local/evidence-pipeline-baseline/source`.

`local/evidence-pipeline-baseline/browser-baseline.json` and its startup/search screenshots record Chrome 150 at 1440 × 1000, DPR 1, with HTTP cache disabled. The retained reader loaded 6,820,010 raw startup JSON bytes; atlas, root, and imagery metadata account for 4,548,327 bytes. One loopback sample observed usable search at 539.3 ms and map at 675 ms, with 112 HTTP requests. The host served identity encoding, so compressed-body bytes are not available. These timings are observations, not acceptance thresholds.

## 2. Define production boundary contracts

- [x] 2.1 Define versioned current run and scan-envelope contracts with explicit family references, observation context, outcomes, and planning evidence. Verify malformed, duplicate-family, and cross-build inputs fail with target and record context.
- [x] 2.2 Define catalog and publication plan contracts using immutable manifest/object references, explicit canonical-target selection, imagery, reviewed spatial inputs, and hashed policy. Verify plans reject retired path-based shapes and ambiguous global-family selection.
- [x] 2.3 Define coverage review, obligation, disposition, and closure contracts with build, inventory, evidence, and review identities. Verify unsupported, unreachable, failed, not-attempted, verified, not-applicable, and reviewed-excluded states remain distinct.
- [x] 2.4 Establish pure shared spatial frame and membership APIs under the contracts spatial boundary. Verify existing calibration and membership behavior without catalog imports from capture or filesystem I/O in pure transforms.
- [x] 2.5 Define the versioned root, multipart atlas/search, optional geometry, and selected-detail contracts. Verify every reference declares its expected schema and identity and current canonical URL fields remain unchanged.

## 3. Unify artifact lifecycle and integrity

- [x] 3.1 Extend the common run lifecycle to retain preparation evidence, append-only revisions, terminal diagnostics, and interrupted-run attribution. Verify a preparation failure preserves evidence without changing the successful reference.
- [x] 3.2 Separate immutable terminal success from pointer selection failure. Verify injected reference-write failure preserves the previous selector and never attempts to rewrite a terminal manifest.
- [x] 3.3 Replace whole-object verification and catalog sealing buffers with bounded streaming hash/size checks. Verify corruption near the end of a large object is rejected and streaming buffers stay within the 1 MiB budget.
- [x] 3.4 Extend active leases and retention reporting to traverse input/output manifests, selected catalog/publication closure, and pending inputs. Verify a retained downstream catalog protects evidence from an otherwise expired run and broken dependencies fail reporting.
- [x] 3.5 Include all executable probe and native-owner sources in automatic dependency fingerprints. Verify relevant transitive changes invalidate reuse while unrelated site changes do not, including repeat computation from another checkout root.
- [x] 3.6 Implement a temporary verified legacy importer for the frozen evidence. Verify byte preservation, explicit missing-proof dispositions, current reference resolution, and an import report without fabricating successful target or cleanup evidence.

## 4. Make scan preparation and output safe

- [x] 4.1 Move structural scan-plan validation before runtime connection and admit the run before runtime planning evidence. Verify invalid arguments cause no game mutation and discovery failures produce an attributed terminal run.
- [x] 4.2 Validate and register planning inventory context plus the resolved target set. Verify wrong-character or mismatched scene/build evidence prevents traversal and valid planning remains auditable after scratch removal.
- [x] 4.3 Put target directory creation and all processing flags inside the preparation cleanup scope. Keep a regression for the reproduced directory-failure sequence and verify the next operation is not falsely busy.
- [x] 4.4 Register immutable family references in every target envelope and remove downstream dependence on target directory names. Verify all three target kinds expose consistent applicable families and relocation/order changes preserve authored identity.
- [x] 4.5 Preserve native ownership and restoration through scan success, target failure, cancellation, and disconnect. Verify actual owner receipts and scene/pose restoration, and verify failed multi-target runs cannot replace successful evidence.

## 5. Establish the first complete vertical slice

- [x] 5.1 Add current-envelope catalog admission in `packages/catalog` for canonical identity, one placement family, reviewed registration, and imagery. Verify a successful current scan is accepted directly and missing required families are rejected without a legacy reader.
- [x] 5.2 Route identity insertion, facts, imagery, and metadata through one candidate transaction. Verify a later constraint failure rolls back earlier identity rows and leaves the selected catalog unchanged.
- [x] 5.3 Seal and register the candidate database with logical identity, byte hash, and no external WAL dependency. Verify equivalent inputs retain logical identity and the object opens read-only after store relocation.
- [x] 5.4 Add a read-only publication application path for the slice and invoke it through unselected candidate tooling. Verify catalog hashes are identical before and after successful and failed publication and no manual SQL or conversion step is required.
- [x] 5.5 Exercise the slice from fresh current-scene evidence through a locally served static map. Record native cleanup and browser evidence while keeping the previously selected operator workflow intact.

## 6. Migrate every catalog domain and provenance path

- [x] 6.1 Move canonical entity, source, placement, observation, role, and spatial normalization from the CLI into typed catalog modules. Verify stable authored identity across repeated observations and strict separation of source scene, map space, and named region.
- [x] 6.2 Decode and migrate spawn candidates, scaling, patrol, roaming, and scene-arrival semantics. Verify fixed and area producers, signed serialized IDs, and movement provenance against the frozen semantic samples.
- [x] 6.3 Decode and migrate merchant bindings, stock, requirements, currencies, and progression conditions. Verify sparse-ID provenance pointers resolve to actual records and conditional stock retains its gating semantics.
- [x] 6.4 Decode and migrate NPC/world loot, linked-NPC rules, tables, entries, and item-source relations. Verify raw rates remain distinct from effective probability and unresolved semantics do not produce invented values.
- [x] 6.5 Decode and migrate quests, objectives, rewards, resources, containers, services, transitions, and guide facts. Verify existing supported relations and nested teleport destinations against retained evidence with no dropped family.
- [x] 6.6 Store versioned derivation rules and complete input references for public facts. Verify sampled multi-source derivations and sparse native-ID pointers resolve to validated source records rather than display names or array guesses.
- [x] 6.7 Make the catalog application API the only production assembly path and preindex repeated joins. Verify the CLI delegates without normalization logic and callers cannot select a partially populated or alternate normalized database.
- [x] 6.8 Register game-map and captured-image metadata as verified catalog inputs before sealing. Verify changing imagery changes catalog logical identity while the previous database bytes remain valid.

## 7. Migrate capture and pyramid evidence

- [x] 7.1 Replace capture sweep, tile, and checkpoint consumers of copied-run paths with the common manifest/object contract. Verify successful and failed captures retain their evidence after scratch cleanup.
- [x] 7.2 Resolve sweep and native cleanup proof only through registered immutable references. Verify tampered, missing, wrong-owner, and stale absolute-path evidence cannot satisfy capture reuse.
- [x] 7.3 Extend cleanup scopes from stream-hold acquisition through readiness and rendering. Verify early readiness failure releases holds and records restoration rather than emitting a verified-empty chunk.
- [x] 7.4 Preserve compatible per-tile reuse and register pyramid outputs directly in the store. Verify unrelated plan tiles do not invalidate a compatible checkpoint and interrupted pyramid generation preserves selected imagery.
- [x] 7.5 Run a representative overworld capture and relocated-store reuse scenario in the actual game workflow. Verify raster registration, visual restoration, stream cleanup, known-good final scene policy, and unchanged opt-in/single-plane behavior.

## 8. Implement positive coverage accounting

- [x] 8.1 Add coverage reviews, obligations, and dispositions to the catalog transaction with stable build/subject/family identities. Verify repeated observations do not duplicate obligations or rewrite their originating runs.
- [x] 8.2 Derive obligations from registered inventory and reviewed scope, and bind closure to exact inventory identities. Verify a newly discovered required source invalidates stale closure and an empty source list cannot prove completeness.
- [x] 8.3 Implement policy evaluation for evidence-backed not-applicable and reviewed outside-scope dispositions. Verify required reachable gameplay cannot be excluded merely to pass release and missing optional captures do not block verified game-map policy.
- [x] 8.4 Replace the empty-catalog acceptance and unconditional incomplete sentinel with positive closure evaluation. Verify regressions reject empty evidence and accept fully accounted fixture evidence, without marking the real build complete.
- [x] 8.5 Preserve issue/occurrence separation and actual source-run lineage, then derive reports from final catalog rows. Verify unsatisfied obligations, unresolved issues, repeated occurrences, and exclusions have separate consistent totals.
- [x] 8.6 Exercise release and preview against the retained incomplete catalog and a bounded fresh catalog. Verify previews require integrity, real unresolved obligations remain blocking, and no diagnostic waiver or manual SQL is used.

## 9. Complete static publication and deployment boundaries

- [x] 9.1 Migrate all map, search, guide, entity, item-source, coverage, and imagery producers to the sealed catalog query API. Verify no publication code registers imagery or changes database bytes and every prior public family remains represented.
- [x] 9.2 Replace filename-pattern reference discovery with typed resource-graph traversal. Verify nested missing detail, wrong-kind resource, hash mismatch, unsafe path, and cross-build/catalog references reject candidates before selection.
- [x] 9.3 Finalize publication through the common run lifecycle and atomic selector with portable verified materialization. Verify cross-filesystem output, repeated identical candidates, and failed selection preserve valid old references.
- [x] 9.4 Generate compact essential atlas parts, independently loaded search parts, and optional movement/connection resources. Verify every map and placement remains at the same world position without an active-map model.
- [x] 9.5 Enforce a 64 KiB root, 512 KiB atlas/search/geometry parts, and a 3,300,000-byte essential startup total on the frozen representative preview. Verify semantic parity and report geometry, search, detail, image, and code totals separately. Report actual map-ready transfer with geometry included.
- [x] 9.6 Repeat compilation from identical evidence at a relocated store root. Verify equal public resource/root hashes and logical catalog identity independent of paths, timestamps, or SQLite page layout.
- [x] 9.7 Update staging and immutable cache rules for actual generated resource and imagery paths while keeping selectors revalidatable. Verify response headers and corrupt-input rejection through a production-like static preview without deploying production.

## 10. Centralize atlas state and progressive loading

- [x] 10.1 Adapt the site loader to multipart resources and independent atlas/search/optional-detail readiness. Verify delayed or failed search does not block the map and partially loaded records do not appear as final zero counts.
- [x] 10.2 Introduce one navigation transition/effect owner for initial URLs, direct selection, back, forward, and programmatic links. Verify uncached item/entity selections load the same resources and preserve canonical URL and stale-link behavior.
- [x] 10.3 Add per-resource failure/retry state and current-selection generation checks while preserving request deduplication. Verify stale request failures cannot replace a newer loading/error state and an explicit retry can succeed.
- [x] 10.4 Build immutable identity/search indexes once per loaded resource set and move orchestration out of `MapExplorer.svelte`. Verify category counts, item-to-place search, highlights, and guide links retain observable behavior.
- [x] 10.5 Update renderer inputs through stable geometry and semantic layer changes rather than whole-geometry signatures. Verify hover/filter/selection preserve the live camera, disabled inertia, and unchanged imagery in the actual browser.
- [x] 10.6 Use shared effective-coordinate selectors for authoring and viewport results. Verify a dragged map's imagery, placements, regions, connections, labels, and result membership move together without scale or rotation changes.
- [x] 10.7 Exercise development and production browser builds across cold startup, canonical reload, back/forward, rapid selection, retry, imagery defaults, capture opt-in, guides, keyboard/mobile interaction, and WebGL fallback. Verify production omits detail/authoring panels and requires no dynamic API or evidence files.

## 11. Prove the full cutover and rollback

- [x] 11.1 Run fresh successful current-scene, build-scene, and supported streamed-source scans plus the representative capture through catalog, publication, staging, and the browser using only supported commands. Verify manifests connect every stage without legacy conversion, manual SQL, or hidden local inputs.
- [x] 11.2 Compare all supported domain families and sampled provenance/spatial/public behavior against frozen evidence. Verify every difference is explained by the design's declared changes and no real coverage blocker disappears without evidence.
- [x] 11.3 Exercise storage preparation, malformed evidence, constraint rollback, cleanup uncertainty, damaged object, missing publication dependency, and selector failure across the integrated pipeline. Verify prior successful references and sealed input bytes remain intact.
- [x] 11.4 Run workspace type checks, dependency checks, the applicable existing test suite, and the production static build after integration. Verify all pass and retain only regressions that defend observable behavior rather than source text, forwarding, or incidental wording.
- [x] 11.5 Switch operator commands and plans to the new application APIs only after the fresh pipeline and browser proof pass. Verify documented scan, capture, catalog, publish, and preview workflows execute the selected path.
- [x] 11.6 Restore the frozen source/selected-reference pair in an isolated rollback rehearsal, then restore the new pair. Verify both remain usable without reverse database migration or modification of retained objects.
- [x] 11.7 Remove retired manifest readers, copied-run lifecycle, alternate catalog assembly exports, obsolete schemas/projections, temporary importer, and throwaway smoke tooling after proof. Verify all callers use the new contracts and retained evidence remains readable through current references.
- [x] 11.8 Update existing operator documentation, evidence notes, and the explicitly conflicting pending specs/config. Verify command examples against actual help, preserve unrelated open requirements, and validate this change before any separately requested sync/archive.
