## Context

See proposal.md for motivation and scope. The repository contains local extraction tooling, research evidence, planning artifacts, a normalization pipeline, and a static site.

Afallon build 25153357 uses `GameAssembly.dll` and `global-metadata.dat` distinct from build 25144591. A full recovered-type diff reports six differences, all in combat and corruption types: a requirement effect-consumption change with an added `RequirementsMet` overload, an item-tooltip parameter, a character-updater addition, a new combat-settings field that shifts later offsets in that one type, and a new `CorruptionGearBonus` type. No map, guide, loot, scene, producer, `RegionTemplate`, or category type changed. Artifacts produced against 25144591 remain valid evidence for that build and cannot be reproduced; runtime work targets 25153357, and existing build-identity hashes prevent mixing the two.

Afallon uses Unity 2022.3.62f2, IL2CPP, and the built-in render pipeline. The existing generic HotRepl host evaluates C# against Afallon-generated interop assemblies. Direct `ImageConversion.EncodeToPNG` works, despite the generic screenshot command's earlier encoding failure.

Live probes produced 1024-square orthographic images of Coalway woods and a Duskfall dungeon room. World surface capture needs controlled illumination and transient suppression. A high dungeon camera sees the ceiling. A lower camera exposes part of the room without changing its meshes. Neither experiment establishes production capture quality or full map coverage.

The woods sample contains 421 addressable loaders. Initially 77 reported loaded or loading. A tile-area preload changed that count to 110 and changed `NeedsPreloadAround` from true to false. This supports tile-local preload, but readiness still needs exact loaded-source accounting and stabilization.

The same scene has 800 loaded NPCSpawner components including inactive objects, versus 661 active at the later sample. It has 641 OreSpawner components covering Herbalism, Mining, and Fishing. Only 16 currently had live resource nodes. A live-object-only exporter would miss most resource locations.

Canonical merchant extraction uses the current MerchantTables lists instead of the unset legacy merchantTableID. Four loot tables enable LevelBandGear. Native verification establishes level-eligibility intervals and linked-NPC specialization decisions. Global world-loot bindings and supplemental cloth tiers are exported separately.

Decompilation of `GenerateDroppedLoot` establishes the roll order: a table requirements gate, then per entry an item-level band, a quest-item gate, and the entry roll, with a drop limit stopping the first pass and a separate minimum-drop selection pass. It does not establish a probability. The roll compares a random value against a threshold built from unidentified helpers and constants, and a player stat transforms the random value before comparison, so authored rates alone do not determine the outcome. The game does display a chance per item in its Adventure Guide, through `AdventureGuideLootRow.Init(item, dropChance, min, max)`, whose body is not in the recovered declarations. That displayed value is measured on build 25153357. The guide prints the authored entry rate as a percentage, rounded to one decimal, and ignores the binding rate, `LimitDroppedItems` with `maxDroppedItems`, and the minimum-drop pass. Across the four Duskfall bosses the displayed set `5%, 7.6%, 9.1%, 10%, 10.1%, 10.4%, 10.5%, 10.7%, 11.1%, 15%, 15.5%, 30%, 100%` corresponds exactly to the authored rates `5.0, 7.55, 9.13, 10.0, 10.11, 10.44, 10.51, 10.66, 11.10, 15.0, 15.53, 30.0, 100.0`. One boss shows entry rate 15.53 as `15.5%` while its table limits drops to two of seven items, so the number the game shows a player is not an effective probability.

The compendium therefore publishes the entry rate the same way, matching the game, and continues to withhold any composed probability. Evidence is `research/spikes/guide-drop-chance-result.json`.

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

The existing commands are `doctor`, `inspect`, `probe`, `extract`, `traverse`, `capture`, `illustration`, `normalize`, `tiles`, and `publication`. Capture accepts explicit camera plans and visits requested source scenes under runtime ownership. A sweep claims ownership once, restores frame-local state and streams per plan, and finishes in the configured known-good scene, Coalway woods, rather than returning to the scene active at the start. This avoids a save that cannot load out of the corrupted challenge-stone arena (scene 16). Capture requires a reviewed map-space profile and stable tile-local geometry before rendering but does not establish complete imagery coverage. Normalization, tile generation, and publication consume verified artifacts without connecting to the game. Configuration supplies explicit game paths, HotRepl endpoint, research character, final scene, and output locations. The installed game supplies the build identity.

