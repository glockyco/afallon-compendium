import { expect, test } from "bun:test";
import { Assert } from "typebox/value";
import {
  ArtRefSchema, ConnectionRowSchema, DropRowSchema, EntityRefSchema, RequirementGroupSchema, GatherRowSchema, ContainerRowSchema, QuestObjectiveRowSchema, RecipeRowSchema, UsedInRecipeRowSchema, VendorRowSchema,
  PUBLIC_DOCUMENT_SCHEMAS, STATIC_DOCUMENT_SCHEMAS, STATIC_DOCUMENT_SCHEMA_IDS, StaticRootManifestSchema, StaticSearchIndexSchema, StaticKindListSchema,
  assertStaticPublicationSemantics, staticResourceEdges, collectRefs,
  type ArtRef, type EntityRef, type PublicDocument, type PublicItem, type PublicNpc, type PublicQuest, type PublicPlace, type PublicProperty, type PublicAbility, type PublicClass, type PublicSkill, type CharacterProgression, type HeroicTier, type MechanicsRule, type CraftingAndGathering, type PublicGatheringNode,
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
  properties: "compendium.static-property.v2", abilities: "compendium.static-ability.v3", skills: "compendium.static-skill.v2",
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
  Assert(GatherRowSchema, { label: "Copper vein", rank: 1, min: 1, max: 2, requirements: [], availability: [], placementCount: 1, places: [{ label: "Duskfall Depths", mapSpaceId: "duskfall", spotCount: 1, placementIds: ["p1"] }] });
  Assert(ContainerRowSchema, { counterpart: unresolved, label: "Chest", availabilityIndex: 0, placementCount: 1, places: [{ label: "Duskfall Depths", mapSpaceId: "duskfall", spotCount: 1, placementIds: ["p1"] }] });
  Assert(RecipeRowSchema, { counterpart: item, count: 1 });
  Assert(UsedInRecipeRowSchema, { counterpart: item, count: 3, product: { counterpart: boss, count: 2 }, skill: item, requiredLevel: 1 });
  Assert(ConnectionRowSchema, { counterpart: unresolved, direction: "to", placements: [placement] });
  expect(() => Assert(ConnectionRowSchema, { counterpart: boss, kind: "effect-teleport", placements: [] })).toThrow();
  expect(() => Assert(ConnectionRowSchema, { counterpart: boss, direction: "both", placements: [] })).toThrow();
  Assert(QuestObjectiveRowSchema, { counterpart: boss, objective: { index: 0, text: "Kill 3 Branchweavers", completions: [], type: "killNpc", target: boss, count: 3 } });
  Assert(QuestObjectiveRowSchema, { counterpart: boss, objective: { index: 1, text: "?", completions: [], type: "unsupported", rawType: "customTask" } });
  expect(() => Assert(QuestObjectiveRowSchema, { counterpart: boss, objective: { index: 0, text: "x", completions: [], type: "killNpc", target: boss } })).toThrow();
});

