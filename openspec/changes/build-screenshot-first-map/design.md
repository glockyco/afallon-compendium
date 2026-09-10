## Context

See proposal.md for motivation and scope. The repository contains local extraction tooling, research evidence, and planning artifacts. The normalization pipeline and static site remain planned.

Steam updated Afallon from build 25144591 to 25153357 during development, replacing `GameAssembly.dll` and `global-metadata.dat`. A full recovered-type diff between the builds reports six differences, all in combat and corruption types: a requirement effect-consumption change with an added `RequirementsMet` overload, an item-tooltip parameter, a character-updater addition, a new combat-settings field that shifts later offsets in that one type, and a new `CorruptionGearBonus` type. No map, guide, loot, scene, producer, region, or category type changed. Every artifact produced against 25144591 remains valid evidence for that build and cannot be reproduced now; new runtime work targets 25153357, and the existing build-identity hashes prevent mixing the two.

Afallon uses Unity 2022.3.62f2, IL2CPP, and the built-in render pipeline. The existing generic HotRepl host evaluates C# against Afallon-generated interop assemblies. Direct `ImageConversion.EncodeToPNG` works, despite the generic screenshot command's earlier encoding failure.

Live probes now produced 1024-square orthographic images of Coalway woods and a Duskfall dungeon room. Outdoor capture needs controlled illumination and transient suppression. A high dungeon camera sees the ceiling. A lower camera exposes part of the room without changing its meshes. Neither experiment establishes production capture quality or full map coverage.

The woods sample contains 421 addressable loaders. Initially 77 reported loaded or loading. A tile-area preload changed that count to 110 and changed `NeedsPreloadAround` from true to false. This supports tile-local preload, but readiness still needs exact loaded-source accounting and stabilization.

The same scene has 800 loaded NPCSpawner components including inactive objects, versus 661 active at the later sample. It has 641 OreSpawner components covering Herbalism, Mining, and Fishing. Only 16 currently had live resource nodes. A live-object-only exporter would miss most resource locations.

Canonical merchant extraction uses the current MerchantTables lists instead of the unset legacy merchantTableID. Four loot tables enable LevelBandGear. Native verification now establishes level-eligibility intervals and linked-NPC specialization decisions. Global world-loot bindings and supplemental cloth tiers are exported separately.

Decompilation of `GenerateDroppedLoot` establishes the roll order: a table requirements gate, then per entry an item-level band, a quest-item gate, and the entry roll, with a drop limit stopping the first pass and a separate minimum-drop selection pass. It does not establish a probability. The roll compares a random value against a threshold built from unidentified helpers and constants, and a player stat transforms the random value before comparison, so authored rates alone do not determine the outcome. The game does display a chance per item in its Adventure Guide, through `AdventureGuideLootRow.Init(item, dropChance, min, max)`, whose body is not in the recovered declarations. That displayed value is the acceptance target, and it needs a measurement on the current build.

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

Authored region membership uses observed oriented boxes and spheres, including inactive volumes. Unsupported or contradictory shapes remain unresolved. Region predicates compile once per snapshot. Region instance IDs and negative template IDs remain observations rather than canonical region keys.

Placements retain XYZ, source scene, map, shape, roles, source object, and conditions. World height stays a retained field and never selects imagery. Spawn candidates retain multiplicity and area semantics. Generated resource observations link back to their producer. Several components on one authored object can contribute roles to one marker.

Within-run role joins require matching native component and GameObject observations, scene handles, component types, and all-component slots. Only verified serialized keys identify the resulting placements and sources. Missing bindings retain unplaced role evidence instead of using names or coordinates. Serialized preparation indexes source-bearing prefab roots and records other loaded roots as outside that query scope, not as unused content.

Authored capabilities and ranks remain separate from player-state faction alignment. Native faction rules determine enemy, friendly, and neutral facts. Those facts describe NPC-to-player alignment, not aggression or spawn probability. Unverified producer faction overrides suppress base-faction disposition. Disabled capability bindings remain preserved raw data without granting roles or creating unresolved role gaps.

The current OreSpawner name is misleading for categorization: live data proves Herbalism, Mining, and Fishing use it. The UI derives roles from referenced skills and effects. Candidate families include enemies and bosses; NPC services; gathering resources; containers; useful interactions; world quests; and entrances/transitions. Full inventory can add relevant families without copying Ancient Kingdoms' list.

