# Afallon compendium exploration

Updated: 2026-09-06. Status: implementation in progress. Nix-backed local tooling is verified; canonical extraction, capture, and the website remain in development.

## User intent and permissions

Build a comprehensive interactive map for Afallon, then a full compendium. The primary basemap must use this project's own in-game captures of the supported build. Existing maps are not reliable enough to replace those captures or fill missing tiles. Preserve illustrations as a separate optional orientation layer. Missing or failed captures remain coverage gaps and block a complete release. Include enemies, NPCs, interactables, resources, and other categories supported by Afallon evidence. Connect markers to useful facts such as enemy drops and vendor stock.

The user owns Afallon on Steam and authorized installation in CrossOver, decompilation, HotRepl inspection, reusable scripts, project creation, and a GitHub repository. Implementation follows the approved `build-screenshot-first-map` OpenSpec change. The user reports that the developer welcomes a wiki or similar project and directed us not to pursue a separate asset-permission check. Asset preparation may proceed without that checkpoint. Public deployment and pushing commits still require explicit user authorization.

Repository: https://github.com/glockyco/afallon-compendium (private). Local game evidence under `research/` is ignored by Git. No game binaries, recovered declarations, saves, or bulk artwork belong in source control. The initial change is `openspec/changes/build-screenshot-first-map/`.

The checkpoint sections below preserve earlier observations. Use the current requirements and checked tasks as the implementation contract.

## Screenshot-first investigation checkpoint

The user selected captured in-game imagery as the primary layer. The private repository and `build-screenshot-first-map` proposal now record that direction. Full reachable coverage remains the release target, not only the areas sampled below.

### Captures produced and viewed

- `09-woods-orthographic-probe.png`: direct runtime capture, 1024×1024, 200×200 world units, camera XYZ (570.56,250,-1169.83), rotation (90,0,0). Native `UnityEngine.ImageConversion.EncodeToPNG` succeeds. This corrects the inference from the generic screenshot helper failure: Afallon supports PNG encoding.
- `10-woods-lit-orthographic-probe.png`: same tile with temporary directional light, flat ambient light, and fog disabled. The result is substantially brighter. These are probe settings, not a final visual profile.
- `11-woods-preloaded-orthographic-probe.png`: same tile after game-provided preload. This is a captured terrain sample, not proof that every mesh or transient is correct. Effects remain visible, and foliage obscures portions of the ground.
- `12-duskfall-orthographic-probe.png`: a high camera sees a dungeon room's rocky ceiling rather than its floor.
- `13-duskfall-cutaway-probe.png`: camera height -800 exposes part of that room without deleting or disabling its geometry. A useful full-dungeon floor strategy remains to implement.
- Temporary cameras, lights, and textures were released after each probe. Later checks confirmed the objects were absent and fog/mode restored. Ambient color later differed while gameplay advanced; full environment restoration is not proven.

### Streaming and coverage measurements

Coalway woods uses the built-in render pipeline. Its 421 loaded addressable-loader components comprise 116 Forests, 175 Rocks, 55 Props, and 75 Structures. Initially 77 reported loaded or loading. `AddressableLoader.PreloadAround` with center (570.56,0,-1169.83), margin 150, timeout 20, and hold 120 ran through a game coroutine. Later, 110 reported loaded or loading and `NeedsPreloadAround` was false. This supports tile-local preparation. It does not prove all requested geometry has finished rendering or establish full-scene coverage.

One woods sample contains 800 NPCSpawner components including inactive objects, compared with 661 active. The previous session's active count was 667. Thus active counts are state-dependent. Additional loaded families: 500 InteractableObject, 5 Chest, 641 OreSpawner, 8 WorldQuestZone, and 3 DungeonEntranceTrigger. The same sample found zero InteractiveNode and QuestScenePortal objects; this does not establish absence from the game.

The 641 OreSpawner records split into 345 Herbalism (skill 6), 286 Mining (skill 7), and 10 Fishing (skill 8). Only 8, 2, and 6 respectively had live CurrentNode objects. Do not categorize all OreSpawner records as mining or extract only their currently generated nodes.

Duskfall Depths loaded 16 NPCSpawner, 85 InteractableObject, and 9 AddressableLoader components at the sample. Its camera was at (2418,-810.12,-957.76), outside its one MapZone extent centered at (1659.18,-778.30,-905.70), size (463.35,605.96). The exact layout/streaming cause remains unresolved. MapZone bounds are not an unconditional screenshot-capture boundary.

### Relationship measurements

- Across all 357 NPC records, zero legacy `merchantTableID` values were nonnegative. The current `MerchantTables` lists contain 166 links. Thirty-nine records have `isMerchant=true`.
- Blacksmith ID 296 references stock tables 0, 9, 27, 29, and 32. Table 27 has a requirements template named `Item power over 200_REQUIREMENTS`; higher tables have other templates. Template names are not proof of their exact predicates. Preserve and decode those predicates rather than copying the names as requirements.
- Example stock: item 15, Novice Plate Belt, currency ID 0, cost 60. This is a source value, not a claim about formatted in-game currency or final modified prices.
- Orbweaver hatchling ID 52 and matriarch ID 188 both reference loot table 32 at outer raw rate 100. It contains Spider fang, quantity 1–2, raw rate 50, and other entries. These are authored fields, not verified effective drop percentages.
- Four of 208 loot tables enable LevelBandGear. Dynamic gear rules must not disappear when normalizing static item lists.

### Reusable implementation direction

The proposal specifies repository-owned host commands and C# probe sources, runtime-first canonical extraction, source-aware placement identity, coverage-led scene traversal, restorable tile capture, and generated site contracts. The `doctor`, `inspect`, and `probe` commands now provide the reusable runtime connection and artifact pipeline.

The user selected deck.gl, consistent with the other compendiums. Use OrthographicView with Cartesian coordinates, tiled BitmapLayer imagery, and separate marker/area layers. Keep Svelte panels and accessible navigation outside the rendering adapter. The provisional Leaflet choice is replaced.

The display model uses one physical marker with multiple roles. A concise preview opens a persistent detail panel or mobile sheet. Large vendor and loot lists are searchable there. Item search can lead back to all known source locations. Full coverage includes conditional rules and procedural producers, not just current instances.

## Initial installation checkpoint

- Installed Afallon through the existing CrossOver `Steam` bottle.
- Steam app ID: `2597810`. Installed build: `25144591`. Depot manifest: `2443551194643425744`.
- Steam manifest confirms `StateFlags=4`, `UpdateResult=0`, all 5,752,658,480 download bytes and 11,404,476,943 staged bytes complete.
- Game root: `/Users/glockyco/Library/Application Support/CrossOver/Bottles/Steam/drive_c/Program Files (x86)/Steam/steamapps/common/Afallon`.
- Unity version: `2022.3.62f2`. Product version from PlayerSettings: `0.14.4.1`.
- Windows x64 IL2CPP build: `GameAssembly.dll` and `Afallon_Data/il2cpp_data/Metadata/global-metadata.dat`. Metadata version reported by Cpp2IL: 31.1.
- Steam was launched with supervised process `afallon-steam`. Its initial readiness regex timed out, but Steam later logged on successfully and completed installation. Do not infer failure from that initial timeout.
- No game launch or HotRepl connection yet at this checkpoint.

## Analysis tools and output

