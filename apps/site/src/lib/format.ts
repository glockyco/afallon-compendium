import { PUBLIC_MARKER_CATEGORY_LABELS, type CreatureLevel, type DropRow, type PublicLevel, type PublicMarkerCategory, type QuestObjective, type QuestStart, type RequirementGroup } from '@afallon/contracts/public';

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

/** A game-time interval in words: "5 minutes", "90 seconds". */
export function intervalText(seconds: number): string {
  if (seconds % 60 === 0) return `${formatNumber(seconds / 60)} ${seconds === 60 ? 'minute' : 'minutes'}`;
  return `${formatNumber(seconds)} ${seconds === 1 ? 'second' : 'seconds'}`;
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

/** A level or a level range. A range whose ends agree reads as one number, and a range without a maximum as "15+". */
export function levelText(level: number | { min: number; max?: number }): string {
  if (typeof level === 'number') return formatNumber(level);
  return level.max === undefined ? `${formatNumber(level.min)}+` : rangeText(level.min, level.max)!;
}

/** A creature's level with the game's rule: "15–30, scales with the player". */
export function npcLevelText(level: PublicLevel): string {
  return level.scales ? `${levelText(level)}, scales with the player` : levelText(level);
}

/** The creature levels that can drop world loot: "7–12", "20+", or "Any" when every level qualifies. */
export function creatureLevelText(level: CreatureLevel): string {
  return level.min <= 1 && level.max === undefined ? 'Any' : levelText(level);
}

/** The loot roll of a table: "5% of kills, 1–2 items". Without a chance, the roll happens on every kill. */
export function lootTableText(row: Pick<DropRow, 'tableChance' | 'tableMinimum' | 'tableLimit'>): string | null {
  const { tableChance, tableMinimum: least, tableLimit: most } = row;
  const items = least !== undefined && most !== undefined ? (least === most ? `${least} ${least === 1 ? 'item' : 'items'}` : `${least}\u2013${most} items`)
    : least !== undefined ? `at least ${least} ${least === 1 ? 'item' : 'items'}`
    : most !== undefined ? `at most ${most} ${most === 1 ? 'item' : 'items'}` : null;
  const parts = [...(tableChance === undefined ? [] : [`${formatNumber(tableChance)}% of kills`]), ...(items === null ? [] : [items])];
  return parts.length === 0 ? null : parts.join(', ');
}

/** A random spawn: "One of 3 random spots, 66.7% chance". A certain choice leaves out the chance. */
export function alternativeText(chance: number, spots: number): string {
  return [spots > 1 ? `One of ${spots} random spots` : 'Random spawn', ...(chance < 100 ? [`${formatNumber(chance)}% chance`] : [])].join(', ');
}

/** The places of a creature for a header: the first place and how many others. */
export function placesText(labels: readonly string[]): string | null {
  const unique = [...new Set(labels)];
  if (unique.length <= 1) return unique[0] ?? null;
  return `${unique[0]} and ${unique.length - 1} more`;
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
