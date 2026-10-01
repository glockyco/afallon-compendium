import { expect, test } from "bun:test";
import { HEROIC_TIER_KEY, type CatalogFacts, type CatalogMechanicsRule, type CatalogNpcFacts, type CatalogProgressionFact, type CatalogQuestFacts } from "@afallon/contracts/catalog";
import type { CharacterProgression, CraftingAndGathering, HeroicTier, LootGuide, NpcLocation, PublicDocument, PublicLevel, PublicNpc, PublicPlace } from "@afallon/contracts/public";
import { projectMechanicsDocuments } from "./mechanics";
import { createReferenceResolver } from "./references";

const ref = (entityKey: string, label: string) => ({ entityKey, label });
const classDetails = { autoAttackAbility: null, levelTemplate: ref("levels:0", "Levels"), stats: [], customStats: [], statListTemplate: null, skillBonuses: [], startItems: [], actionAbilities: [], allocationStatPoints: 0, allocatedStats: [] };
const progressionFacts: CatalogProgressionFact[] = [
  { entityKey: "classes:0", name: "Shieldmaster", kind: "classes", details: classDetails },
  { entityKey: "levels:0", name: null, kind: "levels", details: { levels: 3, baseExperience: 20, increaseAmount: 20, rows: [20, 40, 60].map((experienceRequired, index) => ({ level: index + 1, name: null, experienceRequired })) } },
  { entityKey: "skills:7", name: "Mining", kind: "skills", details: { maxLevel: 100 } } as CatalogProgressionFact,
  { entityKey: "skills:8", name: "Tailoring", kind: "skills", details: { maxLevel: 90 } } as CatalogProgressionFact,
  { entityKey: HEROIC_TIER_KEY, name: "Heroic Tier", kind: "heroicTier", details: {
    asset: "Heroic", killExperienceMultiplier: 5, essenceTreePoint: null, essenceBaseAmount: 3, essencePerAffix: 2,
    essenceEliteMultiplier: 1.5, essenceRareMultiplier: 2, essenceBossMultiplier: 3,
    essenceHealthBaseline: 1, essenceHealthFactorMin: 0.25, essenceHealthFactorMax: 4,
    baseHealthMultiplier: 3, baseDamageMultiplier: 2, gearScoreCoefficient: 0.0008, maxGearBonus: 1,
    affixChance: 0.25, extraAffixChance: 0.08, maxAffixes: 2, rareGuaranteedAffixes: 1,
    affixLootDropMultiplier: 1.5, heroicGearStatBonusPercent: 50,
  } },
];
const topicRules: Record<NonNullable<CatalogMechanicsRule["topic"]>, string[]> = {
  "character-progression": ["kill-base-roll", "kill-level-difference", "kill-heroic-multiplier", "kill-companion-split", "kill-game-modifiers", "experience-bonus-stat", "world-modifier-multiplier", "quest-reward-level-scale", "quest-action-amount", "quest-reward-skip-flag", "quest-no-heroic-multiplier", "surplus-experience-carries", "level-cap-stops-experience", "skill-award-sources", "skill-award-modifiers", "talent-point-modifiers"],
  "heroic-tier": ["heroic-kill-experience", "affix-count-source", "essence-requires-points", "essence-rank-multiplier", "essence-health-factor", "essence-fraction-carry"],
  "crafting-and-gathering": ["recipe-rank-gate", "recipe-craft-needs", "recipe-item-tooltip", "recipe-product-roll", "recipe-experience-bands", "recipe-experience-rounding", "recipe-experience-condition", "recipe-experience-modifiers", "spawner-weighted-pick", "spawner-weight-limits", "spawner-weights-relative", "spawner-check-interval", "spawner-player-range", "spawner-respawn", "placed-node-cooldown", "node-requirements", "node-loot-roll", "node-yield-bonus", "node-experience", "attunement-98", "attunement-642", "attunement-643", "attunement-644", "attunement-645", "attunement-646", "attunement-647", "weapon-skills", "weapon-skills-untrained", "crafting-skill-source", "enchanting-skill-source", "unmapped-skill-sources"],
  corruption: [],
  loot: ["chest-row-rolls", "supply-pack-tables", "supply-pack-picks", "supply-pack-world-loot", "supply-pack-lifecycle", "cloth-drop-chance", "cloth-tier-weights"],
};
const rules: CatalogMechanicsRule[] = Object.entries(topicRules).flatMap(([topic, ids]) => ids.map((ruleId, ordinal) => ({
  ruleId, topic: topic as CatalogMechanicsRule["topic"], section: topic, ordinal, status: "verified" as const,
  phrase: "A recorded rule applies.", operands: {
    ...(ruleId === "recipe-rank-gate" ? { minimumRequiredLevel: 1 } : {}),
    ...(ruleId === "recipe-experience-bands" ? { halfFromLevels: 20, noneFromLevels: 35, halfMultiplier: 0.5 } : {}),
    ...(ruleId === "node-yield-bonus" ? { chancePerLevel: 0.15 } : {}),
  }, links: [], sources: [{ method: "Game.Method", description: "Bounded decompilation", object: { sha256: "a".repeat(64), bytes: 1 } }], placements: ruleId === "kill-base-roll" ? [{ page: "npcs" as const, target: "experience" as const, scope: "all" as const }] : ruleId === "node-yield-bonus" ? [{ page: "gatheringNodes" as const, target: "how-it-works" as const, scope: "all" as const }] : [],
})));
const npc = (nativeId: number, minLevel: number, maxLevel: number, scalesWithPlayer: boolean, lower = 0, higher = 0, minExperience = 4, maxExperience = 10) => ({ entityKey: `npcs:${nativeId}`, minLevel, maxLevel, scalesWithPlayer, minExperience, maxExperience, lowerLevelExperienceModifier: lower, higherLevelExperienceModifier: higher, experienceBonusPerLevel: 1 }) as CatalogNpcFacts;
const quest = (nativeId: number, max: number | null) => ({ entityKey: `quests:${nativeId}`, experience: 50, levelRequirement: max === null ? null : max - 2, levelRange: max === null ? null : { min: 1, max } }) as CatalogQuestFacts;
const entities = ([
  ["npcs:1", "Zombie"], ["npcs:2", "Wolf"], ["npcs:3", "Infected Grain"], ["npcs:4", "Neonate Vampire"], ["npcs:5", "Unpublished"],
  ["npcs:6", "Aardvark"], ["npcs:7", "Badger"], ["npcs:8", "Aardvark"],
  ["recipes:1", "Runeweave Regalia"], ["items:1", "Runeweave Regalia"], ["skills:7", "Mining"], ["skills:8", "Tailoring"], ["gatheringNodes:small-iron-vein", "Small Iron Vein"],
] as Array<[string, string]>).map(([entityKey, name]) => ({ entityKey, name }));
const facts = {
  entities,
  npcs: [npc(1, 1, 30, false, 20, -20), npc(2, 5, 12, false, 20, -20), npc(3, 100, 100, true), npc(4, 1, 20, true), npc(5, 40, 40, false), npc(6, 8, 8, false, 0, 0, 5, 12), npc(7, 9, 9, false, 0, 0, 7, 7), npc(8, 11, 11, false, 0, 0, 2, 9)],
  quests: [quest(1, 31), quest(2, null)],
  progression: { facts: progressionFacts, offeredClasses: ["classes:0"], mechanicsRules: rules },
  recipes: [{ entityKey: "recipes:1", skill: ref("skills:8", "Tailoring"), station: null, learnedByDefault: true, ranks: [{ rank: 1, unlockCost: 40, experience: 7, craftTime: 1, products: [{ item: ref("items:1", "Runeweave Regalia"), count: 1, chance: 100 }], materials: [] }] }],
  gatheringNodes: [{ entityKey: "gatheringNodes:small-iron-vein", name: "Small iron vein", levelHint: null, variant: false, skill: ref("skills:7", "Mining"), skillExperience: 3, characterExperience: null, lootTable: null, conditionId: null, sources: [] }],
} as unknown as CatalogFacts;
// Spawners decide levels: Zombie's record does not scale but its spawner does, and Wolf's spawner rolls 6–12 although
// its record says 5–12. Badger has no published spawn.
const zombieSpawn = { min: 1, max: 10, scales: true }, wolfSpawn = { min: 6, max: 12, scales: false }, grainSpawn = { min: 15, max: 30, scales: true };
const vampireSpawn = { min: 5, scales: true }, aardvarkSpawn = { min: 8, max: 8, scales: false }, secondAardvarkSpawn = { min: 11, max: 11, scales: false };
const spawned = new Map<string, PublicLevel>([["npcs:1", zombieSpawn], ["npcs:2", wolfSpawn], ["npcs:3", grainSpawn], ["npcs:4", vampireSpawn], ["npcs:6", aardvarkSpawn], ["npcs:8", secondAardvarkSpawn]]);
const published = new Set(["npcs:1", "npcs:2", "npcs:3", "npcs:4", "npcs:6", "npcs:7", "npcs:8", "quests:1", "quests:2", "items:1", "skills:7", "skills:8", "gatheringNodes:small-iron-vein"]);
const resolve = createReferenceResolver(new Map(entities.map(({ entityKey, name }) => [entityKey, {
  key: entityKey, kind: entityKey.split(":")[0] === "gatheringNodes" ? "gatheringNodes" as const : entityKey.split(":")[0] === "recipes" ? "recipes" as const : entityKey.split(":")[0] as "items" | "npcs" | "skills", name, slug: name.toLowerCase().replaceAll(" ", "-"),
}])));
const location = (label: string, mapSpaceId: string, variant: string, level?: PublicLevel): NpcLocation => ({
  label, placements: [{ placementId: `${variant}-${label}`, mapSpaceId, label }], spotCount: 1, availability: [], variants: [variant], roles: [], quests: [], ...(level ? { level } : {}),
});
const npcPage = (id: number, locations: NpcLocation[] = []): PublicNpc => ({
  ref: { key: `npcs:${id}`, kind: "npcs", name: entities.find((row) => row.entityKey === `npcs:${id}`)!.name, slug: `npc-${id}` },
  description: null, art: {}, facts: { roles: [], stats: [], immunities: [] }, variantFields: [],
  variants: [{ key: `npcs:${id}`, anchor: `n${id}`, label: `NPC ${id}`, facts: {} }],
  locations, places: [], spotCount: locations.length, drops: [], sells: [], quests: [], abilityPhases: [], factionRewards: [], usedInQuests: [], bossOf: [], placedRules: [],
});
const place = (name: string, mapSpaceId: string): PublicPlace => ({
  ref: { key: `scenes:${mapSpaceId}`, kind: "places", name, slug: mapSpaceId }, description: null, art: {},
  facts: { placeType: "zone", guideIncluded: true }, space: { mapSpaceId, regionIds: [] },
  bosses: [], creatures: [], npcs: [], services: [], resources: [], containers: [], quests: [], questObjectives: [], properties: [], connections: [], regions: [],
});
const entityDocuments = new Map<string, PublicDocument>([
  ["npcs:1", npcPage(1, [location("Oakenvale", "oakenvale", "n1", zombieSpawn)])],
  ["npcs:2", npcPage(2, [location("Oakenvale", "oakenvale", "n2", wolfSpawn)])],
  ["npcs:3", npcPage(3, [location("Oakenvale", "oakenvale", "n3", grainSpawn)])],
  ["npcs:4", npcPage(4, [location("Oakenvale", "oakenvale", "n4", vampireSpawn)])],
  ["npcs:6", npcPage(6, [location("Oakenvale", "oakenvale", "n6", aardvarkSpawn), location("Coalway Woods", "coalway", "n6", aardvarkSpawn)])],
  ["npcs:7", npcPage(7)],
  ["npcs:8", npcPage(8, [location("Coalway Woods", "coalway", "n8", secondAardvarkSpawn)])],
  ["scenes:oakenvale", place("Oakenvale", "oakenvale")],
  ["scenes:coalway", place("Coalway Woods", "coalway")],
]);
const conditions = new Map();
const documents = (source: CatalogFacts = facts) => projectMechanicsDocuments(source, published, spawned, resolve, conditions, entityDocuments);

