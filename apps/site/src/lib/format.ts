import { PUBLIC_MARKER_CATEGORY_LABELS, type PublicMarkerCategory } from '@afallon/contracts/public';

const RARITY_TONES: Record<string, true> = { common: true, uncommon: true, rare: true, gold: true, epic: true, legendary: true };
const numberFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });

/**
 * Native enums arrive as `MAIN HAND`, `QUEST_ITEM`, or `game-action-effect-teleport`. Authored
 * text arrives already cased and keeps its casing; only the first letter is forced.
 */
export function labelOf(value: string): string {
  const spaced = value.replace(/[_-]+/g, ' ').trim();
  const cased = /[a-z]/.test(spaced) ? spaced : spaced.toLocaleLowerCase();
  return cased.charAt(0).toLocaleUpperCase() + cased.slice(1);
}

export function formatNumber(value: number): string {
  return numberFormat.format(value);
}

/** The game writes a stat modifier sign first: `+21 Stamina`, `+11% Lifesteal`. */
export function signedAmount(amount: number, isPercent = false): string {
  const sign = amount < 0 ? '-' : '+';
  return `${sign}${formatNumber(Math.abs(amount))}${isPercent ? '%' : ''}`;
}

export function rangeText(min: number | undefined, max: number | undefined): string | null {
  if (min === undefined && max === undefined) return null;
  if (max === undefined || min === max) return formatNumber(min ?? 0);
  if (min === undefined) return formatNumber(max);
  return `${formatNumber(min)}\u2013${formatNumber(max)}`;
}

/** The rarity tone drives the name colour, the icon ring, and the badge through one attribute. */
export function rarityTone(rarity: string | undefined): string | undefined {
  if (!rarity) return undefined;
  const tone = rarity.toLocaleLowerCase();
  return RARITY_TONES[tone] ? tone : undefined;
}

/** The published objective union uses the native task names; a reader wants the action. */
const OBJECTIVE_LABELS: Record<string, string> = {
  killNpc: 'Defeat', getItem: 'Collect', talkToNpc: 'Talk to', useItem: 'Use',
  enterScene: 'Travel to', enterRegion: 'Travel to', learnAbility: 'Learn', unsupported: 'Other objective',
};

export function objectiveLabel(type: string): string {
  return OBJECTIVE_LABELS[type] ?? labelOf(type);
}

/**
 * A connection kind arrives as the native trigger name: `game-action-effect-teleport` or
 * `DungeonEntranceTrigger`. The reader wants the kind of passage.
 */
export function connectionLabel(kind: string): string {
  return labelOf(kind.replace(/^game-action(-effect)?-/, '').replace(/([a-z0-9])([A-Z])/g, '$1 $2'));
}

export function roleLabel(role: string): string {
  return PUBLIC_MARKER_CATEGORY_LABELS[role as PublicMarkerCategory] ?? labelOf(role);
}
