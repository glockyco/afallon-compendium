import type { CatalogFacts, CatalogNpcFacts } from "@afallon/contracts/catalog";

// LevelingManager.GenerateMobEXP rolls a kill with the Random.Range(int, int) overload on the record's MinEXP and MaxEXP.
// That overload leaves out its upper bound and returns the lower bound when both are equal, so a record with 1 and 2
// always rolls 1. The method then adds the killed creature's level times EXPBonusPerLevel, before the game modifiers
// and the level difference (research/progression/25434619/rounding-disassembly-20260930.json,
// kill-level-bonus-disassembly-20261001.json, and the measured kills in kill-experience-20261001.json).

export interface KillExperience { min: number; max: number; perLevel: number }

/** The level template of the offered classes, whose `levels` is the character level cap. */
export function characterLevelTemplate(facts: CatalogFacts) {
  const progression = facts.progression.facts;
  const keys = new Set(progression.flatMap((fact) => fact.kind === "classes" && facts.progression.offeredClasses.includes(fact.entityKey) && fact.details.levelTemplate?.entityKey ? [fact.details.levelTemplate.entityKey] : []));
  if (keys.size !== 1) throw new Error(`The offered classes use ${keys.size} level templates; the character progression page needs exactly one.`);
  const key = [...keys][0]!;
  const template = progression.find((fact) => fact.entityKey === key);
  if (template?.kind !== "levels") throw new Error(`The class level template ${key} has no level facts.`);
  return template;
}


/** The roll and the level bonus of one kill, or null when a bound or the bonus is unknown or invalid. */
export function killExperience(npc: Pick<CatalogNpcFacts, "minExperience" | "maxExperience" | "experienceBonusPerLevel">): KillExperience | null {
  const { minExperience: min, maxExperience: max, experienceBonusPerLevel: perLevel } = npc;
  if (min === null || max === null || perLevel === null || min < 0 || max < min || perLevel < 0) return null;
  return { min, max: max > min ? max - 1 : min, perLevel };
}

/** The character level cap, or undefined when the offered classes do not share one level template. */
export function characterLevelCap(facts: CatalogFacts): number | undefined {
  try { return characterLevelTemplate(facts).details.levels; } catch { return undefined; }
}
