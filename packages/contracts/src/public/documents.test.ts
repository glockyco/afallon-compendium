import { expect, test } from "bun:test";
import { Assert } from "typebox/value";
import {
  ArtRefSchema, ConnectionRowSchema, DropRowSchema, EntityRefSchema, RequirementGroupSchema, GatherRowSchema, ContainerRowSchema, QuestObjectiveRowSchema, RecipeRowSchema, VendorRowSchema,
  PUBLIC_DOCUMENT_SCHEMAS, STATIC_DOCUMENT_SCHEMAS, STATIC_DOCUMENT_SCHEMA_IDS, StaticRootManifestSchema, StaticSearchIndexSchema, StaticKindListSchema,
  assertStaticPublicationSemantics, staticResourceEdges, collectRefs,
  type ArtRef, type EntityRef, type PublicDocument, type PublicItem, type PublicNpc, type PublicQuest, type PublicPlace, type PublicProperty, type PublicAbility, type PublicRecipe, type PublicClass, type PublicSkill, type CharacterProgression, type HeroicTier, type MechanicsRule, type CraftingAndGathering, type PublicGatheringNode,
  type StaticRootManifest, type StaticSearchIndex, type StaticKindList, type StaticResource, type UnresolvedRef, StaticItemDocumentSchema, type StaticCoverage,
} from "./index";
import type { Static } from "typebox";

const identity = { buildId: "build", catalogId: "b".repeat(64) };
const art: ArtRef = { url: `art/${"c".repeat(64)}.webp`, sha256: "c".repeat(64), bytes: 12, width: 64, height: 64 };
const item: EntityRef = { key: "items:1", kind: "items", name: "Peasant Gloves", slug: "peasant-gloves", icon: art };
const boss: EntityRef = { key: "npcs:286", kind: "npcs", name: "Kraath the Hivebreaker", slug: "kraath-the-hivebreaker" };
const gold: EntityRef = { key: "currencies:0", kind: "currencies", name: "Gold Coin" };
const unresolved: UnresolvedRef = { key: null, label: "Unknown item 9999" };
const placement = { placementId: "p1", mapSpaceId: "map", label: "Duskfall Depths" };
const requirement = (type: string, label: string, fields: Record<string, unknown> = {}) => ({ type: { value: 0, name: type }, rule: { value: 0, name: "Mandatory" }, label, spans: [{ text: label }], ...fields });
const legacySchemaIds = {
  items: "compendium.static-item.v5", npcs: "compendium.static-npc.v3", quests: "compendium.static-quest.v3", places: "compendium.static-place.v4",
  properties: "compendium.static-property.v2", abilities: "compendium.static-ability.v3", recipes: "compendium.static-recipe.v3", skills: "compendium.static-skill.v2",
} as const;

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

test("a requirement group carries worded requirements whose spans link the named entities", () => {
  const group = { mode: "any", checkCount: true, requiredCount: 1, requirements: [
    requirement("Class", "Warrior", { rule: { value: 1, name: "Optional" }, spans: [{ ref: { key: "classes:0", kind: "classes", name: "Warrior" } }] }),
    requirement("Class", "Assassin", { rule: { value: 1, name: "Optional" }, spans: [{ ref: { key: "classes:5", kind: "classes", name: "Assassin" } }] }),
  ] };
  Assert(RequirementGroupSchema, group);
  Assert(RequirementGroupSchema, { mode: "all", checkCount: false, requirements: [requirement("Level", "Level 27 or higher")] });
  expect(() => Assert(RequirementGroupSchema, { mode: "all", checkCount: false, requirements: [requirement("Level", "Level 27", { spans: [] })] })).toThrow();
  expect(() => Assert(RequirementGroupSchema, { ...group, requirements: [] })).toThrow();
  expect(() => Assert(RequirementGroupSchema, { ...group, mode: "either" })).toThrow();
  expect(() => Assert(RequirementGroupSchema, { mode: "all", checkCount: false, requirements: [{ type: "Class", label: "Warrior" }] })).toThrow();
});

