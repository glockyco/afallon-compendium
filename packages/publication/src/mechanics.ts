import { HEROIC_TIER_KEY, type CatalogFacts, type CatalogMechanicsRule, type MechanicsTopic } from "@afallon/contracts/catalog";
import type { CharacterProgression, CraftingAndGathering, EntityRef, PublicLevel, ExperienceSources, HeroicTier, MechanicsRule, PublicMechanics, TalentPoints } from "@afallon/contracts/public";
import type { ReferenceResolver } from "./documents";
import { spawnerExamples } from "./gathering";
import { displayName } from "./text";

const TOPICS: Record<MechanicsTopic, { name: string; description: string }> = {
  "character-progression": { name: "Character Progression", description: "How a character gains experience, levels, and talent points in this build." },
  "heroic-tier": { name: "Heroic Tier", description: "How the Heroic tier changes kill experience, Heroic Essence, creatures, and gear in this build." },
  "crafting-and-gathering": { name: "Crafting and Gathering", description: "How crafting and gathering give items and skill experience in this build." },
};

function topicRef(topic: MechanicsTopic): EntityRef {
  return { key: `mechanics:${topic}`, kind: "mechanics", name: TOPICS[topic].name, slug: topic };
}

function rules(all: readonly CatalogMechanicsRule[], topic: MechanicsTopic, resolve: ReferenceResolver): MechanicsRule[] {
  return all.filter((rule) => rule.topic === topic).sort((a, b) => a.ordinal - b.ordinal).map((rule) => ({
    id: rule.ruleId, section: rule.section, status: rule.status, phrase: rule.phrase, operands: rule.operands,
    links: rule.links.map(resolve), sources: rule.sources.map((source) => ({ method: source.method, evidence: source.description })),
  }));
}

/**
 * The level template of the offered classes. Every offered class must use the same template, because the page shows one
 * curve for all characters.
 */
function characterTemplate(facts: CatalogFacts) {
  const progression = facts.progression.facts;
  const keys = new Set(progression.flatMap((fact) => fact.kind === "classes" && facts.progression.offeredClasses.includes(fact.entityKey) && fact.details.levelTemplate?.entityKey ? [fact.details.levelTemplate.entityKey] : []));
  if (keys.size !== 1) throw new Error(`The offered classes use ${keys.size} level templates; the character progression page needs exactly one.`);
  const key = [...keys][0]!;
  const template = progression.find((fact) => fact.entityKey === key);
  if (template?.kind !== "levels") throw new Error(`The class level template ${key} has no level facts.`);
  return template;
}

function experienceSources(facts: CatalogFacts, published: ReadonlySet<string>, spawned: ReadonlyMap<string, PublicLevel>, resolve: ReferenceResolver): ExperienceSources {
  const creatures = facts.npcs.filter((npc) => published.has(npc.entityKey) && (npc.maxExperience ?? 0) > 0 && npc.minLevel !== null && npc.maxLevel !== null);
  const fixed = creatures.filter((npc) => !npc.scalesWithPlayer), scaling = creatures.filter((npc) => npc.scalesWithPlayer);
  if (fixed.length === 0) throw new Error("No published fixed-level creature gives experience.");
  const fixedMax = Math.max(...fixed.map((npc) => npc.maxLevel!));
  const quests = facts.quests.filter((quest) => published.has(quest.entityKey) && (quest.experience ?? 0) > 0);
  const ranged = quests.flatMap((quest) => quest.levelRange ? [quest.levelRange.max] : []);
  const requirements = quests.flatMap((quest) => quest.levelRequirement === null ? [] : [quest.levelRequirement]);
  const modifiers = new Map<string, { lower: number; higher: number; creatures: number }>();
  for (const npc of creatures) {
    const lower = npc.lowerLevelExperienceModifier ?? 0, higher = npc.higherLevelExperienceModifier ?? 0;
    if (lower === 0 && higher === 0) continue;
    const key = `${lower}:${higher}`, row = modifiers.get(key) ?? { lower, higher, creatures: 0 };
    row.creatures += 1;
    modifiers.set(key, row);
  }
  return {
    fixedCreatures: { count: fixed.length, minLevel: Math.max(0, Math.min(...fixed.map((npc) => npc.minLevel!))), maxLevel: fixedMax },
    scalingCreatures: {
      count: scaling.length,
      // The authored range of a scaling creature is not its level: the spawner's zone range bounds it.
      aboveFixed: scaling.flatMap((npc) => { const level = spawned.get(npc.entityKey); return level && (level.max === undefined || level.max > fixedMax) ? [{ npc, level }] : []; })
        .sort((a, b) => a.npc.entityKey.localeCompare(b.npc.entityKey)).map(({ npc, level }) => ({ creature: resolve({ entityKey: npc.entityKey, label: npc.entityKey }), level })),
    },
    quests: { count: quests.length, maxLevel: Math.max(0, ...ranged), ...(requirements.length ? { maxRequirement: Math.max(...requirements) } : {}), withoutRange: quests.length - ranged.length },
    levelModifiers: [...modifiers.values()].sort((a, b) => b.creatures - a.creatures || a.lower - b.lower || a.higher - b.higher),
  };
}

