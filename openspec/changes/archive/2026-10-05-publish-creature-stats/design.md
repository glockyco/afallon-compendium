## Context

See proposal.md for the motivation and the two delta specs for behavior. The canonical NPC probe in `packages/scan/src/probes/collectors/canonical.csx` emits `guideStats` from base stats, custom stats, or the selected stat-list template (later sources replace the same stat ID). The decoder in `packages/catalog/src/decoders.ts` accepts `value`, optional `perLevel`, percent and override fields. Normalization resolves stat identities and stat definitions; the catalog uses `npc_stats`, and `packages/publication/src/documents/npcs.ts` produces page and variant facts. Historically, the publication reduced each row to `{stat, amount, isPercent}`, and `NpcPage.svelte` and `VariantsSection.svelte` printed `amount` as Health/stat value. Public NPC facts and variants both use the item-oriented `StatRowSchema`; item rows must remain unaffected. NPC locations already carry the confirmed spawn-derived level, distinct from the NPC record's template level.

The verified native arithmetic is `startingValue + addedValue + encounterLevel * perLevel` for supported, ordinary non-percent stats without overrides; `MobCombatEntity.InitStats` multiplies by actual level, not level minus one. The read-only findings in `local/update-0-16-3/research/creature-stat-scaling-findings-20261003.md` (lines 11–49) cite same-build native outputs and observed runtime checks; the registered candidate rule fragment is `local/update-0-16-3/rules/fragment-creature-stat-scaling-1.json`. Fangchill's discovered Coalway spawner provides possible scaling encounter levels 20–30 despite a record template of 1–3, but a quest gate prevented a live Fangchill observation: its Health `100 + 187.2 + 84.24 × level` gives *projected* 1,972 at 20 and 2,814.4 at 30. The Aquarius boss's fixed level-20 spawn yielded observed Health 60,605 (`100 + 56,605 + 195 × 20`) in `artifacts/runs/creature-stat-scaling-fixed-visit-20261003-3/fixed-creatures.json`. A level-20 Goat sample in `artifacts/runs/creature-stat-scaling-baseline-20261003.json` has normal Health 676; registered Heroic runtime evidence in the findings gives 3,308.2358 after multiplying by 4.89384 (3,308.23584 before float rounding). These are acceptance anchors, not hardcoded creature-specific rules.

## Goals / Non-Goals

**Goals:**
- Preserve original authored operands across normalization, SQLite and public documents, including variant-specific facts and optional overrides.
- Use confirmed encounter level and one guarded calculation for creature-page and Heroic health presentation.
- Keep partial and unsupported rules visible as additions without making up finished totals.

**Non-Goals:**
- Reconstruct arbitrary percent/override/min-max game behavior, item stat application, adventurer race/class or gear-based runtime stats, opponent-relative attack projections, universal/guaranteed hit damage inferred from Strength, affix damage, or Heroic effects other than the verified health multiplier.
- Infer a fixed stat from a level range without selecting a concrete encounter level, or use the NPC record's template level in place of a spawn level.

## Decisions

1. **Keep source operands separate through the pipeline.** The probe keeps `value` as the authored addition and `perLevel` from the selected stat source, plus optional override fields; normalization joins `startingValue` from the referenced stat definition. `CatalogNpcStatValue` and the `npc_stats` SQLite columns carry nullable operands. Query readback retains them through `CatalogNpcFacts`. This avoids baking one creature level into catalog data; the alternative of projecting the record's `minLevel` once would be wrong for Fangchill's spawn-derived 20–30 range. Ensure source precedence from the probe is preserved, and do not treat null overrides as active.

2. **Introduce `NpcStatRowSchema` for both common and variant facts.** Export a strict row with `{stat, amount, isPercent, startingValue?, perLevel?, minValue?, maxValue?, startPercentage?}` and use it only in NPC facts and variant facts. Include known numeric zero; omit unknown nullable operands rather than serializing null/zero guesses. Do not extend `StatRowSchema`, which also serves item, gear-set, talent and enchanting consumers. Compare all creature-stat operands when deciding whether variants differ, not just `amount` and `isPercent`.

3. **Calculate only verified flat combat stats at an explicit confirmed encounter level.** A pure helper takes the NPC row and specific level and returns unavailable unless the stat identity is one of the verified Health, Strength, Armor or Magic Armor identities, level is finite and valid, `startingValue` and `perLevel` exist, the row is flat, and there are no override fields. Other stat types, such as Movement Speed, need their own rules before their calculated totals can be shown. For supported rules return `startingValue + amount + level * perLevel`. Page-level level unions and variant-level ranges are display contexts, not arithmetic inputs: fixed min=max can be evaluated; for a supported bounded range show endpoints with their levels or let a selected encounter level drive the figure. A range without an upper bound must not fabricate an endpoint. Avoid converting absent stats into zero or hiding a per-level-only nonzero stat whose authored addition is zero. Use linked stat identity, not free-text stat names, to decide which rules apply.

4. **Reuse the same effective-health result in Heroic comparisons.** The existing Heroic picker already selects a published creature/place and a specific level, and `empoweredStrength` supplies its health multiplier. Resolve the selected creature's public NPC document and matching record/variant stat with its location/level evidence, then calculate normal maximum Health at that selected encounter level. Multiply for empowered maximum Health only when normal maximum Health is supported. Show a useful unavailable/author-added distinction otherwise and retain the multiplier as contextual information; the current 1×/multiplier-only comparison is insufficient. Do not use experience values or the selected character level as health inputs.

## Risks / Trade-offs

- **[Existing published snapshots lack optional operands]** → Render their known additions honestly and require scan → catalog → publish before expecting effective values; schema remains additive for old snapshots.
- **[Several variants share a page or a spot's record identity is ambiguous]** → Match the selected encounter to its actual record/variant using existing location keys and anchors, never pick an arbitrary page-wide stat; withhold numeric health if identity cannot be established.
- **[Other game rules modify combat stats after the base calculation]** → Label the figure as the modeled base/normal encounter stat, guard unsupported overrides, and avoid promises about affixes, equipment or effects.
- **[Native floating-point arithmetic and display rounding differ]** → Preserve operands and calculate without intermediate rounding; round only for presentation, checking the unrounded Heroic sample in tests.

## Migration Plan

1. Extend/verify probe decoding, normalization, catalog write/read, publication row shape and strict public validation without altering other stat-row contracts.
2. Rebuild and republish a fresh snapshot through the established pipeline so optional operands reach generated data; update operator pipeline instructions with reproducible checks.
3. Switch creature and Heroic consumers to guarded encounter-level values, run focused fixture/real-catalog checks and verify browser presentation at Fangchill 20/30, Aquarius 20 and a Heroic comparison. Rollback by reverting code and republishing the prior validated snapshot; the optional fields can safely be ignored by prior clients.
