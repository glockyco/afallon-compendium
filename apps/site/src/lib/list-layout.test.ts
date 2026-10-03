import { expect, test } from 'bun:test';
import { columnShape, columnWidths, visibleListColumns } from './list-layout';

test('spare width spreads evenly between neighbouring columns, after left-aligned values and before numbers', () => {
  // A name, a type label, item power, and level, in a table 330 px wider than they need: three equal parts of 110 px.
  // The name and the label show theirs after their values, and the level shows its part before its number.
  expect(columnWidths([{ shape: 'name', natural: 200 }, { shape: 'label', natural: 120 }, { shape: 'number', natural: 90 }, { shape: 'number', natural: 60 }], 800)).toEqual([310, 230, 90, 170]);
});

test('a list without numbers also leaves an equal part after its last column', () => {
  // The recipe list: recipe, station, and skill, with 300 px to spare.
  expect(columnWidths([{ shape: 'name', natural: 280 }, { shape: 'label', natural: 90 }, { shape: 'label', natural: 130 }], 800)).toEqual([380, 190, 230]);
});

test('a cut text shows in full before the rest of the spare width spreads', () => {
  // An ability source longer than the text cap, in a wide table.
  expect(columnWidths([{ shape: 'name', natural: 200 }, { shape: 'text', natural: 400 }], 800)).toEqual([300, 500]);
});

test('a long name keeps its cap and gains only its even part of the spare width', () => {
  expect(columnWidths([{ shape: 'name', natural: 900 }, { shape: 'label', natural: 100 }, { shape: 'number', natural: 60 }], 1200)).toEqual([22 * 16 + 344, 100 + 344, 60]);
});

test('a number followed by a left-aligned column gets no part between them', () => {
  // The NPC list: name, level, role badges, place, and faction, with 200 px to spare in four parts.
  expect(columnWidths([{ shape: 'name', natural: 200 }, { shape: 'number', natural: 60 }, { shape: 'badges', natural: 150 }, { shape: 'text', natural: 100 }, { shape: 'label', natural: 90 }], 800)).toEqual([250, 60, 200, 150, 140]);
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

test('matching adventurers replace empty place and faction facts with class and party role', () => {
  const columns = ['level', 'role', 'place', 'faction', 'class', 'partyRole'].map((id) => ({ id, label: id, sortable: true, numeric: id === 'level' }));
  const kind = { kind: 'npcs', columns } as Parameters<typeof visibleListColumns>[1];
  const adventurer = (name: string, role: string, className: string) => ({
    ref: { key: `npcs:${name}`, kind: 'npcs' as const, name, slug: name.toLowerCase() },
    values: { level: '7', role: `Adventurer, ${role}`, place: null, faction: null, class: className, partyRole: role },
    facets: { role: ['Adventurer', role] },
  });
  const rows = [adventurer('Eldeth', 'Tank', 'Druid'), { ...adventurer('Hildra', 'Healer', 'Priest'),
    values: { level: '20', role: 'Adventurer, Healer', place: null, faction: null, class: 'Priest', partyRole: 'Healer' } }];
  expect(visibleListColumns(rows, kind).map((column) => column.id)).toEqual(['level', 'role', 'class', 'partyRole']);
  expect(visibleListColumns([...rows, { ...rows[0]!, facets: { role: ['enemy'] } }], kind).map((column) => column.id)).toEqual(['level', 'role']);
});

test('weapon-focused rows gain damage while other item groups and blank results do not', () => {
  const kind = { kind: 'items', columns: ['type', 'itemPower', 'damage'].map((id) => ({
    id, label: id, sortable: true, numeric: id === 'itemPower',
  })) } as Parameters<typeof visibleListColumns>[1];
  const weapon = (name: string, damage: string) => ({
    ref: { key: `items:${name}`, kind: 'items' as const, name, slug: name.toLowerCase() },
    values: { type: 'Sword', itemPower: 20, damage }, facets: { weapon: ['SWORD'] },
  });
  const sword = weapon('Iron Sword', '8–13'), greatsword = weapon('Long Sword', '20–30');
  const boots = { ...weapon('Boots', ''), values: { type: 'Boots', itemPower: 10, damage: null }, facets: { weapon: [] } };
  expect(visibleListColumns([sword, greatsword], kind).map((column) => column.id)).toEqual(['damage']);
  expect(visibleListColumns([sword, greatsword, boots], kind).map((column) => column.id)).toEqual(['type', 'itemPower']);
  expect(visibleListColumns([], kind)).toEqual([]);
});
