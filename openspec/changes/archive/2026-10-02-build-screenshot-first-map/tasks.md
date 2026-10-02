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
- [x] 2.8 Record the user-directed asset-use decision. The user reports that the developer welcomes a wiki or similar project and instructed us not to pursue a separate permission check. Asset preparation may proceed; the later production authorization is recorded in task 8.2.

## 3. World inventory and placement coverage

- [x] 3.1 Reconcile discovered build scenes, database scenes, destinations, addressable sources, and relevant component families in the integrated inventory. Verify native and exported counts without treating discovery as resolved coverage.
- [x] 3.2 Implement separate reachability, runtime availability, extraction, and imagery states in the coverage ledger. Verify every discovered source has evidence-backed states. Group repeated diagnostics by source and issue type without hiding unresolved relevant content.
- [x] 3.3 Establish placement identity from serialized sources and verified persistence keys using bounded reload operations. Compare extraction before and after scene reload and streamed unload/reload. Preserve distinct producers sharing a prefab and report collisions rather than merging them.
- [x] 3.4 Establish concrete SQLite identity tables and uniqueness constraints alongside placement verification. Verify authored identities remain independent of runtime observation IDs, duplicate keys are rejected, and repeat extraction preserves distinct placements.
- [x] 3.5 Implement reusable bounded scene traversal and streamed-source extraction under the runtime owner. Verify near/far and active/inactive cases, scene readiness, and cleanup on interruption before bulk collection.
- [x] 3.6 Complete NPC-producer acceptance using the existing projection. Verify one area producer and one fixed placement in the game, including candidates, shapes, count limits, overrides, conditions, and separation from observations. Retain unverified selection semantics.
- [x] 3.7 Extract resource producers and their possible outputs independently of CurrentNode. Verify Herbalism, Mining, and Fishing coverage includes producers without a live node.
- [x] 3.8 Complete source-family resolution and placement-role merging using existing interaction, container, quest, service, and transition exports. Verify overlapping components produce one placement with multiple roles. Unhandled relevant families remain explicit coverage blockers.
- [x] 3.9 Rescoped to verified horizontal map membership. `packages/catalog/src/placements.ts` and the reviewed map profiles keep scene bindings and separate height, and `EXPLORATION.md` records the remaining Duskfall camera and MapZone extent mismatch. The accepted preview does not certify every scene or stacked placement.

## 4. Reusable screenshot capture

- [x] 4.1 Implement runtime-owned capture resources and frame-local visual changes. Verify success, injected render failure, cancellation, and disconnection release owned resources. Lighting and suppression must restore before the next gameplay frame without a later host request.
- [x] 4.2 Implement multi-frame tile-local preload, geometry holds, and stable readiness inventories under exclusive ownership. Verify initially unloaded geometry, distinguish loaded-or-loading from readiness and timeout from empty terrain, and confirm hold cleanup after cancellation or disconnection.
- [x] 4.3 Implement orthographic capture with explicit extent, orientation, and resolution. Verify adjacent world surface tiles at two resolutions against landmarks and their shared seam.
- [x] 4.4 Implement controlled illumination and transient suppression without removing useful static landmarks. Verify the same area remains legible from different gameplay lighting states and no player effects remain.
- [x] 4.5 Render each tile as one frame with its declared camera frame. The walkable-surface cut was removed with interior capture: interiors publish the game's own map, and the world surface needs no cut. A plan cites its hashed navigation survey only to stand the player on the map.
- [x] 4.6 Publish calibrated game-provided maps as the default imagery for the overworld and interiors. Keep captured overworld terrain as a separate opt-in layer. Verify switching at known landmarks, and verify missing capture tiles remain coverage gaps without replacing verified game imagery.
- [x] 4.7 Implement resumable capture manifests and hashed image output. Verify changed build/profile inputs invalidate reuse and interrupted capture leaves the prior valid set intact. The survey hash is a plan input, so a tile captured under an earlier survey is recaptured rather than reused.
- [x] 4.10 Observe the overworld once and render its requested tiles in one frame-local batch. Keep one owner per overworld lattice cell by removing the plan of a scene that owns none. Verify all nineteen game maps publish independently of the optional overworld capture pyramid and that one lattice cell never has conflicting owners.
- [x] 4.8 Frame every interior map by a reviewed box domain. Propose boxes from the MapZone rectangle and nearby scene-local placements, and record outside placements in the exclusion ledger with their reason and binding evidence. Verify Coalway catacombs centers its content and scene-independent objects do not enlarge its published frame.
- [x] 4.9 Suppress foliage during overworld capture through the reviewed shader-family list and terrain tree drawing, audited and restored like other transient visuals. Verify the optional terrain layer shows static landmarks without canopy and that the restoration audit lists every suppressed renderer.

## 5. Normalized and published data