test("relation rows accept an unresolved endpoint and omit an unmeasured chance", () => {
  const drop = { counterpart: unresolved, min: 1, max: 2, requirements: [] };
  Assert(DropRowSchema, drop);
  Assert(DropRowSchema, { ...drop, counterpart: boss, chance: 12.5, tableChance: 5, tableMinimum: 1, tableLimit: 2, creatureLevel: { min: 18 } });
  expect(() => Assert(DropRowSchema, { ...drop, tableMinimum: 0 })).toThrow();
  expect(() => Assert(DropRowSchema, { ...drop, chance: 101 })).toThrow();
  expect(() => Assert(DropRowSchema, { ...drop, placements: [placement] })).toThrow();
  expect(() => Assert(DropRowSchema, { ...drop, chance: null })).toThrow();
  Assert(VendorRowSchema, { counterpart: item, price: { amount: 45, currency: gold }, requirements: [{ mode: "all", checkCount: false, requirements: [requirement("Stat", "Item power 400", { spans: [{ ref: { key: "stats:53", kind: "stats", name: "Item power" } }, { text: " 400" }] })] }] });
  Assert(GatherRowSchema, { label: "Copper vein", rank: 1, min: 1, max: 2, placementCount: 345 });
  Assert(ContainerRowSchema, { counterpart: unresolved, label: "Chest", availability: [{ effect: "requires", requirements: [{ mode: "all", checkCount: false, requirements: [requirement("Class", "Warrior")] }] }], placementCount: 53 });
  Assert(RecipeRowSchema, { counterpart: item, count: 1 });
  Assert(ConnectionRowSchema, { counterpart: unresolved, direction: "to", placements: [placement] });
  expect(() => Assert(ConnectionRowSchema, { counterpart: boss, kind: "effect-teleport", placements: [] })).toThrow();
  expect(() => Assert(ConnectionRowSchema, { counterpart: boss, direction: "both", placements: [] })).toThrow();
  Assert(QuestObjectiveRowSchema, { counterpart: boss, objective: { index: 0, text: "Kill 3 Branchweavers", completions: [], type: "killNpc", target: boss, count: 3 } });
  Assert(QuestObjectiveRowSchema, { counterpart: boss, objective: { index: 1, text: "?", completions: [], type: "unsupported", rawType: "customTask" } });
  expect(() => Assert(QuestObjectiveRowSchema, { counterpart: boss, objective: { index: 0, text: "x", completions: [], type: "killNpc", target: boss } })).toThrow();
});

