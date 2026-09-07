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

Duskfall Depths loaded 16 NPCSpawner, 85 InteractableObject, and 9 AddressableLoader components at the sample. Its camera was at (2418,-810.12,-957.76), outside its one MapZone extent centered at (1659.18,-778.30,-905.70), size (463.35,605.96). The authored arrival room lies outside this MapZone. Its arrival trigger moves the player into the mapped dungeon without changing scenes. The native transition verification below explains the mismatch. MapZone bounds are not an unconditional screenshot-capture boundary.

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

NPC run `da13ea47-aead-48f9-b48b-f9cf47fa6530` exported 800 NPCSpawner producers and 800 authored candidates, separately from live observations. It also exported 29 adventurer zones and one population manager with eight roster candidates. Native roster counts are captured before projection; an unavailable entry remains explicit and does not discard later entries. Per-zone roster assignment and spawn selection semantics remain unresolved. This raw probe records identity candidates; the serialized-identity stage supplies verified placement bindings.

World-source run `97ae5011-300d-4f48-87ff-01dc6deecb60` exported 641 resource producers: 345 Herbalism, 286 Mining, and 10 Fishing. All retained authored outputs. At observation time, 337 Herbalism, 285 Mining, and four Fishing producers had no live node. Candidate prefab actions and linked loot tables supply outputs independently of `CurrentNode`. For example, the Moonbud candidate links to loot table 9, whose authored entry yields item 68 with minimum and maximum quantity 1 and raw rate 100. This is not a derived effective probability.

The same run exported five containers, eight quest zones, three transitions, 26 services, and 420 condition sources. The Lady in Mourning world-quest record resolves to quest 118. The three dungeon entrances resolve to scenes 46, 39, and 36. All four property currencies resolve to Gold Coin, currency 0. Fixed world quests remain separate from `possibleQuests`: eight count mismatches in the earlier projection became zero after correction.

This is loaded-scene extraction, not complete map coverage. The run retains 788 diagnostics and 85 unsupported sources: one heroic console, 75 random activators, and nine interactive zones. Current world-source schema `compendium.world-sources.v4` uses `extracted` for source data; that state does not establish map imagery. Diagnostic paths include the source component type and its observation index. The earlier integrated artifact had 634 diagnostic rows under only seven ambiguous `source.hierarchyPath` paths; the new live artifact has no such paths. These observation indexes are not persistent placement identities. No InteractiveNode component was present, so its corrected empty-container-list branch was not exercised by this run. This raw probe does not perform serialized identity resolution, role merging, streamed traversal, or capture.

## Integrated producer extraction

Normal `extract` runs include both authored producer probes. Use the separate `probe` commands above only for focused inspection; they do not perform the complete extraction validation.

Run `682c2062-abd5-4f8f-bab3-0e9fca33fd24` on build 25144591 retained 800 NPC producers, 800 candidates, 29 adventurer zones, one roster manager, and 54 live observations. Its world artifact retained 641 resource producers, 503 interactions, five containers, eight quest zones, three transitions, 26 services, and 420 condition sources. The 85 unsupported sources remain explicit. No traversal or stable placement identity is claimed.

Each of the eight context sidecars identifies `AtlasResearch` in Coalway woods and links to its data artifact by SHA-256. Each probe started and ended in the same gameplay frame; the eight probes ran across separate frames. The run also hashes the host extraction, runtime, and schema implementations. A replay rejected a missing NPC producer, a missing nested quest-pool row, a wrong-character observation, and a required world-probe failure. All four failures retained the previous successful extraction pointer and wrote failed manifests. An injected property currency ID was reported as unresolved. A separate corruption check rejected paired exported-candidate counters that disagreed with the actual rows.

World-source schema `compendium.world-sources.v4` projects `RequiredNPCRanks` into strings with native count and availability fields. It does not serialize the IL2CPP list or its pointers. Native smoke run `d242aee3-2881-442e-ac4f-9f92535c4a49` retained the two supplied rank strings. Three temporary inactive InteractiveNode components exercised an empty non-container, an explicit empty container, and a combined resource/container with one resource rank and one loot table. Schema and count checks accepted all three roles. The temporary objects were destroyed before the next gameplay frame, and the node count returned from three to zero. These fixtures are branch checks, not authored map placements.

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

## NPC producer acceptance

Build 25144591 acceptance compares the existing projection with native NPCSpawner fields and methods. `research/ghidra/25144591/npc-producer-functions.json` contains eight hash-matched function analyses. Runtime method metadata supplies the addresses; PE unwind entries supply the initial ranges. The live proofs are `artifacts/npc-acceptance/before/proof.json` and `after/proof.json`.

- The Entling area at `GAMEPLAY[0]/NPC Spawners[2]/Neutral[38]/Entling (1)[76]` has candidate NPC 36, an XZ half-width of 7.37, height 6.29, and `npcCountMax=3`. All 32 native position samples were inside the authored square; ten were outside a circle of radius 7.37. NPCSpawner area sampling is not a circular spawn radius. Native ground and NavMesh fallbacks remain part of position selection. The three live Entlings had roaming positions and levels 15, 15, and 17; those observations do not replace the authored area.
- The fixed fisher at `GAMEPLAY[0]/NPC Spawners[2]/Npcs reset night[21]/Okanevale[0]/Fenric dorin fisher[5]/Fisher merchant fisihing[0]` has candidate NPC 234 and `npcCountMax=1`. Both native position samples matched the authored point. Its one-group `Night not active _REQUIREMENTS` template evaluated false in the first check and true in the second while the same observed NPC remained present. A live NPC does not prove that its producer conditions currently pass.

Both fixtures retained their raw chance 100 and persistence flag, count fields, condition-source flags, and level, scaling, faction, species, respawn, patrol, and leash overrides. Enabled level inputs were 1–2, player scaling was enabled, and the zone range was 15–30. Respawn inputs were 30–30 seconds for Entling and 10–20 for the fisher. These are authored inputs; the check does not infer override precedence or a spawn probability. `GetTotalNPCs` matched both native lists. Native `Initialize` checks that total against `npcCountMax` and checks `spawnedCountMax` in Limited mode; counter updates and resets across other spawn paths remain unverified.

Native `AreRequirementsMet` returns true when template mode selects a Unity-null template. The projection retains its null representation, selects no effective condition source, and does not report a missing-template coverage gap. The live check reduced NPC diagnostics from 604 to one without removing any of the 800 producers or 800 candidates. It retained 750 producers without a current NPC and kept 56 observations separate. The remaining diagnostic concerns the unverified per-zone association with the global adventurer roster. Sampling restored the native random sequence and its warning flag within the same gameplay frame; both owner receipts were clean.

Normal extraction run `f8c1a665-50a5-449f-a104-6a634f3197b0` passed schema, count, reference, and context checks with the corrected producer projection. TypeScript and all eight tests passed. The game footprint was 14 GB with a reported 24 GB peak; the earlier 94.12 GB growth remains unexplained. Complete-world coverage remains false.

## Verified placement roles

