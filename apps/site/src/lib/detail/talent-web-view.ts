// The view of a talent web: a centre and a zoom in pixels per game unit, over drawing coordinates in which y points down.
// The game's coordinates have y pointing up, so a game point (x, y) is drawn at (x, -y).

export interface WebView { cx: number; cy: number; zoom: number }

export const MIN_ZOOM_FACTOR = 0.5;
export const MAX_ZOOM_FACTOR = 8;

/** The drawing point of a game point. */
export const drawPoint = (x: number, y: number): [number, number] => [x, -y];

/** The view that fits a square of `extent` game units around the centre into a box of `width` by `height` pixels. */
export function fitView(extent: number, width: number, height: number): WebView {
  return { cx: 0, cy: 0, zoom: Math.min(width, height) / (2 * extent) };
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
