import type { CatalogCorruptionFacts, CatalogEndpoint, CatalogFacts } from "@afallon/contracts/catalog";
import { isEntityRef, type DungeonReward, type CorruptionGuide, type EntityRef } from "@afallon/contracts/public";
import type { ReferenceResolver } from "./documents";

export interface RewardEntry { lootTableId: number; itemKey: string }
export interface CorruptionRewards {
  tryIt: CorruptionGuide["tryIt"];
  byItem: ReadonlyMap<string, DungeonReward[]>;
}
export function isCorruptibleEquipment(item: CatalogFacts["items"][number] | undefined): boolean {
  return !!item && !item.corruptionToken &&
    (item.itemType === "ARMOR" || item.itemType === "WEAPON" || (item.itemType === "Trinket" && item.armorSlot === "Trinket"));
}

/** Match authored timed-dungeon tables to actual equipment entries and the dungeon bosses bound to each table. */
export function corruptionRewards(settings: CatalogCorruptionFacts, facts: CatalogFacts,
  entries: readonly RewardEntry[], bossDropTables: ReadonlyMap<string, ReadonlySet<number>>,
  published: ReadonlySet<string>, resolve: ReferenceResolver): CorruptionRewards {
  const byItem = new Map<string, DungeonReward[]>();
  const items = new Map(facts.items.map((item) => [item.entityKey, item]));
  const rewardTables = new Set(settings.dungeons.flatMap((dungeon) => dungeon.lootTables?.map((table) => Number(table.entityKey?.split(":")[1])) ?? []));
  const entriesByTable = new Map<number, Set<string>>();
  for (const entry of entries) {
    if (!rewardTables.has(entry.lootTableId)) continue;
    const keys = entriesByTable.get(entry.lootTableId) ?? new Set<string>();
    keys.add(entry.itemKey);
    entriesByTable.set(entry.lootTableId, keys);
  }
  const reference = (endpoint: CatalogEndpoint): EntityRef | undefined => {
    if (!endpoint.entityKey || !published.has(endpoint.entityKey)) return undefined;
    const ref = resolve(endpoint);
    return isEntityRef(ref) && ref.slug ? ref : undefined;
  };
  const groups: CorruptionGuide["tryIt"]["groups"] = [];
  let defaultItem: EntityRef | undefined;
  for (const dungeon of settings.dungeons) {
    if (dungeon.lootTables === null || dungeon.bosses === null) continue;
    const place = reference(dungeon.scene);
    if (!place) throw new Error(`Corruption dungeon ${dungeon.scene.label} has no published place page.`);
    const bossRefs = dungeon.bosses.map((boss) => {
      const ref = reference(boss);
      if (!ref) throw new Error(`Corruption dungeon ${dungeon.scene.label} has an unpublished boss ${boss.label}.`);
      return ref;
    });
    if (dungeon.token?.entityKey) {
      const token = reference(dungeon.token);
      if (!token) throw new Error(`Corruption dungeon ${dungeon.scene.label} has an unpublished reward token ${dungeon.token.label}.`);
      const sources = byItem.get(token.key) ?? [];
      sources.push({ place, bosses: bossRefs, guaranteed: true });
      byItem.set(token.key, sources);
    }
    const groupItems = new Map<string, { item: EntityRef; bossKeys: Set<string> }>();
    for (const table of dungeon.lootTables) {
      const tableId = Number(table.entityKey?.split(":")[1]);
      if (!Number.isSafeInteger(tableId)) continue;
      for (const itemKey of entriesByTable.get(tableId) ?? []) {
        const itemFacts = items.get(itemKey);
        if (!isCorruptibleEquipment(itemFacts)) continue;
        let row = groupItems.get(itemKey);
        if (!row) {
          const item = reference({ entityKey: itemKey, label: itemKey });
          if (!item) continue;
          row = { item, bossKeys: new Set<string>() };
          groupItems.set(itemKey, row);
        }
        for (let index = 0; index < dungeon.bosses.length; index++) {
          const bossKey = dungeon.bosses[index]?.entityKey;
          if (bossKey && bossDropTables.get(bossKey)?.has(tableId)) row.bossKeys.add(bossKey);
        }
      }
    }
    const sorted = [...groupItems.values()].sort((a, b) => a.item.name.localeCompare(b.item.name, "en") || a.item.key.localeCompare(b.item.key));
    if (!sorted.length) continue;
    const group = { place, items: sorted.map(({ item, bossKeys }) => ({ item, bosses: bossRefs.filter((boss) => bossKeys.has(boss.key)) })) };
    groups.push(group);
    for (const { item, bosses } of group.items) {
      const sources = byItem.get(item.key) ?? [];
      sources.push({ place, bosses, guaranteed: false });
      byItem.set(item.key, sources);
    }
    defaultItem ??= group.items.find(({ item }) => items.get(item.key)?.itemType === "WEAPON")?.item;
  }
  if (!defaultItem) throw new Error("Corruption reward tables have no published weapon for the guide picker.");
  return { byItem, tryIt: { groups, defaultItem } };
}
