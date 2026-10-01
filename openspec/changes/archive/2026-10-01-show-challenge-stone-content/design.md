## Context

See proposal.md. A single map space contains Coalway Outdoors and several challenge-stone scenes, while map shards and place documents currently publish their placements independently. Scene 42 has no mapped placements in the current catalog and cannot acquire a derived variant relation without evidence.

## Goals / Non-Goals

**Goals:** Derive host/copy attribution once and share it across map and document publication. Preserve host objects and all ordinary place documents.

**Non-Goals:** Reassign quest ownership outside place pages; infer attribution for scenes with no mapped placements.

## Decisions

- Compute attribution at publication time from the selected catalog's mapped placements and roles plus source component types. The catalog remains the factual scan; host/copy classification is presentation-specific and thus does not require competing catalog candidates while the corruption catalog work runs.
- A copy matches a host object when both horizontal map coordinates differ by less than 0.05 on each axis, their sorted role/creature identity sets agree, and their source component type sets agree. Distinct source IDs are expected across separately authored scenes; compare type identity instead. Only compare host scenes with at least triple the candidate's placements. Establish a host relation when at least 50 placements match: in the audited catalog the three qualifying pairs have 119–635 matches and the strongest other dominant-host pair has 19. There is no clean *share* gap, so percentages do not gate matches. Mark only positively matched objects as copied.
- Remove copied placement markers before deriving publication indexes; use the same copy-ID set for place projection, preserving the host's marker and content. Variant space references map space with no inherited region IDs and a bounded list of unique placement IDs, which map selection uses to filter and fit markers; no world-surface region should be implied by an empty region list.
- Store each derived copy → host placement identity in the publication's exclusion audit resource. Same-build staging verifies every omitted baseline marker is a declared copy and that an equivalent host marker survives at the same location with the same category/entity/item identity; it continues to reject genuine in-bounds removals. Filter copies before co-located map-icon folding, so a copied representative cannot erase its host marker.

## Risks / Trade-offs

- Coincident same-role objects with the same source type are observationally indistinguishable; requiring global overlap and host dominance prevents isolated accidental matches.
- A variant with no mapped placements cannot be classified from this evidence. When later scans add placements it is evaluated normally; no name-based exception is introduced.

### Audited Pairwise Overlap

Catalog build `25434619`: 28 scenes with mapped placements across 21 map spaces. All 56 ordered pairs belong to `world-surface` (eight scenes); every other map space contains one scene. Identity-matched placements are counted once per candidate even if multiple host objects coincide. Coordinates use horizontal map X/Y (world X/Z); world X/Y compares height rather than horizontal location and undercounts copies.

| Rank | Candidate → Host | Matching / Candidate | Share | Host / Candidate |
| ---: | :--- | ---: | ---: | ---: |
| 1 | 41 → 47 | 635 / 724 | 87.7% | 5.31 |
| 2 | 40 → 47 | 296 / 418 | 70.8% | 9.20 |
| 3 | 20 → 15 | 25 / 37 | 67.6% | 1.35 |
| 4 | 40 → 41 | 254 / 418 | 60.8% | 1.73 |
| 5 | 20 → 16 | 20 / 37 | 54.1% | 2.14 |
| 6 | 20 → 14 | 19 / 37 | 51.4% | 3.62 |
| 7 | 15 → 20 | 25 / 50 | 50.0% | 0.74 |
| 8 | 15 → 14 | 20 / 50 | 40.0% | 2.68 |
| 9 | 15 → 16 | 20 / 50 | 40.0% | 1.58 |
| 10 | 41 → 40 | 277 / 724 | 38.3% | 0.58 |
| 11 | 40 → 38 | 154 / 418 | 36.8% | 0.85 |
| 12 | 38 → 41 | 128 / 357 | 35.9% | 2.03 |
| 13 | 38 → 40 | 122 / 357 | 34.2% | 1.17 |
| 14 | 38 → 47 | 119 / 357 | 33.3% | 10.78 |
| 15 | 16 → 14 | 23 / 79 | 29.1% | 1.70 |
| 16 | 41 → 38 | 188 / 724 | 26.0% | 0.49 |
| 17 | 16 → 15 | 20 / 79 | 25.3% | 0.63 |
| 18 | 16 → 20 | 20 / 79 | 25.3% | 0.47 |
| 19 | 47 → 41 | 831 / 3,847 | 21.6% | 0.19 |
| 20 | 20 → 47 | 8 / 37 | 21.6% | 103.97 |

The highest share among ordinary/small stone pairs is 20 → 15 (67.6%), above Cemetary → 47 (33.3%); a share-only threshold would misclassify them. With host dominance enforced, ordinary pair 20 → 14 still has 51.4% but only 19 matches. Small poison/blood stone scenes 14, 15, 16, and 20 share objects with one another yet remain unclassified. Scene 42 has no mapped placements and cannot be classified from data.