const base = { description: null, art: {} };
const located = { ...base, locations: [placement] };
const rule: MechanicsRule = { id: "weapon-skill-hit", section: "skill-experience", status: "verified", phrase: "Each hit gives {hitExperience} experience.", operands: { hitExperience: 2 }, links: [], sources: [{ method: "SkillSystem.OnPlayerAutoAttackHit", evidence: "Bounded decompilation" }] };
const characterProgression: CharacterProgression = {
  ...base, ref: { key: "mechanics:character-progression", kind: "mechanics", name: "Character Progression", slug: "character-progression" }, topic: "character-progression",
  curve: { template: "Character levels", cap: 3, rows: [{ level: 1, toNext: 20 }, { level: 2, toNext: 40 }] },
  sources: { fixedCreatures: { count: 185, minLevel: 1, maxLevel: 30 }, scalingCreatures: { count: 31, aboveFixed: [{ creature: boss, level: { min: 1, scales: true } }] }, quests: { count: 136, maxLevel: 31, maxRequirement: 24, withoutRange: 4 }, levelModifiers: [{ lower: 0, higher: -30, creatures: 59 }] },
  talentPoints: [{ name: "Talent Points", start: 1, max: 180, gains: [{ trigger: "characterLevelUp", amount: 3 }] }], rules: [rule],
};
const heroicTier: HeroicTier = {
  ...base, ref: { key: "mechanics:heroic-tier", kind: "mechanics", name: "Heroic Tier", slug: "heroic-tier" }, topic: "heroic-tier",
  settings: { killExperienceMultiplier: 5, essencePoints: "Heroic Essence", essenceBaseAmount: 3, essencePerAffix: 3, essenceEliteMultiplier: 1.5, essenceRareMultiplier: 2, essenceBossMultiplier: 3, essenceHealthBaseline: 1, essenceHealthFactorMin: 0.25, essenceHealthFactorMax: 4,
    baseHealthMultiplier: 3, baseDamageMultiplier: 2, gearScoreCoefficient: 0.0008, maxGearBonus: 1, affixChance: 0.25, extraAffixChance: 0.08, maxAffixes: 4, rareGuaranteedAffixes: 1, affixLootDropMultiplier: 1.5, heroicGearStatBonusPercent: 50 },
  rules: [{ ...rule, id: "heroic-kill-rounding-ties", section: "kill-experience", status: "unknown", phrase: "The tie rule is not known.", operands: {} }],
};
const mining: EntityRef = { key: "skills:7", kind: "skills", name: "Mining", slug: "mining" };
const vein: EntityRef = { key: "gatheringNodes:small-iron-vein", kind: "gatheringNodes", name: "Small Iron Vein", slug: "small-iron-vein" };
const spawnerTiming = { skill: mining, skillCap: 150, respawnSeconds: 120, jitterSeconds: 30, despawnSeconds: 60, playerRange: 40 };
// A node that spawners and a scene both place, with a yield whose item has no record.
const gatheringNode: PublicGatheringNode = {
  ...base, ref: vein, facts: { skill: mining, requiredLevel: 1, skillExperience: 15, characterExperience: 4, requirements: [{ mode: "all", checkCount: false, requirements: [requirement("Skill", "Mining 1")] }], variant: false },
  yields: [{ counterpart: item, min: 1, max: 2, chance: 100 }, { counterpart: unresolved, min: 1, max: 1, chance: 5 }],
  spawners: [{ ...spawnerTiming, options: [{ node: vein, lowSkillWeight: 70, highSkillWeight: 24, teaserWeight: 0 }], spawners: 3, placements: [placement], unplaced: 2 }],
  placed: [{ cooldownSeconds: 300, objects: 1, placements: [placement], unplaced: 0 }], rules: [{ ...rule, id: "placed-node-cooldown", section: "node-availability", phrase: "A placed node becomes ready after its cooldown.", operands: {} }],
};
const craftingAndGathering: CraftingAndGathering = {
  ...base, ref: { key: "mechanics:crafting-and-gathering", kind: "mechanics", name: "Crafting and Gathering", slug: "crafting-and-gathering" }, topic: "crafting-and-gathering",
  rules: [{ ...rule, id: "recipe-experience-bands", section: "crafting-experience", phrase: "Half experience from +{halfFromLevels} levels.", operands: { halfFromLevels: 20 } }],
  spawnerExamples: [{ ...spawnerTiming, options: [{ node: vein, lowSkillWeight: 70, highSkillWeight: 24, teaserWeight: 0 }], spawners: 3 }],
};
const fixtures: { [K in keyof typeof PUBLIC_DOCUMENT_SCHEMAS]: PublicDocument } = {
  items: { ...base, ref: item, facts: { rarity: "Common", itemType: "ARMOR", slot: "GLOVES", stats: [{ stat: { key: "stats:20", kind: "stats", name: "Armor" }, amount: 7, isPercent: false }], randomStats: [{ stat: { key: "stats:0", kind: "stats", name: "Health" }, min: 10, max: 40, isPercent: false, whole: false, chance: 100 }], randomStatsMax: 0, sockets: [{ gemType: "Green Gem" }], sellPrice: { amount: 5, currency: gold }, stackLimit: 1, questDropOnly: false, corruptionToken: false, actionAbilities: [], useLines: [], equipmentRequirements: [], useConditions: [] },
    droppedBy: [{ counterpart: boss, min: 1, max: 1, requirements: [] }], soldBy: [], gatheredFrom: [], inContainers: [], collectedFrom: [], rewardedBy: [], givenBy: [], craftedBy: [], usedInRecipes: [], usedInQuests: [], startingGearOf: [] } satisfies PublicItem,
  npcs: { ...base, ref: boss, facts: { level: { min: 21, max: 21, scales: false }, roles: ["boss"], stats: [], immunities: [], lootSpecialization: { armorType: "PLATE", weaponTypes: ["AXE"] } }, variantFields: [], variants: [{ key: "npcs:286", anchor: "n286", label: "Duskfall Depths", facts: {} }],
    locations: [{ label: "Duskfall Depths", placements: [placement], availability: [], level: { min: 21, max: 21, scales: false }, variants: ["n286"], roles: ["boss"], quests: [] }], drops: [{ counterpart: item, min: 1, max: 1, requirements: [] }], sells: [], quests: [], abilityPhases: [{ phaseIndex: 0, name: "Bug boss", abilities: [] }], factionRewards: [], usedInQuests: [], bossOf: [] } satisfies PublicNpc,
  quests: { ...base, ref: { key: "quests:10", kind: "quests", name: "The Bonebind Ritual", slug: "the-bonebind-ritual" }, facts: { repeatable: false, turnInWithoutNpc: false, requirements: [] }, starts: [{ kind: "npc", npc: boss, areas: ["Duskfall Depths"] }], turnIns: [], objectives: [{ index: 0, text: "Kill 3 Branchweavers", completions: [], type: "killNpc", target: boss, count: 3 }], itemsGiven: [], rewards: [{ counterpart: item, count: 1, choice: false }], rewardChoices: [], chainQuests: [], unlocks: [], worldChanges: [] } satisfies PublicQuest,
  places: { ...base, ref: { key: "scenes:10", kind: "places", name: "Duskfall Depths", slug: "duskfall-depths" }, facts: { placeType: "dungeon", levelRange: { min: 18, max: 20 }, guideIncluded: true }, space: { mapSpaceId: "duskfall", regionIds: [] }, bosses: [boss], creatures: [], npcs: [], services: [], resources: [], containers: [], quests: [], questObjectives: [], properties: [], connections: [], regions: [] } satisfies PublicPlace,
  properties: { ...located, ref: { key: "properties:1", kind: "properties", name: "Mill", slug: "mill" }, facts: { income: { amount: 60, currency: gold }, incomeInterval: 300 } } satisfies PublicProperty,
  abilities: { ...base, ref: { key: "abilities:194", kind: "abilities", name: "Blacktar Eruption", slug: "blacktar-eruption" }, versions: [{ keys: ["abilities:194"], anchor: "n194", ranks: [{ rankIndex: 0, lines: [{ spans: [{ text: "Deals damage", tone: "damage", italic: false }] }] }], useRequirements: [], learnedBy: [], usedBy: [boss], taughtBy: [] }] } satisfies PublicAbility,
  // A rank with no base experience has no bands.
  recipes: { ...base, ref: { key: "recipes:81", kind: "recipes", name: "Aetherial Elixir", slug: "aetherial-elixir" }, facts: { learnedByDefault: false }, product: { counterpart: item, count: 1 }, materials: [],
    ranks: [{ rank: 1, requiredLevel: 1, baseExperience: 0, bands: [] }], taughtBy: [item] } satisfies PublicRecipe,
  classes: { ...base, ref: { key: "classes:0", kind: "classes", name: "Shieldmaster", slug: "shieldmaster" }, facts: { races: ["Dwarf"], weapons: ["Shield"], talentPoints: [{ name: "Talent Points", start: 1, max: 180, gains: [{ trigger: "characterLevelUp", amount: 3 }] }], highestLevel: 60 },
    trees: [{ anchor: "tree-18", name: "Aegis Mastery", points: "Talent Points", rows: [{ anchor: "talent-18-3", tier: 3, position: 2, name: "Aegis Discipline", ranks: 5,
      first: { rank: 1, stats: [{ stat: { key: "stats:125", kind: "stats", name: "Block Chance" }, amount: 2, isPercent: false }], text: [] }, last: { rank: 5, stats: [{ stat: { key: "stats:125", kind: "stats", name: "Block Chance" }, amount: 10, isPercent: false }], text: [] },
      requirements: [{ mode: "all", checkCount: false, requirements: [{ type: { value: 20, name: "Bonus" }, rule: { value: 0, name: "Mandatory" }, label: "Weighted Strikes rank 4 or higher", spans: [{ ref: { key: "classes:0", kind: "classes", name: "Weighted Strikes", slug: "shieldmaster", variant: "talent-18-1" } }, { text: " rank 4 or higher" }] }] }] }] }],
    startingGear: [{ item, count: 1, equipped: true }] } satisfies PublicClass,
  skills: { ...base, ref: { key: "skills:0", kind: "skills", name: "Alchemy", slug: "alchemy" }, facts: { highestLevel: 300, automatic: true }, recipes: [{ recipe: { key: "recipes:81", kind: "recipes", name: "Aetherial Elixir", slug: "aetherial-elixir" }, product: item }],
    gatheringNodes: [], experience: { crafting: true, gathering: false } } satisfies PublicSkill,
  mechanics: characterProgression,
  gatheringNodes: gatheringNode,
};

