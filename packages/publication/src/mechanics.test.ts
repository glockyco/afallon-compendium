import { expect, test } from "bun:test";
import { HEROIC_TIER_KEY, type CatalogFacts, type CatalogMechanicsRule, type CatalogNpcFacts, type CatalogProgressionFact, type CatalogQuestFacts } from "@afallon/contracts/catalog";
import type { CharacterProgression, CraftingAndGathering, HeroicTier } from "@afallon/contracts/public";
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
  "character-progression": ["kill-base-roll", "kill-level-difference", "kill-heroic-multiplier", "kill-companion-split", "kill-game-modifiers", "experience-bonus-stat", "world-modifier-multiplier", "quest-reward-level-scale", "quest-action-amount", "surplus-experience-carries", "level-cap-stops-experience", "skill-award-sources", "skill-award-modifiers"],
  "heroic-tier": ["heroic-kill-experience", "affix-count-source", "essence-requires-points", "essence-rank-multiplier", "essence-health-factor", "essence-fraction-carry"],
  "crafting-and-gathering": ["recipe-rank-gate", "recipe-craft-needs", "recipe-product-roll", "recipe-experience-bands", "recipe-experience-rounding", "recipe-experience-condition", "recipe-experience-modifiers", "spawner-weighted-pick", "spawner-weight-limits", "spawner-weights-relative", "spawner-player-range", "spawner-respawn", "placed-node-cooldown", "node-requirements", "node-loot-roll", "node-yield-bonus", "node-experience"],
};
const rules: CatalogMechanicsRule[] = Object.entries(topicRules).flatMap(([topic, ids]) => ids.map((ruleId, ordinal) => ({
  ruleId, topic: topic as CatalogMechanicsRule["topic"], section: topic, ordinal, status: "verified" as const,
  phrase: "A recorded rule applies.", operands: {
    ...(ruleId === "recipe-rank-gate" ? { minimumRequiredLevel: 1 } : {}),
    ...(ruleId === "recipe-experience-bands" ? { secondFullFromLevels: 10, halfFromLevels: 20, noneFromLevels: 35, halfMultiplier: 0.5 } : {}),
    ...(ruleId === "node-yield-bonus" ? { chancePerLevel: 0.15 } : {}),
  }, links: [], sources: [{ method: "Game.Method", description: "Bounded decompilation", object: { sha256: "a".repeat(64), bytes: 1 } }], placements: ruleId === "kill-base-roll" ? [{ page: "npcs" as const, target: "experience" as const, scope: "all" as const }] : ruleId === "node-yield-bonus" ? [{ page: "gatheringNodes" as const, target: "how-it-works" as const, scope: "all" as const }] : [],
})));
rules.push({ ...rules[0]!, ruleId: "placed-only", topic: null, placements: [{ page: "npcs", target: "experience", scope: "all" }] });
const npc = (nativeId: number, minLevel: number, maxLevel: number, scalesWithPlayer: boolean, lower = 0, higher = 0, minExperience = 4, maxExperience = 10) => ({ entityKey: `npcs:${nativeId}`, minLevel, maxLevel, scalesWithPlayer, minExperience, maxExperience, lowerLevelExperienceModifier: lower, higherLevelExperienceModifier: higher }) as CatalogNpcFacts;
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
const spawned = new Map([["npcs:3", { min: 15, max: 30, scales: true }], ["npcs:4", { min: 5, scales: true }]]);
const published = new Set(["npcs:1", "npcs:2", "npcs:3", "npcs:4", "npcs:6", "npcs:7", "npcs:8", "quests:1", "quests:2", "items:1", "skills:7", "skills:8", "gatheringNodes:small-iron-vein"]);
const resolve = createReferenceResolver(new Map(entities.map(({ entityKey, name }) => [entityKey, {
  key: entityKey, kind: entityKey.split(":")[0] === "gatheringNodes" ? "gatheringNodes" as const : entityKey.split(":")[0] === "recipes" ? "recipes" as const : entityKey.split(":")[0] as "items" | "npcs" | "skills", name, slug: name.toLowerCase().replaceAll(" ", "-"),
}])));
const conditions = new Map();
const documents = () => projectMechanicsDocuments(facts, published, spawned, resolve, conditions);

test("the level curve and source ranges reflect published creature levels", () => {
  const progression = documents().get("mechanics:character-progression") as CharacterProgression;
  expect([progression.curve.cap, progression.curve.rows]).toEqual([3, [{ level: 1, toNext: 20 }, { level: 2, toNext: 40 }]]);
  expect(progression.sources.fixedCreatures).toEqual({ count: 5, minLevel: 1, maxLevel: 30 });
  expect([progression.sources.scalingCreatures.count, progression.sources.scalingCreatures.aboveFixed.map((row) => [row.creature.key, row.level])]).toEqual([2, [["npcs:4", { min: 5, scales: true }]]]);
  expect(progression.sources.quests).toEqual({ count: 2, maxLevel: 31, maxRequirement: 29, withoutRange: 1 });
  expect(progression.sources.levelModifiers).toEqual([{ lower: 20, higher: -20, creatures: 2 }]);
});