- Cpp2IL nightly: `2022.1.0-development.1736+5fb20304df698ffd3d0e664b2a698cd911dc9d57`, downloaded from the project's documented nightly.link macOS x64 build.
- Executable: `/tmp/afallon-cpp2il/Cpp2IL`.
- Recovered type declarations: `/tmp/afallon-inspection/types/DiffableCs/Assembly-CSharp/`.
- Recovered dummy assemblies: `/tmp/afallon-inspection/assemblies/`.
- Cpp2IL successfully mapped 87,948 method definitions on the completed installation.
- **These outputs recover schemas and signatures, not method implementations. Empty generated bodies are not actual game behavior.** Targeted native analysis and runtime checks are documented below.
- Python environment: `/tmp/afallon-asset-tools`, with UnityPy 1.25.3 and TypeTreeGeneratorAPI 0.0.10.
- Initial Cpp2IL attempt against Steam staging failed because GameAssembly.dll still contained zero-filled preallocation. The completed installation succeeded. Do not diagnose game protection from that staging error.

## Concrete asset observations

UnityPy parsed `globalgamemanagers`, `resources.assets`, and localization text assets. Initial reads were during download; confirm important findings against the installed files before publication.

- BuildSettings lists 33 scenes, including menu/character creation, Coalway swamp, Coalway woods, Chillwind heights, caves, challenge-stone variants, and five paths under `Assets/SCENES/Dungeons/`.
- Dungeon scene names: Duskfall Depths, Felheart Crucible, Tidefallen Grotto, The Underglow, Barrowdeep.
- These are build scene counts, not a claim of 33 player-facing maps or reachable scenes.
- `resources.assets` contains texture assets named Barrowdeep (3439×1417) and Duskfall depths new (3438×1418). These could be guide images, not calibrated basemaps; no visual confirmation yet.
- English localization JSON has 6,557 entries, with keys such as `item.264.name` → `Rusty axe`. Key namespaces include NPC, quest, task, game scene, region, recipe, item, and ability. These are localization entry counts, not entity counts.
- Addressables catalog: `Afallon_Data/StreamingAssets/aa/catalog.json`, 16,894 internal IDs. Needs a targeted search for database/map resources; broad `map` searches mostly find material textures.

### Offline schema decoding limitation

- Without recovered custom schemas, UnityPy could parse only 227 of 23,420 MonoBehaviour records in resources.assets; successful examples contained only base fields.
- TypeTreeGeneratorAPI loading IL2CPP directly returned repeated `Sequence contains no matching element` failures for custom schemas.
- Loading Cpp2IL dummy assemblies uses the installed API `load_local_dll_folder`, not `load_dll_folder` shown in upstream README.
- The first two full custom-object reads with dummy schemas failed with `read_str out of bounds`. This does not prove all records fail.
- A narrower probe is in progress: inspect MonoBehaviour heads, resolve script class, target RPGGameScene/RPGNpc/RPGItem/NPCSpawner/MapZone only. Null script references exist and must be counted rather than dereferenced.

## Recovered schemas: facts, not behavior

Paths below are relative to the recovered Assembly-CSharp directory.

- `RPGBuilderDatabaseEntry.cs`: ScriptableObject base has integer `ID`, `entryName`, `entryFileName`, `entryDisplayName`, `entryIcon`, `entryDescription`.
- `Blink/RPGBuilder/Managers/GameDatabase.cs`: integer-keyed dictionaries/accessors for items, NPCs, loot tables, quests, tasks, resources, scenes, abilities, and other records. Some template/category dictionaries use strings.
- `RPGGameScene.cs`: `minimapImageKey`, `mapBounds`, `mapSize`, `startPositionID`, procedural/spawn fields, regions, dungeon/zone level ranges, Adventure Guide description/image and boss NPC IDs.
- `MapMinimap/MapZone.cs`: integer zone ID, map Texture, BoxCollider field, bounds and world/map conversion APIs.
- `MapMinimap/MapData.cs` and `MapSceneData.cs`: scene-name-keyed persistent fog discovery. Not a canonical world-content database.
- `Blink/RPGBuilder/AI/NPCSpawner.cs`: list of NPC candidates with spawnChance/persistence, count limits, requirements, distance triggers, area radius/height, usePosition, ground sampling, level/faction/respawn/patrol overrides.
- `RPGNpc.cs`: NPC classification, merchant/quest/dialogue/faction links, level/scaling fields, loot-table links.
- `RPGLootTable.cs`: item IDs, min/max quantities, drop-rate fields, requirements and drop-count controls. No probability interpretation verified.
- `RPGQuest.cs` and `RPGTask.cs`: task/objective IDs and item/NPC/scene/region references, reward and requirement fields.
- `RPGResourceNode.cs`: skill requirement and rank-specific loot-table links.
- `Blink/RPGBuilder/World/DungeonEntranceTrigger.cs`: RPGGameScene reference.
- `LoadingScreenManager` and `RPGBuilderEssentials`: scene loading/teleport signatures take integer scene IDs.
- Localization files have key/context/source/target/source-hash fields. Names must not become canonical IDs.

## Existing-project comparison

### Ancient Kingdoms

Actual code separates canonical monsters from placed spawns. `website/src/lib/queries/map.server.ts:374-381` emits physical `id`, canonical `monsterId`, and map coordinates. Detail routes use canonical IDs and aggregate spawn records from the same database.

Useful: canonical/placement separation, shared relational source for map and pages, typed export boundary.

Risks: map SQL also handles presentation and coordinate conversion; stored second horizontal coordinate is named y although semantically game Z. NPC map rows use canonical npc_id where monsters use physical spawn IDs (`map.server.ts:515`). Record this asymmetry; do not silently copy it.

**Correction:** Ancient Kingdoms uses MelonLoader/IL2CPP, not Mono. HotRepl README identifies it as the MelonLoader reference consumer. Ardenfall is the Mono/BepInEx reference. An earlier conversational statement incorrectly grouped them.

### Erenshor

Unity asset scanning → raw SQLite → Python clean SQLite → map/wiki/sheet consumers. `src/maps/src/lib/map/coordinate-transform.ts:31-57` applies zone bearing and world offsets. Useful separation of extraction and publication. Avoid carrying wiki page names, wiki URL rendering, or game-specific zone layout into Afallon core identity.

### Ardenfall

Runtime snapshot → canonical SQLite/read models → static SvelteKit. `pipeline/src/entities/location/canonicaliser.ts` converts world x/z to map x/y and retains elevation. `site/src/lib/server/entities/location.ts:getMapView` reads layers/points/volumes and computes map bounds from content.

Useful: site consumes generated contracts, not raw extraction details. Avoid assuming planned basemap support exists: current map is marker/volume-based; tile capture remains a planned change. Declared map extents should not be inferred only from visible markers.

## Working architectural direction (not adopted decisions)

1. Map first as a product, but use entity identities and placements that can support compendium pages later.
2. Separate authored entity, spawn/placement rule, and live observed instance. Afallon's spawn candidate/area fields make that distinction important.
3. One repository, explicit extraction → normalized data → static publication boundaries. Prefer a small SQLite model and concrete modules over a generic compendium framework.
4. Keep game-specific IDs and XYZ coordinates at the evidence boundary. Define map-space calibration once. A map ID must distinguish independent dungeon/overworld spaces.
5. Capture in-game terrain imagery as the primary basemap. Preserve shipped artwork as an optional layer with independently verified registration.
6. Preserve patch/build identity, extraction coverage, conditional availability, and manual corrections separately from extracted facts.
7. No accounts, backend service, shared multi-game framework, full graph engine, or live tracking unless a reader need justifies them.
8. Representative outdoor and interior proofs validate the mechanism. They do not reduce the user's requested full-map coverage.

## HotRepl investigation next

Read `HotRepl/.claude/skills/hotrepl/SKILL.md` before runtime use. `HotRepl/AGENTS.md` documents a MelonLoader/IL2CPP host, .NET 6 Roslyn evaluator, and IL2CPP helpers. Inspect the actual Ancient Kingdoms deployment path and available binaries. Do not copy game-specific exporter mods or interop assemblies into Afallon. A compatible generic host plus Afallon-generated interop assemblies is the candidate route.