Normal `extract` runs publish serialized inputs under `identities/` and merged facts in `placement-roles.json`. Each `traverse` visit publishes the same artifacts under its step directory. Role facts retain canonical NPC references, source-component IDs, and JSON-pointer evidence. Unplaced sources retain their role facts without receiving a guessed placement.

NPC source schema `compendium.npc-producers.v2` and world-source schema `compendium.world-sources.v5` retain component and GameObject observation IDs. These IDs join records within a native snapshot. Serialized records still determine persistent IDs.

World sources also retain the scene handle and use the all-component GameObject slot. This slot agrees with the identity snapshot. A same-type component count cannot supply this slot. Missing observations, different scene instances, and incompatible component slots cannot fall back to names or coordinates.

`tools/probes/faction-roles.csx` records faction definitions, player standing, both alignment directions, and sampled native NPC alignments. Hash-checked native analysis is in `research/ghidra/25144591/faction-alignment-functions.json`. `FactionManager.GetAlignment` selects the first Unity-equal stance and reads `AlignementToPlayer`, not the legacy `playerAlignment` field. No matching stance returns Neutral. The observed stance assets all had database ID `-1`. Their observation identities remain distinct.

Native Enemy, Ally, and Neutral NPC samples matched the recovered rules, and player standing remained unchanged.

NPC capabilities and ranks have `authored` scope. Enemy, friendly, and neutral facts have `player-state` scope and describe NPC-to-player faction alignment, not aggression or spawn probability. Enabled producer faction overrides suppress base-faction disposition until their application is verified. Disabled merchant and quest flags do not create roles or unresolved-binding counts. Native action references determine container and quest-location roles. Component names do not.

Final extraction `aff6aabf-77f5-45e0-b1f9-81c4b907a9c1` processed 2,522 source rows. It resolved 2,417 source components into 2,183 physical placements. There were 54 multi-source placements and 1,005 placements with multiple role names. Nine placements retained merchant and quest-giver roles together. NPC 36 retained 21 distinct placements.

The audit resolved all 8,440 evidence pointers and verified source-to-placement links. Its proof is `artifacts/source-role-smoke/db71c651-7b4e-4efe-943c-c75faa206223/proof.json`.

Controlled replay used real extracted inputs to check three boundaries. An absent component observation remained unplaced despite unchanged names and coordinates. A faction override removed base disposition while retaining merchant and quest-giver capabilities. Two existing components, supplied with different recorded action payloads, produced container and quest-location roles on one physical placement.

This last case tests the merger. It does not claim those substituted actions exist in the game. The proof is `artifacts/source-role-smoke/414c54c3-7e6d-4f77-b328-302c3aaa999a/proof.json`.

Serialized preparation indexes only loaded prefabs that contain queried source components. On the same snapshot, two prefab indexes produced exactly the same identity result as 70 indexes. The final run recorded 77 loaded streams, two source-bearing streams, and 75 skips with reason `no-queried-source-components`. These skips do not establish unused content or complete geometry coverage. `compendium.scene-source-issues.v2` records this scope explicitly.

Traversal `c32b0977-6aba-4236-8bba-66c1d165e4a7` covered woods and swamp with bounded stream holds. The woods step retained 2,186 placements, including the selected far camp. The swamp step retained 536 placements. One inactive selected stream remained skipped. Both steps restored their source scene, and the owner receipt was clean with no remaining callbacks.

Coverage schema `compendium.coverage.v2` binds the role summary to the hashed placement-role artifact. Unplaced sources and unresolved role issues block role resolution independently of raw diagnostic groups. The normal run and both traversal steps reported blocked role resolution. The normal hash check is recorded beside the pointer audit as `coverage-proof.json`. Verified smoke drivers and the bounded traversal plan are archived under `artifacts/source-role-smoke/drivers/`.

The final loaded-scene run retains 100 unplaced sources and 1,087 unresolved role issue occurrences. Unsupported actions, activation semantics, adventurer roster associations, and faction override application remain explicit gaps. Issue occurrences are not counts of distinct missing sources.

TypeScript and all eight regression tests passed. The game footprint was 16 GB with a 24 GB peak. The earlier 94.12 GB growth remains unexplained. Complete-world coverage and primary screenshot coverage remain false.

## Native scene calibration evidence

Normal extraction and each traversal step now publish `scene-catalog.json` and `native-map-registrations.json`. Raw evidence includes `map-geometry.json` and `navigation-geometry.json`. Registration records bind to the geometry artifact hash. Build inputs include `UnityPlayer.dll` because the recovered navigation binding executes engine code.

The catalog compares database `entryName` values with exact Unity build-path basenames. The observed 40 database records produce 32 matches and eight unmatched records. No record has an ambiguous match. All 33 build records remain present, including the unclaimed MainMenu scene. Unmatched records do not become unused, unreachable, or public maps by inference.

MapZone registration uses native samples at `(-1,-1)`, `(0,0)`, `(1,0)`, `(0,1)`, and `(1,1)`. The fit supports rotation and reflection and verifies all world samples and normalized round trips. Singular, non-horizontal, and contradictory samples remain unresolved. Its Y coordinate is the native map plane, not a grounded floor. This is not image calibration or proof of complete capture bounds.

Duskfall registration had a maximum world residual of 0.0001 and normalized residual below 0.000001. Its native player projection agreed with the fitted inverse. Controlled checks covered reflected coordinates, contradictory round trips, and duplicate scene basenames. Evidence is in `artifacts/map-calibration-smoke/d8587f33-8ffa-4f88-a0ac-9b385a72843b/registration-proof.json`.

### Duskfall arrival and transition

Duskfall uses database scene 10 and build scene 28. Its authored arrival position is `(2418,-811,-951)`, outside the MapZone. The `Load new area cave` trigger has a template Position teleport to `(1589,-813,-955)`. Entering its enabled trigger volume through the player controller activated that authored action. The player and camera moved into the MapZone without changing scene instances.

The visit restored the original scene, player position, and rotation. Its native owner reported clean cleanup with no remaining callbacks. Geometry, transition, and role evidence are in `artifacts/map-calibration-smoke/90e3c65f-4b10-4d81-be50-f7d6da1acc23/proof.json`.

World-source schema `compendium.world-sources.v5` preserves template and inline GameActions separately in native execution order. Nested rows retain discriminators, chance, requirement groups, and teleport payloads. Template instance IDs and native IDs remain observations, not canonical identities. Supported Position and GameScene teleports qualify as transitions. Target teleports and unsupported effects retain explicit issues.

A known teleport retains its role when an unresolved sibling action exists. An empty payload retains an explicit blocker. Both defects were reproduced with controlled inputs and then passed with the corrected collector. The replay also checked Target teleports and scene-reference handling. Evidence is in `artifacts/map-calibration-smoke/90e3c65f-4b10-4d81-be50-f7d6da1acc23/game-actions-proof.json`.

### Geometry and navigation scope

`compendium.map-geometry.v3` records scene-local renderers, shared mesh metadata, terrain data, navigation surfaces, regions, MapZones, and grounded landmark samples. Native query counts retain foreign-scene observations separately. Disabled objects remain included. These observations do not establish complete streamed geometry coverage.

