import { PUBLIC_MARKER_CATEGORY_LABELS, type PublicLevelRange, type PublicMarkerCategory, type QuestObjective, type QuestStart, type RequirementGroup } from '@afallon/contracts/public';

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

export function formatDuration(seconds: number): string {
  return seconds !== 0 && seconds % 60 === 0 ? `${formatNumber(seconds / 60)} min` : `${formatNumber(seconds)} s`;
}

/** Item source kinds are native-style ids; an interactive object source reads as the object that gives the item. */
const SOURCE_KIND_LABELS: Record<string, string> = { interaction: 'Object' };

export function sourceKindLabel(kind: string): string {
  return SOURCE_KIND_LABELS[kind] ?? labelOf(kind);
}

/** Quest lists publish each start kind as its id; a reader wants the kind of start. */
const QUEST_START_LABELS: Record<string, string> = { npc: 'NPC', worldZone: 'World quest', object: 'Object' } satisfies Record<QuestStart['kind'], string>;

export function questStartLabel(kind: string): string {
  return QUEST_START_LABELS[kind] ?? labelOf(kind);
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

/** A level is one number or a range; a range whose ends agree reads as one number. */
export function levelText(level: number | PublicLevelRange): string {
  return typeof level === 'number' ? formatNumber(level) : rangeText(level.min, level.max)!;
}

/** The rarity tone drives the name colour, the icon ring, and the badge through one attribute. */
export function rarityTone(rarity: string | undefined): string | undefined {
  if (!rarity) return undefined;
  const tone = rarity.toLocaleLowerCase();
  return RARITY_TONES[tone] ? tone : undefined;
}

type TargetedObjectiveType = Extract<QuestObjective, { target: unknown }>['type'];

/** The action of an objective that names a target; the published union keeps the native task names. */
const OBJECTIVE_LABELS: Record<TargetedObjectiveType, string> = {
  killNpc: 'Defeat', getItem: 'Collect', talkToNpc: 'Talk to', useItem: 'Use', enterScene: 'Travel to', learnAbility: 'Learn',
};

export function objectiveLabel(type: TargetedObjectiveType): string {
  return OBJECTIVE_LABELS[type];
}

/**
 * The word between two requirements of one group. A group the game satisfies with any one member reads as
 * an alternative: "Shieldmaster or Assassin". A group it checks in full reads as a conjunction.
 */
export function requirementSeparator(group: RequirementGroup, index: number): string {
  if (index === 0) return '';
  if (group.mode === 'any' && (group.requiredCount ?? 1) === 1) return ' or ';
  return group.mode === 'all' ? ' and ' : ', ';
}

/** A group that needs more than one of its members names the count: "2 of". */
export function requirementCountLabel(group: RequirementGroup): string | null {
  return group.mode === 'any' && group.checkCount && (group.requiredCount ?? 1) > 1 ? `${group.requiredCount} of` : null;
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
