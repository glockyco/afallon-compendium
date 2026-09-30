import { expect, test } from 'bun:test';
import type { DropRow, EntityRef, PublicItem, PublicKindEntry, VendorRow } from '@afallon/contracts/public';
import { itemSourceLines, lineHref, summaryText } from './item-sources';

const npc = (id: number, name: string): EntityRef => ({ key: `npcs:${id}`, kind: 'npcs', name, slug: name.toLowerCase().replaceAll(' ', '-') });
const gold: EntityRef = { key: 'currencies:0', kind: 'currencies', name: 'Gold Coin' };
const drop = (counterpart: DropRow['counterpart'], chance: number, extra: Partial<DropRow> = {}): DropRow => ({ counterpart, chance, requirements: [], ...extra });
const sale = (counterpart: EntityRef, amount: number): VendorRow => ({ counterpart, price: { amount, currency: gold }, requirements: [] });

function item(droppedBy: DropRow[], soldBy: VendorRow[], startingGearOf: PublicItem['startingGearOf'] = []): PublicItem {
  return {
    ref: { key: 'items:1', kind: 'items', name: 'Iron Bar', slug: 'iron-bar' }, description: null, art: {},
    facts: { stats: [], randomStats: [], randomStatsMax: 0, sockets: [], stackLimit: 20, questDropOnly: false, corruptionToken: false, actionAbilities: [], useLines: [], equipmentRequirements: [], useConditions: [] },
    droppedBy, soldBy, gatheredFrom: [], inContainers: [], collectedFrom: [], rewardedBy: [], givenBy: [], usedInRecipes: [], usedInQuests: [], startingGearOf, placedRules: [],
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

test('a starting gear line names the classes and leads to the Starting gear section of the first class page', () => {
  const heroClass = (id: number, name: string): EntityRef => ({ key: `classes:${id}`, kind: 'classes', name, slug: name.toLowerCase() });
  const registry = [{ kind: 'classes', route: 'classes' }] as PublicKindEntry[];
  const lines = itemSourceLines(item([], [], [heroClass(1, 'Wizard'), heroClass(3, 'Necromancer'), heroClass(6, 'Druid')].map((ref) => ({ class: ref }))));
  expect(lines.map((entry) => [entry.label, summaryText(entry)])).toEqual([['Starting gear of', 'Wizard, Necromancer and 1 more']]);
  expect(lines[0]!.names).toEqual([{ ref: { ...heroClass(1, 'Wizard'), variant: 'starting-gear' } }, { ref: { ...heroClass(3, 'Necromancer'), variant: 'starting-gear' } }]);
  expect(lineHref(lines[0]!, registry, '/base')).toBe('/base/classes/wizard/#starting-gear');
  expect(lineHref(itemSourceLines(item([drop(npc(1, 'Thornmaw'), 5)], []))[0]!, registry, '/base')).toBe('#dropped-by');
});

test('a crafted item names its skill and gate in the source line and links its Crafting section', () => {
  const crafted = item([], []);
  crafted.crafting = {
    recipe: { key: 'recipes:1', name: 'Iron Bar' }, skill: { key: 'skills:1', kind: 'skills', name: 'Smithing', slug: 'smithing' },
    learnedByDefault: true, materials: [], ranks: [{ rank: 1, requiredLevel: 150, baseExperience: 42, bands: [] }], taughtBy: [],
  };
  const lines = itemSourceLines(crafted);
  expect(lines.map((entry) => [entry.label, summaryText(entry)])).toEqual([['Crafted', 'Smithing level 150']]);
  expect(lineHref(lines[0]!, [], '')).toBe('#crafting');
});
