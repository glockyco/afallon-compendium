# Planner Facts and Rules

## Evidence Boundary

The supported baseline is Afallon 0.16.3, Steam build 25653798, accepted catalog `d5b0b4b3e2161010e0de6fff10a2be305063990eb7c139080a9eb844edee0e15`. The catalog object is `ff2da675a61651f3ec120002707bda70b23c2351c53e8aad1ed3ba2c1f4404fc`. Read the catalog read-only; a publication candidate is not an accepted data update.

Behavior evidence is the October 3 requirement, rank-cost and point-grant investigations under `local/update-0-16-3/research/planner-*-confirmed-20261003.md`. Their registered native outputs and read-only runtime observations establish:

- Purchase checks the node's authored/template groups, not requirements attached to an ability or effect rank. Every mandatory predicate and every group must pass. Optional predicates require one match unless `checkCount` selects `requiredCount`.
- Ability/Bonus knowledge predicates can test membership and, when `boolBalue1` is set, compare rank with `amount1` using the authored `value` comparator. Unknown or externally acquired knowledge needs evidence, not an assumed zero.
- Each purchase spends the next authored rank's `unlockCost` from the tree's own point type. A learned-by-default ability starts at rank one without spending its first authored cost. Zero-cost nondefault ranks are purchases, not defaults.
- For this build, base Talent Points are `min(180, 1 + 3 × (level − 1))`. This is a base grant, not a full game-earned total. Heroic Essence's authored maximum of zero means there is no positive base cap; it is not a known zero available balance.
- Refund paths can apply modifiers. Planner reversal edits the plan and must not claim to simulate game refunds.

The October 11 talent-order report and JSON inventory supersede the older notes' dataset counts, not their native behavior evidence. The report's provisional recommendation to order every point type is not the shipped foundation contract: [the approved design](../../openspec/changes/build-character-planner/design.md) retains Talent Point order and final Heroic ranks separately. The old rank-cost note's rank-total-only link description is also superseded by that design.

## Accepted-Catalog Reconciliation

Direct catalog queries on October 11 rechecked all 28 class/tree links and all 730 nodes against `planner-talent-order-20261011.json`: target, node index, every rank cost, rank count, free starting rank and condition ID had **zero discrepancies**.

Human, Dwarf and Orc each offer Shieldmaster, Wizard, Necromancer, Assassin, Druid and Hunter, in that authored order. Staged race pages have the same offers. Captured Berserker is not offered and is excluded from planner classes and linked trees. Every offered class has level bounds 1–60.

| Class | Trees | Nodes | Free Starting Ranks |
| --- | ---: | ---: | ---: |
| Shieldmaster | 5 | 123 | 3 |
| Wizard | 5 | 123 | 3 |
| Necromancer | 5 | 106 | 4 |
| Assassin | 5 | 134 | 4 |
| Druid | 4 | 113 | 2 |
| Hunter | 4 | 131 | 3 |

The playable scope has 692 node condition records with 703 predicates, and 52 rank condition records with 36 predicates. Purchase predicates use Ability/Bonus; rank predicates include Item, Effect, CombatState and Stat and remain use/effect conditions. Nineteen ranks are free defaults; seven nondefault ranks have authored cost zero. Ordinary costs are 0 or 1; Heroic ranks include intermediate costs through 215. Existing staged class documents contain all 730 node rows and matching tree cost totals, but no `unlockCost` fields; they are not evaluator inputs.

Reproduce the inventory independently with these joins, preserving authored `link_index` and `node_index`:

```sql
SELECT entity_key, kind, name, details_json FROM progression_facts ORDER BY entity_key;
SELECT DISTINCT json_extract(c.value, '$.entityKey') AS class_key
FROM progression_facts r, json_each(r.details_json, '$.offeredClasses') c
WHERE r.kind = 'races' ORDER BY class_key;
SELECT owner_key, link_index, target_key FROM progression_links
WHERE link_kind = 'talentTree' ORDER BY owner_key, link_index;
SELECT * FROM talent_nodes ORDER BY tree_key, node_index;
SELECT condition_id, semantics, source_field_path, payload_json
FROM conditions ORDER BY condition_id;
```

## Route-Scoped Payload

