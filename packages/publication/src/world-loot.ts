/**
 * The world loot that a supply pack band can give, following `EconomyUtilities.GetPackWorldLootPool` of build 25653798
 * (RVA 0x53de50) and the checks that it calls. Evidence: `local/research/supply-pack-world-loot-20261002.md` in the
 * main checkout.
 */

/** `IsPrimaryStat` (RVA 0x5410a0) treats stats 27, 28, and 135 as main stats. */
const MAIN_STATS: ReadonlySet<number> = new Set([27, 28, 135]);
/**
 * `IsAccessoryItem` (RVA 0x53f500) exempts trinkets and items in these armor slots from the band's armor type. The game
 * answered for every world loot item of build 25653798: rings, necks, capes, and trinkets are accessories.
 */
const ACCESSORY_SLOTS: ReadonlySet<string> = new Set(["NECK", "RING", "CAPE"]);
/** `IsPackWorldLootLevelAllowed` (RVA 0x540ff0): a requirement may be this far below or above the character's level. */
const LEVELS_BELOW = 4, LEVELS_ABOVE = 2;

export interface WorldLootItem {
  key: string;
  itemType: string | null;
  weaponType: string | null;
  armorType: string | null;
  armorSlot: string | null;
  /** The first Level requirement of the item. Zero or less is no requirement. */
  levelRequirement: number;
  questOnly: boolean;
  /** The ids of the stats that the item has, fixed or random. */
  stats: readonly number[];
}
export interface WorldLootTable { minimumLevel: number; maximumLevel: number; hasRequirements: boolean; itemKeys: readonly string[] }
export interface WorldLootBand { minLevel: number; maxLevel: number | undefined; armorType: string | null; stats: readonly number[] }
export interface WorldLootLevels { key: string; levels: Array<{ min: number; max?: number }> }

const upper = (value: string | null) => value?.toUpperCase() ?? null;

/**
 * Whether the band can give the item to a class with these weapon types, before the level checks
 * (`IsItemSuitedForPack`, RVA 0x5404e0). Equipment that passes its weapon or armor check must also pass the main stat
 * check. Items that cannot be equipped pass.
 */
export function suitsBand(item: WorldLootItem, band: WorldLootBand, classWeapons: ReadonlySet<string>): boolean {
  const type = upper(item.itemType);
  if (type === "WEAPON") {
    if (item.weaponType === null || !classWeapons.has(upper(item.weaponType)!)) return false;
  } else if (type === "ARMOR" || type === "TRINKET") {
    const accessory = type === "TRINKET" || ACCESSORY_SLOTS.has(upper(item.armorSlot) ?? "");
    if (!accessory && band.armorType !== null && upper(item.armorType) !== upper(band.armorType)) return false;
  } else return true;
  const main = item.stats.filter((stat) => MAIN_STATS.has(stat));
  return band.stats.length === 0 || main.length === 0 || main.some((stat) => band.stats.includes(stat));
}

/** Whether a character of this level can get the item from world loot, by its requirement alone. */
export function levelAllows(item: WorldLootItem, level: number): boolean {
  return item.levelRequirement <= 0 || (level - LEVELS_BELOW <= item.levelRequirement && item.levelRequirement <= level + LEVELS_ABOVE);
}

const tableOpenAt = (table: WorldLootTable, level: number) =>
  (table.minimumLevel <= 0 || level >= table.minimumLevel) && (table.maximumLevel <= 0 || level <= table.maximumLevel);

/**
 * The world loot items of a band for one class, each with the character levels at which it can appear. An open band is
 * evaluated up to the level after which no item with a requirement can still qualify, and an item that still qualifies
 * there has no upper level. A table with requirements depends on the character's state, which no band can show, so
 * publication stops until such a table is understood.
 */
export function bandWorldLoot(band: WorldLootBand, tables: readonly WorldLootTable[], items: ReadonlyMap<string, WorldLootItem>, classWeapons: ReadonlySet<string>): WorldLootLevels[] {
  const gated = tables.find((table) => table.hasRequirements);
  if (gated) throw new Error("A world loot table has requirements, which the supply pack world loot cannot show yet.");
  const highestRequirement = Math.max(0, ...tables.flatMap((table) => table.itemKeys.map((key) => items.get(key)?.levelRequirement ?? 0)));
  const lastLevel = band.maxLevel ?? Math.max(band.minLevel, highestRequirement + LEVELS_BELOW + 1);
  const levelsByItem = new Map<string, number[]>();
  for (let level = band.minLevel; level <= lastLevel; level++) {
    const candidates = new Set<string>();
    for (const table of tables) {
      if (!tableOpenAt(table, level)) continue;
      for (const key of table.itemKeys) {
        const item = items.get(key);
        if (!item || item.questOnly || !levelAllows(item, level) || !suitsBand(item, band, classWeapons)) continue;
        candidates.add(key);
      }
    }
    for (const key of candidates) levelsByItem.set(key, [...levelsByItem.get(key) ?? [], level]);
  }
  return [...levelsByItem].map(([key, levels]) => {
    const ranges: Array<{ min: number; max?: number }> = [];
    for (const level of levels) {
      const last = ranges.at(-1);
      if (last && last.max === level - 1) last.max = level;
      else ranges.push({ min: level, max: level });
    }
    const final = ranges.at(-1)!;
    if (band.maxLevel === undefined && final.max === lastLevel) delete final.max;
    return { key, levels: ranges };
  });
}
