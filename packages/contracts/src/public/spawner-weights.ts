/** The selection weights of one spawner option: at skill level 1, at the spawner's skill cap, and the minimum. */
export interface SpawnerWeights { lowSkillWeight: number; highSkillWeight: number; teaserWeight: number }

/**
 * The weight of a spawner option at a gathering skill level. It moves evenly from its level 1 weight to its weight at the
 * skill cap and stays there above the cap, never drops below its minimum weight, and an active attunement adds its bonus
 * on top. `boost` is the sum of the active attunement bonuses for the option's node.
 */
export function spawnerWeight(option: SpawnerWeights, skillLevel: number, skillCap: number, boost = 0): number {
  const fraction = skillCap <= 1 ? 1 : (Math.min(Math.max(skillLevel, 1), skillCap) - 1) / (skillCap - 1);
  return Math.max(0, option.teaserWeight, option.lowSkillWeight + (option.highSkillWeight - option.lowSkillWeight) * fraction) + boost;
}

/**
 * The chance in percent that a spawner picks each option at a skill level: its weight divided by the total weight of
 * all options. `boosts` gives each option's active attunement bonus. Without any weight, no option has a chance.
 */
export function spawnerChances(options: readonly SpawnerWeights[], skillLevel: number, skillCap: number, boosts: readonly number[] = []): Array<{ weight: number; percent: number }> {
  const weights = options.map((option, index) => spawnerWeight(option, skillLevel, skillCap, boosts[index] ?? 0));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  return weights.map((weight) => ({ weight, percent: total > 0 ? weight / total * 100 : 0 }));
}
