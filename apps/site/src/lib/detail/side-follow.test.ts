import { expect, test } from 'bun:test';
import { nextSidePosition, SIDE_AT_TOP, sideStyles, type SideMeasure, type SidePosition } from './side-follow';

// A 700 px window with a 20 px gap, and a 1000 px column in a 3000 px area: the column is taller than the window.
const measure = (overrides: Partial<SideMeasure>): SideMeasure => ({ delta: 0, top: 20, areaTop: -400, height: 1000, areaHeight: 3000, viewport: 700, gap: 20, ...overrides });

test('a column that fits the window stays below its top edge in either direction', () => {
  const following: SidePosition = { mode: 'down', offset: 300 };
  // 660 + 2 × 20 = 700 fits exactly.
  expect(nextSidePosition(following, measure({ height: 660, delta: 40 }))).toBe(SIDE_AT_TOP);
  expect(nextSidePosition(following, measure({ height: 660, delta: -40 }))).toBe(SIDE_AT_TOP);
  expect(nextSidePosition(SIDE_AT_TOP, measure({ height: 661, delta: 40 })).mode).toBe('down');
});

test('scrolling down holds a tall column where it is, so it follows the page until its end is in view', () => {
  const down = nextSidePosition(SIDE_AT_TOP, measure({ delta: 40, top: 20, areaTop: -400 }));
  expect(down).toEqual({ mode: 'down', offset: 420 });
  // Further scrolling in the same direction changes nothing.
  expect(nextSidePosition(down, measure({ delta: 40, top: -300, areaTop: -720 }))).toBe(down);
  expect(sideStyles(down, 1000, 700, 20)).toEqual({ marginTop: '420px', top: '-320px', bottom: '' });
});

test('scrolling up follows the page until the column start reaches the top edge, then sticks without a margin', () => {
  const down: SidePosition = { mode: 'down', offset: 420 };
  // The column sits with its end in view, 300 px above its start.
  const up = nextSidePosition(down, measure({ delta: -40, top: -320, areaTop: -1200 }));
  expect(up).toEqual({ mode: 'up', offset: 880 });
  expect(sideStyles(up, 1000, 700, 20)).toEqual({ marginTop: '880px', top: 'auto', bottom: '-320px' });
  expect(nextSidePosition(up, measure({ delta: -40, top: -100, areaTop: -980 }))).toBe(up);
  expect(nextSidePosition(up, measure({ delta: -40, top: 20, areaTop: -860 }))).toBe(SIDE_AT_TOP);
  expect(sideStyles(SIDE_AT_TOP, 1000, 700, 20)).toEqual({ marginTop: '', top: '', bottom: '' });
});

test('a jump back to the top of the page leaves no margin above the column', () => {
  // Home from deep in the page: the column, still held by its margin, is far below the window's top edge.
  expect(nextSidePosition({ mode: 'down', offset: 2000 }, measure({ delta: -2600, top: 2223, areaTop: 223 }))).toBe(SIDE_AT_TOP);
});

test('the margin stays inside the area, so holding the column never makes the page taller', () => {
  // At the end of the area, the column's place is its area height less its own height, even when rounding puts the
  // measured place a fraction past it.
  expect(nextSidePosition(SIDE_AT_TOP, measure({ delta: 10, top: -1399.6, areaTop: -3400, areaHeight: 3000 })).offset).toBe(2000);
  expect(nextSidePosition(SIDE_AT_TOP, measure({ delta: 10, top: 222.6, areaTop: 223 })).offset).toBe(0);
  // A shorter area after a resize pulls the margin in, and the mode stays.
  expect(nextSidePosition({ mode: 'up', offset: 2000 }, measure({ areaHeight: 2500 }))).toEqual({ mode: 'up', offset: 1500 });
});
