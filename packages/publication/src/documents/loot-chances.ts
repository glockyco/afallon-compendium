import type { CatalogDropRow, CatalogEndpoint, CatalogInteractionRow, CatalogItemLootTable } from "@afallon/contracts/catalog";
import type { LevelChance } from "@afallon/contracts/public";
import { levelChanceRuns } from "../levels";
import { lootItemProbability, type LootOddsTable } from "../loot-odds";
import type { DocumentProjectionInput } from "./projection";

export type PublishedOdds = { chance: number; level?: number } | { unavailable: string };

// `questOnly` marks an entry whose item drops only while one of the player's quests has an open task for it
// (`EconomyUtilities.QuestItemDropAllowed`). The ordered rolls and the minimum picks both skip it otherwise.
type OddsEntry = LootOddsTable["entries"][number] & { questOnly?: true };
type OddsTable = Omit<LootOddsTable, "entries"> & { entries: readonly OddsEntry[] };
// Each quest item other than the targets is tried droppable and not droppable, which is 2^n calculations.
const MAX_UNKNOWN_QUEST_ITEMS = 4;
const QUEST_STATE_TOLERANCE = 1e-9;

/** What World Loot gives at each creature level. Item keys stay catalog keys; the documents resolve them. */
export interface WorldLootByLevel {
  /** The most items that World Loot gives one kill, when it is known. */
  maxItems: number | null;
  /** The lowest NPC rank whose kills roll World Loot, as an index into the native NPC types, when it is known. */
  minimumRank: number | null;
  any: LevelChance[];
  items: ReadonlyMap<string, { item: CatalogEndpoint; min?: number; max?: number; levels: LevelChance[]; unavailable?: string }>;
  unavailable?: string;
}

type ItemFact = DocumentProjectionInput["facts"]["items"][number];
interface OddsCache {
  results: Map<string, PublishedOdds>;
  items: Map<string, ItemFact>;
  tables: Map<number, CatalogItemLootTable>;
  worldRows: Map<number, CatalogDropRow[]>;
  worldLoot?: WorldLootByLevel | null;
}
const memo = new WeakMap<DocumentProjectionInput, OddsCache>();
const unavailable = (reason: string): PublishedOdds => ({ unavailable: reason });
const limited = (table: CatalogItemLootTable) => table.limitDroppedItems && table.maxDroppedItems > 0 ? table.maxDroppedItems : undefined;
const minimum = (table: CatalogItemLootTable) => table.hasMinimumDrops ? table.minDroppedItems : 0;

function details(input: DocumentProjectionInput): OddsCache {
  let cached = memo.get(input);
  if (cached) return cached;
  const worldRows = new Map<number, CatalogDropRow[]>();
  for (const row of input.relations.drops) {
    if (row.context !== "world") continue;
    const group = worldRows.get(row.lootTableId) ?? [];
    group.push(row);
    worldRows.set(row.lootTableId, group);
  }
  cached = { results: new Map(), items: new Map(input.facts.items.map((item) => [item.entityKey, item])),
    tables: new Map(input.facts.itemLootTables.map((table) => [table.id, table])), worldRows };
  memo.set(input, cached);
  return cached;
}

function entriesFor(input: DocumentProjectionInput, table: CatalogItemLootTable, level?: number, bandRange?: number | null): OddsEntry[] | string {
  const itemFacts = details(input).items;
  const entries: OddsEntry[] = [];
  for (const entry of table.entries) {
    const key = entry.item.entityKey;
    if (!key) return "An item in this loot list has no known identity.";
    const facts = itemFacts.get(key);
    if (!facts) return "An item's requirements in this loot list are unknown.";
    if (typeof entry.rate !== "number" || !Number.isFinite(entry.rate)) return "An item in this loot list has no known listed rate.";
    let eligible = true;
    if (table.levelBandGear) {
      if (level === undefined || bandRange === null || bandRange === undefined) return "The level range for this loot list is unavailable.";
      const required = facts.levelRequirement;
      if (required === undefined) return "An item's level requirement is unavailable.";
      eligible = required === null || required <= 0 || Math.abs(required - level) <= bandRange;
    }
    entries.push({ itemKey: key, rate: entry.rate, eligible, ...(eligible && facts.questDropOnly ? { questOnly: true as const } : {}) });
  }
  return entries;
}

