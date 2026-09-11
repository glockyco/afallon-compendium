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
- [ ] 3.9 Resolve source scenes, rendered maps, and regions with horizontal membership only. Verify known landmarks, verify that stacked placements keep distinct identities and their own heights on one plane, and explain the observed Duskfall camera/MapZone extent mismatch.

## 4. Reusable screenshot capture

- [x] 4.1 Implement runtime-owned capture resources and frame-local visual changes. Verify success, injected render failure, cancellation, and disconnection release owned resources. Lighting and suppression must restore before the next gameplay frame without a later host request.
- [x] 4.2 Implement multi-frame tile-local preload, geometry holds, and stable readiness inventories under exclusive ownership. Verify initially unloaded geometry, distinguish loaded-or-loading from readiness and timeout from empty terrain, and confirm hold cleanup after cancellation or disconnection.
- [x] 4.3 Implement orthographic capture with explicit extent, orientation, and resolution. Verify adjacent outdoor tiles at two resolutions against landmarks and their shared seam.
- [x] 4.4 Implement controlled illumination and transient suppression without removing useful static landmarks. Verify the same area remains legible from different gameplay lighting states and no player effects remain.
- [x] 4.5 Support an optional reviewed clip height in the capture plan, with no clipping by default and no inference. An outdoor extent captures with the plan's own camera frame, and a reviewed height reveals covered dungeon content on one plane. No scene object is disabled, deleted, or left modified.
- [ ] 4.6 Preserve illustrated assets as a separate optional layer with per-layer calibration. Verify switching at known landmarks; label distorted artwork as orientation-only instead of claiming precise marker registration. Verify existing images never satisfy primary capture coverage or replace missing screenshot tiles.
- [x] 4.7 Implement resumable capture manifests and hashed image output. Verify changed build/profile inputs invalidate reuse and interrupted capture leaves the prior valid set intact.

## 5. Normalized and published data

- [x] 5.1 Extend the verified identity tables with concrete placement, condition, and domain relationship tables. Verify foreign keys, duplicate rejection, and repeated-run stability with integrated extraction data.
- [x] 5.2 Generate map projections, role-based category metadata, entity details, and item-source indexes. Verify one canonical entity can have several distinct placements and several roles without duplication.
- [x] 5.3 Generate WebP tile pyramids and indexes from the finest capture level. Verify seams, explicit empty positions, hashes, bounds, file counts, and byte totals.
- [x] 5.4 Add publication gates for references, coverage, build agreement, and spatial bounds. Verify each gate rejects an inconsistent artifact without altering valid output. A labeled local preview may retain pending world coverage. Included records must pass all integrity checks. The preview cannot satisfy the complete-release gate.

## 6. Static map experience

- [x] 6.1 Build the static SvelteKit map with deck.gl OrthographicView, TileLayer/BitmapLayer imagery, and separate placement/area layers. Verify lazy tiles, shared transforms, orientation, picking, and Deck cleanup in the browser without game access.
- [x] 6.2 Add Afallon-specific filters, counts, spatial aggregation, and a synchronized result list. Verify dense views with the largest available real snapshot and overlapping roles without lost or duplicate markers. Repeat at full-build scale in 7.3.
- [ ] 6.3 Add concise previews and persistent desktop/mobile details for all supported categories. Verify searchable vendor stock, loot, gathering conditions, quest links, and travel destinations in the browser. Extraction resolves one concrete destination, the corrupted blood arena returning to Coalway swamp; other transition placements publish `destination: unresolved` because their destination scene is known but no verified arrival position is published. Two travel points therefore render without lines. Verify no panel shows coordinates, provenance, configuration dumps, or unresolved-semantics notices.
- [x] 6.4 Add place/entity/item search and source-to-map navigation. Verify an item can lead to multiple vendor, drop, resource, or container sources while preserving item context.
- [ ] 6.5 Verify the representative end-to-end pipeline before bulk collection: one outdoor area and one interior through extraction, repeat-load identities, capture, normalization, and browser picking/details. Include adjacent chunk seams, a clipped interior on one plane, a producer without a live node, and item-to-source navigation using generated static contracts. Label the preview incomplete. Acceptance remains pending a run on the single-plane model and supported build 25153357.
- [ ] 6.6 Add URL-backed view, selection, query, and filter state, with a layer parameter only where a map offers a choice. Verify reload, browser back/forward, travel navigation with its return control, and stale links in the browser. No map or floor parameter may remain.
- [x] 6.7 Add keyboard operation, focus restoration, narrow-screen panels, and non-color marker distinctions. Verify the complete search-to-detail journey without a pointer.
- [x] 6.8 Add build identity and coverage disclosure to the interface. Verify a partial research artifact cannot appear as a complete release.

