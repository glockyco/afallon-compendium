## Context

See proposal.md for motivation and scope. The repository contains local extraction tooling, research evidence, and planning artifacts. The normalization pipeline and static site remain planned.

Afallon build 25144591 uses Unity 2022.3.62f2, IL2CPP, and the built-in render pipeline. The existing generic HotRepl host evaluates C# against Afallon-generated interop assemblies. Direct `ImageConversion.EncodeToPNG` works, despite the generic screenshot command's earlier encoding failure.

Live probes now produced 1024-square orthographic images of Coalway woods and a Duskfall dungeon room. Outdoor capture needs controlled illumination and transient suppression. A high dungeon camera sees the ceiling. A lower camera exposes part of the room without changing its meshes. Neither experiment establishes production capture quality or full map coverage.

The woods sample contains 421 addressable loaders. Initially 77 reported loaded or loading. A tile-area preload changed that count to 110 and changed `NeedsPreloadAround` from true to false. This supports tile-local preload, but readiness still needs exact loaded-source accounting and stabilization.

The same scene has 800 loaded NPCSpawner components including inactive objects, versus 661 active at the later sample. It has 641 OreSpawner components covering Herbalism, Mining, and Fishing. Only 16 currently had live resource nodes. A live-object-only exporter would miss most resource locations.

Canonical merchant extraction uses the current MerchantTables lists instead of the unset legacy merchantTableID. Four loot tables enable LevelBandGear. Native verification now establishes level-eligibility intervals and linked-NPC specialization decisions. Global world-loot bindings and supplemental cloth tiers are exported separately. Effective probabilities remain withheld.

## Goals / Non-Goals

**Goals:**
- Keep game access, normalization, and presentation independently replaceable through small explicit contracts.
- Produce evidence for completeness, not only plausible marker counts and attractive images.
- Reuse one spatial transform definition for imagery, markers, and navigation.
- Make recurring inspection and production runs reproducible through repository-owned commands.

**Non-Goals:**
- A shared multi-game framework, plugin system, graph engine, public API service, accounts, or live player tracking.
- Automatic save editing, forced loot rolls, or modification of unrelated characters.
- Public deployment without explicit user authorization.

## Decisions

### 1. One repository and three ordinary boundaries

The intended layout is `tools/` for host orchestration and C# probe sources, `pipeline/` for normalization, and `site/` for the static interface. These are modules, not independent services or a package framework.

Use TypeScript with Bun for host commands and normalization, SQLite for normalized relationships, and SvelteKit with static output for the site. Reuse the existing HotRepl client protocol/SDK instead of creating another runtime server. Python asset tooling remains available for offline inspection where it already works.

A Python-only pipeline was considered. TypeScript keeps publication contracts and host-side validation in one language. Runtime access still requires C#, so no design can make this extraction entirely TypeScript.

### 2. Reusable commands replace repeated manual orchestration

The existing commands are `doctor`, `inspect`, `probe`, `extract`, `traverse`, `capture`, and `illustration`. Capture accepts explicit camera plans and enters requested source scenes under runtime ownership. It requires a reviewed map-space profile. It requires stable tile-local geometry before rendering but does not establish complete imagery coverage. Normalization and publication commands remain planned. Configuration supplies explicit game paths, HotRepl endpoint, research character, and output locations. The installed game supplies the build identity.

Normal extraction includes canonical records, relationships, loot rules, world inventory, NPC producers, world sources, faction rules, and placement snapshots. It validates schemas, counts, and references, then resolves serialized identities and merges placement roles. Each observation records scene and character context. Sequential runtime calls are not one simultaneous observation. Traversal publishes these role and identity artifacts for each visited scene. Successful loaded-scene extraction does not establish full-world coverage.

The host owns connection lifecycle, request IDs, deadlines, scene readiness, cancellation, and run directories. One operation owns runtime access at a time. Competing operations wait or receive a busy result. They must not displace the owner. Cancellation or disconnection must clean up owned work before the next operation uses that state. Unconfirmed cleanup blocks further state-changing work and successful completion.