### 5. The game's own presentation defines the player surface

`MapMinimap.MapZone` carries one `zone_id`, one map `Texture`, and one `BoxCollider`, with world-to-map conversion methods. `MapIconType` has exactly three tiers: `Default`, `Player`, `Important`. `MapManager` opens the map, adds icons, and reveals fog. `MapIcon` attaches to quests and world quests and sorts by priority. The game therefore shows one flat map per zone, with a player arrow, quest icons, and fog.

Duskfall Depths is a multi-level dungeon, and the game ships one texture for it, `Duskfall depths full map`. The Abandoned quarry map is a top-down terrain render, while the overworld map is illustrated parchment. The developer already produces the cutaway view this project needs, so a shipped texture is a framing and cut-height reference, never a published layer.

Floors were this project's invention. Maps are single-plane. World height stays an ordinary placement field. Overlapping markers are acceptable because the game overlaps them too.

Player-facing categories come from the game's own enums, not from extraction families: `CursorType` gives merchant, quest giver, interactive object, crafting station, and enemy entity; `NameplateUnitType` gives enemy, neutral, and ally; nameplate sprites distinguish available, ongoing, and completed quests. Level ranges come from `RegionTemplate.LevelRangeMin/Max`, `RPGGameScene.DungeonLevelMin/Max` and `ZoneScalingMin/Max`, `NPCSpawner` scaling overrides, and `QuestLevelRange`. `MinimapDisplay` renders them beside a name, as in `Coalway swamp (lvl.1-20)`.

The compendium's information architecture mirrors the in-game Adventure Guide: dungeons with artwork, description, level range and bosses; a boss with abilities, stats and loot; regions; properties. That structure is authored in `RPGGameScene` guide metadata and boss references and in `RegionTemplate` guide metadata.

Evidence honesty belongs to the producer that owns each measurement. Coverage figures and diagnostic totals live in the run manifest and coverage report. The interface marks an incomplete preview once and never repeats counts or unresolved-semantics notices in panels. This follows the sibling compendium's availability pattern, where a shared notice marks a flag and no page renders an unremarkable field.

### 6. Screenshot layers use their own capture extent

Primary imagery comes only from this project's capture pipeline against the supported game build. Do not substitute shipped map textures, illustrations, or community map images for primary captures, including missing tiles. Retain missing or failed captures as coverage gaps. Illustrations remain a separate optional layer.

Coalway woods and swamp share one native `MapZone` texture, `Newest map` at 7540 by 8192 pixels, with the same center, size, and rotation. The game therefore already covers several outdoor scenes with one map, and those scenes need no manual composition. Only maps the game never positions relative to each other, such as caves and dungeons, need reviewed manual placement on the world map.

Manual placement is translation only at a shared world scale, and it moves a map's imagery and markers together. Native scene coordinates cannot seed that layout: Coalway spans 7472 by 8118 world units centred at (751, -2984), while Abandoned mine spans 404 by 429 centred at (277, -779) and lies entirely inside Coalway's footprint. Every scene authors its own origin near the world centre. The initial layout is therefore a deterministic non-overlapping arrangement that a reviewer then drags into shape, with the offsets exported for review. Accept the resulting scale disparity: an 18-to-1 linear ratio between the largest outdoor scene and a small cave means small maps are specks at overview zoom, and the pyramid's coarse levels handle that.

Duskfall's arrival room lies outside its single `MapZone`. Its authored trigger teleports the player into the mapped dungeon without changing scenes. The game does not show that room on any map, and the project matches the game: the room is not captured and its one placement is an explicit, evidence-backed exclusion rather than a separate map.

Capture extents therefore come from validated scene geometry, streamed-source coverage, and navigable region/floor evidence. MapZone is useful calibration evidence, not an unconditional capture boundary. The pipeline rejects unexplained out-of-bounds placements.

Scene registration matches each database `entryName` against exact Unity build-path basenames. Unavailable, unmatched, and ambiguous records remain explicit. A shared rendered map space is a separate decision. A local MapZone ID, texture name, or database map bound cannot establish that decision alone.

Native coordinate registration uses observed map-to-world basis samples and checks every world sample and native normalized round trip. Rotation and reflection are supported. Singular, non-horizontal, or contradictory samples remain unresolved. The stored Y coordinate describes the native map plane, not a gameplay floor. This transform does not establish image orientation or screenshot coverage.

