import { HEROIC_TIER_KEY, type CatalogCondition, type CatalogFacts, type CatalogMechanicsRule, type MechanicsTopic } from "@afallon/contracts/catalog";
import type { CharacterProgression, CraftingAndGathering, EntityRef, ExperienceSources, GuideStep, HeroicTier, PublicLevel, PublicMechanics, TalentPoints } from "@afallon/contracts/public";
import { craftingRule, recipeRank, verifiedRule } from "./crafting";
import type { ReferenceResolver } from "./documents";
import { requiredLevel, spawnerExamples } from "./gathering";
import { MECHANICS_TOPIC_NAMES, placedRules, projectRule, topicRef } from "./placed-rules";
import { displayName } from "./text";

const GUIDES: Record<MechanicsTopic, { overview: string; steps: GuideStep[] }> = {
  "character-progression": {
    overview: "Characters gain experience from creature kills and quests, and skills gain experience from their own sources. Experience above the next level carries over. The level curve shows the experience that each level needs.",
    steps: [
      { title: "Roll kill experience", text: "A kill starts from a random whole amount in the creature's experience range.", rules: ["kill-base-roll"] },
      { title: "Adjust the kill", text: "The level difference, the Heroic multiplier, and the number of followers change the amount. Some game modifiers are not known.", rules: ["kill-level-difference", "kill-heroic-multiplier", "kill-companion-split", "kill-game-modifiers"] },
      { title: "Scale quest experience", text: "A quest reward scales with the player level, and a quest step gives a fixed amount.", rules: ["quest-reward-level-scale", "quest-action-amount"] },
      { title: "Apply experience bonuses", text: "The Experience Bonus total and the world modifier then change each character award.", rules: ["experience-bonus-stat", "world-modifier-multiplier"] },
      { title: "Level up", text: "Experience above the next level carries over, and the level cap stops all gains.", rules: ["surplus-experience-carries", "level-cap-stops-experience"] },
      { title: "Gain skill experience", text: "Hits, crafts, nodes, and other sources give skill experience, which stops at the skill's maximum level.", rules: ["skill-award-sources", "skill-award-modifiers"] },
    ],
  },
  "heroic-tier": {
    overview: "Heroic tier changes experience from creature kills and can award Heroic Essence. The recorded settings also describe Heroic creatures and gear.",
    steps: [
      { title: "Multiply kill experience", text: "A kill of a Heroic creature multiplies its kill experience. Quest experience does not change.", rules: ["heroic-kill-experience"] },
      { title: "Start from the affixes", text: "Heroic Essence starts from a base amount plus an amount for each affix of the creature.", rules: ["essence-requires-points", "affix-count-source"] },
      { title: "Apply rank and health", text: "Elite, Rare, and Boss creatures multiply the Essence, and the health factor scales it within its bounds.", rules: ["essence-rank-multiplier", "essence-health-factor"] },
      { title: "Carry the fraction", text: "The character receives the whole part, and the fraction waits for the next kill.", rules: ["essence-fraction-carry"] },
    ],
  },
  "crafting-and-gathering": {
    overview: "A craft turns materials into products and gives experience to the recipe's skill. A gathering node gives items from its loot table and experience to its gathering skill.",
    steps: [
      { title: "Check the crafting level", text: "A craft starts only when the crafting skill reaches the required level of the recipe.", rules: ["recipe-rank-gate"] },
      { title: "Provide materials and space", text: "A craft needs every material and enough empty bag slots for its products.", rules: ["recipe-craft-needs"] },
      { title: "Roll each product", text: "Each product has its own chance to be made.", rules: ["recipe-product-roll"] },
      { title: "Award crafting experience", text: "The skill level relative to the required level selects full, half, or no base experience.", rules: ["recipe-experience-bands", "recipe-experience-rounding", "recipe-experience-condition", "recipe-experience-modifiers"] },
      { title: "Pick a node", text: "A spawner picks one node by weight, and the weights change with the gathering skill.", rules: ["spawner-weighted-pick", "spawner-weight-limits", "spawner-weights-relative"] },
      { title: "Wait for the node", text: "A spawner rolls only near the player and rolls again after its respawn time.", rules: ["spawner-player-range", "spawner-respawn", "placed-node-cooldown", "node-requirements"] },
      { title: "Gather the items", text: "Each item of the loot table rolls on its own, and the skill level can add one more item.", rules: ["node-loot-roll", "node-yield-bonus"] },
      { title: "Award gathering experience", text: "A used node gives its skill experience and its character experience.", rules: ["node-experience"] },
    ],
  },
};

