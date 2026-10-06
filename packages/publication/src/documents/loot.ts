import type { CatalogCondition, CatalogDropRow } from "@afallon/contracts/catalog";
import { creatureDropOdds, questOnlyItem } from "./loot-chances";
import { type DocumentProjectionInput, optionalChance, optionalCount, requirementsFor } from "./projection";

// A value of 100 always passes. A creature's binding truncates the random draw before comparing, so 5 at its gate means
// 6% with neutral modifiers.
function tableChanceOf(row: CatalogDropRow): number | undefined {
  if (row.tableRate === null) return undefined;
  const chance = Math.floor(row.tableRate) + 1;
  return chance < 100 ? optionalChance(Math.max(0, Math.round(chance * 10) / 10)) : undefined;
}

/** The fields that a row of a creature's own loot list shares on the creature page and on the item page. */
export function lootFields(row: CatalogDropRow, conditions: ReadonlyMap<string, CatalogCondition>, input: DocumentProjectionInput) {
  if (row.context !== "npc") throw new Error(`Loot row of table ${row.lootTableId} is not a creature's own loot list.`);
  const tableChance = tableChanceOf(row);
  const validRange = row.min !== null && row.max !== null && row.min <= row.max;
  const odds = creatureDropOdds(input, row);
  return {
    ...(validRange && optionalCount(row.min) !== undefined ? { min: row.min! } : {}),
    ...(validRange && optionalCount(row.max) !== undefined ? { max: row.max! } : {}),
    ...(optionalChance(row.displayedChance) === undefined ? {} : { chance: optionalChance(row.displayedChance) }),
    ...("chance" in odds ? { killChance: odds.chance } : { oddsUnavailable: odds.unavailable }),
    ...(questOnlyItem(input, row.item.entityKey) ? { questOnly: true as const } : {}),
    ...(tableChance === undefined ? {} : { tableChance }),
    ...(row.tableMinimum === null ? {} : { tableMinimum: row.tableMinimum }),
    ...(row.tableLimit === null ? {} : { tableLimit: row.tableLimit }),
    requirements: requirementsFor(row.conditionIds, conditions, input.resolve),
  };
}