Repository-owned C# snippets perform small bounded runtime operations. Large records and image data use local artifact files with hashes and counts rather than oversized REPL result frames. CrossOver path translation is explicit and uses normalized paths.

Raw artifacts live in `artifacts/<build>/<run>/raw/`; normalized and published outputs occupy separate directories. A run manifest records input hashes, tool revision, parameters, outputs, and failures. Completion atomically selects a validated run. Retry and resume reuse only verified compatible artifacts.

Do not add a compiled game-specific mod until measured coroutine or lifetime constraints require one. The current host already proves evaluation, game coroutines, rendering, and file output.

### 3. Runtime-first extraction, offline identity assistance

The initialized runtime database is the first extraction source for canonical records and references. It avoids relying on partially recovered serialized layouts. Offline asset inspection supplies build inventories, source identities where available, and audit evidence. Native analysis targets unresolved extraction or capture behavior. Exhaustive decompilation is not a prerequisite for atlas delivery.

World extraction enumerates authored producers and inactive objects, then resolves streamed prefab sources. Scene transitions use the game's loading manager. Tile-local loading uses the game's preload mechanism with bounded readiness checks. The extractor does not equate entering a scene with loading all its content.

Traversal plans bound each complete step to 1–300 seconds, including scene loading, observations, and restoration. Stream holds add five seconds to that budget and remain below the native 360-second limit. A deadline failure still requires confirmed native cleanup and cannot produce a successful traversal.

Every build scene, database scene record, referenced destination, and streamed source enters a coverage ledger. Discovery and count reconciliation are separate from source classification and coverage resolution.

Keep reachability, runtime availability, extraction status, and imagery status separate. Reachability is unknown, reachable, unreachable, or unused. Extraction is pending, extracted, unsupported, or failed. Imagery is pending, captured, validated, failed, or evidence-backed not-applicable. Runtime availability records activation separately from load state. A loaded-or-loading signal is not proof of ready geometry.

Data extraction uses `extracted`. The `captured` state applies only to imagery. Raw data is not evidence of image capture. Diagnostics are grouped by source and issue type. The groups distinguish unset values, broken references, and unverified semantics. Repeated diagnostics do not count as distinct missing sources.

Coverage binds its role-resolution summary to the hashed placement-role artifact. Unplaced sources or unresolved role issue occurrences block role resolution independently of raw diagnostic groups. Occurrence counts do not imply distinct missing sources.

Reachable sources require extraction. Unused or unreachable classifications require evidence. Unknown reachability, unresolved relevant families, and missing required imagery block a complete release.

The traversal uses one research character and records character-dependent settings. Requirements are extracted as rules, not evaluated away against that character. Procedural producers remain authoritative even when no current instance exists.

### 4. Small relational model with explicit semantics

Use concrete tables for scenes, map spaces, image layers, entities, placements, spawn candidates, conditions, and domain relationships. Domain relationships include NPC loot-table references, loot entries, merchant stock groups, resource yields, quest associations, and transitions. Do not introduce a generic graph to avoid naming these relations.

Canonical keys include entity kind and native database ID. Placement keys prefer source scene and serialized asset/object identity. SaverIdentifier is a candidate only after stability and collision checks. A hierarchy-based fallback needs repeat-run validation and retains its source evidence. Runtime instance IDs are observation keys only. Cross-build correspondence is separate from identity within a build.

Establish the identity tables and uniqueness constraints alongside the identity investigation, before full-world collection. Compare extraction before and after scene reload and streamed unload/reload. Distinct producers that share a prefab must remain distinct. Report candidate-key collisions with their source evidence instead of merging them.