function guide(facts: CatalogFacts, topic: MechanicsTopic, resolve: ReferenceResolver) {
  const rules = facts.progression.mechanicsRules.filter((rule) => rule.topic === topic).sort((a, b) => a.ordinal - b.ordinal);
  const ids = new Set(rules.map((rule) => rule.ruleId));
  for (const step of GUIDES[topic].steps) for (const id of step.rules) {
    if (!ids.has(id)) throw new Error(`Guide ${topic} step ${step.title} names missing rule ${id}.`);
  }
  return { ...GUIDES[topic], rules: rules.map((rule) => projectRule(rule, resolve)) };
}

/** Every offered class uses the same template because the guide shows one curve. */
function characterTemplate(facts: CatalogFacts) {
  const progression = facts.progression.facts;
  const keys = new Set(progression.flatMap((fact) => fact.kind === "classes" && facts.progression.offeredClasses.includes(fact.entityKey) && fact.details.levelTemplate?.entityKey ? [fact.details.levelTemplate.entityKey] : []));
  if (keys.size !== 1) throw new Error(`The offered classes use ${keys.size} level templates; the character progression page needs exactly one.`);
  const key = [...keys][0]!;
  const template = progression.find((fact) => fact.entityKey === key);
  if (template?.kind !== "levels") throw new Error(`The class level template ${key} has no level facts.`);
  return template;
}

function publishedRef(resolve: ReferenceResolver, key: string, label: string): EntityRef {
  const ref = resolve({ entityKey: key, label });
  if (ref.key !== key || !ref.slug) throw new Error(`The guide example entity ${label} (${key}) has no published page.`);
  return ref;
}

function killExample(facts: CatalogFacts, published: ReadonlySet<string>, resolve: ReferenceResolver): CharacterProgression["example"] {
  verifiedRule(facts, "kill-base-roll");
  const names = new Map(facts.entities.map((entity) => [entity.entityKey, displayName(entity.name ?? "")]));
  const candidates = facts.npcs.filter((npc) => published.has(npc.entityKey) && !npc.scalesWithPlayer && npc.minLevel !== null && npc.minLevel === npc.maxLevel
    && npc.minExperience !== null && npc.maxExperience !== null && npc.maxExperience > 0 && names.has(npc.entityKey));
  candidates.sort((a, b) => names.get(a.entityKey)!.localeCompare(names.get(b.entityKey)!) || a.entityKey.localeCompare(b.entityKey));
  const npc = candidates[0];
  if (!npc) throw new Error("No published fixed-level creature with experience exists for the kill example.");
  return { creature: publishedRef(resolve, npc.entityKey, names.get(npc.entityKey)!), level: npc.minLevel!, lowest: npc.minExperience!, highest: Math.max(npc.minExperience!, npc.maxExperience! - 1) };
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
      // A scaling creature gets its level from its spawner's zone, not its authored range.
      aboveFixed: scaling.flatMap((npc) => { const level = spawned.get(npc.entityKey); return level && (level.max === undefined || level.max > fixedMax) ? [{ npc, level }] : []; })
        .sort((a, b) => a.npc.entityKey.localeCompare(b.npc.entityKey)).map(({ npc, level }) => ({ creature: resolve({ entityKey: npc.entityKey, label: npc.entityKey }), level })),
    },
    quests: { count: quests.length, maxLevel: Math.max(0, ...ranged), ...(requirements.length ? { maxRequirement: Math.max(...requirements) } : {}), withoutRange: quests.length - ranged.length },
    levelModifiers: [...modifiers.values()].sort((a, b) => b.creatures - a.creatures || a.lower - b.lower || a.higher - b.higher),
  };
}