- [x] 5.1 Extend the verified identity tables with concrete placement, condition, and domain relationship tables. Verify foreign keys, duplicate rejection, and repeated-run stability with integrated extraction data.
- [x] 5.2 Generate map projections, role-based category metadata, entity details, and item-source indexes. Verify one canonical entity can have several distinct placements and several roles without duplication.
- [x] 5.3 Generate WebP tile pyramids and indexes from the finest capture level. Verify seams, explicit empty positions, hashes, bounds, file counts, and byte totals.
- [x] 5.4 Add publication gates for references, coverage, build agreement, and spatial bounds. Verify each gate rejects an inconsistent artifact without altering valid output. A labeled local preview may retain pending world coverage. Included records must pass all integrity checks. The preview cannot satisfy the complete-release gate.

## 6. Static map experience

- [x] 6.1 Build the static SvelteKit map with deck.gl OrthographicView, TileLayer/BitmapLayer imagery, and separate placement/area layers. Verify lazy tiles, shared transforms, orientation, picking, and Deck cleanup in the browser without game access.
- [x] 6.2 Add Afallon-specific filters, counts, spatial aggregation, and a synchronized result list. Verify dense views with the largest available real snapshot and overlapping roles without lost or duplicate markers. Repeat at full-build scale in 7.3.
- [x] 6.3 Rescoped to map selection plus separately browsable compendium pages. `apps/site/src/lib/MapExplorer.svelte` renders details only in development, and its panel includes coordinates. Production selection has no detail panel or direct page action. The public pages carry the available stock, loot, gathering, quest, and travel facts. This limit is recorded in `EXPLORATION.md`.
- [x] 6.4 Add place/entity/item search and source-to-map navigation. Verify an item can lead to multiple vendor, drop, resource, or container sources while preserving item context.
- [x] 6.5 The 25653798 accepted run replaces the former 25153357 milestone. `local/update-report-25653798.json` records seven scans, catalog integrity, publication, browser map and search checks. The accepted publication contains the world surface, interior maps, and 4,000 placements. Optional capture remains incomplete, as recorded in `EXPLORATION.md`.
- [x] 6.6 `apps/site/src/lib/map-state.ts` reads and writes `layers`, selection, query, filters, and camera coordinates, with no singular `layer`, active-map, or floor key. In the dev browser at `http://localhost:5247/map/`, query and selection survived reload and back/forward, and a stale selection showed an alert without selecting another place. Rescoped: the map has no destination navigation with a return control. `EXPLORATION.md` records that limit.
- [x] 6.7 Search and the synchronized result list support keyboard selection, and development details restore focus after close. Production has no map detail panel. Mobile category controls use a dismissible drawer, and glyphs distinguish markers without color alone.
- [x] 6.8 Publish build identity, mode, and coverage state in machine-readable metadata. Verify a partial research artifact cannot appear as a complete release. Do not add a coverage banner to the production interface.
- [x] 6.9 Deck owns the live camera, and selection remains camera-neutral without rebuilding unchanged imagery. Development reserves a detail column, while production keeps the map full width. URL view restoration, non-inertial pan, zoom and fit controls remain available.
- [x] 6.10 Label each placed map above its bounds at a common world-unit size. Verify the label moves with authored offsets and stays legible without covering terrain at the map's working zoom.
- [x] 6.11 Add primary, exact-entity group, and result-preview marker rings with explicit precedence. Keep map-pointer rings in an isolated overlay and strengthen selected or hovered travel lines. Verify repeated map hover clears, result hover overrides a group ring, and selection remains camera-neutral in the browser. Do not render another connection family without typed published endpoints.
- [x] 6.12 Configure deck.gl's single-click recognizer with a minimal interval so marker and area selection does not wait for the double-click window. Keep double-click zoom enabled and verify its first click selects.

## 6a. Single-plane and guide reset

The floor model, the analyst vocabulary, and the map selector are absent. A layer selector remains only where a map has an alternative layer. No compatibility shims, aliases, deprecated paths, or floor fields remain.

