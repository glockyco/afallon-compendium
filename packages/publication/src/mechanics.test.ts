import { expect, test } from "bun:test";
import type { CatalogFacts, CatalogMechanicsRule, CatalogNpcFacts, CatalogProgressionFact, CatalogQuestFacts } from "@afallon/contracts/catalog";
import type { CharacterProgression, HeroicTier } from "@afallon/contracts/public";
import { projectMechanicsDocuments } from "./mechanics";
import { createReferenceResolver } from "./references";

const ref = (entityKey: string, label: string) => ({ entityKey, label });
const classDetails = { autoAttackAbility: null, levelTemplate: ref("levels:0", "Levels"), stats: [], customStats: [], statListTemplate: null, skillBonuses: [], startItems: [], actionAbilities: [], allocationStatPoints: 0, allocatedStats: [] };
const progressionFacts: CatalogProgressionFact[] = [
  { entityKey: "classes:0", name: "Shieldmaster", kind: "classes", details: classDetails },
  { entityKey: "levels:0", name: null, kind: "levels", details: { levels: 3, baseExperience: 20, increaseAmount: 20, rows: [20, 40, 60].map((experienceRequired, index) => ({ level: index + 1, name: null, experienceRequired })) } },
];
const rule: CatalogMechanicsRule = { ruleId: "level-cap-stops-experience", topic: "character-progression", section: "level-curve", ordinal: 0, status: "verified", phrase: "At the cap the award is lost.", operands: {}, links: [], sources: [{ method: "LevelingManager.AddCharacterEXP", description: "Bounded decompilation", object: { sha256: "a".repeat(64), bytes: 1 } }] };
const npc = (nativeId: number, minLevel: number, maxLevel: number, scalesWithPlayer: boolean, lower = 0, higher = 0) => ({ entityKey: `npcs:${nativeId}`, minLevel, maxLevel, scalesWithPlayer, maxExperience: 10, lowerLevelExperienceModifier: lower, higherLevelExperienceModifier: higher }) as CatalogNpcFacts;
const quest = (nativeId: number, max: number | null) => ({ entityKey: `quests:${nativeId}`, experience: 50, levelRequirement: max === null ? null : max - 2, levelRange: max === null ? null : { min: 1, max } }) as CatalogQuestFacts;
const facts = {
  npcs: [npc(1, 1, 30, false, 20, -20), npc(2, 5, 12, false, 20, -20), npc(3, 100, 100, true), npc(4, 1, 20, true), npc(5, 40, 40, false)],
  quests: [quest(1, 31), quest(2, null)],
  progression: { facts: progressionFacts, offeredClasses: ["classes:0"], mechanicsRules: [rule] },
} as unknown as CatalogFacts;
// Placeholder 100–100 records spawn in their zone: npcs:3 at 15–30, npcs:4 without an upper bound.
const spawned = new Map([["npcs:3", { min: 15, max: 30, scales: true }], ["npcs:4", { min: 5, scales: true }]]);
const published = new Set(["npcs:1", "npcs:2", "npcs:3", "npcs:4", "quests:1", "quests:2"]);
const resolve = createReferenceResolver(new Map([["npcs:3", { key: "npcs:3", kind: "npcs" as const, name: "Infected Grain", slug: "infected-grain" }], ["npcs:4", { key: "npcs:4", kind: "npcs" as const, name: "Neonate Vampire", slug: "neonate-vampire" }]]));

test("the level curve stops before the cap, and scaling creatures use their spawned levels", () => {
  const documents = projectMechanicsDocuments(facts, published, spawned, resolve);
  const progression = documents.get("mechanics:character-progression") as CharacterProgression;
  expect([progression.curve.cap, progression.curve.rows]).toEqual([3, [{ level: 1, toNext: 20 }, { level: 2, toNext: 40 }]]);
  // The unpublished level-40 creature does not raise the fixed-level range.
  expect(progression.sources.fixedCreatures).toEqual({ count: 2, minLevel: 1, maxLevel: 30 });
  // The authored 100–100 of npcs:3 is a placeholder: its spawned levels stay within the fixed range, so only the unbounded npcs:4 is listed.
  expect([progression.sources.scalingCreatures.count, progression.sources.scalingCreatures.aboveFixed.map((row) => [row.creature.key, row.level])]).toEqual([2, [["npcs:4", { min: 5, scales: true }]]]);
  expect(progression.sources.quests).toEqual({ count: 2, maxLevel: 31, maxRequirement: 29, withoutRange: 1 });
  expect(progression.sources.levelModifiers).toEqual([{ lower: 20, higher: -20, creatures: 2 }]);
  expect((documents.get("mechanics:heroic-tier") as HeroicTier).settings).toEqual({ unavailable: "The scan of this build recorded no Heroic tier settings." });
});

test("a catalog without reviewed rules has no mechanics topics", () => {
  expect(projectMechanicsDocuments({ ...facts, progression: { ...facts.progression, mechanicsRules: [] } }, published, spawned, resolve).size).toBe(0);
});
