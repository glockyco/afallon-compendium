import type { CharacterProgression } from '@afallon/contracts/public';

type Creature = CharacterProgression['killCalculator']['groups'][number]['creatures'][number];
export type ExperienceRange = { low: number; high: number };
export type AwardStep = ExperienceRange & { label: string };

function roundEven(value: number): number {
  const whole = Math.floor(value);
  const fraction = value - whole;
  return fraction < 0.5 ? whole : fraction > 0.5 ? whole + 1 : whole + (whole % 2);
}

/** Only known modifiers are applied. The world multiplier and other game modifiers are not estimated. */
export function calculateKillAward(creature: Creature, playerLevel: number, heroicMultiplier: number | undefined,
  followers: number, experienceBonus: number): { steps: AwardStep[]; award: ExperienceRange } {
  let low = creature.minExperience;
  let high = creature.maxExperience === low ? low : creature.maxExperience - 1;
  const steps: AwardStep[] = [{ label: 'Base roll', low, high }];

  const modifier = creature.level > playerLevel ? creature.higherModifier : creature.level < playerLevel ? creature.lowerModifier : 0;
  if (modifier !== 0) {
    // GenerateMobEXP truncates the percentage contribution before adding it to the rolled whole amount.
    low += Math.trunc(low * modifier / 100);
    high += Math.trunc(high * modifier / 100);
  }
  const label = creature.level === playerLevel ? 'Same level as the player: no change'
    : `Creature ${creature.level > playerLevel ? 'above' : 'below'} the player: ${modifier >= 0 ? '+' : ''}${modifier}%`;
  steps.push({ label, low, high });

  if (heroicMultiplier !== undefined) {
    low = roundEven(low * heroicMultiplier);
    high = roundEven(high * heroicMultiplier);
    steps.push({ label: `Heroic ×${heroicMultiplier}`, low, high });
  }
  if (followers > 0) {
    low = Math.floor(low / (1 + followers));
    high = Math.floor(high / (1 + followers));
    steps.push({ label: `Followers ÷(1 + ${followers})`, low, high });
  }
  if (experienceBonus > 0) {
    // AddCharacterEXP retains the float until the subsequent, unmodelled world multiplier.
    low *= 1 + experienceBonus / 100;
    high *= 1 + experienceBonus / 100;
    steps.push({ label: `Experience Bonus +${experienceBonus}%`, low, high });
  }
  return { steps, award: { low, high } };
}

/** A higher award gives the lower number of kills. Zero awards cannot reach the next level. */
export function killsToNextLevel(toNext: number, award: ExperienceRange): { low: number; high: number | null } | null {
  if (award.high <= 0) return null;
  return { low: Math.ceil(toNext / award.high), high: award.low <= 0 ? null : Math.ceil(toNext / award.low) };
}
