import type { CatalogClothDrops } from "@afallon/contracts/catalog";
import type { ClothDrop, ClothLoot } from "@afallon/contracts/public";
import { levelChanceRuns } from "../levels";
import { plainText } from "../text";
import type { DocumentProjectionInput } from "./projection";

// Chances closer than this many percentage points are one chance at the two ends of a range.
const SAME_CHANCE = 1e-9;

// A cloth tier's weight at a creature level, as ClothDrops.Roll computes it: the teaser weight below the start level,
// then an even move from the low weight at the start level to the high weight at the ramp end.
function clothWeight(tier: CatalogClothDrops["tiers"][number], level: number): number {
  if (level < tier.startLevel) return tier.teaserWeight;
  const progress = Math.min(1, Math.max(0, (level - tier.startLevel) / Math.max(tier.rampEnd - tier.startLevel, 1)));
  return tier.lowWeight + (tier.highWeight - tier.lowWeight) * progress;
}

/** The chance that one kill at `level` gives this cloth: the cloth roll's chance times the cloth's share of the weights. */
function clothChance(cloth: CatalogClothDrops, itemKey: string, level: number): number {
  let total = 0, own = 0;
  for (const tier of cloth.tiers) {
    const weight = clothWeight(tier, level);
    total += weight;
    if (tier.item.entityKey === itemKey) own += weight;
  }
  return total > 0 ? cloth.dropChance * own / total : 0;
}

// The levels from which a tier's weight starts or stops changing. Between two of them every weight changes evenly, and
// from the last one on no weight changes.
function clothBreaks(cloth: CatalogClothDrops): number[] {
  return [...new Set([1, ...cloth.tiers.flatMap((tier) => [Math.ceil(tier.startLevel), Math.ceil(tier.rampEnd)])])]
    .filter((level) => level >= 1).sort((a, b) => a - b);
}

/**
 * The cloth drops that give this item, with the chance per kill over each range of creature levels between two levels
 * where a tier's weight starts or stops a change. Inside a range every weight is linear in the level, so the chance moves
 * one way from its first to its last level. No weight changes from the last such level on, so the last range is open.
 */
export function projectClothDrop(itemKey: string, input: DocumentProjectionInput): ClothDrop | undefined {
  const cloth = input.facts.clothDrops;
  if (!cloth?.tiers.some((tier) => tier.item.entityKey === itemKey)) return undefined;
  const starts = clothBreaks(cloth);
  const levels = starts.map((minLevel, index): ClothDrop["levels"][number] => {
    const next = starts[index + 1], startChance = clothChance(cloth, itemKey, minLevel);
    if (next === undefined) return { minLevel, startChance };
    const maxLevel = next - 1, endChance = clothChance(cloth, itemKey, maxLevel);
    return { minLevel, maxLevel, startChance, ...(Math.abs(endChance - startChance) <= SAME_CHANCE ? {} : { endChance }) };
  });
  return { creatureTypes: cloth.creatureTypes.map((type) => plainText(type)), chance: cloth.dropChance, min: cloth.minCount, max: cloth.maxCount, levels };
}

/** What the cloth roll of a kill gives at each creature level, for the Loot guide and the creature pages that read it. */
export function projectClothLoot(input: DocumentProjectionInput): ClothLoot | undefined {
  const cloth = input.facts.clothDrops;
  if (!cloth?.tiers.length) return undefined;
  const top = clothBreaks(cloth).at(-1)! + 1;
  const items = [...new Map(cloth.tiers.flatMap((tier) => tier.item.entityKey ? [[tier.item.entityKey, tier.item] as const] : [])).values()];
  if (!items.length) return undefined;
  return {
    creatureTypes: cloth.creatureTypes.map((type) => plainText(type)), chance: cloth.dropChance, min: cloth.minCount, max: cloth.maxCount,
    items: items.map((item) => ({ item: input.resolve(item),
      levels: levelChanceRuns(Array.from({ length: top }, (_, index) => clothChance(cloth, item.entityKey!, index + 1))) })),
  };
}

/** Whether the cloth roll can give a kill of a creature of this type. */
export function dropsCloth(input: DocumentProjectionInput, creatureType: string | null): boolean {
  const cloth = input.facts.clothDrops;
  return Boolean(cloth?.tiers.length && creatureType !== null && cloth.creatureTypes.includes(creatureType));
}