The generated bindings omit `NavMesh.CalculateTriangulation`. The engine still resolves `UnityEngine.AI.NavMesh::CalculateTriangulation_Injected`. Native inspection verified its three-array-pointer ABI at UnityPlayer RVA `0x169000`. The evidence and engine hash are in `artifacts/map-calibration-smoke/native-triangulation-abi.json`.

`compendium.navigation-geometry.v2` stores flat world-XYZ coordinates, triangle indices, and area indices. Duskfall produced 26,093 vertices and 11,639 triangles. Coalway woods produced 1,716,233 vertices and 777,867 triangles. Flat arrays avoid allocating one managed object per vertex. The query covers all loaded navigation data, so per-triangle surface ownership remains unresolved.

Duskfall navigation spans about 999 by 999 world units and 185 units of height. Its broad flat surface and higher geometry do not establish the dungeon's playable boundary. Triangulation excludes off-mesh links and detailed grounding geometry. Unity documents this distinction in its [CalculateTriangulation reference](https://docs.unity3d.com/2022.3/Documentation/ScriptReference/AI.NavMesh.CalculateTriangulation.html). Native grounding samples remain separate evidence.

Normal extraction `c1ae0311-9a9d-442e-80a6-cd670f9fbc9f` registered geometry, the scene catalog, engine identity, and verified woods coordinates. Isolated dungeon traversal `d87f275a-341b-485e-ab56-322e3aa09ece` completed and restored the source scene under the existing deadline. Its release coverage remained blocked.

Combined traversal `d0b2e5c5-5c57-4bbc-87d6-bc375e56e8fb` completed the swamp step but exceeded the dungeon step's 100-second deadline during restoration. Dungeon loading consumed 68.5 seconds, and extraction finished before the deadline. Automatic cleanup then completed with no errors or remaining callbacks. The failed run remains recorded as failed. The isolated verification did not relax the deadline.

Woods and swamp retained identical native basis transforms. Their player landmarks and the outside Duskfall arrival matched native normalized coordinates without clamping. Artifact hashes, engine identity, and successful step restoration were checked in `artifacts/map-calibration-smoke/integration-proof.json`.

TypeScript, all eight regression tests, and strict OpenSpec validation passed. Verified replay drivers and traversal plans are archived under `artifacts/map-calibration-smoke/drivers/`. The archived registration, nested-action, and artifact-provenance replays also passed.

The canceled traversal manifest retains its original socket-close diagnostic. Runtime evaluation now propagates the first cancellation reason to failed-run writers. Historical manifests are not rewritten.

The measured game footprint after the combined run was 23 GB with a 24 GB peak. The earlier 94.12 GB growth remains unexplained. Rendered map-space definitions, reviewed floor assignments, and primary screenshot coverage remain incomplete.

## Reviewed map-space membership

The optional `mapSpaceProfile` configuration field selects a `compendium.map-space-profile.v1` JSON file. Its path is relative to the configuration file. Each source binding declares an exact scene ID and path, a horizontal coordinate frame, membership domains, floor domains, and hashed review evidence. Evidence paths are relative to the original profile file. The run retains that input location and the exact profile bytes.

`tools/map-spaces.ts` compiles source-scene lookups and inverse frames. Domain boxes include their minimum coordinates and exclude their maximum coordinates on all three axes. World Y selects reviewed floors but does not change horizontal projection. Overlapping floor domains remain ambiguous. Missing scene bindings, uncovered positions, missing floors, and contradictory scene catalogs remain explicit. The resolver does not choose the nearest floor or clamp positions.

`spatial.json` binds each placement identity and XYZ observation to map-space candidates, floor candidates, and geometric region membership. Region predicates compile once per snapshot. They support oriented boxes and spheres, include inactive authored volumes, and retain unsupported shapes. Region component IDs and negative native IDs remain observations, not canonical identities. No spatial result establishes screenshot coverage.

The representative profile places woods and swamp in one Coalway map space. Two shared TerrainData observations have identical data, rotations, and scales across those scenes. Their world-position residuals are 0.000126 and 0.000255 units. This geometry check supplements the native MapZone registration instead of treating its texture or local ID as sufficient evidence. Results are in `artifacts/map-calibration-smoke/shared-terrain-registration.json`.

Duskfall uses separate arrival and main map spaces. Their reviewed membership boxes are not capture boundaries. The main profile labels the surveyed route without asserting a complete architectural floor inventory. A controlled two-floor profile verifies that identical XZ positions retain separate floors through Y. Boundary, overlapping-domain, reflected-frame, unsupported-region, and changed-evidence checks are in `artifacts/map-calibration-smoke/spatial-proof.json`.

A one-metre grid query found 189 overlapping navigation columns in the sampled Duskfall rectangle. Restricting retained triangle vertices to Y at or below -780 left 33 such columns. A stacked-triangle positive control produced 55 matching columns. These counts describe coarse navigation geometry, not playable floors. Evidence is in `artifacts/map-calibration-smoke/navigation-layer-columns.json`.

Native visit `11bc413f-77b1-4136-b075-d2e12b52c8e3` checked 13 positions with navigation samples, bidirectional paths, and downward physics rays. Five positions had complete paths both ways from the dungeon entrance. Seven had partial paths, including lower surfaces beneath two reachable wooden bridges and high tree geometry. The arrival room had a physical floor but no nearby navigation sample. The visit restored the source scene and reported clean cleanup. Path results do not prove that every partial-path surface is unreachable by the player.

Native region visit `d45f7917-2e13-4a26-b5d9-28334d2318f2` compared 141 queries across 47 woods regions. Compiled membership matched native inverse transforms and local-box containment for every query. All 47 centers matched, and all 47 outside control points were rejected. The owner receipt was clean.

Normal extraction `c3f45239-a466-4109-a720-4b2d40836753` resolved all 2,183 retained woods placements into the reviewed Coalway map space. It reported no ambiguous memberships or region-shape issues and completed cleanly. This is membership coverage, not complete source extraction or imagery coverage.

Traversal `e1fe3815-c911-4e13-b56d-77fbc2444a5c` produced the same 88 resolved and four unresolved dungeon placements. Spatial output finished about 44.4 seconds after scene start. The 100-second step deadline expired while the source scene was restoring. Automatic cleanup subsequently reported clean state with no remaining callbacks. The manifest remains failed with its original socket-close diagnostic. The deadline was not relaxed.

The archived dungeon replay resolved 88 of 92 retained placements. Four outliers remain outside the reviewed domains. Their evidence points to quest and mount-control hierarchies. Observed Y values change between the world-source and placement snapshots, reaching 24,603.957 units in the placement snapshot. Their spatial applicability remains unresolved. The pipeline retains their identities and coordinates instead of enlarging the map or suppressing them.

`artifacts/map-calibration-smoke/spatial-integration-proof.json` verifies both runs' source hashes, profile hashes, exact projection replay, and cleanup receipts. TypeScript and all ten regression tests passed. The tests retain the overlapping-floor boundary and contradictory-catalog cases. A catalog with multiple build paths was incorrectly accepted despite its `matched` label. That case failed before the guard change and passed afterward.

