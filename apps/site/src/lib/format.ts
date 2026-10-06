import { PUBLIC_MARKER_CATEGORY_LABELS, categoryLabel, type DropRow, type PublicLevel, type PublicMarkerCategory, type QuestObjective, type QuestStart, type Ref, type RequirementGroup } from '@afallon/contracts/public';

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

/** When an adventurer joins the world: at the start of a character, or after hours of play on it. */
export function joinText(hours: number): string {
  return hours === 0 ? 'At the start' : `After ${formatNumber(hours)} ${hours === 1 ? 'hour' : 'hours'} of play`;
}

/** A game-time interval in words: "5 minutes", "90 seconds". */
export function intervalText(seconds: number): string {
  if (seconds % 60 === 0) return `${formatNumber(seconds / 60)} ${seconds === 60 ? 'minute' : 'minutes'}`;
  return `${formatNumber(seconds)} ${seconds === 1 ? 'second' : 'seconds'}`;
}

/** A timer in minutes and seconds: "14 min 20 s", "5 min", "45 s". */
export function timerText(seconds: number): string {
  const minutes = Math.floor(seconds / 60), rest = Math.round(seconds - minutes * 60);
  return [minutes ? `${formatNumber(minutes)} min` : '', rest || !minutes ? `${formatNumber(rest)} s` : ''].filter(Boolean).join(' ');
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

type LootRoll = Pick<DropRow, 'tableChance' | 'tableMinimum' | 'tableLimit'> & Partial<Pick<DropRow, 'killChance'>>;

export const LISTED_RATE_HINT = 'The game lists this rate before loot-list limits and minimum picks. It is not your chance per kill.';
export const KILL_CHANCE_HINT = 'Assumes no Loot Chance. Loot Chance comes from Luck and other bonuses, and in this version it makes ordinary creature drops rarer.';
export const CLOTH_CHANCE_HINT = 'Loot Chance does not change cloth drops. A Heroic creature with an affix multiplies this chance by its loot multiplier, and drop rate world modifiers multiply it again.';
export const OPEN_CHANCE_HINT = 'Shown for a qualifying open after your first gear drop, at the player level shown when levels affect the loot list. Object loot does not use Luck.';
const precisePercent = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

/** A chance with up to two decimals: "11.4%", "0.24%". */
export function percentText(percent: number): string {
  return `${precisePercent.format(percent)}%`;
}

export function eventChanceText(percent: number, event: 'kill' | 'open'): string {
  if (percent === 0) return '0%';
  return percent < 1 ? `About 1 in ${formatNumber(Math.round(100 / percent))} ${event === 'kill' ? 'kills' : 'opens'}` : percentText(percent);
}

/** A range of chances per kill: "About 1 in 285 to 1 in 471 kills", "1.2% to 3.4% per kill", or one chance. */
export function killChanceRangeText(low: number, high: number): string {
  const first = eventChanceText(high, 'kill'), last = eventChanceText(low, 'kill');
  if (first === last) return high < 1 && high > 0 ? first : `${first} per kill`;
  if (high < 1 && low > 0) return `${first.slice(0, -' kills'.length)} to ${last.slice('About '.length)}`;
  return `${percentText(low)} to ${percentText(high)} per kill`;
}

export function dropRateText(row: Pick<DropRow, 'chance' | 'killChance'>): string | undefined {
  if (row.killChance !== undefined) return eventChanceText(row.killChance, 'kill');
  return row.chance === undefined ? undefined : `${formatNumber(row.chance)}%`;
}

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

/** The list roll is a different event from an item's entry rate. */
export function dropsPerKillText(roll: LootRoll): string {
  const count = itemCountText(roll);
  const action = roll.tableMinimum !== undefined && count ? `drop ${count} from this loot list` : count ? `roll this loot list for ${count}` : 'roll this loot list';
  return roll.tableChance === undefined || roll.tableChance === 100
    ? `Each kill can ${action}.`
    : `Each kill has a ${formatNumber(roll.tableChance)}% chance to ${action}.`;
}

/** "At creature level 27", or "At creature level 46 and higher" when every higher level gives the same. */
function atCreatureLevel(level: number, orHigher: boolean): string {
  return `At creature level ${formatNumber(level)}${orHigher ? ' and higher' : ''}`;
}

/** The sentence above the World Loot of one creature level: "At creature level 27, 11.4% of kills give 1 or 2 of these 111 items." */
export function worldLootGroupText(level: number, world: { anyChance?: number; maxItems?: number }, items: number, orHigher = false): string {
  const at = atCreatureLevel(level, orHigher);
  if (items === 0) return `${at}, World Loot gives no items.`;
  const set = items === 1 ? 'this item' : `these ${formatNumber(items)} items`;
  const most = world.maxItems;
  const gives = items === 1 || most === undefined ? set : `${most === 1 ? '1' : `1 ${most === 2 ? 'or' : 'to'} ${formatNumber(most)}`} of ${set}`;
  return world.anyChance === undefined ? `${at}, a kill can give ${gives}.` : `${at}, ${percentText(world.anyChance)} of kills give ${gives}.`;
}

/** The sentence above the cloth of one creature level: "At creature level 28, 75% of kills give 1 to 3 pieces of one of these cloths." */
export function clothGroupText(level: number, cloth: { chance: number; min: number; max: number }, items: number, orHigher = false): string {
  const pieces = cloth.min === cloth.max ? `${formatNumber(cloth.min)} ${cloth.min === 1 ? 'piece' : 'pieces'}` : `${formatNumber(cloth.min)} to ${formatNumber(cloth.max)} pieces`;
  return `${atCreatureLevel(level, orHigher)}, ${percentText(cloth.chance)} of kills give ${pieces} ${items === 1 ? 'of this cloth' : 'of one of these cloths'}.`;
}

/** The sentence above one NPC loot list, with the number of its actual published rows. */
export function dropGroupText(roll: LootRoll, items: number, hasListedRates = true): string {
  const count = itemCount(roll);
  const set = items === 1 ? 'this item' : `these ${formatNumber(items)} items`;
  const guaranteed = roll.tableMinimum !== undefined && items <= roll.tableMinimum;
  const action = guaranteed ? `drop ${items === 1 ? 'this item' : `all ${formatNumber(items)} items`}`
    : count && roll.tableMinimum !== undefined ? `drop ${count.amount} of ${set}`
    : count ? `roll for ${count.amount} from ${set}` : `roll for ${set}`;
  const first = roll.tableChance === undefined || roll.tableChance === 100
    ? `Each kill can ${action}.`
    : `Each kill has a ${formatNumber(roll.tableChance)}% chance to ${action}.`;
  if (guaranteed || items === 1 || !hasListedRates) return first;
  return `${first} ${roll.tableMinimum !== undefined ? 'Items roll in order before a minimum fills missing drops.' : 'Each item rolls separately.'}`;
}

/** The shared loot-list rule above an item's creature sources. */
export function itemDropText(roll: LootRoll): string {
  const count = itemCountText(roll);
  const action = count && roll.tableMinimum !== undefined ? `drop ${count} from the loot list that includes this item`
    : count ? `roll the loot list that includes this item for ${count}`
    : 'roll the loot list that includes this item';
  const first = roll.tableChance === undefined || roll.tableChance === 100
    ? `Each kill can ${action}.`
    : `Each kill has a ${formatNumber(roll.tableChance)}% chance to ${action}.`;
  if (roll.killChance !== undefined) return first;
  return `${first} ${roll.tableMinimum === undefined ? 'The listed rate is not a chance per kill.' : 'A minimum may add items after their ordinary rolls.'}`;
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
  const label = isMarkerCategory(role) ? PUBLIC_MARKER_CATEGORY_LABELS[role] : categoryLabel(role);
  return label.replace(/\b[A-Z][a-z]+\b/g, (word, offset) => offset === 0 ? word : word.toLowerCase());
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

/** The game's name of the alignment that a faction stance gives toward the player. */
export function alignmentLabel(alignment: 'ally' | 'neutral' | 'enemy'): string {
  return { ally: 'Ally', neutral: 'Neutral', enemy: 'Enemy' }[alignment];
}
