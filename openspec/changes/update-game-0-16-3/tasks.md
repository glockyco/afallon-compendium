## 1. Installation and declarations

- [x] 1.1 Install build 25653798 through Steam and record the receipt. Verify `StateFlags` 4 and the input hashes.
  - Evidence: update run `c9f54dc0`. A new Steam client first hung because orphaned CrossOver sessions of the bottle were still running; ending them fixed it.
- [x] 1.2 Recover the 0.16.3 declarations with the pinned Cpp2IL and compare them with 25434619. Register the receipt, the reviewed comparison, and the release notes.
  - Evidence: snapshot `steam-25653798-8813a3b585bb` (receipt run `bd906bde`), comparison run `66fd9061` (42 added, 5 removed, 85 modified types), release notes run `132d7a1d`.

## 2. Raw evidence

- [ ] 2.1 Record the new item, loot table, effect, and adventurer settings fields in the probes, the raw contracts, and the catalog. Verify with contract and normalization tests.
- [ ] 2.2 Smoke-test the changed probes against the running 0.16.3 game with a single-target scan of scene 44.

## 3. Candidate evidence

- [ ] 3.1 Scan scene 44 as the artwork target, the four scene shards, and the streamed sources with v2 plans. Verify every target succeeds and compare the per-scene producer counts with 25434619.
- [ ] 3.2 Add scan targets for scenes that 0.16.3 adds, if any.
- [ ] 3.3 Author and register the map-space profile, sweep the map zones, and generate the game maps.
- [ ] 3.4 Capture the reviewed terrain plans and generate the tile pyramid.

## 4. Mechanics rules

- [ ] 4.1 Decompile the functions of every 25434619 rules evidence object on 25653798 and compare them. Register a rules record for 25653798 with restated or open rules.

## 5. Catalog and publication

- [ ] 5.1 Assemble the bootstrap catalog, author and register the coverage review, and assemble the final catalog. Compare it with the accepted catalog and explain every removal.
- [ ] 5.2 Publish the 0.16.3 weapon line in item documents and show it in the item tooltip.
- [ ] 5.3 Register the presentation, publish the candidate, and stage it against the accepted publication.

## 6. Verification

- [ ] 6.1 Check the staged site at 1440 and 390 px: map, search, the Hunter class and talent trees, a bow, a crossbow, a two-handed mace, the Crossbows skill, a Veilpiercer and a Grey Harvest quest, the Supply Pack, and every risk area of the notes.
- [ ] 6.2 Run `bun run check`, the site check, `bun test ./packages ./apps`, `bun run test:python`, and `openspec validate update-game-0-16-3 --strict`.

## 7. Acceptance

- [ ] 7.1 Author the update report with the 0.16.3 risk areas and accept catalog and publication together. Verify the accepted build and its rollback.
- [ ] 7.2 Record the build facts in `EXPLORATION.md`.