Native triangulation is supporting evidence, not an automatic capture boundary. Duskfall's observed triangles span about 999 by 999 world units and 185 units of height. Their total bounds do not establish a playable dungeon boundary. The query collects all loaded navigation data, so per-triangle surface ownership remains unresolved. Triangulation omits off-mesh links and detailed grounding geometry. Grounded landmarks and native path queries are separate evidence for region and floor review.

Use an orthographic camera looking down world Y. The initial test covers 200 by 200 world units in 1024 pixels, or 5.12 pixels per unit. This is a probe setting, not the final resolution. Compare adjacent tiles at two resolutions before selecting one production profile. Generate coarser pyramid levels from the finest captured tiles.

Each capture records the camera's actual center, extent, and clipping planes, not only the requested settings. Native projection checks use the center and four corners on a plane inside the clipping interval. The host rejects missing controls or errors above one quarter pixel.

Each PNG has a hashed `compendium.capture-raster.v2` artifact linked by its image hash. Its `worldFromPixelEdge` frame maps top-left image edges into source-scene XZ coordinates. Pixel centers use `(column + 0.5, row + 0.5)`. Positive image X increases world X; positive image Y decreases world Z. Source-scene registration remains separate from reviewed map-space registration.

Each calibrated layer carries an explicit world-to-image transform. The offline illustration command verifies immutable image bytes, the reviewed map-space profile, and evidence hashes and JSON pointers. Calibrated artwork requires four distinct pixel controls, with one or more controls outside the three-point affine fit. Declared and independently fitted transforms must satisfy a quarter-pixel residual limit. Where artwork lacks verified registration, preserve it as an orientation-only layer without a marker transform. Illustration output cannot satisfy primary imagery or complete coverage.

### 7. Capture is a restorable rendering operation

Create a dedicated disabled camera, render target, and readable texture. Disable occlusion culling on that camera. Prepare and hold geometry for the complete tile frustum, including boundary overlap, before rendering. Record the source inventory and wait for stable readiness. A timeout is a failed tile, not empty space.

The capture plan uses schema `compendium.capture-plan.v3`. Its readiness profile bounds the whole tile to 1–300 seconds, requests 2–10 stable observations, and limits holds to 256 sources. The deadline includes rendering and stream restoration.

Source selection calls native `Covers` at the closest point on the expanded frustum to each loader. This tests the complete frustum against the native loading sphere without selecting the larger enclosing sphere. Geometry already observed inside the frustum also selects its source. Inactive sources remain separate evidence rather than receiving arbitrary activation changes.

The existing stream visitor owns holds and newly instantiated roots. Native cleanup restores the original holds and roots after success, failure, cancellation, or socket loss. Readiness requires initialized scene state, settled source handles, active loaded roots, and stable mesh, terrain, and material bindings. A combined loaded-or-loading flag is insufficient. Numbered inventories, observation contexts, stable frame IDs, hashes, and cleanup receipts remain with each tile.

Once a renderer enters the observation scope, later inventories continue inspecting its active bindings even outside the frustum. Animated bounds and changing intersection flags do not determine binding stability. Source identity, loaded state, mesh and material bindings, and integrity issues still determine readiness.

Mesh-less renderer components retain null bindings in the inventory. A null mesh alone does not establish a pending addressable load. Such rows prevent an empty classification while they remain relevant. Missing materials on present meshes, missing terrain data, and source-integrity issues block readiness. Readiness establishes the observed geometry state, not complete authored-content coverage.

Capture disables active game lights and uses its owned directional light with flat ambient illumination. It controls ambient sky, equator, ground, intensity, fog, and sky-reflection intensity. Its private camera does not copy gameplay camera post-processing. Native post-render checks reject changes to controlled lighting or suppression.

Capture preserves the Custom-mode spherical-harmonics cache without assigning `RenderSettings.ambientProbe`. Flat and Trilight getters return derived coefficients, but the setter changes the separate Custom-mode cache. The audit checks engine-derived ambient coefficients in the active color space. Frame cleanup restores the original mode and colors.

Renderer layers do not reliably separate the player from static geometry. A shared native selector identifies player bodies, mounts, owned actors, combat visuals, weather roots, camera particles, ground indicators, and non-looping particle roots. Particle-only selection preserves other actors' mesh renderers. Capture disables selected renderers, lights, and projectors, and excludes highlight effects through their camera masks. It preserves other landmark meshes and particles without disabling gameplay roots.

