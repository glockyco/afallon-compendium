import { expect, test } from 'bun:test';
import { actionSummary } from './effect-outcome';

test('missing travel scenes use a plain explanation while present scenes stay singular', () => {
  expect(actionSummary({ label: 'Destination Scene' })).toBe('Its destination is not part of this version of the game.');
  expect(actionSummary({ label: 'Destination Scene', target: { key: 'scenes:10', kind: 'places', name: 'Duskfall Depths', slug: 'duskfall-depths' } }))
    .toBe('Travels to Duskfall Depths');
});
