import { expect, test } from "bun:test";
import { Assert } from "typebox/value";
import {
  ArtRefSchema, DropRowSchema, EntityRefSchema, RequirementGroupSchema, GatherRowSchema, ContainerRowSchema, QuestObjectiveRowSchema, RecipeRowSchema, VendorRowSchema,
  PUBLIC_DOCUMENT_SCHEMAS, STATIC_DOCUMENT_SCHEMA_IDS, StaticRootManifestSchema, StaticSearchIndexSchema, StaticKindListSchema,
  assertStaticPublicationSemantics, staticResourceEdges, collectRefs,
  type ArtRef, type EntityRef, type PublicDocument, type PublicItem, type PublicNpc, type PublicQuest, type PublicPlace, type PublicProperty, type PublicAbility, type PublicRecipe, type PublicGearSet,
  type StaticRootManifest, type StaticSearchIndex, type StaticKindList, type StaticResource, type UnresolvedRef, type StaticItemDocumentSchema, type StaticCoverage,
} from "./index";
import type { Static } from "typebox";

const identity = { buildId: "build", catalogId: "b".repeat(64) };
const art: ArtRef = { url: `art/${"c".repeat(64)}.webp`, sha256: "c".repeat(64), bytes: 12, width: 64, height: 64 };
const item: EntityRef = { key: "items:1", kind: "items", name: "Peasant Gloves", slug: "peasant-gloves", icon: art };
const boss: EntityRef = { key: "npcs:286", kind: "npcs", name: "Kraath the Hivebreaker", slug: "kraath-the-hivebreaker" };
const gold: EntityRef = { key: "currencies:0", kind: "currencies", name: "Gold Coin" };
const unresolved: UnresolvedRef = { key: null, label: "Unknown item 9999" };
const placement = { placementId: "p1", mapSpaceId: "map", label: "Duskfall Depths" };

test("references are keyed and typed; name-only shapes are rejected", () => {
  Assert(EntityRefSchema, item);
  Assert(EntityRefSchema, gold);
  Assert(ArtRefSchema, art);
  expect(() => Assert(EntityRefSchema, { name: "Peasant Gloves" })).toThrow();
  expect(() => Assert(EntityRefSchema, { key: "items:1", name: "Peasant Gloves" })).toThrow();
  expect(() => Assert(EntityRefSchema, { ...item, kind: "widgets" })).toThrow();
  expect(() => Assert(EntityRefSchema, { ...item, slug: "Peasant Gloves" })).toThrow();
  expect(() => Assert(EntityRefSchema, { ...item, href: "/items/peasant-gloves/" })).toThrow();
});

test("a requirement group carries its mode, its target and its threshold", () => {
  const group = { mode: "any", requiredCount: 1, requirements: [{ type: "Class", label: "Warrior", target: { key: "classes:0", kind: "classes", name: "Warrior" } }, { type: "Class", label: "Assassin", target: { key: "classes:5", kind: "classes", name: "Assassin" } }] };
  Assert(RequirementGroupSchema, group);
  Assert(RequirementGroupSchema, { mode: "all", requirements: [{ type: "Level", label: "Level 27", amount: 27 }] });
  expect(() => Assert(RequirementGroupSchema, { ...group, requirements: [] })).toThrow();
  expect(() => Assert(RequirementGroupSchema, { ...group, mode: "either" })).toThrow();
  expect(() => Assert(RequirementGroupSchema, { mode: "all", requirements: [{ type: "Class", label: "Warrior", mandatory: true }] })).toThrow();
});

