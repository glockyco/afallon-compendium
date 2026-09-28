## 1. Evidence and catalog candidate

- [ ] 1.1 Read the current build's update report, update receipt, registered release notes, and accepted descriptor. Cross-check the report's release version and verify the exact Steam article URL for that release. Record the evidence pointers and URL for the publication input. Do not substitute a Steam news index if no article matches.
- [ ] 1.2 Query `place_facts`, published place references, and their level bounds in the accepted catalog and publication. Verify which authored ranges have published pages and record the counts without treating missing ranges as zero.
- [ ] 1.3 Rebuild a catalog candidate from the accepted scan and reviewed inputs. Scan only if the input audit finds missing evidence. Compare every table's rows against the accepted SQLite catalog at `artifacts/objects/sha256/33/3d602d72deaba6489e02b00babda425718cc5f5694090e1975e6465fe1e1f4` with `sqlite3 -readonly`. Verify and explain every difference, including a zero-difference comparison.

## 2. Publication contract and data

- [ ] 2.1 Add typed release version, data date, and exact patch-notes URL to the publication root. Source the version from the update report and date from publication candidate creation. Validate build, version, and article against the report before acceptance. Verify that a mismatched version or article blocks acceptance and that root schema checks pass.
- [ ] 2.2 Project a static hub index of page references and numeric level bounds from published place documents. Add its root reference, graph validation, and baseline-aware parity handling. Verify with a fixture that a published bounded place appears, an unbounded place stays in the Places list, and an unpublished reference fails graph validation.
- [ ] 2.3 Extend the site publication loader to deliver hub and root release metadata from the selected publication. Verify with a small loader fixture that restaging changes the displayed version, date, article, and place entries together.

## 3. Routes and reader navigation

- [ ] 3.1 Move `MapExplorer` to `/map` and make `/` the hub. Update map head metadata and all internal map URL producers, including `map-links.ts`, `LocationLinks.svelte`, `CompendiumSearch.svelte`, and map share controls. Search for all root map query links before completion. Verify `/map?selected=...` round-trips and `/?selected=...` stays on the hub without a redirect.
- [ ] 3.2 Build the hub with one search field above map, level-based places, classes, crafting and gathering, and all currently published browse lists. Link crafting and gathering to Recipes, Skills, and relevant map resource categories. Verify in the browser that a ranged place shows only its published bounds, an unbounded place remains in the Places list, and no unverified level advice appears.
- [ ] 3.3 Replace the ungrouped top links in `PageShell.svelte` with World, Items, and Character groups in their agreed order. Keep Reference and Mechanics empty until their owning changes add destinations. Verify keyboard and pointer access to all published links at 1440 px and 390 px without horizontal overflow.
- [ ] 3.4 Render the selected publication's version, data date, and exact Steam article in the shared footer. Make the map sidebar link back to the hub and expose the same release metadata in its compact layout. Derive the search placeholder from searchable registry kinds and keep the loading spinner in the input. Verify both widths, the matching article target, and a registry fixture with a changed searchable kind.
- [ ] 3.5 Improve `MapDevelopmentDetails.svelte` inside the existing `{#if dev}` branch. Show a page link only for a published page, a plain kind label, kind-specific published facts, and available placement facts. Keep raw JSON in closed disclosures. Verify a linked and unlinked selection in development and the absence of development cards and raw JSON in a production browser build.

## 4. Publication review and acceptance

- [ ] 4.1 Publish a candidate from the reviewed catalog candidate and verified release inputs. Stage it against the accepted publication. Verify the publication graph, entity coverage parity, build identity, no unexplained publication issues, and the root's version, date, article, and hub index.
- [ ] 4.2 Check the staged candidate in browsers at 1440 px and 390 px. Exercise hub search, every navigation group, level entries, browse links, `/map` links and query state, footer, and development-only card behavior. Record working destinations, keyboard access, and absence of sideways scroll. Verify the production mode separately for the dev card gate.
- [ ] 4.3 Author the update report with candidate identities and browser evidence. Accept the catalog and publication together. Verify the accepted descriptor names both candidates and retains the previous publication as rollback. Do not deploy.

## 5. Final checks

- [ ] 5.1 Run scoped contract and publication checks, the site type check, applicable existing tests, and `openspec validate build-compendium-hub --strict`. Verify that each passes and that no old internal root map links or hard-coded release values remain.
