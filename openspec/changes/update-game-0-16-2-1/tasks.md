## 1. Report contract

- [ ] 1.1 Replace `compendium.update-report.v1` with `v2`: add the registered release notes as a report artifact, declare risk areas as unique kebab-case identifiers, and remove the fixed 0.16.2 list. Verify with contract and acceptance tests.

## 2. Installation and declarations

- [ ] 2.1 Record the Steam update receipt for 0.16.2.1. Verify build 25434619, `StateFlags` 4, and the input hashes.
- [ ] 2.2 Recover the 0.16.2.1 declarations with the pinned Cpp2IL and compare them with the 0.16.2 snapshot. Register the comparison and record the types and fields that can affect collectors or decoders.

## 3. Candidate evidence

- [ ] 3.1 Run the complete candidate scan in shards. Verify every scene and streamed-source target succeeds, the canonical target has the `quest-levels` artifact, and cleanup restores the research character.
- [ ] 3.2 Author and register the map-space profile from the new scans. Verify every observed position resolves through one binding and compare the bindings with 0.16.2.
- [ ] 3.3 Sweep the map-zone textures, author and register the game-map plans, and generate the game-map imagery. Verify each landmark residual and compare the textures with 0.16.2.
- [ ] 3.4 Capture the reviewed terrain frames and generate the tile pyramid. Verify each capture receipt and the tile count.

## 4. Catalog and publication

- [ ] 4.1 Assemble a candidate catalog, generate and register the coverage review, and assemble the final candidate catalog. Verify build agreement, referential integrity, and that no required obligation is unsatisfied.
- [ ] 4.2 Register the presentation with reviewed world offsets, publish the candidate, and stage it against the 0.16.2 publication with the verified-update parity gate.
- [ ] 4.3 Verify the map, search, representative entities, relations, artwork, quest level ranges, and coverage in the browser.

## 5. Acceptance

- [ ] 5.1 Register the release notes, complete the update report, and accept the candidate. Verify the accepted descriptor, the selected publication, and the stage name the same build, catalog, and publication.
- [ ] 5.2 Record the update in `EXPLORATION.md` and complete task 5.3 of `complete-quest-reference`.
