## 1. Reusable local tooling

- [x] 1.1 Create the TypeScript tool entry point and explicit local configuration. Verify game path, endpoint, output root, and CrossOver path mapping through the real doctor command.
- [x] 1.2 Reuse the HotRepl client and add repository-owned C# probe loading. Verify handshake, bounded evaluation, disconnect handling, and artifact hash checks against Afallon.
- [x] 1.3 Add build-scoped run manifests and atomic successful-run selection. Verify an injected failure preserves the previous successful output and records diagnostics.
- [x] 1.4 Add inspection commands for database counts, loaded scenes, component families, and streamed sources. Verify output counts against direct runtime probes without result truncation.

## 2. Canonical extraction and integration prerequisites

- [x] 2.1 Export required canonical records and localization with native IDs. Verify counts, reference resolution, and the recorded build against the live database.
- [x] 2.2 Extract all merchant stock groups, requirements, item links, and currency costs. Verify an unconditional group and a progression-gated group against the in-game merchant interface.
- [x] 2.3 Extract NPC loot-table links, entries, quantity ranges, selection controls, and requirements. Verify nested rule preservation and inspect the runtime behavior before emitting effective probabilities.
- [x] 2.4 Resolve dynamic level-band gear and linked-NPC loot behavior into explicit source rules and justified outputs. Verify known runtime examples without treating one rolled item as exhaustive output.
- [x] 2.5 Extract resource ranks and yields, quest associations, and referenced scene destinations. Verify one real example per relationship family and report unresolved references.

- [x] 2.6 Integrate NPC-producer and world-source probes into the normal extraction command. Verify schemas, source counts, canonical references, and per-observation scene/character context. A required probe failure must preserve the previous successful snapshot.
- [x] 2.7 Enforce single-owner runtime access for extraction, traversal, and capture. Verify a competing operation cannot displace the owner or receive its artifacts. Cancellation and disconnection must confirm cleanup before affected state is reused.
- [x] 2.8 Record the user-directed asset-use decision. The user reports that the developer welcomes a wiki or similar project and instructed us not to pursue a separate permission check. Asset preparation may proceed; public deployment still requires explicit user authorization.

## 3. World inventory and placement coverage

- [x] 3.1 Reconcile discovered build scenes, database scenes, destinations, addressable sources, and relevant component families in the integrated inventory. Verify native and exported counts without treating discovery as resolved coverage.
- [x] 3.2 Implement separate reachability, runtime availability, extraction, and imagery states in the coverage ledger. Verify every discovered source has evidence-backed states. Group repeated diagnostics by source and issue type without hiding unresolved relevant content.
- [x] 3.3 Establish placement identity from serialized sources and verified persistence keys using bounded reload operations. Compare extraction before and after scene reload and streamed unload/reload. Preserve distinct producers sharing a prefab and report collisions rather than merging them.
- [x] 3.4 Establish concrete SQLite identity tables and uniqueness constraints alongside placement verification. Verify authored identities remain independent of runtime observation IDs, duplicate keys are rejected, and repeat extraction preserves distinct placements.
- [x] 3.5 Implement reusable bounded scene traversal and streamed-source extraction under the runtime owner. Verify near/far and active/inactive cases, scene readiness, and cleanup on interruption before bulk collection.
- [x] 3.6 Complete NPC-producer acceptance using the existing projection. Verify one area producer and one fixed placement in the game, including candidates, shapes, count limits, overrides, conditions, and separation from observations. Retain unverified selection semantics.
- [x] 3.7 Extract resource producers and their possible outputs independently of CurrentNode. Verify Herbalism, Mining, and Fishing coverage includes producers without a live node.
- [x] 3.8 Complete source-family resolution and placement-role merging using existing interaction, container, quest, service, and transition exports. Verify overlapping components produce one placement with multiple roles. Unhandled relevant families remain explicit coverage blockers.
- [ ] 3.9 Resolve source scenes, rendered map spaces, regions, and overlapping floors. Verify known landmarks and explain the observed Duskfall camera/MapZone extent mismatch.

## 4. Reusable screenshot capture

