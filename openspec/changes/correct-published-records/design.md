## Context

See `proposal.md` for the motivation. The accepted catalog is `6bc13a4c`, and the accepted publication is `5f9bea82`. The presentation input `compendium.publication-presentation.v1` holds world offsets and spatial bounds only (`packages/contracts/src/public/resources.ts:326-336`).

`buildEntityReferences` gives every catalog record a reference. A class that no race offers gets a reference without a page (`packages/publication/src/references.ts:295-314`). The graph check rejects a document link to a page kind without a published page (`packages/contracts/src/public/graph.ts:122-130`). Projections omit relation rows for classes without a page, and requirement phrases name such a class without a link. Name qualification uses every record of a name, with or without a page (`references.ts:267-287`).

Staging parity compares entity keys and rejects every missing baseline key (`apps/site/scripts/publication-parity.ts:175-200`). Staging reads only the candidate publication and the baseline publication (`apps/site/scripts/stage-publication.ts:28-41`).

Class starting items are progression facts of each class. The publication projects them only onto class pages (`packages/publication/src/documents.ts:940`). The hub hides skills without levels through its own rule (`apps/site/src/routes/+page.server.ts`, commit `c5a26e8`).

Read-only queries of the accepted catalog found the evidence in the proposal. The scene catalog of the accepted scan matches 30 of 42 scene records to a scene file of the build. The other 12 match no build scene, and no Addressables location of the 31 captures holds a scene. Four of the 12 are overworld zones with regions in `Coalway outdoors.unity`: Coalway Woods, Coalway Swamp, Sylvan Thickets, and Chillwind Heights. They stay published under `publish-overworld-zones`.

## Goals / Non-Goals

**Goals:**
- Hide reviewed internal records from every reader surface and keep them in the catalog.
- Make each exclusion fail loudly when a later catalog contradicts its evidence.
- Show class starting gear as an item source.

**Non-Goals:**
- No exclusion of a record whose only evidence is a missing source. Item and dialogue game actions can still give such records.
- No change to the catalog, the scan, or map placements.
- No redirects for the page addresses that lose a qualifier.

## Decisions

### Keep the exclusion list in the presentation input

The exclusion list is an editorial decision about publication, not a game fact. The catalog therefore keeps every record, so coverage, conditions, and later changes still see them. Each entry holds a catalog key, a reason code, and evidence text. The reason codes are `test-record`, `appearance-option`, `unplaced-record`, `unloadable-scene`, `character-creation-scene`, and `progress-flag`. The schema rejects an entry without evidence, an unknown reason code, and a duplicate key.

A catalog-side filter would remove the records from coverage and from the conditions that name them. A site-side filter would leave them in search, counts, and the published graph.

### Treat an excluded record like a class without a page

An excluded record keeps a reference without a page, as an unoffered class does. Relation rows omit it, and a requirement phrase names it without a link. The graph check then rejects any document that still links it. The same selection removes the record from lists, search, and counts.

Excluded records leave name qualification before it starts. A published record that shared its name only with excluded records then takes the base name. Its slug follows the new name, and the old address gets no redirect under `entity-identity`.

### Check each exclusion again against the catalog

Each kind has one check that restates the evidence in catalog terms. An excluded item has no source that an item page would show, including class starting gear. An excluded NPC has no placement and no spawn candidate. An excluded scene has no placement and no map space. An excluded recipe has no material and no product. An excluded skill has a highest level of zero and is not added automatically.

The publication fails and names the entry when a check fails or when the catalog lacks the key. A game update that makes a test item obtainable therefore stops the publication instead of hiding the item. A written reason alone would not detect this.

### Publish the exclusion keys for staging parity

The candidate publishes a small static resource with the excluded keys and their reason codes. The root references it, and the site never loads it. The graph check rejects a key that is both excluded and published. Parity accepts a missing baseline key only when this resource names it.

The root manifest could hold the list, but every page load would then carry it. Staging could read the presentation input from the artifact store, but staging reads only publication roots today.

### Decide scene records from load evidence

The scene catalog compares entry names with build scene paths only. It does not prove that the game loads a scene by its entry name. A bounded native analysis of the teleport scene load finds the record field that names the scene. A read-only HotRepl probe calls `Application.CanStreamedLevelBeLoaded` for the entry name of each of the 42 records.

A scene record leaves the publication only when it cannot load, no region carries its name, and it has no placement. Froststone Cliffs, Searing Plains, Stonefield Basin, Tutorial Catacombs, and Tutorial ICE cave are the candidates. The two frost challenge stones in the overworld teleport to scene records without a scene file. An in-game check shows whether a player can use them. If they fail, the two scene records leave, and their connection rows disappear with them. The stone markers stay, because the objects exist in the world.

Test Area needs only the scene catalog result and its name. The Void is the character creation scene. It has no placement and no transition, so it has no content for a place page.

### Derive starting gear from class facts

The publication builds an item-to-class index from the starting items of each class that has a page. Each row keeps the class reference, the count, and the equipped flag. The item document schema gains a required `startingGearOf` array, and its version increases. Coverage and item source kinds count starting gear as a source. Starting gear of a class without a page does not count, because no player can choose that class.

### Remove the hub rule for skills without levels

The hub counts a skill with recipes as a crafting skill. The extra highest-level rule from `c5a26e8` existed only for Savers, so it goes with this change.

## Risks / Trade-offs

- An exclusion can hide real content. → Each entry carries evidence, the publication checks it again, and records with only a missing source stay published.
- Scene load evidence can miss a loading path. → The runtime probe, the native analysis, and the Addressables result must agree before a scene record leaves.
- Two place addresses change. → Parity compares entity keys, not addresses. The Steam guide links the map, not these pages.
- The frost challenge stones may work through a path that the probe misses. → The in-game check uses the stones themselves.

## Migration Plan

Author the v2 presentation input from the accepted v1 input and the verified exclusion entries. Publish a candidate from the accepted catalog `6bc13a4c`. Stage it against the accepted publication `5f9bea82` with the new parity rule. Check the affected pages in the browser at 1440 px and 390 px. Write an update report and accept the publication. The accepted catalog does not change. The former publication stays as the rollback.
