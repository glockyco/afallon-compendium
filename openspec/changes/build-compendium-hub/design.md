## Context

See proposal.md for the reader problem. `apps/site/src/routes/+page.svelte` renders `MapExplorer` at `/`. `PageShell.svelte` links Map to `/` and renders every paged registry kind as an ungrouped link. `CompendiumSearch.svelte`, `LocationLinks.svelte`, and `map-links.ts` form map query links at `/`. `MapDevelopmentDetails.svelte` already puts raw document and placement JSON in disclosures, but its heading says "Development evidence". The card uses `TooltipPresenter` for published kind facts. `MapExplorer.svelte` guards the card with `{#if dev}` (all in `apps/site/src`).

The accepted publication 60415893 has 42 place pages: 37 zones and 5 dungeons. All 5 dungeons and 19 zones have a `facts.levelRange` with numeric bounds. These 24 pages match the 24 authored ranges in `place_facts` of the accepted catalog 6bc13a4c. The other 18 place pages have no range. Every page route is prerendered (`apps/site/src/routes/+layout.ts`), and the server loader caches each resource (`MapDataLoader`, `apps/site/src/lib/map-data.ts`).

The update receipt, the update report, and the accepted descriptor all name release 0.16.2.1. The update report points to its release notes as registered evidence: the Steam news item with gid 1844115010501029, title "Afallon 0.16.2.1", app 2597810, and date 2026-09-21T10:48:37Z (run 0b880954, object `824d3d7e…`). Its public article, `https://store.steampowered.com/news/app/2597810/view/1844115010501029`, returns HTTP 200. The static publication root has only `buildId` and `catalogId` (`packages/contracts/src/public/resources.ts`).

## Goals / Non-Goals

**Goals:**
- Keep the hub driven by the selected publication and keep every published place reachable through its list.
- Keep release identity and its matching article attached to the selected publication, including preview staging.
- Make the map route cutover complete without preserving old query URLs.

**Non-Goals:**
- Infer character suitability or overworld zone rules from place level ranges.
- Add a mechanics document, talent UI, zone tab, page kind, or guide ranking.
- Expose development cards in production.
- Change the catalog. This change touches only the publication and the site.

## Decisions

### Read published place pages when the hub is built

The hub route loads the published place pages at build time and keeps the pages that have a level range. Because the hub reads the pages, each place that it shows has a published page. A separate hub resource would repeat these facts and need its own schema, graph edge, and parity rule. The route is prerendered, so no reader request loads the place pages. A place without a range remains in the Places list.

The hub orders places neutrally by lower bound, upper bound, and name. Dungeons appear as cards with their artwork and their bosses. Zones with the same recorded range form one band, and a bar shows each range on one level scale. The hub does not recommend a place.

### Show game artwork where it carries the hub

Place pages carry wide artwork, and NPC pages carry portraits. The publication has one size of each image, and the 24 places with a range carry 2.1 MiB of artwork. The hub therefore shows full artwork only in the hero and on the dungeon cards. The place with the name of the world gives the hero image. Boss portraits, class icons, and skill icons complete the page, and the zone bands stay text.

The sections run from search and the map through dungeons and their bosses, zones by level, classes, and crafting and gathering to the directory of every list. Map services such as merchants have no hub entry, because the map filters them.

The hub also reads the class and skill lists, the coverage counts, and the list size of each published kind. The crafting and gathering entry links crafting skills, Recipes, Skills, and the gathering categories of the map. It does not promise a mechanics page before `publish-crafting-and-gathering`. Search appears once, in the hero at the top of the hub content. `PageShell` suppresses its header search on home, so the page has no two fields with the same label and identifier.

### Move the map without route compatibility code

Place the `MapExplorer` route at `/map/`, and replace the home route with the hub. Update `map-links.ts`, `LocationLinks.svelte`, `CompendiumSearch.svelte`, the 404 and coverage pages, and every other internal map URL found by search. Keep existing query parameter names and map-state parsing. `writeMapUrl` keeps the path of the current URL, so the map writes its state on `/map/`. Give the map its own title. Do not read map parameters on home. Do not add redirects or old-route aliases. The logo in the map sidebar links to the hub.

