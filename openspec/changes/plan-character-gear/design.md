## Context

See [proposal.md](proposal.md) for motivation and scope. The evidence baseline is Afallon 0.16.3, Steam build 25653798, accepted catalog `d5b0b4b3e2161010e0de6fff10a2be305063990eb7c139080a9eb844edee0e15`. Playable identity comes from published race/class offers, not all captured classes; Berserker is captured but not offered.

`build-character-planner` / `character-planner` owns named browser characters, exactly one active character selected in the header, previews, serialized/revisioned persistence, all-character export/import and the link contract. This change extends each character's one build through `character-gear`, without modifying that foundation capability directly. Foundation/talents precede `plan-party` / `party-planner`, which precedes gear; `show-save-progress` / `save-progress` research runs alongside and retains its own transfer gate.

The October 11 [gear report](../../../local/update-0-16-3/research/planner-gear-context-20261011.md) settles weapon displacement, zero random maximum, distinct-piece cumulative sets and flat/percent/clamp aggregation. Physical ring/trinket configuration, full gem fit, base-provider/growth, derived links and some instance eligibility/inclusion remain research gates. Catalog schemas already expose fixed/random stats, socket `gem_type`, gem stats, enchantment conditions/tiers and set identities. The current comparison accepts one template in two versions and matches stats by array position; it is not a two-item evaluator. The [site integration report](../../../local/update-0-16-3/research/planner-site-integration-20261011.md) measures a proposed item directory at about 335 KB raw versus about 1.7 MB for search resolution; these are measurements, not final payload limits.

## Goals / Non-Goals

**Goals:** Preserve source identity and partial instance information; make every complete result reproducible from accepted facts plus registered rules; share exactly the reader's entered instance state; keep public pages static and action data lazy.

**Non-Goals:** Consumables, cosmetic appearance equipment, transient combat effects, shifted-form totals, simulations, best-in-slot or build/team recommendations, ranking, arbitrary comparison of whole builds, account sync or direct save parsing. Gear score is the named verified game statistic, not a general quality score. Adventurer kits are authored starting references, not the current gear of the fixed roster; member progress remains per-character save state.

## Decisions

### 1. Physical placement identity precedes a picker

Use three verified weapon placements, with explicit-target `WeaponEquipmentRules.TryPlan_0` / `FitsHand` semantics. Two-handed main removes off; choosing off removes two-handed main; ranged coexists and changes only ranged. Record displacement as one reversible edit under the foundation's editing contract.

Publish armor placement identities only from the configured collection/asset probe, correlating `ItemSlot`, `ItemCategory` and `RPGBArmorSlot.Accepts` with serialized equipment fields. Ring 2/Trinket 2 aliases prove support, not a configured count. Ordinary armor categories are not a complete physical-slot model; captured hair, tattoo and other cosmetic armor must stay excluded. Apply weapon-class and authored level requirements, not inferred armor/race gates; saved initialization bypasses are not equip permission.

**Alternative rejected:** Derive slots from item categories or save-array length. Both lose explicit physical identity and can invent duplicate jewelry places. Gate placement publication rather than ship guessed slots.

### 2. Store item instances, not template selections

Each placement stores item identity, Heroic boolean, separate corruption level, random stat identities/entered values, gems by socket index and one enchantment identity/tier. Unknown and absent modification information remain distinguishable from known normal/unmodified state. Eligibility evidence controls selectable modifications; unresolved incoming fields remain visible and Not Verified, not silently normalized.

Use `item_random_stats` range/mode identities, verified two-decimal and authored whole-number rounding, and `random_stats_max < 1` as uncapped. Use socket `gem_type` identity, not the empty legacy `socket_type` column. Complete the colour matrix before enabling gem edits; never infer universal White. Every enchantment condition must pass; replacement overwrites one enchantment.

Heroic and corruption coexist in independently stamped native instance fields and weapon multiplier arithmetic. Audit fixed-stat order, current-corruption provider and source/template eligibility before claiming every combination is available. The challenge cap of 30 is not proof of an item-instance cap; encoding stress corruption 60 is not eligibility evidence.

**Alternative rejected:** Exclusive Normal/Heroic/Corrupted enum or default random averages. These destroy real instance state and manufacture totals.

### 3. Reuse browsing and generalize comparison once

Use the existing item-list filters and source links in a picker scoped to one verified placement. Keep unusable items discoverable with reasons; inspection/filtering never mutates equipment. Page handoffs reuse the already loaded candidate document and preserve its chosen Heroic/corruption state without inventing rolls.

Generalize the existing comparison presentation and helper to two instances, aligning stable stat key plus flat/percentage mode. Show one-sided rows and unknown values explicitly, and replace better/worse colour semantics with neutral signed differences. Both candidates use the same instance evaluator as Gear; comparison is not equipment replacement or a quality verdict.

**Alternative rejected:** A second bespoke item browser or a second comparator around the position-based helper. Both duplicate conventions and leave false comparisons for unrelated items.

### 4. Keep sourced contributions separate from completeness