// The reader's quests are unknown, so every quest item other than the targets is tried in both states, and a chance is
// published only when no combination changes it. A target's own quest task is open, because only then can it drop.
function probability(tables: readonly OddsTable[], targets: ReadonlySet<string>, worldLimit?: number): PublishedOdds {
  const unknown = tables.flatMap((table, tableIndex) => table.entries.flatMap((entry, entryIndex) =>
    entry.questOnly && entry.eligible !== false && !targets.has(entry.itemKey) ? [{ tableIndex, entryIndex }] : []));
  if (unknown.length > MAX_UNKNOWN_QUEST_ITEMS) return unavailable("These loot lists hold too many quest items for a reliable drop chance.");
  const options = { ...(worldLimit === undefined ? {} : { worldLimit }), lootChance: 0 };
  let baseline: number | undefined;
  try {
    for (let state = 0; state < 1 << unknown.length; state++) {
      const variant = unknown.length === 0 ? tables : tables.map((table, tableIndex) => ({ ...table, entries: table.entries.map((entry, entryIndex) => {
        const bit = unknown.findIndex((quest) => quest.tableIndex === tableIndex && quest.entryIndex === entryIndex);
        return bit < 0 ? entry : { ...entry, eligible: (state & 1 << bit) !== 0 };
      }) }));
      const chance = lootItemProbability(variant, targets, options) * 100;
      if (baseline === undefined) baseline = chance;
      else if (Math.abs(chance - baseline) > QUEST_STATE_TOLERANCE) return unavailable("A quest item in this loot list changes this chance while a quest needs it.");
    }
  } catch (error) {
    if (error instanceof RangeError) return unavailable("This loot list's minimum cannot be included in a reliable drop chance.");
    throw error;
  }
  return { chance: baseline! };
}

/** Whether the item drops only while one of the player's quests has an open task for it. */
export function questOnlyItem(input: DocumentProjectionInput, itemKey: string | null): boolean {
  return itemKey !== null && details(input).items.get(itemKey)?.questDropOnly === true;
}

/**
 * The chance that one kill gives the item from this one loot list of a creature, conditional on a player-rewarded kill
 * with no Loot Chance and no active modifiers. Each list that a creature binds rolls on its own and keeps its own item
 * count and limit (`EconomyUtilities.GenerateDroppedLoot`), so no other list changes this chance.
 */
export function creatureDropOdds(input: DocumentProjectionInput, row: CatalogDropRow): PublishedOdds {
  const key = row.item.entityKey;
  if (!key) return unavailable("The item's identity is unavailable.");
  const cacheKey = `npc:${row.lootTableId}:${row.tableRate}:${row.conditionIds.join(",")}:${key}`;
  const cache = details(input).results, known = cache.get(cacheKey);
  if (known) return known;
  const result = listOdds(input, row, key);
  cache.set(cacheKey, result);
  return result;
}

function listOdds(input: DocumentProjectionInput, row: CatalogDropRow, itemKey: string): PublishedOdds {
  const table = details(input).tables.get(row.lootTableId);
  if (!table) return unavailable("The creature's full loot list is unavailable.");
  if (row.tableRate === null || !Number.isFinite(row.tableRate)) return unavailable("The creature's loot-list roll rate is unavailable.");
  if (row.conditionIds.length) return unavailable("The creature's loot-list requirements depend on your character.");
  const entries = entriesFor(input, table);
  if (typeof entries === "string") return unavailable(entries);
  return probability([{ mode: "npc", gateRate: row.tableRate, minimum: minimum(table),
    ...(limited(table) === undefined ? {} : { limit: limited(table) }), entries }], new Set([itemKey]));
}

/**
 * The World Loot lists that a kill at `level` rolls, in order, with the entries that the level allows: the catalog's
 * creature levels of each entry already join the list's level window with the item's level band.
 */
