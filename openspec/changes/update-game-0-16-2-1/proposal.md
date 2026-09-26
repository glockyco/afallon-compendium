## Why

Steam installed Afallon 0.16.2.1 as build 25434619. `GameAssembly.dll` and `global-metadata.dat` changed, and the release notes name teleport loading, quest hand-ins, gear placement, and interface changes. The published compendium still uses build 25419293 evidence, so it cannot show the installed game, and the quest level ranges that the `quest-levels` collector reads exist only for the installed build.

The update report contract names the 0.16.2 risk areas as a fixed list. A later release has other risk areas, so the report cannot record the 0.16.2.1 review without a false disposition for areas that the release does not touch.

## What Changes

- Record the Steam update receipt, recover the 0.16.2.1 declarations, and compare them with the 0.16.2 declarations.
- Run a complete candidate scan of build 25434619, including the `quest-levels` collector.
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
- Operator tooling under `local/` that authors the profile, game-map plans, capture plans, and coverage review reads the build identity from the update receipt.
- Build-scoped artifacts in the local store, the local production stage, and the accepted-build descriptor. Nothing is deployed.
- `openspec/changes/complete-quest-reference` task 5.3 completes with the 0.16.2.1 publication.