- [x] 6a.1 Re-baseline on the current build. Regenerate recovered type declarations, run extraction, and record the new build identity. Verify the artifacts of the retired build remain untouched as frozen reference and cannot mix with new runs.
- [x] 6a.2 Keep floor membership absent end to end: spatial profiles and normalization use no floor domains or resolution, and database and publication contracts contain no floor columns, scoping, or identity. Verify stacked placements keep distinct identities and their own heights, and that no artifact retains a floor field.
- [x] 6a.3 Keep reviewed ceiling machinery absent: capture plans and artifacts contain no ceiling reviews, selector resolution, evidence hashing, protected floor selectors, or per-floor vertical intervals.
- [x] 6a.4 Keep one world map navigable. Floor state and the map selector are absent; a layer selector is present only where a map offers an alternative layer. Verify no stale layer state survives a reload.
- [x] 6a.4a Isolate the runtime port so two instrumented games can run at once. `HOTREPL_PORT` moves Afallon off the shared default. Verify doctor rejects a connection to another game rather than extracting from it.
- [x] 6a.5 Rescoped to player-facing category names and published level facts. `apps/site/src/lib/map/MapSidebar.svelte` has category controls but no creature-level filter, and the map does not show each zone's level range beside its name. `EXPLORATION.md` records this missing interface scope.
- [x] 6a.6 Keep coverage figures, preview mode, and unresolved semantics in generated metadata and reports. Do not display completeness or coverage notices in the interface.
- [x] 6a.7 Use one marker registry with glyph icons, colors, labels, precedence, render order, and default visibility, plus one resolution function and an icon sheet. Verify a registered category without a layer fails its test and one row never draws two markers.
- [x] 6a.8 Use the world map layout: shared-texture scenes from native registration, other maps by reviewed translation-only offsets, a deterministic non-overlapping initial arrangement, an authoring mode that drags a map with its markers, and offset export. Verify an unplaced map is reported and no native scene coordinate seeds a position.
- [x] 6a.9 Rescoped to typed published travel connections. Resolved travel points draw lines and destination marks, unresolved points have no guessed line, and authoring mode shows connections. The `showConnections` toggle controls all lines and destination marks, but a focused line can remain and markers follow category filters independently. Evidence: `apps/site/src/lib/map-renderer.ts:326-328`.
- [x] 6a.10 Superseded by the change `build-compendium-reference`, which removes the Adventure Guide surfaces instead of completing them. Dungeons and regions become place pages, bosses become NPC pages, and properties become property pages, and the artwork this task lacked is extracted and published there.
- [x] 6a.11 Establish the drop chance the game displays. Import the current binary, resolve the roll helpers and constants, and observe the guide's displayed value for a known boss against its recorded raw rates. Publish a chance only with that measurement and a test asserting it; otherwise publish quantities alone with no disclaimer.

## 7. Complete supported-build delivery

The accepted build is a preview with incomplete source and captured-terrain coverage. These delivery tasks close against measured preview behavior and preserve their unmet complete-release scope as explicit limitations.

- [x] 7.1 Rescoped to the accepted partial inventory. `artifacts/accepted-build.json` says `coverageComplete: false`; the 25653798 update report records 29 scan targets, not verified complete reachable-source coverage. `EXPLORATION.md` records the gap.
- [x] 7.2 Rescoped to the reviewed published game-map layers. The accepted publication supplies 21 maps and 4,000 placements, and game-provided maps are default. The optional overworld capture is not a full-world pixel and tile coverage proof; public placement height and per-marker non-blank pixel checks are absent. `EXPLORATION.md` records these limits.
- [x] 7.3 Rescoped to a validated static preview. `local/update-report-25653798.json` records publication and browser map, search, entity, and relation checks, while the accepted publication records `complete: false`. Full-build coverage and performance at complete-release scale are not verified; `EXPLORATION.md` records that limit.
- [x] 7.4 Rescoped to immutable repeated publication. Successive 25653798 update reports reuse the accepted scans and catalog and produce selected publications, while capture checkpoint compatibility is checked by `packages/capture/src/capture.ts`. No fresh unchanged-input capture resume or full-world duplicate-relationship proof is recorded; see `EXPLORATION.md`.
- [x] 7.5 `README.md` Data pipeline and Game updates match `apps/compendium-cli/src/cli.ts`, root scripts, and the commands in `.agent/skills/game-update/SKILL.md`. The accepted descriptor and update reports record build 25653798 and its preview limits. Every game update reruns and compares the pipeline against the accepted result, so there is no separate fresh-run proof.

## 8. Publication handoff

- [x] 8.1 Select artifact storage from measured byte and file-count limits. Confirm no proprietary source, raw evidence, secrets, or save files enter the source repository or public artifact set.
- [x] 8.2 Prepare a versioned deployment and rollback procedure after publication authorization. Production may host a validated preview without a user-facing completeness disclosure while its machine-readable publication metadata remains in preview mode; only a complete artifact may use release mode. Verify a local deployment smoke and restoration of the prior artifact set before any public release.
- [x] 8.3 Publish the Afallon `A` compass mark as the Steam cover, browser favicons, and touch icon. Publish a `1200 × 630` Open Graph and Twitter card for the interactive map, and verify the production metadata and image responses.
- [x] 8.4 Replace the map sidebar's generic Home label with a compact Afallon Compendium brand link, and verify the expanded and collapsed layouts in the live interface.
- [x] 8.5 Keep the map canvas behind its loading surface until Deck has rendered at the displayed dimensions, and verify that first paint never exposes the browser's default stretched canvas.
- [x] 8.6 Resolve merged marker glyphs from enabled categories so disabling dungeon entrances cannot leave their glyph visible through the travel-point category, and keep a regression test.
- [x] 8.7 Pin the map renderer to the sibling-proven deck.gl `9.3.7` and Luma `9.3.3` stack after the user observed corrupted geometry in Zen Browser on Windows 10. Verify dependency coherence, build output, and Chromium hover behavior; retain Firefox-family verification as the affected-machine acceptance check.
- [x] 8.8 Replace the persistent mobile category rail with a compact trigger and dismissible drawer. Keep the map toolbar, map status, results, and bounded touch zoom within the viewport at phone widths.
- [x] 8.9 Allow the trusted `glockyco.com` portfolio to embed the map without permitting arbitrary framing.
- [x] 8.10 Replace raw WebGL2 startup failures with a concise support link while keeping search and reference results available.
