import type { LevelChance, LootGuide, NpcDropRow } from '@afallon/contracts/public';

/** The run of creature levels that holds `level`, if any. */
export function runAt(levels: readonly LevelChance[], level: number): LevelChance | undefined {
  return levels.find((run) => run.minLevel <= level && (run.maxLevel === undefined || level <= run.maxLevel));
}

/** The lowest and highest known chance of some runs, or undefined when no run has a known chance. */
export function chanceRange(levels: readonly LevelChance[]): { low: number; high: number } | undefined {
  const chances = levels.flatMap((run) => run.chance === undefined ? [] : [run.chance]);
  return chances.length ? { low: Math.min(...chances), high: Math.max(...chances) } : undefined;
}

/** The lowest creature level from which World Loot and cloth give every higher level the same. */
export function steadyLevel(guide: Pick<LootGuide, 'worldLoot' | 'cloth'>): number {
  const runs = [...guide.worldLoot ? [guide.worldLoot.any, ...guide.worldLoot.items.map((item) => item.levels)] : [], ...guide.cloth?.items.map((item) => item.levels) ?? []].flat();
  return Math.max(1, ...runs.map((run) => run.maxLevel === undefined ? run.minLevel : run.maxLevel + 1));
}

/** One row of a drop table: an item, its quantity, and its chance per kill or the game's listed rate. */
export type DropTableRow = Pick<NpcDropRow, 'counterpart' | 'min' | 'max' | 'chance' | 'killChance' | 'oddsUnavailable' | 'questOnly'>
  & Partial<Pick<NpcDropRow, 'requirements' | 'variants'>>;

/** What the World Loot and cloth rolls of one kill give at one creature level. */
export interface LevelLoot {
  level: number;
  worldLoot?: { maxItems?: number; minimumRank?: string; anyChance?: number; rows: DropTableRow[] };
  cloth?: { creatureTypes: string[]; chance: number; min: number; max: number; rows: DropTableRow[] };
}

/** What the Loot guide's World Loot and cloth give a kill at `level`. An item that the level cannot give has no row. */
export function lootAtLevel(guide: Pick<LootGuide, 'worldLoot' | 'cloth'>, level: number): LevelLoot {
  const world = guide.worldLoot, cloth = guide.cloth;
  const anyRun = world && runAt(world.any, level);
  return {
    level,
    ...(world ? { worldLoot: {
      ...(world.maxItems === undefined ? {} : { maxItems: world.maxItems }), ...(world.minimumRank ? { minimumRank: world.minimumRank } : {}),
      ...(anyRun?.chance === undefined ? {} : { anyChance: anyRun.chance }),
      rows: world.items.flatMap((entry): DropTableRow[] => {
        const run = runAt(entry.levels, level);
        if (!run) return [];
        const odds = run.chance === undefined ? entry.oddsUnavailable ?? world.oddsUnavailable : undefined;
        return [{ counterpart: entry.item, ...(entry.min === undefined ? {} : { min: entry.min, max: entry.max }),
          ...(run.chance === undefined ? {} : { killChance: run.chance }), ...(odds ? { oddsUnavailable: odds } : {}),
          ...(entry.questOnly ? { questOnly: true as const } : {}) }];
      }),
    } } : {}),
    ...(cloth ? { cloth: {
      creatureTypes: cloth.creatureTypes, chance: cloth.chance, min: cloth.min, max: cloth.max,
      rows: cloth.items.flatMap((entry): DropTableRow[] => {
        const chance = runAt(entry.levels, level)?.chance;
        return chance ? [{ counterpart: entry.item, killChance: chance }] : [];
      }),
    } } : {}),
  };
}
