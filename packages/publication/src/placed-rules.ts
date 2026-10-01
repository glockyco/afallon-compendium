import { placementTargetKind, type CatalogFacts, type CatalogMechanicsRule, type MechanicsTopic, type RulePlacement, type RulePlacementPage } from "@afallon/contracts/catalog";
import type { EntityRef, MechanicsRule, PlacedRule } from "@afallon/contracts/public";
import type { ReferenceResolver } from "./documents";
import { guideStepFor } from "./guide-steps";

export const MECHANICS_TOPIC_NAMES: Readonly<Record<MechanicsTopic, { name: string; description: string }>> = {
  "character-progression": { name: "Character Progression", description: "How a character gains experience, levels, and talent points." },
  "heroic-tier": { name: "Heroic Tier", description: "How the Heroic tier changes kill experience, Heroic Essence, creatures, and gear." },
  "crafting-and-gathering": { name: "Crafting and Gathering", description: "How crafting and gathering give items and skill experience." },
  corruption: { name: "Corruption", description: "How Corruption Tokens, timed dungeons, and corrupted equipment work." },
  loot: { name: "Loot", description: "How bags, chests, and supply packs choose their items." },
};

export function topicRef(topic: MechanicsTopic): EntityRef {
  return { key: `mechanics:${topic}`, kind: "mechanics", name: MECHANICS_TOPIC_NAMES[topic].name, slug: topic };
}

// The reader name of each page kind and target, for the guide's list of where a rule also appears.
const PAGE_NAMES: Readonly<Record<RulePlacementPage, string>> = {
  items: "Item pages", gatheringNodes: "Gathering node pages", skills: "Skill pages", npcs: "NPC pages", quests: "Quest pages", classes: "Class pages",
};
const TARGET_NAMES: Readonly<Record<string, string>> = {
  crafting: "Crafting", teaches: "Teaches", corruption: "Corruption", "when-used": "When used", "how-it-works": "How it works", "how-to-gain-experience": "How to gain experience", experience: "Experience", "talent-points": "Talent points",
};

/** The pages and sections where the rules record places a rule, as reader text. */
export function appearsOn(rule: CatalogMechanicsRule): string[] {
  return rule.placements.map((placement) => `${PAGE_NAMES[placement.page]}, ${TARGET_NAMES[placement.target]}`);
}

export function projectRule(rule: CatalogMechanicsRule, resolve: ReferenceResolver): MechanicsRule {
  return { id: rule.ruleId, section: rule.section, status: rule.status, phrase: rule.phrase.replace("authored experience", "base experience").replace("was not verified", "is unknown"), operands: rule.operands, links: rule.links.map(resolve),
    sources: rule.sources.map((source) => ({ method: source.method, evidence: source.description })), appearsOn: appearsOn(rule) };
}

/**
 * What a page knows about itself when it selects its rules. `entityKey` decides the `linked` scope. `sourceKinds` holds
 * the source kinds of a gathering node for the `spawned` and `placed` scopes. `yieldLevels` are the skill levels at which
 * the page shows the gathering yield bonus.
 */
export interface PlacementContext { entityKey: string; sourceKinds?: ReadonlySet<string>; yieldLevels?: readonly number[] }

function inScope(rule: CatalogMechanicsRule, placement: RulePlacement, context: PlacementContext): boolean {
  switch (placement.scope) {
    case "all": return true;
    case "linked": return rule.links.some((link) => link.entityKey === context.entityKey);
    case "spawned": return context.sourceKinds?.has("spawner-option") ?? false;
    case "placed": return context.sourceKinds?.has("placed-object") ?? false;
  }
}

// The gathering yield bonus is the one placed rule whose values depend on the page: its chance at a skill level.
function levelChances(rule: CatalogMechanicsRule, context: PlacementContext): PlacedRule["levelChances"] {
  if (rule.status !== "verified" || rule.ruleId !== "node-yield-bonus" || context.yieldLevels === undefined || context.yieldLevels.length === 0) return undefined;
  const perLevel = rule.operands.chancePerLevel;
  if (perLevel === undefined || !Number.isFinite(perLevel) || perLevel < 0) return undefined;
  return context.yieldLevels.filter((level) => Number.isInteger(level) && level > 0)
    .map((level) => ({ level, chance: Math.min(100, Math.round(level * perLevel * 1000) / 1000) }));
}

/** The rules that the rules record places on one page, in topic order and then in record order. */
export function placedRules(facts: CatalogFacts, page: RulePlacementPage, context: PlacementContext, resolve: ReferenceResolver): PlacedRule[] {
  const result: PlacedRule[] = [];
  for (const rule of facts.progression.mechanicsRules) {
    for (const placement of rule.placements) {
      if (placement.page !== page || !inScope(rule, placement, context)) continue;
      if (placementTargetKind(page, placement.target) === null) throw new Error(`Rule ${rule.ruleId} names target ${placement.target}, which ${page} pages lack.`);
      if (rule.topic === null) throw new Error(`Rule ${rule.ruleId} places itself without a mechanics guide topic.`);
      const stepId = guideStepFor(rule.topic, rule.ruleId);
      if (!stepId) throw new Error(`Rule ${rule.ruleId} has no step in guide ${rule.topic}.`);
      const chances = levelChances(rule, context);
      result.push({ target: placement.target, guide: topicRef(rule.topic), stepId, ...(chances?.length ? { levelChances: chances } : {}) });
    }
  }
  return result;
}