test("relation rows accept an unresolved endpoint and omit an unmeasured chance", () => {
  const drop = { counterpart: unresolved, min: 1, max: 2, requirements: [] };
  Assert(DropRowSchema, drop);
  Assert(DropRowSchema, { ...drop, counterpart: boss, chance: 12.5, levelBand: { min: 18, max: 20 } });
  expect(() => Assert(DropRowSchema, { ...drop, chance: 101 })).toThrow();
  expect(() => Assert(DropRowSchema, { ...drop, placements: [placement] })).toThrow();
  expect(() => Assert(DropRowSchema, { ...drop, chance: null })).toThrow();
  Assert(VendorRowSchema, { counterpart: item, price: { amount: 45, currency: gold }, requirements: [{ mode: "all", requirements: [{ type: "Stat", label: "Item power 400", target: { key: "stats:53", kind: "stats", name: "Item power" }, amount: 400 }] }] });
  Assert(GatherRowSchema, { label: "Copper vein", rank: 1, min: 1, max: 2, placementCount: 345 });
  Assert(ContainerRowSchema, { counterpart: unresolved, label: "Chest", requirements: [], placementCount: 53 });
  Assert(RecipeRowSchema, { counterpart: item, count: 1 });
  Assert(QuestObjectiveRowSchema, { counterpart: boss, objective: { index: 0, label: "Kill 3 Branchweavers", type: "killNpc", target: boss, count: 3 } });
  Assert(QuestObjectiveRowSchema, { counterpart: boss, objective: { index: 1, label: "?", type: "unsupported", rawType: "customTask" } });
  expect(() => Assert(QuestObjectiveRowSchema, { counterpart: boss, objective: { index: 0, label: "x", type: "killNpc", target: boss } })).toThrow();
});

const base = { description: null, art: {} };
const located = { ...base, locations: [placement] };
const fixtures: { [K in keyof typeof PUBLIC_DOCUMENT_SCHEMAS]: PublicDocument } = {
  items: { ...base, ref: item, facts: { rarity: "Common", itemType: "ARMOR", slot: "GLOVES", stats: [{ stat: { key: "stats:20", kind: "stats", name: "Armor" }, amount: 7, isPercent: false }], randomStats: [{ stat: { key: "stats:0", kind: "stats", name: "Health" }, min: 10, max: 40, isPercent: false, whole: false, chance: 100 }], randomStatsMax: 0, sockets: [{ gemType: "Green Gem" }], sellPrice: { amount: 5, currency: gold }, stackLimit: 1, questDropOnly: false, corruptionToken: false, requirements: [] },
    droppedBy: [{ counterpart: boss, min: 1, max: 1, requirements: [] }], soldBy: [], gatheredFrom: [], inContainers: [], rewardedBy: [], givenBy: [], craftedBy: [], usedInRecipes: [], usedInQuests: [] } satisfies PublicItem,
  npcs: { ...located, ref: boss, facts: { level: 21, scalesWithPlayer: false, roles: ["boss"], stats: [], immunities: [], lootSpecialization: { armorType: "PLATE", weaponTypes: ["AXE"] } }, drops: [{ counterpart: item, min: 1, max: 1, requirements: [] }], sells: [], quests: [], abilityPhases: [{ phaseIndex: 0, name: "Bug boss", abilities: [] }], factionRewards: [], usedInQuests: [], bossOf: [] } satisfies PublicNpc,
  quests: { ...base, ref: { key: "quests:10", kind: "quests", name: "The Bonebind Ritual", slug: "the-bonebind-ritual" }, facts: { repeatable: false, turnInWithoutNpc: false, requirements: [] }, givers: [boss], turnIns: [], objectives: [{ index: 0, label: "Kill 3 Branchweavers", type: "killNpc", target: boss, count: 3 }], itemsGiven: [], rewards: [{ counterpart: item, count: 1, choice: false }], rewardChoices: [], chainQuests: [] } satisfies PublicQuest,
  places: { ...base, ref: { key: "scenes:10", kind: "places", name: "Duskfall Depths", slug: "duskfall-depths" }, facts: { placeType: "dungeon", levelRange: { min: 18, max: 20 }, guideIncluded: true }, space: { mapSpaceId: "duskfall", regionIds: [] }, bosses: [boss], creatures: [], npcs: [], services: [], resources: [], containers: [], quests: [], properties: [], connections: [], regions: [] } satisfies PublicPlace,
  properties: { ...located, ref: { key: "properties:1", kind: "properties", name: "Mill", slug: "mill" }, facts: { income: 60 } } satisfies PublicProperty,
  abilities: { ...base, ref: { key: "abilities:194", kind: "abilities", name: "Blacktar Eruption", slug: "blacktar-eruption" }, facts: {}, usedBy: [boss], taughtBy: [] } satisfies PublicAbility,
  gearSets: { ...base, ref: { key: "gearSets:17", kind: "gearSets", name: "Adept Leather", slug: "adept-leather" }, facts: { memberCount: 7 }, members: [item], tiers: [{ equipped: 3, stats: [{ stat: { key: "stats:20", kind: "stats", name: "Armor" }, amount: 10, isPercent: true }] }] } satisfies PublicGearSet,
  recipes: { ...base, ref: { key: "recipes:81", kind: "recipes", name: "Aetherial Elixir", slug: "aetherial-elixir" }, facts: {}, product: { counterpart: item, count: 1 }, materials: [] } satisfies PublicRecipe,
};