Geometry readiness resolves the same transient policy that rendering uses. Excluded renderer IDs and reasons remain in each inventory but do not affect geometry stability or missing-binding checks. Capture hashes the shared prelude with its other inputs. Session, restoration, and geometry observations use their v3 contracts.

Clipping is conditional. Outdoor extents under open sky need no clip height, and capture renders them from above with the ordinary far plane. Only extents where observed geometry above the content would occlude it get a clip height, which is the dungeon-and-cave case. The raster artifact records whether clipping applied and why.

Where it applies, the height comes from observed content: the highest navigable surface and the highest placement within the extent, plus a recorded margin. Every chunk of one map shares that height, so the map stays one coherent plane.

Renderer-name rules do not identify ceilings. One cave scene contains `Massive_Cave_Ceiling_*` renderers at about 50 units above its floor, and a reviewed dungeon scene contains no renderer whose name matches ceiling or roof. A positive control confirms that absence. Skybox objects such as `Planet` and `Rings` sit thousands of units up, so a naive highest-renderer rule is also unusable; the derivation uses navigation and placement evidence instead.

A recorded probe already showed a clip plane at camera height -800 exposing a Duskfall room without disabling or deleting geometry, while a high camera saw only its rocky ceiling. Clipping, not suppression, is the mechanism.

A scene whose content spans more vertical range than one height can serve stays an explicit unresolved gap. A mixed surface-and-cave scene is the expected case: no height both keeps the hillside and reveals the cave.

Capture enters another requested source scene through the existing owned scene visitor. The readiness timeout bounds each transition. Success requires restoration of the original source scene, position, and rotation. Native owner cleanup also restores that state after failure or disconnection.

A capture session records every changed property and object under two lifetimes. Scene loading, preload, readiness, geometry holds, and reusable disabled capture resources can span frames. Their cleanup belongs to the runtime operation and runs on success, failure, cancellation, or host disconnection. No later host restore request is required. Confirm cleanup before another operation uses the affected state.

Lighting changes, renderer suppression, and rendering form a frame-local operation. Its `finally` restores visual properties before the next gameplay frame, including on injected failure. A disconnected run cannot report success while cleanup is unconfirmed. The earlier ambient-mode observation does not prove complete restoration.

Capture writes `compendium.capture-tile-checkpoint.v1` after tile rendering, registration, visual restoration, and stream cleanup pass. Compatibility hashes include build, profile, implementation, character, scene, clip height, resolution, lighting, readiness, and frame. Unrelated tiles do not change a compatible tile's key.

Reuse validates artifact bytes and the complete native camera and restoration evidence. Copied artifacts retain their original native run and owner. All-reused runs do not allocate capture resources or load world inventories. Interrupted runs require matching clean native capture and runtime receipts; missing or pending cleanup blocks reuse. Verified receipts that were not registered before interruption become registered evidence in the resumed run.

`compendium.capture-set.v1` binds the exact expected tile list to validated checkpoints before atomic successful-run selection. A failed run cannot replace that selection. Capture sets do not establish full-world imagery. The publication gate makes that separate decision.

### 8. Tiles and map data form one publication artifact

Captured source images, tile pyramids, calibration, and marker projections carry one build identity. Tile filenames use content hashes and a generated index. Empty positions are explicit. A missing image or mismatched manifest blocks publication.

Use WebP delivery tiles and a measured zoom limit. Tile generation emits dimensions, byte totals, and file counts so hosting limits remain visible. Do not commit generated images or raw game data.

The user reports that the developer welcomes a wiki or similar project and directed us not to pursue a separate asset-permission check. Proceed with the planned asset preparation without that checkpoint. Select external artifact storage only after measured size and file counts are available. Deployment still requires explicit user authorization.

### 9. Small previews, persistent details, and source navigation

Use deck.gl, as requested by the user, with a browser-only `OrthographicView` and Cartesian coordinates. `TileLayer` loads screenshot tiles through `BitmapLayer` sublayers. Marker and area layers remain separate from the basemap. No geographic projection or Mapbox/MapLibre base map is required.

