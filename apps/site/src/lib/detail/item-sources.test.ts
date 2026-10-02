import { expect, test } from 'bun:test';
import type { DropRow, EntityRef, PublicItem, PublicKindEntry, VendorRow } from '@afallon/contracts/public';
import { itemSourceLines, lineHref, summaryText } from './item-sources';

const npc = (id: number, name: string): EntityRef => ({ key: `npcs:${id}`, kind: 'npcs', name, slug: name.toLowerCase().replaceAll(' ', '-') });
const gold: EntityRef = { key: 'currencies:0', kind: 'currencies', name: 'Gold Coin' };
const drop = (counterpart: DropRow['counterpart'], chance: number, extra: Partial<DropRow> = {}): DropRow => ({ counterpart, chance, requirements: [], ...extra });
const sale = (counterpart: EntityRef, amount: number): VendorRow => ({ counterpart, price: { amount, currency: gold }, requirements: [] });

function item(droppedBy: DropRow[], soldBy: VendorRow[], startingGearOf: PublicItem['startingGearOf'] = []): PublicItem {
  return {
    ref: { key: 'items:1', kind: 'items', name: 'Iron Bar', slug: 'iron-bar' }, description: null, art: {}, sourceSpotCount: 0, sourceAvailabilities: [[]],
    facts: { stats: [], randomStats: [], randomStatsMax: 0, sockets: [], stackLimit: 20, questDropOnly: false, corruptionToken: false, actionAbilities: [], useLines: [], equipmentRequirements: [], useConditions: [] },
    droppedBy, soldBy, buys: [], gatheredFrom: [], inContainers: [], collectedFrom: [], rewardedBy: [], givenBy: [], usedInRecipes: [], usedInQuests: [], startingGearOf, fromItems: [], questPickups: [], placedRules: [], adventurers: [], whenUsed: { chests: [], packs: [], itemChanges: [] },
  };
}

test('routes keep loot probabilities separate from guarantees and lowest vendor price', () => {
  const thornmaw = npc(1, 'Thornmaw'), wraith = npc(2, 'Frost Wraith');
  const lines = itemSourceLines(item([
    drop(thornmaw, 100), drop(wraith, 12),
    drop({ key: null, label: 'Any creature' }, 3, { creatureLevel: { min: 18, max: 26 } }),
  ], [sale(npc(4, 'Wizard Merchant'), 55), sale(npc(5, 'General Goods'), 50)]));
  expect(lines.map((entry) => entry.label)).toEqual(['Loot', 'Buy']);
  expect(lines[0]?.guaranteedYield).toBeUndefined();
  expect(lines[0]?.detail).toContain('creatures of level 18–26');
  expect(lines[1]?.lowestPrice?.amount).toBe(50);
});

test('known spot count ranks distinct place spots ahead of unplaced chance routes', () => {
  const ore = item([drop(npc(1, 'Miner'), 90)], []);
  ore.gatheredFrom = [{ label: 'Iron Vein', skill: { key: 'skills:1', kind: 'skills', name: 'Mining', slug: 'mining' }, chance: 40, requirements: [], availability: [], placementCount: 2,
    places: [{ label: 'Hills', mapSpaceId: 'world', spotCount: 2, placementIds: ['a', 'b'] }] }];
  ore.inContainers = [{ label: 'Chest', chance: 100, availabilityIndex: 0, placementCount: 1,
    places: [{ label: 'Hills', mapSpaceId: 'world', spotCount: 1, placementIds: ['a'] }] }];
  expect(itemSourceLines(ore).map((entry) => [entry.label, entry.spotCount])).toEqual([['Mine', 2], ['Search', 1], ['Loot', undefined]]);
});

test('starting gear only links published classes and no source remains unknown', () => {
  const heroClass = (id: number, name: string): EntityRef => ({ key: `classes:${id}`, kind: 'classes', name, slug: name.toLowerCase() });
  const registry = [{ kind: 'classes', route: 'classes' }] as PublicKindEntry[];
  expect(itemSourceLines(item([], []))).toEqual([]);
  const lines = itemSourceLines(item([], [], [{ class: heroClass(1, 'Wizard') }, { class: { ...heroClass(2, 'Berserker'), slug: undefined } }]));
  expect(lines.map((entry) => [entry.label, summaryText(entry)])).toEqual([['Starting gear', 'Wizard']]);
  expect(lineHref(lines[0]!, registry, '/base')).toBe('/base/classes/wizard/#starting-gear');
});

test('craft output outranks chance routes and links its own section', () => {
  const crafted = item([drop(npc(1, 'Thornmaw'), 100)], []);
  crafted.crafting = { recipe: { key: 'recipes:1', name: 'Ring of Bleed Damage' }, skill: { key: 'skills:1', kind: 'skills', name: 'Smithing', slug: 'smithing' },
    learnedByDefault: false, materials: [], product: { counterpart: crafted.ref, count: 2 }, ranks: [{ rank: 1, requiredLevel: 150, highestLevel: 300, baseExperience: 42, bands: [] }], taughtBy: [] };
  const lines = itemSourceLines(crafted);
  expect(lines.map((entry) => entry.label)).toEqual(['Craft', 'Loot']);
  expect(lines[0]?.guaranteedYield).toBe(2);
  expect(lineHref(lines[0]!, [], '')).toBe('#crafting');
});

test('timed dungeon reward distinguishes a guaranteed token from chance gear', () => {
  const places = Array.from({ length: 5 }, (_, index): EntityRef => ({
    key: `scenes:${index}`, kind: 'places', name: `Dungeon ${index}`, slug: `dungeon-${index}`,
  }));
  const token = item([], []);
  token.ref = { ...token.ref, name: 'Corruption Token' };
  token.facts.dungeonRewards = places.map((place) => ({ place, bosses: [npc(1, 'Guardian')], guaranteed: true }));
  const [tokenRoute] = itemSourceLines(token);
  expect(tokenRoute?.label).toBe('Dungeon reward');
  expect(tokenRoute?.guaranteedYield).toBe(1);
  expect(summaryText(tokenRoute!)).toBe('Every timed dungeon run ends with a reward bag that holds one Corruption Token.');
  const gear = item([], []);
  gear.facts.dungeonRewards = [{ place: places[0]!, bosses: [npc(1, 'Guardian')], guaranteed: false }];
  const [gearRoute] = itemSourceLines(gear);
  expect(gearRoute?.guaranteedYield).toBeUndefined();
  expect(gearRoute?.detail).toBe('Chance from boss reward bags');
});