test("every kind document validates and rejects unknown properties", () => {
  for (const [kind, schema] of Object.entries(PUBLIC_DOCUMENT_SCHEMAS)) {
    const document = fixtures[kind as keyof typeof fixtures];
    Assert(schema, document);
    expect(() => Assert(schema, { ...document, sections: [] })).toThrow();
    if ("facts" in document) expect(() => Assert(schema, { ...document, facts: { ...document.facts, extra: 1 } })).toThrow();
  }
  expect(collectRefs(fixtures.items).map((ref) => ref.key)).toEqual(["items:1", "stats:20", "stats:0", "currencies:0", "npcs:286"]);
  for (const kind of Object.keys(legacySchemaIds) as (keyof typeof legacySchemaIds)[]) {
    const schema = STATIC_DOCUMENT_SCHEMAS[STATIC_DOCUMENT_SCHEMA_IDS[kind]];
    expect(() => Assert(schema, { schemaVersion: legacySchemaIds[kind], ...identity, kind, document: fixtures[kind] })).toThrow();
  }
});

test("every mechanics topic validates, and a mechanics document of an unknown topic or kind does not", () => {
  const schema = STATIC_DOCUMENT_SCHEMAS["compendium.static-mechanics.v2"];
  for (const document of [characterProgression, heroicTier, craftingAndGathering]) Assert(schema, { schemaVersion: "compendium.static-mechanics.v2", ...identity, kind: "mechanics", document });
  // A spawner example names no placements; the node pages list them.
  expect(() => Assert(PUBLIC_DOCUMENT_SCHEMAS.mechanics, { ...craftingAndGathering, spawnerExamples: [{ ...craftingAndGathering.spawnerExamples[0], placements: [] }] })).toThrow();
  Assert(PUBLIC_DOCUMENT_SCHEMAS.mechanics, { ...heroicTier, settings: { unavailable: "The scan of this build recorded no Heroic tier settings." } });
  expect(() => Assert(PUBLIC_DOCUMENT_SCHEMAS.mechanics, { ...heroicTier, topic: "corruption" })).toThrow();
  expect(() => Assert(schema, { schemaVersion: "compendium.static-mechanics.v2", ...identity, kind: "guides", document: characterProgression })).toThrow();
  expect(() => Assert(PUBLIC_DOCUMENT_SCHEMAS.mechanics, { ...characterProgression, rules: [{ ...rule, status: "inferred" }] })).toThrow();
});