### Use disclosure menus at every width

Use one ordered group definition in the shared shell: World (Map, Places, NPCs, Quests, Properties), Items (Items, Recipes), Character (Classes, Skills, Abilities), Reference, and Mechanics. Resolve links through the published registry. Suppress empty groups. A published paged kind without a group goes to Reference, so the menu never hides a published kind. Later changes place their kinds and pages in these groups.

Each group is a disclosure: a `details` element with a `summary` button and a list of links. The groups work without JavaScript. With JavaScript, one group opens at a time, and Escape, an outside click, focus that leaves the group, or a navigation closes it. The labeled groups do not fit one header row at 1440 px: the header is 72rem wide, and the labels and ten links need about 800 px beside the logo and search. Reference and Mechanics add more links later. Disclosures therefore suit both widths, and one pattern serves both. The hub remains the full directory with counts.

### Bind footer metadata to the release evidence

The publish plan (`compendium.publish-plan.v3`) gains a `release` object: the release version, the date of the data, and the content identity of the registered release notes. The publish step verifies the release notes object in the store and reads it as a Steam news item. It derives the article title, the article date, and the store URL `https://store.steampowered.com/news/app/<app>/view/<gid>`. It rejects a data date before the article date. The root (`compendium.static-root.v5`) carries `release` with the version, the data date, and the article.

The data date is a plan input, not a clock value, so the same plan gives the same publication. The operator records the date on which the candidate is published. The accepted descriptor's `acceptedAt` is the date of acceptance, and it exists only after the publication. It therefore cannot supply the data date.

Acceptance checks the chain. The root version must equal the update report's `releaseVersion`. The plan's release notes must be the report's release notes evidence. The root release must equal the release that the plan and those release notes give, because readers see the root. The data date must not be after the acceptance date. A hotfix article can have a title without the version, so the checks compare evidence identities and do not parse titles. The shell renders metadata from the selected root, not from site constants, the numeric build ID, a local clock, or `_deployment.json`. A root layout load gives the registry and the release to every page, including the map and 404 pages.

The candidate reuses the accepted catalog 6bc13a4c and its presentation, because no catalog fact changes. The earlier title-case change used the same path. The publication still needs a staged candidate, browser review, and joint acceptance of the unchanged catalog and the new publication.

### Keep selection cards development-only

Keep `{#if dev}` at `MapExplorer.svelte`. Add a page link only if the selected document has a published slug and kind route. Replace "Development evidence" with a plain kind or placement label. Reuse the existing `TooltipPresenter` kind dispatch for brief published facts, and show placement label, category, level, and map where available. Leave both full JSON values closed in their existing disclosures. This avoids a second fact renderer and does not claim that every placement has a page.

## Risks / Trade-offs

- A place has authored level bounds but no published page. → The hub reads only published pages; the Places list retains all published places.
- A Steam article belongs to another release. → The plan names the release notes object, and acceptance requires the update report to name the same object.
- The root schema changes from v4 to v5. → The candidate readers accept v5. The baseline reader follows references by shape, so the retained v4 publication stays readable for parity.
- A disclosure menu adds one click to each destination. → The hub lists every destination with its count, and the menu scales to the later groups.
- Old `/?selected=` shares stop selecting. → This is the requested clean cut; update all internal producers and check `/map/` query round trips.

## Migration Plan

Verify the release evidence and the place pages. Implement the root and plan contracts, the publish step, acceptance checks, routes, shell, hub, and card. Publish a candidate from the accepted catalog with a v3 plan, and stage it against the accepted publication. Check the hub, map, navigation, search, footer, and development and production cards in the browser at 1440 px and 390 px. Author the update report and accept the catalog and publication together. Retain the previous publication as rollback. Do not deploy as part of this change.
