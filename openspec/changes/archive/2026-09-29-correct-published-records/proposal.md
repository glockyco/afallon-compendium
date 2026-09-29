## Why

The site publishes internal game records as real content. These are test items, character appearance options, NPC records that no scene places, scenes that players cannot enter, and the Savers progress flags. Class pages list starting gear, but the item pages of that gear name no source. Both problems need only the accepted catalog, so the fix can ship before the next game scan.

## What Changes

- The publication presentation gains a reviewed exclusion list in `compendium.publication-presentation.v2`. Each entry names a catalog key, a reason, and its evidence. The catalog keeps every record.
- An excluded record gets no page, list row, search entry, or count. A relation row whose counterpart is excluded disappears. A requirement that names an excluded record shows the name without a link.
- The publication checks the evidence of each exclusion again against the catalog. It fails when the evidence no longer holds, for example when an excluded item gains a source after a game update.
- Staging parity accepts the removal of a listed record and rejects all other removals.
- The first list holds records with complete evidence:
  - Savers: the skill and its 13 recipes. The recipes use and make no items. All 407 Recipe requirements in the captured world conditions name four of them, and those requirements switch world objects and the Lysander companion.
  - 5 items with test or developer names: Teleport Test Area, Scythe Test, Staff Test, and two Dev Rings. Nothing drops, sells, crafts, or rewards them.
  - 30 character appearance options in the Hair, Face, Facial hair, Brows, Tattoo, ear piercing, and nose piercing slots. Nothing drops, sells, crafts, or rewards them. The Character creation scene applies them through 30 `ArmorEquipTrigger` components, one for each option.
  - Two NPC records with no role, placement, quest, loot, or stock: SM_hc_Inn, a model name, and Iron Vein Icon.
  - Two scenes: Test Area, and The Void, which is the character creation scene.
- Review candidates stay published until evidence decides them. Five scene records match no build scene, and their reachability is unresolved: Froststone Cliffs (published as "Unnamed Place"), Searing Plains, Stonefield Basin, Tutorial Catacombs, and Tutorial ICE cave. Effects target Searing Plains and Tutorial ICE cave. The two frost challenge stones in the overworld teleport to unmatched scene records. The Task board gives a quest but has no name or placement. Ten items have outlier stats or placeholder names but no test name: four Speed rings, Ring of Immortality, Skull Necklace, Armor Ring, Auto Attack Ring, Random, and Boss Tele. A load check and an in-game check decide the scenes; the item review waits for `publish-item-uses-and-sources`.
- Excluded records take no part in name qualification. If both tutorial scenes leave, "Coalway Catacombs (Level 15–30)" and "Glacier Cave (Level 20–30)" lose their qualifiers, and their page addresses change without redirects.
- Item pages show a "Starting gear of" How to get it line for each published class that starts with the item. The line links the Starting gear section of the class page. 28 items gain this source. 11 of them have no other known source.
- The hub stops hiding skills without levels, because Savers leaves the publication.
- Out of scope: 20 records with no known source and no test name stay published. These are the ten items above, Giant Mace, Giant Sword, Great Crystal Sword, Life Eater, four Starter armor pieces, Rune Shield, and Forest Demon Quest. An item source investigation of build 25434619 found no grant path for 18 of them in the scanned sources. Rune Shield is starting gear only of Berserker, which no race offers. Forest Demon Quest occurs only in a loot table without a known owner. `publish-item-uses-and-sources` records a decision for each of them.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `entity-identity`: A reviewed exclusion list keeps internal records unpublished, and excluded records take no part in name qualification.
- `game-update-workflow`: Publication parity accepts the removal of a record that the exclusion list names.
- `item-property-presentation`: Item pages show class starting gear as a source.
- `reader-coverage`: An item that is starting gear of a published class does not count as an item without a known source.
- `detail-pages`: The skill page example of a skill without levels no longer names Savers.

## Impact

- Contracts: `compendium.publication-presentation.v2` with exclusion entries in `packages/contracts/src/public/resources.ts`. The item document gains starting-gear rows.
- Publication: record selection, name qualification, references, lists, search, coverage, and item source rows in `packages/publication/src`.
- Site: the item page section, its How to get it line, and the hover summary in `apps/site/src/lib`. The hub skill rule in `apps/site/src/routes/+page.server.ts`.
- Staging: parity in `apps/site/scripts/publication-parity.ts` reads the exclusion list of the candidate.
- Evidence: a read-only HotRepl probe and bounded native analysis of scene loading, and an in-game check of the frost challenge stones.
- Artifacts: a new presentation input, a publication candidate staged against the accepted publication, an update report, and acceptance. The accepted catalog stays unchanged.