## External evidence

- Official game description and world/difficulty customization: https://store.steampowered.com/app/2597810/Afallon/
- Community dungeon guide: https://steamcommunity.com/sharedfiles/filedetails/?id=3741662372
- Its author says the in-game Adventure Guide superseded the guide. Treat old health/ability claims as unverified; use current game data.
- Cpp2IL documentation: https://github.com/SamboyCoding/Cpp2IL
- UnityPy documentation: https://github.com/K0lb3/UnityPy

## Runtime checkpoint: HotRepl connected

- Installed official MelonLoader v0.7.3 Windows x64 archive into Afallon. Copied only existing generic HotRepl host/dependency binaries from `HotRepl/src/HotRepl.Host.MelonLoader/bin/Debug/net6.0/` to Afallon `Mods/`. No game-specific Ancient Kingdoms mods or interop assemblies were copied.
- Launched supervised process `afallon-game` with the existing CrossOver wine executable, `CX_BOTTLE=Steam`, the Steam WINEPREFIX, `DOTNET_ROOT=C:\\Program Files\\dotnet`, `WINEDLLOVERRIDES=version=n,b`, and `HOTREPL_PORT=18591`.
- Fresh Afallon interop assemblies generated successfully. HotRepl handshake confirms Unity IL2CPP, MelonLoader, Roslyn.Script, protocol 2. Actual evals succeed.
- Endpoint: `ws://127.0.0.1:18591`. A new connection replaces the prior client. Do not connect to the Ancient Kingdoms default port by mistake.
- Runtime namespace is `Il2CppBLINK.RPGBuilder.Managers.GameDatabase`, not `Il2Cpp.BLINK...`. Map types use `Il2CppMapMinimap`; TMP uses `Il2CppTMPro`.
- Main-menu database contains 40 scene records, 1,076 items, 357 NPCs, 133 quests, and 208 loot tables. These counts match offline script-header inventory. They are loaded records, not verified reachable/published content.
- **Version discrepancy:** Unity `Application.version` says `0.14.4.1`, but the visible menu says **Early Access 0.16.0.1, build date 2026-09-03**. Steam build 25144591 is the unambiguous build identity. Do not label the website from Application.version alone.
- **Map metadata warning:** all 40 loaded RPGGameScene records have empty `minimapImageKey`. Most `mapBounds` and `mapSize` values are unit placeholders. Coalway woods/swamp have other values. Thus these names/signatures do not establish an authoritative basemap/calibration source; inspect actual MapZone objects in scenes.
- Generic `unity.screenshot.capture` failed with `pngEncodingUnsupported`. No HotRepl source fix attempted. macOS screencapture works and saved full-game images in `research/screenshots/`.
- `01-main-menu.png` records menu version text. `02-character-creation.png` records class/race and visual styling.
- Created a new research character named `AtlasResearch` through the normal menu controls with default dwarf/Shieldmaster selection. Last observed scene: `Character creation`. Do not modify or delete unrelated saves.
- Captured HotRepl responses and handshake in `research/hotrepl-session.json`. Continue saving updates after meaningful observations.
- Offline targeted decoding with Cpp2IL dummy schemas succeeded for RPGGameScene records, despite earlier failures on other types. Base m_Script pointer representation in decoded dictionaries is suspect; script identity was separately resolved from the MonoBehaviour header. Use the live records as confirmation.

## Spatial findings verified in the running game

The generic HotRepl host works without source changes. In-game scene loading and schema queries now provide direct evidence.

| Observation | Tutorial cave | Coalway swamp | Coalway woods |
|---|---|---|---|
| Loaded MapZone count | 1 | 1 | 1 |
| MapZone ID | 0 | 0 | 0 |
| Texture name | Tutorial cave map | Newest map | Newest map |
| Texture pixels | 4096×3163 | 7540×8192 | 7540×8192 |
| Map center XYZ | 1187.29, 39.00, -649.90 | 751.00, 13.00, -2984.00 | 751.00, 13.00, -2984.00 |
| Map size | 463.78×357.96 | 7472.40×8118.39 | 7472.40×8118.39 |
| Rotation | 0 | 0 | 0 |
| Loaded active NPCSpawner count | 15 | 189 | 667 |

These counts use FindObjectsOfType, not a proof of complete authored coverage. Inactive objects, streamed scenes, runtime-created objects, and disabled content remain to investigate.

- Coalway swamp and woods use the same named texture, dimensions, center, size, and rotation. This supports a shared overworld map space for these two scenes. Do not apply Erenshor-style manual stitching by default.
- Tutorial cave uses a separate map space even though its local MapZone ID is also 0. MapZone ID alone is not globally unique.
- `GetNormalizedPos(GetCenter())` returns `(0,0)`. `GetWorldPosition(1,1)` reaches the positive half-extents. Verified round trips in the overworld: `(-1,-1)`, `(0,0)`, and `(1,1)` return unchanged after map→world→map.
- Thus the tested MapZone normalized domain is centered, with corners at -1 and +1. It is not image UV 0..1. Image vertical orientation still needs explicit landmark calibration in a future web map.
- Extracted `Tutorial cave map` directly from `sharedassets3.assets`, Texture2D path ID 47. Saved `research/screenshots/05-tutorial-basemap.png` and visually confirmed it matches the in-game terrain map.
- Extracted `Newest map` directly from `sharedassets2.assets`, Texture2D path ID 195. Saved `research/screenshots/07-overworld-basemap.png`. The live map screenshot shows illustrated parchment-style world artwork, unlike the tutorial's terrain image.
- These extracted textures are research references, not primary basemap captures. The primary layer requires this project's own captures for every supported map. Full-game capture coverage and useful maximum zoom remain open.

### Spawns require their own model

Tutorial spawner records include both fixed placement (`Darian`, usePosition=true) and area placement (`Orbweaver hatchling`, usePosition=false). Several hatchling spawners permit 2–3 simultaneous NPCs. They share canonical NPC ID 52 but have separate world positions and radii.

Coalway swamp has 156 of 189 loaded spawners with usePosition=false. All 189 currently have a single candidate and a maximum count no greater than one. This is an observed scene distinction, not a reason to discard candidate lists/counts globally: the tutorial supplies positive multi-count examples.

One tutorial boss spawner has a much higher source Y coordinate than nearby spawners. Do not assume source spawner elevation equals grounded NPC elevation. Ground-placement behavior needs a separate measurement.

### Product and architecture implications

- Model three separate concepts: source scene, rendered map space, and player-facing region. Scenes can share a map, and one scene can contain multiple named regions.
- Separate canonical entity IDs, authored placement/spawner IDs, and live instance observations. Do not derive canonical identity from display names or runtime GetInstanceID values.
- Use runtime-first canonical extraction, with offline asset evidence for coverage reconciliation. Publish generated data through a static pipeline; the website does not connect to the game.
- Do not prescribe a generic descriptor/graph framework. A few explicit entity tables and map projections can support the first map and later pages.
- Capture screenshot basemaps first and retain shipped imagery as an optional layer. Keep tile-pyramid generation separate from in-game capture.
- Present a small useful set of map categories at default zoom. Preserve native detail without copying the game's heavy red panel chrome into a website.

### In-game compendium evidence

Opened the built-in Adventure Guide for Duskfall Depths using `AdventureGuidePanel.Instance.OpenToDungeon(db.GetGameScenes()[10])`. Screenshot `08-adventure-guide.png` shows dungeon, region, and property navigation, boss list, and ability/stats/loot tabs. This confirms the game already exposes useful relationships to reuse and validate. It does not establish that every listed record is public/reachable.

### Evidence and reproduction

