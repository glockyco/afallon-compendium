import { expect, test } from 'bun:test';
import type { ItemUsePack } from '@afallon/contracts/public';
import { packClasses } from './supply-pack-tabs';

const pack = (classes: string[], minLevel?: number, maxLevel?: number): ItemUsePack => ({
  classes: classes.map((name, index) => ({ key: `classes:${index}`, kind: 'classes', name })), ...(minLevel === undefined ? {} : { minLevel }),
  ...(maxLevel === undefined ? {} : { maxLevel }), entries: [], bonusChance: 0, worldShare: 0, minimumPicks: 1, stats: [],
});

test('a table that names several classes appears under each class, and each class runs from its lowest band up', () => {
  const classes = packClasses([pack(['Wizard'], 6, 11), pack(['Wizard', 'Druid'], 1, 5), pack(['Druid'], 25)]);
  expect(classes.map((entry) => [entry.label, entry.bands.map((band) => [band.key, band.label])])).toEqual([
    ['Wizard', [['levels-1-5', 'Levels 1–5'], ['levels-6-11', 'Levels 6–11']]],
    ['Druid', [['levels-1-5', 'Levels 1–5'], ['levels-25-and-higher', 'Levels 25 and higher']]],
  ]);
  expect(packClasses([pack([])]).map((entry) => [entry.label, entry.bands.map((band) => band.label)])).toEqual([['All classes', ['All levels']]]);
});
