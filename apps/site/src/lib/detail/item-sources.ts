import { categoryLabel, type ContainerRow, type Craft, type DropRow, type EntityRef, type FromItemRow, type GatherRow, type Price, type PublicItem, type PublicKindEntry, type Ref, type VendorRow } from '@afallon/contracts/public';
import { creatureLevelText, formatNumber, nameOf, worldLootRollText } from '../format';
import { sortRows, type SortValue } from '../table';
import { itemQuestSourceRows } from './quest-rows';

export type SummaryName = { ref: Ref } | { text: string };

/** One acquisition route, linked to its complete source relation. A chance never counts as guaranteed yield. */
export interface SummaryLine {
  id: string;
  label: string;
  names: SummaryName[];
  more: number;
  lowestPrice?: Price;
  text?: string;
  section?: EntityRef;
  guaranteedYield?: number;
  spotCount?: number;
  detail?: string;
  /** A creature item's rate, kept separate from the loot list roll. */
  drop?: Pick<DropRow, 'chance' | 'killChance' | 'chanceLevel' | 'oddsUnavailable'>;
  /** The text of the link to the full source section, when "See full <label> sources" reads badly. */
  linkText?: string;
}

const NAMED = 2;

function line(id: string, label: string, names: readonly SummaryName[], extra: Partial<SummaryLine> = {}): SummaryLine | undefined {
  if (!names.length) return undefined;
  const key = (name: SummaryName) => 'ref' in name ? name.ref.key ?? `label:${name.ref.label}` : `text:${name.text}`;
  const distinct = [...new Map(names.map((name) => [key(name), name])).values()];
  return { id, label, names: distinct.slice(0, NAMED), more: Math.max(0, distinct.length - NAMED), ...extra };
}

const byChance = <Row extends { chance?: number }>(rows: readonly Row[]) => sortRows(rows, (row): SortValue => row.chance, { id: 'chance', dir: 'desc' });
const spotTotal = (rows: readonly { places: readonly { mapSpaceId: string; placementIds: readonly string[] }[] }[]) =>
  new Set(rows.flatMap((row) => row.places.flatMap((place) => place.placementIds.map((id) => `${place.mapSpaceId}:${id}`)))).size;

function containerName(row: ContainerRow): SummaryName {
  return { text: row.counterpart ? `${row.label} in ${nameOf(row.counterpart)}` : row.label };
}
function gatherName(row: GatherRow): SummaryName {
  return row.counterpart ? { ref: row.counterpart } : { text: row.label };
}
function lowestPrice(rows: readonly VendorRow[]): Price | undefined {
  return [...rows].sort((left, right) => left.price.amount - right.price.amount)[0]?.price;
}
function worldLootLine(rows: readonly DropRow[]): SummaryLine | undefined {
  const world = rows.filter((row) => row.creatureLevel);
  const levels = [...new Set(world.map((row) => creatureLevelText(row.creatureLevel!)))];
  if (!levels.length) return undefined;
  const rank = nameOf(world[0]!.counterpart);
  const restriction = levels.includes('Any') ? '' : `${rank && rank !== 'Any creature' ? ' at levels ' : ' of level '}${levels.join(' or ').replaceAll('–', ' to ')}`;
  const subject = rank && rank !== 'Any creature' ? rank : 'Creatures';
  const text = `${subject}${restriction || (subject === 'Creatures' ? ' of any level' : '')} can drop it as World Loot.`;
  const first = world[0]!;
  const sameRoll = world.every((row) => row.tableChance === first.tableChance && row.tableMinimum === first.tableMinimum && row.tableLimit === first.tableLimit);
  const sameRate = world.every((row) => row.chance === first.chance && row.killChance === first.killChance && row.chanceLevel === first.chanceLevel && row.oddsUnavailable === first.oddsUnavailable);
  return { id: 'dropped-by', label: 'World Loot', names: [], more: 0, text,
    ...(sameRoll ? { detail: worldLootRollText(first) } : {}),
    ...(sameRate ? { drop: first } : {}) };
}
function startingGearLine(item: PublicItem): SummaryLine | undefined {
  const classes = item.startingGearOf.map((row) => ({ ...row.class, variant: 'starting-gear' })).filter((ref) => ref.slug);
  const entry = line('starting-gear-of', 'Starting gear', classes.map((ref) => ({ ref })));
  return entry && { ...entry, section: classes[0] };
}

