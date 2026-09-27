import type { ContainerRow, DropRow, GatherRow, Price, PublicItem, Ref, VendorRow } from '@afallon/contracts/public';
import { creatureLevelText, nameOf } from '../format';
import { sortRows, type SortValue } from '../table';
import { itemQuestSourceRows } from './quest-rows';

/** A counterpart that a summary line names: an entity, or a label of an object without a page. */
export type SummaryName = { ref: Ref } | { text: string };

/** One line of an item's How to get it or Used for list. It links the section of the page with the same `id`. */
export interface SummaryLine {
  id: string;
  label: string;
  /** Up to two counterparts, in the default order of the section. */
  names: SummaryName[];
  /** How many other counterparts the section lists. */
  more: number;
  /** The lowest price of a vendor line. */
  lowestPrice?: Price;
  /** A sentence that replaces the names, for world loot. */
  text?: string;
}

const NAMED = 2;

function line(id: string, label: string, names: readonly SummaryName[], extra: Pick<SummaryLine, 'lowestPrice'> = {}): SummaryLine | undefined {
  if (names.length === 0) return undefined;
  const key = (name: SummaryName) => 'ref' in name ? name.ref.key ?? `label:${name.ref.label}` : `text:${name.text}`;
  const distinct = [...new Map(names.map((name) => [key(name), name])).values()];
  return { id, label, names: distinct.slice(0, NAMED), more: Math.max(0, distinct.length - NAMED), ...extra };
}

const byChance = <Row extends { chance?: number }>(rows: readonly Row[]) => sortRows(rows, (row): SortValue => row.chance, { id: 'chance', dir: 'desc' });

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
  const levels = [...new Set(rows.flatMap((row) => row.creatureLevel ? [creatureLevelText(row.creatureLevel)] : []))];
  if (levels.length === 0) return undefined;
  const text = levels.includes('Any') ? 'Creatures of any level' : `Creatures of level ${levels.join(' or ')}`;
  return { id: 'dropped-by', label: 'World loot', names: [], more: 0, text };
}

/** How to get an item, in the order of the sections below the hero. */
export function itemSourceLines(item: PublicItem): SummaryLine[] {
  const creatureDrops = item.droppedBy.filter((row) => !row.creatureLevel);
  const vendors = sortRows(item.soldBy, (row): SortValue => row.price.amount, { id: 'price', dir: 'asc' });
  return [
    line('dropped-by', 'Dropped by', byChance(creatureDrops).map((row) => ({ ref: row.counterpart }))),
    worldLootLine(item.droppedBy),
    line('sold-by', 'Sold by', vendors.map((row) => ({ ref: row.counterpart })), { lowestPrice: lowestPrice(item.soldBy) }),
    line('found-in-containers', 'Found in containers', byChance(item.inContainers).map(containerName)),
    line('gathered-from', 'Gathered from', byChance(item.gatheredFrom).map(gatherName)),
    line('collected-from', 'Collected from', byChance(item.collectedFrom).map(containerName)),
    line('from-quests', 'From quests', itemQuestSourceRows(item.rewardedBy, item.givenBy).map((row) => ({ ref: row.quest }))),
    line('crafted-from', 'Crafted from', item.craftedBy.map((row) => ({ ref: row.counterpart }))),
  ].filter((entry): entry is SummaryLine => entry !== undefined);
}

/** What an item is for. */
export function itemUseLines(item: PublicItem): SummaryLine[] {
  return [
    line('used-in-recipes', 'Used in recipes', item.usedInRecipes.map((row) => ({ ref: row.counterpart }))),
    line('needed-for-quests', 'Needed for quests', item.usedInQuests.map((row) => ({ ref: row.counterpart }))),
  ].filter((entry): entry is SummaryLine => entry !== undefined);
}

/** A summary line as plain text, for a hover tooltip that cannot hold links. */
export function summaryText(entry: SummaryLine): string {
  if (entry.text) return entry.text;
  const names = entry.names.map((name) => 'ref' in name ? nameOf(name.ref) : name.text);
  if (entry.more > 0) names.push(`${entry.more} more`);
  return names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}` : names[0] ?? '';
}
