import { PUBLIC_MARKER_CATEGORY_LABELS, categoryLabel, type CreatureLevel, type DropRow, type PublicLevel, type PublicMarkerCategory, type QuestObjective, type QuestStart, type Ref, type RequirementGroup } from '@afallon/contracts/public';

const RARITY_TONES: Record<string, true> = { common: true, uncommon: true, rare: true, gold: true, epic: true, legendary: true };
// Rarity tiers from lowest to highest. Gold is the rarity of the Gold currency item alone, so it comes last.
const RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'gold'];

/** Orders facet values: rarities by tier, everything else alphabetically. */
export function compareFacetValues(facet: string, left: string, right: string): number {
  if (facet === 'rarity') {
    const rank = (value: string) => { const index = RARITY_ORDER.indexOf(value.toLocaleLowerCase()); return index < 0 ? RARITY_ORDER.length : index; };
    const difference = rank(left) - rank(right);
    if (difference !== 0) return difference;
  }
  return left.localeCompare(right);
}
const numberFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });

export function formatNumber(value: number): string {
  return numberFormat.format(value);
}

const dateFormat = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });

/** A published day, such as "September 28, 2026". The value is a UTC day, so the reader's time zone cannot move it. */
export function formatCalendarDate(value: string): string {
  return dateFormat.format(new Date(`${value}T00:00:00Z`));
}

export function formatDuration(seconds: number): string {
  return seconds !== 0 && seconds % 60 === 0 ? `${formatNumber(seconds / 60)} min` : `${formatNumber(seconds)} s`;
}

/** A duration range in one unit: minutes when both ends are whole minutes ("2–4 min"), otherwise seconds ("120–200 s"). */
export function durationRangeText(min: number, max: number): string {
  return max !== 0 && min % 60 === 0 && max % 60 === 0 ? `${rangeText(min / 60, max / 60)} min` : `${rangeText(min, max)} s`;
}

/** A game-time interval in words: "5 minutes", "90 seconds". */
export function intervalText(seconds: number): string {
  if (seconds % 60 === 0) return `${formatNumber(seconds / 60)} ${seconds === 60 ? 'minute' : 'minutes'}`;
  return `${formatNumber(seconds)} ${seconds === 1 ? 'second' : 'seconds'}`;
}

/** Item source kinds are native-style ids. An interactive object source reads as the object that gives the item. */
const SOURCE_KIND_LABELS: Record<string, string> = { interaction: 'Object', startingGear: 'Starting gear' };

export function sourceKindLabel(kind: string): string {
  return SOURCE_KIND_LABELS[kind] ?? categoryLabel(kind);
}

/** Quest lists publish each start kind as its id; a reader wants the kind of start. */
const QUEST_START_LABELS: Record<string, string> = { npc: 'NPC', worldZone: 'World Quest', object: 'Object' } satisfies Record<QuestStart['kind'], string>;