Use `OrthographicView({flipY: false})` so positive map Y points upward. The publication transform maps Unity X/Z into pixel-aligned map coordinates and retains world Y as elevation. The same transform determines tile bounds and marker positions. Tile origin, resolution, and zoom indexing come from the emitted manifest, not scattered browser constants. Verify image orientation with landmarks rather than applying another ad hoc Y negation.

The [OrthographicView contract](https://deck.gl/docs/api-reference/core/orthographic-view) defines zoom zero as one map unit per screen pixel. The [TileLayer contract](https://deck.gl/docs/api-reference/geo-layers/tile-layer) supports non-geographic indexing from the origin. The generated tile grid must match that indexing and the true image tile size.

Markers follow the sibling atlases. Both build a deck.gl icon atlas from Lucide `IconNode` values, drawing a white glyph on a colored circle, and both keep one registry that owns icon, color, label, plural label, icon size, precedence, render order, and default visibility, with one `resolveMarker(row)` returning a single marker per row. Adopt that shape rather than inventing a third arrangement: one registry module, one atlas builder, one resolution function, and a registration test that fails when a registered marker has no layer. Render order stays semantic, and the atlas is built once rather than per layer update.

Travel connections follow the sibling atlas's zone-line arrangement: three coordinated layers under one visibility key, being a line from source to destination, a mark at the destination, and the travel marker itself, with disabled entries recolored rather than removed. Keep that grouping. Connections also serve the world layout: with them visible in the authoring mode, a stretched or crossed line exposes a wrong offset immediately, which is cheaper than eyeballing terrain edges.

Use IconLayer or ScatterplotLayer for placements and appropriate polygon/path layers for areas and transitions. A spatial index supplies low-zoom aggregation and the accessible result list. GPU rendering does not remove the need to limit labels and avoid overlapping markers. Keep stable layer IDs and data references so selection does not rebuild all geometry.

Svelte owns the URL state, controls, panels, and accessible list. A small adapter owns Deck lifecycle, layer construction, view changes, and picking. Finalize Deck and release image resources when the view unmounts. Keep game semantics and coordinate conversion outside that adapter.

Leaflet was a reasonable raster-only alternative, but deck.gl fits dense markers and areas while retaining the user's established stack. Do not create a generic renderer interface for an unneeded second renderer. Verify full-data performance, texture memory, and narrow-screen interaction before adding more machinery.

A marker preview contains identity, category, level, and a concise summary. Selection opens a side panel on desktop and a bottom sheet on narrow screens. The panel owns searchable full lists and conditions. It avoids a large popup that hides the selected area.

Panels present player questions in the game's words. They carry no coordinates, provenance, source configuration dumps, or unresolved-semantics notices. A value that is not established is omitted, not annotated. Vendor stock groups retain requirements and currency costs. An item result links to all known source types and their places.

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

Before full-world extraction or capture, validate one connected path through a representative outdoor area and an interior. It must cover extraction, repeat-load identities, capture, normalization, and browser picking and details. Include adjacent chunk seams, an interior clip height, a producer without a live node, and item-to-source navigation. The site must consume generated static contracts rather than raw probes or game access.

Before that path runs again, remove the floor and ceiling-review machinery completely: floor domains in profiles and normalization, reviewed ceiling selectors and their evidence hashing, per-floor pyramids and floor scoping in publication, floor and map and layer URL state and selectors, and extraction vocabulary on the player surface. Removal is a clean cut with no shims, aliases, or deprecated paths. Re-baseline extraction on 25153357 first, and keep the 25144591 artifacts as frozen reference rather than migrating them.

This milestone validates the complete mechanism. It does not reduce release coverage. After it passes, collect all reachable sources and required imagery. Repeat the UI and performance checks with the complete real dataset. Publish only a coherent validated artifact set with explicit user publication authorization. Keep the previous successful set available for rollback.

## Open Questions

- Which finest resolution and tile dimensions provide useful detail at an acceptable measured artifact size?
- Which observation decides that overhead geometry occludes content, so clipping applies to a dungeon but not to an outdoor extent?
- Which clip-height margin reads correctly across a cave and a two-storey building?
- Which scenes mix surface and interior content so badly that one clip height cannot serve them?
- What value does the Adventure Guide display as a drop chance, and how is it derived on the current build?
- Which illustrated maps support precise marker registration, rather than orientation-only viewing?
- Which static asset host is appropriate after output-size review?

These decisions are parameters within the defined capture and publication contracts. They do not remove any required map coverage.
