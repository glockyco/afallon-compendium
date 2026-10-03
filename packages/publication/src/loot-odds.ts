export interface LootOddsTable {
  mode: "npc" | "world" | "object";
  gateRate: number;
  minimum: number;
  limit?: number;
  entries: readonly { itemKey: string; rate: number; eligible?: boolean }[];
}

type Entry = { itemKey: string; rate: number; eligible?: boolean };
type Counts = { total: Float64Array; withoutItem: Float64Array };

const clamp = (value: number) => Math.max(0, Math.min(1, value));

// Only minimums 0, 1 and 2 are supported exactly. The two-pick case needs
// single-success identities, but never an exponential set of selected rows.
function tableCounts(entries: readonly Entry[], itemKey: string, minimum: number, capacity: number, divisor: number): Counts {
  const total = new Float64Array(capacity + 1);
  const withoutItem = new Float64Array(capacity + 1);
  total[0] = withoutItem[0] = 1;
  if (capacity === 0 || entries.length === 0) return { total, withoutItem };

  let weightSum = 0;
  let itemWeight = 0;
  for (const entry of entries) {
    const weight = Math.max(0.01, entry.rate);
    weightSum += weight;
    if (entry.itemKey === itemKey) itemWeight += weight;
  }

  for (const entry of entries) {
    const chance = clamp(Math.max(0, entry.rate) / divisor);
    for (let count = capacity - 1; count >= 0; count--) {
      const ordinary = total[count]! * chance;
      total[count] = total[count]! - ordinary;
      total[count + 1] = total[count + 1]! + ordinary;
      const remaining = withoutItem[count]! * chance;
      withoutItem[count] = withoutItem[count]! - remaining;
      if (entry.itemKey !== itemKey) withoutItem[count + 1] = withoutItem[count + 1]! + remaining;
    }
  }

  if (minimum === 0) return { total, withoutItem };
  const pickedFromZero = Math.min(minimum, capacity, entries.length);
  if (pickedFromZero === 1) {
    total[1] = total[1]! + total[0]!;
    withoutItem[1] = withoutItem[1]! + withoutItem[0]! * (1 - itemWeight / weightSum);
  } else {
    // Probability of two non-target weighted picks without replacement.
    let withoutItemPick = itemWeight === 0 ? 1 : 0;
    if (itemWeight > 0) {
      for (const entry of entries) {
        if (entry.itemKey === itemKey) continue;
        const weight = Math.max(0.01, entry.rate);
        withoutItemPick += (weight / weightSum) * (1 - (itemWeight / (weightSum - weight)));
      }
    }
    total[2] = total[2]! + total[0]!;
    withoutItem[2] = withoutItem[2]! + withoutItem[0]! * withoutItemPick;
  }
  total[0] = withoutItem[0] = 0;

  if (minimum === 2 && capacity >= 2 && entries.length >= 2) {
    // Exactly one ordinary success means every other eligible row failed.
    // Track that row only when the target competes for the second pick.
    let noTargetAfterPick = withoutItem[1]!;
    if (itemWeight > 0 && withoutItem[1]! > 0) {
      const suffixFailures = new Float64Array(entries.length + 1);
      suffixFailures[entries.length] = 1;
      for (let index = entries.length - 1; index >= 0; index--) {
        suffixFailures[index] = suffixFailures[index + 1]! * (1 - clamp(Math.max(0, entries[index]!.rate) / divisor));
      }
      let prefixFailures = 1;
      noTargetAfterPick = 0;
      for (let index = 0; index < entries.length; index++) {
        const entry = entries[index]!;
        const chance = clamp(Math.max(0, entry.rate) / divisor);
        if (entry.itemKey !== itemKey) {
          const weight = Math.max(0.01, entry.rate);
          noTargetAfterPick += prefixFailures * chance * suffixFailures[index + 1]! *
            (1 - itemWeight / (weightSum - weight));
        }
        prefixFailures *= 1 - chance;
      }
    }
    total[2] = total[2]! + total[1]!;
    withoutItem[2] = withoutItem[2]! + noTargetAfterPick;
    total[1] = withoutItem[1] = 0;
  }
  return { total, withoutItem };
}

/** Probability of obtaining at least one matching item at neutral world/Heroic multipliers.
 * Caller supplies eligible rows and, for world tables, the catalog's shared world limit.
 * NPC and world probabilities are conditional on an eligible rewarded kill; object
 * probabilities are per qualifying interaction. Minimums above two are unsupported.
 */
export function lootItemProbability(
  tables: readonly LootOddsTable[], itemKey: string,
  options: { worldLimit?: number; lootChance?: number } = {},
): number {
  const hasWorld = tables.some((table) => table.mode === "world");
  if (hasWorld && (options.worldLimit === undefined || !Number.isSafeInteger(options.worldLimit) || options.worldLimit < 0)) {
    throw new RangeError("World loot requires the recorded nonnegative worldLimit");
  }
  for (const table of tables) {
    if (!Number.isInteger(table.minimum) || table.minimum < 0 || table.minimum > 2) {
      throw new RangeError("Exact loot odds support table minimums from 0 to 2");
    }
  }
  // [probability without target, probability with target], indexed by occupied world slots.
  let states = new Map<number, [number, number]>([[0, [1, 0]]]);
  for (const table of tables) {
    const gate = clamp(table.mode === "npc" ? (Math.floor(table.gateRate) + 1) / 100 : table.gateRate / 100);
    if (gate === 0) continue;
    const entries = table.entries.every((entry) => entry.eligible !== false)
      ? table.entries : table.entries.filter((entry) => entry.eligible !== false);
    const countsByCapacity = new Map<number, Counts>();
    const next = new Map<number, [number, number]>();
    const divisor = table.mode === "object" ? 100 : 100 + Math.max(0, options.lootChance ?? 0);
    for (const [occupied, [notFound, found]] of states) {
      const carry = next.get(occupied) ?? [0, 0];
      carry[0] += notFound * (1 - gate);
      carry[1] += found * (1 - gate);
      next.set(occupied, carry);
      const available = table.mode === "world" ? options.worldLimit! - occupied : entries.length;
      const capacity = Math.max(0, Math.min(entries.length, table.limit ?? entries.length, available));
      let counts = countsByCapacity.get(capacity);
      if (!counts) {
        counts = tableCounts(entries, itemKey, table.minimum, capacity, divisor);
        countsByCapacity.set(capacity, counts);
      }
      for (let selected = 0; selected <= capacity; selected++) {
        const destination = table.mode === "world" ? occupied + selected : occupied;
        const row = next.get(destination) ?? [0, 0];
        row[0] += notFound * gate * counts.withoutItem[selected]!;
        row[1] += gate * (found * counts.total[selected]! + notFound * (counts.total[selected]! - counts.withoutItem[selected]!));
        next.set(destination, row);
      }
    }
    states = next;
  }
  let probability = 0;
  for (const [, found] of states.values()) probability += found;
  return clamp(probability);
}