export function questStartLabel(kind: string): string {
  return QUEST_START_LABELS[kind] ?? categoryLabel(kind);
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

type LootRoll = Pick<DropRow, 'tableChance' | 'tableMinimum' | 'tableLimit'>;

// A kill rolls each loot list of a creature. `tableChance` is the share of kills that roll the list, and a missing
// chance means every kill. The list then rolls each item at its own chance, stops at `tableLimit` items, and adds
// items by their chances until it has `tableMinimum` items. The texts below say this without game terms.

/** How many items one kill drops from one loot list: "up to 3", "2", "1 or 2", "at least 1", or none without a rule. */
function itemCount({ tableMinimum: least, tableLimit: most }: LootRoll): { amount: string; plural: boolean } | undefined {
  if (least === undefined) return most === undefined ? undefined : { amount: `up to ${formatNumber(most)}`, plural: most !== 1 };
  if (most === undefined) return { amount: `at least ${formatNumber(least)}`, plural: least !== 1 };
  if (least === most) return { amount: formatNumber(least), plural: least !== 1 };
  return { amount: `${formatNumber(least)} ${most === least + 1 ? 'or' : 'to'} ${formatNumber(most)}`, plural: true };
}

/** The count with its noun: "up to 3 items", "1 item". */
function itemCountText(roll: LootRoll): string | undefined {
  const count = itemCount(roll);
  return count && `${count.amount} ${count.plural ? 'items' : 'item'}`;
}

/** When a kill can drop from the loot list of a row, and how many items it drops: "Every kill, up to 3 items". */
export function dropsPerKillText(roll: LootRoll): string {
  const kills = roll.tableChance === undefined ? 'Every kill' : `${formatNumber(roll.tableChance)}% of kills`;
  return `${kills}, ${itemCountText(roll) ?? 'any number of items'}`;
}

/** The sentences above a group of an NPC's drops that share one loot list rule. `items` is the number of rows. */
export function dropGroupText(roll: LootRoll, items: number): string {
  const one = items === 1;
  const count = itemCount(roll);
  const some = roll.tableChance === undefined ? undefined : `Only ${formatNumber(roll.tableChance)}% of kills`;
  if (roll.tableMinimum !== undefined && count !== undefined) {
    // A minimum makes the game add items by their chances, so a chance tells how often an item is among the drops.
    if (items <= roll.tableMinimum) {
      const all = one ? 'this item' : 'all of these items';
      return some ? `${some} drop ${all}.` : `Every kill drops ${all}.`;
    }
    return some
      ? `${some} drop items from this list. Such a kill drops ${count.amount} of them, and items with a higher chance drop more often.`
      : `Every kill drops ${count.amount} of these items. Items with a higher chance drop more often.`;
  }
  const limit = roll.tableLimit !== undefined && roll.tableLimit < items ? roll.tableLimit : undefined;
  const each = one ? 'this item' : 'each of these items';
  const cap = limit === undefined ? '' : `, but one kill drops at most ${formatNumber(limit)} of them`;
  if (some) return one ? `${some} can drop this item. Such a kill has the listed chance to drop it.` : `${some} can drop these items. Such a kill has the listed chance to drop each of them${cap}.`;
  return `Every kill has the listed chance to drop ${each}${cap}.`;
}

/** The sentence above the sources of an item when all of them share one loot list rule. */
export function itemDropText(roll: LootRoll): string {
  const count = itemCountText(roll);
  const share = roll.tableChance;
  if (roll.tableMinimum !== undefined && count !== undefined) {
    const kills = share === undefined ? 'Every kill drops' : `Only ${formatNumber(share)}% of kills drop`;
    return `${kills} ${count} from the loot list that holds this item. Items with a higher chance in that list drop more often.`;
  }
  const limit = roll.tableLimit;
  const cap = limit === undefined ? '' : `, but a kill drops at most ${formatNumber(limit)} ${limit === 1 ? 'item' : 'items'} from the same list`;
  return share === undefined
    ? `Every kill has the listed chance to drop this item${cap}.`
    : `Only ${formatNumber(share)}% of kills can drop this item, and such a kill has the listed chance to drop it${cap}.`;
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

/**
 * A label inside a sentence. A word with one capital letter is written in lower case. A word with more capital
 * letters, as in "NPCs" or "HP", keeps them.
 */
export function readerNoun(label: string): string {
  return label.split(' ').map((word) => (word.match(/\p{Lu}/gu)?.length ?? 0) > 1 ? word : word.toLocaleLowerCase('en-US')).join(' ');
}

const SEARCH_PLACEHOLDER_KINDS = 3;

/**
 * The search placeholder names the first searchable kinds of the publication and ends with "more" when others exist. It
 * never names a kind that search cannot find.
 */
export function searchPlaceholder(plurals: readonly string[]): string {
  if (plurals.length === 0) return 'Search';
  const nouns = plurals.map(readerNoun);
  const shown = nouns.length > SEARCH_PLACEHOLDER_KINDS ? [...nouns.slice(0, SEARCH_PLACEHOLDER_KINDS), 'more'] : nouns;
  return `Search ${new Intl.ListFormat('en-US', { type: 'conjunction' }).format(shown)}`;
}

/** "A", "A and B", or "A, B, and C". */
export function listText(values: readonly string[]): string {
  return new Intl.ListFormat('en-US', { type: 'conjunction' }).format(values);
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

/** Requirement phrases are lowercase so that they join into a sentence. Text that starts a sentence capitalizes them. */
export function sentenceStart(text: string): string {
  return text.charAt(0).toLocaleUpperCase('en-US') + text.slice(1);
}

/**
 * The experience of one kill before modifiers: the roll plus the level bonus at the creature's levels. "93–142" for a
 * level 23 creature with 70–119 and 1 per level, "16+" without a highest level, and the parts when no level is known.
 */
export function killExperienceText(experience: { min: number; max: number; perLevel: number }, level: PublicLevel | undefined): string {
  const roll = rangeText(experience.min, experience.max)!;
  if (experience.perLevel === 0) return roll;
  if (!level) return `${roll}, plus ${formatNumber(experience.perLevel)} per level`;
  const low = experience.min + level.min * experience.perLevel;
  return level.max === undefined ? `${formatNumber(low)}+` : rangeText(low, experience.max + level.max * experience.perLevel)!;
}

function isMarkerCategory(role: string): role is PublicMarkerCategory {
  return Object.hasOwn(PUBLIC_MARKER_CATEGORY_LABELS, role);
}

export function roleLabel(role: string): string {
  return isMarkerCategory(role) ? PUBLIC_MARKER_CATEGORY_LABELS[role] : categoryLabel(role);
}

/** The name of a reference, or its label when no published entity resolves it. */
export function nameOf(ref: Ref): string {
  return ref.key === null ? ref.label : ref.name;
}

// The native NPC types in plain words. MOB is an ordinary NPC without a rank.
const NPC_TYPE_NAMES: Record<string, string> = {
  MOB: 'Ordinary', ELITE: 'Elite', BOSS: 'Boss', MERCHANT: 'Merchant', BANK: 'Banker', ADVENTURER: 'Adventurer', COMPANION: 'Companion', QUEST_COMPANION: 'Quest Companion',
};

/** The NPC type in plain words, for a table that compares the types of variants. */
export function npcTypeName(npcType: string): string {
  return NPC_TYPE_NAMES[npcType] ?? categoryLabel(npcType);
}

// A title block names neither an ordinary NPC nor the types that its roles already name: bosses, merchants, and bankers.
const UNSHOWN_NPC_TYPES = new Set(['MOB', 'BOSS', 'MERCHANT', 'BANK']);

/** The NPC type that a title block names, such as "Elite" or "Quest Companion". */
export function npcTypeLabel(npcType: string | undefined): string | undefined {
  return npcType === undefined || UNSHOWN_NPC_TYPES.has(npcType) ? undefined : npcTypeName(npcType);
}

/** The creature type, such as "Humanoid". NONE means that the record has no type. */
export function creatureTypeLabel(creatureType: string | undefined): string | undefined {
  return creatureType === undefined || creatureType === 'NONE' ? undefined : categoryLabel(creatureType);
}

const FRIENDLY_ROLES = new Set(['questGiver', 'merchant', 'townsfolk', 'banker', 'auctioneer', 'flightPoint']);

/** A player cannot fight an NPC whose every role is a friendly service, so its combat values are only defaults. */
export function onlyFriendlyRoles(roles: readonly string[]): boolean {
  return roles.length > 0 && roles.every((role) => FRIENDLY_ROLES.has(role));
}
