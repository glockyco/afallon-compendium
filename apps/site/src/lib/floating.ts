import { autoUpdate, computePosition, flip, offset, shift, size } from '@floating-ui/dom';

// Entity tooltips and explanation hints share one rule set: one floating panel at a time, a short intent delay before
// a hover opens it, and a placement beside its anchor.
let openPanel: (() => void) | null = null;

/** Opens, keeps, and closes one floating panel. `onOpen` and `onClose` update the owner's state. */
export class FloatingController {
  #intentTimer: number | undefined;
  #closeTimer: number | undefined;
  readonly #onOpen: () => void;
  readonly #onClose: () => void;

  constructor(onOpen: () => void, onClose: () => void) {
    this.#onOpen = onOpen;
    this.#onClose = onClose;
  }

  show(): void {
    clearTimeout(this.#closeTimer);
    // A link keeps focus after a click, so an older panel would otherwise stay open.
    if (openPanel && openPanel !== this.close) openPanel();
    openPanel = this.close;
    this.#onOpen();
  }

  showAfterIntent(): void {
    clearTimeout(this.#intentTimer);
    clearTimeout(this.#closeTimer);
    this.#intentTimer = window.setTimeout(() => this.show(), 160);
  }

  keepOpen(): void {
    clearTimeout(this.#closeTimer);
  }

  closeAfterIntent(): void {
    clearTimeout(this.#closeTimer);
    this.#closeTimer = window.setTimeout(this.close, 100);
  }

  readonly close = (): void => {
    clearTimeout(this.#intentTimer);
    clearTimeout(this.#closeTimer);
    if (openPanel === this.close) openPanel = null;
    this.#onClose();
  };

  /** Escape closes an open panel without leaving the anchor. */
  handleKeydown(event: KeyboardEvent, open: boolean): void {
    if (event.key !== 'Escape' || !open) return;
    event.preventDefault();
    event.stopPropagation();
    this.close();
  }

  destroy(): void {
    clearTimeout(this.#intentTimer);
    clearTimeout(this.#closeTimer);
    if (openPanel === this.close) openPanel = null;
  }
}

/**
 * Places `panel` right of `anchor`, or left when the right side lacks room, so it never covers the rows above or below
 * its anchor. Only horizontal room decides the side, and a vertical shift keeps the panel inside the viewport. The
 * position follows scrolling, resizing, and content changes until the returned function stops it.
 */
export function placeBeside(anchor: HTMLElement, panel: HTMLElement): () => void {
  let active = true;
  const stop = autoUpdate(anchor, panel, () => {
    // `size` writes a max height. Clearing it first lets `flip` measure the natural height, so a panel that grows when
    // its content loads moves to the side with room instead of scrolling.
    panel.style.maxHeight = '';
    void computePosition(anchor, panel, {
      placement: 'right-start',
      strategy: 'fixed',
      middleware: [
        offset(10),
        flip({ padding: 12, crossAxis: false, fallbackPlacements: ['left-start'] }),
        shift({ padding: 12, mainAxis: true, crossAxis: false }),
        size({
          padding: 12,
          apply({ availableHeight, elements }) {
            elements.floating.style.maxHeight = `${Math.max(0, availableHeight)}px`;
          },
        }),
      ],
    }).then(({ x, y }) => {
      if (!active) return;
      panel.style.left = `${x}px`;
      panel.style.top = `${y}px`;
      panel.style.visibility = 'visible';
    });
  });
  return () => { active = false; stop(); };
}
