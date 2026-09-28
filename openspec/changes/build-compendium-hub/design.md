## Context

See proposal.md for the reader problem. `apps/site/src/routes/+page.svelte` renders `MapExplorer` at `/`. `PageShell.svelte` links Map to `/` and renders every paged registry kind as an ungrouped link. `CompendiumSearch.svelte`, `LocationLinks.svelte`, and `map-links.ts` form map query links at `/`. `MapDevelopmentDetails.svelte` already puts raw document and placement JSON in disclosures, but its heading says "Development evidence". The card uses `TooltipPresenter` for published kind facts. `MapExplorer.svelte` guards the card with `{#if dev}` (all in `apps/site/src`).

The accepted catalog has 5 dungeon and 37 zone place facts. All 5 dungeons and 19 zones have authored level bounds (`sqlite3 -readonly` on catalog object `33/3d602d72…`, `SELECT place_type, count(*), sum(level_min IS NOT NULL AND level_max IS NOT NULL) FROM place_facts GROUP BY place_type`). A published place page already holds `facts.levelRange` when present (`packages/publication/src/documents.ts`, `projectPlace`). The place list holds a display range, but not numeric level bounds (`packages/publication/src/lists.ts`, `placeRow`). These counts do not prove that each fact has a published page.

`packages/contracts/src/update-report.ts` gives an accepted build a `releaseVersion` and `acceptedAt`, and gives its update report a `recordedAt` and release-notes evidence pointer. The static publication root has only `buildId` and `catalogId` (`packages/contracts/src/public/resources.ts:175-185`). `apps/site/scripts/stage-publication.ts` stages that root and emits deployment metadata without a release version or date. The exact Steam article URL for this accepted version has not been verified in these files. This is an open evidence check, not a game fact.

## Goals / Non-Goals

**Goals:**
- Keep the hub driven by the selected publication and keep every published place reachable through its list.
- Keep release identity and its matching article attached to the selected publication, including preview staging.
- Make the map route cutover complete without preserving old query URLs.

**Non-Goals:**
- Infer character suitability or overworld zone rules from place level ranges.
- Add a mechanics document, talent UI, zone tab, page kind, or guide ranking.
- Expose development cards in production.

## Decisions

### Publish a small hub index for places

Project a static hub resource from published place documents. It contains page references and numeric authored level bounds only for places that have both. Link the hub resource from the publication root and check each reference against a published place page in the publication graph. The hub uses the existing kind registry for browse links, so it never hides a published kind because of a fixed menu. A place without bounds remains in the Places list. This avoids parsing the formatted range text in a list row or loading every place document for each hub request. The route renders a neutral ordered list by lower and upper bounds, not a recommendation. The resource and root receive new schema versions, and their graph and parity readers accept the previous retained baseline by field shape.

The crafting and gathering entry points to Recipes, Skills, and the resource categories on `/map`. It does not promise a mechanics page before `publish-crafting-and-gathering`. Classes link to the existing Classes list. Search appears once, at the top of the hub content. `PageShell` suppresses its header search on home to avoid two fields with the same label and identifier. Search remains in the header on reference pages.

### Move the map without route compatibility code

Place the `MapExplorer` route at `/map`, and replace the home route with the hub. Update `map-links.ts`, `LocationLinks.svelte`, `CompendiumSearch.svelte`, map sidebar links, and every other internal map URL found by search. Keep existing query parameter names and map-state parsing on `/map`. Give the map its own title and canonical sharing URL. Do not read map parameters on home. Do not add redirects or old-route aliases. The map sidebar links back to `/`.

### Use stable navigation groups with a narrow disclosure

Use one ordered group definition in the shared shell: World (Map, Places, NPCs, Quests, Properties), Items (Items, Recipes), Character (Classes, Skills, Abilities), Reference, and Mechanics. Resolve links through the published registry where applicable. Suppress empty groups. At 1440 px, show labeled groups with visible links. At 390 px, offer keyboard-operable group disclosures that fit the viewport. Later changes populate Reference and Mechanics without changing this ownership. Keep Map as a route link, not a page kind. Map retains its immersive layout and a clear link to the hub.

### Bind footer metadata to the release evidence

Use the current build's update report as the source for `releaseVersion`. Cross-check it against the update receipt and accepted descriptor before authoring the publication candidate. Verify the exact Steam news article against the registered release notes and that version. Feed its verified URL and the version into the publication input with evidence pointers. Record the publication candidate creation date as the data date. The root carries these three typed values. Validate the URL and version against the reviewed release evidence and final update report before acceptance. The shell renders metadata from the selected root, not from site constants, the numeric build ID, a local clock, or an independent `_deployment.json`. The map sidebar may show a compact form of the same facts. If the article cannot be verified, do not substitute a generic Steam index and do not accept the candidate.

The accepted descriptor's `acceptedAt` is the date of acceptance, not the date of published data. This is why it does not supply the footer data date. A candidate that changes only publication metadata still needs the full candidate cycle: catalog rebuild from accepted scan inputs, row comparison against accepted catalog object `33/3d602d72…`, publication staging against the accepted publication, browser review, and joint acceptance. No new scan is necessary unless input evidence proves incomplete.

### Keep selection cards development-only

Keep `{#if dev}` at `MapExplorer.svelte`. Add a page link only if the selected document has a published slug and kind route. Replace "Development evidence" with a plain kind or placement label. Reuse the existing `TooltipPresenter` kind dispatch for brief published facts, and show placement label, category, level, and map where available. Leave both full JSON values closed in their existing disclosures. This avoids a second fact renderer and does not claim that every placement has a page.

## Risks / Trade-offs

- A place has authored level bounds but no published page. → The hub index includes only confirmed page references; the Places list retains all published places.
- A Steam title resembles the version but belongs to another release. → Verify the exact article and its release before publication, and block acceptance on mismatch.
- New root and hub resource schemas affect graph and stage parity. → Test the new resource reference and compare coverage with the retained publication before acceptance.
- A compact navigation hides destinations at 390 px. → Check pointer and keyboard entry to every published group and measure horizontal overflow at 1440 px and 390 px.
- Old `/?selected=` shares stop selecting. → This is the requested clean cut; update all internal producers and check `/map` query round trips.

## Migration Plan

Verify the release evidence, build a catalog candidate from accepted inputs, and compare its rows with the accepted catalog. Implement the new publication resource, metadata, route, shell, and card. Publish the candidate and stage it against the accepted publication. Check the hub, map, navigation, search, footer, and development and production cards in the browser at 1440 px and 390 px. Author the update report and accept catalog and publication together. Retain the previous publication as rollback. Do not deploy as part of this change.