Normal extraction includes canonical records, relationships, loot rules, world inventory, NPC producers, world sources, faction rules, and placement snapshots. It validates schemas, counts, and references, then resolves serialized identities and merges placement roles. Each observation records scene and character context. Sequential runtime calls are not one simultaneous observation. Traversal publishes these role and identity artifacts for each visited scene. Successful loaded-scene extraction does not establish full-world coverage.

Two instrumented games cannot share one HotRepl port, and the connection reaches whichever bound first. `HOTREPL_PORT` gives each game its own port, and Afallon uses 18601. Doctor compares the connected product against the expected one, so a wrong game fails the command instead of producing a snapshot from another title.

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

Reviewed map profiles bind exact source-scene IDs and paths to horizontal coordinate frames and explicit membership domains. Several source scenes can share one map, and disjoint layouts in one scene can use separate maps. Membership is horizontal only; there are no floor domains. Membership domains do not establish capture bounds.

Authored area membership uses observed oriented boxes and spheres, including inactive volumes. Unsupported or contradictory shapes remain unresolved. Area predicates compile once per snapshot. Area instance IDs and negative template IDs remain observations rather than canonical area keys.

Placements retain XYZ, source scene, map, shape, roles, source object, and conditions. World height stays a retained field and never selects imagery. Spawn candidates retain multiplicity and area semantics. Generated resource observations link back to their producer. Several components on one authored object can contribute roles to one marker.

Within-run role joins require matching native component and GameObject observations, scene handles, component types, and all-component slots. Only verified serialized keys identify the resulting placements and sources. Missing bindings retain unplaced role evidence instead of using names or coordinates. Serialized preparation indexes source-bearing prefab roots and records other loaded roots as outside that query scope, not as unused content.

Authored capabilities and ranks remain separate from player-state faction alignment. Native faction rules determine enemy, friendly, and neutral facts. Those facts describe NPC-to-player alignment, not aggression or spawn probability. Unverified producer faction overrides suppress base-faction disposition. Disabled capability bindings remain preserved raw data without granting roles or creating unresolved role gaps.

The current OreSpawner name is misleading for categorization: live data proves Herbalism, Mining, and Fishing use it. The UI derives roles from referenced skills and effects. Candidate families include enemies and bosses; NPC services; gathering resources; containers; useful interactions; world quests; and entrances/transitions. Full inventory can add relevant families without copying Ancient Kingdoms' list.

### 5. The game's own presentation defines the player surface

`MapMinimap.MapZone` carries one `zone_id`, one map `Texture`, and one `BoxCollider`, with world-to-map conversion methods. `MapIconType` has exactly three tiers: `Default`, `Player`, `Important`. `MapManager` opens the map, adds icons, and reveals fog. `MapIcon` attaches to quests and world quests and sorts by priority. The game therefore shows one flat map per zone, with a player arrow, quest icons, and fog.

Duskfall Depths is a multi-level dungeon, and the game ships one texture for it, `Duskfall depths full map`. The Abandoned quarry zone uses a top-down terrain render, while the world surface map is illustrated parchment. The developer already produces the cutaway view this project needs, so a shipped texture is a framing and cut-height reference, never a published layer.

The map contract has no floors. Maps are single-plane. World height stays an ordinary placement field. Overlapping markers are acceptable because the game overlaps them too.

Player-facing categories come from the game's own enums, not from extraction families: `CursorType` gives merchant, quest giver, interactive object, crafting station, and enemy entity; `NameplateUnitType` gives enemy, neutral, and ally; nameplate sprites distinguish available, ongoing, and completed quests. Level ranges come from `RegionTemplate.LevelRangeMin/Max`, `RPGGameScene.DungeonLevelMin/Max` and `ZoneScalingMin/Max`, `NPCSpawner` scaling overrides, and `QuestLevelRange`. `MinimapDisplay` renders them beside a name, as in `Coalway swamp (lvl.1-20)`.

