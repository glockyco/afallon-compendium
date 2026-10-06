import type { CatalogDropRow, CatalogInteractionRow, CatalogItemLootTable } from "@afallon/contracts/catalog";
import { lootItemProbability, type LootOddsTable } from "../loot-odds";
import type { DocumentProjectionInput } from "./projection";

export type PublishedOdds = { chance: number; level?: number } | { unavailable: string };

// `questOnly` marks an entry whose item drops only while one of the player's quests has an open task for it
// (`EconomyUtilities.QuestItemDropAllowed`). The ordered rolls and the minimum picks both skip it otherwise.
type OddsEntry = LootOddsTable["entries"][number] & { questOnly?: true };
type OddsTable = Omit<LootOddsTable, "entries"> & { entries: readonly OddsEntry[] };
// Each quest item other than the target is tried droppable and not droppable, which is 2^n calculations.
const MAX_UNKNOWN_QUEST_ITEMS = 4;
const QUEST_STATE_TOLERANCE = 1e-9;

type ItemFact = DocumentProjectionInput["facts"]["items"][number];
interface OddsCache {
  results: Map<string, PublishedOdds>;
  items: Map<string, ItemFact>;
  tables: Map<number, CatalogItemLootTable>;
  npcRows: Map<string, CatalogDropRow[]>;
  worldRows: Map<number, CatalogDropRow[]>;
}
const memo = new WeakMap<DocumentProjectionInput, OddsCache>();
const unavailable = (reason: string): PublishedOdds => ({ unavailable: reason });
const limited = (table: CatalogItemLootTable) => table.limitDroppedItems && table.maxDroppedItems > 0 ? table.maxDroppedItems : undefined;
const minimum = (table: CatalogItemLootTable) => table.hasMinimumDrops ? table.minDroppedItems : 0;

