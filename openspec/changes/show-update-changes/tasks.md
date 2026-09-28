## 1. Verify comparison evidence

- [ ] 1.1 Open both retained SQLite catalogs read-only. Confirm their build and catalog identities, table support, and page-key overlap. Query known rows as positive controls before declaring a field or kind absent. Record which older fields cannot be compared. Verify a query report identifies build 25434619 and build 25419293, 3,764 shared canonical keys, and unsupported older progression tables.
- [ ] 1.2 Inspect `item_sources`, related authored relations, and the publication's source rendering. Identify which participant keys represent an authored source and which keys change during rescans. Verify with read-only queries from both catalogs and one positive authored-source example before defining the comparable source fields. Mark any unproved source field not comparable rather than guessing.
- [ ] 1.3 Confirm the exact 0.16.2.1 Steam news title, app ID, and returned link with the news API. Check a later news page or explicit no-match case if the first page lacks a version. Verify that 0.16.2 and 0.16.2.1 resolve to different news IDs and that a network failure is not treated as a no-match result.

## 2. Catalog comparison

- [ ] 2.1 Add a reader comparison projector that validates both sealed catalog inputs and projects only comparable published facts. Use stable authored identities and the current page-grouping rules. Verify a focused test detects a changed quest reward with old and new labels and does not classify an unsupported older fact as added.
- [ ] 2.2 Compare grouped page membership and public page coverage. Resolve current page links from the candidate search index. Verify focused tests for an NPC split or merge, a removed page without a dead link, and a record with no reachable published page.
- [ ] 2.3 Exclude placement positions, placement/source identities, capture paths, provenance, scan timestamps, and image hashes. Compare an authored source relation by stable participants. Verify a coordinate-only rescan yields no game change while an added merchant source yields a changed item.

## 3. Publication contracts and workflow

- [ ] 3.1 Add a typed update resource, a root index of retained build references, and a publish-plan input for the previous catalog and news decision in `packages/contracts/src/public/`. Verify schema tests reject duplicate build IDs, mismatched compared identities, and malformed Steam links.
- [ ] 3.2 Add a build-time Steam news lookup and seal the matched or no-match decision as evidence. Bind the exact title `Afallon ${releaseVersion}` and app 2597810 to the returned entry. Verify focused tests distinguish 0.16.2 from 0.16.2.1 and reject an unrelated host or a failed API request.
- [ ] 3.3 Publish the generated current comparison and carry forward only verified accepted comparison history. On same-build republication, retain the prior comparison. Verify a focused publication test excludes an unaccepted candidate, preserves a prior accepted page, and does not create a same-build diff.
- [ ] 3.4 Extend graph verification to follow update resources, check their current root identity and previous catalog identity, and validate every current page link. Verify that an absent resource, duplicate build page, wrong catalog, or unpublished link fails publication validation.
- [ ] 3.5 Bind the previous catalog and reader comparison to the update report and acceptance check. Keep the operator's build comparison separate. Verify focused acceptance tests reject a missing or mismatched reader comparison without changing the selected catalog, publication, or stage.

## 4. Reader page

- [ ] 4.1 Add `/updates/<build-id>` and a retained-update index using staged publication resources. Show version, compared build, comparison coverage, grouped page and fact changes, and a clear no-change state. Verify in the browser that a removed page has a readable name without a broken link and that fact labels contain no record IDs.
- [ ] 4.2 Connect the current What changed link to the C1 hub or footer and provide C1's footer patch-notes link from the same verified news metadata. Do not change C1's grouped navigation or dev-only map cards. Verify in the browser that both links open the current version and that notes from a different version are never linked.
- [ ] 4.3 Review the current and retained update pages at 1440 px and 390 px. Verify the page has no sideways scroll, long fact values remain readable, external notes links are safe, and prior pages load without browser SQLite or Steam requests.

## 5. Candidate and acceptance

- [ ] 5.1 Build a catalog candidate for the accepted 25434619 inputs. Scan again only if this change requires new captured inputs. Compare its rows with the accepted catalog, including a separate scan-only section. Verify all differences are explained before publication.
- [ ] 5.2 Generate the reader comparison against retained catalog object `232c4816…` for build 25419293. Verify reported additions, removals, and fact changes against read-only catalog queries. Check that missing older progression tables appear as not comparable, not as new game content.
- [ ] 5.3 Publish a candidate with the catalog candidate, news evidence, and comparison. Stage it against the accepted publication and check graph, parity, map, search, entity, relation, and update routes. Verify browser behavior at 1440 px and 390 px, and record any publication issues.
- [ ] 5.4 Write the update report with current and previous catalog identities, operator comparison, reader comparison, news evidence, and browser results. Accept the catalog and publication together. Verify the accepted descriptor names both candidates and retains the previous publication for rollback. Do not deploy.