Spatial smoke drivers are archived under `artifacts/map-calibration-smoke/drivers/`. Reviewed local profile and connection inputs remain under `local/`. Full-build map-space review, complete interior floor review, and primary screenshot coverage remain open. Task 3.9 stays unchecked until that floor review is complete.

## Owned screenshot capture

`capture --config <file> --plan <file>` accepts a `compendium.capture-plan.v3` plan and a reviewed `mapSpaceProfile`. The plan selects the source scene, map space, optional floor, camera rectangles, image dimensions, lighting, and reviewed ceiling selectors. Capture enters the requested scene when necessary and restores the original scene, position, and rotation before success. Its readiness profile bounds each scene transition and each complete tile operation. Capture holds geometry until rendering and restoration finish. Successful results report `readiness: verified` and retain `completeImagery: false`.

`tools/probes/capture-session.csx` registers native cleanup before allocating its camera, directional light, render target, and readable texture. The two GameObjects and their components remain inactive between captures. These resources can survive multiple game frames. Explicit restoration, failed allocation, cancellation, and socket loss use the same native cleanup action. The cleanup receipt identifies the resource prefix and reports remaining objects.

Each render records native fog, ambient lighting, the spherical-harmonics probe, the active render target, and selected renderer flags before making temporary visual changes. Its frame-local cleanup restores those values before the evaluation returns. The restoration artifact records the actual before and after values and native frame numbers. A failed read remains unavailable; it is not replaced with the earlier observation. Failed rendering does not publish a PNG.

The capture host checks source and owner identity, camera metadata, PNG dimensions and hashes, exact visual-state restoration, and clean resource receipts. It retains the reviewed profile, plan, scene catalog, and raw inventory with the run. Geometry readiness uses the owned stream scope described below. Controlled illumination and transient suppression are described below. Reviewed floor visibility and resumable capture coverage remain open.

All 12 lifecycle cases passed: normal rendering, four partial-allocation failures, three render-stage failures, and cancellation or disconnection both between and within frames. Every case had a clean owner receipt and an independent native scan with zero remaining capture objects. In-frame cases retained equality for the recorded visible state and matching frame numbers. Custom-mode cache checks appear in the controlled-illumination evidence below. All four cancellation and disconnection cases wrote their native cleanup receipts before the host callback unwound. Evidence is in `artifacts/capture-lifecycle/e119609f-a177-4e8d-8369-7e31bfb0077a/proof.json`. Failed cases published no image. Four additional path-collision checks preserved existing evidence and released all resources; their proof is `artifacts/capture-lifecycle/a9b3ad5d-4925-40cf-a0b6-c29516553627/proof.json`.

The first native ownership check produced a 256-square woods image. Six owned Unity objects survived at least two game frames with the camera and light disabled. The render suppressed one real mesh renderer and restored its enabled state in the same frame. A separate read-only native scan found zero owned objects after cleanup. Evidence is in `artifacts/capture-lifecycle/11768413-8c90-4be3-acda-6a6b62d0db9d/success/proof.json`.

Integrated capture `46d7153a-9c3d-45d4-9d4b-99fc82a52549` reused the same resources for two 1024-square images in native frames 1,503,254 and 1,503,255. It retained 15 artifacts totaling 4,592,237 bytes. Camera center and opposite world corners projected to `(0.5,0.5)`, `(0,0)`, and `(1,1)`. The images are recognizable woods captures, not validated production tiles. The artifact replay verified all file hashes and byte counts, exact frame restoration, and clean ownership receipts. Its result is `artifacts/capture-lifecycle/e119609f-a177-4e8d-8369-7e31bfb0077a/integration-proof.json`.

Capture drivers are archived under `artifacts/capture-lifecycle/drivers/`. TypeScript, all ten existing regression tests, and strict OpenSpec validation passed. Task 4.1 is complete. The geometry readiness evidence follows below.

## Tile-local geometry readiness

`tools/capture-readiness.ts` holds selected sources through rendering and restoration. The readiness profile bounds the whole tile to 1–300 seconds and requires 2–10 stable observations. It permits at most 256 source holds. Traversal retains its separate 32-loader selection limit.

The native geometry probe expands the complete camera frustum by the configured XZ overlap. It calls `AddressableLoader.Covers` at the closest frustum point to each loader. This tests the native loading sphere against the full frustum without loading everything inside the larger enclosing sphere. Already observed intersecting geometry also selects its source. Inactive-source exclusions remain in the inventory.

A 3,789-query native check matched `Covers` to three-dimensional distance, not XZ distance alone. Its result is `artifacts/25144591/89ddd2d9-a081-4386-a02b-f66ba2ac6cc4/result.json`. The broad enclosing sphere selected 133 active sources near the research character. The exact frustum selected 96. The broad 30-second check did not settle, but native cleanup restored every hold and retained no new roots.

Readiness requires initialized scene state, settled native handles, active loaded roots, and stable geometry bindings across distinct observed frames. Source membership uses the actual loaded-root transform, including assets not parented under their loader. Numbered inventories retain scene query counts, meshes, terrain, other renderers, and source state. Companion context files retain character and scene boundaries. The readiness receipt identifies the final inventory hash and the stable frame IDs.

Mesh-less renderer components retain null bindings rather than receiving an invented pending-load state. The native investigation found eleven such zero-size components under character models. Their evidence is `artifacts/25144591/26293faa-76b1-4b74-9637-95f7a495d7fb/result.json`. No claim is made about their authored intent. Relevant null-mesh rows prevent an empty classification. Missing materials on present meshes, missing terrain data, and source-integrity issues remain blockers.

The existing stream visitor registers native cleanup before changing holds or requesting loads. Cleanup restores original holds, preserves originally loaded roots, and releases newly owned roots. It writes `compendium.stream-cleanup.v1` only after restoration settles. Capture and traversal verify that receipt. Socket loss does not require a later host restore request.

Native hold verification selected 96 sources, including 19 initially unloaded sources that reported loading at startup. Normal completion, cancellation before readiness, and disconnection before readiness all restored holds and left zero owned roots. Both interrupted cases produced cleanup receipts before the host callback unwound. Evidence is `artifacts/geometry-holds/ac035e5f-0cd9-40b1-875c-04f4dee94f26/proof.json`.

Integrated scope checks distinguished empty geometry from failed operations. Run `9844f3b7-1555-43b9-9e65-21f7a2e74638` verified empty geometry with no required sources. Run `ea798926-1441-459f-97bf-6f2bcc18889f` reached that same readiness state but failed when its callback exceeded the deadline. Its manifest retained `CaptureTileDeadlineError`. Runs `1deaf76a-0ade-4c6e-905d-aac29cd9a221` and `6999c530-4b39-4a95-a096-2733a639770a` verified cancellation and disconnection while 96 ready sources remained held. Every owner reported clean cleanup.

Far-tile run `f0af2207-fee3-477e-8d6d-6d0edc6a61d9` held 116 sources, including 52 initially unloaded sources. The final inventory contained 521 present meshes, two null-mesh rows, one terrain, and no readiness issues. Newly loaded sources supplied 75 visible mesh renderers. The 1024-square PNG contains recognizable woodland, a road, and rock formations. Its 1,832,409 bytes hash to `3ced29d608c6b866abc250c95b0f85378094157df512612aa278d70c7532689b`. Shorter 60-second and 110-second attempts failed while sources remained loading. Neither timeout became an empty tile.

