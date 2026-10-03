/**
 * Keeps a detail page's side column in view while the page scrolls, without a scroll area of its own, so the wheel
 * over the column always scrolls the page. A column that fits the window sticks below the window's top edge. A taller
 * column scrolls with the page until its far edge comes into view, and then sticks with that edge in view: its end
 * when scrolling down, its start when scrolling up. Page scrolling alone therefore reaches every part of it.
 *
 * The column stays `position: sticky` throughout. Only a change of scroll direction moves its sticky edge and sets a
 * top margin that holds it where it is, so the browser itself moves the column with the page between changes.
 */

/** `top`: stuck below the window's top edge, or at its place in the page. `down` and `up`: following the page. */
export type SideMode = 'top' | 'down' | 'up';

export interface SidePosition {
  mode: SideMode;
  /** The column's top margin inside its area, in pixels, which holds it in place when the sticky edge changes. */
  offset: number;
}

export interface SideMeasure {
  /** The page's scroll change since the last measure, positive while scrolling down. */
  delta: number;
  /** The window y of the column's top edge, and of its area's top edge. */
  top: number;
  areaTop: number;
  /** The heights of the column, of its area, and of the window. */
  height: number;
  areaHeight: number;
  viewport: number;
  /** The space kept between the column and the window's edges. */
  gap: number;
}

export const SIDE_AT_TOP: SidePosition = { mode: 'top', offset: 0 };

/** The column's next position for one measure. */
export function nextSidePosition(current: SidePosition, measure: SideMeasure): SidePosition {
  const { delta, top, areaTop, height, areaHeight, viewport, gap } = measure;
  if (height + 2 * gap <= viewport) return SIDE_AT_TOP;
  // The margin that keeps the column where it is now. The column never leaves its area, and the clamp keeps rounding
  // from making the area taller.
  const here = Math.max(0, Math.min(top - areaTop, areaHeight - height));
  if (delta > 0) return current.mode === 'down' ? current : { mode: 'down', offset: here };
  if (delta < 0) {
    // Scrolling up from `down` follows the page until the column's start reaches the window's top edge. A column
    // whose start is already there sticks to that edge at once, with no margin left behind for the top of the page.
    if (top >= gap - 0.5 && current.mode !== 'top') return SIDE_AT_TOP;
    return current.mode === 'down' ? { mode: 'up', offset: here } : current;
  }
  // A resize keeps the mode and refits the margin to the area.
  return current.mode === 'top' ? current : { mode: current.mode, offset: Math.min(current.offset, Math.max(0, areaHeight - height)) };
}

/** The inline styles for a position. `top` mode clears them, so the stylesheet's sticky top applies. */
export function sideStyles(position: SidePosition, height: number, viewport: number, gap: number): { marginTop: string; top: string; bottom: string } {
  if (position.mode === 'top') return { marginTop: '', top: '', bottom: '' };
  // The edge distance at which the column's far edge sits one gap inside the window. It is negative for a column
  // taller than the window.
  const edge = `${viewport - gap - height}px`;
  return position.mode === 'down'
    ? { marginTop: `${position.offset}px`, top: edge, bottom: '' }
    : { marginTop: `${position.offset}px`, top: 'auto', bottom: edge };
}

/**
 * A Svelte action for the sticky element inside the side column's area. The parameter changes on navigation, which
 * returns the column to the top position. The action does nothing while the stylesheet does not make the element
 * sticky, as on narrow screens.
 */
export function followPageScroll(node: HTMLElement, _navigation?: unknown) {
  const area = node.parentElement;
  if (!area) return {};
  let position = SIDE_AT_TOP;
  let lastY = window.scrollY;
  let frame = 0;
  // The stylesheet's sticky top before any inline style replaces it, and whether the layout makes the column sticky.
  const gap = parseFloat(getComputedStyle(node).top) || 0;
  let sticky = getComputedStyle(node).position === 'sticky';

  const apply = (next: SidePosition, height: number, viewport: number) => {
    const styles = sideStyles(next, height, viewport, gap);
    node.style.marginTop = styles.marginTop;
    node.style.top = styles.top;
    node.style.bottom = styles.bottom;
    position = next;
  };
  const update = (resized: boolean) => {
    const y = window.scrollY;
    const delta = resized ? 0 : y - lastY;
    lastY = y;
    if (resized) sticky = getComputedStyle(node).position === 'sticky';
    if (!sticky) {
      if (position !== SIDE_AT_TOP) apply(SIDE_AT_TOP, 0, 0);
      return;
    }
    const rect = node.getBoundingClientRect();
    const areaRect = area.getBoundingClientRect();
    const viewport = window.innerHeight;
    const next = nextSidePosition(position, { delta, top: rect.top, areaTop: areaRect.top, height: rect.height, areaHeight: areaRect.height, viewport, gap });
    // The insets depend on the heights, so a resize rewrites them even when the mode stays.
    if (next !== position || (resized && next.mode !== 'top')) apply(next, rect.height, viewport);
  };
  const onScroll = () => update(false);
  // Size changes arrive in bursts, so they update once per frame.
  const onResize = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(() => update(true)); };
  const observer = new ResizeObserver(onResize);
  observer.observe(node);
  observer.observe(area);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);
  return {
    update() {
      apply(SIDE_AT_TOP, 0, 0);
      lastY = window.scrollY;
      onResize();
    },
    destroy() {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    },
  };
}
