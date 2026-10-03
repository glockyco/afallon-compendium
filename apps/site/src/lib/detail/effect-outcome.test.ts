import { expect, test } from 'bun:test';
import { actionSummary, isNamedAppliedEffect } from './effect-outcome';

test('missing travel scenes use a plain explanation while present scenes stay singular', () => {
  expect(actionSummary({ label: 'Destination Scene' })).toBe('Its destination is not part of this version of the game.');
  expect(actionSummary({ label: 'Destination Scene', target: { key: 'scenes:10', kind: 'places', name: 'Duskfall Depths', slug: 'duskfall-depths' } }))
    .toBe('Travels to Duskfall Depths');
});

test('ability effects distinguish publication fallback names from authored names', () => {
  const effect = (key: string, name: string, chance?: number) => ({
    effect: { key: `effects:${key}`, kind: 'effects' as const, name, slug: key },
    ...(chance === undefined ? {} : { chance }),
  });
  const rows = [
    effect('teleport', 'Unnamed Teleport Effect', 30),
    effect('damage', 'Unnamed Damage Over Time Effect'),
    effect('teleport-2', 'Unnamed Teleport Effect (2)'),
    effect('bleeding', 'Bleeding', 25),
    effect('teleport-authored', 'Teleport Effect'),
  ];
  expect(rows.filter(isNamedAppliedEffect).map(({ effect, chance }) => [effect.name, chance])).toEqual([
    ['Bleeding', 25],
    ['Teleport Effect', undefined],
  ]);
});