test("character guide uses the first published fixed-level creature and the upper-exclusive base roll", () => {
  const progression = documents().get("mechanics:character-progression") as CharacterProgression;
  expect(progression.example).toEqual({ creature: expect.objectContaining({ key: "npcs:6", slug: "aardvark" }), level: 8, lowest: 5, highest: 11 });
  expect(progression.steps[0]?.rules).toEqual(["kill-base-roll"]);
  expect(progression.rules.find((rule) => rule.id === "kill-base-roll")?.appearsOn).toEqual(["NPC pages, Experience"]);
  expect(progression.rules.some((rule) => rule.id === "placed-only")).toBe(false);
  const onlyEqual = { ...facts, npcs: facts.npcs.filter((row) => row.entityKey !== "npcs:6" && row.entityKey !== "npcs:8") };
  expect(projectMechanicsDocuments(onlyEqual, published, spawned, resolve, conditions).get("mechanics:character-progression")?.example).toEqual({ creature: expect.objectContaining({ key: "npcs:7" }), level: 9, lowest: 7, highest: 7 });
});

test("Heroic guide computes Essence at health factor one for each rank and affix count", () => {
  const heroic = documents().get("mechanics:heroic-tier") as HeroicTier;
  expect(heroic.example).toEqual({ affixCounts: [0, 1, 2], rows: [
    { rank: "other", essence: [3, 5, 7] }, { rank: "elite", essence: [4.5, 7.5, 10.5] },
    { rank: "rare", essence: [6, 10, 14] }, { rank: "boss", essence: [9, 15, 21] },
  ] });
  const unavailable = { ...facts, progression: { ...facts.progression, facts: progressionFacts.filter((row) => row.entityKey !== HEROIC_TIER_KEY) } };
  expect((projectMechanicsDocuments(unavailable, published, spawned, resolve, conditions).get("mechanics:heroic-tier") as HeroicTier).example).toBeUndefined();
});

test("craft and gather guide computes the named product bands and node yield bonus", () => {
  const guide = documents().get("mechanics:crafting-and-gathering") as CraftingAndGathering;
  expect(guide.example.craft).toEqual({ product: expect.objectContaining({ key: "items:1", variant: "crafting" }), skill: expect.objectContaining({ key: "skills:8" }), rank: {
    rank: 1, requiredLevel: 40, baseExperience: 7, bands: [
      { band: "firstFull", from: 40, to: 49, experience: 7 }, { band: "secondFull", from: 50, to: 59, experience: 7 },
      { band: "half", from: 60, to: 74, experience: 4 }, { band: "none", from: 75, experience: 0 },
    ],
  } });
  expect(guide.example.gather).toEqual({ node: expect.objectContaining({ key: "gatheringNodes:small-iron-vein" }), skill: expect.objectContaining({ key: "skills:7" }), levelChances: [{ level: 1, chance: 0.15 }, { level: 100, chance: 15 }] });
  expect(() => projectMechanicsDocuments({ ...facts, recipes: [] }, published, spawned, resolve, conditions)).toThrow("Runeweave Regalia");
  expect(() => projectMechanicsDocuments({ ...facts, gatheringNodes: [] }, published, spawned, resolve, conditions)).toThrow("Small Iron Vein");
});

test("a guide step naming a rule outside its topic stops publication", () => {
  const without = rules.filter((rule) => rule.ruleId !== "kill-base-roll");
  expect(() => projectMechanicsDocuments({ ...facts, progression: { ...facts.progression, mechanicsRules: without } }, published, spawned, resolve, conditions)).toThrow("Guide character-progression step Roll kill experience names missing rule kill-base-roll");
});

test("a catalog without reviewed rules has no mechanics topics", () => {
  expect(projectMechanicsDocuments({ ...facts, progression: { ...facts.progression, mechanicsRules: [] } }, published, spawned, resolve, conditions).size).toBe(0);
});

test("a missing topic has no guide even when placed rules exist", () => {
  const selected = rules.filter((rule) => rule.topic === "character-progression" || rule.topic === null);
  const guides = projectMechanicsDocuments({ ...facts, progression: { ...facts.progression, mechanicsRules: selected } }, published, spawned, resolve, conditions);
  expect([...guides.keys()]).toEqual(["mechanics:character-progression"]);
});