- Persistent recovered declarations: `research/recovered-types/DiffableCs/Assembly-CSharp/`.
- Persistent recovered dummy assemblies: `research/recovered-assemblies/`.
- These folders moved from /tmp. Older paths above describe the original checkpoint only.
- Runtime responses: `research/hotrepl-session.json`.
- Evaluated C# query history: `research/hotrepl-eval-history.json`.
- Screenshots/assets: `research/screenshots/01-main-menu.png` through `08-adventure-guide.png`. Number 03 shows world-modifier confirmation, not the playable world.
- Runtime data access: `Il2CppBLINK.RPGBuilder.Managers.GameDatabase.Instance`.
- Scene transitions tested through `Il2CppBLINK.RPGBuilder.Managers.LoadingScreenManager.Instance.LoadGameScene(id)`: 9=Coalway swamp, 3=Coalway woods.
- Runtime map query: `UnityEngine.Object.FindObjectsOfType<Il2CppMapMinimap.MapZone>()`.
- Runtime spawn query: `UnityEngine.Object.FindObjectsOfType<Il2CppBLINK.RPGBuilder.AI.NPCSpawner>()`.
- Do not publish recovered game source, dummy assemblies, or bulk assets to GitHub. They are local research evidence. Public deployment requires explicit user authorization.

## First-session shutdown checkpoint

- Quit Afallon through `UnityEngine.Application.Quit()`. Supervised process `afallon-game` exited with code 0. No game process or HotRepl listener remains from this investigation.
- The Steam client remains open. Afallon, MelonLoader, generated interop assemblies, and generic HotRepl mods remain installed for the next session.
- AtlasResearch remains as a research save. The investigation visited Tutorial cave, Coalway swamp, and Coalway woods. No unrelated save was changed or deleted.
- No application feature, exporter, website, OpenSpec change, or Git repository was created. This directory contains notes and local evidence only; no commit or push was made.

## Current resume checklist

- Read the screenshot-first checkpoint and `openspec/changes/build-screenshot-first-map/`. Primary basemap images must come from this project's capture pipeline.
- The planning artifacts and checked tasks are the implementation contract. Continue with the first unchecked task; use the verified checkpoints below as evidence.
- Use `research/screenshot-first-session.json` and `research/screenshot-first-eval-history.json` to recover exact successful and failed probes.
- Use the supervised `afallon-game` process and port 18591. The current implementation session has loaded Coalway woods with AtlasResearch. Do not use unrelated saves.
- Use the Nix-backed commands below for runtime probes. Keep local configuration and generated artifacts outside Git.
- Resolve coverage, stable placement identities, dynamic loot semantics, capture readiness, and interior floor profiles through the tasks in the proposal.
- Keep screenshots and recovered game data local. Public deployment requires explicit user authorization.

## Local tooling checkpoint

The development shell uses the same pinned nixpkgs input and fleet OpenSpec check as the other compendium repositories. `.envrc` selects the flake. Commands also work through explicit `nix develop` invocations:

```sh
nix develop --no-write-lock-file --command bun install --frozen-lockfile
nix develop --no-write-lock-file --command bun run compendium doctor --config local/config.json
nix develop --no-write-lock-file --command bun run compendium inspect --config local/config.json
nix develop --no-write-lock-file --command bun run compendium probe --config local/config.json --probe tools/probes/doctor.csx
nix develop --no-write-lock-file --command bun run check
nix develop --no-write-lock-file --command bun test
```

Copy `config.example.json` to the ignored `local/config.json`, then set the installation path, research character, and shared output mapping. Relative host paths resolve from the configuration file. The example's `../artifacts` therefore selects this repository's ignored artifact directory. `runtimeOutputRoot` must refer to that same directory from CrossOver. Start Afallon with the generic HotRepl host before running the commands.

`doctor` checks the running assembly hash against the installation and reads a hash-verified artifact through the configured path mapping. `inspect` writes complete loaded-scene, database, component-family, and addressable-source inventories. It does not claim full-game coverage. Each probe run retains its build hashes, tool revision, settings, artifact hashes, and status. Only a successful run replaces its command's latest-success pointer.

Probe bodies are trusted C# with game-process access. Run only reviewed sources. The host deadline bounds the client's wait; it does not guarantee cancellation of C# code already executing in the game.

Verified on Steam build 25144591: the inspection artifact contains all 421 woods loaders, 800 NPC spawners including inactive objects, and database counts of 1,076 items, 357 NPCs, 133 quests, 208 loot tables, and 40 scenes. Separate runtime queries matched those counts. All 421 loader keys were valid, with no source-read errors. A separate live check returned all 2,000 requested rows, rejected corrupted artifact bytes, rejected a closed session, and stopped waiting for an overlong evaluation after 1,102 ms. Failure checks preserved the previous success pointer and retained diagnostics. Regression tests cover artifact mutation and failed pointer selection.

## Canonical extraction checkpoint

Load the configured research character, then run:

```sh
nix develop --no-write-lock-file --command bun run compendium extract --config local/config.json
```

`extract` verifies the running build and writes eight artifacts: canonical records, localization, supporting definitions, relationships, loot rules, world inventory, NPC producers, and world sources. It checks their schemas, source counts, and references. Each probe has a separately hashed context artifact with the configured character, Unity scene, native game-scene ID, and start/end frames. A probe that crosses a scene or character boundary fails the run. `validation.json` retains unset references, missing display labels, source quantity anomalies, and unresolved relationship semantics. A successful extraction is a raw research snapshot, not a publication approval or a claim of full-game coverage.

On build 25144591, the canonical counts match the live database: 1,076 items, 357 NPCs, 133 quests, 208 loot tables, 40 scenes, and no RPGResource records. The snapshot includes all 6,557 loaded English localization entries and 25 supporting database families. The initial canonical and relationship checks covered 6,155 references: ten had authored negative sentinel IDs, and none of the remaining IDs were unresolved. This count excludes the later producer and world-source reference checks. Two authored display labels are blank. Loot table 42, entry 4, has an authored minimum of 15 and maximum of 3; the snapshot preserves those values and reports the unresolved quantity interpretation rather than changing source evidence.

Canonical metadata uses the current `entryDisplayName`, `entryName`, `entryDescription`, and `entryIcon` fields. The old item-name fields are blank in this build. Localization keys use each entry family's actual prefix, including `gamescene`, not an inferred shared convention.

The loot-rule probe compares the native eligibility method with extracted item-level rules for all four level-band tables. It temporarily checks both values of the research character's `FirstGearDropDone` flag and restores the original value in `finally`, before the next gameplay frame. The verified run made 142,072 native comparisons and confirmed restoration. It does not roll drops, award items, or publish effective drop probabilities. Source-condition interpretation, authored-world coverage, and publication gates remain separate unfinished tasks.

Custom probes can use `--prelude tools/probes/conditions.csx` for the shared requirement projection. The injected `args.researchCharacter` value comes from the local configuration. Raw artifacts, recovered declarations, save data, and screenshots stay outside Git.

## Merchant interface verification

Verified Blacksmith NPC 296 through the native `NPCInteractionsPanel` and `MerchantPanel`, not through a copied stock filter. At the research character's item power of 60, the interface exposes tables 0 and 9. Table 27 requires item power greater than 200. Tables 29 and 32 require item power greater than or equal to 300 and 400. Checks at 200/201, 299/300, and 399/400 confirmed those boundaries. The template names say “over,” but their `Value` operators differ; the unused `Comparison=Equal` field does not describe these Stat predicates.

Selected tables 0 and 27 through the native option controls. Each interface contains seven items. Every displayed item ID, currency ID, and base cost matched the extracted stock. Novice stock costs 60 or 100 units of currency 0. Adept stock costs 360 or 550, and the visible price text matches those values for this character. No item was purchased. Temporary item-power changes returned to 60 in `finally`, within the same gameplay frame. The native movement controller returned to the original horizontal position with zero measured error, and all verification panels closed.

