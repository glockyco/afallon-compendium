import { expect, test } from 'bun:test';
import { fitView, panBy, zoomAt } from './talent-web-view';

test('zooming keeps the point under the pointer in place and stays within the zoom limits', () => {
  const fitted = fitView(1000, 800, 600);
  expect(fitted).toEqual({ cx: 0, cy: 0, zoom: 0.3 });
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