The final archived verification is `artifacts/capture-readiness/cdb1f3be-a616-44fd-bb75-977c1eb4c2d8/proof.json`. It preserves 70 source and input files with byte-checked copies. Native hold checks, all four integrated scope cases, and two real captures passed. Capture run `714555f2-8e0d-45b0-bb10-8102559148ce` retained 119 verified artifacts totaling 19,034,085 bytes. Each tile held 96 sources and recorded three stable frame IDs before rendering.

Traversal run `520e4444-6b20-48b3-8fa1-3c84f994100c` also passed with the required native cleanup receipt. It selected three streams and retained one inactive exclusion. Source restoration, scene restoration, and owner cleanup completed before success. Its coverage result remains incomplete.

Source archives store test files with a non-executable suffix so Bun does not run duplicate archived tests. `archive-layout.json` records those paths. TypeScript, the ten repository tests, and strict OpenSpec validation passed. These checks establish tile-local readiness and restoration, not full-world imagery coverage or production visual quality. Task 4.2 is complete. Capture verification drivers are archived under `artifacts/capture-readiness/drivers/`.

## Orthographic raster registration

Each PNG now has a hashed `compendium.capture-raster.v2` artifact linked by its image hash. The native capture reports actual camera properties. Five native projection controls cover the center and all four corners inside the clipping interval. The host rejects missing controls or residuals above one quarter pixel.

The raster frame maps top-left pixel edges into source-scene XZ coordinates. Pixel centers use `(column + 0.5, row + 0.5)`. Image X increases world X; image Y decreases world Z. The reviewed map-space transform remains a separate step. A native 2-by-2 color texture and browser pixel decode verified the PNG origin. Evidence is `artifacts/capture-orientation/39e53cac-5871-4e83-8875-6f142d2506a6/proof.json`. Browser screenshot calls timed out; the proof records pixel decoding, not a browser screenshot.

Six native images cover adjacent Coalway rectangles at 256-square and 512-square resolutions. Each square covers 100 by 100 world units. A double-width reference covers their union at the same pixel density. The shared edge is exactly world X 562. Native projection residuals were at most 0.000512 pixels.

Three observed mesh bounds supplied landmark controls: `SM_hc_House`, `House_2x2_02`, and `SM_WarriorStatue_LOD0`. Their image positions round-trip to the recorded world coordinates. Patch matching against each reference image preferred zero displacement for all six landmark checks. Every one-pixel alternative had greater error. Direct image inspection confirmed the buildings, statue, paths, and continuous shared boundary.

The 15-column seam strip had median maximum-channel differences of 2 and 1 out of 255, respectively. At 256 and 512 pixels, 93.70% and 92.30% of seam pixels differed by at most 8. The images are not pixel-identical. The controlled-lighting verification below is separate from this seam sample. The 512-square captures provide 5.12 pixels per world unit for the representative outdoor preview; complete-build profile review remains open.

Evidence and replay drivers are in `artifacts/capture-seams/8e5577d8-8a8c-4688-a61f-25c685fd2548/`. `comparison.json` records landmark and seam measurements. `provenance.json` verifies 472 artifacts and archives 20 exercised source files. All four native owners reported clean cleanup. Task 4.3 is complete; this sample does not establish full-world imagery coverage.

## Controlled illumination and transient suppression

Capture disables active game lights and uses its owned directional light with flat ambient illumination. It controls ambient colors and intensity, fog, the active sun, and sky-reflection intensity. The private camera does not copy gameplay camera post-processing. Native and host checks reject uncontrolled lighting or incomplete suppression.

Capture never assigns `RenderSettings.ambientProbe`. Flat and Trilight getters expose derived coefficients, but the setter changes a separate Custom-mode cache. A native sentinel check reproduced that defect with the pinned pre-fix capture and passed with the current capture. Both fixture runs restored the original visible coefficients and hidden cache. Eight native color-conversion samples, including HDR inputs, agreed with the host calculation within 0.000001.

The shared `tools/probes/capture-visuals.csx` prelude selects player bodies, mounts, owned actors, combat visuals, weather roots, camera particles, ground indicators, and non-looping particle roots. Particle-only selection preserves other actors' mesh renderers. Capture suppresses selected projectors and excludes highlight effects through their camera masks. It does not disable gameplay roots. Seven retained particle renderers identify furnace, cooking, property-sign, heroic-console, and bed landmarks in the woods sample.

Readiness and rendering resolve the same transient policy and reviewed ceiling selectors. Geometry inventories retain exclusion IDs and reasons without treating those renderers as pending geometry. In the final production run, exclusions changed from 46 to 57 across the three accepted stable observations. The inventories retained 652 mesh rows and seven other renderers. Capture hashes the shared prelude. Session, restoration, and geometry observations use their v3 contracts.

Native contrast fixtures changed ambient colors, intensity, reflection intensity, and all active-hierarchy game lights. The bright fixture used light intensity 8 and RGB `(4,3,2)`. The dark fixture used intensity 0.002 and RGB `(0.005,0.01,0.02)`. They did not advance the game clock. Capture suppressed all 75 and 77 active light inputs, respectively, including directional, point, and spot lights.

Both captures suppressed all 19 active player renderers. A temporary child projector used the game's real projector material and verified projector suppression. A native highlight component verified camera-mask exclusion while its cube mesh remained visible. The seven landmark particle flags remained unchanged. Fixture cleanup restored light settings, projector counts, highlight registration, and visible and Custom-mode ambient coefficients in the same native frame.

The 512-by-256 images cover the same 200-by-100-unit area. Direct inspection retained recognizable buildings, statue, roads, and landmark cues. All three 25-by-25 landmark patches were pixel-identical between the bright and dark captures. Every one-pixel displacement had greater error. Across the complete images, the median maximum-channel difference was 0, and 97.30% of pixels differed by at most 8. The maximum was 102, so this is not a pixel-identical terrain claim.

Rendering, injected render failure, cancellation, and socket disconnection passed their native restoration checks. All five final owners, including the pre-fix regression and normal production command, reported clean cleanup. Failed render and interruption cases published no PNG. Production run `ad212d92-ce6d-4d3c-a993-ff6c882ebefe` held 92 sources and produced a 233,727-byte PNG without fixture objects. Its hash is `dd25b10d908192ee913d91cb008c8aef24852ccfada84435b5e7129bec35e225`.

Evidence is in `artifacts/capture-visuals/3718336a-7ba5-4f5e-bc83-aa92641098bb/`. `comparison.json` records image metrics. `provenance.json` verifies 124 registered artifacts and archives 28 exercised source inputs. Native fixture drivers remain with those inputs because the regression requires Afallon. Browser screenshot capture timed out; image inspection and canvas pixel decoding succeeded. Task 4.4 is complete. Interior visibility and full-world capture coverage remain open.

