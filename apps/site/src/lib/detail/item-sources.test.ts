import { expect, test } from 'bun:test';
import type { DropRow, EntityRef, PublicItem, VendorRow } from '@afallon/contracts/public';
import { itemSourceLines, summaryText } from './item-sources';

const npc = (id: number, name: string): EntityRef => ({ key: `npcs:${id}`, kind: 'npcs', name, slug: name.toLowerCase().replaceAll(' ', '-') });
const gold: EntityRef = { key: 'currencies:0', kind: 'currencies', name: 'Gold Coin' };
const drop = (counterpart: DropRow['counterpart'], chance: number, extra: Partial<DropRow> = {}): DropRow => ({ counterpart, chance, requirements: [], ...extra });
const sale = (counterpart: EntityRef, amount: number): VendorRow => ({ counterpart, price: { amount, currency: gold }, requirements: [] });

function item(droppedBy: DropRow[], soldBy: VendorRow[]): PublicItem {
  return {
    ref: { key: 'items:1', kind: 'items', name: 'Iron Bar', slug: 'iron-bar' }, description: null, art: {},
    facts: { stats: [], randomStats: [], randomStatsMax: 0, sockets: [], stackLimit: 20, questDropOnly: false, corruptionToken: false, actionAbilities: [], useLines: [], equipmentRequirements: [], useConditions: [] },
    droppedBy, soldBy, gatheredFrom: [], inContainers: [], collectedFrom: [], rewardedBy: [], givenBy: [], craftedBy: [], usedInRecipes: [], usedInQuests: [],
  };
}

test('source lines name distinct counterparts in the order of their sections and give world loot its own line', () => {
  const thornmaw = npc(1, 'Thornmaw'), wraith = npc(2, 'Frost Wraith'), boar = npc(3, 'Boar');
  const lines = itemSourceLines(item([
    drop(boar, 5), drop(thornmaw, 15), drop(thornmaw, 10), drop(wraith, 12),
    drop({ key: null, label: 'Any creature' }, 3, { creatureLevel: { min: 18, max: 26 } }),
  ], [sale(npc(4, 'Wizard Merchant'), 55), sale(npc(5, 'General Goods'), 50)]));
  expect(lines.map((entry) => [entry.label, summaryText(entry)])).toEqual([
    ['Dropped by', 'Thornmaw, Frost Wraith and 1 more'],
    ['World loot', 'Creatures of level 18–26'],
    ['Sold by', 'General Goods and Wizard Merchant'],
  ]);
  expect(lines[2]!.lowestPrice?.amount).toBe(50);
});