Local proof: boundary run `025e623d-f3e7-436f-a32a-007ef65da178`, stock run `53f8c8b6-452f-4cb1-aa25-2bc6d533212c`, and restoration run `cd7356f6-ec2f-4629-8d43-5799f705bcad`, under `artifacts/25144591/`. Screenshots `09-merchant-groups.png`, `10-merchant-gated-groups.png`, and `11-merchant-gated-stock.png` remain in `research/screenshots/`. The final stock screenshot was captured after the native panel reached full opacity. The temporary verification scripts were removed.

## Native analysis workflow

The separate `analysis` shell supplies Ghidra 12.0.4 and LLVM 21.1.8 from the existing pinned nixpkgs input. The default development shell remains lightweight. No analysis software is installed in CrossOver.

```sh
nix develop .#analysis --no-write-lock-file --command ghidra
nix develop --no-write-lock-file --command bun run compendium probe --config local/config.json --probe tools/probes/native-methods.csx
```

The native-method probe exports module-relative addresses from live IL2CPP method metadata for EconomyUtilities and RPGNpc. Its run manifest records the installation identity. Method addresses change between builds. Use the exact binary hash and fresh metadata for each build, not an absolute process address from another session.

The local `local/loot-targets.json` selects four functions for build 25144591. Its `sha256` identifies the imported executable. Each `functions` row supplies a unique `name`, hexadecimal `rva`, and exclusive hexadecimal `endRva`. Bounds come from the PE unwind records. An optional `signature` supplies a reviewed native C signature. The optional `types` array supplies reviewed C structure declarations. IL2CPP metadata parameters and the target compiler ABI are part of those signatures. Keep recovered declarations and target files local.

The existing project can be inspected without saving analysis changes:

```sh
nix develop .#analysis --no-write-lock-file --command ghidra-analyzeHeadless \
  research/ghidra/25144591 LootRules \
  -process GameAssembly.dll -readOnly -noanalysis \
  -scriptPath tools/ghidra \
  -postScript DecompileTargets.java local/loot-targets.json research/ghidra/25144591/loot-review.json \
  -max-cpu 2
```

For an initial import, replace `-process GameAssembly.dll -readOnly` with `-import` followed by the configured GameAssembly.dll path. Select a new project for each build. Do not use `-overwrite` for an existing research project. Keep projects and output under the ignored `research/` directory.

`DecompileTargets.java` checks the imported SHA-256 before analysis. It restricts initial disassembly to supplied executable ranges, applies supplied types and signatures, and limits each decompilation to 60 seconds. The decompiler can follow additional blocks belonging to a function. The script publishes a complete output file without replacing existing evidence. Output records the executable hash, Ghidra version, target language/compiler, type assumptions, function ranges, diagnostics, and pseudocode.

A Ghidra process can exit successfully even when a script reports an error. Check the new output and script diagnostics, not only the process exit status. Wrong-build and existing-output checks were exercised: the wrong build produced no output, and the existing result was not replaced. No third-party scripts, plugins, symbol downloads, or game patches are required. Review scripts before execution; they have host-process privileges.

Verified on this ARM Mac against the x86-64 Windows binary: all four selected addresses match live method metadata, and all four functions decompile. The supplied loot-entry layout produces named `minimum`, `maximum`, and `itemId` accesses. Assembly confirms the minimum/maximum comparison and the call with `maximum + 1`. This does not yet establish the final quantity distribution or economy scaling. A separate read-only runtime check confirmed GetLootReferenceLevel for 56 entities and the null-entity player fallback. Observed levels were 1, 15, 16, 17, 18, and 100. Its evidence run is `437af6f4-c6e7-495d-9d07-247c8c8263ec`.

The verified typed output is `research/ghidra/25144591/loot-signature-verified.json`. Each result includes `appliedSignature` and `bodyBytes` from the Ghidra function database. Function bodies cover the supplied ranges: 319, 1,254, 1,730, and 1,135 bytes for the four selected methods. The verified `PickMinimumDrops` signature returns `void *`, which represents its managed list pointer. Signatures use direct C parsing so pointer declarators remain intact. Decompiler warnings about overlapping globals and indirect control flow remain visible. Pseudocode is not original source or proof of every branch. Check unresolved behavior against assembly and bounded runtime observations before publishing derived rules.

## Loot rule verification

Extraction retains NPC loot bindings, table entries, authored quantities, level gates, nested requirements, and minimum/maximum selection controls. It also exports the five global world-loot bindings and five supplemental cloth tiers. The global settings specify a minimum NPC rank of `MOB` and a maximum of two world-loot items per NPC. These values are source configuration, not effective drop percentages.

Live extraction `caf34af5-2b4b-48e4-af0f-3c15ffbab967` reconciled 208 loot tables with zero unresolved canonical references. One reversed authored quantity range remains a diagnostic; extraction does not silently rewrite it. Nested requirement counts are checked before a snapshot becomes the successful output. A corrupted-artifact replay rejected a missing nested requirement and preserved the previous successful snapshot.

Targeted native analysis in `research/ghidra/25144591/loot-all-sources.json` and `loot-source-contracts.json` distinguishes outer binding rolls, entry rolls, level and quest gates, minimum-drop selection, and supplemental sources. A table's raw rate is not its final item probability. Minimum-drop selection is a separate weighted pass. Level scaling can consume random state, so it is not safe to call merely because it looks like a numeric getter.

Runtime probe `ca551604-5056-48f6-80cf-32c3acf656b3` checked level scaling and requirement results, then restored random state in the same gameplay frame. Inline requirements for loot tables 49 and 124 evaluated to false and true respectively for the research character. These are character-state observations, not permanent eligibility labels.

`RPGNpc.GetLootSpecSource` selects a linked NPC with a loot specialization before the current NPC's own specialization. A linked record is not evidence that every loot-table binding is inherited. Native analysis and live linked-NPC observations must agree before derived sources are published. Effective probabilities remain withheld.

Run `508f7891-5e50-47b2-835e-d75c8e196a4b` compared the specialization rule with native results for all 357 NPCs: four use a linked NPC, eight use themselves, and 345 have no specialization source. The export labels these decisions explicitly and rejects missing or duplicate NPC rows. Tables 142–145 retain eligible-item intervals for reference levels 0–300, before and after the first gear drop. All 142,072 native eligibility comparisons agreed. The character flag was restored within the same gameplay frame. Extraction also rejects missing or duplicate dynamic tables; these intervals describe level eligibility, not unconditional item availability.

## World inventory verification

`extract` includes a hashed `raw/world-inventory.json` artifact. The inventory covers build settings, canonical scene records, referenced destinations, loaded addressable loaders, and component types. It does not claim traversal or complete world coverage.

Build 25144591 reports 33 build scenes, 40 database scenes, and 25 world positions. The inventory scans 143 task records and retains 211 destination or coordinate records, including unset fields. Coalway woods reports 421 addressable loaders. An inactive-inclusive scan found 338 MonoBehaviour types across 19,064 components in run `95629bd1-4f90-40b2-a407-299885811af5`. Counts can change with live observations.

The type scan exposed additional source families, including 29 adventurer zones, 22 crafting stations, four property signs, and activation-condition components. A fixed list of NPCSpawner and OreSpawner components is not a complete content inventory.

Inventory states distinguish currently loaded sources from sources that have not undergone traversal. All 40 scene records currently report `isProceduralScene=false`; this field alone does not prove fixed geometry. World-position records lack a direct scene field, so their 25 unresolved scene associations remain explicit. Names do not establish reachability.

