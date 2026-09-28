## 1. Evidence

- [x] 1.1 Read the current build's update report, update receipt, registered release notes, and accepted descriptor. Cross-check the report's release version and verify the exact Steam article URL for that release. Record the evidence pointers and URL for the publication input. Do not substitute a Steam news index if no article matches. Result: the update receipt, the update report, and the accepted descriptor name 0.16.2.1. The report's release notes (run 0b880954, object `824d3d7e…`) are the Steam news item with gid 1844115010501029, title "Afallon 0.16.2.1", app 2597810, dated 2026-09-21T10:48:37Z. `https://store.steampowered.com/news/app/2597810/view/1844115010501029` returns HTTP 200.
- [x] 1.2 Query the place pages and their level bounds in the accepted publication. Verify which authored ranges have published pages and record the counts without treating missing ranges as zero. Result: publication 60415893 has 42 place pages (37 zones and 5 dungeons). All 5 dungeons and 19 zones have a level range, which matches the 24 authored ranges in `place_facts` of catalog 6bc13a4c. The other 18 place pages have no range.
- [ ] 1.3 Confirm that the change needs no catalog change, and reuse the accepted catalog 6bc13a4c and presentation `bab2f19c…` for the candidate. Verify that the publish plan names the accepted catalog object, manifest, and catalog ID.

## 2. Publication contract and data

- [ ] 2.1 Add `release` to the publish plan (v3) with the version, data date, and release notes identity. Add `release` to the publication root (v5) with the version, data date, and the Steam article title, date, and store URL derived from the release notes. Reject a malformed news item, an invalid date, and a data date before the article date. Verify with targeted tests that the root carries the derived article and that these inputs fail.
- [ ] 2.2 Accept the v5 root in the candidate readers: publication selection, the site graph reader, and acceptance. Keep the shape-based baseline reader for the retained v4 publication. Verify with the existing selection, graph, and parity tests.
- [ ] 2.3 In acceptance, require the root version to equal the update report's `releaseVersion`, the plan's release notes to equal the report's release notes evidence, and the data date to be on or before the acceptance date. Verify with targeted acceptance tests that a mismatched version or release notes object blocks acceptance.
- [ ] 2.4 Add a root layout load that gives the registry and the release to every page. Remove the duplicate registry loads from the page routes. Verify with the site type check and the rendered footer that restaging changes the displayed version, date, and article together.

## 3. Routes and reader navigation

- [ ] 3.1 Move `MapExplorer` to `/map/` and make `/` the hub. Update map head metadata and all internal map URL producers, including `map-links.ts`, `LocationLinks.svelte`, `CompendiumSearch.svelte`, and the 404 and coverage pages. Search for all root map query links before completion. Verify `/map/?selected=...` round-trips and `/?selected=...` stays on the hub without a redirect.
- [ ] 3.2 Build the hub with one search field above map, level-based places, classes, crafting and gathering, and all currently published browse lists. Link crafting and gathering to Recipes, Skills, crafting skill pages, and the gathering categories of the map. Verify in the browser that a ranged place shows only its published bounds, an unbounded place remains in the Places list, and no level advice appears.
- [ ] 3.3 Replace the ungrouped top links in `PageShell.svelte` with World, Items, and Character disclosure menus in their agreed order. Put a published paged kind without a group into Reference. Keep empty groups hidden. Verify keyboard and pointer access to all published links at 1440 px and 390 px without horizontal overflow.
- [ ] 3.4 Render the selected publication's version, data date, and exact Steam article in the shared footer and in the map sidebar. Derive the search placeholder from searchable registry kinds and keep the loading spinner in the input. Verify both widths, the matching article target, and the placeholder with the current registry.
- [ ] 3.5 Improve `MapDevelopmentDetails.svelte` inside the existing `{#if dev}` branch. Show a page link only for a published page, a plain kind label, kind-specific published facts, and available placement facts. Keep raw JSON in closed disclosures. Verify a linked and unlinked selection in development and the absence of development cards and raw JSON in a production browser build.

## 4. Publication review and acceptance

- [ ] 4.1 Publish a candidate from the accepted catalog with a v3 plan and the verified release inputs. Stage it against the accepted publication. Verify the publication graph, entity coverage parity, build identity, no unexplained publication issues, and the root's version, date, and article.
- [ ] 4.2 Check the staged candidate in browsers at 1440 px and 390 px. Exercise hub search, every navigation group, level entries, browse links, `/map/` links and query state, footer, and development-only card behavior. Record working destinations, keyboard access, and absence of sideways scroll. Verify the production mode separately for the dev card gate.
- [ ] 4.3 Author the update report with the candidate identities and browser evidence. Accept the catalog and publication together. Verify the accepted descriptor names both and retains the previous publication as rollback. Do not deploy.

## 5. Final checks

- [ ] 5.1 Run scoped contract and publication checks, the site type check, applicable existing tests, and `openspec validate build-compendium-hub --strict`. Verify that each passes and that no old internal root map links or hard-coded release values remain.
