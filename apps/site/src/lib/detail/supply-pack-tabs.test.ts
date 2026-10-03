import { expect, test } from 'bun:test';
import type { ItemUsePack } from '@afallon/contracts/public';
import { packClasses } from './supply-pack-tabs';

const pack = (classes: string[], minLevel?: number, maxLevel?: number): ItemUsePack => ({
  classes: classes.map((name, index) => ({ key: `classes:${index}`, kind: 'classes', name })), ...(minLevel === undefined ? {} : { minLevel }),
  ...(maxLevel === undefined ? {} : { maxLevel }), entries: [], bonusChance: 0, worldShare: 0, minimumPicks: 1, stats: [], worldLoot: [],
});

test('a table that names several classes appears under each class, and each class runs from its lowest band up', () => {
  const classes = packClasses([pack(['Wizard'], 6, 11), pack(['Wizard', 'Druid'], 1, 5), pack(['Druid'], 25)]);
  expect(classes.map((entry) => [entry.label, entry.bands.map((band) => [band.pack.minLevel, band.pack.maxLevel])])).toEqual([
    ['Wizard', [[1, 5], [6, 11]]],
    ['Druid', [[1, 5], [25, undefined]]],
  ]);
});

test('each class of a shared band sees its own world loot', () => {
  const ref = (key: string, name: string) => ({ key, kind: 'items' as const, name });
  const shared: ItemUsePack = { ...pack(['Wizard', 'Druid'], 1, 5), worldShare: 50, worldLoot: [
    { class: { key: 'classes:0', kind: 'classes', name: 'Wizard' }, items: [{ item: ref('items:1', 'Oak Staff'), levels: [{ min: 1, max: 5 }] }] },
    { class: { key: 'classes:1', kind: 'classes', name: 'Druid' }, items: [{ item: ref('items:2', 'Verdant Edge'), levels: [{ min: 3, max: 5 }] }] },
  ] };
  const loot = packClasses([shared]).map((entry) => [entry.label, entry.bands[0]!.worldLoot.map((row) => row.item.key)]);
  expect(loot).toEqual([['Wizard', ['items:1']], ['Druid', ['items:2']]]);
});
