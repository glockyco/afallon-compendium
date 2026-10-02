import { expect, test } from 'bun:test';
import { fitView, LABEL_PX, labelArc, panBy, zoomAt } from './talent-web-view';

test('the fitted view leaves a line of text around the circle inside the box', () => {
  for (const [width, height] of [[740, 740], [358, 358], [900, 600]] as const) {
    const view = fitView(1500, width, height);
    expect(1500 * view.zoom + LABEL_PX * 1.3).toBeLessThanOrEqual(Math.min(width, height) / 2);
  }
});

test('every tree name reads from left to right outside the circle', () => {
  // The wedge angles and widths of the game's five-, four-, and two-tree webs.
  const wedges = [...[90, 18, -54, -126, -198].map((angle) => [angle, 52]), ...[90, 0, -90, -180].map((angle) => [angle, 70]), [90, 160], [-90, 160]] as const;
  for (const [angle, width] of wedges) {
    const [, sx, sy, , , , , , , ex, ey] = labelArc(angle, width, 1500, 0.2).split(' ').map(Number);
    // A side wedge's path is vertical, and every other path starts left of its end.
    expect(sx!).toBeLessThanOrEqual(ex!);
    expect(Math.hypot(sx!, sy!)).toBeGreaterThan(1500);
    expect(Math.hypot(ex!, ey!)).toBeGreaterThan(1500);
  }
});

test('zooming keeps the point under the pointer in place and stays within the zoom limits', () => {
  const fitted = { cx: 0, cy: 0, zoom: 0.3 };
  const zoomed = zoomAt(fitted, 2, 600, 150, 800, 600, fitted.zoom);
  // The drawing point under (600, 150) was (200 / 0.3, -150 / 0.3) and stays there at the new zoom.
  expect(zoomed.cx + (600 - 400) / zoomed.zoom).toBeCloseTo(200 / 0.3);
  expect(zoomed.cy + (150 - 300) / zoomed.zoom).toBeCloseTo(-150 / 0.3);
  expect(zoomAt(fitted, 100, 400, 300, 800, 600, fitted.zoom).zoom).toBeCloseTo(0.3 * 8);
  expect(zoomAt(fitted, 0.01, 400, 300, 800, 600, fitted.zoom).zoom).toBeCloseTo(0.3 * 0.5);
});

test('dragging moves the drawing with the pointer', () => {
  expect(panBy({ cx: 0, cy: 0, zoom: 0.5 }, 100, -50)).toEqual({ cx: -200, cy: 100, zoom: 0.5 });
});
