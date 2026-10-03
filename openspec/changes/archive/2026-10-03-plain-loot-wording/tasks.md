## 1. Data And Text Contract

- [x] 1.1 Add optional verified chance per kill and distinguish it from the authored entry rate. Verify old and new row fixtures validate.
- [x] 1.2 Rewrite drop-list and source sentence helpers for one/multiple items, exact count, 100% roll, levels versus ranks and verified odds. Verify focused unit tests.

## 2. Page Surfaces

- [x] 2.1 Show consistent Listed Rate hints or verified Chance per Kill on NPC and item rows and on item summary cards. Verify actual page interactions.
- [x] 2.2 Label chest and gathering probabilities per open and per use, and keep object rows intelligible at phone width. Verify actual page interactions.

## 3. Proof

- [x] 3.1 Validate change specification strictly, run focused tests and repository verification. Check reported results.
- [x] 3.2 Stage ri11, inspect a world-loot item, multi-table boss, chest and gathering items, and object sources in Firefox and Chromium at 1440 and 390 px. Capture screenshots and confirm no sideways scroll or new punctuation violations.

## 4. Verified Loot Odds

- [x] 4.1 Project the recorded object table, level-band requirement, World Loot order, binding rates, and shared cap from the accepted catalog. Verify source fixtures and missing-data fallback cases.
- [x] 4.2 Implement and test exact neutral-baseline creature, World Loot, and qualifying object probabilities with ordered rolls, caps, and weighted minimum picks. Reproduce the corrected native-verified boss, World Loot and object examples.
- [x] 4.3 Fill computed per-kill and per-open public fields only when the full roll and eligibility are known. Check the accepted catalog sample and missing-input explanation.

## 5. Player Presentation

- [x] 5.1 Show computed chances in item summaries and source rows with the stated level and zero Loot Chance, and explain Luck's observed inverse effect only on creature drops. Remove repetitive labels and keep fallback hints meaningful.
- [x] 5.2 Publish the Creature Drops mechanics section when its rules exist. Validate the new rule-placement links.

## 6. Acceptance

- [x] 6.1 Run focused tests, OpenSpec strict validation, and staged-repository verification to status 0.
- [x] 6.2 Publish a candidate from the integration code and inspect Footman's Bulwark, Thornmaw, Kraath the Hivebreaker, and world-object sources in Chromium and Firefox at 1440 and 390 px. Save screenshots in `/tmp/loot-slice/odds/`.