test("the Loot Mechanics page publishes its ordered guide steps and reviewed rules", () => {
  const loot = documents().get("mechanics:loot") as LootGuide;
  expect(loot.ref).toMatchObject({ name: "Loot", slug: "loot" });
  expect(loot.steps.map((step) => step.id)).toEqual([
    "open-a-chest", "choose-a-table", "pick-the-items", "draw-from-world-loot", "keep-the-pack", "collect-cloth",
  ]);
  expect(loot.rules.map((rule) => rule.id)).toEqual(topicRules.loot);
});

test("experience sources count creatures by the level at which their spawners place them", () => {
  const progression = documents().get("mechanics:character-progression") as CharacterProgression;
  expect([progression.curve.cap, progression.curve.rows]).toEqual([3, [{ level: 1, toNext: 20 }, { level: 2, toNext: 40 }]]);
  // Wolf counts with its spawn range, Zombie as a scaling creature, and the unplaced Badger not at all.
  expect(progression.sources.fixedCreatures).toEqual({ count: 3, minLevel: 6, maxLevel: 12 });
  expect([progression.sources.scalingCreatures.count, progression.sources.scalingCreatures.aboveFixed.map((row) => [row.creature.key, row.level])])
    .toEqual([3, [["npcs:3", grainSpawn], ["npcs:4", vampireSpawn]]]);
  expect(progression.sources.quests).toEqual({ count: 2, maxLevel: 31, maxRequirement: 29, withoutRange: 1 });
  expect(progression.sources.levelModifiers).toEqual([{ lower: 20, higher: -20, creatures: 2 }]);
});