test("an item names each published class that starts with it", () => {
  const classRef = (nativeId: number, name: string): EntityRef => ({ key: `classes:${nativeId}`, kind: "classes", name, slug: name.toLowerCase() });
  const staff = { ...fixtures.items as PublicItem, startingGearOf: [{ class: classRef(1, "Wizard") }, { class: classRef(3, "Necromancer") }, { class: classRef(6, "Druid") }] };
  Assert(PUBLIC_DOCUMENT_SCHEMAS.items, staff);
  Assert(PUBLIC_DOCUMENT_SCHEMAS.items, { ...staff, startingGearOf: [] });
  expect(collectRefs(staff.startingGearOf).map((ref) => ref.key)).toEqual(["classes:1", "classes:3", "classes:6"]);
  const withoutField: Partial<PublicItem> = { ...staff };
  delete withoutField.startingGearOf;
  expect(() => Assert(PUBLIC_DOCUMENT_SCHEMAS.items, withoutField)).toThrow();
  // A class without a page gives no row, so a row never holds an unresolved class.
  expect(() => Assert(PUBLIC_DOCUMENT_SCHEMAS.items, { ...staff, startingGearOf: [{ class: unresolved }] })).toThrow();
});

test("a v3 root reaches documents and artwork through graph edges and passes semantics", () => {
  const ref = (schemaId: string, sha: string) => ({ path: `resources/${sha}.json`, sha256: sha, bytes: 10, schemaId });
  const itemDocument: Static<typeof StaticItemDocumentSchema> = { schemaVersion: "compendium.static-item.v6", ...identity, kind: "items", document: fixtures.items as PublicItem };
  const npcDocument = { schemaVersion: "compendium.static-npc.v4", ...identity, kind: "npcs", document: fixtures.npcs as PublicNpc } as const;
  const itemReference = ref(STATIC_DOCUMENT_SCHEMA_IDS.items, "1".repeat(64)), npcReference = ref(STATIC_DOCUMENT_SCHEMA_IDS.npcs, "2".repeat(64));
  const search: StaticSearchIndex = { schemaVersion: "compendium.static-search.v4", ...identity, part: 0, entries: [{ ref: item, hasPlacements: false, sourceKinds: ["npc-loot"], document: itemReference as never }, { ref: boss, level: 21, hasPlacements: true, sourceKinds: [], document: npcReference as never }] };
  const itemList: StaticKindList = { schemaVersion: "compendium.static-kind-list.v2", ...identity, kind: "items", part: 0, rows: [{ ref: item, values: { level: null, rarity: "Common" }, facets: { slot: ["GLOVES"] } }] };
  const npcList: StaticKindList = { schemaVersion: "compendium.static-kind-list.v2", ...identity, kind: "npcs", part: 0, rows: [{ ref: boss, values: { level: 21 }, facets: { role: ["boss"] } }] };
  const coverage: StaticCoverage = { schemaVersion: "compendium.static-coverage.v2", ...identity, pages: [{ kind: "items", count: 1 }, { kind: "npcs", count: 1 }], mapCount: 1, placementCount: 1, gaps: [] };
  const map = { schemaVersion: "compendium.static-map.v3", ...identity, mapSpaceId: "map", part: 0, placements: [["p1", [0, 0], 0, "Duskfall Depths", ["boss"], ["npcs:286"], [], null, null, null]], regions: [] } as const;
  const imagery = { schemaVersion: "compendium.static-imagery.v2", ...identity, mapSpaceId: "map", defaultLayerId: "game", layers: [{ id: "game", mapSpaceId: "map", label: "Game", kind: "game-map", tileSize: 256, minZoom: 0, maxZoom: 0, extent: [0, 0, 1, 1], tiles: [{ z: 0, x: 0, y: 0, url: `assets/${"d".repeat(64)}.webp`, sha256: "d".repeat(64), bytes: 1, width: 1, height: 1, state: "captured", schemaId: "image/webp" }] }] } as const;
  const root: StaticRootManifest = {
    schemaVersion: "compendium.static-root.v6", ...identity, mode: "preview", complete: false,
    release: { version: "0.16.2.1", dataDate: "2026-09-28", patchNotes: { title: "Afallon 0.16.2.1", url: "https://store.steampowered.com/news/app/2597810/view/1844115010501029", date: "2026-09-21" } },
    world: { mapSpaceId: "world", label: "Afallon", bounds: { min: { x: 0, y: 0 }, max: { x: 1, y: 1 } }, offsets: [{ mapSpaceId: "map", worldX: 0, worldY: 0, source: "native", status: "placed" }], unplacedMapSpaceIds: [] },
    maps: [{ mapSpaceId: "map", label: "Map", bounds: { min: { x: 0, y: 0 }, max: { x: 1, y: 1 } }, parts: [ref("compendium.static-map.v3", "5".repeat(64)) as never], optionalGeometry: [], imagery: ref("compendium.static-imagery.v2", "6".repeat(64)) as never }],
    kinds: [
      { kind: "items", label: "Item", plural: "Items", route: "items", icon: "item", pages: true, searchable: true, columns: [{ id: "rarity", label: "Rarity", sortable: true, numeric: false }], facets: [{ id: "slot", label: "Slot" }] },
      { kind: "npcs", label: "NPC", plural: "NPCs", route: "npcs", icon: "npc", pages: true, searchable: true, columns: [{ id: "level", label: "Level", sortable: true, numeric: true }], facets: [{ id: "role", label: "Role" }] },
      { kind: "currencies", label: "Currency", plural: "Currencies", route: "currencies", icon: "currency", pages: false, searchable: false, columns: [], facets: [] },
      { kind: "stats", label: "Stat", plural: "Stats", route: "stats", icon: "stat", pages: false, searchable: false, columns: [], facets: [] },
    ],
    lists: { items: [ref("compendium.static-kind-list.v2", "7".repeat(64)) as never], npcs: [ref("compendium.static-kind-list.v2", "8".repeat(64)) as never] },
    search: [ref("compendium.static-search.v4", "9".repeat(64)) as never],
    coverage: ref("compendium.static-coverage.v2", "e".repeat(64)) as never,
    exclusions: ref("compendium.static-exclusions.v1", "a".repeat(64)) as never,
  };
  Assert(StaticRootManifestSchema, root);
  Assert(StaticSearchIndexSchema, search); Assert(StaticKindListSchema, itemList);
  const values = new Map<string, StaticResource>([
    [root.search[0]!.path, search], [root.lists.items![0]!.path, itemList], [root.lists.npcs![0]!.path, npcList], [root.coverage.path, coverage],
    [root.exclusions.path, { schemaVersion: "compendium.static-exclusions.v1", ...identity, exclusions: [{ key: "items:417", reason: "test-record" }] }],
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
  const questReference = ref(STATIC_DOCUMENT_SCHEMA_IDS.quests, "f".repeat(64));
  const questDocument = { schemaVersion: STATIC_DOCUMENT_SCHEMA_IDS.quests, ...identity, kind: "quests" as const,
    document: { ...fixtures.quests as PublicQuest, starts: [{ kind: "object" as const, label: "Shrine", availability: [], placements: [{ placementId: "missing", mapSpaceId: "map", label: "Duskfall Depths" }] }] } };
  const withQuest = new Map(values);
  withQuest.set(questReference.path, questDocument);
  withQuest.set(root.search[0]!.path, { ...search, entries: [...search.entries, { ref: questDocument.document.ref, hasPlacements: false, sourceKinds: [], document: questReference as never }] });
  withQuest.set(itemReference.path, { ...itemDocument, document: { ...itemDocument.document, rewardedBy: [{ counterpart: questDocument.document.ref, count: 1, choice: false }] } });
  withQuest.set(root.lists.items![0]!.path, itemList);
  withQuest.set(root.lists.npcs![0]!.path, npcList);
  const questKind = { kind: "quests" as const, label: "Quest", plural: "Quests", route: "quests", icon: "quest", pages: true, searchable: true, columns: [], facets: [] };
  const questListReference = ref("compendium.static-kind-list.v2", "0".repeat(64));
  const questRoot = { ...root, kinds: [...root.kinds, questKind], lists: { ...root.lists, quests: [questListReference as never] } };
  withQuest.set(questListReference.path, { schemaVersion: "compendium.static-kind-list.v2", ...identity, kind: "quests", part: 0, rows: [{ ref: questDocument.document.ref, values: {}, facets: {} }] });
  expect(() => assertStaticPublicationSemantics(questRoot, withQuest)).toThrow("Document placement is not a published placement: missing");

  // An excluded record has no page, no reference, and no marker.
  const excluding = (key: string) => { const next = new Map(values); next.set(root.exclusions.path, { schemaVersion: "compendium.static-exclusions.v1", ...identity, exclusions: [{ key, reason: "test-record" }] }); return next; };
  expect(() => assertStaticPublicationSemantics(root, excluding("npcs:286"))).toThrow("Placement p1 names an excluded record: npcs:286");
  const unplacedMap = { ...map, placements: [["p1", [0, 0], 0, "Duskfall Depths", ["boss"], [], [], null, null, null]] } as const;
  const withoutMarker = (key: string) => { const next = excluding(key); next.set(root.maps[0]!.parts[0]!.path, unplacedMap as never); return next; };
  expect(() => assertStaticPublicationSemantics(root, withoutMarker("npcs:286"))).toThrow("Excluded record is published: npcs:286");
  const referenced = withoutMarker("npcs:286");
  referenced.delete(npcReference.path);
  referenced.set(root.search[0]!.path, { ...search, entries: search.entries.filter((entry) => entry.ref.kind !== "npcs") });
  referenced.set(root.lists.npcs![0]!.path, { ...npcList, rows: [] });
  expect(() => assertStaticPublicationSemantics(root, referenced)).toThrow(`Reference to an excluded record npcs:286 in ${itemReference.path}`);
  const duplicate = new Map(values);
  duplicate.set(root.exclusions.path, { schemaVersion: "compendium.static-exclusions.v1", ...identity, exclusions: [{ key: "items:417", reason: "test-record" }, { key: "items:417", reason: "test-record" }] });
  expect(() => assertStaticPublicationSemantics(root, duplicate)).toThrow("Duplicate publication exclusion: items:417");
});