function details(input: DocumentProjectionInput): OddsCache {
  let cached = memo.get(input);
  if (cached) return cached;
  const npcRows = new Map<string, CatalogDropRow[]>(), worldRows = new Map<number, CatalogDropRow[]>();
  for (const row of input.relations.drops) {
    if (row.context === "world") {
      const group = worldRows.get(row.lootTableId) ?? [];
      group.push(row);
      worldRows.set(row.lootTableId, group);
    } else if (row.owner.entityKey) {
      const group = npcRows.get(row.owner.entityKey) ?? [];
      group.push(row);
      npcRows.set(row.owner.entityKey, group);
    }
  }
  cached = { results: new Map(), items: new Map(input.facts.items.map((item) => [item.entityKey, item])),
    tables: new Map(input.facts.itemLootTables.map((table) => [table.id, table])), npcRows, worldRows };
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

// The reader's quests are unknown, so every other quest item is tried in both states, and a chance is published only when
// no combination changes it. The target's own quest task is open, because that is the only state in which it drops.
function probability(tables: readonly OddsTable[], key: string, worldLimit?: number): PublishedOdds {
  const unknown = tables.flatMap((table, tableIndex) => table.entries.flatMap((entry, entryIndex) =>
    entry.questOnly && entry.eligible !== false && entry.itemKey !== key ? [{ tableIndex, entryIndex }] : []));
  if (unknown.length > MAX_UNKNOWN_QUEST_ITEMS) return unavailable("These loot lists hold too many quest items for a reliable drop chance.");
  const options = { ...(worldLimit === undefined ? {} : { worldLimit }), lootChance: 0 };
  let baseline: number | undefined;
  try {
    for (let state = 0; state < 1 << unknown.length; state++) {
      const variant = unknown.length === 0 ? tables : tables.map((table, tableIndex) => ({ ...table, entries: table.entries.map((entry, entryIndex) => {
        const bit = unknown.findIndex((quest) => quest.tableIndex === tableIndex && quest.entryIndex === entryIndex);
        return bit < 0 ? entry : { ...entry, eligible: (state & 1 << bit) !== 0 };
      }) }));
      const chance = lootItemProbability(variant, key, options) * 100;
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

/** The neutral, no-active-modifier probability conditional on a player-rewarded kill. */
export function creatureDropOdds(input: DocumentProjectionInput, row: CatalogDropRow): PublishedOdds {
  const key = row.item.entityKey;
  if (!key) return unavailable("The item's identity is unavailable.");
  const level = row.context === "world" ? row.worldReferenceLevel ?? row.creatureLevel?.min : undefined;
  if (row.context === "world" && level === undefined) return unavailable("The eligible creature level is unavailable.");
  const cacheKey = `${row.context}:${row.owner.entityKey ?? "world"}:${key}:${level ?? ""}`;
  const cache = details(input).results, known = cache.get(cacheKey);
  if (known) return known;
  const answer = row.context === "world" ? worldOdds(input, key, level!) : npcOdds(input, row.owner.entityKey, key);
  const result = "chance" in answer && level !== undefined ? { ...answer, level } : answer;
  cache.set(cacheKey, result);
  return result;
}

function npcOdds(input: DocumentProjectionInput, npcKey: string | null, itemKey: string): PublishedOdds {
  if (!npcKey) return unavailable("The creature's loot list is unavailable.");
  const rows = details(input).npcRows.get(npcKey) ?? [];
  // Each creature loot list keeps its own item count and limit (`EconomyUtilities.GenerateDroppedLoot`), so only the
  // lists that contain the item decide its chance.
  const bindings = new Map<number, CatalogDropRow>();
  for (const row of rows) if (row.item.entityKey === itemKey && !bindings.has(row.lootTableId)) bindings.set(row.lootTableId, row);
  const tables: OddsTable[] = [];
  for (const binding of bindings.values()) {
    const table = details(input).tables.get(binding.lootTableId);
    if (!table) return unavailable("The creature's full loot list is unavailable.");
    if (binding.tableRate === null || !Number.isFinite(binding.tableRate)) return unavailable("The creature's loot-list roll rate is unavailable.");
    if (binding.conditionIds.length) return unavailable("The creature's loot-list requirements depend on your character.");
    const entryRows = entriesFor(input, table);
    if (typeof entryRows === "string") return unavailable(entryRows);
    tables.push({ mode: "npc", gateRate: binding.tableRate, minimum: minimum(table),
      ...(limited(table) === undefined ? {} : { limit: limited(table) }), entries: entryRows });
  }
  return probability(tables, itemKey);
}

function worldOdds(input: DocumentProjectionInput, itemKey: string, level: number): PublishedOdds {
  const worlds = input.worldLootTables;
  if (!worlds?.length) return unavailable("The World Loot table order is unavailable.");
  const worldLimit = worlds[0]?.worldLimit;
  if (worldLimit === null || worldLimit === undefined) return unavailable("The shared World Loot item limit is unavailable.");
  if (worlds.some((binding) => binding.minimumRank === null)) return unavailable("The World Loot creature rank restriction is unavailable.");
  const rows = details(input).worldRows;
  const tables: OddsTable[] = [];
  for (const binding of worlds) {
    if (binding.minimumLevel > level || binding.maximumLevel > 0 && level > binding.maximumLevel) continue;
    if (binding.hasRequirements) return unavailable("A World Loot table has requirements that depend on your character.");
    if (binding.tableRate === null || !Number.isFinite(binding.tableRate)) return unavailable("A World Loot table roll rate is unavailable.");
    const table = details(input).tables.get(binding.lootTableId);
    if (!table) return unavailable("A complete World Loot table is unavailable.");
    const tableRows = rows.get(binding.lootTableId) ?? [];
    const eligibleKeys = new Set(tableRows.filter((entry) => entry.creatureLevel && entry.creatureLevel.min <= level
      && (entry.creatureLevel.max === null || level <= entry.creatureLevel.max)).map((entry) => entry.entryIndex));
    const source = entriesFor(input, table, level, binding.levelBandRange);
    if (typeof source === "string") return unavailable(source);
    // The World Loot rolls and their minimum picks apply the same quest check as the creature's own loot lists.
    const entries = source.map((entry, index) => ({ ...entry, eligible: entry.eligible !== false && eligibleKeys.has(index) }));
    tables.push({ mode: "world", gateRate: binding.tableRate, minimum: minimum(table),
      ...(limited(table) === undefined ? {} : { limit: limited(table) }), entries });
  }
  return probability(tables, itemKey, worldLimit);
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
    minimum: minimum(table), ...(limited(table) === undefined ? {} : { limit: limited(table) }), entries }], itemKey);
  const withLevel = "chance" in result && level !== undefined ? { ...result, level } : result;
  cache.set(cacheKey, withLevel);
  return withLevel;
}
