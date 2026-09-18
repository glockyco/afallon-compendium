## Context

See `proposal.md` for motivation. The facts that shape the approach:

- The sealed catalog (`packages/catalog/src/database.ts`) already holds canonical entities, `merchant_stock`, `loot_entries`, `resource_yields`, `quest_associations`, `transitions`, `conditions`, placements, and roles. Per-record game fields sit in `entity_details.publicData.gameplay` typed as `unknown`. `packages/scan/src/probes/collectors/support.csx` already exports 25 support families, including abilities, recipes, factions, currencies, enchantments, and gear sets.
- Publication (`packages/publication/src/entity-projection.ts`) turns `gameplay` into generic `PublicDetailSection` rows with a regex blacklist and auto-labels. `guide-projection.ts` produces the four native groups. `atlas-search.ts` indexes entity and item summaries plus placements; guide records are not indexed.
- The production atlas has no detail panel: `MapExplorer.svelte` gates `AtlasDevelopmentDetails` behind `dev`. The `/guide` routes are the only reference surface in production.
- The static graph is content-addressed and verified at selection and deployment (`StaticRootManifest`, `staticResourceEdges`, `apps/site/scripts/publication-graph.ts`). New resources must join that graph.
- The repository's spec convention: main specs under `openspec/specs/` are empty. Later changes restate a requirement under `## ADDED Requirements` with the same name. This change follows that convention; the proposal's "modified" list names the requirements that were restated.
- Public reference sites that work well converge on typed per-kind documents with named relation fields (for example the open `tarkov-api` schema: `Item.usedInTasks`, `Item.craftsFor`, `TaskObjective` as a typed union) or typed tables with declarative queries (MediaWiki Cargo on bg3.wiki and the PoE wiki). The sibling Ardenfall project's generic `entity_edges(predicate, label, weight, evidence_json)` graph shows the cost of the other route: relation lists without quantity, chance, or condition columns.

## Goals / Non-Goals

**Goals:**

- One publication-time model that serves pages, atlas panels, tooltips, and search from the same documents.
- Adding a kind is a schema, a catalog projection, a registry entry, and a thin page. No new link, search, or list machinery per kind.
- Every link is resolved and audited before the site builds. The site never resolves names.
- Relation values (quantity, chance, price, requirement) appear identically on both endpoint pages.

**Non-Goals:**

- A generic relation renderer or an entity-attribute-value store.
- A browser-side SQLite or a request-time API. The site stays static.
- Reader-facing provenance chips, coverage counts, or diagnostics on entity pages.
- Pages for placement-only categories (towns, forts, camps, containers, resource nodes). They remain atlas placements and appear as locations on entity pages.
- Planner features (build lists, leveling routes). They can consume the documents later.
- Multi-game reuse. Kind schemas are Afallon's.

## Decisions

### 1. Typed documents per kind, relations as named row lists

Each published entity becomes one static document validated by a kind schema in `packages/contracts/src/public/`. Example shape:

```
PublicItem {
  ref: EntityRef, facts: ItemFacts,
  droppedBy: DropRow[], soldBy: VendorRow[], gatheredFrom: GatherRow[],
  inContainers: ContainerRow[], rewardedBy: QuestRewardRow[], givenBy: QuestGivenRow[],
  craftedBy: RecipeRow[], usedInRecipes: RecipeRow[], usedInQuests: QuestObjectiveRow[],
  locations: PlacementRef[], art: { icon?: ArtRef }
}
DropRow { source: EntityRef, min?: number, max?: number, chance?: number, levelBand?: LevelRange, requirements: RequirementRef[] }
VendorRow { counterpart: EntityRef, price: number, currency: EntityRef, requirements: RequirementRef[], placements: PlacementRef[] }
```

Row types are shared across kinds where the relation is symmetric: an NPC's `drops: DropRow[]` uses the same `DropRow` as an item's `droppedBy`, with `source` pointing the other way. Quest objectives are a discriminated union keyed by the native `TASK_TYPE`: `killNpc`, `getItem`, `talkTo`, `useItem`, `reachScene`, `learnAbility`, plus `unsupported` with the raw type name.

Alternatives considered: keep `PublicEntity.sections` (generic rows; cannot carry typed columns, cannot be searched or sorted); a generic edge table with a predicate registry (Ardenfall; uniform cards, no columns, five representations per link); a browser SQLite with runtime joins (Ancient Kingdoms; adds a worker, a second search DB, and runtime consistency work to a static site that already verifies a resource graph).

### 2. `EntityRef` is the only link contract