Reviewed map-space profiles bind exact source-scene IDs and paths to horizontal coordinate frames and explicit membership domains. Several source scenes can share one map space, and disjoint layouts in one scene can use separate map spaces. Floor domains use XYZ boxes with inclusive minima and exclusive maxima. Multiple matching floors remain ambiguous rather than selecting the nearest height. Membership domains do not establish capture bounds.

Authored region membership uses observed oriented boxes and spheres, including inactive volumes. Unsupported or contradictory shapes remain unresolved. Region predicates compile once per snapshot. Region instance IDs and negative template IDs remain observations rather than canonical region keys.

Placements retain XYZ, source scene, map space, optional floor, shape, roles, source object, and conditions. Spawn candidates retain multiplicity and area semantics. Generated resource observations link back to their producer. Several components on one authored object can contribute roles to one marker.

Within-run role joins require matching native component and GameObject observations, scene handles, component types, and all-component slots. Only verified serialized keys identify the resulting placements and sources. Missing bindings retain unplaced role evidence instead of using names or coordinates. Serialized preparation indexes source-bearing prefab roots and records other loaded roots as outside that query scope, not as unused content.

Authored capabilities and ranks remain separate from player-state faction alignment. Native faction rules determine enemy, friendly, and neutral facts. Those facts describe NPC-to-player alignment, not aggression or spawn probability. Unverified producer faction overrides suppress base-faction disposition. Disabled capability bindings remain preserved raw data without granting roles or creating unresolved role gaps.

The current OreSpawner name is misleading for categorization: live data proves Herbalism, Mining, and Fishing use it. The UI derives roles from referenced skills and effects. Candidate families include enemies and bosses; NPC services; gathering resources; containers; useful interactions; world quests; and entrances/transitions. Full inventory can add relevant families without copying Ancient Kingdoms' list.

### 5. Screenshot layers use their own capture extent

Primary imagery comes only from this project's capture pipeline against the supported game build. Do not substitute shipped map textures, illustrations, or community map images for primary captures, including missing tiles. Retain missing or failed captures as coverage gaps. Illustrations remain a separate optional layer.

Coalway woods and swamp share a reviewed native map-space transform. This does not establish artwork pixel registration or screenshot coverage. Duskfall's arrival room lies outside its single MapZone. Its authored trigger teleports the player into the mapped dungeon without changing scenes. Native visits confirm this transition and restore the source scene.

Capture extents therefore come from validated scene geometry, streamed-source coverage, and navigable region/floor evidence. MapZone is useful calibration evidence, not an unconditional capture boundary. The pipeline rejects unexplained out-of-bounds placements.

Scene registration matches each database `entryName` against exact Unity build-path basenames. Unavailable, unmatched, and ambiguous records remain explicit. A shared rendered map space is a separate decision. A local MapZone ID, texture name, or database map bound cannot establish that decision alone.

Native coordinate registration uses observed map-to-world basis samples and checks every world sample and native normalized round trip. Rotation and reflection are supported. Singular, non-horizontal, or contradictory samples remain unresolved. The stored Y coordinate describes the native map plane, not a gameplay floor. This transform does not establish image orientation or screenshot coverage.

Native triangulation is supporting evidence, not an automatic capture boundary. Duskfall's observed triangles span about 999 by 999 world units and 185 units of height. Their total bounds do not establish a playable dungeon boundary. The query collects all loaded navigation data, so per-triangle surface ownership remains unresolved. Triangulation omits off-mesh links and detailed grounding geometry. Grounded landmarks and native path queries are separate evidence for region and floor review.

Use an orthographic camera looking down world Y. The initial test covers 200 by 200 world units in 1024 pixels, or 5.12 pixels per unit. This is a probe setting, not the final resolution. Compare adjacent tiles at two resolutions before selecting one production profile. Generate coarser pyramid levels from the finest captured tiles.

Each capture records the camera's actual center, extent, and clipping planes, not only the requested settings. Native projection checks use the center and four corners on a plane inside the clipping interval. The host rejects missing controls or errors above one quarter pixel.

