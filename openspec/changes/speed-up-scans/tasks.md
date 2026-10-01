## 1. Plan and scan

- [ ] 1.1 Move the scan plan to `compendium.scan-plan.v2` with an optional `artworkTarget`. Reject a plan whose artwork target is none of its targets. Verify with plan tests.
- [ ] 1.2 Run the artwork collector only on the plan's artwork target. Verify with a collector test that a non-artwork target produces no artwork output.

## 2. Catalog

- [ ] 2.1 Require artwork from the catalog's canonical target, and name the target in the error. Verify with a catalog evidence test.

## 3. Tools and instructions

- [ ] 3.1 Update `tools/update/author-scan-arrivals.ts`, the game-update skill, and the README for v2 plans and the artwork target.

## 4. Proof

- [ ] 4.1 Scan build 25653798 with v2 plans. Compare the per-target time with run 228ac53d and record both.
- [ ] 4.2 Run `bun run check`, the site check, `bun test ./packages ./apps`, and `openspec validate speed-up-scans --strict`.
