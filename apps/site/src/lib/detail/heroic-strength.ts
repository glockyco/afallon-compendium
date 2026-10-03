import type { HeroicTier } from '@afallon/contracts/public';

export type StrengthSettings = Pick<Extract<HeroicTier['settings'], { baseHealthMultiplier: number }>,
  'baseHealthMultiplier' | 'baseDamageMultiplier' | 'gearScoreCoefficient' | 'maxGearBonus'>;

/** The equipped-score bonus scales the additional Heroic strength, not Normal strength. */
export function empoweredStrength(settings: StrengthSettings, score: number): { health: number; damage: number } {
  const bonus = Math.min(Math.max(0, score) * settings.gearScoreCoefficient, settings.maxGearBonus);
  return { health: settings.baseHealthMultiplier * (1 + bonus), damage: settings.baseDamageMultiplier * (1 + bonus) };
}