Reproduce the normal capture while Coalway woods and the research character are loaded:

```sh
nix develop --command bun run compendium capture --config local/spatial-smoke-config.json --plan artifacts/25144591/1e94baf6-9b0e-4ca6-bc48-9c4c4c687d01/plan.json
```

## Reviewed interior floor capture

Interior plans use explicit clipping intervals. Every tile in a floor plan must use the same interval. Raster `verticalBounds` records that interval separately from floor membership. Neighboring intervals can overlap to retain headroom and connecting geometry.

Ceiling reviews use complete hierarchy, mesh name, vertex count, and world bounds. The host verifies and archives the referenced evidence bytes. Native resolution rejects missing or ambiguous matches and records the resolved renderer IDs. Protected floor renderers must remain enabled during rendering and restoration. Capture changes renderer flags, not shared mesh data or gameplay roots.

The name-only ceiling survey failed because two colliders shared `Rock1_2 (104)`. Its evidence is `artifacts/interior-slices/ba733d39-4982-4174-9673-4961e91ff3e6/`. The reviewed survey resolved two ceiling renderers and 35 protected floor renderers. Its evidence is `artifacts/interior-slices/2c3fa85c-414f-4e2f-8f27-334739504fa3/`. Reloaded captures resolved different runtime IDs from the same selectors.

The native CharacterController remained grounded below and on `Wood_Bridge1 (2)` at the same XZ coordinates. Small horizontal movements retained ground contact at both elevations. The reviewed profile assigns the lower point to `lower` and the bridge point to `upper`. The half-open boundary at Y −807 belongs to `upper`. Evidence is `artifacts/interior-slices/2e02be30-a0bf-4b12-8cbe-3189de180cb9/`. These occupancy controls do not prove natural route access.

Upper capture `90e1c007-0d87-4c4f-9d81-4802dbc32c2f` and lower capture `8ab03e79-f2f6-4567-a911-bc3fb6a3f857` produced registered 640-by-840 images. Both cover X 1490–1810 and Z −1110–−690 at two pixels per world unit. Their clipping intervals are Y −810–−785.1 and Y −845–−805.1, respectively. Direct image inspection shows separate raised and lower geometry. Both captures retained all 35 protected floor renderer flags, restored visual state in the render frame, and left no owned capture objects. Both restored the original scene, position, and rotation with clean runtime receipts.

The first upper capture exposed a readiness defect. Animated NPC meshes and particle bounds crossed a clipping plane, so their inventory rows appeared and disappeared without binding changes. Run `8c15a185-bbea-4745-ae98-b6acf1d01ee9` exceeded its unchanged 300-second tile deadline and restored ownership cleanly. Later observations now continue inspecting previously observed active bindings outside the frustum. Intersection changes do not determine binding stability; source state, geometry bindings, and integrity checks still do. The identical plan succeeded with three stable observations, including a mesh that moved outside the frustum without changing its mesh or materials.

The upper evidence archive verifies 45 artifacts and retains 21 exercised source files. The lower archive verifies 43 artifacts against the same capture sources. `artifacts/interior-slices/90e1c007-0d87-4c4f-9d81-4802dbc32c2f/floor-pair.json` links both raster frames and the occupancy controls. TypeScript and all ten existing regression tests passed. These checks establish reviewed slices and restoration, not a complete dungeon route or complete imagery. Tasks 3.9 and 4.5 remain open until the remaining floor and route review passes.

Arrival-room run `1b5add2d-f260-4263-b1c7-b7f16153452d` produced a PNG but exceeded the 300-second source-scene restoration deadline. Its last poll still reported an unready dungeon scene and no player transform. Native cleanup subsequently reported clean state with no callbacks remaining. The manifest remains failed; this image does not establish accepted arrival-room coverage.

Reproduce the registered floor captures:

```sh
nix develop --command bun run compendium capture --config local/spatial-smoke-config.json --plan artifacts/25144591/90e1c007-0d87-4c4f-9d81-4802dbc32c2f/plan.json
nix develop --command bun run compendium capture --config local/spatial-smoke-config.json --plan artifacts/25144591/8ab03e79-f2f6-4567-a911-bc3fb6a3f857/plan.json
```

## Resumable primary captures

Capture writes a hashed tile checkpoint only after rendering, raster validation, visual restoration, and stream cleanup pass. Compatibility includes build and profile hashes, capture implementation hashes, character, scene, floor, dimensions, lighting, readiness, frame, and ceiling review. Adding unrelated tiles does not invalidate an unchanged tile.

Reuse verifies registered artifact bytes and decodes those same verified JSON bytes. It repeats the production camera, raster, image, and visual-restoration checks. Copied tiles retain their original native run, owner, and capture key. Returned image paths refer to the new run. An all-reused capture skips inventory, scene transitions, streaming, and capture-resource allocation.

Interrupted-run tiles require matching clean capture and runtime receipts. A missing or pending receipt blocks reuse. If the host failed before registration, the next run verifies the native receipt and copies it into its own registered evidence. A tile checkpoint is not a successful capture set. `capture-set.json` binds every expected tile before atomic successful-run selection. It still reports incomplete world imagery.

The native acceptance driver completed six runs in `artifacts/capture-resume/6b2e2955-9b2e-49d5-9653-ea562e95d6d0/`. Two repeated baseline captures made zero inventory or capture probes and retained the original native provenance. Changed build or profile hashes produced zero cache candidates; an expanded plan retained its unchanged tile.

An injected failure before the second render preserved the previous successful pointer and the first tile checkpoint. Native cleanup finished with no errors or callbacks. Resumption reused `interrupt-a` and captured only adjacent tile `interrupt-b`. A later run reused both tiles from their different native origins without native capture probes. In isolated copies, image corruption rejected only the affected tile. Missing and pending cleanup receipts rejected the interrupted tile; the matching clean receipt permitted it.

`proof.json` records these checks. `provenance.json` verifies 255 artifacts and archives 23 exercised source files. TypeScript and all 17 repository tests passed, with 55 assertions. Task 4.7 is complete; these representative captures do not establish full-world coverage.

Reproduce the compatible capture through the operator command:

```sh
nix develop --command bun run compendium capture --config artifacts/capture-resume/6b2e2955-9b2e-49d5-9653-ea562e95d6d0/config.json --plan artifacts/capture-resume/6b2e2955-9b2e-49d5-9653-ea562e95d6d0/runs/25144591/b935da6e-0166-402f-ba00-e3b6a8845dcb/plan.json
```

## Optional illustration preparation

The offline `illustration` command preserves artwork in a separate `compendium.illustration.v1` artifact. It records the original image hash, dimensions, reviewed map space, and evidence references. It does not connect to the game. Illustration output always sets `primaryImagery` and `completeImagery` to `false`; it cannot replace capture tiles.

Preparation snapshots input bytes, decodes the image, checks evidence hashes and JSON pointers, and verifies the reviewed map-space profile. Calibrated artwork requires four distinct pixel controls, including a control outside the three-point affine fit. Both declared and independently fitted transforms must satisfy the quarter-pixel residual limit. Orientation-only output has no marker transform.