test("the kill calculator offers each creature at each place where it spawns, with its levels there", () => {
  const progression = documents().get("mechanics:character-progression") as CharacterProgression;
  const calculator = progression.killCalculator;
  // Wolf is the first creature by name whose level modifiers change the range.
  expect(calculator.defaultCreature).toEqual(expect.objectContaining({ key: "npcs:2", slug: "wolf" }));
  expect(calculator.heroicMultiplier).toBe(5);
  expect(calculator.groups.map(({ name, place, creatures }) => ({
    name, place: place?.key, creatures: creatures.map(({ creature, level }) => [creature.key, level]),
  }))).toEqual([
    { name: "Coalway Woods", place: "scenes:coalway", creatures: [["npcs:6", aardvarkSpawn], ["npcs:8", secondAardvarkSpawn]] },
    { name: "Oakenvale", place: "scenes:oakenvale", creatures: [["npcs:6", aardvarkSpawn], ["npcs:3", grainSpawn], ["npcs:4", vampireSpawn], ["npcs:2", wolfSpawn], ["npcs:1", zombieSpawn]] },
  ]);
  expect(calculator.groups[0]!.creatures[0]).toEqual({ creature: expect.objectContaining({ key: "npcs:6" }), level: aardvarkSpawn,
    minExperience: 5, maxExperience: 11, experiencePerLevel: 1, lowerModifier: 0, higherModifier: 0 });
  expect(progression.steps[0]?.rules).toEqual(["kill-base-roll"]);
  expect(progression.rules.find((rule) => rule.id === "kill-base-roll")?.appearsOn).toEqual(["NPC pages, Experience"]);
  expect(progression.rules.some((rule) => rule.id === "placed-only")).toBe(false);
});

