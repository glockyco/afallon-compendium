## Why

Steam installed Afallon 0.16.2.1 as build 25434619. `GameAssembly.dll` and `global-metadata.dat` changed, and the release notes name teleport loading, quest hand-ins, gear placement, and interface changes. The published compendium still uses build 25419293 evidence, so it cannot show the installed game, and the quest level ranges that the `quest-levels` collector reads exist only for the installed build.

The update report contract names the 0.16.2 risk areas as a fixed list. A later release has other risk areas, so the report cannot record the 0.16.2.1 review without a false disposition for areas that the release does not touch.

A scene visit entered its target scene with `LoadGameScene`. A later native entry lands where the character last left the scene, so the arrival depended on the research character's save history. Stale saved positions put the player outside several scenes. Build 25434619 cancels an entry whose destination does not finish loading, so the scan of scene 15 returned to its source scene and failed.

## What Changes

- Record the Steam update receipt, recover the 0.16.2.1 declarations, and compare them with the 0.16.2 declarations.
- Run a complete candidate scan of build 25434619, including the `quest-levels` collector.
- Enter each scanned or captured scene through `RPGBuilderEssentials.TeleportToGameScene` at an authored arrival: the destination of the lowest-ID `gameScene` teleport effect into the scene, or else the scene's authored start position. Scan and capture share one scene-visit probe.
- Rebuild the build-bound reviewed inputs from 0.16.2.1 evidence: the map-space profile, the map-zone sweep and game-map plans, the terrain captures and tile pyramid, the coverage review, and the publication presentation.
- Assemble a candidate catalog and a preview publication from 0.16.2.1 evidence only, and verify them against the actual site.
- **BREAKING**: replace `compendium.update-report.v1` with `v2`. A report declares the risk areas that its release notes name and references the registered release notes. The fixed 0.16.2 risk list is removed.
- Accept the verified candidate. Acceptance does not deploy.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `game-update-workflow`: release notes define the risk areas that each update report declares and disposes, in place of the 0.16.2 list.

## Impact

- Contracts: `packages/contracts/src/update-report.ts` and its tests; `apps/compendium-cli/src/accept-update.ts` and its tests.
- Scan and capture: `packages/scan/src/probes/scene-visit/`, the new `@afallon/scan/scene-visit` entrypoint, and `packages/capture/src/capture.ts`. The copy `packages/capture/src/probes/scene-visit.csx` is removed.
- Operator tooling under `local/` that authors the profile, game-map plans, capture plans, and coverage review reads the build identity from its evidence inputs.
- Build-scoped artifacts in the local store, the local production stage, and the accepted-build descriptor. Nothing is deployed.
- `openspec/changes/complete-quest-reference` task 5.3 completes with the 0.16.2.1 publication.
