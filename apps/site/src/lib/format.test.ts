import { expect, test } from 'bun:test';
import { dropGroupText, dropRateText, dropsPerKillText, eventChanceText, itemDropText, killExperienceText, roleLabel, searchPlaceholder, sourceKindLabel, worldLootRollText } from './format';

test('search placeholder and category values use sentence case', () => {
  expect(searchPlaceholder(['Items', 'NPCs', 'Quests', 'Abilities'])).toBe('Search items, NPCs, quests, and more');
  expect(roleLabel('questGiver')).toBe('Quest giver');
  expect(roleLabel('flightPoint')).toBe('Flight master');
  expect(sourceKindLabel('startingGear')).toBe('Starting gear');
});

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
  expect(dropGroupText(roll, 16)).toBe('Each kill has a 5% chance to drop 1 or 2 of these 16 items. Items roll in order before a minimum fills missing drops.');
  expect(itemDropText(roll)).toBe('Each kill has a 5% chance to drop 1 or 2 items from the loot list that includes this item. A minimum may add items after their ordinary rolls.');
  expect(dropGroupText({ tableChance: 5, tableMinimum: 1, tableLimit: 1 }, 1)).toBe('Each kill has a 5% chance to drop this item.');
  expect(dropGroupText({ tableChance: 100, tableMinimum: 2, tableLimit: 2 }, 2)).toBe('Each kill can drop all 2 items.');
  expect(dropGroupText({ tableChance: 100, tableMinimum: 2, tableLimit: 2 }, 4)).toBe('Each kill can drop 2 of these 4 items. Items roll in order before a minimum fills missing drops.');
  expect(dropsPerKillText({ tableChance: 100, tableMinimum: 2, tableLimit: 2 })).toBe('Each kill can drop 2 items from this loot list.');
  expect(worldLootRollText({ tableChance: 5, tableMinimum: 1, tableLimit: 2 })).toBe('The World Loot list rolls on 5% of eligible kills and gives 1 or 2 items.');
});

test('an authored entry rate never appears as a probability per kill', () => {
  expect(dropRateText({ chance: 3 })).toBe('3%');
  expect(dropRateText({ chance: 3, killChance: 25 })).toBe('25%');
  expect(dropGroupText({ tableChance: 5, tableMinimum: 1, tableLimit: 2 }, 16, false)).toBe('Each kill has a 5% chance to drop 1 or 2 of these 16 items.');
  expect(itemDropText({ tableChance: 5, tableMinimum: 1, tableLimit: 2, killChance: 25 })).toBe('Each kill has a 5% chance to drop 1 or 2 items from the loot list that includes this item.');
  expect(dropRateText({ chance: 3, killChance: 100 })).toBe('100%');
  expect(dropRateText({ chance: 3, killChance: 0 })).toBe('0%');
  expect(dropRateText({ chance: 3, killChance: 0.12190897392406667 })).toBe('About 1 in 820 kills');
  expect(eventChanceText(2.45921323925406, 'open')).toBe('2.46%');
});
