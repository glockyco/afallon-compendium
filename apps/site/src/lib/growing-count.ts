import { writable, type Readable } from 'svelte/store';

/**
 * The number of rows of a long table to build. The count starts at the rows that the server builds too, so hydration
 * finds the same rows, and then grows toward its goal by one step per task. The browser therefore paints the first rows
 * at once and adds the rest between frames, instead of stalling until every row exists. A count changes only through
 * these methods, which a component calls only in the browser.
 */
export interface GrowingCount extends Readable<number> {
  /** Grows from the current count toward `goal`, or drops to `goal` at once when it is smaller. */
  growTo(goal: number): void;
  /** Starts again from the first rows and grows toward `goal`. */
  restart(goal: number): void;
  /** Builds at least `count` rows at once, up to the goal. */
  showAtLeast(count: number): void;
  /** Stops growing, as when the table leaves the page. */
  stop(): void;
}

export function growingCount(first: number, step: number): GrowingCount {
  const count = writable(first);
  let shown = first;
  let goal = first;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const show = (next: number) => {
    shown = next;
    count.set(next);
  };
  const advance = () => {
    timer = undefined;
    show(Math.min(goal, shown + step));
    if (shown < goal) timer = setTimeout(advance, 0);
  };
  const schedule = () => {
    if (timer === undefined && shown < goal) timer = setTimeout(advance, 0);
  };
  const stop = () => {
    clearTimeout(timer);
    timer = undefined;
  };
  return {
    subscribe: count.subscribe,
    growTo(next) {
      goal = next;
      if (shown > goal) show(goal);
      schedule();
    },
    restart(next) {
      stop();
      goal = next;
      show(Math.min(first, next));
      schedule();
    },
    showAtLeast(minimum) {
      if (minimum > shown) show(Math.min(goal, minimum));
      schedule();
    },
    stop,
  };
}
