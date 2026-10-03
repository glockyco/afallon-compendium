import { expect, test } from 'bun:test';
import { levelTicks, progressionAxis, progressionGroups, rangePosition, type ProgressionEntry } from './progression-overview';

const entry = (name: string, group: string, range: ProgressionEntry['range']): ProgressionEntry => ({
  ref: { key: `places:${name}`, kind: 'places', name, slug: name.toLowerCase() }, group, range,
});

test('known types order by earliest range, overlaps remain separate, and missing ranges have their own final group', () => {
  const entries = [entry('Stone', 'Challenge Stone', null), entry('Late', 'Dungeon', { min: 20, max: 30 }),
    entry('Early', 'Zone', { min: 1, max: 10 }), entry('Overlap', 'Zone', { min: 8, max: 25 }),
    entry('Cave', 'Dungeon', { min: 12, max: 20 }), entry('Unknown', 'Zone', null)];
  expect(progressionGroups(entries).map((group) => [group.label, group.unknown, group.entries.map((row) => row.ref.name)])).toEqual([
    ['Zone', false, ['Early', 'Overlap']], ['Dungeon', false, ['Cave', 'Late']],
    ['Level Range Unknown', true, ['Stone', 'Unknown']],
  ]);
  expect(entries[0]?.range).toBeNull();
});

test('axis positions keep inclusive single-level entries visible and overlapping ranges proportional', () => {
  expect(rangePosition({ min: 1, max: 10 }, 40)).toEqual({ left: 0, width: 25 });
  expect(rangePosition({ min: 8, max: 25 }, 40)).toEqual({ left: 17.5, width: 45 });
  expect(rangePosition({ min: 40, max: 40 }, 40)).toEqual({ left: 97.5, width: 2.5 });
  expect(progressionAxis([entry('Unknown', 'Zone', null), entry('Known', 'Zone', { min: 8, max: 25 })])).toBe(25);
  expect(progressionAxis([entry('Known', 'Zone', { min: 8, max: 25 })], 40)).toBe(40);
});

test('axis landmarks show round levels and leave an irregular endpoint to a separate max label', () => {
  expect(levelTicks(1)).toEqual([1]);
  expect(levelTicks(31)).toEqual([1, 10, 20, 30]);
  expect(levelTicks(45)).toEqual([1, 10, 20, 30, 40]);
  expect(levelTicks(60)).toEqual([1, 10, 20, 30, 40, 50, 60]);
});