Inventory schema `compendium.world-inventory.v2` retains typed owners, source fields, destinations, loader state, query errors, and native/exported totals. The native probe explicitly queries 23 relevant component families, both active-only and including inactive instances. Integrated run `bcb1eba3-09e4-466e-a3d9-b04e7ff14ac0` retained all 23 families, 339 MonoBehaviour types, and 19,063 components. Its cleanup receipt is clean. These are observations of loaded content, not a complete-world claim.

Extraction rejects unavailable required counts, lost rows, duplicate source identities, and scene links that disagree with canonical IDs or internal names. Start-position links must agree with their canonical scene owner and an inventoried world-position record. A replay of the live artifact rejected an unavailable native total, an unavailable component query, a missing destination row, a wrong existing canonical scene, and a wrong authored start position. The accepted artifact retains 50 inventory diagnostics, including the 25 unverified world-position scene associations. Full source traversal, source classification, and persistent placement identities remain open.

## Coverage ledger

`extract` writes a hashed `coverage.json` artifact with separate relevance, reachability, runtime availability, extraction, and imagery states. Each entry has a reason and a raw artifact path. The ledger retains artifact hashes and per-probe observation contexts. Entry IDs identify artifact rows; source keys group observations within an artifact. Neither is a persistent placement identity.

An inactive producer can remain loaded and reachable. An addressable owner's presence does not establish that its asset is loaded. `loadedOrLoading` remains a separate signal, and geometry readiness remains unverified. An unavailable source is not unused. An unproven unreachable label remains unknown. Existing map textures do not satisfy project-owned screenshot coverage.

Diagnostics group by source, issue type, and category. Detail counts and inclusive raw-array index ranges preserve the original occurrences. Validation checks that every supplied diagnostic row occurs exactly once. Unset references, unresolved references, unverified semantics, unsupported sources, and failures remain distinct. State totals count entries; distinct-source totals remove duplicate projections within an artifact.

Live run `f55809c7-5a4b-4901-a5fe-3f87e5b9789d` retained 3,712 entries and 3,664 distinct source observations. Its 243,340 diagnostic occurrences form 33,041 groups across 1,451 unresolved source keys. One global adventurer-family query remains explicitly unmapped; all 153 structured world-diagnostic owners resolve to their source entries. The run has 19 hashed artifacts and a clean runtime receipt. Imagery remains pending for 3,065 entries and not applicable for 647; none is captured or validated. The complete-release gate remains false.

The live data exposed a hierarchy-path collision: 13 Infected grain observations share a candidate path but have distinct native instance IDs. NPC reference validation and coverage now use raw observation-row paths instead of that hierarchy candidate. The earlier ledger merged five observation groups of 3, 3, 3, 6, and 13 entries; the corrected live ledger has no merged observation groups. A replay injected unresolved NPC IDs into two colliding observations and retained two distinct diagnostic sources. These row paths must not become placement IDs.

The same replay accounted for all 3,712 source entries, retained all 421 loader signals, kept an inactive NPC producer loaded, and kept a resource producer without a live node reachable with imagery pending. An unloaded scene with an unsupported unreachable claim stayed unknown. A mismatched scene path did not acquire loaded status merely from its name or ID. The observed MapZone texture remained separate from screenshot coverage. Scene reload, streamed reload, stable placement identity, and full-world traversal remain unverified.

## Authored producer probes

Run these commands sequentially from the default Nix development shell. HotRepl admits one session; concurrent clients can displace each other.

```sh
bun run tools/cli.ts probe --config local/config.json --probe tools/probes/npc-producers.csx --prelude tools/probes/conditions.csx
bun run tools/cli.ts probe --config local/config.json --probe tools/probes/world-sources.csx --prelude tools/probes/conditions.csx
```

NPC run `da13ea47-aead-48f9-b48b-f9cf47fa6530` exported 800 NPCSpawner producers and 800 authored candidates, separately from live observations. It also exported 29 adventurer zones and one population manager with eight roster candidates. Native roster counts are captured before projection; an unavailable entry remains explicit and does not discard later entries. Per-zone roster assignment, spawn selection semantics, and stable placement identities remain unresolved.

World-source run `97ae5011-300d-4f48-87ff-01dc6deecb60` exported 641 resource producers: 345 Herbalism, 286 Mining, and 10 Fishing. All retained authored outputs. At observation time, 337 Herbalism, 285 Mining, and four Fishing producers had no live node. Candidate prefab actions and linked loot tables supply outputs independently of `CurrentNode`. For example, the Moonbud candidate links to loot table 9, whose authored entry yields item 68 with minimum and maximum quantity 1 and raw rate 100. This is not a derived effective probability.

The same run exported five containers, eight quest zones, three transitions, 26 services, and 420 condition sources. The Lady in Mourning world-quest record resolves to quest 118. The three dungeon entrances resolve to scenes 46, 39, and 36. All four property currencies resolve to Gold Coin, currency 0. Fixed world quests remain separate from `possibleQuests`: eight count mismatches in the earlier projection became zero after correction.

This is loaded-scene extraction, not complete map coverage. The run retains 788 diagnostics and 85 unsupported sources: one heroic console, 75 random activators, and nine interactive zones. Current world-source schema `compendium.world-sources.v3` uses `extracted` for source data; that state does not establish map imagery. Diagnostic paths include the source component type and its observation index. The earlier integrated artifact had 634 diagnostic rows under only seven ambiguous `source.hierarchyPath` paths; the new live artifact has no such paths. These observation indexes are not persistent placement identities. No InteractiveNode component was present, so its corrected empty-container-list branch was not exercised by this run. Persistent identity, merged placement roles, streamed traversal, and capture remain separate acceptance work.

## Integrated producer extraction

Normal `extract` runs include both authored producer probes. Use the separate `probe` commands above only for focused inspection; they do not perform the complete extraction validation.

Run `682c2062-abd5-4f8f-bab3-0e9fca33fd24` on build 25144591 retained 800 NPC producers, 800 candidates, 29 adventurer zones, one roster manager, and 54 live observations. Its world artifact retained 641 resource producers, 503 interactions, five containers, eight quest zones, three transitions, 26 services, and 420 condition sources. The 85 unsupported sources remain explicit. No traversal or stable placement identity is claimed.

Each of the eight context sidecars identifies `AtlasResearch` in Coalway woods and links to its data artifact by SHA-256. Each probe started and ended in the same gameplay frame; the eight probes ran across separate frames. The run also hashes the host extraction, runtime, and schema implementations. A replay rejected a missing NPC producer, a missing nested quest-pool row, a wrong-character observation, and a required world-probe failure. All four failures retained the previous successful extraction pointer and wrote failed manifests. An injected property currency ID was reported as unresolved. A separate corruption check rejected paired exported-candidate counters that disagreed with the actual rows.

World-source schema `compendium.world-sources.v3` projects `RequiredNPCRanks` into strings with native count and availability fields. It does not serialize the IL2CPP list or its pointers. Native smoke run `d242aee3-2881-442e-ac4f-9f92535c4a49` retained the two supplied rank strings. Three temporary inactive InteractiveNode components exercised an empty non-container, an explicit empty container, and a combined resource/container with one resource rank and one loot table. Schema and count checks accepted all three roles. The temporary objects were destroyed before the next gameplay frame, and the node count returned from three to zero. These fixtures are branch checks, not authored map placements.

The integrated run reports 1,028 unresolved raw requirement ID fields, all containing zero across eight database families. The projection retains every typed ID field, including fields that a requirement kind might not use. These are not 1,028 proven broken active conditions or unique missing records. Determine field use from native requirement behavior before publication. Negative IDs, repeated field paths, unsupported source semantics, scene associations, and full-world coverage also remain separate diagnostics or unfinished acceptance work.

## Verified serialized placement identities