## 6a. Single-plane and guide reset

The floor model, the analyst vocabulary, and the map selector are absent. A layer selector remains only where a map has an alternative layer. No compatibility shims, aliases, deprecated paths, or floor fields remain.

- [x] 6a.1 Re-baseline on the current build. Regenerate recovered type declarations, run extraction, and record the new build identity. Verify the artifacts of the retired build remain untouched as frozen reference and cannot mix with new runs.
- [x] 6a.2 Keep floor membership absent end to end: spatial profiles and normalization use no floor domains or resolution, and database and publication contracts contain no floor columns, scoping, or identity. Verify stacked placements keep distinct identities and their own heights, and that no artifact retains a floor field.
- [x] 6a.3 Keep reviewed ceiling machinery absent: capture plans and artifacts contain no ceiling reviews, selector resolution, evidence hashing, protected floor selectors, or per-floor vertical intervals. The conditional clip height is task 4.5.
- [x] 6a.4 Keep one world map navigable. Floor state and the map selector are absent; a layer selector is present only where a map offers an alternative layer. Verify no stale layer state survives a reload.
- [x] 6a.4a Isolate the runtime port so two instrumented games can run at once. `HOTREPL_PORT` moves Afallon off the shared default. Verify doctor rejects a connection to another game rather than extracting from it.
- [x] 6a.5 Use the game's own interaction and nameplate categories in the interface, with level-range display and filtering from extracted native sources. Verify no placement role, source family, map space, or authored term reaches the interface.
- [ ] 6a.6 Move coverage figures and unresolved-semantics disclosure out of the interface into the run manifest and coverage report, keeping one shared incomplete-preview mark and an optional data-status surface. Verify no marker, panel, or control repeats a coverage count.
- [x] 6a.7 Use one marker registry with glyph icons, colors, labels, precedence, render order, and default visibility, plus one resolution function and an icon atlas. Verify a registered category without a layer fails its test and one row never draws two markers.
- [x] 6a.8 Use the world map layout: shared-texture scenes from native registration, other maps by reviewed translation-only offsets, a deterministic non-overlapping initial arrangement, an authoring mode that drags a map with its markers, and offset export. Verify an unplaced map is reported and no native scene coordinate seeds a position.
- [x] 6a.9 Draw travel connections on the world map as one toggled group: the travel marker, a line to its destination, and a destination mark, including across maps and with disabled entries distinguished rather than hidden. Verify an unresolved destination draws no line, and that connections render in the authoring mode while a map moves.
- [ ] 6a.10 Add the Adventure Guide surfaces for dungeons, bosses, regions, and properties from the extracted native guide metadata. Text, abilities, stats, loot, and displayed drop chance are implemented, but public contracts do not carry dungeon artwork or boss portraits; asset extraction, serialization, hashing, and publication for those images are missing. Verify a scene the game excludes from its guide does not appear, and that the completed surfaces present the game's groups and artwork when those fields exist.
- [x] 6a.11 Establish the drop chance the game displays. Import the current binary, resolve the roll helpers and constants, and observe the guide's displayed value for a known boss against its recorded raw rates. Publish a chance only with that measurement and a test asserting it; otherwise publish quantities alone with no disclaimer.

## 7. Complete supported-build delivery

Full-world collection starts only after the representative end-to-end milestone in 6.5 passes. That milestone does not reduce the release coverage requirement.

- [ ] 7.1 Run extraction across the complete supported-build inventory. Verify no reachable source or relevant content family remains unresolved in the coverage ledger.
- [ ] 7.2 Capture all required outdoor areas and interiors, then generate their tile pyramids and world placements. Verify every expected chunk has a valid result, every published marker samples actual non-blank finest-level pixels, every published placement retains its authored world height, and every published map has a reviewed placement. The current public placement contract omits world height and tile validation checks only tile bounds, so this task remains incomplete.
- [ ] 7.3 Build the complete static artifact set and exercise representative map, loot, stock, gathering, quest, and transition journeys. Verify browser behavior, full-build filtering and aggregation performance, and actual download/file-size measurements.
- [ ] 7.4 Repeat extraction and resume a capture with unchanged inputs. Verify stable placement identities, compatible tile reuse, and no duplicate relationships.
- [ ] 7.5 Document the real operator commands, supported build, coverage results, and measured limitations. Verify the documented commands reproduce the artifact set from a fresh local run.

## 8. Publication handoff

- [ ] 8.1 Select artifact storage from measured byte and file-count limits. Confirm no proprietary source, raw evidence, secrets, or save files enter the source repository or public artifact set.
- [ ] 8.2 Prepare a versioned deployment and rollback procedure after publication authorization. Verify a local deployment smoke and restoration of the prior artifact set before any public release.
