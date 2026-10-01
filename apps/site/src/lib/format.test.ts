import { expect, test } from 'bun:test';
import { killExperienceText } from './format';

test('kill experience adds the level bonus at the lowest and highest level of the creature', () => {
  expect(killExperienceText({ min: 70, max: 119, perLevel: 1 }, { min: 23, max: 23, scales: false })).toBe('93–142');
  expect(killExperienceText({ min: 1, max: 1, perLevel: 1 }, { min: 15, max: 30, scales: true })).toBe('16–31');
  expect(killExperienceText({ min: 5, max: 7, perLevel: 2 }, { min: 1, scales: true })).toBe('7+');
});

test('kill experience without a level names the bonus, and a creature without a bonus shows its roll', () => {
  expect(killExperienceText({ min: 70, max: 119, perLevel: 1 }, undefined)).toBe('70–119, plus 1 per level');
  expect(killExperienceText({ min: 7, max: 7, perLevel: 0 }, { min: 9, max: 9, scales: false })).toBe('7');
});