Each PNG has a hashed `compendium.capture-raster.v2` artifact linked by its image hash. Its `worldFromPixelEdge` frame maps top-left image edges into source-scene XZ coordinates. Pixel centers use `(column + 0.5, row + 0.5)`. Positive image X increases world X; positive image Y decreases world Z. Source-scene registration remains separate from reviewed map-space registration.

Each calibrated layer carries an explicit world-to-image transform. The offline illustration command verifies immutable image bytes, the reviewed map-space profile, and evidence hashes and JSON pointers. Calibrated artwork requires four distinct pixel controls, with one or more controls outside the three-point affine fit. Declared and independently fitted transforms must satisfy a quarter-pixel residual limit. Where artwork lacks verified registration, preserve it as an orientation-only layer without a marker transform. Illustration output cannot satisfy primary imagery or complete coverage.

### 6. Capture is a restorable rendering operation

Create a dedicated disabled camera, render target, and readable texture. Disable occlusion culling on that camera. Prepare and hold geometry for the complete tile frustum, including boundary overlap, before rendering. Record the source inventory and wait for stable readiness. A timeout is a failed tile, not empty space.

The capture plan uses schema `compendium.capture-plan.v3`. Its readiness profile bounds the whole tile to 1–300 seconds, requests 2–10 stable observations, and limits holds to 256 sources. The deadline includes rendering and stream restoration.

Source selection calls native `Covers` at the closest point on the expanded frustum to each loader. This tests the complete frustum against the native loading sphere without selecting the larger enclosing sphere. Geometry already observed inside the frustum also selects its source. Inactive sources remain separate evidence rather than receiving arbitrary activation changes.

The existing stream visitor owns holds and newly instantiated roots. Native cleanup restores the original holds and roots after success, failure, cancellation, or socket loss. Readiness requires initialized scene state, settled source handles, active loaded roots, and stable mesh, terrain, and material bindings. A combined loaded-or-loading flag is insufficient. Numbered inventories, observation contexts, stable frame IDs, hashes, and cleanup receipts remain with each tile.

Once a renderer enters the observation scope, later inventories continue inspecting its active bindings even outside the frustum. Animated bounds and changing intersection flags do not determine binding stability. Source identity, loaded state, mesh and material bindings, and integrity issues still determine readiness.

Mesh-less renderer components retain null bindings in the inventory. A null mesh alone does not establish a pending addressable load. Such rows prevent an empty classification while they remain relevant. Missing materials on present meshes, missing terrain data, and source-integrity issues block readiness. Readiness establishes the observed geometry state, not complete authored-content coverage.

Capture disables active game lights and uses its owned directional light with flat ambient illumination. It controls ambient sky, equator, ground, intensity, fog, and sky-reflection intensity. Its private camera does not copy gameplay camera post-processing. Native post-render checks reject changes to controlled lighting or suppression.

Capture preserves the Custom-mode spherical-harmonics cache without assigning `RenderSettings.ambientProbe`. Flat and Trilight getters return derived coefficients, but the setter changes the separate Custom-mode cache. The audit checks engine-derived ambient coefficients in the active color space. Frame cleanup restores the original mode and colors.

Renderer layers do not reliably separate the player from static geometry. A shared native selector identifies player bodies, mounts, owned actors, combat visuals, weather roots, camera particles, ground indicators, and non-looping particle roots. Particle-only selection preserves other actors' mesh renderers. Capture disables selected renderers, lights, and projectors, and excludes highlight effects through their camera masks. It preserves other landmark meshes and particles without disabling gameplay roots.

Geometry readiness resolves the same transient policy and reviewed ceiling selectors. Excluded renderer IDs and reasons remain in each inventory but do not affect geometry stability or missing-binding checks. Capture hashes the shared prelude with its other inputs. Session, restoration, and geometry observations use their v3 contracts.

