import { expect, test } from 'bun:test';
import type { LevelCurve } from '@afallon/contracts/public';
import { cumulativeExperience, journeyShares } from './level-curve';

const curve = { cap: 6, rows: [
  { level: 1, toNext: 10 }, { level: 2, toNext: 20 }, { level: 3, toNext: 30 },
  { level: 4, toNext: 40 }, { level: 5, toNext: 100 },
] } as LevelCurve;

test('earned and remaining shares follow exact published row sums including the cap', () => {
  expect(cumulativeExperience(curve)[6]).toBe(200);
  expect(journeyShares(curve, 3)).toMatchObject({ earned: .15, remaining: .85, total: 200 });
  expect(journeyShares(curve, 6)).toMatchObject({ earned: 1, remaining: 0, total: 200 });
});

test('last-ten-level share uses the actual final ten transitions, not ten percent of levels', () => {
  const long = { cap: 12, rows: Array.from({ length: 11 }, (_, index) => ({ level: index + 1, toNext: index < 2 ? 10 : 100 })) } as LevelCurve;
  expect(journeyShares(long, 2).finalTen).toBe(910 / 920);
  expect(journeyShares(long, 2).earned).toBe(10 / 920);
  expect(journeyShares({ cap: 2, rows: [{ level: 1, toNext: 0 }] } as LevelCurve, 1)).toMatchObject({ earned: 0, remaining: 0, finalTen: 0 });
});
