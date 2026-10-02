import type { Attunement, SpawnerOption } from '@afallon/contracts/public';

/** The key that marks an attunement as active: its item, or its effect when the item has no page. */
export const attunementKey = (attunement: Attunement): string => attunement.item.key ?? attunement.effect;

/** Each option's bonus from the active attunements: the sum of the bonuses of every active attunement for its node. */
export function attunementBoosts(options: readonly SpawnerOption[], attunements: readonly Attunement[], active: readonly string[]): number[] {
  const on = attunements.filter((attunement) => active.includes(attunementKey(attunement)));
  return options.map((option) => on.reduce((sum, attunement) => sum + (attunement.nodes.some((node) => node.key !== null && node.key === option.node.key) ? attunement.boost : 0), 0));
}

/** The attunements that favour a node among these options. */
export const relevantAttunements = (options: readonly SpawnerOption[], attunements: readonly Attunement[]): Attunement[] =>
  attunements.filter((attunement) => attunement.nodes.some((node) => node.key !== null && options.some((option) => option.node.key === node.key)));

/**
 * A chance that grows evenly with the skill level, at a level between the published levels. A level outside them takes
 * the nearest published chance.
 */
export function interpolateChance(points: readonly { level: number; chance: number }[], level: number): number | undefined {
  if (points.length === 0) return undefined;
  const sorted = [...points].sort((left, right) => left.level - right.level);
  if (level <= sorted[0]!.level) return sorted[0]!.chance;
  for (let index = 1; index < sorted.length; index += 1) {
    const low = sorted[index - 1]!, high = sorted[index]!;
    if (level <= high.level) return low.chance + (high.chance - low.chance) * (level - low.level) / (high.level - low.level);
  }
  return sorted.at(-1)!.chance;
}
