import { MECHANICS_TOPIC_DETAILS, placementTargetKind, type CatalogFacts, type CatalogMechanicsRule, type MechanicsTopic, type RulePlacement, type RulePlacementPage } from "@afallon/contracts/catalog";
import type { EntityRef, MechanicsRule, PlacedRule } from "@afallon/contracts/public";
import type { ReferenceResolver } from "./documents/projection";
import { guideHasSection } from "./guide-sections";

export function topicRef(topic: MechanicsTopic): EntityRef {
  return { key: `mechanics:${topic}`, kind: "mechanics", name: MECHANICS_TOPIC_DETAILS[topic].name, slug: topic };
}

export function projectRule(rule: CatalogMechanicsRule, resolve: ReferenceResolver): MechanicsRule {
  return { id: rule.ruleId, status: rule.status, phrase: rule.phrase, operands: rule.operands, links: rule.links.map(resolve) };
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

/**
 * The guide sections that the rules record places on one page, in topic order and then in record order. A target links
 * a section once, however many of its rules the record places there. The yield bonus chances of a section come from
 * the one rule that has them.
 */
export function placedRules(facts: CatalogFacts, page: RulePlacementPage, context: PlacementContext, resolve: ReferenceResolver): PlacedRule[] {
  const result = new Map<string, PlacedRule>();
  for (const rule of facts.progression.mechanicsRules) {
    for (const placement of rule.placements) {
      if (placement.page !== page || !inScope(rule, placement, context)) continue;
      if (placementTargetKind(page, placement.target) === null) throw new Error(`Rule ${rule.ruleId} names target ${placement.target}, which ${page} pages lack.`);
      if (rule.topic === null) throw new Error(`Rule ${rule.ruleId} places itself without a mechanics guide topic.`);
      if (!guideHasSection(rule.topic, rule.section)) throw new Error(`Rule ${rule.ruleId} names section ${rule.section}, which guide ${rule.topic} does not define.`);
      const key = `${placement.target}\u0000${rule.topic}\u0000${rule.section}`;
      const chances = levelChances(rule, context);
      const placed = result.get(key) ?? { target: placement.target, guide: topicRef(rule.topic), section: rule.section };
      result.set(key, chances?.length ? { ...placed, levelChances: chances } : placed);
    }
  }
  return [...result.values()];
}