```
EntityRef { key: string, kind: PublicKind, name: string, slug: string, icon?: ArtRef }
UnresolvedRef { key: null, label: string }
```

Publication builds one `Map<entityKey, EntityRef>` before projecting any document. `name` is disambiguated per kind: when two entities share a display name, both get a suffix with a distinguishing fact (level, then place, then native id). `slug` is `kebab(name)` with a `-<nativeId>` suffix on collision. The map is frozen; every projection reads from it. The audit runs after projection: every `EntityRef.key` in every document must be an emitted document, or selection fails. `UnresolvedRef` rows are counted in coverage and rendered as text.

Alternative: resolve links in site load functions from the entity index (current approach for loot labels in `GuideBossDetails`). Rejected: the site would recompute names, and unpublished targets would surface as dead links at runtime.

### 3. Kind registry in the publication root

`StaticRootManifest.kinds` lists each kind with `label`, `plural`, `route`, `icon`, `searchable`, `columns`, and `facets`. The site's `[kind]` routes read it: `/[kind]/+page.ts` prerenders every registered kind's list, `/[kind]/[slug]/+page.ts` prerenders every entry from `StaticRootManifest.pages`. Per-kind Svelte components stay thin: a fact card component per kind and a fixed ordering of relation tables. Relation table components (`DropTable`, `VendorTable`, `GatherTable`, `QuestTable`, `RecipeTable`, `AbilityPhases`, `LocationList`) are shared across kinds because their row types are shared.