/** The classes and the levels of a supply pack band: "Druid · Levels 6–11". */
export function packBandText(band: { classes: readonly Ref[]; minLevel?: number; maxLevel?: number }): string {
  const classes = band.classes.map(nameOf).join(', ') || 'All classes';
  const levels = band.minLevel === undefined ? 'All levels' : `Levels ${formatNumber(band.minLevel)}${band.maxLevel === undefined ? ' and higher' : `–${formatNumber(band.maxLevel)}`}`;
  return `${classes} · ${levels}`;
}

/** "Humanoid or Undead creatures", with the highest base cloth rate before loot bonuses. */
function clothLootLine(item: PublicItem): SummaryLine | undefined {
  const cloth = item.clothDrop;
  if (!cloth) return undefined;
  const points = cloth.levels.flatMap((row) => row.maxLevel === undefined
    ? [{ levels: levelRangeText(row.minLevel, undefined), chance: row.startChance }]
    : [{ levels: levelRangeText(row.minLevel, row.minLevel), chance: row.startChance }, { levels: levelRangeText(row.maxLevel, row.maxLevel), chance: row.endChance ?? row.startChance }]);
  const best = points.reduce((top, point) => point.chance > top.chance ? point : top);
  return { id: 'cloth-loot', label: 'Cloth Loot', names: [], more: 0, text: `${cloth.creatureTypes.map(categoryLabel).join(' or ')} creatures can drop this cloth.`,
    detail: `The base rate is up to ${formatNumber(best.chance)}% at creature ${best.levels.toLowerCase()} before loot bonuses.` };
}

/** "Level 8", "Levels 8–14", or "Levels 40 and higher". */
export function levelRangeText(minLevel: number, maxLevel: number | undefined): string {
  if (maxLevel === undefined) return `Levels ${formatNumber(minLevel)} and higher`;
  return minLevel === maxLevel ? `Level ${formatNumber(minLevel)}` : `Levels ${formatNumber(minLevel)}–${formatNumber(maxLevel)}`;
}

function fromItemsDetail(row: FromItemRow | undefined): string | undefined {
  if (!row) return undefined;
  return row.kind === 'chest' ? `Chance per Open: ${formatNumber(row.chance)}%.` : packBandText(row);
}

export function lineHref(entry: SummaryLine, registry: readonly PublicKindEntry[], base: string): string | undefined {
  if (!entry.section) return `#${entry.id}`;
  const route = registry.find((kind) => kind.kind === entry.section!.kind)?.route;
  return route && entry.section.slug ? `${base}/${route}/${entry.section.slug}/#${entry.section.variant ?? ''}` : undefined;
}

