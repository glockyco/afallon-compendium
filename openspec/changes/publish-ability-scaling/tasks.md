## 1. Evidence and Catalog Derivation

- [ ] 1.1 Register same-build native damage, healing, weapon and periodic-pulse rule evidence in the mechanics rules record, distinguishing tooltip probes from observed hits; verify rule registry acceptance and linked source/build provenance with the focused rules check.
- [ ] 1.2 Derive indexed, additive `ProgressionEffectRank.scaling` entries from canonical stat bonuses and explicit modifiers, respecting main damage type, HEALING bonus altered-stat target ID rather than custom healing label, GLOBAL_HEALING Health setting, flat-calculation suppression and missing references; verify targeted catalog fixtures for same-stat additive entries, flat + explicit, custom Slicing/Magical, Potion-labeled Health healing with HEALING plus GLOBAL_HEALING, and partial evidence.
- [ ] 1.3 Correct skill-modifier mapping to a skill reference and migrate its existing consumers without treating it as stat scaling; verify a skill modifier resolves as a skill in the catalog round-trip and no old property caller remains.

## 2. Public Contracts and Publication

- [ ] 2.1 Add strictly validated, backward-readable effect-rank scaling and weapon context in public contracts and projection, preserving authored flat damage/healing and unrelated actions; verify real rank 394/536 projection, missing reference handling and strict malformed-entry rejection with focused publication checks.
- [ ] 2.2 Carry selected effect-rank scaling into ability versions through existing applied-effect relations with correct chance/target/rank, and expose reverse stat→effect→player/creature ability uses with distinct source identities; verify fixtures where one effect has several users/versions and a checked-only or excluded effect is not attributed.
- [ ] 2.3 Project qualified Combat mechanics explanations with verified evidence and linked Assassin/periodic examples; verify rule-to-document links and ensure the guide makes no guaranteed-hit or snapshot assertion.

## 3. Reader Surfaces

- [ ] 3.1 Present flat amount, linked stat coefficients and source labels, custom versus main damage category, and selected weapon percentage separately on effect pages and tooltips; verify effects 394/536 remain distinct and an incomplete effect still shows known facts in the browser.
- [ ] 3.2 Show version-specific applied-effect scaling and application chance separately on ability pages and compact previews, with accessible secondary details; verify Brutal Slice/Vital Rend browser navigation to the exact effect ranks and that a chance to apply is not labeled hit accuracy.
- [ ] 3.3 Add stat-page reverse uses, meaningful scaling signals on relevant effect/ability list rows or previews, and cross-links to Combat without duplicating grant sources or making large pages unresponsive; verify player and creature application paths, responsive widths, and a worst-case stat page in the browser.
- [ ] 3.4 Explain additive type/explicit scaling, weapon selection, flat calculation, and then-current-stat DoT/HoT pulses on Combat; verify browser text against the level-22 tooltip probe (+20 Intellect changes Assassin totals 124→144 and 146→166; +20 Strength leaves both unchanged) and Fireball/Bleeding/Renewal distinctions without promising actual hit or later pulse totals.

## 4. Pipeline and Candidate Verification

- [ ] 4.1 Document the complete operator scan → capture → catalog → publish → accept-update flow and reproducible fresh-run artifact comparison, but for this assignment run only an owned fresh canonical scan → catalog → verification-only publish/stage candidate using accepted reviewed imagery/world scans; never recapture terrain or run accept-update. Verify candidate artifact/build identities, strict document validation, and derived stat operands/static documents against the same-build native and live tooltip evidence, leaving accepted development/preview data unchanged.
- [ ] 4.2 Run focused catalog/publication and relevant site contract checks, then browser-smoke effect, ability, stat and Combat surfaces on desktop and narrow width; verify navigable links, live layout, old-snapshot fallback, partial ranks and absence of guaranteed-hit claims before marking the change complete.
