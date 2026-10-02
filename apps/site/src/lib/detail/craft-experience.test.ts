import { expect, test } from 'bun:test';
import type { RecipeRank } from '@afallon/contracts/public';
import { craftBandAt } from './craft-experience';

const rank: RecipeRank = { rank: 1, requiredLevel: 40, highestLevel: 300, baseExperience: 7, bands: [
  { band: 'full', from: 40, to: 59, experience: 7 }, { band: 'half', from: 60, to: 74, experience: 4 }, { band: 'none', from: 75, experience: 0 },
] };

test('a level below the required level is locked, and each band ends at its last level', () => {
  expect(craftBandAt(rank, 39)).toEqual({ kind: 'locked' });
  expect(craftBandAt(rank, 59)).toEqual({ kind: 'band', band: rank.bands[0]!, next: rank.bands[1]! });
  expect(craftBandAt(rank, 60)).toEqual({ kind: 'band', band: rank.bands[1]!, next: rank.bands[2]! });
  expect(craftBandAt(rank, 300)).toEqual({ kind: 'band', band: rank.bands[2]! });
});

test('a rank without base experience gives none at every level that can craft it', () => {
  expect(craftBandAt({ ...rank, baseExperience: 0, bands: [] }, 50)).toEqual({ kind: 'band', band: { band: 'none', from: 40, experience: 0 } });
});