const base = { description: null, art: {} };
const located = { ...base, locations: [placement] };
const rule: MechanicsRule = { id: "weapon-skill-hit", section: "skill-experience", status: "verified", phrase: "Each hit gives {hitExperience} experience.", operands: { hitExperience: 2 }, links: [], sources: [{ method: "SkillSystem.OnPlayerAutoAttackHit", evidence: "Bounded decompilation" }], appearsOn: [] };
const characterProgression: CharacterProgression = {
  ...base, ref: { key: "mechanics:character-progression", kind: "mechanics", name: "Character Progression", slug: "character-progression" }, topic: "character-progression",
  curve: { template: "Character levels", cap: 3, rows: [{ level: 1, toNext: 20 }, { level: 2, toNext: 40 }] },
  sources: { fixedCreatures: { count: 185, minLevel: 1, maxLevel: 30 }, scalingCreatures: { count: 31, aboveFixed: [{ creature: boss, level: { min: 1, scales: true } }] }, quests: { count: 136, maxLevel: 31, maxRequirement: 24, withoutRange: 4 }, levelModifiers: [{ lower: 0, higher: -30, creatures: 59 }] },
  talentPoints: [{ name: "Talent Points", start: 1, max: 180, gains: [{ trigger: "characterLevelUp", amount: 3 }] }], rules: [rule],
  overview: "Character experience determines levels.", steps: [{ id: "gain-experience", title: "Gain experience", text: "Each hit gives experience.", rules: ["weapon-skill-hit"] }],
  killCalculator: { groups: [{ place: { key: "scenes:10", kind: "places", name: "Duskfall Depths", slug: "duskfall-depths" }, name: "Duskfall Depths",
    creatures: [{ creature: boss, level: { min: 15, max: 30, scales: true }, minExperience: 20, maxExperience: 40, experiencePerLevel: 2, lowerModifier: 15, higherModifier: -10 }] }],
    defaultCreature: boss, heroicMultiplier: 5 },
};
const heroicTier: HeroicTier = {
  ...base, ref: { key: "mechanics:heroic-tier", kind: "mechanics", name: "Heroic Tier", slug: "heroic-tier" }, topic: "heroic-tier",
  settings: { killExperienceMultiplier: 5, essencePoints: "Heroic Essence", essenceBaseAmount: 3, essencePerAffix: 3, essenceEliteMultiplier: 1.5, essenceRareMultiplier: 2, essenceBossMultiplier: 3, essenceHealthBaseline: 1, essenceHealthFactorMin: 0.25, essenceHealthFactorMax: 4,
    baseHealthMultiplier: 3, baseDamageMultiplier: 2, gearScoreCoefficient: 0.0008, maxGearBonus: 1, affixChance: 0.25, extraAffixChance: 0.08, maxAffixes: 4, rareGuaranteedAffixes: 1, affixLootDropMultiplier: 1.5, heroicGearStatBonusPercent: 50 },
  rules: [{ ...rule, id: "heroic-kill-rounding-ties", section: "kill-experience", status: "unknown", phrase: "The tie rule is not known.", operands: {} }],
  overview: "Heroic creatures give more experience.", steps: [{ id: "gain-experience", title: "Gain experience", text: "Heroic kills use a multiplier.", rules: ["heroic-kill-rounding-ties"] }],
  example: { affixCounts: [0, 1], rows: [{ rank: "other", essence: [3, 6] }] },
};
const mining: EntityRef = { key: "skills:7", kind: "skills", name: "Mining", slug: "mining" };
const vein: EntityRef = { key: "gatheringNodes:small-iron-vein", kind: "gatheringNodes", name: "Small Iron Vein", slug: "small-iron-vein" };
const spawnerTiming = { skill: mining, skillCap: 150, respawnSeconds: 120, jitterSeconds: 30, despawnSeconds: 60, playerRange: 40 };
// A node that spawners and a scene both place, with a yield whose item has no record.
const gatheringNode: PublicGatheringNode = {
  ...base, ref: vein, facts: { skill: mining, requiredLevel: 1, skillExperience: 15, characterExperience: 4, requirements: [{ mode: "all", checkCount: false, requirements: [requirement("Skill", "Mining 1")] }], variant: false },
  yields: [{ counterpart: item, min: 1, max: 2, chance: 100 }, { counterpart: unresolved, min: 1, max: 1, chance: 5 }],
  spawners: [{ ...spawnerTiming, options: [{ node: vein, lowSkillWeight: 70, highSkillWeight: 24, teaserWeight: 0 }], spawners: 3, placementCount: 1, unplaced: 2 }],
  placed: [{ cooldownSeconds: 300, objects: 1, placementCount: 1, unplaced: 0 }],
  places: [{ label: "Duskfall Depths", mapSpaceId: "duskfall", spotCount: 1, placementIds: ["p1"] }], spotCount: 1,
  placedRules: [{ target: "how-it-works", guide: { key: "mechanics:crafting-and-gathering", kind: "mechanics", name: "Crafting and Gathering", slug: "crafting-and-gathering" }, stepId: "wait-for-the-node" }],
};
const craftingAndGathering: CraftingAndGathering = {
  ...base, ref: { key: "mechanics:crafting-and-gathering", kind: "mechanics", name: "Crafting and Gathering", slug: "crafting-and-gathering" }, topic: "crafting-and-gathering",
  rules: [{ ...rule, id: "recipe-experience-bands", section: "crafting-experience", phrase: "Half experience from +{halfFromLevels} levels.", operands: { halfFromLevels: 20 } }],
  spawnerExamples: [{ ...spawnerTiming, options: [{ node: vein, lowSkillWeight: 70, highSkillWeight: 24, teaserWeight: 0 }], spawners: 3 }],
  overview: "Crafting makes items.", steps: [{ id: "make-an-item", title: "Make an item", text: "The skill gate controls crafting.", rules: ["recipe-experience-bands"] }],
  example: { craft: { product: { ...item, variant: "crafting" }, skill: mining, rank: { rank: 1, requiredLevel: 1, baseExperience: 0, bands: [] } },
    gather: { node: vein, skill: mining, levelChances: [{ level: 1, chance: 0.1 }] } },
};
const fixtures: { [K in keyof typeof PUBLIC_DOCUMENT_SCHEMAS]: PublicDocument } = {
  items: { ...base, ref: item, facts: { rarity: "Common", itemType: "ARMOR", slot: "GLOVES", stats: [{ stat: { key: "stats:20", kind: "stats", name: "Armor" }, amount: 7, isPercent: false }], randomStats: [{ stat: { key: "stats:0", kind: "stats", name: "Health" }, min: 10, max: 40, isPercent: false, whole: false, chance: 100 }], randomStatsMax: 0, sockets: [{ gemType: "Green Gem" }], sellPrice: { amount: 5, currency: gold }, stackLimit: 1, questDropOnly: false, corruptionToken: false, actionAbilities: [], useLines: [], equipmentRequirements: [], useConditions: [] },
    sourceSpotCount: 0, sourceAvailabilities: [], droppedBy: [{ counterpart: boss, min: 1, max: 1, requirements: [] }], soldBy: [], buys: [], gatheredFrom: [], inContainers: [], collectedFrom: [], rewardedBy: [], givenBy: [], usedInRecipes: [], usedInQuests: [], startingGearOf: [], placedRules: [] } satisfies PublicItem,
  npcs: { ...base, ref: boss, facts: { level: { min: 21, max: 21, scales: false }, roles: ["boss"], stats: [], immunities: [], lootSpecialization: { armorType: "PLATE", weaponTypes: ["AXE"] } }, variantFields: [], variants: [{ key: "npcs:286", anchor: "n286", label: "Duskfall Depths", facts: {} }],
    locations: [{ label: "Duskfall Depths", placements: [placement], spotCount: 1, availability: [], level: { min: 21, max: 21, scales: false }, variants: ["n286"], roles: ["boss"], quests: [] }],
    places: [{ label: "Duskfall Depths", mapSpaceId: "duskfall", placementIds: ["p1"], spotCount: 1 }], spotCount: 1,
    drops: [{ counterpart: item, min: 1, max: 1, requirements: [] }], sells: [], quests: [], abilityPhases: [{ phaseIndex: 0, name: "Bug boss", abilities: [] }], factionRewards: [], usedInQuests: [], bossOf: [], placedRules: [] } satisfies PublicNpc,
  quests: { ...base, ref: { key: "quests:10", kind: "quests", name: "The Bonebind Ritual", slug: "the-bonebind-ritual" }, facts: { repeatable: false, turnInWithoutNpc: false, requirements: [] }, starts: [{ kind: "npc", npc: boss, areas: ["Duskfall Depths"] }], turnIns: [], objectives: [{ index: 0, text: "Kill 3 Branchweavers", completions: [], type: "killNpc", target: boss, count: 3 }], itemsGiven: [], rewards: [{ counterpart: item, count: 1, choice: false }], rewardChoices: [], chainQuests: [], unlocks: [], worldChanges: [], placedRules: [] } satisfies PublicQuest,
  places: { ...base, ref: { key: "scenes:10", kind: "places", name: "Duskfall Depths", slug: "duskfall-depths" }, facts: { placeType: "dungeon", levelRange: { min: 18, max: 20 }, guideIncluded: true }, space: { mapSpaceId: "duskfall", regionIds: [] }, bosses: [boss], creatures: [], npcs: [], services: [], resources: [], containers: [], quests: [], questObjectives: [], properties: [], connections: [], regions: [] } satisfies PublicPlace,
  properties: { ...located, ref: { key: "properties:1", kind: "properties", name: "Mill", slug: "mill" }, facts: { income: { amount: 60, currency: gold }, incomeInterval: 300 } } satisfies PublicProperty,
  abilities: { ...base, ref: { key: "abilities:194", kind: "abilities", name: "Blacktar Eruption", slug: "blacktar-eruption" }, versions: [{ keys: ["abilities:194"], anchor: "n194", ranks: [{ rankIndex: 0, lines: [{ spans: [{ text: "Deals damage", tone: "damage", italic: false }] }] }], useRequirements: [], learnedBy: [], usedBy: [boss], usedByItems: [], taughtBy: [] }] } satisfies PublicAbility,
  classes: { ...base, ref: { key: "classes:0", kind: "classes", name: "Shieldmaster", slug: "shieldmaster" }, facts: { races: ["Dwarf"], weapons: ["Shield"], talentPoints: [{ name: "Talent Points", start: 1, max: 180, gains: [{ trigger: "characterLevelUp", amount: 3 }] }], highestLevel: 60 },
    trees: [{ anchor: "tree-18", name: "Aegis Mastery", points: "Talent Points", rows: [{ anchor: "talent-18-3", tier: 3, position: 2, name: "Aegis Discipline", ranks: 5,
      first: { rank: 1, stats: [{ stat: { key: "stats:125", kind: "stats", name: "Block Chance" }, amount: 2, isPercent: false }], text: [] }, last: { rank: 5, stats: [{ stat: { key: "stats:125", kind: "stats", name: "Block Chance" }, amount: 10, isPercent: false }], text: [] },
      requirements: [{ mode: "all", checkCount: false, requirements: [{ type: { value: 20, name: "Bonus" }, rule: { value: 0, name: "Mandatory" }, label: "Weighted Strikes rank 4 or higher", spans: [{ ref: { key: "classes:0", kind: "classes", name: "Weighted Strikes", slug: "shieldmaster", variant: "talent-18-1" } }, { text: " rank 4 or higher" }] }] }] }] }],
    startingGear: [{ item, count: 1, equipped: true }], placedRules: [] } satisfies PublicClass,
  skills: { ...base, ref: { key: "skills:0", kind: "skills", name: "Alchemy", slug: "alchemy" }, facts: { highestLevel: 300, automatic: true }, recipes: [{ recipe: { key: "recipes:81", name: "Aetherial Elixir" }, anchor: "recipe-aetherial-elixir", product: { ...item, variant: "crafting" } }],
    gatheringNodes: [], experience: { crafting: true, gathering: false }, placedRules: [] } satisfies PublicSkill,
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

test("Heart stone routes, place answers, and guide cross-links keep their own strict schemas", () => {
  const place = (fixtures.places as PublicPlace).ref;
  const use = { stoneName: "Challenge Stone Poison", regionName: "Coalway Swamp", spot: placement,
    destinations: [place], unlinkedDestinations: ["Challenge Stone Frost"], count: 1 };
  Assert(PUBLIC_DOCUMENT_SCHEMAS.items, { ...fixtures.items, challengeStoneUses: [use] });
  Assert(PUBLIC_DOCUMENT_SCHEMAS.places, { ...fixtures.places,
    challengeStoneStart: { heart: item, stoneName: use.stoneName, regionName: use.regionName, spot: placement, count: 1 } });
  Assert(PUBLIC_DOCUMENT_SCHEMAS.mechanics, { ...characterProgression, seeAlso: [{ lead: "See", ref: item }] });
  expect(() => Assert(PUBLIC_DOCUMENT_SCHEMAS.items, { ...fixtures.items, challengeStoneUses: [{ ...use, count: -1 }] })).toThrow();
  expect(() => Assert(PUBLIC_DOCUMENT_SCHEMAS.items, { ...fixtures.items, challengeStoneUses: [{ ...use, place }] })).toThrow();
  expect(() => Assert(PUBLIC_DOCUMENT_SCHEMAS.places, { ...fixtures.places,
    challengeStoneStart: { heart: item, stoneName: use.stoneName, regionName: use.regionName, spot: { ...placement, mapSpaceId: null }, count: 1 } })).toThrow();
  expect(() => Assert(PUBLIC_DOCUMENT_SCHEMAS.mechanics, { ...characterProgression, seeAlso: [{ lead: "See", ref: { key: null, label: "Unknown" } }] })).toThrow();
  expect(STATIC_DOCUMENT_SCHEMA_IDS.items).toBe("compendium.static-item.v14");
  expect(STATIC_DOCUMENT_SCHEMA_IDS.places).toBe("compendium.static-place.v8");
});

test("node source groups publish counts without repeating placements needed only by map places", () => {
  expect(() => Assert(PUBLIC_DOCUMENT_SCHEMAS.gatheringNodes, {
    ...gatheringNode, spawners: [{ ...gatheringNode.spawners[0], placements: [placement] }],
  })).toThrow();
  expect(() => Assert(PUBLIC_DOCUMENT_SCHEMAS.gatheringNodes, {
    ...gatheringNode, placed: [{ ...gatheringNode.placed[0], placementCount: -1 }],
  })).toThrow();
});

test("every mechanics topic validates, and a mechanics document of an unknown topic or kind does not", () => {
  const schema = STATIC_DOCUMENT_SCHEMAS[STATIC_DOCUMENT_SCHEMA_IDS.mechanics];
  for (const document of [characterProgression, heroicTier, craftingAndGathering]) Assert(schema, { schemaVersion: STATIC_DOCUMENT_SCHEMA_IDS.mechanics, ...identity, kind: "mechanics", document });
  expect(STATIC_DOCUMENT_SCHEMA_IDS.mechanics).toBe("compendium.static-mechanics.v8");
  expect(() => Assert(schema, { schemaVersion: "compendium.static-mechanics.v7", ...identity, kind: "mechanics", document: characterProgression })).toThrow();
  expect(() => Assert(PUBLIC_DOCUMENT_SCHEMAS.mechanics, { ...characterProgression, example: { creature: boss, level: 21, lowest: 20, highest: 40 } })).toThrow();
  expect(() => Assert(PUBLIC_DOCUMENT_SCHEMAS.mechanics, { ...characterProgression, killCalculator: { ...characterProgression.killCalculator, groups: [{ name: "Barrowdeep", creatures: [{ creature: boss, level: { min: 21, max: 21, scales: false }, minExperience: -1, maxExperience: 20, experiencePerLevel: 0, lowerModifier: 0, higherModifier: 0 }] }] } })).toThrow();
  expect(() => Assert(PUBLIC_DOCUMENT_SCHEMAS.mechanics, { ...characterProgression, killCalculator: { ...characterProgression.killCalculator, groups: [{ name: "Barrowdeep", creatures: [{ creature: boss, level: 21, minExperience: 7, maxExperience: 7, experiencePerLevel: 0, lowerModifier: 0, higherModifier: 0 }] }] } })).toThrow();
  Assert(PUBLIC_DOCUMENT_SCHEMAS.mechanics, { ...characterProgression, killCalculator: { groups: [{ name: "Barrowdeep", creatures: [{ creature: boss, level: { min: 21, max: 22, scales: false }, minExperience: 7, maxExperience: 7, experiencePerLevel: 0, lowerModifier: 0, higherModifier: 0 }] }], defaultCreature: boss } });
  // Mechanics examples describe weights and timing, not each spawner's map spots.
  expect(() => Assert(PUBLIC_DOCUMENT_SCHEMAS.mechanics, { ...craftingAndGathering, spawnerExamples: [{ ...craftingAndGathering.spawnerExamples[0], placements: [] }] })).toThrow();
  Assert(PUBLIC_DOCUMENT_SCHEMAS.mechanics, { ...heroicTier, settings: { unavailable: "The scan of this build recorded no Heroic tier settings." } });
  expect(() => Assert(PUBLIC_DOCUMENT_SCHEMAS.mechanics, { ...heroicTier, topic: "corruption" })).toThrow();
  expect(() => Assert(schema, { schemaVersion: STATIC_DOCUMENT_SCHEMA_IDS.mechanics, ...identity, kind: "guides", document: characterProgression })).toThrow();
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

test("a root reaches documents and artwork through graph edges and passes semantics", () => {
  const ref = (schemaId: string, sha: string) => ({ path: `resources/${sha}.json`, sha256: sha, bytes: 10, schemaId });
  const itemDocument: Static<typeof StaticItemDocumentSchema> = { schemaVersion: STATIC_DOCUMENT_SCHEMA_IDS.items, ...identity, kind: "items", document: fixtures.items as PublicItem };
  const npcDocument = { schemaVersion: STATIC_DOCUMENT_SCHEMA_IDS.npcs, ...identity, kind: "npcs", document: fixtures.npcs as PublicNpc } as const;
  const itemReference = ref(STATIC_DOCUMENT_SCHEMA_IDS.items, "1".repeat(64)), npcReference = ref(STATIC_DOCUMENT_SCHEMA_IDS.npcs, "2".repeat(64));
  const search: StaticSearchIndex = { schemaVersion: "compendium.static-search.v6", ...identity, part: 0, entries: [{ ref: item, hasPlacements: false, sourceKinds: ["npc-loot"], document: itemReference as never }, { ref: boss, level: 21, hasPlacements: true, sourceKinds: [], document: npcReference as never }] };
  const itemList: StaticKindList = { schemaVersion: "compendium.static-kind-list.v5", ...identity, kind: "items", part: 0, rows: [{ ref: item, values: { level: null, rarity: "Common" }, facets: { slot: ["GLOVES"] } }] };
  const npcList: StaticKindList = { schemaVersion: "compendium.static-kind-list.v5", ...identity, kind: "npcs", part: 0, rows: [{ ref: boss, values: { level: 21 }, facets: { role: ["boss"] } }] };
  const coverage: StaticCoverage = { schemaVersion: "compendium.static-coverage.v3", ...identity, pages: [{ kind: "items", count: 1 }, { kind: "npcs", count: 1 }], mapCount: 1, placementCount: 1, gaps: [] };
  const map = { schemaVersion: "compendium.static-map.v3", ...identity, mapSpaceId: "map", part: 0, placements: [["p1", [0, 0], 0, "Duskfall Depths", ["boss"], ["npcs:286"], [], null, null, null]], regions: [] } as const;
  const imagery = { schemaVersion: "compendium.static-imagery.v2", ...identity, mapSpaceId: "map", defaultLayerId: "game", layers: [{ id: "game", mapSpaceId: "map", label: "Game", kind: "game-map", tileSize: 256, minZoom: 0, maxZoom: 0, extent: [0, 0, 1, 1], tiles: [{ z: 0, x: 0, y: 0, url: `assets/${"d".repeat(64)}.webp`, sha256: "d".repeat(64), bytes: 1, width: 1, height: 1, state: "captured", schemaId: "image/webp" }] }] } as const;
  const root: StaticRootManifest = {
    schemaVersion: "compendium.static-root.v8", ...identity, mode: "preview", complete: false,
    release: { version: "0.16.2.1", dataDate: "2026-09-28", patchNotes: { title: "Afallon 0.16.2.1", url: "https://store.steampowered.com/news/app/2597810/view/1844115010501029", date: "2026-09-21" } },
    world: { mapSpaceId: "world", label: "Afallon", bounds: { min: { x: 0, y: 0 }, max: { x: 1, y: 1 } }, offsets: [{ mapSpaceId: "map", worldX: 0, worldY: 0, source: "native", status: "placed" }], unplacedMapSpaceIds: [] },
    maps: [{ mapSpaceId: "map", label: "Map", bounds: { min: { x: 0, y: 0 }, max: { x: 1, y: 1 } }, parts: [ref("compendium.static-map.v3", "5".repeat(64)) as never], optionalGeometry: [], imagery: ref("compendium.static-imagery.v2", "6".repeat(64)) as never }],
    kinds: [
      { kind: "items", label: "Item", plural: "Items", route: "items", icon: "item", pages: true, list: true, searchable: true, columns: [{ id: "rarity", label: "Rarity", sortable: true, numeric: false }], facets: [{ id: "slot", label: "Slot" }] },
      { kind: "npcs", label: "NPC", plural: "NPCs", route: "npcs", icon: "npc", pages: true, list: true, searchable: true, columns: [{ id: "level", label: "Level", sortable: true, numeric: true }], facets: [{ id: "role", label: "Role" }] },
      { kind: "currencies", label: "Currency", plural: "Currencies", route: "currencies", icon: "currency", pages: false, list: false, searchable: false, columns: [], facets: [] },
      { kind: "stats", label: "Stat", plural: "Stats", route: "stats", icon: "stat", pages: false, list: false, searchable: false, columns: [], facets: [] },
    ],
    lists: { items: [ref("compendium.static-kind-list.v5", "7".repeat(64)) as never], npcs: [ref("compendium.static-kind-list.v5", "8".repeat(64)) as never] },
    search: [ref("compendium.static-search.v6", "9".repeat(64)) as never],
    coverage: ref("compendium.static-coverage.v3", "e".repeat(64)) as never,
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
  expect(staticResourceEdges(search).map((edge) => edge.path)).toEqual([itemReference.path, art.url, npcReference.path]);
  expect(staticResourceEdges(itemDocument)).toEqual([{ path: art.url, sha256: art.sha256, bytes: art.bytes, schemaId: "image/webp" }]);
  assertStaticPublicationSemantics(root, values);
  const invalidSource = new Map(values);
  invalidSource.set(itemReference.path, { ...itemDocument, document: { ...(fixtures.items as PublicItem),
    inContainers: [{ label: "Chest", availabilityIndex: 1, placementCount: 0, places: [] }] } });
  expect(() => assertStaticPublicationSemantics(root, invalidSource)).toThrow(/unpublished availability group/);
  const recipeListReference = ref("compendium.static-kind-list.v5", "0".repeat(64));
  const withRecipes = { ...root,
    kinds: [...root.kinds, { kind: "recipes" as const, label: "Recipe", plural: "Recipes", route: "recipes", icon: "recipe",
      pages: false, list: true, searchable: false, columns: [], facets: [] }],
    lists: { ...root.lists, recipes: [recipeListReference as never] } };
  const recipeValues = new Map(values);
  recipeValues.set(recipeListReference.path, { schemaVersion: "compendium.static-kind-list.v5", ...identity, kind: "recipes", part: 0,
    rows: [{ ref: { ...item, name: "Aetherial Elixir", variant: "crafting" }, values: {}, facets: {} }] });
  assertStaticPublicationSemantics(withRecipes, recipeValues);
  expect(() => assertStaticPublicationSemantics(withRecipes, values)).toThrow();

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
  const questKind = { kind: "quests" as const, label: "Quest", plural: "Quests", route: "quests", icon: "quest", pages: true, list: true, searchable: true, columns: [], facets: [] };
  const questListReference = ref("compendium.static-kind-list.v5", "0".repeat(64));
  const questRoot = { ...root, kinds: [...root.kinds, questKind], lists: { ...root.lists, quests: [questListReference as never] } };
  withQuest.set(questListReference.path, { schemaVersion: "compendium.static-kind-list.v5", ...identity, kind: "quests", part: 0, rows: [{ ref: questDocument.document.ref, values: {}, facets: {} }] });
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