Interiors use explicit floor/height slices first. All tiles in a floor plan use the same vertical clipping interval. Raster `verticalBounds` records the actual interval separately from the reviewed floor membership domain. Neighboring floor intervals can overlap to retain headroom and connecting geometry.

Ceiling reviews bind evidence hashes to complete hierarchy, mesh name, vertex count, and world bounds. Native selection rejects missing or ambiguous matches. Reviews can protect floor renderer selectors, whose enabled flags must remain true during rendering and after restoration. Selection changes renderer visibility only; it never changes shared meshes or gameplay roots. A combined mesh can serve several renderer regions and does not identify a ceiling by itself.

Capture enters another requested source scene through the existing owned scene visitor. The readiness timeout bounds each transition. Success requires restoration of the original source scene, position, and rotation. Native owner cleanup also restores that state after failure or disconnection.

A capture session records every changed property and object under two lifetimes. Scene loading, preload, readiness, geometry holds, and reusable disabled capture resources can span frames. Their cleanup belongs to the runtime operation and runs on success, failure, cancellation, or host disconnection. No later host restore request is required. Confirm cleanup before another operation uses the affected state.

Lighting changes, renderer suppression, and rendering form a frame-local operation. Its `finally` restores visual properties before the next gameplay frame, including on injected failure. A disconnected run cannot report success while cleanup is unconfirmed. The earlier ambient-mode observation does not prove complete restoration.

Capture writes `compendium.capture-tile-checkpoint.v1` after tile rendering, registration, visual restoration, and stream cleanup pass. Compatibility hashes include build, profile, implementation, character, scene, floor, resolution, lighting, readiness, frame, and reviewed ceilings. Unrelated tiles do not change a compatible tile's key.

Reuse validates artifact bytes and the complete native camera and restoration evidence. Copied artifacts retain their original native run and owner. All-reused runs do not allocate capture resources or load world inventories. Interrupted runs require matching clean native capture and runtime receipts; missing or pending cleanup blocks reuse. Verified receipts that were not registered before interruption become registered evidence in the resumed run.

`compendium.capture-set.v1` binds the exact expected tile list to validated checkpoints before atomic successful-run selection. A failed run cannot replace that selection. Capture sets do not establish full-world imagery. The publication gate makes that separate decision.

### 7. Tiles and map data form one publication artifact

Captured source images, tile pyramids, calibration, and marker projections carry one build identity. Tile filenames use content hashes and a generated index. Empty positions are explicit. A missing image or mismatched manifest blocks publication.

Use WebP delivery tiles and a measured zoom limit. Tile generation emits dimensions, byte totals, and file counts so hosting limits remain visible. Do not commit generated images or raw game data.

The user reports that the developer welcomes a wiki or similar project and directed us not to pursue a separate asset-permission check. Proceed with the planned asset preparation without that checkpoint. Select external artifact storage only after measured size and file counts are available. Deployment still requires explicit user authorization.

### 8. Small previews, persistent details, and source navigation

Use deck.gl, as requested by the user, with a browser-only `OrthographicView` and Cartesian coordinates. `TileLayer` loads screenshot tiles through `BitmapLayer` sublayers. Marker and area layers remain separate from the basemap. No geographic projection or Mapbox/MapLibre base map is required.

Use `OrthographicView({flipY: false})` so positive map Y points upward. The publication transform maps Unity X/Z into pixel-aligned map coordinates and retains world Y as elevation. The same transform determines tile bounds and marker positions. Tile origin, resolution, and zoom indexing come from the emitted manifest, not scattered browser constants. Verify image orientation with landmarks rather than applying another ad hoc Y negation.