The compendium's information architecture mirrors the in-game Adventure Guide: dungeons with artwork, description, level range and bosses; a boss with abilities, stats and loot; regions; properties. That structure is authored in `RPGGameScene` guide metadata and boss references and in `RegionTemplate` guide metadata. In build 25153357, the runtime assigns `RegionTemplate` records an integer ID of `-1` while `GameDatabase` exposes them under string dictionary keys. The integer identity contract therefore keeps these records observed but unpublished until a separate identity change provides evidence for those keys.

Guide publication contains no artwork or boss portraits. `RPGGameScene.adventureGuideImageKey` is extracted as scene gameplay metadata. Canonical NPC records expose `entryIcon` metadata with a name, rect, and texture name. The native `ADVENTURE_GUIDE_BOSS` record contains only `npcID`; it has no portrait reference. `RegionTemplate.adventureGuideImage` is a Sprite reference, but `RegionTemplate` records are unpublished because their runtime identity is a string key outside the integer identity contract. Real guide artwork requires an asset path that resolves image keys, serializes sprite and texture bytes, hashes and validates the assets, and adds image references to the guide publication and site. That extraction and publication path is absent.

Evidence honesty belongs to the producer that owns each measurement. Coverage figures and diagnostic totals live in the run manifest and coverage report. The interface marks an incomplete preview once and never repeats counts or unresolved-semantics notices in panels. This follows the sibling compendium's availability pattern, where a shared notice marks a flag and no page renders an unremarkable field.

### 6. Screenshot layers use their own capture extent

Primary imagery comes only from this project's capture pipeline against the supported game build. Do not substitute shipped map textures, illustrations, or community map images for primary captures, including missing tiles. Retain missing or failed captures as coverage gaps. Illustrations remain a separate optional layer.

Coalway woods and swamp share one native `MapZone` texture, `Newest map` at 7540 by 8192 pixels, with the same center, size, and rotation. The game therefore already covers several world surface scenes with one map, and those scenes need no manual composition. Only zones that the game never positions relative to each other, such as cave and dungeon zones, need reviewed manual placement on the world map.

Manual placement is translation only at a shared world scale, and it moves a map's imagery and markers together. Native scene coordinates cannot seed that layout: Coalway spans 7472 by 8118 world units centred at (751, -2984), while Abandoned mine spans 404 by 429 centred at (277, -779) and lies entirely inside Coalway's footprint. Every scene authors its own origin near the world centre. The initial layout is therefore a deterministic non-overlapping arrangement that a reviewer then drags into shape, with the offsets exported for review. Accept the resulting scale disparity: an 18-to-1 linear ratio between the largest world surface scene and a small cave zone means small maps are specks at overview zoom, and the pyramid's coarse levels handle that.

Duskfall's arrival room lies outside its single `MapZone`. Its authored trigger teleports the player into the mapped zone without changing scenes. The game does not show that room on any map, and the project matches the game: the room is not captured and its one placement is an explicit, evidence-backed exclusion rather than a separate map.

Capture extents therefore come from validated scene geometry, streamed-source coverage, and navigable area evidence. MapZone is useful calibration evidence, not an unconditional capture boundary. The pipeline rejects unexplained out-of-bounds placements.

Scene registration matches each database `entryName` against exact Unity build-path basenames. Unavailable, unmatched, and ambiguous records remain explicit. A shared rendered map space is a separate decision. A local MapZone ID, texture name, or database map bound cannot establish that decision alone.

Native coordinate registration uses observed map-to-world basis samples and checks every world sample and native normalized round trip. Rotation and reflection are supported. Singular, non-horizontal, or contradictory samples remain unresolved. The stored Y coordinate describes the native map plane, not a gameplay floor. This transform does not establish image orientation or screenshot coverage.

Native triangulation is supporting evidence, not an automatic capture boundary. Duskfall's observed triangles span about 999 by 999 world units and 185 units of height. Their total bounds do not establish a playable dungeon boundary. The query collects all loaded navigation data, so per-triangle surface ownership remains unresolved. Triangulation omits off-mesh links and detailed grounding geometry. Grounded landmarks and native path queries are separate evidence for area review and route evidence.

Use an orthographic camera looking down world Y. The initial test covers 200 by 200 world units in 1024 pixels, or 5.12 pixels per unit. This is a probe setting, not the final resolution. Compare adjacent tiles at two resolutions before selecting one production profile. Generate coarser pyramid levels from the finest captured tiles.

