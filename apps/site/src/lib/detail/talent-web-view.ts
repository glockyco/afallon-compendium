// The view of a talent web: a centre and a zoom in pixels per game unit, over drawing coordinates in which y points down.
// The game's coordinates have y pointing up, so a game point (x, y) is drawn at (x, -y).

export interface WebView { cx: number; cy: number; zoom: number }

export const MIN_ZOOM_FACTOR = 0.5;
export const MAX_ZOOM_FACTOR = 8;

/** The drawing point of a game point. */
export const drawPoint = (x: number, y: number): [number, number] => [x, -y];

// Tree names follow the arc just outside the web, at a fixed size in pixels: LABEL_GAP from the circle, then a line of text.
export const LABEL_PX = 14;
const LABEL_GAP = 6;
const LABEL_BAND = LABEL_GAP + LABEL_PX * 1.3;
const BOX_PAD = 8;

/** The largest centred view in which a circle of `radius` game units and the names around it fit a box of `width` by `height` pixels. */
export function fitView(radius: number, width: number, height: number): WebView {
  return { cx: 0, cy: 0, zoom: Math.max((Math.min(width, height) / 2 - BOX_PAD - LABEL_BAND) / radius, 1e-3) };
}

/**
 * The SVG path that a wedge's name follows outside a circle of `radius` game units at zoom `zoom`. The path spans the wedge
 * and its gaps, centred on the game angle `angle`, and runs from left to right on screen, so the name reads normally. Over
 * the upper half, including the sides, the letters stand on the path, and over the lower half they hang from it, outward in
 * both cases.
 */
export function labelArc(angle: number, width: number, radius: number, zoom: number): string {
  const upper = Math.sin(angle * Math.PI / 180) > -1e-9;
  const r = radius + (LABEL_GAP + (upper ? 0 : LABEL_PX * 0.75)) / zoom;
  const half = Math.min(width + 18, 178) / 2;
  const [from, to] = upper ? [angle + half, angle - half] : [angle - half, angle + half];
  const at = (degrees: number) => drawPoint(r * Math.cos(degrees * Math.PI / 180), r * Math.sin(degrees * Math.PI / 180)).map((value) => value.toFixed(1)).join(' ');
  // Upper paths turn clockwise on screen (sweep flag 1), and lower paths turn counterclockwise.
  return `M ${at(from)} A ${r.toFixed(1)} ${r.toFixed(1)} 0 0 ${upper ? 1 : 0} ${at(to)}`;
}

/** The SVG view box of a view in a box of `width` by `height` pixels. */
export function viewBox(view: WebView, width: number, height: number): string {
  const w = width / view.zoom, h = height / view.zoom;
  return `${view.cx - w / 2} ${view.cy - h / 2} ${w} ${h}`;
}

/**
 * The view after zooming by `factor` around a box point (`px`, `py`, in pixels from the box's top left), so the drawing
 * point under it stays under it. The zoom stays between the given factors of the fitted zoom.
 */
export function zoomAt(view: WebView, factor: number, px: number, py: number, width: number, height: number, fitted: number): WebView {
  const zoom = Math.min(fitted * MAX_ZOOM_FACTOR, Math.max(fitted * MIN_ZOOM_FACTOR, view.zoom * factor));
  const x = view.cx + (px - width / 2) / view.zoom, y = view.cy + (py - height / 2) / view.zoom;
  return { zoom, cx: x - (px - width / 2) / zoom, cy: y - (py - height / 2) / zoom };
}

/** The view after dragging by `dx`, `dy` pixels. */
export const panBy = (view: WebView, dx: number, dy: number): WebView => ({ ...view, cx: view.cx - dx / view.zoom, cy: view.cy - dy / view.zoom });

/** The SVG path of a wedge from radius `inner` to `outer`, centred on the game angle `angle` and `width` degrees wide. */
export function wedgePath(angle: number, width: number, inner: number, outer: number): string {
  const at = (radius: number, degrees: number) => drawPoint(radius * Math.cos(degrees * Math.PI / 180), radius * Math.sin(degrees * Math.PI / 180)).map((value) => value.toFixed(1)).join(' ');
  const start = angle - width / 2, end = angle + width / 2, large = width > 180 ? 1 : 0;
  // Game angles turn counterclockwise, which is clockwise in drawing coordinates, so the outer arc sweeps with flag 0.
  return `M ${at(inner, start)} L ${at(outer, start)} A ${outer} ${outer} 0 ${large} 0 ${at(outer, end)} L ${at(inner, end)} A ${inner} ${inner} 0 ${large} 1 ${at(inner, start)} Z`;
}
