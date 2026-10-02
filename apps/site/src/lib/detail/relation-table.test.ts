import { expect, test } from 'bun:test';
import { mergeRows, omitAlways, omitWhenShared, planColumns, shownRowCount, stateInHeading, type RelationColumn } from './relation-table';

type Drop = { item: string; quantity: number; chance: number; roll?: string; requirement?: string };
const columns: RelationColumn<Drop>[] = [
  { id: 'item', label: 'Item', value: (row) => row.item },
  { id: 'quantity', label: 'Quantity', value: (row) => row.quantity, whenShared: omitWhenShared(1) },
  { id: 'chance', label: 'Chance', value: (row) => row.chance },
  { id: 'roll', label: 'Loot roll', value: (row) => row.roll, whenShared: stateInHeading },
  { id: 'requirement', label: 'Requirement', value: (row) => row.requirement },
];
const ids = (plan: { columns: RelationColumn<Drop>[] }) => plan.columns.map((column) => column.id);

test('a table omits columns without values, default columns that every row shares, and states a shared roll once', () => {
  const plan = planColumns(columns, [
    { item: 'Bone', quantity: 1, chance: 15, roll: 'at most 3 items' },
    { item: 'Skull', quantity: 1, chance: 15, roll: 'at most 3 items' },
  ]);
  expect(ids(plan)).toEqual(['item', 'chance']);
  expect(plan.shared.map((shared) => [shared.column.id, shared.value])).toEqual([['roll', 'at most 3 items']]);
});

test('a table keeps a column whose rows differ or share a value that is not the default', () => {
  const plan = planColumns(columns, [
    { item: 'Bone', quantity: 5, chance: 15, roll: 'at most 3 items', requirement: 'Night' },
    { item: 'Skull', quantity: 5, chance: 10, roll: '5% of kills, 1 item' },
  ]);
  expect(ids(plan)).toEqual(['item', 'quantity', 'chance', 'roll', 'requirement']);
  expect(plan.shared).toEqual([]);
});

test('a table with one row keeps the values that a reader compares and drops its defaults', () => {
  const plan = planColumns(columns, [{ item: 'Bone', quantity: 1, chance: 15, roll: 'at most 3 items' }]);
  expect(ids(plan)).toEqual(['item', 'chance']);
  expect(plan.shared.map((shared) => shared.column.id)).toEqual(['roll']);
});

test('a column that the page shows elsewhere leaves whatever its rows share', () => {
  const level: RelationColumn<{ level: string }> = { id: 'level', label: 'Level', value: (row) => row.level, whenShared: omitAlways };
  expect(planColumns([level], [{ level: '15–30' }, { level: '15–30' }]).columns).toEqual([]);
  expect(planColumns([level], [{ level: '15–30' }, { level: '20' }]).columns).toEqual([level]);
});

test('merging joins only rows with the same key, in first-seen order', () => {
  const rows = [{ quest: 'Cold Clutch', role: 'gives' }, { quest: 'Brood', role: 'gives' }, { quest: 'Cold Clutch', role: 'completes' }];
  const merged = mergeRows(rows, (row) => row.quest, (group) => ({ quest: group[0]!.quest, roles: group.map((row) => row.role) }));
  expect(merged).toEqual([{ quest: 'Cold Clutch', roles: ['gives', 'completes'] }, { quest: 'Brood', roles: ['gives'] }]);
});

test('a list of up to ten rows shows them all, and a longer list hides at least three behind Show more', () => {
  expect(shownRowCount(1, false)).toBe(1);
  expect([shownRowCount(9, false), shownRowCount(10, false)]).toEqual([9, 10]);
  expect(shownRowCount(11, false)).toBe(8);
  expect(shownRowCount(22, false)).toBe(8);
  expect(shownRowCount(22, true)).toBe(22);
});