Each capture records the camera's actual center, extent, and clipping planes, not only the requested settings. Native projection checks use the center and four corners on a plane inside the clipping interval. The host rejects missing controls or errors above one quarter pixel.

Each PNG has a hashed `CaptureRaster` artifact defined in `tools/capture-contracts.ts`, linked by its image hash. Its `worldFromPixelEdge` frame maps top-left image edges into source-scene XZ coordinates. Pixel centers use `(column + 0.5, row + 0.5)`. Positive image X increases world X; positive image Y decreases world Z. Source-scene registration remains separate from reviewed map-space registration.

Each calibrated layer carries an explicit world-to-image transform. The offline illustration command verifies immutable image bytes, the reviewed map-space profile, and evidence hashes and JSON pointers. Calibrated artwork requires four distinct pixel controls, with one or more controls outside the three-point affine fit. Declared and independently fitted transforms must satisfy a quarter-pixel residual limit. Where artwork lacks verified registration, preserve it as an orientation-only layer without a marker transform. Illustration output cannot satisfy primary imagery or complete coverage.

### 7. Capture is a restorable rendering operation

Create a dedicated disabled camera, render target, and readable texture. Disable occlusion culling on that camera. Prepare and hold geometry for the complete tile frustum, including boundary overlap, before rendering. Record the source inventory and wait for stable readiness. A timeout is a failed tile, not empty space.

`CapturePlan` and its readiness profile are defined in `tools/capture-contracts.ts`. The profile has separate `readinessTimeoutMs`, `renderTimeoutMs`, `encodeTimeoutMs`, and `cleanupGraceMs` budgets, plus stable-frame and source-hold limits. Readiness, rendering, encoding, and cleanup have separate budgets, so an exhausted operation budget cannot prevent restoration.

Source selection calls native `Covers` at the closest point on the expanded frustum to each loader. This tests the complete frustum against the native loading sphere without selecting the larger enclosing sphere. Geometry already observed inside the frustum also selects its source. Inactive sources remain separate evidence rather than receiving arbitrary activation changes.

The existing stream visitor owns holds and newly instantiated roots. Native cleanup restores the original holds and roots after success, failure, cancellation, or socket loss. Readiness requires initialized scene state, settled source handles, active loaded roots, and stable mesh, terrain, and material bindings. A combined loaded-or-loading flag is insufficient. Numbered inventories, observation contexts, stable frame IDs, hashes, and cleanup receipts remain with each tile.

Once a renderer enters the observation scope, later inventories continue inspecting its active bindings even outside the frustum. Animated bounds and changing intersection flags do not determine binding stability. Source identity, loaded state, mesh and material bindings, and integrity issues still determine readiness.

Mesh-less renderer components retain null bindings in the inventory. A null mesh alone does not establish a pending addressable load. Such rows prevent an empty classification while they remain relevant. Missing materials on present meshes, missing terrain data, and source-integrity issues block readiness. Readiness establishes the observed geometry state, not complete authored-content coverage.

Capture disables active game lights and uses its owned directional light with flat ambient illumination. It controls ambient sky, equator, ground, intensity, fog, and sky-reflection intensity. Its private camera does not copy gameplay camera post-processing. Native post-render checks reject changes to controlled lighting or suppression.

Capture preserves the Custom-mode spherical-harmonics cache without assigning `RenderSettings.ambientProbe`. Flat and Trilight getters return derived coefficients, but the setter changes the separate Custom-mode cache. The audit checks engine-derived ambient coefficients in the active color space. Frame cleanup restores the original mode and colors.

Renderer layers do not reliably separate the player from static geometry. A shared native selector identifies player bodies, mounts, owned actors, combat visuals, weather roots, camera particles, ground indicators, and non-looping particle roots. Particle-only selection preserves other actors' mesh renderers. Capture disables selected renderers, lights, and projectors, and excludes highlight effects through their camera masks. It preserves other landmark meshes and particles without disabling gameplay roots.

Geometry readiness resolves the same transient policy that rendering uses. Excluded renderer IDs and reasons remain in each inventory but do not affect geometry stability or missing-binding checks. Capture hashes the shared prelude with its other inputs. Session, restoration, and geometry observations use their v3 contracts.