function levelUpTalentPoints(facts: CatalogFacts): TalentPoints[] {
  return facts.progression.facts.flatMap((fact): TalentPoints[] => {
    if (fact.kind !== "treePoints") return [];
    const gains = fact.details.gainRules.filter((rule) => rule.class === null && rule.trigger.name === "characterLevelUp");
    return gains.length === 0 ? [] : [{ name: displayName(fact.name ?? ""), start: Math.max(0, fact.details.startAmount), max: Math.max(0, fact.details.maxPoints), gains: gains.map((rule) => ({ trigger: "characterLevelUp" as const, amount: Math.max(0, rule.amount) })) }];
  });
}

function characterProgression(facts: CatalogFacts, published: ReadonlySet<string>, spawned: ReadonlyMap<string, PublicLevel>, resolve: ReferenceResolver): CharacterProgression {
  const template = characterTemplate(facts), cap = template.details.levels;
  const rows = template.details.rows.slice(0, Math.max(0, cap - 1)).map((row, index) => ({ level: index + 1, toNext: Math.max(0, row.experienceRequired) }));
  if (rows.length === 0 || rows.length !== cap - 1) throw new Error(`The class level template has ${template.details.rows.length} rows for its cap ${cap}.`);
  return {
    ref: topicRef("character-progression"), description: MECHANICS_TOPIC_NAMES["character-progression"].description, art: {}, topic: "character-progression",
    curve: { template: displayName(template.name ?? "") || "Character levels", cap, rows },
    sources: experienceSources(facts, published, spawned, resolve), talentPoints: levelUpTalentPoints(facts),
    ...guide(facts, "character-progression", resolve), example: killExample(facts, published, resolve),
  };
}

function essenceExample(settings: Exclude<HeroicTier["settings"], { unavailable: string }>): HeroicTier["example"] {
  const affixCounts = Array.from({ length: settings.maxAffixes + 1 }, (_, count) => count);
  return { affixCounts, rows: (["other", "elite", "rare", "boss"] as const).map((rank) => ({ rank,
    essence: affixCounts.map((count) => (settings.essenceBaseAmount + settings.essencePerAffix * count)
      * (rank === "other" ? 1 : rank === "elite" ? settings.essenceEliteMultiplier : rank === "rare" ? settings.essenceRareMultiplier : settings.essenceBossMultiplier)),
  })) };
}

function heroicTier(facts: CatalogFacts, resolve: ReferenceResolver): HeroicTier {
  const fact = facts.progression.facts.find((candidate) => candidate.entityKey === HEROIC_TIER_KEY);
  let settings: HeroicTier["settings"];
  if (fact?.kind !== "heroicTier") settings = { unavailable: "The scan of this build recorded no Heroic tier settings." };
  else {
    const { asset: _asset, essenceTreePoint, ...values } = fact.details;
    settings = { ...values, ...(essenceTreePoint?.label ? { essencePoints: displayName(essenceTreePoint.label) } : {}) };
  }
  const example = "unavailable" in settings ? undefined : essenceExample(settings);
  if (example) verifiedRule(facts, "essence-rank-multiplier");
  return {
    ref: topicRef("heroic-tier"), description: MECHANICS_TOPIC_NAMES["heroic-tier"].description, art: {}, topic: "heroic-tier", settings,
    ...guide(facts, "heroic-tier", resolve), ...(example ? { example } : {}),
  };
}