`tools/serialized-assets.py` indexes installed scene and prefab hierarchies with pinned UnityPy 1.25.3. `indexSerializedAsset` in `tools/serialized-assets.ts` invokes the locked Python environment and validates its output. The reader decodes GameObject, Transform, RectTransform, and MonoScript metadata, plus MonoBehaviour headers; it does not decode custom gameplay payloads. It preserves signed 64-bit path IDs as decimal strings and retains null component slots. Scene provenance comes from a `levelN` file beside its BuildSettings metadata, not a display-name match. Bundle selection requires the exact asset container path. Source files and metadata dependencies actually read are hashed. Transforms and shared script metadata are parsed once.

`tools/probes/placement-snapshot.csx` records the same 23 source-family queries, their deduplicated component union, all-component slot indexes, ancestors, and loaded stream roots. `tools/probes/addressable-locations.csx` reads GUID locations and bundle dependencies without loading assets. Catalog run `bbba3983-7cab-4305-aaf9-2ba6eef50117` recorded 421 GUIDs and 880 resource locations.

`resolvePlacementIdentities` in `tools/placement-identities.ts` matches native hierarchy observations to serialized records. Scene-root sibling indexes are not trusted. Child names and indexes establish correspondence; they are not persistent keys. Streamed objects use an explicitly identified prefab root and the serialized identity of their loader. Placement hashes include the build, canonical scene provenance, serialized source file, and GameObject path ID. Source hashes also include the component path ID. Runtime IDs and coordinates are observations only. Missing, ambiguous, foreign-scene, and colliding bindings remain unresolved. A rejected loader cannot leave resolved descendants.

The Coalway woods index contains 75,291 serialized objects, 19,124 GameObjects/transforms, and 6,172 MonoBehaviours. Of those MonoBehaviours, 6,171 are attached and one is unbound; 46 have null scripts. Two exact prefab indexes resolve the eight observed streamed source components. Together, these inputs resolve 2,886 sources, including all 800 NPC producers.

The native woods → swamp → woods cycle retained all 2,886 source IDs and placement IDs while every corresponding component and GameObject instance ID changed. The woods scene handle changed from `-106694` to `-2178050`. The intermediate swamp snapshot is run `79e926c5-68c0-448a-94be-908eb6a240eb`; the returned woods snapshot is `9dac81da-f29e-4f07-8e97-cc98f8af953a`. Both transition operations produced clean receipts after native readiness settled. `artifacts/placement-smoke/scene-reload-proof.json` records the comparison.

The separate stream check destroyed the old prefab root and observed all four target source components disappear. Reload produced a new root and new component/GameObject IDs while retaining the four source IDs and placement IDs. All 2,886 resolved sources were retained overall. Cleanup restored the loader's enabled state and original hold deadline. The proof and receipt are `artifacts/placement-smoke/stream-reload-proof.json` and `stream-runtime-cleanup.json`.

Regression tests cover distinct instances of a shared prefab, multiple component roles on one placement, IDs above JavaScript's safe integer range, null component slots, changed runtime observations, pending scene holds, ambiguous roots, and descendants of colliding loaders. The real scene and prefab indexes and scene comparison were replayed after parser and resolver cleanup.

Persistence probe `7fc556e6-6d6a-4aac-ae4d-e2a5e2573e78` found zero SaverIdentifier and NPCSpawnerSaver components, with 800 NPCSpawner components as a positive query control. No persistence key is claimed as verified or used as a fallback. This result applies to the observed woods scene, not the entire game. After reload, 38 components lacked a serialized correspondence and 63 belonged to other scenes. They remain unresolved; these checks do not establish complete-world coverage. Nested streamed loaders are also unresolved rather than assigned a guessed identity.

After the user-reported 94.12 GB process was restarted, its footprint was about 8 GB. After the stream and scene checks, `footprint` reported 9,053 MB total and a 9,493 MB peak. The cause of the earlier growth is not established.

## SQLite identity storage

`openIdentityDatabase` and `recordPlacementIdentities` in `tools/identity-store.ts` store authored identities separately from observations. `identity_scenes`, `placement_identities`, and `source_identities` retain canonical scope and serialized keys. `identity_runs` records snapshot hashes, frames, characters, and scene handles. `source_observations` retains native IDs, positions, and unresolved evidence per run. Serialized path IDs remain text, including signed values outside JavaScript's safe integer range.

Strict SQLite tables enforce primary keys, authored-key uniqueness, and foreign keys. The placement uniqueness index treats a null loader as a real scene-origin scope. Shared prefab instances remain distinct through their loader source. Deferred loader foreign keys allow a source to appear before its loader in the input, but prevent committing a missing or cross-scene loader. Reusing an identity with different authored fields fails. Duplicate run/source bindings also fail. Each import is one transaction; a failed import leaves no partial identities or observations.

The real before/after scene evidence produced 2,611 placements, 2,886 sources, two runs, 5,772 resolved observations, and 201 unresolved observations. All 2,886 retained sources had different native component and GameObject IDs between runs. Four invalid imports were rejected without retaining their run rows. A separate regression test verifies complete rollback when a deferred loader reference fails at commit. The database passed `foreign_key_check` and retained all 2,886 sources after closing and reopening. `artifacts/placement-smoke/sqlite-proof.json` records the database path and counts. Eight tests and the TypeScript check pass. Domain relationship tables and normal extraction integration remain later work; this database is identity evidence, not a complete published map.

## Bounded scene and stream traversal

Run `nix develop --no-write-lock-file --command bun tools/cli.ts traverse --config local/identity-smoke-config.json --plan local/traversal-plan.json`. The measured configuration uses a 30,000 ms per-probe and cleanup timeout. The plan has a separate deadline for each scene visit:

```json
{
  "schemaVersion": "compendium.traversal-plan.v1",
  "stepTimeoutMs": 60000,
  "steps": [
    {
      "sceneNativeId": 3,
      "streamAssetGuids": [
        "3696a306b7c00b54c84b951952fe2fa2",
        "56fc8464dd72c854794e77ddd3e55f63",
        "0a056dae5aac97341a52620f4dc5d505"
      ]
    },
    { "sceneNativeId": 9, "streamAssetGuids": [] }
  ]
}
```

Plans allow one to eight scene visits and at most 32 selected loaders per visit. Every matching instance of a requested GUID is retained; an ambiguous instance ID, absent requested GUID, or excessive selection fails instead of selecting an arbitrary object. A visit uses the native scene database and loadability check before changing scenes. `scene-visit.csx` waits for the loaded scene, initialization, loading flag, and readiness holds to agree. Its native cleanup verifies that the configured research character remains loaded, returns to the original scene, and restores the player position and rotation. A new scene visit cannot start while a stream visit is active.

`stream-visit.csx` changes holds only for eligible active loaders. It does not change activation or enabled flags. Native `Preload()` skips inactive loaders without an error, so inactive and disabled rows remain explicit pending evidence. Already-loading targets and unsettled automatic loads near the player are rejected before mutation; the tool does not take ownership of native work already in progress or about to start. Forced far loads must report a root, a valid instance handle, and no pending load across a later frame before extraction. Restoration releases only requested new loads, waits for their roots to be destroyed, restores changed holds, and preserves initially loaded roots. Missing loaders or changed source assets fail instead of returning cached state.

The host records canonical reference inputs, before/after placement snapshots, world inventory, NPC producers, world sources, observation contexts, and grouped coverage ledgers. Each visit also records selected stream roots and the queried source components beneath them. All artifacts are registered in the run manifest. Publication of the successful-run pointer occurs only after stream restoration, scene restoration, and the owner cleanup receipt succeed. A step deadline cancels the runtime connection; native cleanup does not need another host request. This command is bounded research extraction, not full-build collection or a complete-release gate.