test("every kind document validates and rejects unknown properties", () => {
  for (const [kind, schema] of Object.entries(PUBLIC_DOCUMENT_SCHEMAS)) {
    const document = fixtures[kind as keyof typeof fixtures];
    Assert(schema, document);
    expect(() => Assert(schema, { ...document, sections: [] })).toThrow();
    expect(() => Assert(schema, { ...document, facts: { ...document.facts, extra: 1 } })).toThrow();
  }
  expect(collectRefs(fixtures.items).map((ref) => ref.key)).toEqual(["items:1", "stats:20", "stats:0", "currencies:0", "npcs:286"]);
});

test("a v3 root reaches documents and artwork through graph edges and passes semantics", () => {
  const ref = (schemaId: string, sha: string) => ({ path: `resources/${sha}.json`, sha256: sha, bytes: 10, schemaId });
  const itemDocument: Static<typeof StaticItemDocumentSchema> = { schemaVersion: "compendium.static-item.v1", ...identity, kind: "items", document: fixtures.items as PublicItem };
  const npcDocument = { schemaVersion: "compendium.static-npc.v1", ...identity, kind: "npcs", document: fixtures.npcs as PublicNpc } as const;
  const itemReference = ref(STATIC_DOCUMENT_SCHEMA_IDS.items, "1".repeat(64)), npcReference = ref(STATIC_DOCUMENT_SCHEMA_IDS.npcs, "2".repeat(64));
  const search: StaticSearchIndex = { schemaVersion: "compendium.static-search.v3", ...identity, part: 0, entries: [{ ref: item, hasPlacements: false, sourceKinds: ["npc-loot"], document: itemReference as never }, { ref: boss, level: 21, hasPlacements: true, sourceKinds: [], document: npcReference as never }] };
  const itemList: StaticKindList = { schemaVersion: "compendium.static-kind-list.v1", ...identity, kind: "items", part: 0, rows: [{ ref: item, values: { level: null, rarity: "Common" }, facets: { slot: ["GLOVES"] } }] };
  const npcList: StaticKindList = { schemaVersion: "compendium.static-kind-list.v1", ...identity, kind: "npcs", part: 0, rows: [{ ref: boss, values: { level: 21 }, facets: { role: ["boss"] } }] };
  const coverage: StaticCoverage = { schemaVersion: "compendium.static-coverage.v1", ...identity, complete: false, unresolvedIssueCount: 0, occurrenceCount: 0, exclusionCount: 0, messages: [] };
  const map = { schemaVersion: "compendium.static-map.v2", ...identity, mapSpaceId: "map", part: 0, placements: [["p1", [0, 0], 0, "Duskfall Depths", ["boss"], ["npcs:286"], [], null, null, null]], regions: [] } as const;
  const imagery = { schemaVersion: "compendium.static-imagery.v2", ...identity, mapSpaceId: "map", defaultLayerId: "game", layers: [{ id: "game", mapSpaceId: "map", label: "Game", kind: "game-map", tileSize: 256, minZoom: 0, maxZoom: 0, extent: [0, 0, 1, 1], tiles: [{ z: 0, x: 0, y: 0, url: `assets/${"d".repeat(64)}.webp`, sha256: "d".repeat(64), bytes: 1, width: 1, height: 1, state: "captured", schemaId: "image/webp" }] }] } as const;
  const root: StaticRootManifest = {
    schemaVersion: "compendium.static-root.v3", ...identity, mode: "preview", complete: false,
    world: { mapSpaceId: "world", label: "Afallon", bounds: { min: { x: 0, y: 0 }, max: { x: 1, y: 1 } }, offsets: [{ mapSpaceId: "map", worldX: 0, worldY: 0, source: "native", status: "placed" }], unplacedMapSpaceIds: [] },
    maps: [{ mapSpaceId: "map", label: "Map", bounds: { min: { x: 0, y: 0 }, max: { x: 1, y: 1 } }, parts: [ref("compendium.static-map.v2", "5".repeat(64)) as never], optionalGeometry: [], imagery: ref("compendium.static-imagery.v2", "6".repeat(64)) as never }],
    kinds: [
      { kind: "items", label: "Item", plural: "Items", route: "items", icon: "item", pages: true, searchable: true, columns: [{ id: "rarity", label: "Rarity", sortable: true, numeric: false }], facets: [{ id: "slot", label: "Slot" }] },
      { kind: "npcs", label: "NPC", plural: "NPCs", route: "npcs", icon: "npc", pages: true, searchable: true, columns: [{ id: "level", label: "Level", sortable: true, numeric: true }], facets: [{ id: "role", label: "Role" }] },
      { kind: "currencies", label: "Currency", plural: "Currencies", route: "currencies", icon: "currency", pages: false, searchable: false, columns: [], facets: [] },
      { kind: "stats", label: "Stat", plural: "Stats", route: "stats", icon: "stat", pages: false, searchable: false, columns: [], facets: [] },
    ],
    lists: { items: [ref("compendium.static-kind-list.v1", "7".repeat(64)) as never], npcs: [ref("compendium.static-kind-list.v1", "8".repeat(64)) as never] },
    search: [ref("compendium.static-search.v3", "9".repeat(64)) as never],
    coverage: ref("compendium.static-coverage.v1", "e".repeat(64)) as never,
  };
  Assert(StaticRootManifestSchema, root);
  Assert(StaticSearchIndexSchema, search); Assert(StaticKindListSchema, itemList);
  const values = new Map<string, StaticResource>([
    [root.search[0]!.path, search], [root.lists.items![0]!.path, itemList], [root.lists.npcs![0]!.path, npcList], [root.coverage.path, coverage],
    [itemReference.path, itemDocument], [npcReference.path, npcDocument as never], [root.maps[0]!.parts[0]!.path, map as never], [root.maps[0]!.imagery.path, imagery as never],
  ]);
  const rootEdges = staticResourceEdges(root).map((edge) => edge.path);
  expect(rootEdges).toContain(root.search[0]!.path);
  expect(staticResourceEdges(search).map((edge) => edge.path)).toEqual([itemReference.path, npcReference.path]);
  expect(staticResourceEdges(itemDocument)).toEqual([{ path: art.url, sha256: art.sha256, bytes: art.bytes, schemaId: "image/webp" }]);
  assertStaticPublicationSemantics(root, values);

  const dropped = new Map(values); dropped.delete(npcReference.path);
  dropped.set(root.search[0]!.path, { ...search, entries: search.entries.filter((entry) => entry.ref.kind !== "npcs") });
  expect(() => assertStaticPublicationSemantics(root, dropped)).toThrow("unpublished entity npcs:286");
  const sluggedCurrency = new Map(values);
  sluggedCurrency.set(itemReference.path, { ...itemDocument, document: { ...itemDocument.document, facts: { ...itemDocument.document.facts, sellPrice: { amount: 5, currency: { ...gold, slug: "gold-coin" } } } } });
  expect(() => assertStaticPublicationSemantics(root, sluggedCurrency)).toThrow("page-less kind carries a slug");
  const unknownPlacement = new Map(values);
  unknownPlacement.set(itemReference.path, { ...itemDocument, document: { ...itemDocument.document, droppedBy: [{ counterpart: { ...boss, key: "npcs:999" }, requirements: [] }] } });
  expect(() => assertStaticPublicationSemantics(root, unknownPlacement)).toThrow("unpublished entity npcs:999");
});