function worldTablesAt(input: DocumentProjectionInput, level: number): OddsTable[] | string {
  const tables: OddsTable[] = [];
  for (const binding of input.worldLootTables ?? []) {
    if (binding.minimumLevel > level || binding.maximumLevel > 0 && level > binding.maximumLevel) continue;
    if (binding.hasRequirements) return "A World Loot table has requirements that depend on your character.";
    if (binding.tableRate === null || !Number.isFinite(binding.tableRate)) return "A World Loot table roll rate is unavailable.";
    const table = details(input).tables.get(binding.lootTableId);
    if (!table) return "A complete World Loot table is unavailable.";
    const allowed = new Set((details(input).worldRows.get(binding.lootTableId) ?? []).filter((row) => row.creatureLevel
      && row.creatureLevel.min <= level && (row.creatureLevel.max === null || level <= row.creatureLevel.max)).map((row) => row.entryIndex));
    const source = entriesFor(input, table, level, binding.levelBandRange);
    if (typeof source === "string") return source;
    // The World Loot rolls and their minimum picks apply the same quest check as the creature's own loot lists.
    const entries = source.map((entry, index) => ({ ...entry, eligible: entry.eligible !== false && allowed.has(index) }));
    tables.push({ mode: "world", gateRate: binding.tableRate, minimum: minimum(table),
      ...(limited(table) === undefined ? {} : { limit: limited(table) }), entries });
  }
  return tables;
}

/**
 * What World Loot gives at each creature level, or undefined when the build has no World Loot. World Loot rolls after
 * the creature's own loot lists on every kill that rewards the player, for a creature of the World Loot rank or higher,
 * and its lists share one item limit (`EconomyUtilities.GenerateDroppedLoot`).
 */
export function worldLootByLevel(input: DocumentProjectionInput): WorldLootByLevel | undefined {
  const cache = details(input);
  if (cache.worldLoot !== undefined) return cache.worldLoot ?? undefined;
  const result = computeWorldLootByLevel(input);
  cache.worldLoot = result ?? null;
  return result;
}

function computeWorldLootByLevel(input: DocumentProjectionInput): WorldLootByLevel | undefined {
  const worlds = input.worldLootTables ?? [];
  const rows = worlds.flatMap((binding) => details(input).worldRows.get(binding.lootTableId) ?? []);
  if (!worlds.length || !rows.length) return undefined;
  const worldLimit = worlds[0]!.worldLimit, minimumRank = worlds[0]!.minimumRank;
  // Nothing changes above the highest level that starts or ends a list's window or an entry's creature levels.
  const bounds = [...worlds.flatMap((binding) => [binding.minimumLevel, binding.maximumLevel]),
    ...rows.flatMap((row) => row.creatureLevel ? [row.creatureLevel.min, row.creatureLevel.max ?? 0] : [])];
  const top = Math.max(1, ...bounds) + 1;
  const keyed = new Map<string, CatalogDropRow[]>();
  for (const row of rows) if (row.item.entityKey && row.creatureLevel) keyed.set(row.item.entityKey, [...keyed.get(row.item.entityKey) ?? [], row]);
  const reasons = new Set<string>(), itemReasons = new Map<string, Set<string>>([...keyed.keys()].map((key) => [key, new Set()]));
  const any: (number | undefined)[] = [];
  const chances = new Map<string, (number | null | undefined)[]>([...keyed.keys()].map((key) => [key, []]));
  for (let level = 1; level <= top; level++) {
    const tables = worldLimit === null ? "The shared World Loot item limit is unavailable." : worldTablesAt(input, level);
    for (const [key, itemRows] of keyed) {
      const series = chances.get(key)!;
      if (!itemRows.some((row) => row.creatureLevel!.min <= level && (row.creatureLevel!.max === null || level <= row.creatureLevel!.max))) { series.push(null); continue; }
      const odds = typeof tables === "string" ? unavailable(tables) : probability(tables, new Set([key]), worldLimit!);
      if ("chance" in odds) series.push(odds.chance);
      else { series.push(undefined); itemReasons.get(key)!.add(odds.unavailable); }
    }
    const targets = typeof tables === "string" ? new Set<string>() : new Set(tables.flatMap((table) => table.entries
      .filter((entry) => entry.eligible !== false && !entry.questOnly).map((entry) => entry.itemKey)));
    const odds = typeof tables === "string" ? unavailable(tables) : probability(tables, targets, worldLimit!);
    if ("chance" in odds) any.push(odds.chance);
    else { any.push(undefined); reasons.add(odds.unavailable); }
  }
  const items = new Map([...keyed].map(([key, itemRows]) => {
    const counts = itemRows.flatMap((row) => row.min !== null && row.max !== null && row.min <= row.max ? [{ min: row.min, max: row.max }] : []);
    const why = [...itemReasons.get(key)!];
    return [key, { item: itemRows[0]!.item,
      ...(counts.length ? { min: Math.min(...counts.map((count) => count.min)), max: Math.max(...counts.map((count) => count.max)) } : {}),
      levels: levelChanceRuns(chances.get(key)!), ...(why.length ? { unavailable: why[0]! } : {}),
    }] as const;
  }));
  return { maxItems: worldLimit, minimumRank, any: levelChanceRuns(any), items, ...(reasons.size ? { unavailable: [...reasons][0]! } : {}) };
}