Run `c2b219c5-f1ad-4003-9bab-3f0910900ea7` imported the real 7540-by-8192 overworld artwork without changing its 76,574,413 bytes. Its image hash is `070ab5cd19d6955565c1d9cda23e5dc0741f727869f29e7bc1e9bec44d0e8b19`. The layer remains orientation-only because native map metadata does not establish image registration. This check covers asset preparation, not browser layer switching. Task 4.6 remains open.

A synthetic rotated calibration exposed transposed affine coefficients during integration. Regression checks now cover rotated coordinates, independent controls, absent evidence pointers, AVIF delivery, and truncated images with matching hashes. Failed preparation preserves the prior successful output. TypeScript and all 15 repository tests passed, with 52 assertions.

Reproduce the offline import:

```sh
nix develop --command bun run compendium illustration --config local/spatial-smoke-config.json --plan local/illustration-overworld-plan.json
```

## Offline normalization and publication

The offline `normalize`, `tiles`, and `publication` commands accept `--plan` and `--output`. They do not connect to the game. Source-run inputs must match successful same-build manifests and registered artifact hashes. Plan reference paths resolve relative to their plan. Verified readers retain the bytes they checked and reject unregistered files or paths outside the run directory.

Normalized run `c4bf5d6c-4648-4d73-9b0d-23dbbbb3e0b2` contains 1,959 entities, 2,611 placements, 2,886 source identities, 3,523 role facts, and 1,001 conditions. SQLite retains 47 authored merchant tables, 157 valid merchant bindings, 208 authored loot tables, and 14,390 item-source rows. Nine unset merchant bindings do not create table identities. Table definitions remain separate from owner bindings. Global RPGResource and resource-rank arrays are empty in this build. Concrete producers supply 10,917 resource-yield rows.

Normalization retains merchant and loot requirements, quantities, selection limits, level eligibility, linked-NPC rules, quest context, and authored world-source configuration. Raw rates do not become effective probabilities. Training Dummy `npcs:0` has three distinct published placements, each with combatant, enemy, and NPC roles. The publication contains 34 unique placement IDs.

Repeat run `5b013b54-bcba-4322-9da7-de3907f4f1fc` produces the same database bytes. Both database hashes are `85d227d3225b80beb8187d75a2ded8df39e90728175323e95876685df206b6eb`. Integrated database checks reject dangling stock references and duplicate table identities. The permanent regression check rejects unset table identities without committing earlier rows from the failed transaction.

Tile run `1fed504e-929d-435e-aca1-7604c0ee08a7` contains seven WebP files totaling 433,120 bytes. Its pixel proof verifies 344,064 decoded pixels, exact finest-level source pixels, coarse box averages, and shared edges. Sparse run `629422e8-b126-41a1-a0d9-2ccc5e19b5c3` retains empty, missing, and partial positions instead of filling gaps with artwork. Repeat run `579da829-bea4-4b0a-8bbb-059daaaab3a2` produces the same tile-index hash, `6b84061ed30bce130c8c6b2308ee7645cb1fb819f4eb041f6a7d87b1dbc74ed6`. Tile preparation records the repository revision separately from the implementation fingerprint.

Publication run `3ed3183f-c217-4fa9-ae31-93c448424a75` contains 34 mapped placements, 1,959 entities, and eight content-addressed images. Images total 60,123,268 bytes, including 59,690,148 bytes of optional artwork. Metadata is 33,450,974 bytes. Gzip encoding produces 974,368 bytes. This measurement does not imply that the development server sends compressed responses.

The public metadata hash is `ed4a3e1f27e90069de871afd16886e35f83c7a448ae672e2112624c1185cce12`. It matches the input checked in `artifacts/publication-smoke/7722bb79-gates.json`. Nine rejection checks cover references, floors, spatial bounds, tile registration, duplicate placements, preview disclosure, release coverage, manifest integrity, and build agreement. Rejection does not change the valid public artifact.

The preview excludes 1,762 classified placements outside verified imagery. Another 815 source identities have no classified marker role. Its 3,725 source-coverage issues remain visible as an incomplete-coverage disclosure. Current normalization accepts bounded observations only. Full-world reconciliation and complete-release certification remain open.

Before each downstream command, pin its successful input manifests and SHA-256 digests in the local plan:

```sh
nix develop --command bun run compendium normalize --plan local/normalize-plan.json --output artifacts
nix develop --command bun run compendium tiles --plan local/tiles-plan.json --output artifacts
nix develop --command bun run compendium publication --plan local/publication-plan.json --output artifacts
```

Normalization reads `raw/placement-snapshot.json` from extraction runs and each step's `after.json` from traversal runs. Mixed normalization `8774a6b0-9a0e-457b-9d36-1f4a3865883f` combines the Coalway extraction with Duskfall traversal `d87f275a-341b-485e-ab56-322e3aa09ece`. It contains 2,713 placements: 2,611 in Coalway, 70 on the reviewed upper floor, 26 on the lower floor, one in the arrival room, and five outside the reviewed profile. The same plan failed before the traversal snapshot-path correction. Run it with `nix develop --command bun run compendium normalize --output artifacts --plan local/normalize-interior-plan.json`.

NPC merchant and quest navigation follows the native `isMerchant` and `isQuestGiver` flags, as role classification does. Authored bindings remain in SQLite even when the service is disabled. Normalization `e5103433-2a56-4758-b30d-f9c4128cf6e0` removes 549 disabled-merchant item sources and 46 disabled-quest location references from navigation. It retains 657 merchant item sources across 39 enabled merchants and 119 quest location references. In the browser, Lost druid Talroth retains three quest associations but no longer appears to sell seven items from an inactive default table. Evidence is in `artifacts/publication-smoke/service-eligibility.json`.

Requirement references follow the outer native `RequirementType`, rather than every serialized ID field. NPC and world validators share these rules. ID zero remains meaningful when its field applies. Unknown requirement types retain all candidate checks. Revalidation of extraction `c3f45239-a466-4109-a720-4b2d40836753` removes 1,028 false missing references while retaining the authored payload. Smoke checks exercise inactive fields, active zero IDs, and unknown types in both validators.

Native extraction `65aba4b1-ba85-4ea3-91ae-1d37f370341c` also reports zero unresolved typed references, but its world coverage remains incomplete. Extraction and traversal provenance include the shared applicability module. Evidence is in `artifacts/publication-smoke/requirement-validation.json`. Nested Item/Effect selectors and object-backed references still need behavioral verification. This correction does not establish complete condition semantics.

TypeScript and all 19 pipeline/tool regression tests pass, with 63 assertions. These commands and measurements cover bounded local stages, not a complete supported-build release.

## Static atlas preview

The static SvelteKit client reads only the generated publication. It uses deck.gl orthographic imagery, placement markers, and area layers. The source repository excludes linked publication data and build output. The initial Coalway-only build used publication `3ed3183f-c217-4fa9-ae31-93c448424a75`.

Browser checks cover screenshot picking, hover previews, role filters, and persistent details. Merchant filtering returns eight placements. Adding Friendly returns 18 placements, not 26, because overlapping roles do not duplicate results. Selected locations remain visible when filters exclude them. Counts still describe only matching placements. Selected markers stay at their coordinates outside clusters and remain pickable when another placement overlaps them.