Clipping is off by default and set by review. A plan without a clip height captures with the camera frame it declares, which covers every world surface extent. A map whose content is covered by geometry above it gets a hand-reviewed clip height in its plan, and the raster records the effective frame and that reviewed origin. Every chunk of one map shares that height, so the map stays one coherent plane.

Automatic derivation was implemented and then removed. Deriving a height from the navigable surface, placements and upward raycasts made the decision depend on tile size rather than on the scene: the same cave position reported covering geometry in a 200-unit tile and open sky in a 70-unit tile containing that exact point, and requiring one renderer to cover all content guaranteed failure in a cave built from many ceiling pieces. Per-map review is a one-time task, its result is directly checkable against the rendered image, and it avoids a coverage threshold nobody can justify.

Renderer-name rules do not identify ceilings either. One cave scene contains `Massive_Cave_Ceiling_*` renderers at about 50 units above its floor, and a reviewed dungeon scene contains no renderer whose name matches ceiling or roof. A positive control confirms that absence. Skybox objects such as `Planet` and `Rings` sit thousands of units up, so a highest-renderer rule is unusable as well.

A probe shows a clip plane at camera height -800 exposing a Duskfall room without disabling or deleting geometry, while a high camera sees only its rocky ceiling. Clipping, not suppression, is the mechanism.

A scene whose content spans more vertical range than one height can serve stays an explicit unresolved gap. A mixed surface-and-cave scene is the expected case: no height both keeps the hillside and reveals the cave.

Capture visits each requested source scene through the owned scene visitor. The readiness budget bounds each transition. A sweep finishes in the configured known-good scene, Coalway woods, with its configured position and rotation; it does not restore the scene that was active at the start. Native owner cleanup restores frame-local state and streams after failure or disconnection.

A capture session records every changed property and object under two lifetimes. Scene loading, preload, readiness, geometry holds, and reusable disabled capture resources can span frames. Their cleanup belongs to the runtime operation and runs on success, failure, cancellation, or host disconnection. No later host restore request is required. Confirm cleanup before another operation uses the affected state.

Lighting changes, renderer suppression, and rendering form a frame-local operation. Its `finally` restores visual properties before the next gameplay frame, including on injected failure. A disconnected run cannot report success while cleanup is unconfirmed. The earlier ambient-mode observation does not prove complete restoration.

Capture writes the tile-checkpoint contract defined in `tools/capture-contracts.ts` after tile rendering, registration, visual restoration, and stream cleanup pass. Compatibility hashes include build, profile, implementation, character, scene, clip height, resolution, lighting, readiness, and frame. Unrelated tiles do not change a compatible tile's key.

Reuse validates artifact bytes and the complete native camera and restoration evidence. Copied artifacts retain their original native run and owner. All-reused runs do not allocate capture resources or load world inventories. Interrupted runs require matching clean native capture and runtime receipts; missing or pending cleanup blocks reuse. Verified receipts that were not registered before interruption become registered evidence in the resumed run.

`CaptureSet` in `tools/capture-contracts.ts` binds the exact expected tile list to validated checkpoints before atomic successful-run selection. A failed run cannot replace that selection. Capture sets do not establish full-world imagery. The publication gate makes that separate decision.

### 8. Tiles and map data form one publication artifact

Captured source images, tile pyramids, calibration, and marker projections carry one build identity. Tile filenames use content hashes and a generated index. Empty positions are explicit. A missing image or mismatched manifest blocks publication.

Publish WebP delivery tiles with `tileSize: 256` and global integer `(x, y)` indices. At zoom `z`, tile `(x, y)` covers world `[x·256/2^z, (x+1)·256/2^z] × [y·256/2^z, (y+1)·256/2^z]`. Set `maxZoom = log2(1024 / captureEdge)`, merge each coarser level from a 2×2 child group, and keep contiguous levels through `minZoom`. Pixel row zero is the top edge. The published extent is the union of the finest tile bounds, and all coordinates use the same map-space system as placements. A reviewed rectangular capture grid emits every cell in that rectangle. Placement density cannot remove an interior cell because that would create missing imagery during zoom transitions. Tile generation emits dimensions, byte totals, and file counts so hosting limits remain visible. Do not commit generated images or raw game data.

