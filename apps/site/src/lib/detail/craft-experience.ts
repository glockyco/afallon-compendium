import type { RecipeExperienceBand, RecipeRank } from '@afallon/contracts/public';

/**
 * The experience band of a recipe rank at a skill level: locked below the required level, else the band that holds the
 * level, with the next band when the experience changes again at a higher level.
 */
export type CraftBandState =
  | { kind: 'locked' }
  | { kind: 'band'; band: RecipeExperienceBand; next?: RecipeExperienceBand };

export function craftBandAt(rank: RecipeRank, level: number): CraftBandState {
  if (level < rank.requiredLevel) return { kind: 'locked' };
  const index = rank.bands.findIndex((band) => level >= band.from && (band.to === undefined || level <= band.to));
  if (index < 0) return { kind: 'band', band: { band: 'none', from: rank.requiredLevel, experience: rank.baseExperience } };
  const next = rank.bands[index + 1];
  return { kind: 'band', band: rank.bands[index]!, ...(next ? { next } : {}) };
}
