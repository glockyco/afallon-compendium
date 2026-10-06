import { NPC_TYPES } from "@afallon/catalog";
import { categoryLabel, type ItemWorldLoot, type WorldLoot } from "@afallon/contracts/public";
import { questOnlyItem, worldLootByLevel, type WorldLootByLevel } from "./loot-chances";
import type { DocumentProjectionInput } from "./projection";

type LevelsItem = WorldLootByLevel["items"] extends ReadonlyMap<string, infer T> ? T : never;

// The quantity, chances, and missing input of one item, shared by the Loot guide's rows and the item's own page.
function chanceFields(item: LevelsItem) {
  return { ...(item.min === undefined ? {} : { min: item.min, max: item.max! }), levels: item.levels, ...(item.unavailable ? { oddsUnavailable: item.unavailable } : {}) };
}

// The lowest rank that rolls World Loot, named only when it leaves out lower ranks.
function minimumRankName(world: WorldLootByLevel): string | undefined {
  const rank = world.minimumRank === null || world.minimumRank <= 0 ? undefined : NPC_TYPES[world.minimumRank];
  return rank && categoryLabel(rank);
}

/** What World Loot gives at each creature level, as the Loot guide publishes it. */
export function projectWorldLoot(input: DocumentProjectionInput): WorldLoot | undefined {
  const world = worldLootByLevel(input);
  if (!world) return undefined;
  const rank = minimumRankName(world);
  return {
    ...(world.maxItems === null ? {} : { maxItems: world.maxItems }), ...(rank ? { minimumRank: rank } : {}), any: world.any,
    items: [...world.items].map(([key, item]) => ({ item: input.resolve(item.item), ...chanceFields(item), ...(questOnlyItem(input, key) ? { questOnly: true as const } : {}) })),
    ...(world.unavailable ? { oddsUnavailable: world.unavailable } : {}),
  };
}

/** The item's chance per kill by the creature levels whose World Loot can give it. */
export function projectItemWorldLoot(input: DocumentProjectionInput, itemKey: string): ItemWorldLoot | undefined {
  const world = worldLootByLevel(input), item = world?.items.get(itemKey);
  if (!world || !item) return undefined;
  const rank = minimumRankName(world);
  return { ...chanceFields(item), ...(rank ? { minimumRank: rank } : {}) };
}

/** Whether the kills of a creature of this NPC type roll World Loot: its rank must be World Loot's minimum rank or higher. */
export function rollsWorldLoot(input: DocumentProjectionInput, npcType: string | null): boolean {
  const world = worldLootByLevel(input);
  const rank = npcType === null ? -1 : (NPC_TYPES as readonly string[]).indexOf(npcType);
  return world !== undefined && world.minimumRank !== null && rank >= world.minimumRank;
}
