import { expect, test } from 'bun:test';
import { dropGroupText, dropRateLabel, dropRateText, dropsPerKillText, itemDropText, killExperienceText } from './format';

test('kill experience adds the level bonus at the lowest and highest level of the creature', () => {
  expect(killExperienceText({ min: 70, max: 119, perLevel: 1 }, { min: 23, max: 23, scales: false })).toBe('93–142');
  expect(killExperienceText({ min: 1, max: 1, perLevel: 1 }, { min: 15, max: 30, scales: true })).toBe('16–31');
  expect(killExperienceText({ min: 5, max: 7, perLevel: 2 }, { min: 1, scales: true })).toBe('7+');
});

test('kill experience without a level names the bonus, and a creature without a bonus shows its roll', () => {
  expect(killExperienceText({ min: 70, max: 119, perLevel: 1 }, undefined)).toBe('70–119, plus 1 per level');
  expect(killExperienceText({ min: 7, max: 7, perLevel: 0 }, { min: 9, max: 9, scales: false })).toBe('7');
});

test('loot list roll and item entry rates remain separate for one or several items', () => {
  const roll = { tableChance: 5, tableMinimum: 1, tableLimit: 2 };
  expect(dropGroupText(roll, 16)).toBe('Each kill has a 5% chance to drop 1 or 2 of these 16 items. Higher listed rates are picked more often.');
  expect(itemDropText(roll)).toBe('Each kill has a 5% chance to drop 1 or 2 items from the loot list that includes this item. Higher listed rates are picked more often.');
  expect(dropGroupText({ tableChance: 5, tableMinimum: 1, tableLimit: 1 }, 1)).toBe('Each kill has a 5% chance to drop this item.');
  expect(dropGroupText({ tableChance: 100, tableMinimum: 2, tableLimit: 2 }, 2)).toBe('Each kill can drop all 2 items.');
  expect(dropGroupText({ tableChance: 100, tableMinimum: 2, tableLimit: 2 }, 4)).toBe('Each kill can drop 2 of these 4 items. Higher listed rates are picked more often.');
  expect(dropsPerKillText({ tableChance: 100, tableMinimum: 2, tableLimit: 2 })).toBe('Each kill can drop 2 items from this loot list.');
});

test('an authored entry rate never appears as a probability per kill', () => {
  expect(dropRateLabel({})).toBe('Listed Rate');
  expect(dropRateText({ chance: 3 })).toBe('3%');
  expect(dropRateLabel({ killChance: 25 })).toBe('Chance per Kill');
  expect(dropRateText({ chance: 3, killChance: 25 })).toBe('25% (about 1 in 4 kills)');
  expect(dropGroupText({ tableChance: 5, tableMinimum: 1, tableLimit: 2 }, 16, false)).toBe('Each kill has a 5% chance to drop 1 or 2 of these 16 items.');
  expect(itemDropText({ tableChance: 5, tableMinimum: 1, tableLimit: 2, killChance: 25 })).toBe('Each kill has a 5% chance to drop 1 or 2 items from the loot list that includes this item.');
  expect(dropRateText({ chance: 3, killChance: 100 })).toBe('100% (every kill)');
  expect(dropRateText({ chance: 3, killChance: 0 })).toBe('0% (no kills)');
});