`compendium.static-root.v9` registers `planner`, a content-addressed reference to `compendium.static-planner.v1`. Planner facts are a route-scoped resource, not an entity kind: no browse list, search entry, fake entity page or `PAGE_DOCUMENTS` kind is added. The static resource registry and graph validate its identity, bytes, hash, schema and artwork edges. Publication measurement records it as the separate `planner` group, outside essential map bytes.

The schema is [public/planner.ts](src/public/planner.ts); projection is [publication/planner.ts](../publication/src/planner.ts). The payload contains:

- Offered races, authored class offers, offered classes and individual class level bounds.
- Every linked tree, point key, tier/slot dimensions and every node's stable index, authored tier/row position, kind, target name and available icon.
- One-based public ranks, every authored cost and array limit, and explicit default rank (zero, one or unknown). `rawData.rank` retains the catalog's zero-based index. `rawData` retains intermediate stat, pet and effect data; `text` retains available ability tooltip lines, including authored blank lines, and bonus tooltip text.
- `purchaseCondition` and separately labelled `useEffectCondition` on each rank. Condition IDs, source paths, selected inline/template semantics and raw groups preserve all authored predicate fields, optional thresholds and future operands. Their presence does **not** verify their behavior.
- All captured point types, starting amounts, authored maxima and raw gain rules. Only the evidenced build-25653798 Talent Point record gets `baseLevelGrant`; other schedules remain null. Full earned totals remain unverified for every type.
- Named `gaps` rather than invented costs, defaults, levels, point keys, empty known balances or supported predicate rules.

`MapDataLoader.loadPlanner(expectedIdentity?)` requests only the validated root and its planner resource, using the existing cache and hash/size/schema/build/catalog checks. Supplying the mounted page's publication identity rejects stale page context. Registry/public-page loading does not request the planner resource; planner loading does not request search, class documents or map parts. The workspace route and header integration are later work; these loader tests do not constitute browser acceptance of an unimplemented route.

## Candidate Verification

The normal candidate publish command uses the accepted catalog without staging or changing its selection:

```sh
bun run compendium publish --store artifacts \
  --output local/planner-foundation-publication-20261011 \
  --plan local/update-0-16-3/publish-25653798-drops-by-roll-5.json --candidate
```

The exercised candidate root is `21a1962673ee7de5b90a4832154d1728570cbf42e6989150ab332ee0aa6dc65a`; its planner object is `89f71d534173c9d167e8a9188ed16f19254cce62ebd6fb8c7f8201996480aa8b` (3,702,103 decoded bytes; 203,158 gzip bytes). It contains 3,491 complete ranks. Canonical comparison with the catalog found zero raw-rank, raw-condition or tier/row differences, with positive controls of 692 node conditions and 52 rank conditions. The spike inventory comparison also found zero differences across all 730 nodes. Thirty-eight nodes retain the explicit no-condition-record gap.

The actual candidate loaded through `MapDataLoader.loadPlanner` with exactly two requests: `publication.json` and the planner object; no search or class documents were loaded. Unit tests additionally cover registry-only loading, caching, hash/size/schema validation through the shared loader, stale page identity and mixed catalog rejection.

Candidate publication completed with no publication issues or typed integrity failures. It remains preview data: the accepted catalog's existing discovery-closure inventory/review identity failures are still reported by the publish gate. This does not establish release completeness or replace the later official audit.

## Remaining Gates

- An absent condition ID is `groups: null` with `condition-not-recorded`, not fabricated empty requirements. Catalog normalization can erase empty groups and unavailable templates into the same null link; consumers must establish a known-empty case from its evidence before claiming verified purchase legality. A missing referenced record instead names `condition-record-missing`.
- Missing rank facts keep `rankLimit` and `defaultRank` null; a missing point key stays null. Unknown predicates/optional thresholds keep raw operands and named gaps. Fixtures exercise these distinctions.
- Outside learning/spellbook schedules, active modifiers, full activity-earned balances and future predicate/node kinds remain unverified. Rank use/effect conditions are not purchase gates. Layout tier/row is not a level gate.
- No capture change is required to publish these existing catalog facts. Task 2.3 remains conditional and unchecked; this work neither stages nor accepts a catalog/publication update. Official acceptance still needs its JSON provenance, verification, risks and rollback audit.
- Browser route loading, hydration, resource timing, direct navigation and evaluator legality/replay are not exercised by these schema/projection/loader tests; they remain the owning later tasks' acceptance gates.
