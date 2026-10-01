## 1. Installation and declarations

- [x] 1.1 Install build 25653798 through Steam and record the receipt. Verify `StateFlags` 4 and the input hashes.
  - Evidence: update run `c9f54dc0`. A new Steam client first hung because orphaned CrossOver sessions of the bottle were still running; ending them fixed it.
- [x] 1.2 Recover the 0.16.3 declarations with the pinned Cpp2IL and compare them with 25434619. Register the receipt, the reviewed comparison, and the release notes.
  - Evidence: snapshot `steam-25653798-8813a3b585bb` (receipt run `bd906bde`), comparison run `66fd9061` (42 added, 5 removed, 85 modified types), release notes run `132d7a1d`.

## 2. Raw evidence

- [x] 2.1 Record the new item, loot table, effect, and adventurer settings fields in the probes, the raw contracts, and the catalog. Verify with contract and normalization tests.
  - Evidence: commit 28b723b (canonical v5, relationships v2, support v4, catalog schemas), and commit 279b9da for the item action fields.
- [x] 2.2 Smoke-test the changed probes against the running 0.16.3 game with a single-target scan of scene 44.
  - Evidence: runs f988c9de and f637aa21, and the final artwork-target run f86c5314 after the collector change was committed.

## 3. Candidate evidence

- [x] 3.1 Scan scene 44 as the artwork target, the four scene shards, and the streamed sources with v2 plans. Verify every target succeeds and compare the per-scene producer counts with 25434619.
  - Evidence: f86c5314 (scene 44), e4d7d3e2, 2ba8a8d7, 27ed5098, d60be91e (scenes 40, 45, 46), a7fddd7b (scene 41), streams 975b08d1. The 29 targets equal the accepted scans' targets. The per-scene comparison and the cause of every removal are in `local/update-0-16-3/catalog-comparison-20261001.md`. The stream visit needed commits 59cf0ac (chunk holds for every source).
- [x] 3.2 Add scan targets for scenes that 0.16.3 adds, if any.
  - Evidence: the 42 database scenes and the 31 build scenes are unchanged, so no target was added.
- [x] 3.3 Author and register the map-space profile, sweep the map zones, and generate the game maps.
  - Evidence: profile `local/reviewed-map-spaces-25653798.json` (run 466cd2ea, 28 bindings, 21 spaces), sweep `artifacts/mapzones-25653798/sweep.json`, 21 game-map runs in `local/game-maps-25653798/`.
- [x] 3.4 Capture the reviewed terrain plans and generate the tile pyramid.
  - Evidence: twelve captures in 9 minutes (`local/update-0-16-3/capture-5.out`) after commits 9690f11, 073fded and 77df26e (ChunkHider and released stream loads), pyramid run 6bfa64e4 with the same 769 tiles and partial edge tiles as the accepted pyramid.

## 4. Mechanics rules

- [x] 4.1 Decompile the functions of every 25434619 rules evidence object on 25653798 and compare them. Register a rules record for 25653798 with restated or open rules.
  - Evidence: `local/mechanics-rules-25653798-4.json` (sha256 fd199c4e, run bf6f5e08): 59 restated rules (52 verified, 7 unknown, the same unknown set as the accepted record) and five Loot rules. Reviews `local/update-0-16-3/rules-review-20261001{,-2,-3}.md`. The quest reward rule now also names the currency scaling, which 0.16.2.1 already had. Crossbows and two-handed axes now train weapon skills (live probe `weapon-skill-names-1.json`).

## 5. Catalog and publication

- [x] 5.1 Assemble the bootstrap catalog, author and register the coverage review, and assemble the final catalog. Compare it with the accepted catalog and explain every removal.
  - Evidence: bootstrap catalog fe21ce0c (run 4a387498), coverage review 26e7240b (run 3dee1723), final catalog a19d638c (run 1c24b38d, plan `local/update-0-16-3/catalog/catalog-25653798-2.json`). The first build needed commit 2b58b7d (RandomActivator null entries). Removals: `local/update-0-16-3/catalog-comparison-20261001.md`.
- [x] 5.2 Publish the 0.16.3 weapon line in item documents and show it in the item tooltip.
- [x] 5.3 Register the presentation, publish the candidate, and stage it against the accepted publication.
  - Evidence: final catalog ea05aff0 (rules record `local/mechanics-rules-25653798-7.json`), presentation `local/update-0-16-3/presentation-25653798-d.json`, publication 20171f1e (run 2b6db399), staged with verified-update parity in the worktree and the main checkout. Earlier candidates needed commits b036c1d (playable classes only) and the text rewrites.

## 6. Verification

- [x] 6.1 Check the staged site at 1440 and 390 px: map, search, the Hunter class and talent trees, a bow, a crossbow, a two-handed mace, the Crossbows skill, a Veilpiercer and a Grey Harvest quest, the Supply Pack, and every risk area of the notes.
  - Evidence: all pages rendered without horizontal overflow at both widths. The map rendered in a WebGL2 browser, search found the Veilpiercer items and place. The checks led to commits 3b8aef8 (respawn range), d8b45c3 (NPC fact labels), and f87dbd7 (talent tree tabs).
- [x] 6.2 Run `bun run check`, the site check, `bun test ./packages ./apps`, `bun run test:python`, and `openspec validate update-game-0-16-3 --strict`.
  - Evidence: all passed (427 tests, 2 Python tests).

## 7. Acceptance

- [x] 7.1 Author the update report with the 0.16.3 risk areas and accept catalog and publication together. Verify the accepted build and its rollback.
  - Evidence: report `local/update-report-25653798.json` (author script `local/update-0-16-3/author-update-report-25653798.ts`, 12 checks, 21 risk areas), accepted descriptor sha256 4b8423ec with rollback to descriptor 19c62e4d (build 25434619, publication 946fc9bb).
- [x] 7.2 Record the build facts in `EXPLORATION.md`.