/** Routes: known guaranteed quantities first; otherwise known map spots, then stable source-kind order. */
export function itemSourceLines(item: PublicItem): SummaryLine[] {
  const creatureDrops = item.droppedBy.filter((row) => !row.creatureLevel);
  const firstDrop = byChance(creatureDrops)[0];
  const commonDropRate = firstDrop && creatureDrops.every((row) => row.chance === firstDrop.chance && row.killChance === firstDrop.killChance && row.oddsUnavailable === firstDrop.oddsUnavailable) ? firstDrop : undefined;
  const firstGather = byChance(item.gatheredFrom)[0];
  const vendors = sortRows(item.soldBy, (row): SortValue => row.price.amount, { id: 'price', dir: 'asc' });
  const quests = itemQuestSourceRows(item.rewardedBy, item.givenBy);
  const objects = line('collected-from', 'Search', byChance(item.collectedFrom).map(containerName), { spotCount: spotTotal(item.collectedFrom) });
  const containers = line('found-in-containers', 'Search', byChance(item.inContainers).map(containerName), { spotCount: spotTotal(item.inContainers) });
  const search = (objects?.spotCount ?? 0) >= (containers?.spotCount ?? 0) ? objects ?? containers : containers;
  const world = worldLootLine(item.droppedBy);
  const loot = line('dropped-by', 'Loot', byChance(creatureDrops).map((row) => ({ ref: row.counterpart })));
  const dungeonRewards = item.facts.dungeonRewards;
  const dungeon = dungeonRewards?.length
    ? line('dungeon-rewards', 'Dungeon reward', dungeonRewards.map((row) => ({ ref: row.place })), {
      ...(dungeonRewards.every((row) => row.guaranteed) ? {
        guaranteedYield: 1, text: `Every timed dungeon run ends with a reward bag that holds one ${item.ref.name}.`,
      } : { detail: 'Chance from boss reward bags' }),
    })
    : undefined;
  const routes: (SummaryLine | undefined)[] = [
    dungeon,
    item.crafting && { id: 'crafting', label: 'Craft', names: [], more: 0, guaranteedYield: item.crafting.product?.count,
      text: [item.crafting.skill ? nameOf(item.crafting.skill) : undefined, item.crafting.ranks[0] ? `level ${item.crafting.ranks[0].requiredLevel}` : undefined, item.crafting.station ? `at ${nameOf(item.crafting.station)} station` : undefined].filter(Boolean).join(' ') || item.crafting.recipe.name },
    line('gathered-from', firstGather?.skill && nameOf(firstGather.skill).toLowerCase() === 'mining' ? 'Mine' : 'Gather', byChance(item.gatheredFrom).map(gatherName), { spotCount: spotTotal(item.gatheredFrom), detail: firstGather?.chance !== undefined ? `Chance per Use: ${formatNumber(firstGather.chance)}%.` : undefined }),
    loot ? { ...loot, ...(commonDropRate ? { drop: commonDropRate } : {}), detail: world?.text ? `Also, ${world.text.charAt(0).toLowerCase()}${world.text.slice(1)}` : undefined } : world && { ...world, label: 'Loot' },
    search,
    line('sold-by', 'Buy', vendors.map((row) => ({ ref: row.counterpart })), { lowestPrice: lowestPrice(vendors) }),
    line('from-quests', 'Quest reward', quests.map((row) => ({ ref: row.quest })), { guaranteedYield: Math.max(0, ...item.givenBy.map((row) => row.count), ...item.rewardedBy.filter((row) => !row.choice).map((row) => row.count)) || undefined }),
    clothLootLine(item),
    line('quest-pickups', 'Quest pickup', item.questPickups.map((row): SummaryName => row.quest ? { ref: row.quest } : row.kind === 'creature' ? { ref: row.counterpart } : { text: 'Placed pickup' }),
      { detail: 'While the quest needs it' }),
    item.dungeonFinder && { id: 'dungeon-finder', label: 'Dungeon Finder', names: [], more: 0, text: `Each successful Random run gives one ${item.ref.name}` },
    line('from-items', 'Open', item.fromItems.map((row) => ({ ref: row.source })), { detail: fromItemsDetail(item.fromItems[0]), linkText: 'See all items that give it' }),
    line('adventurer-starting-gear', 'Adventurer Starting Gear', item.startingGearOfAdventurers.map((ref) => ({ ref }))),
    line('gained-from-items', 'Use', item.gainedFromItems.map((ref) => ({ ref })), { linkText: 'See Items That Give It' }),
    startingGearLine(item),
  ];
  return routes.filter((entry): entry is SummaryLine => entry !== undefined)
    .sort((a, b) => (b.guaranteedYield ?? 0) - (a.guaranteedYield ?? 0) || (b.spotCount ?? 0) - (a.spotCount ?? 0) || routes.indexOf(a) - routes.indexOf(b));
}

/** An unbound loot list adds context only when the item has no published acquisition route. */
export function unboundLootTableNames(item: PublicItem, hasSources: boolean): string[] {
  return hasSources ? [] : [...new Set(item.lootTables.filter((table) => !table.source && !table.world).map((table) => table.name))];
}

export function summaryText(entry: SummaryLine): string {
  if (entry.text) return entry.text;
  const names = entry.names.map((name) => 'ref' in name ? nameOf(name.ref) : name.text);
  if (entry.more > 0) names.push(`${entry.more} more`);
  return names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}` : names[0] ?? '';
}

