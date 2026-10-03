import type { CatalogCondition, CatalogDropRow } from "@afallon/contracts/catalog";
import { creatureDropOdds } from "./loot-chances";
import { type DocumentProjectionInput, optionalChance, optionalCount, requirementsFor } from "./projection";

// A value of 100 always passes. Creature bindings truncate the random draw before comparing, while World Loot
// bindings use the untruncated draw; 5 at a creature gate therefore means 6% with neutral modifiers.
function tableChanceOf(row: CatalogDropRow): number | undefined {
  if (row.tableRate === null) return undefined;
  const chance = row.context === "npc" ? Math.floor(row.tableRate) + 1 : row.tableRate;
  return chance < 100 ? optionalChance(Math.max(0, Math.round(chance * 10) / 10)) : undefined;
}

// The fields that a drop row shares on the creature page and on the item page.
export function lootFields(row: CatalogDropRow, conditions: ReadonlyMap<string, CatalogCondition>, input: DocumentProjectionInput) {
  const tableChance = tableChanceOf(row);
  const validRange = row.min !== null && row.max !== null && row.min <= row.max;
  const odds = creatureDropOdds(input, row);
  return {
    ...(validRange && optionalCount(row.min) !== undefined ? { min: row.min! } : {}),
    ...(validRange && optionalCount(row.max) !== undefined ? { max: row.max! } : {}),
    ...(optionalChance(row.displayedChance) === undefined ? {} : { chance: optionalChance(row.displayedChance) }),
    ...("chance" in odds ? { killChance: odds.chance, ...(odds.level === undefined ? {} : { chanceLevel: odds.level }) }
      : { oddsUnavailable: odds.unavailable }),
    ...(tableChance === undefined ? {} : { tableChance }),
    ...(row.tableMinimum === null ? {} : { tableMinimum: row.tableMinimum }),
    ...(row.tableLimit === null ? {} : { tableLimit: row.tableLimit }),
    ...(row.creatureLevel === null ? {} : { creatureLevel: row.creatureLevel.max === null ? { min: row.creatureLevel.min } : { min: row.creatureLevel.min, max: row.creatureLevel.max } }),
    requirements: requirementsFor(row.conditionIds, conditions, input.resolve),
  };
}
