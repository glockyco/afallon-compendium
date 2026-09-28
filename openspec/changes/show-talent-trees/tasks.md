## 1. Artwork evidence

- [ ] 1.1 Confirm that `add-page-navigation` supplies the shared URL-backed tab set with the `tab` query parameter. Verify its component accepts stable values and readable labels before the class page uses it.
- [ ] 1.2 Extend `packages/scan/src/probes/collectors/artwork.csx` to capture `entryIcon` for every bonus and talent tree. Reuse sprite extraction and retain missing or unsupported results. Verify a scan artifact lists both families and records image hashes or explicit issues for every record.

## 2. Catalog

- [ ] 2.1 Add progression artwork bindings for bonuses to the catalog contracts, normalization, database, and queries. Bind trees through the existing entity artwork path. Verify with a targeted catalog test that a bonus binding resolves to its progression fact, a tree binds to its canonical entity, and a missing image does not remove a node.
- [ ] 2.2 Run the artwork scan for build 25434619 with a clean runtime cleanup receipt. Build a catalog candidate and compare its table rows against accepted catalog 6bc13a4c at `/Users/glockyco/src/github.com/glockyco/afallon-compendium/artifacts/objects/sha256/33/3d602d72deaba6489e02b00babda425718cc5f5694090e1975e6465fe1e1f4`. Verify expected bonus and tree artwork bindings, all 660 nodes and 30 trees, and explain every other scan-to-scan row change before proceeding.

## 3. Publication

- [ ] 3.1 Add optional `tree.icon` and `row.icon` to the public class contract. Publish passive icons from progression bindings and ability icons from existing ability references. Add these fields to artwork edge collection. Verify a targeted projection and graph test that both icon kinds resolve to published assets, deduplicate shared images, and leave missing icons optional.
- [ ] 3.2 Keep the authored tree order, all node coordinates, rank effects, requirements, ability links, and `talent-<tree>-<node>` anchors in class documents. Verify with a targeted projection fixture containing an empty grid slot, two trees, a five-rank talent, and a missing icon. Check the largest candidate class document against the current document size budget.

## 4. Class page

- [ ] 4.1 Replace separate tree sections with one Talent trees section and C2 tabs. Render a positional grid from captured tier and position without clipping later builds. Add a Grid/Table switch and reuse the current table for the selected tree. Verify in a browser that Shieldmaster shows its five trees in authored order and switches views without losing rows.
- [ ] 4.2 Give each grid node a focusable name and optional icon. Expose rank effects, requirements, and ability links through readable node details. Verify by keyboard and pointer in a browser that passive and ability nodes show the same facts as the table, including nodes without icons.
- [ ] 4.3 Preserve talent anchors across tab and view changes. Resolve initial fragments and later hash changes before scrolling. Give a node fragment precedence over a stale `tab` query value. Verify a Weighted Strikes requirement link and a Maul Learned by link from other pages, plus a direct load in the table view.
- [ ] 4.4 Check the class grid and table at 1440 px and 390 px in a browser. Verify all six positions and every tier remain reachable at 390 px, grid overflow stays inside its panel, the page has no sideways scroll, and text and controls remain usable.

## 5. Publication and acceptance

- [ ] 5.1 Author a publish plan for the new catalog, publish a candidate, and stage it against the accepted publication. Verify zero new publication issues, graph and artwork asset integrity, and update parity. Compare the publication with its baseline and explain differences beyond this change.
- [ ] 5.2 Inspect the staged candidate at 1440 px and 390 px in a browser. Verify the class tree grid, table, icons, absent-icon fallback, direct node links, tab URL state, and linked ability and talent references. Record the observed results.
- [ ] 5.3 Author the update report and accept the catalog and publication together. Verify that the accepted build points to both new candidates and retains the prior accepted publication as rollback.
- [ ] 5.4 Run the affected type checks and targeted tests, then the project checks once after implementation. Verify `openspec validate show-talent-trees --strict` passes and record each check result.
