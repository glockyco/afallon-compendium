## Why

A full update scan of build 25434619 took about 2 hours. Measured from the run manifests and the object write times, 77% of that time went to the artwork step, which every scene target ran again. Artwork is the same for the whole build, and the catalog reads it only from the one canonical target. The artwork step also grew with each target of a run (117 s on the first target of a shard, 261 s on the eighth), because each registered output rewrites the whole run lease and a full run revision.

## What Changes

- **BREAKING** Scan plans move to `compendium.scan-plan.v2`. A plan can name one `artworkTarget`. Only that target collects artwork; every other target skips the artwork collector. A plan without `artworkTarget` collects no artwork.
- The catalog requires artwork from its canonical target and fails with a clear message when that target has none.
- The update tools and the game-update skill write and use v2 plans: the shard plans carry no artwork target, and the canonical scene plan names its scene.
- Not in this change: the quadratic registration cost (lease and revision rewrites per output). With artwork collected once, a scene run registers about 120 outputs per target instead of about 1,560, so the growth falls to a few seconds per run. It stays recorded as a known cost.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `game-update-workflow`: an update scan collects the build's database-wide artwork once, on the target that the catalog reads as canonical.

## Impact

- `packages/contracts/src/raw/traversal.ts` (scan plan v2), `packages/scan/src/plan.ts`, `packages/scan/src/collectors.ts`, `apps/compendium-cli/src/scan.ts`.
- `packages/catalog/src/evidence.ts` (artwork required from the canonical target).
- `tools/update/author-scan-arrivals.ts`, `.agent/skills/game-update/SKILL.md`, the README update section.
- Old v1 plans are no longer accepted. Stored scan runs keep their evidence; catalogs read them by their recorded outputs.