Alternatives: a fully data-driven page (registry declares blocks and columns for everything) was rejected because fact cards differ too much between kinds and a declarative layout language would reproduce Svelte badly; hand-authored pages per kind (Ancient Kingdoms' 2,300-line item page) were rejected because relation rendering would drift between kinds.

### 4. Reverse relations come from catalog queries at publication

`packages/catalog/src/queries.ts` gains per-family queries that return rows with both endpoints (`queryDropRows`, `queryVendorRows`, `queryGatherRows`, `queryQuestRows`, `queryRecipeRows`, `queryContainment`). Projection groups each family by endpoint into the document's named lists. No second relation store exists; the catalog stays the single source (existing requirement "The catalog is the normalized source of truth").

### 5. Typed catalog facts replace the opaque payload

`packages/catalog/src/decoders.ts` gains per-kind decoders that read the canonical record's `gameplay` object into typed facts under the existing typed-decoding boundary. New tables: `item_facts`, `item_stats`, `item_sockets`, `npc_facts`, `npc_stats`, `npc_ability_phases`, `npc_faction_rewards`, `quest_facts`, `quest_objectives`, `quest_rewards`, `place_facts`, `property_facts`, `ability_facts`, `recipe_facts`, `recipe_materials`. Each row keeps the provenance reference of its canonical record. Unsupported enum values and unresolved ids become coverage issues, not defaults. Support families listed in the `canonical-catalog` delta become canonical kinds through the existing `SupportSchema` tables in `normalize.ts`.

### 6. Route scheme and kinds

| Kind | Route | Source records | List facets |
|---|---|---|---|
| items | `/items/` | canonical items | slot, type, rarity, level requirement, source kind, stat |
| npcs | `/npcs/` | all `RPGNpc` records | role (boss, enemy, neutral, merchant, quest giver, townsfolk), level, place, faction |
| quests | `/quests/` | canonical quests | chain, level requirement, giver place, repeatable |
| places | `/places/` | scenes and region templates | type (dungeon, zone, region), level range, guide inclusion |
| properties | `/properties/` | canonical properties | place, income |
| abilities | `/abilities/` | support abilities referenced by NPC phases or item actions | used by |
| recipes | `/recipes/` | support recipes | station, skill, produced item type |

NPC roles are facets on one kind rather than separate kinds because the same `RPGNpc` record can be a merchant and a quest giver, and marker categories already use these role names. Scenes and regions share the `places` kind with a `placeType` fact because both carry level ranges and guide metadata and both are what a player calls "a place".

### 7. Search corpus

`StaticEntitySearch` parts are regenerated from the `EntityRef` map for every searchable kind, with `kind`, `level`, `primaryPlace`, and `placementIds`. `StaticItemSearch` folds into the same parts. The atlas loads the same parts it loads today; readiness budgets are unchanged because search already loads after map data. A page-side search box reuses `atlas-search.ts` ranking with results that open pages, and offers the map location when `placementIds` is non-empty.

### 8. Lists

Each kind gets one compact list resource: an array of rows with `ref`, the registry's column values, and facet values. Lists are prerendered as HTML tables from that resource and hydrate for sort, facet, and text filter with state in the URL query. A list resource for 1,076 items with 10 columns is under 300 KB uncompressed and loads only on the list page.

### 9. Artwork

A new scan collector `artwork.csx` reads each referenced `Sprite` through a readable copy (`Graphics.Blit` to a temporary `RenderTexture`, then `Texture2D.ReadPixels`), encodes PNG bytes, and stores them as content-addressed evidence with the native asset name, entity family and id, and dimensions. Unreadable textures record a reason. The catalog registers assets in a new `artwork_assets` table with entity bindings. Publication derives sized WebP variants (icon 128 px, portrait 512 px, artwork 1600 px wide) with sharp, writes them to `/data/art/<sha256>.webp`, and references them by `ArtRef { url, sha256, bytes, width, height }`. The lossless PNG stays in the evidence store. Guide art for dungeons and regions comes from the fields the native `AdventureGuidePanel` reads; the task that adds the collector names those fields after inspecting `RPGGameScene` and `RegionTemplate`.

### 10. Production atlas panel

A new `AtlasDetailPanel` renders the selected entity's fact card, the first five rows of each relation table, the location, and a page link. It loads the entity document from `/data/` on selection through `AtlasDataLoader`. `AtlasDevelopmentDetails` stays behind `dev`. The `no-details` class and the production stale-selection paragraph in `MapExplorer.svelte` move into the panel.

### 11. Evidence limits

Documents omit unmeasured values. Relation table cells render a `MissingValue` component with a fixed, field-specific explanation ("Not measured for this build", "No location is published"). The coverage page renders `StaticCoverage`. No document carries free-text limitation notes.

### 12. Guide cutover

Guide contracts (`PublicAdventureGuide*`, `GuideDocument`, `StaticGuideDocument`), `guide-projection.ts`, `guide-resources.ts`, `GuideBrowser.svelte`, `GuideBossDetails.svelte`, `guide-load.ts`, and the `/guide` routes are removed. Redirects: a `_redirects` entry for each section path, and a prerendered `/guide/bosses/` and `/guide/dungeons/` page that reads `?id=` and navigates using a published key-to-path map, because query redirects cannot be static. Task 6a.10 in `build-screenshot-first-map` is marked superseded by this change.

### 13. Verification boundaries

`packages/contracts/src/public/static.test.ts` gains schema fixtures per kind. `publication-parity.ts` refuses a candidate that drops published pages or artwork. The deploy smoke test requests one page per kind, one list, the coverage page, and one redirect. `PUBLICATION_SCHEMA_VERSION` moves to `compendium.publication.v14`.

## Risks / Trade-offs

- [Sprite textures are not CPU-readable under IL2CPP] → Blit to a `RenderTexture` and read back; record unreadable sprites as unsupported so the target still succeeds; publish pages without art.
- [Disambiguated names look odd] → Suffix only on collision, prefer level and place before native id, and keep the raw name in the fact card.
- [Document size for merchants with large stock or bosses with long loot tables] → Rows are compact references; the largest merchant table holds seven items per tier in current evidence. Enforce a per-document byte budget in the graph check and split only if a real document exceeds it.
- [Prerendering more than 2,000 pages slows the site build] → Pages load one document each; `entries()` reads the page list once. Measure the build in the representative run and record the time in `EXPLORATION.md`.
- [Search parts grow with new kinds] → Search loads after map readiness. Keep the essential-resource budget unchanged and record the new search byte size.
- [Two link shapes creep back in] → One `EntityRef` schema registered once; the audit rejects documents with unregistered reference shapes; contract tests forbid `name`-only references.
- [Typed decoders reject records that earlier generic rows tolerated] → Unsupported values become coverage issues with the record path, consistent with the existing decoding requirement; preview mode continues to publish.
- [Guide-excluded scenes appear as places without art] → Intended. The place page shows the kind icon and the scene's facts.

## Migration Plan

1. Land contracts, catalog decoders, and publication projections behind the new schema version; run catalog and publish against the fresh selected store.
2. Land the site routes, panel, and redirects; stage the candidate; run parity, graph verification, and the preview.
3. Deploy once. The old `/guide` paths redirect; no external URL breaks.
4. Rollback: redeploy the previous publication root with `verify:deployment`. The previous root still passes graph verification; the parity gate must be run with the prior baseline.

## Open Questions

- Which native fields hold dungeon and region guide art. Resolved during the artwork collector task by reading `AdventureGuidePanel` and the record types; it changes only that collector.
- Whether tooltips prefetch documents on hover intent or on first hover. Decided during the tooltip task by measuring document sizes; it does not change the contracts.