Represent base, fixed item, random values, Heroic/corruption, socket gems, enchantment tier, set thresholds and selected talent contributions as identifiable source rows. Distinct set member IDs count once; every threshold at or below the count remains active. Display thresholds/next progress where the reader chooses gear.

Apply the verified flat sum, additive percentage accumulation after flats and bound clamp. Audit derived link order and source mapping rather than treat these core rules as unverified. Keep base-provider/growth Incomplete until `GetCustomStats`, initialization and level-up behavior are mapped and runtime cross-checked; absent race arrays and Druid's ordinary/custom lists do not establish a baseline. Track completeness per affected result so unrelated known contributions remain useful. No blocked gear enters verified totals, and missing instance fields never become zero.

**Alternative rejected:** Sum display-label stats into one number or suppress all details until the baseline is known. The first fabricates completeness; the second discards supported information.

### 5. Reuse the verified Heroic gear-score rule

Use registered `heroic-tier-equipped-gear-score`, `GetItemScore` / `GetGearScore` and their existing assembly evidence: equipped flat contributions plus average base damage for each weapon, percentage contributions excluded. Audit how random values, gems, enchantments, sets and Heroic/corruption modifications enter those functions, then cross-check a pure read-only score call on the same instance. This is an input-inclusion audit, not rediscovery of an unknown formula.

A missing scoring input yields “Gear Score Not Available”; an unknown character baseline alone need not block an independent score if the audited scoring function does not use it. Heroic Tier consumes only the active character, never a preview. Item Power and adventurer preference scoring are separate values.

### 6. Reference the foundation's serialization and lifecycle

Gear uses `build-character-planner` / `character-planner`'s `/planner/#build=v1.<payload>`: canonical compact JSON, raw deflate and unpadded base64url, bounded decoded size/collections, rejection of unknown fields and full validation before feature release. Gear entries round-trip independent modifications by frozen physical placement identity, not publication sort order. The foundation also owns catalog provenance, identity, entered point totals, ordered/run-collapsed Talent Point purchases, final Heroic Essence ranks and party. Do not introduce a gear-specific link or strip those fields. Measured whole links are 516–569 characters at level 30 and 818–866 at level 60 with a four-member party; compressed bytes may differ by browser, so compare decoded canonical JSON.

Opening a link writes nothing. Adoption is “Save as New Character” or “Replace (name)'s Build,” with Undo and “Saved in this browser” only after success. Gear follows Duplicate, rename, delete and all-character export/import through the foundation store. Switching edits neither build. A save-imported rank snapshot has order unknown; the “Earliest With Base Talent Points” view does not back-project equipment or date Heroic Essence purchases. Save gear transfer waits for `show-save-progress` / `save-progress`'s verified joins and paired-save gate; this capability supplies typed instance validation, not a parser.

**Alternative rejected:** `[slot,item]` links or independent gear storage. They cannot represent modifications and diverge from the active named character.

### 7. Load page actions only when used

Keep item pages prerendered and neutral before mount; subscribe to the small active-character summary, not a global gear evaluator. Offer “Equip on (name)” and “Compare With (name)'s (slot).” Load comparison/equipment chunks and the typed, published item directory on explicit use through the existing publication loader, preserving path/hash/schema/build/catalog validation. Reuse the current item document and resolve only necessary referenced documents; never use the full search index for these actions. No directory fetch is needed merely to label a button.

Capture target character ID/revision and document identity for asynchronous actions, discarding stale results. Ambiguous hand/jewelry targets open explicit placement selection. No-character actions open setup/preview without adoption; empty slots have an empty result, not zero. Reserve stable contextual space; retain focus, item version and reference content. Reuse the site's existing card/table/tooltip system and contained mobile controls.

**Alternative rejected:** Eager directory/evaluator hydration or personalized SSR. Both burden reference navigation and break the static/optional-context boundary.

## Risks / Trade-offs

- Runtime asset configuration and source eligibility may contradict inferred names. Record physical IDs and acceptance results before publication; unresolved cases stay Not Verified.
- Stat-linked transformations can be order-sensitive. Gate derived totals on the exact mapped source/order and keep known source rows visible meanwhile.
- Missing roll/instance references are partial data, not evidence of normal gear. Preserve them through resolution and warn before omission from a revised link.
- The directory remains substantial despite improving on search. Measure actual action-loaded transfer/chunks; cache by publication identity and consider a smaller verified placement lookup only if measured, without inventing a parallel fetch path.
- Browser changes during async actions can target the wrong character. ID/revision guards and focus-preserving stale-result handling are required.

## Migration and Acceptance

Apply after foundation/talents and party. Complete research gates before their dependent editor/calculation work; save research remains independent. Compare focused catalog captures against the accepted baseline and preserve partial facts. Before official data acceptance, create a JSON audit with provenance, verification checks, risks and rollback; stage catalog/publication together and synchronize development/preview data on acceptance. Retain the previous accepted publication for rollback. Verification covers instance/link/export parity, complete and incomplete stat/score fixtures, neutral comparison, actual browser actions and focus/layout at 1440, 1100 and 390 CSS pixels; each task group includes its tests and documentation.
