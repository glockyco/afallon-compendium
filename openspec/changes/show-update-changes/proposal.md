## Why

Readers cannot see which published facts changed between Afallon builds. The update report serves operators, but the site needs a reader-facing comparison and a link to the matching Steam patch notes.

## What Changes

- Add a "What changed" page at `/updates/<build-id>` for each accepted build with a retained comparison. Show added, removed, and changed published pages and reader-facing facts. Keep a small archive of retained accepted-build pages.
- Compare the accepted catalog with the previous build's retained catalog. Exclude scan-only changes such as placement coordinates, source identities, and evidence provenance. Separate unavailable historical data from actual game additions.
- Match Steam news to the accepted release version by exact title. Publish a verified Steam patch-notes link, not the news text as game data.
- Put the comparison and matched news reference into the static publication before acceptance. Reuse the update workflow's candidate, report, browser review, and joint catalog-publication acceptance. Update the hub/footer links without taking ownership of the grouped navigation.
- Automatic deployment is out of scope.

## Capabilities

### New Capabilities

- `update-changes`: Published build comparisons, historical update pages, and matching patch-notes links.

### Modified Capabilities

- `game-update-workflow`: A new-build candidate includes and verifies its reader-facing comparison before selection. The comparison remains distinct from the operator's reconciliation report.

## Impact

- Publication contracts, publication generation, graph verification, and the site update route and links.
- The update command and accepted-build workflow, which must bind the two catalogs and the matched Steam news entry to the candidate.
- The existing accepted catalog is build 25434619. Its retained comparison baseline is build 25419293. A read-only SQL join finds 3,764 shared canonical entity keys and no added or removed canonical entity keys. That count does not establish that reader-facing facts are unchanged.