// Talent points that every class gains at a character level-up.
function levelUpTalentPoints(facts: CatalogFacts): TalentPoints[] {
  return facts.progression.facts.flatMap((fact): TalentPoints[] => {
    if (fact.kind !== "treePoints") return [];
    const gains = fact.details.gainRules.filter((rule) => rule.class === null && rule.trigger.name === "characterLevelUp");
    return gains.length === 0 ? [] : [{ name: displayName(fact.name ?? ""), start: Math.max(0, fact.details.startAmount), max: Math.max(0, fact.details.maxPoints), gains: gains.map((rule) => ({ trigger: "characterLevelUp" as const, amount: Math.max(0, rule.amount) })) }];
  });
}

function characterProgression(facts: CatalogFacts, published: ReadonlySet<string>, spawned: ReadonlyMap<string, PublicLevel>, resolve: ReferenceResolver): CharacterProgression {
  const template = characterTemplate(facts), cap = template.details.levels;
  // A template row holds the experience from its level to the next level. The cap has no next level.
  const rows = template.details.rows.slice(0, Math.max(0, cap - 1)).map((row, index) => ({ level: index + 1, toNext: Math.max(0, row.experienceRequired) }));
  if (rows.length === 0 || rows.length !== cap - 1) throw new Error(`The class level template has ${template.details.rows.length} rows for its cap ${cap}.`);
  return {
    ref: topicRef("character-progression"), description: TOPICS["character-progression"].description, art: {}, topic: "character-progression",
    curve: { template: displayName(template.name ?? "") || "Character levels", cap, rows },
    sources: experienceSources(facts, published, spawned, resolve), talentPoints: levelUpTalentPoints(facts),
    rules: rules(facts.progression.mechanicsRules, "character-progression", resolve),
  };
}

function heroicTier(facts: CatalogFacts, resolve: ReferenceResolver): HeroicTier {
  const fact = facts.progression.facts.find((candidate) => candidate.entityKey === HEROIC_TIER_KEY);
  let settings: HeroicTier["settings"];
  if (fact?.kind !== "heroicTier") settings = { unavailable: "The scan of this build recorded no Heroic tier settings." };
  else {
    const { asset: _asset, essenceTreePoint, ...values } = fact.details;
    settings = { ...values, ...(essenceTreePoint?.label ? { essencePoints: displayName(essenceTreePoint.label) } : {}) };
  }
  return {
    ref: topicRef("heroic-tier"), description: TOPICS["heroic-tier"].description, art: {}, topic: "heroic-tier", settings,
    rules: rules(facts.progression.mechanicsRules, "heroic-tier", resolve),
  };
}

function craftingAndGathering(facts: CatalogFacts, resolve: ReferenceResolver): CraftingAndGathering {
  return {
    ref: topicRef("crafting-and-gathering"), description: TOPICS["crafting-and-gathering"].description, art: {}, topic: "crafting-and-gathering",
    rules: rules(facts.progression.mechanicsRules, "crafting-and-gathering", resolve), spawnerExamples: spawnerExamples(facts.gatheringNodes, resolve, new Map()),
  };
}

/**
 * The mechanics topic documents, keyed by their publication-owned keys. `published` holds the keys of records that have
 * references, and `spawned` the level range of each creature over its published spawners. A catalog built from a v2
 * plan always carries the reviewed rules; a catalog without them has no topics.
 */
export function projectMechanicsDocuments(facts: CatalogFacts, published: ReadonlySet<string>, spawned: ReadonlyMap<string, PublicLevel>, resolve: ReferenceResolver): ReadonlyMap<string, PublicMechanics> {
  if (facts.progression.mechanicsRules.length === 0) return new Map();
  const documents: PublicMechanics[] = [characterProgression(facts, published, spawned, resolve), heroicTier(facts, resolve), craftingAndGathering(facts, resolve)];
  return new Map(documents.map((document) => [document.ref.key, document]));
}
