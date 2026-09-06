## 1. Reusable local tooling

- [x] 1.1 Create the TypeScript tool entry point and explicit local configuration. Verify game path, endpoint, output root, and CrossOver path mapping through the real doctor command.
- [x] 1.2 Reuse the HotRepl client and add repository-owned C# probe loading. Verify handshake, bounded evaluation, disconnect handling, and artifact hash checks against Afallon.
- [x] 1.3 Add build-scoped run manifests and atomic successful-run selection. Verify an injected failure preserves the previous successful output and records diagnostics.
- [x] 1.4 Add inspection commands for database counts, loaded scenes, component families, and streamed sources. Verify output counts against direct runtime probes without result truncation.

## 2. Canonical records and relationship semantics

- [x] 2.1 Export required canonical records and localization with native IDs. Verify counts, reference resolution, and the recorded build against the live database.
- [ ] 2.2 Extract all merchant stock groups, requirements, item links, and currency costs. Verify an unconditional group and a progression-gated group against the in-game merchant interface.
- [ ] 2.3 Extract NPC loot-table links, entries, quantity ranges, selection controls, and requirements. Verify nested rule preservation and inspect the runtime behavior before emitting effective probabilities.
- [ ] 2.4 Resolve dynamic level-band gear and linked-NPC loot behavior into explicit source rules and justified outputs. Verify known runtime examples without treating one rolled item as exhaustive output.
- [ ] 2.5 Extract resource ranks and yields, quest associations, and referenced scene destinations. Verify one real example per relationship family and report unresolved references.

## 3. World inventory and placement coverage

- [ ] 3.1 Inventory build scenes, database scenes, referenced destinations, addressable sources, and relevant component families. Verify every discovered source has an evidence-backed coverage disposition.
- [ ] 3.2 Establish placement identity from serialized sources and verified persistence keys. Verify repeated scene loads and repeated extraction retain identities without merging distinct placements.
- [ ] 3.3 Implement bounded scene traversal and streamed-source extraction. Verify near/far and active/inactive cases that the earlier active-only probes missed.
- [ ] 3.4 Extract NPC producers, candidate rules, shapes, count limits, overrides, and conditions separately from live NPC observations. Verify one area producer and one fixed placement in the game.
- [ ] 3.5 Extract resource producers and their possible outputs independently of CurrentNode. Verify Herbalism, Mining, and Fishing coverage includes producers without a live node.
- [ ] 3.6 Extract useful interactions, containers, quest zones, services, and transitions from all discovered producer families. Verify overlapping components yield one placement with multiple roles where appropriate.
- [ ] 3.7 Resolve source scenes, rendered map spaces, regions, and overlapping floors. Verify known landmarks and explain the observed Duskfall camera/MapZone extent mismatch.

## 4. Reusable screenshot capture

- [ ] 4.1 Implement a capture session that owns temporary cameras, buffers, visual settings, and suppression state. Verify success, injected error, and cancellation restore changed state before the next gameplay frame.
- [ ] 4.2 Implement tile-local preload, hold, readiness, and stable source inventories. Verify a tile requiring initially unloaded geometry and distinguish timeout from verified empty terrain.
- [ ] 4.3 Implement orthographic capture with explicit extent, orientation, and resolution. Verify adjacent outdoor tiles at two resolutions against landmarks and their shared seam.
- [ ] 4.4 Implement controlled illumination and transient suppression without removing useful static landmarks. Verify the same area remains legible from different gameplay lighting states and no player effects remain.
- [ ] 4.5 Implement explicit interior floor slices and reviewed ceiling suppression where necessary. Verify a complete dungeon route and stacked geometry without deleting floor content or leaking hidden state.
- [ ] 4.6 Preserve illustrated assets and per-layer calibration. Verify switching at known landmarks; label distorted artwork as orientation-only instead of claiming precise marker registration.
- [ ] 4.7 Implement resumable capture manifests and hashed image output. Verify changed build/profile inputs invalidate reuse and interrupted capture leaves the prior valid set intact.

## 5. Normalized and published data

- [ ] 5.1 Create concrete SQLite tables for identities, placements, conditions, and domain relationships. Verify foreign keys, duplicate rejection, and repeated-run stability with extracted data.
- [ ] 5.2 Generate map projections, role-based category metadata, entity details, and item-source indexes. Verify one canonical entity can have several distinct placements and several roles without duplication.
- [ ] 5.3 Generate WebP tile pyramids and indexes from the finest capture level. Verify seams, explicit empty positions, hashes, bounds, file counts, and byte totals.
- [ ] 5.4 Add publication gates for references, coverage, build agreement, and spatial bounds. Verify each gate rejects a deliberately inconsistent artifact without altering valid output.

## 6. Static map experience

- [ ] 6.1 Build the static SvelteKit map with deck.gl OrthographicView, TileLayer/BitmapLayer imagery, and separate placement/area layers. Verify lazy tiles, shared transforms, orientation, picking, and Deck cleanup in the browser without game access.
- [ ] 6.2 Add Afallon-specific filters, counts, spatial aggregation, and a synchronized result list. Verify dense full-data views and overlapping roles without lost or duplicate markers.
- [ ] 6.3 Add concise previews and persistent desktop/mobile details for all supported categories. Verify searchable vendor stock, loot, gathering conditions, quest links, and transition destinations in the browser.
- [ ] 6.4 Add place/entity/item search and source-to-map navigation. Verify an item can lead to multiple vendor, drop, resource, or container sources while preserving item context.
- [ ] 6.5 Add URL-backed view, layer, selection, query, and filter state. Verify reload, browser back/forward, cross-map transitions, and stale links in the browser.
- [ ] 6.6 Add keyboard operation, focus restoration, narrow-screen panels, and non-color marker distinctions. Verify the complete search-to-detail journey without a pointer.
- [ ] 6.7 Add build identity and coverage disclosure to the interface. Verify a partial research artifact cannot appear as a complete release.

## 7. Complete supported-build delivery

- [ ] 7.1 Run extraction across the complete supported-build inventory. Verify no reachable source or relevant content family remains unresolved in the coverage ledger.
- [ ] 7.2 Capture all required outdoor areas and interiors, then generate their tile pyramids. Verify every expected tile has a valid result and every published placement has validated spatial coverage.
- [ ] 7.3 Build the complete static artifact set and exercise representative map, loot, stock, gathering, quest, and transition journeys. Verify browser behavior and record actual download/file-size measurements.
- [ ] 7.4 Repeat extraction and resume a capture with unchanged inputs. Verify stable placement identities, compatible tile reuse, and no duplicate relationships.
- [ ] 7.5 Document the real operator commands, supported build, coverage results, and measured limitations. Verify the documented commands reproduce the artifact set from a fresh local run.

## 8. Publication handoff

- [ ] 8.1 Record asset-use permission and select storage from measured artifact limits. Verify no proprietary source, raw evidence, secrets, or save files enter the source repository or public artifact set.
- [ ] 8.2 Prepare a versioned deployment and rollback procedure after publication authorization. Verify a local deployment smoke and restoration of the prior artifact set before any public release.
