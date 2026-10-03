## 1. Preserve Creature Stat Evidence

- [x] 1.1 Extend/verify NPC probe and decoder retention of selected base/custom/template stat additions, per-level values, percent flags and override operands without changing source precedence; verify a focused scan/decoder fixture retains the selected row including numeric zero and missing fields.
- [x] 1.2 Carry starting values from referenced stat definitions and nullable operands through NPC normalization, catalog `npc_stats` write/read, and NPC variant-difference detection; verify targeted normalization and catalog round-trip tests preserve Fangchill-like and partial/override rows separately.
- [x] 1.3 Define strict exported `NpcStatRowSchema` with optional `startingValue`, `perLevel`, `minValue`, `maxValue`, `startPercentage` alongside `stat`, `amount`, `isPercent`; use it in common and variant NPC facts and project every known operand while leaving other `StatRowSchema` consumers untouched. Verify public document validation accepts an NPC row with supported/optional operands, rejects unknown properties and wrong types, and leaves item stat validation unchanged.

## 2. Project Encounter-Level Values

- [x] 2.1 Add a shared guarded calculation for `startingValue + amount + level × perLevel` using confirmed encounter levels, and reject percent entries, active overrides and missing/invalid inputs; verify targeted tests show Fangchill Health 1,972 at 20 and 2,814.4 at 30, per-level-only stats with zero addition, and unavailable outcomes for unsupported rows.
- [x] 2.2 Update creature summary and variant stat views to use known location/variant encounter levels, bounded level endpoints or a selected level, labeling unknown totals as authored additions; verify scoped rendering checks show fixed Aquarius level-20 Health 60,605 independently of character level, Fangchill's level-specific Health and Strength without claiming universal Attack Damage, and no fabricated total for missing or override inputs.
- [x] 2.3 Show normal and empowered maximum Health in Heroic creature comparisons by resolving the selected encounter's correct creature/variant and applying the existing multiplier to its effective Health; verify a scoped test checks 676 × 4.89384 = 3,308.23584 before display rounding and unavailable health leaves the multiplier informative without a numeric total.

## 3. Rebuild and Verify End to End

- [x] 3.1 Run focused NPC catalog/publication and site tests plus strict public-document validation, including common and variant facts and a mixed shared-page case; verify every changed contract accepts real projected documents without weakening strict item contracts.
- [x] 3.2 Document scan → capture → catalog → publish → accept-update commands and fresh-run artifact comparison for the accepted game build; verify a new run reproduces creature operands and selected published NPC pages rather than relying on a stale static data link.
- [x] 3.3 Exercise the rebuilt publication in the actual site at Fangchill's level-20/30 potential encounters, fixed Aquarius level 20 and a Heroic creature comparison, including narrow-screen variant presentation; verify displayed values, encounter labels, partial-data fallback and unchanged item rows against the read-only native/live evidence, noting Fangchill numbers are native-input projections rather than direct spawned observations.