The user reports that the developer welcomes a wiki or similar project and directed us not to pursue a separate asset-permission check. Asset preparation can proceed without that checkpoint. Select external artifact storage only after measured size and file counts are available. Deployment still requires explicit user authorization.

### 9. Small previews, persistent details, and source navigation

Use deck.gl, as requested by the user, with a browser-only `OrthographicView` and Cartesian coordinates. `TileLayer` loads screenshot tiles through `BitmapLayer` sublayers. Marker and area layers remain separate from the basemap. No geographic projection or Mapbox/MapLibre base map is required.

Use `OrthographicView({flipY: false})` so positive map Y points upward. The publication transform maps Unity X/Z into pixel-aligned map coordinates. Normalized placement records retain Unity world Y, but the current public placement contract does not expose that height. This requirement remains unmet: 743 coincident groups share exact X/Z coordinates, and 386 groups contain distinct authored objects in one scene, so height can be the only distinguishing field. The same transform determines tile bounds and marker positions. Tile origin, resolution, and zoom indexing come from the emitted manifest, not scattered browser constants. Verify image orientation with landmarks rather than applying another ad hoc Y negation.

The [OrthographicView contract](https://deck.gl/docs/api-reference/core/orthographic-view) defines zoom zero as one map unit per screen pixel. The [TileLayer contract](https://deck.gl/docs/api-reference/geo-layers/tile-layer) supports non-geographic indexing from the origin. The generated tile grid must match that indexing and the true image tile size.

Markers follow the sibling atlases. Both build a deck.gl icon atlas from Lucide `IconNode` values, drawing a white glyph on a colored circle, and both keep one registry that owns icon, color, label, plural label, icon size, precedence, render order, and default visibility, with one `resolveMarker(row)` returning a single marker per row. Adopt that shape rather than inventing a third arrangement: one registry module, one atlas builder, one resolution function, and a registration test that fails when a registered marker has no layer. Render order stays semantic, and the atlas is built once rather than per layer update.

Travel connections follow the sibling atlas's zone-line arrangement: three coordinated layers under one visibility key, being a line from source to destination, a mark at the destination, and the travel marker itself, with disabled entries recolored rather than removed. Keep that grouping. Connections also serve the world layout: with them visible in the authoring mode, a stretched or crossed line exposes a wrong offset immediately, which is cheaper than eyeballing terrain edges.

Use IconLayer or ScatterplotLayer for placements and appropriate polygon/path layers for areas and transitions. A spatial index supplies low-zoom aggregation and the accessible result list. GPU rendering does not remove the need to limit labels and avoid overlapping markers. Keep stable layer IDs and data references so selection does not rebuild all geometry.

Svelte owns the URL state, controls, panels, and accessible list. A small adapter owns Deck lifecycle, layer construction, the live camera, and picking. Deck receives `initialViewState` and controls pan, zoom, and inertia without a parent camera echo. View callbacks are observations for URL persistence and viewport results; they do not rebuild layers. Selection changes semantic state only. Explicit zoom, fit, and history restoration commands can move the camera. Captured imagery and orientation-only illustrations keep separate camera snapshots because they use different coordinate spaces. The left controls and right details occupy persistent full-height columns, so opening details does not resize the map or the results region. Finalize Deck and release image resources when the view unmounts. Keep game semantics and coordinate conversion outside that adapter.

Leaflet was a reasonable raster-only alternative, but deck.gl fits dense markers and areas while retaining the user's established stack. Do not create a generic renderer interface for an unneeded second renderer. Verify full-data performance, texture memory, and narrow-screen interaction before adding more machinery.

A marker preview contains identity, category, level, and a concise summary. Selection opens a side panel on desktop and a bottom sheet on narrow screens. The panel owns searchable full lists and conditions. It avoids a large popup that hides the selected area.

Panels present player questions in the game's words. They carry no coordinates, provenance, source configuration dumps, or unresolved-semantics notices. A value that is not established is omitted, not annotated. Vendor stock groups retain requirements and currency costs. An item result links to all known source types and their places. At initial load, search uses place labels, entity names and descriptions, item names, source names, and source kinds; forward keys resolve matching placements. After selection, the item detail document adds condition values, requirements, and quantities to the detail search. The full source-text field was 1,562,949 bytes, more than one third of the 4,275,809-byte compact publication, so the map index keeps only distinct source names and kinds, measured at 147,623 bytes.

There is one world map, so there is no map selector, no floor selector, and no layer selector unless a map actually has an alternative layer. The sidebar carries game-vocabulary category sections and a level filter, following the sibling atlases.

The URL owns view, selection, search, and relevant filters, plus the layer only where a choice exists. A keyboard-operable result list mirrors spatial results. Categories remain discoverable with counts, and overlapping roles do not duplicate markers. A common generated detail model supports both panels and later entity pages.

The site consumes published contracts only. SQL projections and spatial conversion belong in the pipeline, not components or a large presentation-heavy map query.

## Risks / Trade-offs

- [Distance streaming can omit authored objects and geometry] → Inventory source loaders and test near/far traversal, inactive content, and repeated extraction.
- [Capture shows ceilings, billboard artifacts, effects, or incomplete geometry] → Compare the actual game view, the shipped map texture, and neighboring chunks before accepting a profile.
- [One clip height cannot serve a scene that mixes surface and cave content] → Report the vertical-extent gap and resolve it per scene rather than reintroducing floors.
- [Manual world placement drifts or is forgotten for a new map] → Keep offsets in a reviewed file, report unplaced maps, and never infer a position from native scene coordinates.
- [A map-space bound is misleading] → Validate landmarks, source geometry, and placement coverage independently for each space.
- [Dynamic gear and nested chance rules cannot be flattened safely] → Preserve rules, resolve behavior through targeted inspection, and withhold unsupported percentages.
- [Stable placement identity is unavailable on some producers] → Retain source evidence and stop silent merging. Prove fallbacks across repeat runs.
- [Complete coverage grows beyond initial samples] → Keep full coverage as the delivery gate. Representative samples validate mechanisms, not reduced scope.
- [Capture state restoration is incomplete] → Test success and injected failure, inspect state immediately, and keep unrelated saves untouched.
- [Static artifact volume exceeds host limits] → Measure complete pyramid size and file count before selecting deployment storage.

## Migration Plan

Preserve research evidence in ignored local storage. Integrate world probes first, then establish coverage states, placement identities, and identity constraints. Implement bounded traversal and capture mechanisms under exclusive runtime ownership.

The representative world surface and zone path covers extraction, repeat-load identities, capture, normalization, and browser picking from generated static contracts. It includes adjacent chunk seams, a reviewed zone clip height, a producer without a live node, and item-to-source navigation. Full-world extraction and imagery remain separate release gates.

The current pipeline has no floor domains, floor resolution, ceiling selectors, per-floor pyramids, floor scoping, or floor and map URL state. The current build baseline is 25153357; artifacts for 25144591 remain frozen reference data and cannot mix with it.

The mechanism is implemented and measured, but it does not reduce release coverage. Full-world collection, complete UI and performance checks, and publication authorization remain required before release. A validated successful artifact set remains available for rollback.

## Open Questions

- The finest resolution and tile dimensions remain open. Select them after complete-build detail and byte-size measurements.
- A reviewer sets `clipHeight` per map when overhead geometry obscures the selected content. Automatic derivation is not used. Evidence: `EXPLORATION.md`, “World surface, reviewed clipping, and displayed drop chance”.
- No common clip-height margin is established across caves and two-storey buildings. Set each map's value by reviewing rendered imagery and its vertical coverage.
- Mixed world surface and zone scenes remain open. Settle each scene through complete geometry inventory and rendered-image review.
- The Adventure Guide displays the authored entry rate rounded to one decimal place. It does not compose an effective probability from outer rates, drop limits, or the minimum-drop pass. Evidence: `research/spikes/guide-drop-chance-result.json`.
- Illustrated-layer registration remains open for layers without four reviewed landmark controls. Keep those layers orientation-only until the controls and residual checks are available.
- Static asset-host selection remains open. Select a host after complete pyramid byte and file-count measurements are compared with its limits.

These decisions are parameters within the defined capture and publication contracts. They do not remove any required map coverage.