/** Probability per qualifying use of a captured nested LootTable action, at the stated player level. */
export function objectDropOdds(input: DocumentProjectionInput, row: CatalogInteractionRow): PublishedOdds {
  if (row.lootTableId === undefined) return unavailable("The object's loot table is unavailable.");
  if (row.gameActionChance === undefined) return unavailable("The object's LootTable action is not confirmed.");
  const itemKey = row.item.entityKey;
  if (!itemKey) return unavailable("The item's identity is unavailable.");
  const table = details(input).tables.get(row.lootTableId);
  if (!table) return unavailable("The object's full loot list is unavailable.");
  // The object's guarantee-one flag has not been captured. A table with its own minimum does not need that flag.
  if (!table.hasMinimumDrops) return unavailable("Whether this object guarantees an item is unavailable.");
  const item = details(input).items.get(itemKey);
  if (!item) return unavailable("The item's level requirement is unavailable.");
  if (table.levelBandGear && item.levelRequirement === undefined)
    return unavailable("The item's level requirement is unavailable.");
  const level = table.levelBandGear ? Math.max(1, item.levelRequirement ?? 1) : undefined;
  const bandRange = input.worldLootTables?.[0]?.levelBandRange;
  const cacheKey = `object:${row.sourceId}:${row.lootTableId}:${itemKey}:${level ?? ""}:${row.actionChance ?? 100}:${row.gameActionChance}:${row.prefabChoices ?? 1}`;
  const cache = details(input).results, known = cache.get(cacheKey);
  if (known) return known;
  const entries = entriesFor(input, table, level ?? undefined, bandRange);
  if (typeof entries === "string") return unavailable(entries);
  // Whether an object's roll skips a quest item without an open quest task is not verified.
  if (entries.some((entry) => entry.questOnly)) return unavailable("Active quest requirements for this loot list are unknown.");
  const actionChance = row.actionChance ?? 100, nestedChance = row.gameActionChance;
  if (!Number.isFinite(actionChance) || actionChance < 0 || actionChance > 100
    || !Number.isFinite(nestedChance) || nestedChance < 0 || nestedChance > 100)
    return unavailable("The object's action roll rate is unavailable.");
  const randomBranch = row.prefabChoices && row.prefabChoices > 1 ? row.prefabChoices : 1;
  const result = probability([{ mode: "object", gateRate: actionChance * nestedChance / 100 / randomBranch,
    minimum: minimum(table), ...(limited(table) === undefined ? {} : { limit: limited(table) }), entries }], new Set([itemKey]));
  const withLevel = "chance" in result && level !== undefined ? { ...result, level } : result;
  cache.set(cacheKey, withLevel);
  return withLevel;
}
