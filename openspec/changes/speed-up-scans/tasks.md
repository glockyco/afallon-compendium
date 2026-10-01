## 1. Plan and scan

- [x] 1.1 Move the scan plan to `compendium.scan-plan.v2` with an optional `artworkTarget`. Reject a plan whose artwork target is none of its targets. Verified with `packages/scan/src/plan.test.ts` (commit 404ee59).
- [x] 1.2 Run the artwork collector only on the plan's artwork target. Verified on the 0.16.3 scans: canonical run f988c9de (artwork target `build-scene:44`) has 1,560 artwork outputs, and shard runs e4d7d3e2, 2ba8a8d7, 27ed5098, d60be91e and a7fddd7b have none.

## 2. Catalog

- [x] 2.1 Require artwork from the catalog's canonical target, and name the target in the error. Verified with `packages/catalog/src/normalize.test.ts` (commit 404ee59).

## 3. Tools and instructions

- [x] 3.1 Update the game-update skill for v2 plans and the artwork target (commit 404ee59). `tools/update/author-scan-arrivals.ts` reads and writes each plan whole, so it keeps `schemaVersion` and `artworkTarget` without a change, and the README defers scan steps to the skill.

## 4. Proof

- [x] 4.1 Scan build 25653798 with v2 plans. Compare the per-target time with run 228ac53d and record both. Run 228ac53d (build 25434619, 8 targets, artwork on every target) took 2,114 s, 264 s per target, with 12,443 outputs. The 0.16.3 shards took 26 s (e4d7d3e2, 7 targets, 187 s), 28 s (2ba8a8d7, 8 targets, 230 s), 33 s (27ed5098, 8 targets, 264 s) and 49 s (d60be91e, 3 targets, 147 s) per target, with 299 to 739 outputs per run. The artwork target alone (f988c9de) took 110 s, and scene 41 alone (a7fddd7b) took 94 s.
- [x] 4.2 Run `bun run check`, the site check, `bun test ./packages ./apps`, and `openspec validate speed-up-scans --strict`. All passed on commit 7cb1cff plus this task list (424 tests).