Minor health potion leads to Cooking supplies and Traveling alchemist while retaining item context. Searchable details expose vendor stock, Branchweaver loot, and authored gathering conditions. The reviewed resource producer references Herbalism despite its native OreSpawner component name. Skrivik Sharpfang links to Blades and Barter: The Delivery. Exact quest search opens the canonical quest and discloses missing mapped placements.

At 390 by 844 pixels, the source journey keeps a 199-pixel map region visible above the details panel. The document has no horizontal or vertical overflow. The full item-to-source journey works with the keyboard. Escape closes details and restores the surviving result button or the main search input. URL reload and browser history retain source search and selection. Invalid selection links show an explicit warning.

A lifecycle smoke mounted and unmounted the real component in Chrome. Before unmount, it held 33 WebGL buffers, three textures, and two ImageBitmaps. After unmount, all tracked resources were released and its canvas was removed. A separate smoke unmounted the component during a real metadata download. The request completed before the cancellation fix and rejected with AbortError after the fix.

The cold preview response used 805,974 encoded body bytes for 33,450,974 decoded metadata bytes. That viewport requested three screenshot tiles totaling 245,250 bytes. It did not request optional artwork. One development-browser run opened Rough Stone's 1,144-source panel in 631 milliseconds. The document then had 74,699 elements and 20,644 detail rows. This is not a mobile-device benchmark.

The client check passes across 1,426 files with no errors or warnings. The static build succeeds. Its largest JavaScript chunk is 823.91 kB raw and 227.26 kB gzip. Vite still reports its 500 kB chunk warning. Cross-map transition destinations and full-build performance remain unverified. The publisher does not yet generate the optional destination navigation field. Authored teleport actions appear in source details, but task 6.3 still requires destination normalization and publication before its browser check.

The representative outdoor-and-interior pipeline now passes task 6.5. Duskfall reloads retained all 104 source/placement identity pairs while all 104 runtime component IDs changed. Both identity artifacts match their registered hashes. The second traversal failed during restoration, then confirmed clean native cleanup; its extraction is not a publication input. The new 100-second repeat expired during extraction and also cleaned up. A proposed 300-second plan was rejected by the existing 110-second schema ceiling and was removed.

New upper and lower captures `86023729-a1d4-4ef9-ac83-bc0c4cda4397` and `06d2f65c-2a95-45c4-8bf5-7a274b5c72b7` rendered and restored capture resources but exceeded the source-scene restoration deadline. Both later confirmed clean native ownership with zero callbacks. Successful resumes `3faa8421-1998-4aee-bf4d-fe24128fabcc` and `0424df32-0d49-4ea3-be0a-ae88150954a5` reused the verified checkpoints without recapture. Their tile pyramids contain 17 WebPs per floor, using 409,066 and 854,034 bytes. All 1,075,200 finest-level pixels match the source PNGs, and all 34 shared tile edges agree.

Publication `2061cb5b-55a0-4ee9-8d2d-76d6bff55b9a` contains 51 placements across Coalway and the two reviewed Duskfall floors. Its 42 image files total 61,386,368 bytes, including optional artwork. Built metadata matches SHA-256 `27968bbdd06ceca4260e8880b58e488f0bf7e1be2ef986d168b538c5fc5bd503`. Coverage remains incomplete: 1,765 classified placements are excluded, 897 identities have no classified role, and 4,200 source issues remain. Bulk collection still needs successful bounded visits across the remaining scene catalog.

Scene and traversal control probes now pause 500 milliseconds between requests. A controlled 100-millisecond run expired during Coalway activation; the 500-millisecond run restored both scenes within the same 100-second per-phase deadlines. Restoration advanced 42 frames between the first and last responses in the failed run, versus 171 frames in the successful run. Both runs reported no readiness holds, allowed scene activation, and time scale 1. The successful run reached Coalway's 81-source streaming stage before restoration completed. Scene reports now retain loader progress, initialization state, and frame timing to distinguish these delays from blocked readiness holds.

Full upper-floor capture `fff9067c-4bf7-4472-b139-5ed6b037b062` then completed in 264.20 seconds without changing its deadlines. It restored the original scene, position, and rotation, and confirmed clean native ownership with zero callbacks. Evidence is in `artifacts/restoration-diagnostic/polling-comparison.json`. These checks do not establish that every remaining scene can finish within the existing deadlines.

Browser picking opens Lost druid Talroth on the raised level and Aquarius on the lower level. Heart of corruption leads from Aquarius to Grovekeeper while retaining item context across floors; browser back returns to the lower floor. The built mobile view retains a 198-pixel map region with no document overflow at 390 by 844 pixels. Floor switching originally reused the upper image because both Deck TileLayers had the same ID. Namespaced layer IDs now discard stale tile state; the built switch requests 12 lower-floor tiles and displays the lower geometry. Evidence is in `artifacts/publication-smoke/interior-pipeline.json`.

On a fresh checkout with the verified publication available, run:

```sh
nix develop --command bun install --frozen-lockfile
mkdir -p site/static
ln -s ../../artifacts/25144591/2061cb5b-55a0-4ee9-8d2d-76d6bff55b9a/public site/static/data
nix develop --command bun run --filter @afallon-compendium/site check
nix develop --command bun run --filter @afallon-compendium/site build
nix develop --command bun run --filter @afallon-compendium/site preview --port 4174
```

Stop the preview before each rebuild. Start a new preview process after the build. An existing preview process can return 404 for new hashed assets. These commands do not deploy or upload the artifact.

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

A canceled evaluation now preserves its originating error instead of replacing it with socket closure. Reproduction `a1cc3155-cc92-4f11-9ce9-94005f3a23c1` recorded `HotRepl WebSocket connection closed` in the manifest while the outer operation retained the tile deadline. With the corrected error propagation, `66d21e2e-930b-488c-81f6-8d3345cb9f4a` retained the same deadline error in the request, outer operation, and manifest. Native-error control `4c1e1907-c856-467e-828d-1f355a78baf0` retained its original native exception and details. All three owners reported clean cleanup. The live regression driver is `artifacts/runtime-errors/verify-cancel-cause.ts`.

The VM connection has an intermittent setup delay. A raw handshake took 8.5 seconds; two owned attempts exceeded the existing 10-second connection deadline before claiming ownership. The six lifecycle checks passed with that existing configuration. The in-flight follow-up and integrated extraction used an isolated 30-second smoke configuration, without changing `local/config.json`. SDK 4.0.1 also leaves its opening promise pending when the socket closes before a handshake; the host deadline and CLI termination bound that wait. No SDK or HotRepl server code was changed.

## Existing-project defect recorded during comparison

`ancient-kingdoms-mods/mods/MapScreenshotter/MapScreenshotter.cs:173-205` disables the player and changes global lighting before checking ZoneInfo. Its null-data error branches exit without local restoration. The capture also uses hardcoded bounds at lines 239–242. These are reasons not to copy that setup into Afallon. No Ancient Kingdoms files were changed.