The [OrthographicView contract](https://deck.gl/docs/api-reference/core/orthographic-view) defines zoom zero as one map unit per screen pixel. The [TileLayer contract](https://deck.gl/docs/api-reference/geo-layers/tile-layer) supports non-geographic indexing from the origin. The generated tile grid must match that indexing and the true image tile size.

Use IconLayer or ScatterplotLayer for placements and appropriate polygon/path layers for areas and transitions. A spatial index supplies low-zoom aggregation and the accessible result list. GPU rendering does not remove the need to limit labels and avoid overlapping markers. Keep stable layer IDs and data references so selection does not rebuild all geometry.

Svelte owns the URL state, controls, panels, and accessible list. A small adapter owns Deck lifecycle, layer construction, view changes, and picking. Finalize Deck and release image resources when the view unmounts. Keep game semantics and coordinate conversion outside that adapter.

Leaflet was a reasonable raster-only alternative, but deck.gl fits dense markers and areas while retaining the user's established stack. Do not create a generic renderer interface for an unneeded second renderer. Verify full-data performance, texture memory, and narrow-screen interaction before adding more machinery.

A marker preview contains identity, role, level or requirement, and a concise summary. Selection opens a side panel on desktop and a bottom sheet on narrow screens. The panel owns searchable full lists and conditions. It avoids a large popup that hides the selected area.

Vendor stock groups retain requirements and currency costs. Enemy loot preserves the distinction between known sources and verified chances. An item result links to all known source types and their placements. Transition navigation links maps while retaining browser history.

The URL owns map, layer, view, selection, search, and relevant filters. A keyboard-operable result list mirrors spatial results. Categories remain discoverable with counts, and overlapping roles do not duplicate markers. A common generated detail model supports both panels and later entity pages.

The site consumes published contracts only. SQL projections and spatial conversion belong in the pipeline, not components or a large presentation-heavy map query.

## Risks / Trade-offs

- [Distance streaming can omit authored objects and geometry] → Inventory source loaders and test near/far traversal, inactive content, and repeated extraction.
- [Capture shows ceilings, billboard artifacts, effects, or incomplete geometry] → Compare the actual game view, neighboring tiles, and floor slices before accepting a profile.
- [A map-space bound is misleading] → Validate landmarks, source geometry, and placement coverage independently for each space.
- [Dynamic gear and nested chance rules cannot be flattened safely] → Preserve rules, resolve behavior through targeted inspection, and withhold unsupported percentages.
- [Stable placement identity is unavailable on some producers] → Retain source evidence and stop silent merging. Prove fallbacks across repeat runs.
- [Complete coverage grows beyond initial samples] → Keep full coverage as the delivery gate. Representative samples validate mechanisms, not reduced scope.
- [Capture state restoration is incomplete] → Test success and injected failure, inspect state immediately, and keep unrelated saves untouched.
- [Static artifact volume exceeds host limits] → Measure complete pyramid size and file count before selecting deployment storage.

## Migration Plan

Preserve research evidence in ignored local storage. Integrate world probes first, then establish coverage states, placement identities, and identity constraints. Implement bounded traversal and capture mechanisms under exclusive runtime ownership.

Before full-world extraction or capture, validate one connected path through a representative outdoor area and an interior. It must cover extraction, repeat-load identities, capture, normalization, and browser picking and details. Include adjacent tile seams, an interior floor slice, a producer without a live node, and item-to-source navigation. The site must consume generated static contracts rather than raw probes or game access.

This milestone validates the complete mechanism. It does not reduce release coverage. After it passes, collect all reachable sources and required imagery. Repeat the UI and performance checks with the complete real dataset. Publish only a coherent validated artifact set with explicit user publication authorization. Keep the previous successful set available for rollback.

## Open Questions

- Which finest resolution and tile dimensions provide useful detail at an acceptable measured artifact size?
- Which per-map floor heights or reviewed suppression profiles are needed after the full scene inventory?
- Which illustrated maps support precise marker registration, rather than orientation-only viewing?
- Which static asset host is appropriate after output-size review?

These decisions are parameters within the defined capture and publication contracts. They do not remove any required map coverage.