test("grouped NPC variants keep their page link and their own place", () => {
  const groupedPage = npcPage(6, [location("Oakenvale", "oakenvale", "n6", aardvarkSpawn), location("Coalway Woods", "coalway", "n8", secondAardvarkSpawn)]);
  const groupedDocuments = new Map(entityDocuments);
  groupedDocuments.set("npcs:6", { ...groupedPage, variants: [
    ...groupedPage.variants, { key: "npcs:8", anchor: "n8", label: "NPC 8", facts: {} },
  ] });
  groupedDocuments.delete("npcs:8");
  const groupedResolve: typeof resolve = (endpoint) => {
    const result = resolve(endpoint);
    if (result.key === null || (endpoint.entityKey !== "npcs:6" && endpoint.entityKey !== "npcs:8")) return result;
    return { ...result, key: "npcs:6", kind: "npcs", variant: endpoint.entityKey === "npcs:6" ? "n6" : "n8" };
  };
  const calculator = (projectMechanicsDocuments(facts, published, spawned, groupedResolve, conditions, groupedDocuments)
    .get("mechanics:character-progression") as CharacterProgression).killCalculator;
  const variants = calculator.groups.map(({ name, creatures }) => [name, creatures.filter(({ creature }) => creature.key === "npcs:6").map(({ creature, level }) => [creature.variant, level])]);
  expect(variants).toEqual([
    ["Coalway Woods", [["n8", secondAardvarkSpawn]]],
    ["Oakenvale", [["n6", aardvarkSpawn]]],
  ]);
});

test("unknown modifiers, invalid experience bounds, and a missing spawn keep a creature out of the calculator", () => {
  const source = { ...facts, npcs: facts.npcs.map((row) =>
    row.entityKey === "npcs:6" ? { ...row, lowerLevelExperienceModifier: 17, higherLevelExperienceModifier: -12 }
      : row.entityKey === "npcs:8" ? { ...row, higherLevelExperienceModifier: null }
      : row.entityKey === "npcs:2" ? { ...row, minExperience: 8, maxExperience: 7 } : row) };
  const calculator = (documents(source).get("mechanics:character-progression") as CharacterProgression).killCalculator;
  const offered = new Set(calculator.groups.flatMap((group) => group.creatures.map((row) => row.creature.key)));
  expect([...offered].sort()).toEqual(["npcs:1", "npcs:3", "npcs:4", "npcs:6"]);
  expect(calculator.groups[0]!.creatures[0]).toEqual({
    creature: expect.objectContaining({ key: "npcs:6" }), level: aardvarkSpawn,
    minExperience: 5, maxExperience: 11, experiencePerLevel: 1, lowerModifier: 17, higherModifier: -12,
  });
});

