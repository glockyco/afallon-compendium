import type { CatalogDropRow, CatalogInteractionRow, CatalogItemLootTable } from "@afallon/contracts/catalog";
import { lootItemProbability, type LootOddsTable } from "../loot-odds";
import type { DocumentProjectionInput } from "./projection";

export type PublishedOdds = { chance: number; level?: number } | { unavailable: string };

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

function entriesFor(input: DocumentProjectionInput, table: CatalogItemLootTable, level?: number, bandRange?: number | null): LootOddsTable["entries"] | string {
  const itemFacts = details(input).items;
  const entries: Array<{ itemKey: string; rate: number; eligible: boolean }> = [];
  for (const entry of table.entries) {
    const key = entry.item.entityKey;
    if (!key) return "An item in this loot list has no known identity.";
    const facts = itemFacts.get(key);
    if (!facts) return "An item in this loot list has no published requirements.";
    if (typeof entry.rate !== "number" || !Number.isFinite(entry.rate)) return "An item in this loot list has no known listed rate.";
    let eligible = true;
    if (table.levelBandGear) {
      if (level === undefined || bandRange === null || bandRange === undefined) return "The level range for this loot list is unavailable.";
      const required = facts.levelRequirement;
      if (required === undefined) return "An item's level requirement is unavailable.";
      eligible = required === null || required <= 0 || Math.abs(required - level) <= bandRange;
    }
    if (eligible && facts.questDropOnly) return "Active quest requirements for this loot list are unknown.";
    entries.push({ itemKey: key, rate: entry.rate, eligible });
  }
  return entries;
}

function probability(tables: readonly LootOddsTable[], key: string, worldLimit?: number): PublishedOdds {
  try {
    return { chance: lootItemProbability(tables, key, { ...(worldLimit === undefined ? {} : { worldLimit }), lootChance: 0 }) * 100 };
  } catch (error) {
    if (error instanceof RangeError) return unavailable("This loot list's minimum cannot be included in a reliable drop chance.");
    throw error;
  }
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
  const bindings = new Map<number, CatalogDropRow>();
  for (const row of rows) if (!bindings.has(row.lootTableId)) bindings.set(row.lootTableId, row);
  const tables: LootOddsTable[] = [];
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
  const tables: LootOddsTable[] = [];
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
    const entries = source.map((entry, index) => ({ ...entry, eligible: entry.eligible !== false && eligibleKeys.has(index) }));
    if (entries.some((entry) => entry.eligible && details(input).items.get(entry.itemKey)?.questDropOnly))
      return unavailable("Active quest requirements for a World Loot item are unknown.");
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
