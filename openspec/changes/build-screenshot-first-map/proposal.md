## Why

Players need a comprehensive Afallon map that shows recognizable in-game terrain and connects places to useful game facts. Existing research proves data access, but a complete map needs repeatable capture, coverage accounting, and relationships beyond isolated markers.

## What Changes

- Produce the primary basemap from this project's own orthographic in-game captures of the supported build, for reachable world surface areas and zones. Preserve illustrated maps as separate optional, independently calibrated orientation layers. Existing map images must not replace primary captures or fill missing tiles.
- Create reusable local commands for runtime inspection, capture, extraction, normalization, and publication. Preserve raw evidence and build identity outside Git.
- Inventory all supported-build scenes and spatial content families. Account for inactive, streamed, conditional, and procedurally produced content instead of treating loaded objects as complete coverage.
- Extract Afallon-specific enemies, bosses, friendly NPCs and services, resources, containers, interactions, quest locations, and transitions where source evidence supports them.
- Separate canonical entities, authored placement rules, and live observations. Preserve requirements and placement uncertainty.
- Resolve enemy drops, vendor stock and prices, resource yields, quest associations, and transition destinations. Keep unverified probability and availability semantics explicit.
- Publish a static map with search, meaningful filters, shareable selections, and accessible detail panels. Support item-to-source navigation without overwhelming marker popups.
- Retain a small relational model and generated site contracts that support later compendium pages. Do not introduce a general-purpose game framework.

## Capabilities

### New Capabilities

- `world-extraction`: Reproducible build-scoped snapshots, spatial identities, relationship extraction, and explicit coverage accounting.
- `screenshot-basemaps`: Restorable in-game capture, map-space calibration, image tiles, and optional illustrated layers.
- `interactive-atlas`: One static world map, game-vocabulary categories, level filtering, linked details, search, and one-place coverage disclosure.
- `adventure-guide`: Dungeon, boss, region, and property pages mirroring the game's own Adventure Guide.

### Modified Capabilities

None. This repository has no existing application capabilities.

## Impact

The repository uses a local game-tooling boundary, a normalization pipeline, and a static SvelteKit site with a deck.gl map. SQLite stores normalized relationships. Runtime tooling uses the installed MelonLoader/HotRepl setup and Afallon-generated IL2CPP interop assemblies.

Full coverage is the delivery target. Authored world probes, coverage states, repeat-load identities, and a world surface-to-zone end-to-end path are implemented and measured. The path includes capture, normalization, and browser navigation through generated static artifacts. Full-world extraction and imagery remain incomplete, so the representative milestone does not authorize a tutorial-only release.

Reachability, runtime availability, data extraction, and imagery status remain separate evidence dimensions. Unresolved relevant sources block a complete release. Runtime operations have one owner, with multi-frame loading separated from frame-local rendering and restoration. The user reports that the developer welcomes a wiki or similar project and directed us not to pursue a separate asset-permission check. Asset preparation is not blocked on that check. Measured output sizes are recorded; artifact-storage selection remains open.

The GitHub repository is private. Game binaries, recovered code, raw snapshots, saves, and image artifacts remain outside source control. The user has removed the separate asset-permission checkpoint. This proposal does not authorize deployment or pushing commits.
