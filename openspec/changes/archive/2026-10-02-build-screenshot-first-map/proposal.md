## Why

Players need an Afallon map with recognizable game-provided imagery and a separate searchable compendium for game facts. Repeated game updates require build-scoped scan, catalog, publication, and coverage records. Captured overworld terrain can add detail, but it is not the default image.

## What Changes

- Publish calibrated game-provided maps as the default imagery for the overworld and interiors. Keep this project's orthographic overworld captures as an optional reader-enabled layer. Missing captures remain explicit coverage gaps and never replace verified game imagery.
- Create reusable local commands for runtime scan, capture, canonical catalog assembly, and publication. Preserve raw evidence and build identity outside Git.
- Inventory discovered supported-build scenes and spatial content families. Keep inactive, streamed, conditional, and generated content in the coverage record without claiming complete coverage from loaded objects.
- Extract Afallon-specific enemies, bosses, friendly NPCs and services, resources, containers, interactions, quest locations, and transitions where source evidence supports them.
- Separate canonical entities, authored placement rules, and live observations. Preserve requirements and placement uncertainty.
- Resolve enemy drops, vendor stock and prices, resource yields, quest associations, and transition destinations. Keep unverified probability and availability semantics explicit.
- Publish a static map with search, category filters, shareable selections, and an accessible result list. Development details help inspect published facts. Production keeps the map full width and the compendium pages separately browsable.
- Retain a small relational model and generated site contracts that support later compendium pages. Do not introduce a general-purpose game framework.

## Capabilities

### New Capability

- `world-extraction`: Build-scoped snapshots, spatial identities, relationships, and explicit incomplete-coverage accounting.

### Modified Capabilities

- `screenshot-basemaps`: Restorable optional overworld capture and calibrated game-provided maps as the default imagery.
- `interactive-map`: One static world map with game-vocabulary categories, search, shareable selections, and metadata-based coverage records.

There is no separate Adventure Guide surface.

## Impact

The repository uses a local game-tooling boundary, a normalization pipeline, and a static SvelteKit site with a deck.gl map. SQLite stores normalized relationships. Runtime tooling uses the installed MelonLoader/HotRepl setup and Afallon-generated IL2CPP interop assemblies.

The accepted Steam build is 25653798 (0.16.3). Its 21 published maps and 4,000 placements use the game's drawn maps as their default imagery, with captured overworld terrain as an optional layer. The accepted artifact is a validated preview with `coverageComplete: false`. Source inventory and captured-terrain coverage do not meet complete-release criteria. Missing production map details, destination navigation, level filtering, placement height in the public contract, full-world performance, and repeat-capture proof are recorded in `EXPLORATION.md`.

Reachability, runtime availability, data extraction, and imagery status remain separate evidence dimensions. Only a complete artifact may use release mode. Runtime operations have one owner, with multi-frame loading separated from frame-local rendering and restoration. Cloudflare Workers Static Assets is the files-only production host.

The GitHub repository is private. Game binaries, recovered code, raw snapshots, saves, and image artifacts remain outside source control. The user has removed the separate asset-permission checkpoint and later authorized production deployment to `afallon.compendiums.org`, including the validated incomplete preview. This proposal does not authorize pushing commits.
