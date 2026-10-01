import type { CatalogCondition, CatalogDropRow } from "@afallon/contracts/catalog";
import { type DocumentProjectionInput, optionalChance, optionalCount, requirementsFor } from "./projection";

// A table roll of 100 or more always happens, so a row omits it.
function tableChanceOf(row: CatalogDropRow): number | undefined {
  return row.tableRate !== null && row.tableRate < 100 ? optionalChance(Math.round(row.tableRate * 10) / 10) : undefined;
}

/**
 * A creature page groups its drops by their loot list rule: the share of kills that roll the list and the number of
 * items that the list gives. Two lists of one creature with the same rule and a limit or a minimum would merge into one
 * group whose item count is wrong, so publication stops instead.
 */
export function assertDistinctLootRules(owner: string, rows: readonly CatalogDropRow[]): void {
  const tableByRule = new Map<string, number>();
  for (const row of rows) {
    if (row.tableMinimum === null && row.tableLimit === null) continue;
    const rule = JSON.stringify([tableChanceOf(row) ?? null, row.tableMinimum, row.tableLimit]);
    const table = tableByRule.get(rule);
    if (table === undefined) tableByRule.set(rule, row.lootTableId);
    else if (table !== row.lootTableId) throw new Error(`${owner} has the loot lists ${table} and ${row.lootTableId} with the same drop rule ${rule}, so its Drops section would merge them.`);
  }
}

// The fields that a drop row shares on the creature page and on the item page.
export function lootFields(row: CatalogDropRow, conditions: ReadonlyMap<string, CatalogCondition>, input: DocumentProjectionInput) {
  const tableChance = tableChanceOf(row);
  const validRange = row.min !== null && row.max !== null && row.min <= row.max;
  return {
    ...(validRange && optionalCount(row.min) !== undefined ? { min: row.min! } : {}),
    ...(validRange && optionalCount(row.max) !== undefined ? { max: row.max! } : {}),
    ...(optionalChance(row.displayedChance) === undefined ? {} : { chance: optionalChance(row.displayedChance) }),
    ...(tableChance === undefined ? {} : { tableChance }),
    ...(row.tableMinimum === null ? {} : { tableMinimum: row.tableMinimum }),
    ...(row.tableLimit === null ? {} : { tableLimit: row.tableLimit }),
    ...(row.creatureLevel === null ? {} : { creatureLevel: row.creatureLevel.max === null ? { min: row.creatureLevel.min } : { min: row.creatureLevel.min, max: row.creatureLevel.max } }),
    requirements: requirementsFor(row.conditionIds, conditions, input.resolve),
  };
}
