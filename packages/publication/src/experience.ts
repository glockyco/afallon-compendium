// LevelingManager.GenerateMobEXP rolls a kill with the Random.Range(int, int) overload on the record's MinEXP and MaxEXP.
// That overload leaves out its upper bound and returns the lower bound when both are equal (build 25434619,
// research/progression/25434619/rounding-disassembly-20260930.json). A record with 1 and 2 therefore always gives 1.

/** The lowest and highest whole amounts that a kill rolls before modifiers, or null when the record has no valid bounds. */
export function killRoll(min: number | null, max: number | null): { min: number; max: number } | null {
  if (min === null || max === null || min < 0 || max < min) return null;
  return { min, max: max > min ? max - 1 : min };
}