function craftingExample(facts: CatalogFacts, published: ReadonlySet<string>, conditions: ReadonlyMap<string, CatalogCondition>, resolve: ReferenceResolver): CraftingAndGathering["example"] {
  const recipe = facts.recipes.find((candidate) => facts.entities.some((entity) => entity.entityKey === candidate.entityKey && displayName(entity.name ?? "") === "Runeweave Regalia"));
  const product = recipe?.ranks.flatMap((rank) => rank.products).find((row) => row.item.entityKey !== null && published.has(row.item.entityKey));
  if (!recipe || !product?.item.entityKey || !recipe.skill?.entityKey || recipe.ranks.length === 0) throw new Error("The Runeweave Regalia example has no published product, skill, or rank.");
  const skill = facts.progression.facts.find((fact) => fact.entityKey === recipe.skill?.entityKey);
  if (skill?.kind !== "skills" || skill.details.maxLevel <= 0) throw new Error("The Runeweave Regalia example has no published skill level.");
  const node = facts.gatheringNodes.find((candidate) => displayName(candidate.name) === "Small Iron Vein");
  if (!node || !published.has(node.entityKey) || !node.skill?.entityKey) throw new Error("The Small Iron Vein example has no published node or skill.");
  const nodeSkill = facts.progression.facts.find((fact) => fact.entityKey === node.skill?.entityKey);
  if (nodeSkill?.kind !== "skills" || nodeSkill.details.maxLevel <= 0) throw new Error("The Small Iron Vein example has no published skill level.");
  const rank = recipeRank(recipe.ranks[0]!, skill.details.maxLevel, craftingRule(facts));
  verifiedRule(facts, "node-yield-bonus");
  const levels = [...new Set([requiredLevel(node, conditions) ?? 1, nodeSkill.details.maxLevel])];
  const chances = placedRules(facts, "gatheringNodes", { entityKey: node.entityKey, sourceKinds: new Set(node.sources.map((source) => source.sourceKind)), yieldLevels: levels }, resolve)
    .find((placed) => placed.rule.id === "node-yield-bonus")?.levelChances;
  if (!chances) throw new Error("The Small Iron Vein example has no placed node-yield-bonus rule.");
  return {
    craft: { product: { ...publishedRef(resolve, product.item.entityKey, product.item.label ?? "Runeweave Regalia"), variant: "crafting" }, skill: publishedRef(resolve, recipe.skill.entityKey, recipe.skill.label ?? "Skill"), rank },
    gather: { node: publishedRef(resolve, node.entityKey, node.name), skill: publishedRef(resolve, node.skill.entityKey, node.skill.label ?? "Skill"), levelChances: chances },
  };
}

function craftingAndGathering(facts: CatalogFacts, published: ReadonlySet<string>, conditions: ReadonlyMap<string, CatalogCondition>, resolve: ReferenceResolver): CraftingAndGathering {
  return {
    ref: topicRef("crafting-and-gathering"), description: MECHANICS_TOPIC_NAMES["crafting-and-gathering"].description, art: {}, topic: "crafting-and-gathering",
    ...guide(facts, "crafting-and-gathering", resolve), spawnerExamples: spawnerExamples(facts.gatheringNodes, resolve, new Map()),
    example: craftingExample(facts, published, conditions, resolve),
  };
}

/** Project the published guide for each topic of the reviewed rules record. */
export function projectMechanicsDocuments(facts: CatalogFacts, published: ReadonlySet<string>, spawned: ReadonlyMap<string, PublicLevel>, resolve: ReferenceResolver, conditions: ReadonlyMap<string, CatalogCondition>): ReadonlyMap<string, PublicMechanics> {
  const topics = new Set(facts.progression.mechanicsRules.flatMap((rule) => rule.topic === null ? [] : [rule.topic]));
  const documents: PublicMechanics[] = [
    ...(topics.has("character-progression") ? [characterProgression(facts, published, spawned, resolve)] : []),
    ...(topics.has("heroic-tier") ? [heroicTier(facts, resolve)] : []),
    ...(topics.has("crafting-and-gathering") ? [craftingAndGathering(facts, published, conditions, resolve)] : []),
  ];
  return new Map(documents.map((document) => [document.ref.key, document]));
}