- [x] 4.1 Implement runtime-owned capture resources and frame-local visual changes. Verify success, injected render failure, cancellation, and disconnection release owned resources. Lighting and suppression must restore before the next gameplay frame without a later host request.
- [x] 4.2 Implement multi-frame tile-local preload, geometry holds, and stable readiness inventories under exclusive ownership. Verify initially unloaded geometry, distinguish loaded-or-loading from readiness and timeout from empty terrain, and confirm hold cleanup after cancellation or disconnection.
- [x] 4.3 Implement orthographic capture with explicit extent, orientation, and resolution. Verify adjacent outdoor tiles at two resolutions against landmarks and their shared seam.
- [x] 4.4 Implement controlled illumination and transient suppression without removing useful static landmarks. Verify the same area remains legible from different gameplay lighting states and no player effects remain.
- [ ] 4.5 Implement explicit interior floor slices and reviewed ceiling suppression where necessary. Verify a complete dungeon route and stacked geometry without deleting floor content or leaking hidden state.
- [ ] 4.6 Preserve illustrated assets as a separate optional layer with per-layer calibration. Verify switching at known landmarks; label distorted artwork as orientation-only instead of claiming precise marker registration. Verify existing images never satisfy primary capture coverage or replace missing screenshot tiles.
- [x] 4.7 Implement resumable capture manifests and hashed image output. Verify changed build/profile inputs invalidate reuse and interrupted capture leaves the prior valid set intact.

## 5. Normalized and published data

- [x] 5.1 Extend the verified identity tables with concrete placement, condition, and domain relationship tables. Verify foreign keys, duplicate rejection, and repeated-run stability with integrated extraction data.
- [x] 5.2 Generate map projections, role-based category metadata, entity details, and item-source indexes. Verify one canonical entity can have several distinct placements and several roles without duplication.
- [x] 5.3 Generate WebP tile pyramids and indexes from the finest capture level. Verify seams, explicit empty positions, hashes, bounds, file counts, and byte totals.
- [x] 5.4 Add publication gates for references, coverage, build agreement, and spatial bounds. Verify each gate rejects an inconsistent artifact without altering valid output. A labeled local preview may retain pending world coverage. Included records must pass all integrity checks. The preview cannot satisfy the complete-release gate.

## 6. Static map experience

- [ ] 6.1 Build the static SvelteKit map with deck.gl OrthographicView, TileLayer/BitmapLayer imagery, and separate placement/area layers. Verify lazy tiles, shared transforms, orientation, picking, and Deck cleanup in the browser without game access.
- [ ] 6.2 Add Afallon-specific filters, counts, spatial aggregation, and a synchronized result list. Verify dense views with the largest available real snapshot and overlapping roles without lost or duplicate markers. Repeat at full-build scale in 7.3.
- [ ] 6.3 Add concise previews and persistent desktop/mobile details for all supported categories. Verify searchable vendor stock, loot, gathering conditions, quest links, and transition destinations in the browser.
- [ ] 6.4 Add place/entity/item search and source-to-map navigation. Verify an item can lead to multiple vendor, drop, resource, or container sources while preserving item context.
- [ ] 6.5 Verify the representative end-to-end pipeline before bulk collection: one outdoor area and one interior through extraction, repeat-load identities, capture, normalization, and browser picking/details. Include adjacent tile seams, a floor slice, a producer without a live node, and item-to-source navigation using generated static contracts. Label the preview incomplete.
- [ ] 6.6 Add URL-backed view, layer, selection, query, and filter state. Verify reload, browser back/forward, cross-map transitions, and stale links in the browser.
- [ ] 6.7 Add keyboard operation, focus restoration, narrow-screen panels, and non-color marker distinctions. Verify the complete search-to-detail journey without a pointer.
- [ ] 6.8 Add build identity and coverage disclosure to the interface. Verify a partial research artifact cannot appear as a complete release.

## 7. Complete supported-build delivery

Full-world collection starts only after the representative end-to-end milestone in 6.5 passes. That milestone does not reduce the release coverage requirement.

- [ ] 7.1 Run extraction across the complete supported-build inventory. Verify no reachable source or relevant content family remains unresolved in the coverage ledger.
- [ ] 7.2 Capture all required outdoor areas and interiors, then generate their tile pyramids. Verify every expected tile has a valid result and every published placement has validated spatial coverage.
- [ ] 7.3 Build the complete static artifact set and exercise representative map, loot, stock, gathering, quest, and transition journeys. Verify browser behavior, full-build filtering and aggregation performance, and actual download/file-size measurements.
- [ ] 7.4 Repeat extraction and resume a capture with unchanged inputs. Verify stable placement identities, compatible tile reuse, and no duplicate relationships.
- [ ] 7.5 Document the real operator commands, supported build, coverage results, and measured limitations. Verify the documented commands reproduce the artifact set from a fresh local run.

## 8. Publication handoff

- [ ] 8.1 Select artifact storage from measured byte and file-count limits. Confirm no proprietary source, raw evidence, secrets, or save files enter the source repository or public artifact set.
- [ ] 8.2 Prepare a versioned deployment and rollback procedure after publication authorization. Verify a local deployment smoke and restoration of the prior artifact set before any public release.
