import { expect, test } from 'bun:test';
import { columnShape, columnWidths } from './list-layout';

test('spare width goes to the last column that is not a number, so numbers sit at the right edge', () => {
  // Name, a type label, item power, and level, in a table wider than they need.
  expect(columnWidths([{ shape: 'name', natural: 200 }, { shape: 'label', natural: 120 }, { shape: 'number', natural: 90 }, { shape: 'number', natural: 60 }], 800)).toEqual([200, 450, 90, 60]);
});

test('a text in the last non-numeric column shows in full when the table has room, beyond its cap', () => {
  // An ability source longer than the text cap, in a wide table.
  expect(columnWidths([{ shape: 'name', natural: 200 }, { shape: 'text', natural: 400 }], 800)).toEqual([200, 600]);
});

test('a long name is cut at its cap instead of widening its column', () => {
  expect(columnWidths([{ shape: 'name', natural: 900 }, { shape: 'label', natural: 100 }, { shape: 'number', natural: 60 }], 1200)).toEqual([22 * 16, 1200 - 22 * 16 - 60, 60]);
});

test('names and texts shrink toward their floors when the columns do not fit, and labels and numbers keep their width', () => {
  const widths = columnWidths([{ shape: 'name', natural: 300 }, { shape: 'text', natural: 200 }, { shape: 'label', natural: 80 }, { shape: 'number', natural: 70 }], 550);
  expect(widths[2]).toBe(80);
  expect(widths[3]).toBe(70);
  expect(widths[0]! + widths[1]!).toBeLessThanOrEqual(400);
  expect(widths[0]!).toBeGreaterThanOrEqual(9 * 16);
  expect(widths[1]!).toBeGreaterThanOrEqual(6 * 16);
});

test('labels shrink only after names and texts reach their floors', () => {
  // A name at its floor already, a long gear label, and stat numbers: only the label can give width.
  const widths = columnWidths([{ shape: 'name', natural: 144 }, { shape: 'label', natural: 152 }, { shape: 'number', natural: 500 }], 760);
  expect(widths).toEqual([144, 116, 500]);
  // With room in the name, the label keeps its width.
  expect(columnWidths([{ shape: 'name', natural: 250 }, { shape: 'label', natural: 152 }, { shape: 'number', natural: 500 }], 850)[1]).toBe(152);
});

test('badges and numbers never shrink', () => {
  expect(columnWidths([{ shape: 'name', natural: 144 }, { shape: 'badges', natural: 200 }, { shape: 'number', natural: 100 }], 300)).toEqual([144, 200, 100]);
});

test('when even the floors do not fit, every column keeps its floor and the table scrolls', () => {
  expect(columnWidths([{ shape: 'name', natural: 300 }, { shape: 'label', natural: 200 }, { shape: 'number', natural: 100 }], 300)).toEqual([144, 80, 100]);
});

test('other things\' names are texts, roles are badges, numeric columns are numbers, and everything else is a label', () => {
  expect([columnShape('name', false), columnShape('giver', false), columnShape('itemPower', true), columnShape('type', false), columnShape('role', false)]).toEqual(['name', 'text', 'number', 'label', 'badges']);
});
