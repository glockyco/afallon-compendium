## Context

See proposal.md for the motivation. The accepted-build descriptor records build 25434619, release 0.16.2.1, and catalog 6bc13a4c (`artifacts/accepted-build.json`). The retained catalog object `232c4816…` identifies build 25419293 (`catalog_metadata`). A read-only join on `canonical_entities.entity_key` found 3,764 common keys and no added or removed keys. Only two common canonical rows have unequal names, descriptions, or `details_json` (NPCs 0 and 326, both in `details_json`). This does not measure normalized facts or their meaning. The older catalog lacks the `progression_facts` table and related progression tables. A missing table cannot prove that the game added those facts.

`packages/publication/src/build.ts` writes a root and referenced static resources. `packages/contracts/src/public/graph.ts` checks their reachability and page links. NPC and ability pages group several entity keys (`packages/publication/src/grouping.ts`). `apps/compendium-cli/src/accept-update.ts` validates a report, stages a candidate, and updates its accepted descriptor with rollback. The update report already points at an operator build comparison (`packages/contracts/src/update-report.ts`). It is not a reader-facing diff. Steam news API `ISteamNews/GetNewsForApp/v2/?appid=2597810` returned separate entries titled "Afallon 0.16.2" and "Afallon 0.16.2.1" on 2026-09-28.

## Goals / Non-Goals

**Goals:**
- Generate a stable, useful comparison from two verified catalogs before acceptance.
- Preserve comparison pages for accepted builds when future publications replace the current one.
- Keep patch notes separate from catalog evidence and from the operator report.

**Non-Goals:**
- Automatic deployment or remote fetches during a reader request.
- Claims that every release-note change appears in static authored data.
- A patch-history page for a build with no verified previous catalog.

## Decisions

### Compare stable page and fact projections, not SQLite bytes

Read both catalogs as read-only inputs. Validate each catalog identity and its sealed artifact manifest. Derive the same set of comparable, reader-facing fields from each catalog. Use stable entity keys and the publication's NPC and ability grouping rules. Match groups by overlapping member keys. A split or merge produces explicit membership changes, not a false run of disappeared NPCs. List authored name, description, stats, rewards, recipe ingredients and products, source relations, and other supported published facts. Normalize display labels and sort unordered relations before comparison. Record each field as a named typed value, not a raw JSON path or internal id. Limit comparisons to fields whose meaning exists in both input schemas. Mark an older unsupported field or kind as not comparable. Compare page coverage against both catalogs and the current public page registry. Keep records with no reachable page visible as coverage, not silently dropped. A new page kind without an older authored-data contract is not a game addition.

Do not compare `build_id`, source or placement identity, coordinates, evidence provenance, scan timestamps, file paths, or image hashes. A merchant source can still change: compare the merchant's authored entity identity and the item's relation, not `source_key` or placement IDs. Show added and removed facts as changes of an existing page, with old and new values where present. For an absent page, show the prior readable name and no dead link. Resolve links through the candidate's published search entries, not by guessing slugs. Compare the actual published page cohort before reporting a page as added or removed. A raw table diff is retained for operator reconciliation but rejected as reader copy.

Alternative: compare published JSON documents from two releases. That mixes site changes, captured map positions, and document schema changes with game changes. The catalog projection separates the authored facts from presentation.

### Make the update document a publication resource

Extend the publish plan with verified references to the compared catalog and a normalized Steam news decision. The candidate publisher generates one typed update resource per retained accepted comparison. The current resource records current and compared build and catalog identities, coverage, grouped changes, and patch metadata. The root contains a small index of build IDs and resource references. The resource uses the current root's publication identity, with historical build identities inside its payload. On later builds, copy verified historical comparison payloads into current-build resources and rebind their outer identity. This meets the graph's root identity rule without pretending that the historical comparison describes the current catalog. A same-build republication reuses that build's comparison instead of comparing the build with itself. Do not import a rejected candidate's resource into the archive. The graph validates resource edges, unique build IDs, compared identities, current links, and document sizes. An archive with no verified baseline is omitted, rather than invented.

Alternative: fetch two SQLite files in SvelteKit when a reader opens the page. That breaks static staging and would expose large catalogs to the browser. Alternative: store only an operator report. Its scan-level differences are not suitable for readers.

### Resolve patch notes once, before publication

The update command retrieves Steam news for app 2597810 before publication. Search the bounded API pages by exact title `Afallon ${releaseVersion}`. Validate the returned app ID and Steam news URL. Record the title, URL, news ID, publication date, full query result reference, and match decision as an artifact. If no match exists after an exhaustive bounded search, record an explicit no-match decision. If the API fails, leave the candidate unready until the lookup is retried or a verified Steam news artifact is supplied. Never take game facts from the news body. The publisher reads only this evidence artifact, so builds remain reproducible. The C1 footer patch-notes link and this page read the same metadata. The C1 grouped navigation stays unchanged.

Alternative: search title substrings in the browser. Version `0.16.2` would also match `0.16.2.1`, and remote data could change after acceptance.

### Bind comparison to update acceptance

The CLI's candidate update sequence records previous/current catalog identities, builds the catalog candidate, reconciles row differences, retrieves Steam news, publishes the comparison with the candidate, stages against the accepted publication, and checks the browser. Extend the update report with a pointer to the reader comparison and the compared catalog. Keep `artifacts.buildComparison` for operator reconciliation. Before acceptance, verify that the report, publication root, comparison, news decision, current catalog, and previous retained catalog agree. Accept the catalog and publication together. Do not deploy automatically. For the first backfill, compare the current accepted 25434619 catalog against retained 25419293, then stage the replacement candidate against the accepted 25434619 publication. Future updates take their previous catalog from the accepted descriptor. Same-build republishing carries forward the verified comparison.

## Risks / Trade-offs

- The older build lacks progression tables. → Mark affected facts as not comparable. Verify table support and a positive known-row control before declaring a kind empty.
- Grouping rules can change between site releases. → Compare member key sets under one grouping implementation and report ambiguous split or merge membership.
- A source changes scan identity. → Compare authored participants and relations. Check a coordinate-only rescan and a real merchant change as separate fixtures.
- Steam news can be missing or unavailable. → Keep an explicit lookup decision. Never link a nearby version or use news prose as game facts.
- Historical documents can grow. → Keep root references small, lazy-load each build, and enforce a per-resource budget.

## Migration Plan

Add the contracts, comparison projector, graph checks, news retrieval, update workflow binding, and site pages. Build a candidate for accepted build 25434619 from the two retained catalog objects. Compare its rows with the accepted catalog. Stage against the accepted publication. Review at 1440 px and 390 px. Accept the catalog and publication together with an update report, and retain the previous publication for rollback. Deployment stays a separate action.
