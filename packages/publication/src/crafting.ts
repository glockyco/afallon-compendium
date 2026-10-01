import type { CatalogFacts, CatalogMechanicsRule } from "@afallon/contracts/catalog";
import type { RecipeExperienceBand, RecipeRank } from "@afallon/contracts/public";

/** A verified rule of the rules record. Publication stops when a rule that a page needs is missing or not verified. */
export function verifiedRule(facts: CatalogFacts, id: string): CatalogMechanicsRule {
  const rule = facts.progression.mechanicsRules.find((candidate) => candidate.ruleId === id);
  if (!rule) throw new Error(`The rules record has no ${id} rule.`);
  if (rule.status !== "verified") throw new Error(`The ${id} rule is not verified.`);
  return rule;
}

function operand(rule: CatalogMechanicsRule, name: string): number {
  const value = rule.operands[name];
  if (value === undefined || !Number.isFinite(value)) throw new Error(`The ${rule.ruleId} rule has no ${name} operand.`);
  return value;
}

/** The crafting gate and experience bands, relative to a rank's required level. */
export interface CraftingRule { minimumRequiredLevel: number; halfFromLevels: number; noneFromLevels: number; halfMultiplier: number }

export function craftingRule(facts: CatalogFacts): CraftingRule {
  const gate = verifiedRule(facts, "recipe-rank-gate"), bands = verifiedRule(facts, "recipe-experience-bands");
  verifiedRule(facts, "recipe-experience-rounding");
  return {
    minimumRequiredLevel: operand(gate, "minimumRequiredLevel"), halfFromLevels: operand(bands, "halfFromLevels"),
    noneFromLevels: operand(bands, "noneFromLevels"), halfMultiplier: operand(bands, "halfMultiplier"),
  };
}

/** The game's rounding of a reduced amount: to the nearest whole number, with a half going to the even number. */
export function roundHalfEven(value: number): number {
  const floor = Math.floor(value), fraction = value - floor;
  if (fraction > 0.5) return floor + 1;
  if (fraction < 0.5) return floor;
  return floor % 2 === 0 ? floor : floor + 1;
}

/**
 * The required skill level and the experience bands of one recipe rank, up to the skill's highest level. A rank without
 * base experience has no bands, so a page does not show an award that the craft never gives.
 */
export function recipeRank(rank: { rank: number; unlockCost: number; experience: number }, highestLevel: number, rule: CraftingRule): RecipeRank {
  if (!Number.isInteger(rank.experience) || rank.experience < 0) throw new Error(`Recipe rank ${rank.rank} has base experience ${rank.experience}.`);
  const requiredLevel = Math.max(Math.trunc(rank.unlockCost), rule.minimumRequiredLevel), base = rank.experience;
  const segments: Array<{ band: RecipeExperienceBand["band"]; from: number; to: number; experience: number }> = [
    { band: "full", from: requiredLevel, to: requiredLevel + rule.halfFromLevels - 1, experience: base },
    { band: "half", from: requiredLevel + rule.halfFromLevels, to: requiredLevel + rule.noneFromLevels - 1, experience: roundHalfEven(base * rule.halfMultiplier) },
    { band: "none", from: requiredLevel + rule.noneFromLevels, to: highestLevel, experience: 0 },
  ];
  const bands = base === 0 ? [] : segments.filter((segment) => segment.from <= highestLevel).map(({ band, from, to, experience }) => ({ band, from, ...(to < highestLevel ? { to } : {}), experience }));
  return { rank: Math.max(0, rank.rank), requiredLevel, baseExperience: base, bands };
}

/**
 * The recipe that each item teaches: the target of its first Recipe rank-up game action, which the game's item tooltip
 * reads. An item whose first such action names no known recipe teaches nothing.
 */
export function recipeTeachings(facts: CatalogFacts): ReadonlyMap<string, string> {
  const result = new Map<string, string>();
  for (const item of facts.items) {
    const action = item.gameActions.find((candidate) => candidate.type === "Recipe" && candidate.nodeAction === "RankUp");
    if (action?.target?.entityKey) result.set(item.entityKey, action.target.entityKey);
  }
  return result;
}

/** The skills that auto-attack hits train, with the experience of one hit. */
export function weaponSkillExperience(facts: CatalogFacts): { skills: ReadonlySet<string>; perHit: number } {
  const hit = verifiedRule(facts, "weapon-skill-hit"), mapping = verifiedRule(facts, "weapon-skills");
  const skills = new Set(mapping.links.map((link) => {
    if (link.entityKey === null) throw new Error(`The weapon-skills rule links an unknown skill: ${link.label}.`);
    return link.entityKey;
  }));
  return { skills, perHit: operand(hit, "hitExperience") };
}
