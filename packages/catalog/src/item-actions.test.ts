import { expect, test } from 'bun:test';
import { itemGameActions } from './item-actions';
import type { ItemGameplay } from './decoders';

test('stale canonical actions cannot silently publish without use-effect evidence', () => {
  const oldAction = { sourceIndex: 0, type: { value: 19, name: 'TriggerVisualEffect' }, chance: 100,
    nodeAction: { value: 0, name: 'RankUp' }, progressionType: { value: 0, name: 'Unlock' },
    teleportType: { value: 0, name: 'GameScene' }, amount: 0, targets: {} };
  const actions = { useTemplateFlag: false, template: null, available: true, actions: [oldAction] } as unknown as ItemGameplay['gameActions'];
  expect(() => itemGameActions('items:377', actions, '/items/377/gameplay', [], () => null, []))
    .toThrow(/Item items:377 action 0 lacks the 0\.16\.3 action mode, requirements, or visual effect capture/);
});