test("places that share a name form one group, with every level at which a creature spawns there", () => {
  const caveDocuments = new Map(entityDocuments);
  caveDocuments.set("npcs:1", npcPage(1, [location("Cave", "cave-a", "n1", { min: 1, max: 5, scales: true }), location("Cave", "cave-b", "n1", { min: 1, max: 20, scales: true })]));
  const calculator = (projectMechanicsDocuments(facts, published, spawned, resolve, conditions, caveDocuments)
    .get("mechanics:character-progression") as CharacterProgression).killCalculator;
  expect(calculator.groups.filter((group) => group.name === "Cave").map((group) => group.creatures.map(({ creature, level }) => [creature.key, level])))
    .toEqual([[["npcs:1", { min: 1, max: 20, scales: true }]]]);
});

test("the calculator omits missing Heroic settings and defaults to the first creature by name with level modifiers", () => {
  const source = { ...facts, npcs: facts.npcs.filter((row) => row.entityKey !== "npcs:2"),
    progression: { ...facts.progression, facts: progressionFacts.filter((row) => row.entityKey !== HEROIC_TIER_KEY) } };
  const calculator = (documents(source).get("mechanics:character-progression") as CharacterProgression).killCalculator;
  expect(calculator.defaultCreature.key).toBe("npcs:1");
  expect(calculator.heroicMultiplier).toBeUndefined();
});

test("Heroic guide computes Essence at health factor one for each rank and affix count", () => {
  const heroic = documents().get("mechanics:heroic-tier") as HeroicTier;
  expect(heroic.example).toEqual({ affixCounts: [0, 1, 2], rows: [
    { rank: "other", essence: [3, 5, 7] }, { rank: "elite", essence: [4.5, 7.5, 10.5] },
    { rank: "rare", essence: [6, 10, 14] }, { rank: "boss", essence: [9, 15, 21] },
  ] });
  const unavailable = { ...facts, progression: { ...facts.progression, facts: progressionFacts.filter((row) => row.entityKey !== HEROIC_TIER_KEY) } };
  expect((documents(unavailable).get("mechanics:heroic-tier") as HeroicTier).example).toBeUndefined();
});

test("craft and gather guide computes the named product bands and node yield bonus", () => {
  const guide = documents().get("mechanics:crafting-and-gathering") as CraftingAndGathering;
  expect(guide.example.craft).toEqual({ product: expect.objectContaining({ key: "items:1", variant: "crafting" }), skill: expect.objectContaining({ key: "skills:8" }), rank: {
    rank: 1, requiredLevel: 40, baseExperience: 7, bands: [
      { band: "full", from: 40, to: 59, experience: 7 },
      { band: "half", from: 60, to: 74, experience: 4 }, { band: "none", from: 75, experience: 0 },
    ],
  } });
  expect(guide.example.gather).toEqual({ node: expect.objectContaining({ key: "gatheringNodes:small-iron-vein" }), skill: expect.objectContaining({ key: "skills:7" }), levelChances: [{ level: 1, chance: 0.15 }, { level: 100, chance: 15 }] });
  expect(() => documents({ ...facts, recipes: [] })).toThrow("Runeweave Regalia");
  expect(() => documents({ ...facts, gatheringNodes: [] })).toThrow("Small Iron Vein");
});

test("a guide step naming a rule outside its topic stops publication", () => {
  const without = rules.filter((rule) => rule.ruleId !== "kill-base-roll");
  expect(() => projectMechanicsDocuments({ ...facts, progression: { ...facts.progression, mechanicsRules: without } }, published, spawned, resolve, conditions, entityDocuments)).toThrow("Guide character-progression step Roll kill experience names missing rule kill-base-roll");
});

test("a catalog without reviewed rules has no mechanics topics", () => {
  expect(projectMechanicsDocuments({ ...facts, progression: { ...facts.progression, mechanicsRules: [] } }, published, spawned, resolve, conditions, entityDocuments).size).toBe(0);
});

