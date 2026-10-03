import type { CatalogCondition, CatalogDropRow } from "@afallon/contracts/catalog";
import { type DocumentProjectionInput, optionalChance, optionalCount, requirementsFor } from "./projection";

// A table roll of 100 or more always happens, so a row omits it.
function tableChanceOf(row: CatalogDropRow): number | undefined {
  return row.tableRate !== null && row.tableRate < 100 ? optionalChance(Math.round(row.tableRate * 10) / 10) : undefined;
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
