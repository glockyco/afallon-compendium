import type { CatalogRandomChoice } from "@afallon/contracts/catalog";
import type { PublicAlternative, PublicLevel } from "@afallon/contracts/public";
import { integer, record, type JsonRecord } from "./json";

// The rules below follow the native code of build 25434619: MobCombatEntity.InitNPCLevel,
// MobCombatEntity.GetScaledPlayerLevel, the ZoneLevelRules methods, and RandomActivator.Start. Runtime observations
// agreed with them.

export type ZoneRange = { min: number; max?: number };

/**
 * ZoneLevelRules.NormalizeRange. A positive minimum stays, otherwise the minimum is 1. A positive maximum gives a range
 * of at least the minimum. Without a positive maximum, a positive minimum gives an open range and no minimum gives no
 * range.
 */
export function zoneRange(min: unknown, max: unknown): ZoneRange | null {
  const low = integer(min), high = integer(max);
  const bottom = low !== null && low > 0 ? low : 1;
  if (high !== null && high > 0) return { min: bottom, max: Math.max(high, bottom) };
  return low !== null && low > 0 ? { min: bottom } : null;
}

/** The zone range of a scene, from its authored zone scaling. */
export function sceneZoneRange(gameplay: unknown): ZoneRange | null {
  const value = record(gameplay);
  return value ? zoneRange(value.zoneScalingMinLevel, value.zoneScalingMaxLevel) : null;
}

// GetScaledPlayerLevel clamps the player's level into the zone range and adds a small random offset without leaving
// the range. Without a range, it adds the offset to the player's level, so the level has no upper bound.
function scaledLevel(range: ZoneRange | null): PublicLevel {
  return range ? { min: range.min, ...(range.max === undefined ? {} : { max: range.max }), scales: true } : { min: 1, scales: true };
}

// Random.Range(min, max + 1) returns min when max is below min.
function rolledLevel(min: number, max: number): PublicLevel {
  return { min, max: Math.max(min, max), scales: false };
}

export interface NpcLevelRecord { minLevel: number | null; maxLevel: number | null; scales: boolean; npcType: string | null }

// Records that have no real level, such as merchants, carry the placeholder range 100–100.
const PLACEHOLDER_LEVEL = 100;

export function npcLevelRecord(gameplay: unknown): NpcLevelRecord {
  const value = record(gameplay), type = record(value?.npcType);
  const minLevel = integer(value?.minLevel), maxLevel = integer(value?.maxLevel);
  const placeholder = minLevel === PLACEHOLDER_LEVEL && maxLevel === PLACEHOLDER_LEVEL;
  return { minLevel: placeholder ? null : minLevel, maxLevel: placeholder ? null : maxLevel, scales: value?.isScalingWithPlayer === true, npcType: typeof type?.name === "string" ? type.name : null };
}

// For these NPC_TYPE values, InitNPCLevel replaces the level with the class progression in the player's save when the
// save tracks the adventurer class. That level is player state.
const SAVED_LEVEL_TYPES: ReadonlySet<string> = new Set(["COMPANION", "ADVENTURER"]);

/**
 * The level that InitNPCLevel gives a creature from one NPCSpawner. `spawner` is the spawner's source detail and
 * `sceneZone` is the range of the scene that holds it. A spawner that overrides levels either scales with the player
 * or rolls its own range. Otherwise the creature's record decides in the same way. Both scale into the spawner's zone
 * range when the spawner overrides zone scaling, and into the scene's range otherwise.
 */
export function spawnerLevel(spawner: JsonRecord, npc: NpcLevelRecord, sceneZone: ZoneRange | null): PublicLevel | undefined {
  if (npc.npcType !== null && SAVED_LEVEL_TYPES.has(npc.npcType)) return undefined;
  const overrides = record(spawner.overrides);
  if (!overrides) return undefined;
  const levels = record(overrides.levels), scaling = record(overrides.zoneScaling);
  const zone = scaling?.enabled === true ? zoneRange(scaling.minLevel, scaling.maxLevel) : sceneZone;
  if (levels?.enabled === true) {
    if (overrides.scaleWithPlayer === true) return scaledLevel(zone);
    const min = integer(levels.minLevel), max = integer(levels.maxLevel);
    return min === null || max === null ? undefined : rolledLevel(min, max);
  }
  if (npc.scales) return scaledLevel(zone);
  return npc.minLevel === null || npc.maxLevel === null ? undefined : rolledLevel(npc.minLevel, npc.maxLevel);
}

/** A fixed authored level range, such as a region's, when both ends are valid levels. */
export function authoredLevel(min: unknown, max: unknown): PublicLevel | undefined {
  const low = integer(min), high = integer(max);
  return low !== null && high !== null && low >= 1 && high >= low ? { min: low, max: high, scales: false } : undefined;
}

/** The smallest level that covers every given level. It scales when one of them scales. */
export function levelUnion(levels: readonly PublicLevel[]): PublicLevel | undefined {
  if (levels.length === 0) return undefined;
  const open = levels.some((level) => level.max === undefined);
  const min = Math.min(...levels.map((level) => level.min));
  return { min, ...(open ? {} : { max: Math.max(...levels.map((level) => level.max!)) }), scales: levels.some((level) => level.scales) };
}

/** A level as text: "15", "15–30", or "15+" when no maximum applies. */
export function levelText(level: PublicLevel): string {
  if (level.max === undefined) return `${level.min}+`;
  return level.min === level.max ? String(level.min) : `${level.min}–${level.max}`;
}

export function chancePercent(probability: number): number {
  return Math.round(probability * 1000) / 10;
}

/**
 * The probability that RandomActivator.Start enables at least one of `count` entries of `choice`: it enables
 * `choice.enabled` distinct entries of its list, uniformly.
 */
export function enabledChance(choice: CatalogRandomChoice, count = choice.entryIndexes.length): number {
  let excluded = 1;
  for (let index = 0; index < choice.enabled; index++) excluded *= (choice.entries - count - index) / (choice.entries - index);
  return 1 - excluded;
}

/** The probability that every one of `choices` keeps the placement active. */
export function choicesChance(choices: readonly CatalogRandomChoice[]): number {
  return choices.reduce((product, choice) => product * enabledChance(choice), 1);
}

/**
 * The chance that every enclosing choice keeps the placement active. When the innermost choice enables one entry, the
 * placement is one of the choice's options, and `options` counts the distinct targets that it picks from.
 */
export function placementAlternative(placementId: string, choices: readonly CatalogRandomChoice[]): PublicAlternative | null {
  const inner = choices.at(-1);
  if (!inner) return null;
  const chance = choicesChance(choices);
  if (chance <= 0) throw new Error(`No random choice can enable placement ${placementId}.`);
  return { chance: chancePercent(chance), options: inner.enabled === 1 ? inner.options : 1 };
}
