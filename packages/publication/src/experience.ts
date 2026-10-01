import type { CatalogNpcFacts } from "@afallon/contracts/catalog";

// LevelingManager.GenerateMobEXP rolls a kill with the Random.Range(int, int) overload on the record's MinEXP and MaxEXP.
// That overload leaves out its upper bound and returns the lower bound when both are equal, so a record with 1 and 2
// always rolls 1. The method then adds the killed creature's level times EXPBonusPerLevel, before the game modifiers
// and the level difference (research/progression/25434619/rounding-disassembly-20260930.json,
// kill-level-bonus-disassembly-20261001.json, and the measured kills in kill-experience-20261001.json).

export interface KillExperience { min: number; max: number; perLevel: number }

/** The roll and the level bonus of one kill, or null when a bound or the bonus is unknown or invalid. */
export function killExperience(npc: Pick<CatalogNpcFacts, "minExperience" | "maxExperience" | "experienceBonusPerLevel">): KillExperience | null {
  const { minExperience: min, maxExperience: max, experienceBonusPerLevel: perLevel } = npc;
  if (min === null || max === null || perLevel === null || min < 0 || max < min || perLevel < 0) return null;
  return { min, max: max > min ? max - 1 : min, perLevel };
}