Run `afab4be1-e565-4387-a364-e26177f501ef` completed the two-scene plan in 50.94 seconds. The near stream was already loaded at 493.90 units with a 600-unit load distance. The travelers' camp was initially unloaded at 419.89 units with a 250-unit load distance. Both produced three InteractableObject components and one CraftingStation component. The camp's four queried sources agree with its offline prefab index. The inactive stream remained unloaded and pending. Cleanup preserved the near root, released the new camp root, and restored the exact hold values. The swamp visit returned to woods with the original player transform. After controller cleanup, control-artifact hash checks, and the character restoration guard, the complete plan passed again in run `d84c168f-3c10-431e-99fa-f767b3c96bfd`; the TypeScript check and all eight tests also passed. `artifacts/traversal-smoke/character-guard/proof.json` records the wrong-character boundary: restoration accepted mismatched visit metadata before the guard and rejected it afterward. The check changed only tool-owned metadata, left the player transform unchanged, and ended with clean owner cleanup.

Separate socket-loss checks interrupted a pending camp load and a scene visit. Both produced clean disconnected-owner receipts, removed their native controller state, and restored the original player position. Their proofs are `artifacts/traversal-smoke/stream-interruption/proof.json` and `scene-interruption/proof.json`. A missing requested stream and a one-second step deadline both produced failed manifests and clean owner receipts without replacing successful run `80350e9c-9b6f-4e6f-8663-d5d0b5c562b6`. `artifacts/traversal-smoke/failure-proof.json` records those checks. The observed woods inventory still has 238 inactive loaders out of 421; these results do not establish their reachability or resolve their contents.

The woods raw world-source artifact is 69.38 MiB, its validation evidence is 45.78 MiB, and its grouped coverage ledger is 43.88 MiB. Those are research artifacts, not proposed browser downloads. After traversal and interruption checks, the game footprint was about 11 GB with a reported 24 GB peak. The cause of the earlier user-reported 94.12 GB footprint remains unknown. Do not infer full-build memory or publication size from this bounded run.

## Exclusive runtime ownership

All repository runtime commands acquire an exclusive SQLite transaction at `~/.cache/afallon-compendium/runtime-owner.sqlite` before connecting. A competing command fails without opening another game connection. The operating system releases the lock if the host process dies. Evaluation IDs include the owner UUID, so a stale response cannot satisfy a different owner's request.

`tools/probes/runtime-owner.csx` binds the native owner to the current HotRepl connection. A game-side coroutine runs registered cleanup when that connection closes or is replaced. Cleanup does not require a later host restoration request. The host requires a matching `compendium.runtime-owner.v1` receipt with state `clean`, no errors, and no remaining callbacks. Failed cleanup blocks the next native claim. Do not clear unknown failed-owner state to retry an operation.

Use `withRuntime` for every extraction, traversal, and capture operation. `Runtime.evaluate` takes a C# expression; `Runtime.probe` wraps a reviewed probe body. Both expose `registerRuntimeCleanup(Action)`, `registerRuntimeCleanupWait(Func<bool>)`, and `registerFrameCleanup(Action)` to that C# code. Register cleanup before allocating resources or changing state. Runtime registration returns an unregister action; unregister only after explicit cleanup. Each unregister action removes its own registration, including when the same delegate was registered more than once. Frame cleanup runs synchronously in the evaluation's `finally` block, including on exceptions. An evaluation error ends the owner; subsequent checks need a new owned operation.

Runtime callbacks run in reverse registration order. An immediate callback must finish synchronously. A deferred callback returns `false` while native restoration is pending and `true` when it has settled. Pending cleanup keeps the native owner in `cleaning`, delays earlier callbacks, and prevents a clean receipt. The game-side monitor continues polling after socket loss. Deferred callbacks must tolerate repeated calls. A host deadline does not turn pending native work into successful cleanup.

The live deferred-cleanup check removed an inactive GameObject after five game frames on both normal completion and socket disconnect. Both runs preserved callback order after unregistering a repeated delegate. The disconnect receipt for owner `10aae9f1-a466-4b57-8498-4a0841155ffc` is clean, with no errors or callbacks left. The proof is `artifacts/cleanup-smoke/deferred-cleanup-proof.json`. Native stream and scene checks also used deferred cleanup: stream owner `8c247db0-adaa-4506-9f4a-94309f55811f` restored the loader state; scene owners `94e3f2ee-2968-4ddc-b95d-0773f853ed5e` and `3103b16c-6855-465d-810b-0c35982e75c5` retained ownership until scene initialization and loading holds settled.

Call `runtime.complete()` before publishing results inside an owned callback. Completion is terminal and idempotent. Probe and extraction runs copy the confirmed receipt into `runtime-cleanup.json` before selecting a successful run. Manifests record the owner token and native ownership source hash. `withRuntime` also completes before returning and confirms cleanup on failure.

The six live lifecycle checks passed: a busy doctor did not displace the holder; the holder still received its verified artifact; SIGINT, SIGKILL, and raw-client displacement removed its inactive GameObject; and an injected exception restored `FirstGearDropDone` in frame 815915 before that frame ended. A deliberately failing cleanup callback blocked another doctor. The negative fixture changed no game state and was removed only after checking its exact token, single injected error, and empty callback list. Its failed receipt remains as evidence under `artifacts/.runtime/56daf61c-8c4e-4a38-9469-e1aae13c2c9e.json`.

An in-flight disconnect exposed a registration race. The previous guard rejected cleanup registration after socket loss even though the evaluation still owned the current frame. Reproduction `fdc5168b-99dc-4192-8924-ce47efaa653d` failed that check; a test-only frame backup removed the object. With the corrected guard, `5576c714-d436-497f-83ec-d0ab132e8b4c` registered runtime cleanup after the disconnect and removed the object. Both checks verified zero remaining objects. Their receipts and native evidence remain under `artifacts/.runtime/`.

Integrated extraction `b950166c-2b6d-495c-ad62-4cf6ee508c2c` succeeded with 18 artifacts, including a clean receipt for owner `a2ef407e-f9b1-4320-95e6-e54c5c75201a`. The receipt token matches the manifest. The recorded runtime, extraction, and native-owner source hashes match the exercised code. Producer counts and unresolved coverage remain as described above. A cleanup failure injected after all eight probes and validation produced failed run `83b6121c-653a-418f-88cb-b46c3f21d717`. It preserved the successful extraction pointer to `b950166c-2b6d-495c-ad62-4cf6ee508c2c`. The controlled callback changed no game state; its empty failed-owner fixture was removed after exact token and error checks.

This is repository-command coordination, not server-side authorization. An arbitrary raw HotRepl client can still replace the connected client. The in-flight check observed the server forwarding a stale reply to that replacement; owner-prefixed request IDs prevent it from completing another repository request. Native cleanup also cannot preempt C# or run while the game thread is blocked. A missing or failed cleanup receipt remains an error, not permission to reuse affected state.

The VM connection has an intermittent setup delay. A raw handshake took 8.5 seconds; two owned attempts exceeded the existing 10-second connection deadline before claiming ownership. The six lifecycle checks passed with that existing configuration. The in-flight follow-up and integrated extraction used an isolated 30-second smoke configuration, without changing `local/config.json`. SDK 4.0.1 also leaves its opening promise pending when the socket closes before a handshake; the host deadline and CLI termination bound that wait. No SDK or HotRepl server code was changed.

## Existing-project defect recorded during comparison

`ancient-kingdoms-mods/mods/MapScreenshotter/MapScreenshotter.cs:173-205` disables the player and changes global lighting before checking ZoneInfo. Its null-data error branches exit without local restoration. The capture also uses hardcoded bounds at lines 239–242. These are reasons not to copy that setup into Afallon. No Ancient Kingdoms files were changed.
