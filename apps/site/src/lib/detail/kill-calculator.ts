import type { CharacterProgression, PublicLevel } from '@afallon/contracts/public';
import { signedAmount } from '../format';

type Creature = CharacterProgression['killCalculator']['groups'][number]['creatures'][number];
export type ExperienceRange = { low: number; high: number };
export type AwardStep = ExperienceRange & { label: string };

function roundEven(value: number): number {
  const whole = Math.floor(value);
  const fraction = value - whole;
  return fraction < 0.5 ? whole : fraction > 0.5 ? whole + 1 : whole + (whole % 2);
}

/** The levels at which a creature spawns at one place. A zone range without a maximum runs to the level cap. */
export function creatureLevels(level: PublicLevel, cap: number): number[] {
  const max = Math.max(level.min, level.max ?? cap);
  return Array.from({ length: max - level.min + 1 }, (_, index) => level.min + index);
}

/** The creature level nearest to the character level. A scaling spawner gives that level, apart from a small offset. */
export function nearestCreatureLevel(level: PublicLevel, characterLevel: number, cap: number): number {
  return Math.min(Math.max(level.min, level.max ?? cap), Math.max(level.min, characterLevel));
}

/** Only known modifiers are applied. The world multiplier and other game modifiers are not estimated. */
export function calculateKillAward(creature: Pick<Creature, 'minExperience' | 'maxExperience' | 'experiencePerLevel' | 'lowerModifier' | 'higherModifier'>,
  creatureLevel: number, characterLevel: number, heroicMultiplier: number | undefined, followers: number, experienceBonus: number): { steps: AwardStep[]; award: ExperienceRange } {
  let low = creature.minExperience;
  let high = creature.maxExperience;
  const steps: AwardStep[] = [{ label: 'Base roll', low, high }];
  if (creature.experiencePerLevel > 0) {
    // GenerateMobEXP adds the creature's level times its experience per level before the game modifiers.
    low += creatureLevel * creature.experiencePerLevel;
    high += creatureLevel * creature.experiencePerLevel;
    steps.push({ label: `Level ${creatureLevel} × ${creature.experiencePerLevel} per level`, low, high });
  }

  const modifier = creatureLevel > characterLevel ? creature.higherModifier : creatureLevel < characterLevel ? creature.lowerModifier : 0;
  if (modifier !== 0) {
    // GenerateMobEXP truncates the percentage contribution before adding it to the rolled whole amount.
    low += Math.trunc(low * modifier / 100);
    high += Math.trunc(high * modifier / 100);
  }
  const label = creatureLevel === characterLevel ? 'Same level as the player'
    : `Creature ${creatureLevel > characterLevel ? 'above' : 'below'} the player: ${modifier === 0 ? 'no change' : signedAmount(modifier, true)}`;
  steps.push({ label, low, high });

  if (heroicMultiplier !== undefined) {
    low = roundEven(low * heroicMultiplier);
    high = roundEven(high * heroicMultiplier);
    steps.push({ label: `Heroic creature: ×${heroicMultiplier}`, low, high });
  }
  if (followers > 0) {
    low = Math.floor(low / (1 + followers));
    high = Math.floor(high / (1 + followers));
    steps.push({ label: `${followers} ${followers === 1 ? 'follower' : 'followers'}: ÷${1 + followers}, rounded down`, low, high });
  }
  if (experienceBonus > 0) {
    // AddCharacterEXP retains the float until the subsequent, unmodelled world multiplier.
    low *= 1 + experienceBonus / 100;
    high *= 1 + experienceBonus / 100;
    steps.push({ label: `Experience Bonus: +${experienceBonus}%`, low, high });
  }
  return { steps, award: { low, high } };
}

/** A higher award gives the lower number of kills. Zero awards cannot reach the next level. */
export function killsToNextLevel(toNext: number, award: ExperienceRange): { low: number; high: number | null } | null {
  if (award.high <= 0) return null;
  return { low: Math.ceil(toNext / award.high), high: award.low <= 0 ? null : Math.ceil(toNext / award.low) };
}

/** Prefer an ordinary place encounter at the reader's level for the opening comparison. */
export function progressionExample(guide: CharacterProgression, characterLevel: number) {
  const choices = guide.killCalculator.groups.flatMap((group) => group.creatures.map((entry) => ({ group, entry })));
  const atLevel = ({ entry }: typeof choices[number]) => entry.level.scales && entry.level.min <= characterLevel
    && (entry.level.max === undefined || entry.level.max >= characterLevel);
  // Prefer an ordinary zone-range encounter. Oakshade's Enraged Ent is a published open-world MOB,
  // not a boss or challenge-stone variant, when no bounded zone range reaches the selected level.
  const choice = choices.find((option) => atLevel(option) && option.entry.level.max !== undefined && !/[()]/.test(option.entry.creature.name))
    ?? choices.find((option) => atLevel(option) && option.group.name === 'Oakshade Logging Camp' && option.entry.creature.slug === 'enraged-ent')
    ?? choices.find((option) => atLevel(option) && !/[()]/.test(option.entry.creature.name) && !option.entry.creature.name.startsWith('Corrupted '))
    ?? choices.find(({ entry }) => entry.creature.key === guide.killCalculator.defaultCreature.key
      && entry.creature.variant === guide.killCalculator.defaultCreature.variant)!;
  const creatureLevel = nearestCreatureLevel(choice.entry.level, characterLevel, guide.curve.cap);
  const award = calculateKillAward(choice.entry, creatureLevel, characterLevel, undefined, 0, 0).award;
  const toNext = guide.curve.rows.find((row) => row.level === characterLevel)?.toNext;
  return { ...choice, creatureLevel, award, toNext, kills: toNext === undefined ? null : killsToNextLevel(toNext, award) };
}
